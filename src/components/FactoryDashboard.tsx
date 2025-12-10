import React, { useMemo } from 'react';
import { type Order, orderService } from '../services/orderService'; // Import service
import { Package, Clock, CheckCircle2 } from 'lucide-react'; // Added CheckCircle2

interface FactoryDashboardProps {
    orders: Order[];
}

export const FactoryDashboard: React.FC<FactoryDashboardProps> = ({ orders }) => {

    // 1. Filter only PENDING orders for the dashboard
    const pendingOrders = useMemo(() => orders.filter(o => o.status === 'pending'), [orders]);

    // 2. Aggregate totals by product (using pending orders)
    const productionTotals = useMemo(() => {
        const totals: Record<string, number> = {};
        pendingOrders.forEach(order => {
            totals[order.product] = (totals[order.product] || 0) + order.quantity;
        });
        return totals;
    }, [pendingOrders]);

    // 3. Group by Customer (List all items for the same customer together)
    const customerGroups = useMemo(() => {
        const groups: Record<string, {
            customer: string,
            created_at: string,
            items: Record<string, number>
        }> = {};

        // Process oldest first to keep oldest timestamp as the group start time
        const sortedPending = [...pendingOrders].reverse();

        sortedPending.forEach(order => {
            const cust = order.customer;
            if (!groups[cust]) {
                groups[cust] = {
                    customer: cust,
                    created_at: order.created_at,
                    items: {}
                };
            }
            // Aggregate quantity per product for this customer
            groups[cust].items[order.product] = (groups[cust].items[order.product] || 0) + order.quantity;
        });

        // Show newest customers (or most recently updated) at the top?
        // Or Oldest? Let's keep consistent with "New orders arrive at top" visual.
        return Object.values(groups).reverse();
    }, [pendingOrders]);

    const handleCompleteBatch = async (product: string) => {
        if (confirm(`Confirmar que TODOS os ${product} foram produzidos?`)) {
            try {
                await orderService.markProductBatchAsCompleted(product);
            } catch (err) {
                alert('Erro ao atualizar status.');
            }
        }
    };

    return (
        <div className="space-y-6 pb-24 animate-in fade-in zoom-in-95 duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <Package className="text-cyan-400" />
                    Produção
                </h2>
                <div className="text-xs font-medium text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-white/5">
                    {pendingOrders.length} pendentes
                </div>
            </div>

            {/* Production Totals Cards (Aggregated) */}
            <div className="grid grid-cols-2 gap-4">
                {Object.entries(productionTotals).map(([product, total]) => (
                    <div key={product} className="glass-card p-4 rounded-2xl relative group overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative z-10">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{product}</div>
                            <div className="text-4xl font-black text-white mb-2">{total}</div>

                            <button
                                onClick={() => handleCompleteBatch(product)}
                                className="w-full mt-2 bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white text-xs font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all border border-white/5"
                            >
                                <CheckCircle2 size={14} />
                                <span>Concluir</span>
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Order Queue (Grouped by Customer) */}
            <section className="space-y-4">
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Clock size={14} className="text-cyan-500" /> Fila de Pedidos
                </h2>

                <div className="glass-panel rounded-2xl overflow-hidden space-y-px bg-slate-800/50">
                    {customerGroups.length === 0 ? (
                        <div className="p-6 text-center text-sm text-slate-500">Tudo limpo! 🎉</div>
                    ) : (
                        customerGroups.map((group) => (
                            <div key={`${group.customer}-${group.created_at}`} className="p-4 bg-slate-900/40 hover:bg-slate-800/60 transition-colors flex items-start justify-between">
                                <div className="space-y-3 w-full">
                                    {/* Customer Header */}
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-white/10 text-cyan-400 font-bold text-xs">
                                            {group.customer.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-200 leading-none">{group.customer}</div>
                                            <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                                                <Clock size={10} />
                                                {new Date(group.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Items List */}
                                    <div className="pl-11 space-y-2">
                                        {Object.entries(group.items).map(([product, quantity]) => (
                                            <div key={product} className="flex items-center gap-3 text-sm">
                                                <div className="font-mono text-cyan-400 font-bold w-6 text-right">{quantity}x</div>
                                                <div className="text-slate-300 font-medium">{product}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>
        </div>
    );
};
