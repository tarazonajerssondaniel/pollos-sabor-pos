import React, { useState } from 'react';
import { ActiveTable, PaymentReceipt } from '../types';
import { formatCOP } from '../data/menu';
import { CajaModal } from './CajaModal';
import {
  X,
  Receipt,
  DollarSign,
  Download,
  Trash2,
  Calendar,
  FileText,
  CreditCard,
  Printer,
  Sparkles,
  ArrowRight,
  Search,
  Layers,
} from 'lucide-react';

interface SalesHistoryModalProps {
  receipts: PaymentReceipt[];
  tables?: ActiveTable[];
  onClose: () => void;
  onClearReceipts: () => void;
  onCompletePayment?: (receipt: PaymentReceipt) => void;
  onSelectTable?: (tableId: string) => void;
}

export const SalesHistoryModal: React.FC<SalesHistoryModalProps> = ({
  receipts,
  tables = [],
  onClose,
  onClearReceipts,
  onCompletePayment,
  onSelectTable,
}) => {
  const [activeTab, setActiveTab] = useState<'cobro' | 'cierre'>('cobro');
  const [tableToPay, setTableToPay] = useState<ActiveTable | null>(null);
  const [searchTable, setSearchTable] = useState('');

  const activeTablesToPay = tables.filter((t) => t.items.length > 0);
  const tablesInCuenta = activeTablesToPay.filter((t) => t.status === 'cuenta');

  const filteredTablesToPay = activeTablesToPay.filter((t) => {
    if (!searchTable) return true;
    return (
      t.label.toLowerCase().includes(searchTable.toLowerCase()) ||
      (t.customerName && t.customerName.toLowerCase().includes(searchTable.toLowerCase()))
    );
  });

  const totalSales = receipts.reduce((sum, r) => sum + r.total, 0);
  const totalTips = receipts.reduce((sum, r) => sum + r.tip, 0);
  const totalDiscounts = receipts.reduce((sum, r) => sum + r.discount, 0);

  // Group by payment method
  const salesByMethod = receipts.reduce((acc, r) => {
    acc[r.paymentMethod] = (acc[r.paymentMethod] || 0) + r.total;
    return acc;
  }, {} as Record<string, number>);

  const exportCSV = () => {
    const headers = 'ID,Orden,Mesa,Mesero,Metodo,Subtotal,Descuento,Propina,Total,Fecha\n';
    const rows = receipts
      .map((r) =>
        [
          r.id,
          r.orderNumber,
          `"${r.tableLabel}"`,
          `"${r.waiterName}"`,
          r.paymentMethod,
          r.subtotal,
          r.discount,
          r.tip,
          r.total,
          `"${new Date(r.closedAt).toLocaleString('es-CO')}"`,
        ].join(',')
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Ventas_Pollos_y_Sabor_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-xs">
      <div className="bg-slate-900 text-white rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-950/50">
              <CreditCard size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-white uppercase tracking-tight">
                MÓDULO DE CAJA PRINCIPAL
              </h2>
              <p className="text-xs text-slate-400">
                Pollos & Sabor • Cobro de tickets y arqueo
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-4 pt-2 gap-2">
          <button
            onClick={() => setActiveTab('cobro')}
            className={`pb-2.5 px-3 font-black text-xs uppercase tracking-wider flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === 'cobro'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <DollarSign size={15} />
            <span>Cobrar Tickets en Caja</span>
            {activeTablesToPay.length > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                tablesInCuenta.length > 0
                  ? 'bg-cyan-500 text-slate-950 animate-pulse'
                  : 'bg-slate-800 text-slate-300'
              }`}>
                {activeTablesToPay.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('cierre')}
            className={`pb-2.5 px-3 font-black text-xs uppercase tracking-wider flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === 'cierre'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Receipt size={15} />
            <span>Cierre & Historial ({receipts.length})</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4 text-xs">
          {/* TAB 1: COBRO DE MESAS EN CAJA */}
          {activeTab === 'cobro' && (
            <div className="space-y-3">
              {/* Search & Info Banner */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar mesa o cliente con ticket..."
                    value={searchTable}
                    onChange={(e) => setSearchTable(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 text-white rounded-xl text-xs focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div className="text-xs text-slate-400 font-medium">
                  {tablesInCuenta.length > 0 && (
                    <span className="text-cyan-400 font-bold bg-cyan-950/80 px-2 py-1 rounded-lg border border-cyan-800/60 mr-2">
                      🧾 {tablesInCuenta.length} cliente(s) con ticket en caja
                    </span>
                  )}
                  Pendientes de cobro:{' '}
                  <span className="text-emerald-400 font-black">
                    {formatCOP(
                      activeTablesToPay.reduce(
                        (sum, t) =>
                          sum + t.items.reduce((s, it) => s + it.price * it.quantity, 0),
                        0
                      )
                    )}
                  </span>
                </div>
              </div>

              {filteredTablesToPay.length === 0 ? (
                <div className="text-center py-12 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-2">
                  <Receipt size={36} className="mx-auto text-slate-600" />
                  <p className="font-bold text-sm text-slate-400">
                    No hay mesas con pedidos pendientes de cobro
                  </p>
                  <p className="text-slate-500 text-xs max-w-sm mx-auto">
                    Cuando un mesero imprima un ticket de pre-cuenta, aparecerá aquí listo para cobrar en la caja.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredTablesToPay.map((tbl) => {
                    const totalMesa = tbl.items.reduce((s, it) => s + it.price * it.quantity, 0);
                    const isEnCuenta = tbl.status === 'cuenta';

                    return (
                      <div
                        key={tbl.id}
                        className={`p-3.5 rounded-2xl border transition space-y-2.5 ${
                          isEnCuenta
                            ? 'bg-slate-950 border-cyan-500 ring-2 ring-cyan-500/40 shadow-lg shadow-cyan-950/30'
                            : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-black text-base text-white">
                                {tbl.label}
                              </span>
                              {isEnCuenta ? (
                                <span className="bg-cyan-500 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tight flex items-center gap-1">
                                  <Printer size={10} /> Con Ticket en Caja
                                </span>
                              ) : (
                                <span className="bg-slate-800 text-slate-300 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                                  Consumo Activo
                                </span>
                              )}
                            </div>
                            {tbl.customerName && (
                              <div className="text-[11px] text-slate-400 font-medium">
                                Cliente: {tbl.customerName}
                              </div>
                            )}
                            <div className="text-[10px] text-slate-500">
                              {tbl.items.reduce((s, it) => s + it.quantity, 0)} productos • Orden #{tbl.orderNumber || 1}
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-base font-black text-emerald-400">
                              {formatCOP(totalMesa)}
                            </div>
                          </div>
                        </div>

                        {/* Quick preview of items */}
                        <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800 text-[10px] space-y-1 max-h-20 overflow-y-auto">
                          {tbl.items.map((it) => (
                            <div key={it.id} className="flex justify-between text-slate-300">
                              <span>
                                {it.quantity}x {it.name}
                              </span>
                              <span className="font-mono text-slate-400">
                                {formatCOP(it.price * it.quantity)}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => onSelectTable?.(tbl.id)}
                            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs transition cursor-pointer"
                          >
                            Ver Pedido
                          </button>
                          <button
                            onClick={() => setTableToPay(tbl)}
                            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/50 transition cursor-pointer active:scale-98"
                          >
                            <CreditCard size={14} />
                            Cobrar en Caja
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CIERRE & HISTORIAL DE VENTAS */}
          {activeTab === 'cierre' && (
            <div className="space-y-4">
              {/* Summary KPIs */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">
                    Ventas Totales
                  </div>
                  <div className="text-xl font-black text-emerald-400 mt-0.5">
                    {formatCOP(totalSales)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {receipts.length} cuentas cobradas
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">
                    Propinas Recaudadas
                  </div>
                  <div className="text-xl font-black text-blue-400 mt-0.5">
                    {formatCOP(totalTips)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">Para equipo</div>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">
                    Descuentos Aplicados
                  </div>
                  <div className="text-xl font-black text-red-400 mt-0.5">
                    {formatCOP(totalDiscounts)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">Promociones</div>
                </div>
              </div>

              {/* Breakdown by Payment Method */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="font-bold text-slate-300 uppercase tracking-wider text-[11px] mb-2">
                  Desglose por Método de Pago en Caja
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['efectivo', 'nequi', 'daviplata', 'tarjeta'].map((method) => (
                    <div key={method} className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                      <div className="text-[10px] uppercase font-bold text-slate-400">
                        {method}
                      </div>
                      <div className="font-black text-sm text-slate-100 mt-0.5">
                        {formatCOP(salesByMethod[method] || 0)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Receipts Table */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                    Historial de Recibos Cobrados
                  </span>
                  <button
                    onClick={exportCSV}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-bold text-[11px] flex items-center gap-1 border border-slate-700 cursor-pointer"
                  >
                    <Download size={13} /> Exportar Excel/CSV
                  </button>
                </div>

                {receipts.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 bg-slate-950/50 rounded-xl border border-slate-800">
                    No hay ventas registradas aún el día de hoy.
                  </div>
                ) : (
                  <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden divide-y divide-slate-800/80 max-h-56 overflow-y-auto">
                    {receipts.map((rec) => (
                      <div
                        key={rec.id}
                        className="p-2.5 flex items-center justify-between hover:bg-slate-900 transition"
                      >
                        <div>
                          <div className="font-bold text-slate-100 flex items-center gap-2">
                            <span>{rec.tableLabel}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              (#{rec.orderNumber})
                            </span>
                            <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[9px] uppercase font-bold text-slate-300">
                              {rec.paymentMethod}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {new Date(rec.closedAt).toLocaleTimeString('es-CO')} •{' '}
                            {rec.items.length} productos • {rec.waiterName}
                          </div>
                        </div>

                        <div className="text-right font-black text-sm text-emerald-400">
                          {formatCOP(rec.total)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex justify-between items-center gap-2">
          {receipts.length > 0 && activeTab === 'cierre' && (
            <button
              onClick={() => {
                if (confirm('¿Desea reiniciar el historial de ventas del día?')) {
                  onClearReceipts();
                }
              }}
              className="px-3 py-2 bg-red-950/60 hover:bg-red-900 text-red-300 font-bold rounded-xl text-xs flex items-center gap-1.5 border border-red-800/50 transition cursor-pointer"
            >
              <Trash2 size={14} /> Reiniciar Caja
            </button>
          )}
          <button
            onClick={onClose}
            className="ml-auto px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>

      {/* Embedded CajaModal when charging a table from the Caja Hub */}
      {tableToPay && (
        <CajaModal
          table={tableToPay}
          onClose={() => setTableToPay(null)}
          onCompletePayment={(receipt) => {
            setTableToPay(null);
            onCompletePayment?.(receipt);
          }}
        />
      )}
    </div>
  );
};
