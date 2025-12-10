import React, { useMemo } from 'react';
import { type Order, orderService } from '../services/orderService';
import { Truck, CheckCircle, MapPin } from 'lucide-react';

interface DeliveryDashboardProps {
    orders: Order[];
}

export const DeliveryDashboard: React.FC<DeliveryDashboardProps> = ({ orders }) => {

    // 1. Filter only COMPLETED orders (Ready for delivery)
    const readyOrders = useMemo(() => orders.filter(o => o.status === 'completed'), [orders]);

    // 2. Group by Customer
    const customerBundles = useMemo(() => {
        const groups: Record<string, {
            customer: string,
            ids: string[],
            items: Record<string, number>,
            readyTime: string
        }> = {};

        // Oldest first to determine "Ready Time"
        [...readyOrders].reverse().forEach(order => {
            const cust = order.customer;
            if (!groups[cust]) {
                groups[cust] = {
                    customer: cust,
                    ids: [],
                    items: {},
                    readyTime: order.created_at
                };
            }
            groups[cust].ids.push(order.id);
            groups[cust].items[order.product] = (groups[cust].items[order.product] || 0) + order.quantity;
        });

        // Show newest bundles at top
        return Object.values(groups).reverse();
    }, [readyOrders]);

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
                <div className="text-xs font-medium text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-white/5">
                    {customerBundles.length} entregas
                </div>
            </div>

            {/* List of Bundles */}
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
                                        Pronto há: {new Date(bundle.readyTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
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
        </div>
    );
};
