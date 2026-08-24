import React, { useState } from 'react';
import { ActiveTable, PaymentReceipt } from '../types';
import { formatCOP } from '../data/menu';
import { posAudio } from '../utils/audio';
import confetti from 'canvas-confetti';
import { X, Check, DollarSign, CreditCard, Smartphone, Percent, Printer } from 'lucide-react';

interface CajaModalProps {
  table: ActiveTable;
  onClose: () => void;
  onCompletePayment: (receipt: PaymentReceipt) => void;
}

export const CajaModal: React.FC<CajaModalProps> = ({
  table,
  onClose,
  onCompletePayment,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'nequi' | 'daviplata' | 'tarjeta' | 'transferencia'>('efectivo');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [tipPercent, setTipPercent] = useState<number>(0);
  const [amountReceivedStr, setAmountReceivedStr] = useState<string>('');

  const subtotal = table.items.reduce((sum, it) => sum + it.price * it.quantity, 0);
  const discountAmount = Math.round((subtotal * discountPercent) / 100);
  const tipAmount = Math.round(((subtotal - discountAmount) * tipPercent) / 100);
  const total = subtotal - discountAmount + tipAmount;

  const amountReceived = parseFloat(amountReceivedStr.replace(/[^0-9]/g, '')) || 0;
  const change = Math.max(0, amountReceived - total);

  const handleFinish = () => {
    posAudio.playCashRegister();
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });

    const receipt: PaymentReceipt = {
      id: `rec-${Date.now()}`,
      orderNumber: table.orderNumber || Math.floor(Math.random() * 900 + 100),
      tableLabel: table.label,
      items: table.items,
      subtotal,
      discount: discountAmount,
      tip: tipAmount,
      total,
      paymentMethod,
      amountReceived: paymentMethod === 'efectivo' ? amountReceived : total,
      change: paymentMethod === 'efectivo' ? change : 0,
      closedAt: Date.now(),
      waiterName: table.waiterName || 'Mesero',
      customerName: table.customerName,
    };

    onCompletePayment(receipt);
  };

  const quickCashShortcuts = [
    total,
    Math.ceil(total / 10000) * 10000,
    Math.ceil(total / 20000) * 20000,
    50000,
    100000,
  ].filter((v, i, a) => v >= total && a.indexOf(v) === i);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
      <div className="bg-white text-slate-900 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
          <div>
            <span className="text-emerald-400 font-bold text-xs uppercase tracking-wider">
              Cobro y Cierre de Cuenta
            </span>
            <h2 className="text-xl font-black">{table.label}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto space-y-4 text-sm flex-1">
          {/* Order Summary Breakdown */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600 font-medium">
              <span>Subtotal ({table.items.length} items):</span>
              <span className="font-bold text-slate-900">{formatCOP(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-red-600 font-medium">
                <span>Descuento ({discountPercent}%):</span>
                <span>-{formatCOP(discountAmount)}</span>
              </div>
            )}
            {tipAmount > 0 && (
              <div className="flex justify-between text-emerald-700 font-medium">
                <span>Propina Voluntaria ({tipPercent}%):</span>
                <span>+{formatCOP(tipAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-black text-slate-950 pt-2 border-t border-slate-200">
              <span>TOTAL A COBRAR:</span>
              <span className="text-orange-600">{formatCOP(total)}</span>
            </div>
          </div>

          {/* Quick Tip & Discount options */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Propina
              </label>
              <div className="flex gap-1.5">
                {[0, 5, 10].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTipPercent(t)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition ${
                      tipPercent === t
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {t === 0 ? 'Sin propina' : `${t}%`}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Descuento
              </label>
              <div className="flex gap-1.5">
                {[0, 5, 10, 15].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDiscountPercent(d)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition ${
                      discountPercent === d
                        ? 'bg-red-600 text-white border-red-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {d === 0 ? '0%' : `${d}%`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
              Método de Pago
            </label>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('efectivo')}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 font-bold text-xs transition ${
                  paymentMethod === 'efectivo'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <DollarSign size={20} />
                <span>Efectivo</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('nequi')}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 font-bold text-xs transition ${
                  paymentMethod === 'nequi'
                    ? 'bg-purple-700 text-white border-purple-700 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Smartphone size={20} />
                <span>Nequi</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('daviplata')}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 font-bold text-xs transition ${
                  paymentMethod === 'daviplata'
                    ? 'bg-red-700 text-white border-red-700 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Smartphone size={20} />
                <span>Daviplata</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('tarjeta')}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 font-bold text-xs transition ${
                  paymentMethod === 'tarjeta'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <CreditCard size={20} />
                <span>Datáfono</span>
              </button>
            </div>
          </div>

          {/* Cash Change Calculator */}
          {paymentMethod === 'efectivo' && (
            <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 space-y-2">
              <label className="block text-xs font-bold text-emerald-900 uppercase">
                Dinero Recibido (Efectivo)
              </label>
              <input
                type="text"
                placeholder={`Ej: ${formatCOP(total)}`}
                value={amountReceivedStr}
                onChange={(e) => setAmountReceivedStr(e.target.value)}
                className="w-full px-3 py-2 text-base font-bold bg-white border border-emerald-300 rounded-lg text-slate-900 focus:outline-hidden focus:border-emerald-600"
              />

              {/* Quick Cash Buttons */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {quickCashShortcuts.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAmountReceivedStr(amt.toString())}
                    className="px-2.5 py-1 bg-white border border-emerald-300 text-emerald-900 rounded-lg text-xs font-bold hover:bg-emerald-100 transition"
                  >
                    {formatCOP(amt)}
                  </button>
                ))}
              </div>

              {amountReceived >= total && (
                <div className="pt-2 border-t border-emerald-200 flex justify-between items-center">
                  <span className="font-bold text-xs text-emerald-900 uppercase">
                    Cambio / Vueltas:
                  </span>
                  <span className="text-lg font-black text-emerald-700">
                    {formatCOP(change)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition"
          >
            Volver
          </button>
          <button
            type="button"
            onClick={handleFinish}
            className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-black text-sm uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-lg transition"
          >
            <Check size={18} />
            Confirmar Pago y Liberar Mesa
          </button>
        </div>
      </div>
    </div>
  );
};
