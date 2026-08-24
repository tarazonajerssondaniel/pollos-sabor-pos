import React, { useState, useEffect } from 'react';
import { KitchenOrder } from '../types';
import { posAudio } from '../utils/audio';
import { ChefHat, CheckCircle2, Clock, Flame, ArrowLeft, Trash2, Filter } from 'lucide-react';

interface KitchenKdsProps {
  orders: KitchenOrder[];
  onBackToTables: () => void;
  onUpdateStatus: (orderId: string, status: 'pendiente' | 'preparando' | 'listo' | 'entregado') => void;
  onDeleteOrder: (orderId: string) => void;
}

export const KitchenKds: React.FC<KitchenKdsProps> = ({
  orders,
  onBackToTables,
  onUpdateStatus,
  onDeleteOrder,
}) => {
  const [filterArea, setFilterArea] = useState<string>('todos');
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);

  const activeOrders = orders.filter((o) => o.status !== 'entregado');
  const completedOrders = orders.filter((o) => o.status === 'entregado');

  const getElapsedMinutes = (timestamp: number) => {
    return Math.floor((currentTime - timestamp) / 60000);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-white select-none overflow-hidden">
      {/* Header */}
      <header className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToTables}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition"
          >
            <ArrowLeft size={16} /> Volver a Mesas
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center text-white">
              <ChefHat size={20} />
            </div>
            <div>
              <h1 className="text-base font-black uppercase text-orange-500 leading-tight">
                PANTALLA DE COCINA & COMANDAS
              </h1>
              <span className="text-[10px] text-slate-400 font-bold">
                {activeOrders.length} {activeOrders.length === 1 ? 'comanda activa' : 'comandas activas'}
              </span>
            </div>
          </div>
        </div>

        {/* Filter Area Tabs */}
        <div className="flex gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
          {['todos', 'parrilla', 'cocina', 'freidora', 'bebidas'].map((area) => (
            <button
              key={area}
              onClick={() => setFilterArea(area)}
              className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition ${
                filterArea === area
                  ? 'bg-orange-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {area}
            </button>
          ))}
        </div>
      </header>

      {/* Orders Grid */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950">
        {activeOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 py-16">
            <CheckCircle2 size={64} className="text-emerald-500/50 mb-3" />
            <h2 className="text-xl font-bold text-slate-300">¡Cocina al Día!</h2>
            <p className="text-xs text-slate-500 mt-1">
              No hay comandas pendientes por preparar.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {activeOrders.map((order) => {
              const elapsed = getElapsedMinutes(order.createdAt);
              const isUrgent = elapsed >= 18;
              const isWarning = elapsed >= 10 && !isUrgent;

              // Filter items if area selected
              const displayItems =
                filterArea === 'todos'
                  ? order.items
                  : order.items.filter((it) => it.area === filterArea || (!it.area && filterArea === 'cocina'));

              if (displayItems.length === 0) return null;

              return (
                <div
                  key={order.id}
                  className={`rounded-2xl border-2 overflow-hidden flex flex-col transition shadow-xl ${
                    order.status === 'listo'
                      ? 'bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/30'
                      : isUrgent
                      ? 'bg-red-950/40 border-red-500 ring-2 ring-red-500/40 animate-pulse'
                      : isWarning
                      ? 'bg-amber-950/30 border-amber-500'
                      : 'bg-slate-900 border-slate-700'
                  }`}
                >
                  {/* Card Header */}
                  <div
                    className={`p-3 flex items-center justify-between border-b ${
                      order.status === 'listo'
                        ? 'bg-emerald-900/60 border-emerald-700'
                        : order.isAddition
                        ? 'bg-amber-950/90 border-amber-600'
                        : isUrgent
                        ? 'bg-red-900/80 border-red-700'
                        : isWarning
                        ? 'bg-amber-900/60 border-amber-700'
                        : 'bg-slate-800 border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="text-lg font-black tracking-tight text-white flex items-center gap-1.5 flex-wrap">
                        <span>{order.tableLabel}</span>
                        <span className="text-xs font-normal opacity-75">
                          (#{order.orderNumber})
                        </span>
                        {order.isAddition && (
                          <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider animate-bounce shadow-md">
                            ⚡ ADICIÓN #{order.additionRound || 2}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-300 font-medium">
                        Mesero: {order.waiterName}
                        {order.customerName ? ` • ${order.customerName}` : ''}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-lg text-xs font-mono font-bold shrink-0">
                      <Clock size={12} className={isUrgent ? 'text-red-400' : 'text-slate-300'} />
                      <span className={isUrgent ? 'text-red-300 font-black' : 'text-slate-200'}>
                        {elapsed} min
                      </span>
                    </div>
                  </div>

                  {/* Addition Warning Banner */}
                  {order.isAddition && (
                    <div className="bg-amber-500/15 border-b border-amber-500/40 px-3 py-1.5 text-[11px] font-extrabold text-amber-300 flex items-center gap-1.5">
                      <span>⚡ ADICIÓN:</span>
                      <span className="font-semibold text-slate-200">
                        Preparar únicamente los {displayItems.reduce((s, it) => s + it.quantity, 0)} productos listados a continuación para esta mesa.
                      </span>
                    </div>
                  )}

                  {/* Items List */}
                  <div className="p-3 space-y-2 flex-1 overflow-y-auto max-h-64 divide-y divide-slate-800">
                    {displayItems.map((item, idx) => (
                      <div key={idx} className="pt-2 first:pt-0">
                        <div className="flex items-start justify-between font-bold text-sm text-slate-100">
                          <span className="text-orange-400 font-black text-base w-7">
                            {item.quantity}x
                          </span>
                          <span className="flex-1 text-slate-100">{item.name}</span>
                        </div>

                        {item.term && (
                          <div className="text-xs text-amber-400 font-bold ml-7">
                            🥩 Término: {item.term}
                          </div>
                        )}

                        {item.isCombo && (
                          <div className="text-[11px] text-blue-300 font-semibold ml-7">
                            🍟 Con Combo (Francesa + Bebida)
                          </div>
                        )}

                        {item.note && (
                          <div className="text-xs bg-red-950/60 border border-red-800 text-red-300 p-1 rounded-lg ml-7 font-bold mt-1">
                            ⚠️ NOTA: {item.note}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Card Actions */}
                  <div className="p-2.5 bg-slate-900/90 border-t border-slate-800 flex gap-2">
                    {order.status === 'pendiente' && (
                      <button
                        onClick={() => {
                          posAudio.playClick();
                          onUpdateStatus(order.id, 'preparando');
                        }}
                        className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition"
                      >
                        Iniciar Preparación 🔥
                      </button>
                    )}

                    {order.status === 'preparando' && (
                      <button
                        onClick={() => {
                          posAudio.playKitchenSend();
                          onUpdateStatus(order.id, 'listo');
                        }}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-1 shadow-lg transition"
                      >
                        <CheckCircle2 size={16} /> ¡Listo para Servir!
                      </button>
                    )}

                    {order.status === 'listo' && (
                      <button
                        onClick={() => {
                          posAudio.playClick();
                          onUpdateStatus(order.id, 'entregado');
                        }}
                        className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition"
                      >
                        Servido / Despachado ✔️
                      </button>
                    )}

                    <button
                      onClick={() => onDeleteOrder(order.id)}
                      className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-xl transition"
                      title="Eliminar comanda"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};
