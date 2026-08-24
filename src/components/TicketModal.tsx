import React from 'react';
import { ActiveTable, OrderItem } from '../types';
import { formatCOP } from '../data/menu';
import { X, Printer, CheckCircle } from 'lucide-react';

interface TicketModalProps {
  type: 'cocina' | 'precuenta';
  table: ActiveTable;
  itemsToPrint?: OrderItem[];
  orderNumber?: number;
  waiterName?: string;
  isAddition?: boolean;
  roundNumber?: number;
  onClose: () => void;
  onPrinted?: () => void;
}

export const TicketModal: React.FC<TicketModalProps> = ({
  type,
  table,
  itemsToPrint,
  orderNumber = 1,
  waiterName = 'Mesero 1',
  isAddition = false,
  roundNumber = 1,
  onClose,
  onPrinted,
}) => {
  const items = itemsToPrint || table.items;
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const now = new Date();
  const dateStr = now.toLocaleDateString('es-CO');
  const timeStr = now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const handlePrint = () => {
    window.print();
    if (onPrinted) {
      onPrinted();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Controls */}
        <div className="p-3 bg-slate-900 text-white flex items-center justify-between no-print">
          <div className="font-bold text-xs flex items-center gap-2">
            <span className={type === 'cocina' ? (isAddition ? 'text-amber-400 font-black' : 'text-orange-400') : 'text-blue-400'}>
              {type === 'cocina'
                ? isAddition
                  ? `⚡ TICKET ADICIÓN # ${roundNumber}`
                  : '🔥 TICKET DE COCINA'
                : '🧾 PRE-CUENTA CLIENTE'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer"
            >
              <Printer size={14} /> Imprimir
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Printable Ticket Receipt */}
        <div
          id="printable-ticket"
          className="p-6 font-mono text-slate-900 bg-white overflow-y-auto flex-1 text-xs leading-relaxed"
        >
          <div className="text-center pb-2 border-b border-dashed border-slate-400">
            <h1 className="text-base font-black tracking-wider uppercase">
              POLLOS & SABOR
            </h1>
            <p className="text-[10px] text-slate-600">Sabor y Calidad Incomparable</p>
            <p className="text-[10px] text-slate-600">NIT: 901.234.567-8 | TEL: 315 313 4721</p>
          </div>

          <div className="py-2 border-b border-dashed border-slate-400 text-[11px] space-y-0.5">
            <div className="flex justify-between font-black text-sm text-slate-950">
              <span className="bg-slate-900 text-white px-2 py-0.5 rounded text-xs">{table.label.toUpperCase()}</span>
              <span>ORDEN #{orderNumber}</span>
            </div>
            <div className="flex justify-between text-slate-600 pt-1">
              <span>Mesero: {waiterName}</span>
              <span>{dateStr} {timeStr}</span>
            </div>
            {table.customerName && (
              <div className="text-slate-800 font-semibold">
                Cliente: {table.customerName}
              </div>
            )}
            {table.address && (
              <div className="text-slate-800 text-[10px]">
                Dirección: {table.address}
              </div>
            )}
            <div className="text-[11px] uppercase font-black text-center pt-2 pb-1">
              {type === 'cocina' ? (
                isAddition ? (
                  <div className="bg-slate-900 text-white py-1 px-2 rounded">
                    *** ADICIÓN # {roundNumber} (SOLO PREPARAR ESTO) ***
                  </div>
                ) : (
                  <div className="bg-slate-100 text-slate-900 py-1 px-2 rounded border border-slate-300 font-black">
                    *** COMANDA DE PREPARACIÓN INICIAL ***
                  </div>
                )
              ) : (
                <div className="bg-amber-100 border-2 border-dashed border-amber-600 text-amber-950 p-2 rounded-lg text-center space-y-0.5">
                  <div className="font-black text-xs tracking-wider">
                    *** TICKET PARA PAGAR EN CAJA ***
                  </div>
                  <div className="text-[9px] font-bold text-amber-800 uppercase">
                    Por favor acérquese a la caja principal con este ticket
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Items List */}
          <div className="py-3 border-b border-dashed border-slate-400 space-y-2">
            <div className="flex justify-between font-bold border-b border-slate-200 pb-1 text-[10px]">
              <span>CANT / DESCRIPCIÓN</span>
              <span>VALOR</span>
            </div>

            {items.map((item, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex justify-between items-start font-bold">
                  <span className="flex-1 pr-2">
                    {item.quantity}x {item.name}
                  </span>
                  <span>{formatCOP(item.price * item.quantity)}</span>
                </div>
                {item.isCombo && (
                  <div className="text-[9px] text-slate-600 pl-4 font-semibold">
                    + Combo: Francesa + Bebida
                  </div>
                )}
                {item.term && (
                  <div className="text-[10px] text-orange-700 pl-4 font-bold">
                    Término: {item.term}
                  </div>
                )}
                {item.note && (
                  <div className="text-[10px] bg-slate-100 p-1 rounded text-red-700 font-bold pl-2">
                    ⚠️ {item.note}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="py-3 space-y-2 text-xs">
            <div className="bg-slate-100 p-2 rounded-lg border border-slate-200 flex justify-between font-black text-sm text-slate-950">
              <span>{type === 'cocina' && isAddition ? 'SUBTOTAL ADICIÓN:' : 'TOTAL A PAGAR EN CAJA:'}</span>
              <span className="text-base text-orange-600">{formatCOP(subtotal)}</span>
            </div>

            {type === 'precuenta' && (
              <div className="text-center pt-1 pb-1">
                {/* Simulated Barcode */}
                <div className="font-mono text-[11px] tracking-[0.25em] text-slate-700 select-none py-1">
                  ||| | |||| | ||| || |||| |||
                </div>
                <div className="text-[9px] font-mono text-slate-500">
                  REF-{table.id.replace(/\s+/g, '')}-{orderNumber}
                </div>
                <p className="text-[10px] text-slate-600 font-medium mt-1">
                  Medios de pago en caja: Efectivo, Nequi, Daviplata, Tarjetas.
                </p>
              </div>
            )}

            <div className="text-[10px] text-slate-500 text-center pt-1 border-t border-slate-200">
              {type === 'cocina'
                ? isAddition
                  ? '¡Adición a la mesa! Llevar inmediatamente al estar listo.'
                  : '¡Preparar con rapidez y excelente presentación!'
                : '¡Gracias por su compra en Pollos & Sabor!'}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 flex gap-2 no-print">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs transition cursor-pointer"
          >
            Cerrar
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition cursor-pointer"
          >
            <Printer size={15} /> Imprimir Ticket
          </button>
        </div>
      </div>
    </div>
  );
};
