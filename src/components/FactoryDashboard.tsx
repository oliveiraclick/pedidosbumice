import React, { useMemo } from 'react';
import { type Order } from '../services/orderService';
import { Package, Clock } from 'lucide-react';

interface FactoryDashboardProps {
    orders: Order[];
}

export const FactoryDashboard: React.FC<FactoryDashboardProps> = ({ orders }) => {
    // Aggregate totals by product
    const totals = useMemo(() => {
        const acc: Record<string, number> = {};
        orders.forEach(order => {
            acc[order.product] = (acc[order.product] || 0) + order.quantity;
        });
        return acc;
    }, [orders]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">

            {/* 1. Production Totals (The Scoreboard) */}
            <section>
                <h2 className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Package size={14} /> Resumo de Produção
                </h2>

                {Object.keys(totals).length === 0 ? (
                    <div className="text-center py-12 bg-slate-800/50 rounded-2xl border border-dashed border-slate-700">
                        <p className="text-slate-500">Aguardando pedidos...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        {Object.entries(totals).map(([product, total]) => (
                            <div key={product} className="glass-panel p-5 rounded-2xl relative overflow-hidden group hover:bg-slate-800/80 transition-colors">
                                {/* Glow Effect */}
                                <div className="absolute -right-4 -top-4 w-20 h-20 bg-cyan-500/20 blur-2xl rounded-full group-hover:bg-cyan-400/30 transition-colors" />

                                <div className="z-10 relative">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Total</span>
                                    <h3 className="text-sm font-bold text-cyan-100 leading-tight mb-2 h-10 flex items-start">{product}</h3>
                                    <div className="text-5xl font-black text-white tracking-tight drop-shadow-xl shadow-cyan-500/50">
                                        {total}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* 2. Detailed Extract */}
            <section>
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Clock size={14} /> Fila de Pedidos
                </h2>

                <div className="glass-panel rounded-2xl overflow-hidden">
                    {orders.length === 0 ? (
                        <div className="p-6 text-center text-sm text-slate-500">Lista vazia</div>
                    ) : (
                        orders.map((order) => (
                            <div key={order.id} className="p-4 flex items-center justify-between border-b border-white/5 hover:bg-white/5 transition-colors last:border-0">
                                <div className="flex items-center gap-4">
                                    <div className="font-mono text-cyan-400 font-bold text-xl w-8 text-center">{order.quantity}</div>
                                    <div>
                                        <div className="font-bold text-slate-200">{order.product}</div>
                                        <div className="text-xs text-slate-400 font-medium uppercase tracking-wide">
                                            <span className="text-slate-600">Para:</span> {order.customer}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono bg-slate-900/50 px-2 py-1 rounded">
                                    {new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>
        </div>
    );
};
