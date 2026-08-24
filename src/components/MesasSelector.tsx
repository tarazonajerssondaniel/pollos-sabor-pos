import React, { useState } from 'react';
import { ActiveTable, KitchenOrder } from '../types';
import { formatCOP } from '../data/menu';
import { posAudio } from '../utils/audio';
import {
  Flame,
  ChefHat,
  Receipt,
  Volume2,
  VolumeX,
  Plus,
  Search,
  Clock,
  Bike,
  Utensils,
  Layers,
} from 'lucide-react';

interface MesasSelectorProps {
  tables: ActiveTable[];
  kitchenOrders: KitchenOrder[];
  waiterName: string;
  onChangeWaiterName: (name: string) => void;
  onSelectTable: (tableId: string) => void;
  onOpenKitchen: () => void;
  onOpenSalesHistory: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const MesasSelector: React.FC<MesasSelectorProps> = ({
  tables,
  kitchenOrders,
  waiterName,
  onChangeWaiterName,
  onSelectTable,
  onOpenKitchen,
  onOpenSalesHistory,
  soundEnabled,
  onToggleSound,
}) => {
  const [filter, setFilter] = useState<'todas' | 'ocupadas' | 'en-caja' | 'libres'>('todas');
  const [searchQuery, setSearchQuery] = useState('');

  const activeKitchenCount = kitchenOrders.filter(
    (o) => o.status === 'pendiente' || o.status === 'preparando'
  ).length;

  const totalOcupadas = tables.filter((t) => t.items.length > 0).length;
  const totalEnCaja = tables.filter((t) => t.status === 'cuenta' && t.items.length > 0).length;
  const totalLibres = tables.length - totalOcupadas;
  const totalEnMesa = tables.reduce(
    (sum, t) =>
      sum + t.items.reduce((s, it) => s + it.price * it.quantity, 0),
    0
  );

  const filteredTables = tables.filter((table) => {
    const hasItems = table.items.length > 0;
    if (filter === 'ocupadas' && !hasItems) return false;
    if (filter === 'en-caja' && (table.status !== 'cuenta' || !hasItems)) return false;
    if (filter === 'libres' && hasItems) return false;
    if (
      searchQuery &&
      !table.label.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const handleTableClick = (tableId: string) => {
    posAudio.playClick();
    onSelectTable(tableId);
  };

  return (
    <div
      id="pantalla-mesas"
      className="flex flex-col h-full bg-[#0f172a] text-white select-none overflow-hidden"
    >
      {/* Top Header Bar */}
      <header className="px-4 py-3 bg-[#0b1120] border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-950/50">
            <Flame size={22} className="animate-pulse" />
          </div>
          <div>
            <div className="text-xl font-black italic tracking-tighter text-orange-500 uppercase leading-none">
              POLLOS & SABOR
            </div>
            <div className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">
              SISTEMA POS PROFESIONAL
            </div>
          </div>
        </div>

        {/* Action buttons & info */}
        <div className="flex items-center gap-2">
          {/* Waiter Switcher */}
          <div className="bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-700/80 flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase">
              Mesero:
            </span>
            <input
              type="text"
              value={waiterName}
              onChange={(e) => onChangeWaiterName(e.target.value)}
              className="bg-transparent text-xs font-bold text-white w-20 focus:outline-hidden focus:ring-1 focus:ring-orange-500 rounded px-1"
            />
          </div>

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            title="Activar/Desactivar Sonido"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>

          {/* Cocina KDS Button */}
          <button
            onClick={() => {
              posAudio.playClick();
              onOpenKitchen();
            }}
            className="relative px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-orange-400 font-bold text-xs flex items-center gap-1.5 border border-slate-700 transition"
          >
            <ChefHat size={16} />
            <span className="hidden sm:inline">Cocina</span>
            {activeKitchenCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-orange-600 text-white text-[10px] font-black animate-bounce">
                {activeKitchenCount}
              </span>
            )}
          </button>

          {/* Ventas / Caja Button */}
          <button
            onClick={() => {
              posAudio.playClick();
              onOpenSalesHistory();
            }}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
          >
            <Receipt size={16} />
            <span className="hidden sm:inline">Caja Principal</span>
            {totalEnCaja > 0 ? (
              <span className="px-1.5 py-0.5 rounded-full bg-cyan-500 text-slate-950 text-[10px] font-black animate-pulse">
                {totalEnCaja} en caja
              </span>
            ) : totalOcupadas > 0 ? (
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-700 text-white text-[10px] font-bold">
                {totalOcupadas}
              </span>
            ) : null}
          </button>
        </div>
      </header>

      {/* Main Tables Grid Container */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-5xl mx-auto w-full flex flex-col items-center">
        {/* Branding header centered */}
        <div className="text-center my-2">
          <h1 className="text-3xl sm:text-4xl font-black italic tracking-tighter text-orange-500 uppercase">
            POLLOS & SABOR
          </h1>
          <p className="text-slate-400 font-bold tracking-[0.25em] text-[11px] mt-0.5">
            SISTEMA POS PROFESIONAL
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 my-4 w-full max-w-2xl justify-between flex-wrap">
          <div className="flex gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800 flex-wrap">
            <button
              onClick={() => setFilter('todas')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                filter === 'todas'
                  ? 'bg-orange-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Todas ({tables.length})
            </button>
            <button
              onClick={() => setFilter('ocupadas')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                filter === 'ocupadas'
                  ? 'bg-orange-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-orange-400 inline-block"></span>
              Ocupadas ({totalOcupadas})
            </button>
            {totalEnCaja > 0 && (
              <button
                onClick={() => setFilter('en-caja')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                  filter === 'en-caja'
                    ? 'bg-cyan-600 text-white'
                    : 'text-cyan-400 hover:text-white bg-cyan-950/60 border border-cyan-800/40'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block animate-ping"></span>
                En Caja ({totalEnCaja})
              </button>
            )}
            <button
              onClick={() => setFilter('libres')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                filter === 'libres'
                  ? 'bg-orange-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Libres ({totalLibres})
            </button>
          </div>

          <div className="text-xs text-slate-400 font-medium">
            Total en curso:{' '}
            <span className="text-orange-400 font-black">
              {formatCOP(totalEnMesa)}
            </span>
          </div>
        </div>

        {/* Tables Grid matching user layout */}
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3 w-full max-w-3xl pb-24">
          {filteredTables.map((table) => {
            const hasItems = table.items.length > 0;
            const itemCount = table.items.reduce(
              (sum, it) => sum + it.quantity,
              0
            );
            const tableTotal = table.items.reduce(
              (sum, it) => sum + it.price * it.quantity,
              0
            );
            const isSpecial = table.type === 'barra' || table.type === 'domicilio';
            const isEnCuenta = table.status === 'cuenta';

            let borderStyle = 'border-[#334155]';
            let bgStyle = 'bg-[#1e293b] hover:bg-[#27354a]';
            let textColor = 'text-white';
            let colSpan = isSpecial ? 'col-span-2 sm:col-span-2' : '';

            if (table.type === 'barra') {
              borderStyle = 'border-blue-500';
              textColor = 'text-blue-400';
            } else if (table.type === 'domicilio') {
              borderStyle = 'border-emerald-500';
              textColor = 'text-emerald-400';
            }

            const hasSent = table.items.some((it) => it.sentToKitchen);
            const hasUnsent = table.items.some((it) => !it.sentToKitchen);
            const isAdditionPending = hasSent && hasUnsent;

            if (hasItems) {
              if (isEnCuenta) {
                borderStyle = 'border-cyan-400';
                bgStyle = 'bg-slate-800 shadow-lg ring-2 ring-cyan-400/90';
              } else if (isAdditionPending) {
                borderStyle = 'border-amber-400';
                bgStyle = 'bg-slate-800 shadow-md ring-2 ring-amber-400';
              } else {
                borderStyle = 'border-orange-500/60';
                bgStyle = 'bg-slate-800 shadow-md ring-2 ring-orange-500/60';
              }
            }

            // Extract table number if standard mesa
            const displayLabel = table.type === 'mesa' ? table.label.replace('Mesa ', '') : table.label;

            return (
              <button
                key={table.id}
                id={`btn-mesa-${table.id.replace(/\s+/g, '-').toLowerCase()}`}
                onClick={() => handleTableClick(table.id)}
                className={`btn-mesa relative p-3 sm:py-4 rounded-xl font-black text-center transition active:scale-90 border-2 cursor-pointer flex flex-col items-center justify-center min-h-[72px] ${colSpan} ${bgStyle} ${borderStyle} ${textColor}`}
              >
                {/* Main Label / Table Number */}
                <span className={isSpecial ? 'text-sm sm:text-base font-black tracking-wider uppercase' : 'text-lg sm:text-xl'}>
                  {displayLabel}
                </span>

                {/* Subtitle / Item indicator if occupied */}
                {hasItems ? (
                  <div className="mt-1 flex flex-col items-center leading-none">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${
                      isEnCuenta
                        ? 'text-cyan-300 bg-cyan-950 border-cyan-400'
                        : isAdditionPending
                        ? 'text-amber-300 bg-amber-950/90 border-amber-400/60'
                        : 'text-orange-400 bg-orange-950/80 border-orange-500/40'
                    }`}>
                      {itemCount} {itemCount === 1 ? 'item' : 'items'}
                    </span>
                    <span className="text-[10px] font-black text-emerald-400 mt-0.5">
                      {formatCOP(tableTotal)}
                    </span>
                  </div>
                ) : (
                  <span className="text-[9px] font-semibold text-slate-500 mt-0.5 uppercase tracking-wider">
                    Libre
                  </span>
                )}

                {/* Live timer badge or addition badge or en caja badge */}
                {isEnCuenta ? (
                  <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full bg-cyan-400 border-2 border-slate-900 flex items-center justify-center text-[8px] font-black text-slate-950 animate-pulse">
                    🧾 En Caja
                  </span>
                ) : isAdditionPending ? (
                  <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full bg-amber-500 border-2 border-slate-900 flex items-center justify-center text-[8px] font-black text-slate-950 animate-pulse">
                    ⚡ Adición
                  </span>
                ) : table.lastKitchenSendAt ? (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-orange-600 border-2 border-slate-900 flex items-center justify-center text-[8px] font-black text-white">
                    🔥
                  </span>
                ) : null}

                {table.currentRound && table.currentRound > 1 && !isAdditionPending && !isEnCuenta && (
                  <span className="absolute -bottom-1 -right-1 px-1 rounded bg-slate-900 text-[8px] font-mono text-slate-300 border border-slate-700">
                    R{table.currentRound}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </main>

      {/* Bottom status bar for quick glance */}
      <footer className="bg-[#0b1120] border-t border-slate-800 px-4 py-2.5 text-xs text-slate-400 flex items-center justify-between shrink-0 flex-wrap gap-2">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-600"></span>
            <span>Libre</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
            <span>Con Pedido</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
            <span>En Caja (Con Ticket)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            <span>Barra</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>Domicilio</span>
          </div>
        </div>

        <div className="font-bold text-slate-300">
          Pollos & Sabor • POS Tablet
        </div>
      </footer>
    </div>
  );
};
