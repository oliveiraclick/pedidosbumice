import { useState, useEffect } from 'react';
import { VoiceInput } from './components/VoiceInput';
import { useVoiceRecognition } from './hooks/useVoiceRecognition';
import { parseOrderText, type ParsedOrder } from './utils/orderParser';
import { FactoryDashboard } from './components/FactoryDashboard';
import { ShoppingBag, Trash2, CheckCircle, Package, LayoutDashboard, Mic, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';
import { orderService, type Order } from './services/orderService';

function App() {
  const { isListening, transcript, startListening, stopListening, resetTranscript } = useVoiceRecognition();

  const [orders, setOrders] = useState<Order[]>([]); // Use Order type which includes ID
  const [currentParsedOrder, setCurrentParsedOrder] = useState<ParsedOrder | null>(null);

  // 'order' = Voice Input Screen, 'factory' = Dashboard Screen
  const [currentView, setCurrentView] = useState<'order' | 'factory'>('order');

  // Load initial orders and subscribe to real-time updates
  useEffect(() => {
    // 1. Fetch initial history
    orderService.getRecentOrders().then(remoteOrders => {
      setOrders(remoteOrders);
    });

    // 2. Subscribe to new orders
    const subscription = orderService.subscribeToOrders((payload) => {
      // payload.new contains the new record
      const newOrder = payload.new as Order;
      setOrders(prev => [newOrder, ...prev]);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Effect: When transcript changes, parse it
  useEffect(() => {
    if (transcript) {
      const parsed = parseOrderText(transcript);
      setCurrentParsedOrder(parsed);
    } else {
      setCurrentParsedOrder(null);
    }
  }, [transcript]);

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      startListening();
    }
  };

  const handleConfirmOrder = async () => {
    if (!currentParsedOrder) return;

    // Optimistic update (optional) or just wait for real-time
    // For now, let's wait for real-time to avoid duplication, or separate concerns.
    // Actually, good UX is usually optimistic or waiting.
    // Let's fire and forget, the subscription will update the UI

    try {
      await orderService.addOrder(currentParsedOrder);
      // Success feedback could be here
    } catch (error) {
      console.error("Failed to save order", error);
      alert("Erro ao salvar pedido. Verifique a conexão.");
    }

    resetTranscript();
    setCurrentParsedOrder(null);
  };

  // Safe header area padding for mobile statuses
  return (
    <div className="min-h-screen pb-20 selection:bg-cyan-500 selection:text-white">

      {/* Premium Gradient Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-panel border-b-0 rounded-b-2xl mx-2 mt-2">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <span className="text-lg">🧊</span>
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-white leading-none">Bumn Ice</h1>
              <span className="text-[10px] uppercase tracking-widest text-cyan-300 font-semibold opacity-80">System 2.0</span>
            </div>
          </div>

          <div className="flex bg-slate-800/50 backdrop-blur rounded-xl p-1 border border-white/5">
            <button
              onClick={() => setCurrentView('order')}
              className={clsx(
                "p-2 rounded-lg transition-all duration-300",
                currentView === 'order'
                  ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/25"
                  : "text-slate-400 hover:text-white"
              )}
            >
              <Mic size={18} />
            </button>
            <button
              onClick={() => setCurrentView('factory')}
              className={clsx(
                "p-2 rounded-lg transition-all duration-300",
                currentView === 'factory'
                  ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/25"
                  : "text-slate-400 hover:text-white"
              )}
            >
              <LayoutDashboard size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-24 space-y-8">

        {currentView === 'order' ? (
          <>
            {/* HERO SECTION */}
            <section className="flex flex-col items-center justify-center py-4 space-y-8 relative">
              {/* Background Glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="text-center space-y-1 z-10">
                <h2 className="text-3xl font-black text-white tracking-tight">Novo Pedido</h2>
                <p className="text-cyan-200/60 font-medium">Toque para gravar</p>
              </div>

              <div className="scale-110 z-10">
                <VoiceInput isListening={isListening} onClick={handleMicClick} />
              </div>

              {/* Live Transcript Card */}
              <div className={clsx(
                "w-full transition-all duration-500 ease-out transform",
                (isListening || currentParsedOrder) ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 pointer-events-none absolute bottom-0"
              )}>
                {(isListening || currentParsedOrder) && (
                  <div className="glass-panel rounded-2xl p-1 overflow-hidden">
                    <div className="bg-slate-900/50 rounded-xl p-4 border border-white/5">
                      <p className="text-lg font-medium text-cyan-50 leading-relaxed text-center">
                        "{transcript || " Ouvindo..."}"
                      </p>
                    </div>

                    {currentParsedOrder && (
                      <div className="p-4 space-y-4 animate-in fade-in slide-in-from-bottom-2">
                        {/* Data Display */}
                        <div className="grid grid-cols-5 gap-3">
                          <div className="col-span-3 bg-cyan-500/10 rounded-xl p-3 border border-cyan-500/20 flex flex-col justify-center relative overflow-hidden group">
                            <div className="absolute right-0 top-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                              <Package size={40} />
                            </div>
                            <span className="text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">Produto</span>
                            <div className="flex items-baseline gap-2">
                              <span className="text-3xl font-black text-white">{currentParsedOrder.quantity}</span>
                              <span className="text-sm font-bold text-cyan-100 leading-tight">
                                {currentParsedOrder.product.split(' ').map((word, i) => (
                                  <span key={i} className="block">{word}</span>
                                ))}
                              </span>
                            </div>
                          </div>

                          <div className="col-span-2 bg-slate-700/30 rounded-xl p-3 border border-white/5 flex flex-col justify-center">
                            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Cliente</span>
                            <span className="text-lg font-bold text-white leading-tight line-clamp-2">
                              {currentParsedOrder.customer}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        {!isListening && (
                          <div className="flex gap-3 pt-2">
                            <button
                              onClick={handleConfirmOrder}
                              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold py-4 px-4 rounded-xl shadow-lg shadow-green-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all w-full group"
                            >
                              <CheckCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                              <span>Confirmar</span>
                            </button>
                            <button
                              onClick={resetTranscript}
                              className="flex-none bg-slate-700/50 hover:bg-slate-700/80 text-slate-300 p-4 rounded-xl border border-white/5 active:scale-95 transition-all"
                            >
                              <Trash2 className="w-6 h-6" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* Recent Orders List */}
            <section className="space-y-4 pb-10">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <ShoppingBag size={14} className="text-cyan-500" /> Recentes
                </h2>
                <span className="text-xs text-slate-600 bg-slate-800/50 px-2 py-1 rounded-full">{orders.length} hoje</span>
              </div>

              <div className="space-y-3">
                {orders.length === 0 ? (
                  <div className="text-center py-12 rounded-2xl border border-dashed border-slate-700/50 bg-slate-800/20">
                    <Sparkles className="w-8 h-8 mx-auto text-slate-600 mb-3 opacity-50" />
                    <p className="text-slate-500 text-sm">Pronto para começar o dia</p>
                  </div>
                ) : (
                  orders.slice(0, 3).map((order, idx) => (
                    <div key={idx} className="glass-card rounded-xl p-4 flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-white/5 text-cyan-400 font-bold text-sm">
                          {order.quantity}x
                        </div>
                        <div>
                          <div className="font-bold text-slate-200">{order.product}</div>
                          <div className="text-xs text-slate-400 font-medium">{order.customer}</div>
                        </div>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <CheckCircle size={16} className="text-emerald-500" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </>
        ) : (
          /* --- FACTORY VIEW --- */
          <FactoryDashboard orders={orders} />
        )}

      </main>
    </div >
  );
}

export default App;
