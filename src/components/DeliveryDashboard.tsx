import React, { useMemo } from 'react';
import { type Order, orderService } from '../services/orderService';
import { Truck, CheckCircle, MapPin } from 'lucide-react';

interface DeliveryDashboardProps {
    orders: Order[];
}

export const DeliveryDashboard: React.FC<DeliveryDashboardProps> = ({ orders }) => {
    const [activeTab, setActiveTab] = React.useState<'pending' | 'history'>('pending');

    // 1. Filter orders based on active tab
    const filteredOrders = useMemo(() => {
        if (activeTab === 'pending') {
            return orders.filter(o => o.status === 'completed');
        } else {
            return orders.filter(o => o.status === 'delivered');
        }
    }, [orders, activeTab]);

    // 2. Group by Customer (Enhanced for both views)
    const customerBundles = useMemo(() => {
        const groups: Record<string, {
            customer: string,
            ids: string[],
            items: Record<string, number>,
            timestamp: string
        }> = {};

        // Oldest first to determine "Ready Time" or "Delivered Time"
        [...filteredOrders].reverse().forEach(order => {
            // For history, maybe we want to group distinct deliveries? 
            // For now, grouping by customer tends to merge everything they ever bought if we stick to this simple logic.
            // A better approach for history is to list individual "Completion Events" or just list orders.
            // Let's stick to the requested "list instead of card" for history, maybe just a flat list of items or small groups.

            // To keep it simple and effective:
            // For PENDING: Group all 'completed' items for a customer (one big bundle to deliver).
            // For HISTORY: We might want to see individual delivery events. 
            // But since we don't track "Delivery Batch ID", everything delivered looks the same.
            // Let's group by "Minute" or just show a nice chronological list of delivered items?
            // The user asked for "Lista no lugar de card".

            // Let's stick to Customer grouping for consistency, but maybe History shows a flat list of interactions?

            // Actually, if I delivered 10 mins ago and 1 hour ago, they will merge if I just use Customer name.
            // Let's try to keep the previous grouping logic for PENDING, but for HISTORY, let's just reverse list the orders?
            // Or Keep the same logic?

            // Let's stick to the same logic for simplicity first, but user said "Lista".

            const cust = order.customer;
            if (!groups[cust]) {
                groups[cust] = {
                    customer: cust,
                    ids: [],
                    items: {},
                    timestamp: order.created_at // ready_at or delivered_at (we don't have separate delivered_at col usually, assuming created_at or updated_at?)
                    // If we use 'created_at', that's order time.
                };
            }
            groups[cust].ids.push(order.id);
            groups[cust].items[order.product] = (groups[cust].items[order.product] || 0) + order.quantity;
        });

        // Show newest bundles at top
        return Object.values(groups).reverse();
    }, [filteredOrders, activeTab]);

    // DIFFERENT APPROACH FOR HISTORY: FLAT LIST
    // If History tab, let's just show a chronological list of recent deliveries.
    const historyList = useMemo(() => {
        if (activeTab !== 'history') return [];
        return [...filteredOrders].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }, [filteredOrders, activeTab]);


    const handleDeliverBundle = async (customer: string, ids: string[]) => {
        if (confirm(`Confirmar entrega para ${customer}?`)) {
            try {
                await orderService.markOrdersAsDelivered(ids);
            } catch (err) {
                alert('Erro ao confirmar entrega.');
            }
        }
    };

    return (
        <div className="space-y-6 pb-24 animate-in fade-in slide-in-from-right-8 duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <Truck className="text-emerald-400" />
                    Expedição
                </h2>

                {/* Tabs */}
                <div className="flex bg-slate-800/50 p-1 rounded-xl border border-white/5">
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${activeTab === 'pending' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        Pendentes
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${activeTab === 'history' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        Realizadas
                    </button>
                </div>
            </div>

            {/* List View Switch */}
            {activeTab === 'pending' ? (
                /* --- PENDING BUNDLES (Cards) --- */
                <div className="space-y-4">
                    {customerBundles.length === 0 ? (
                        <div className="text-center py-12 bg-slate-800/20 rounded-2xl border border-dashed border-slate-700/50">
                            <Truck className="w-12 h-12 mx-auto text-slate-700 mb-3 opacity-50" />
                            <p className="text-slate-500 text-sm">Nenhuma entrega pendente</p>
                        </div>
                    ) : (
                        customerBundles.map((bundle) => (
                            <div key={bundle.customer} className="glass-card p-0 rounded-2xl overflow-hidden group">
                                <div className="bg-slate-800/50 p-4 flex items-start justify-between border-b border-white/5">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="bg-emerald-500/10 text-emerald-400 p-1 rounded-md">
                                                <MapPin size={14} />
                                            </div>
                                            <h3 className="font-bold text-lg text-white">{bundle.customer}</h3>
                                        </div>
                                        <div className="text-xs text-slate-500 pl-8">
                                            Pedido: {new Date(bundle.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDeliverBundle(bundle.customer, bundle.ids)}
                                        className="bg-emerald-500 hover:bg-emerald-400 text-white p-3 rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                                    >
                                        <CheckCircle size={20} />
                                    </button>
                                </div>

                                <div className="p-4 bg-slate-900/40">
                                    <div className="space-y-2">
                                        {Object.entries(bundle.items).map(([product, qty]) => (
                                            <div key={product} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2 text-sm">
                                                <span className="text-slate-300">{product}</span>
                                                <span className="font-mono font-bold text-emerald-400">{qty}x</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            ) : (
                /* --- HISTORY LIST (Compact) --- */
                <div className="glass-panel rounded-2xl overflow-hidden bg-slate-800/20">
                    {historyList.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 text-sm">Nenhum histórico recente.</div>
                    ) : (
                        historyList.map((order) => (
                            <div key={order.id} className="p-3 border-b border-white/5 flex items-center justify-between hover:bg-white/5 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-slate-600" />
                                    <div>
                                        <div className="text-sm font-bold text-slate-300">{order.customer}</div>
                                        <div className="text-[10px] text-slate-500">
                                            {order.quantity}x {order.product}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-[10px] font-mono text-slate-600">
                                    {new Date(order.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                    {' '}
                                    {new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};
