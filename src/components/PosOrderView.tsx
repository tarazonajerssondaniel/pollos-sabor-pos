import React, { useState, useMemo } from 'react';
import { ActiveTable, CategoryType, MenuItem, OrderItem, TableStatus } from '../types';
import { CATEGORIES, MENU_ITEMS, formatCOP, QUICK_NOTES } from '../data/menu';
import { posAudio } from '../utils/audio';
import { ItemOptionsModal } from './ItemOptionsModal';
import { TicketModal } from './TicketModal';
import { CajaModal } from './CajaModal';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  Search,
  Plus,
  Minus,
  Trash2,
  ChefHat,
  Flame,
  Printer,
  CreditCard,
  X,
  SlidersHorizontal,
  FileEdit,
  Tag,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';

interface PosOrderViewProps {
  table: ActiveTable;
  waiterName: string;
  onBackToTables: () => void;
  onUpdateTableItems: (tableId: string, items: OrderItem[]) => void;
  onUpdateTableStatus?: (tableId: string, status: TableStatus) => void;
  onSendToKitchen: (table: ActiveTable, items: OrderItem[]) => void;
  onCompletePayment: (receipt: any) => void;
}

export const PosOrderView: React.FC<PosOrderViewProps> = ({
  table,
  waiterName,
  onBackToTables,
  onUpdateTableItems,
  onUpdateTableStatus,
  onSendToKitchen,
  onCompletePayment,
}) => {
  const [selectedCat, setSelectedCat] = useState<CategoryType | 'Todos'>('Pollos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItemForModal, setSelectedItemForModal] = useState<MenuItem | null>(null);
  const [ticketModalType, setTicketModalType] = useState<'cocina' | 'precuenta' | null>(null);
  const [ticketItemsToPrint, setTicketItemsToPrint] = useState<OrderItem[] | undefined>(undefined);
  const [ticketIsAddition, setTicketIsAddition] = useState<boolean>(false);
  const [ticketRoundNumber, setTicketRoundNumber] = useState<number>(1);
  const [showCajaModal, setShowCajaModal] = useState(false);
  const [customerNameInput, setCustomerNameInput] = useState(table.customerName || '');
  const [deliveryAddressInput, setDeliveryAddressInput] = useState(table.address || '');

  // Split table items into unsent (draft / addition) and sent (already transmitted)
  const unsentItems = useMemo(
    () => table.items.filter((it) => !it.sentToKitchen),
    [table.items]
  );
  const sentItems = useMemo(
    () => table.items.filter((it) => it.sentToKitchen),
    [table.items]
  );

  const isAdditionOrder = sentItems.length > 0;
  const currentRound = (table.currentRound || 1) + (isAdditionOrder ? 1 : 0);

  // Filter items by category & search query
  const filteredProducts = useMemo(() => {
    return MENU_ITEMS.filter((item) => {
      if (selectedCat !== 'Todos' && item.cat !== selectedCat) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesDesc = item.desc.toLowerCase().includes(q);
        const matchesTags = item.tags?.some((t) => t.toLowerCase().includes(q));
        if (!matchesName && !matchesDesc && !matchesTags) return false;
      }
      return true;
    });
  }, [selectedCat, searchQuery]);

  // Quick add item directly
  const handleQuickAdd = (item: MenuItem, isCombo: boolean = false) => {
    posAudio.playAddBeep();
    const unitPrice = item.price + (isCombo && item.comboExtra ? item.comboExtra : 0);
    const itemName = isCombo ? `${item.name} (COMBO)` : item.name;

    // Check if an UNSENT duplicate item exists with same name and no custom notes
    const existingUnsentIndex = table.items.findIndex(
      (it) =>
        !it.sentToKitchen &&
        it.menuItemId === item.id &&
        it.isCombo === isCombo &&
        !it.note &&
        !it.term
    );

    let updatedItems: OrderItem[];
    if (existingUnsentIndex > -1) {
      updatedItems = [...table.items];
      updatedItems[existingUnsentIndex] = {
        ...updatedItems[existingUnsentIndex],
        quantity: updatedItems[existingUnsentIndex].quantity + 1,
      };
    } else {
      const newItem: OrderItem = {
        id: `${item.id}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        menuItemId: item.id,
        name: itemName,
        desc: item.desc,
        price: unitPrice,
        quantity: 1,
        isCombo,
        comboNote: isCombo ? 'Incluye Francesa + Gaseosa o Limonada' : undefined,
        note: '',
        area: item.area,
        timestamp: Date.now(),
        sentToKitchen: false,
        round: currentRound,
      };
      updatedItems = [...table.items, newItem];
    }

    onUpdateTableItems(table.id, updatedItems);
  };

  // Add customized item from modal
  const handleAddCustomizedItem = (customItem: OrderItem) => {
    posAudio.playAddBeep();
    const itemToAdd: OrderItem = {
      ...customItem,
      sentToKitchen: false,
      round: currentRound,
    };
    const updatedItems = [...table.items, itemToAdd];
    onUpdateTableItems(table.id, updatedItems);
    setSelectedItemForModal(null);
  };

  // Adjust quantity (+ / -) for unsent item
  const handleUpdateUnsentQuantity = (itemId: string, delta: number) => {
    const itemIndex = table.items.findIndex((it) => it.id === itemId);
    if (itemIndex === -1) return;

    const updatedItems = [...table.items];
    const newQty = updatedItems[itemIndex].quantity + delta;
    if (newQty <= 0) {
      handleRemoveItem(itemId);
      return;
    }
    posAudio.playClick();
    updatedItems[itemIndex] = { ...updatedItems[itemIndex], quantity: newQty };
    onUpdateTableItems(table.id, updatedItems);
  };

  // Add another of an already sent item (creates a new addition item)
  const handleAddAnotherOfSentItem = (sentItem: OrderItem) => {
    posAudio.playAddBeep();
    const newAdditionItem: OrderItem = {
      id: `${sentItem.menuItemId}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      menuItemId: sentItem.menuItemId,
      name: sentItem.name,
      desc: sentItem.desc,
      price: sentItem.price,
      quantity: 1,
      isCombo: sentItem.isCombo,
      comboNote: sentItem.comboNote,
      note: sentItem.note,
      term: sentItem.term,
      area: sentItem.area,
      timestamp: Date.now(),
      sentToKitchen: false,
      round: currentRound,
    };

    const updatedItems = [...table.items, newAdditionItem];
    onUpdateTableItems(table.id, updatedItems);
  };

  // Remove item by ID
  const handleRemoveItem = (itemId: string, isSent: boolean = false) => {
    if (isSent) {
      const confirmVoid = window.confirm(
        '⚠️ Este producto YA fue enviado a cocina.\n¿Está seguro de anularlo del pedido?'
      );
      if (!confirmVoid) return;
    }
    posAudio.playRemove();
    const updatedItems = table.items.filter((it) => it.id !== itemId);
    onUpdateTableItems(table.id, updatedItems);
  };

  // Update item note text
  const handleUpdateNote = (itemId: string, note: string) => {
    const itemIndex = table.items.findIndex((it) => it.id === itemId);
    if (itemIndex === -1) return;
    const updatedItems = [...table.items];
    updatedItems[itemIndex] = { ...updatedItems[itemIndex], note };
    onUpdateTableItems(table.id, updatedItems);
  };

  // Append quick note tag to item
  const handleAppendQuickNote = (itemId: string, quickTag: string) => {
    posAudio.playClick();
    const currentItem = table.items.find((it) => it.id === itemId);
    if (!currentItem) return;
    const currentNote = currentItem.note || '';
    const newNote = currentNote
      ? currentNote.includes(quickTag)
        ? currentNote
        : `${currentNote}, ${quickTag}`
      : quickTag;
    handleUpdateNote(itemId, newNote);
  };

  // Total order price
  const totalOrderPrice = table.items.reduce(
    (sum, it) => sum + it.price * it.quantity,
    0
  );

  const unsentSubtotal = unsentItems.reduce(
    (sum, it) => sum + it.price * it.quantity,
    0
  );

  // Send to kitchen handler
  const handleSendOrder = () => {
    if (unsentItems.length === 0) {
      if (sentItems.length > 0) {
        // All items already sent, offer ticket reprint
        setTicketItemsToPrint(sentItems);
        setTicketIsAddition(false);
        setTicketRoundNumber(table.currentRound || 1);
        setTicketModalType('cocina');
        return;
      }
      alert('¡Agregue al menos un producto al pedido antes de enviar a cocina!');
      return;
    }

    posAudio.playKitchenSend();
    confetti({
      particleCount: 75,
      spread: 70,
      origin: { y: 0.7 },
    });

    const isAddition = sentItems.length > 0;
    const roundNumber = isAddition ? (table.currentRound || 1) + 1 : 1;

    // Send only unsent items
    onSendToKitchen(
      {
        ...table,
        customerName: customerNameInput || table.customerName,
        address: deliveryAddressInput || table.address,
      },
      unsentItems
    );

    // Open ticket modal with the newly sent batch
    setTicketItemsToPrint(unsentItems);
    setTicketIsAddition(isAddition);
    setTicketRoundNumber(roundNumber);
    setTicketModalType('cocina');
  };

  const handleBack = () => {
    posAudio.playClick();
    onBackToTables();
  };

  return (
    <div
      id="pantalla-pedido"
      className="flex flex-col h-full bg-[#f1f5f9] text-[#334155] select-none overflow-hidden"
    >
      {/* Top Header Bar */}
      <header className="header-pedido bg-[#1e293b] text-white px-4 py-2.5 flex items-center justify-between shadow-lg shrink-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="btn-volver bg-[#475569] hover:bg-[#334155] active:scale-95 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
          >
            <ArrowLeft size={16} /> MESAS
          </button>

          {/* Table Badge */}
          <div className="flex items-center gap-2">
            <span
              id="nombre-mesa-activa"
              className="text-orange-500 font-black italic text-xl sm:text-2xl uppercase tracking-tight"
            >
              {table.label}
            </span>
            {table.type === 'domicilio' && (
              <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                Domicilio
              </span>
            )}
            {table.type === 'barra' && (
              <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                Barra
              </span>
            )}
            {isAdditionOrder && (
              <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tight flex items-center gap-1">
                <Sparkles size={11} /> Adición Activa
              </span>
            )}
            {table.status === 'cuenta' && (
              <span className="bg-cyan-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tight flex items-center gap-1">
                <Printer size={11} /> En Caja
              </span>
            )}
          </div>
        </div>

        {/* Search Input on header */}
        <div className="relative max-w-xs w-full hidden sm:block">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Buscar pollo, plato, bebida..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-7 py-1.5 bg-slate-900/80 border border-slate-700 text-white placeholder-slate-400 rounded-xl text-xs focus:outline-hidden focus:border-orange-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Right Info */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black tracking-widest text-slate-300 uppercase hidden md:inline">
            POLLOS & SABOR
          </span>
          <span className="text-[11px] font-bold text-orange-400 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
            {waiterName}
          </span>
        </div>
      </header>

      {/* Main Container: Split Menu & Comanda */}
      <div className="contenedor-pos flex flex-1 overflow-hidden">
        {/* Left Side: Food Menu Catalog */}
        <div className="menu-comida flex-[1.8] flex flex-col p-2.5 overflow-hidden">
          {/* Categories Bar */}
          <div className="categorias-bar flex gap-1.5 overflow-x-auto pb-2 shrink-0 no-scrollbar">
            <button
              onClick={() => {
                posAudio.playClick();
                setSelectedCat('Todos');
              }}
              className={`btn-cat px-3.5 py-2 rounded-xl text-[11px] font-extrabold uppercase whitespace-nowrap transition cursor-pointer border ${
                selectedCat === 'Todos'
                  ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              TODOS
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  posAudio.playClick();
                  setSelectedCat(cat);
                }}
                className={`btn-cat px-3.5 py-2 rounded-xl text-[11px] font-extrabold uppercase whitespace-nowrap transition cursor-pointer border ${
                  selectedCat === cat
                    ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Products Grid */}
          <div
            id="productos-grid"
            className="grid-productos grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 content-start auto-rows-max items-start gap-2.5 overflow-y-auto flex-1 pr-1 pb-16"
          >
            {filteredProducts.map((p) => {
              const currentQtyInCart = table.items
                .filter((it) => it.menuItemId === p.id)
                .reduce((s, it) => s + it.quantity, 0);

              const unsentQty = unsentItems
                .filter((it) => it.menuItemId === p.id)
                .reduce((s, it) => s + it.quantity, 0);

              return (
                <div
                  key={p.id}
                  className="card-producto bg-white p-3 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition flex flex-col justify-between h-fit"
                >
                  <div>
                    <div className="flex items-start justify-between gap-1">
                      <h3 className="font-extrabold text-[13px] text-slate-900 leading-snug">
                        {p.name}
                      </h3>
                      {currentQtyInCart > 0 && (
                        <span className={`shrink-0 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center ${
                          unsentQty > 0 ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-300' : 'bg-orange-600 text-white'
                        }`}>
                          {currentQtyInCart}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 leading-normal line-clamp-2 min-h-[26px]">
                      {p.desc}
                    </p>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-100">
                    <div className="precio font-black text-slate-900 text-base">
                      {formatCOP(p.price)}
                    </div>

                    <div className="grid grid-cols-1 gap-1.5 mt-2">
                      <div className="flex gap-1">
                        {/* Direct Quick Add */}
                        <button
                          onClick={() => handleQuickAdd(p, false)}
                          className="btn-add flex-1 bg-orange-600 hover:bg-orange-500 active:scale-95 text-white font-extrabold text-xs py-2 rounded-xl transition cursor-pointer shadow-xs"
                        >
                          {isAdditionOrder ? '+ ADICIÓN' : 'AGREGAR'}
                        </button>

                        {/* Open Customization Modal (for terms/notes) */}
                        <button
                          onClick={() => setSelectedItemForModal(p)}
                          title="Personalizar (término, notas)"
                          className="px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition flex items-center justify-center cursor-pointer"
                        >
                          <SlidersHorizontal size={14} />
                        </button>
                      </div>

                      {/* Combo Button if applicable */}
                      {p.combo && (
                        <button
                          onClick={() => handleQuickAdd(p, true)}
                          className="btn-combo bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-black text-[10px] py-1.5 rounded-lg transition cursor-pointer uppercase tracking-tight"
                        >
                          + COMBO (+{formatCOP(p.comboExtra || 8000)})
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Comanda / Resumen de Orden */}
        <div className="comanda flex-[1.3] bg-white border-l-2 border-slate-200 flex flex-col shadow-xl overflow-hidden min-w-[320px] max-w-md">
          {/* Header of Comanda */}
          <div className="px-3.5 py-2.5 bg-[#1e293b] text-white flex items-center justify-between shrink-0">
            <div className="font-extrabold text-xs tracking-wider uppercase flex items-center gap-1.5">
              <span>RESUMEN DE CUENTA</span>
              <span className="bg-orange-600 text-white px-1.5 py-0.2 rounded-full text-[10px] font-black">
                {table.items.reduce((s, it) => s + it.quantity, 0)}
              </span>
            </div>

            {/* Domicilio Customer info quick modal / input */}
            {(table.type === 'domicilio' || table.type === 'barra') && (
              <div className="text-[10px] text-slate-300">
                {table.customerName || 'Cliente sin asignar'}
              </div>
            )}
          </div>

          {/* Domicilio / Customer Fast Input Bar if applicable */}
          {table.type === 'domicilio' && (
            <div className="p-2 bg-slate-100 border-b border-slate-200 grid grid-cols-2 gap-1.5 text-xs">
              <input
                type="text"
                placeholder="Nombre del Cliente..."
                value={customerNameInput}
                onChange={(e) => setCustomerNameInput(e.target.value)}
                className="bg-white border border-slate-300 px-2 py-1 rounded text-xs"
              />
              <input
                type="text"
                placeholder="Dirección / Teléfono..."
                value={deliveryAddressInput}
                onChange={(e) => setDeliveryAddressInput(e.target.value)}
                className="bg-white border border-slate-300 px-2 py-1 rounded text-xs"
              />
            </div>
          )}

          {/* Items List (Separated by Unsent / Sent) */}
          <div
            id="carrito-lista"
            className="lista-items flex-1 overflow-y-auto p-3 bg-[#fafafa] space-y-3"
          >
            {table.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 py-12">
                <ChefHat size={40} className="text-slate-300 mb-2" />
                <p className="font-bold text-xs text-slate-400 tracking-wide uppercase">
                  LA MESA ESTÁ VACÍA
                </p>
                <p className="text-[10px] text-slate-400 text-center max-w-[200px] mt-1">
                  Seleccione platos de la carta a la izquierda para armar el pedido.
                </p>
              </div>
            ) : (
              <>
                {/* SECTION 1: UNSENT ITEMS (NUEVOS POR ENVIAR / ADICIÓN) */}
                {unsentItems.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between pb-1 border-b border-amber-300/80">
                      <span className="text-[11px] font-black text-amber-800 uppercase tracking-tight flex items-center gap-1">
                        <Flame size={13} className="text-amber-600" />
                        {isAdditionOrder ? `⚡ Adición por Enviar (Ronda ${currentRound})` : '🍽️ Nuevos por Enviar a Cocina'}
                      </span>
                      <span className="bg-amber-100 text-amber-800 text-[9px] font-extrabold px-2 py-0.5 rounded-full border border-amber-300">
                        {unsentItems.reduce((s, it) => s + it.quantity, 0)} por despachar
                      </span>
                    </div>

                    <div className="space-y-2">
                      {unsentItems.map((item) => (
                        <div
                          key={item.id}
                          className="item-carrito bg-white p-2.5 rounded-xl border-2 border-amber-400 shadow-xs space-y-1.5 ring-1 ring-amber-200"
                        >
                          <div className="flex justify-between items-start">
                            <div className="pr-2 flex-1">
                              <div className="flex items-center gap-1.5">
                                <b className="text-xs font-bold text-slate-900 block leading-tight">
                                  {item.name}
                                </b>
                                <span className="bg-amber-500 text-slate-950 font-black text-[9px] px-1.5 py-0.2 rounded uppercase">
                                  NUEVO
                                </span>
                              </div>
                              {item.isCombo && (
                                <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded inline-block mt-0.5">
                                  🍟 Combo (Papas + Bebida)
                                </span>
                              )}
                              {item.term && (
                                <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded inline-block mt-0.5 ml-1">
                                  🥩 {item.term}
                                </span>
                              )}
                            </div>

                            <div className="text-right">
                              <span className="font-black text-xs text-slate-950 block">
                                {formatCOP(item.price * item.quantity)}
                              </span>
                              {item.quantity > 1 && (
                                <span className="text-[9px] text-slate-400">
                                  ({formatCOP(item.price)} c/u)
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Quantity Stepper & Delete */}
                          <div className="flex items-center justify-between pt-1">
                            <div className="flex items-center gap-1.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                              <button
                                onClick={() => handleUpdateUnsentQuantity(item.id, -1)}
                                className="w-6 h-6 rounded bg-white font-black text-slate-700 hover:bg-slate-200 flex items-center justify-center text-xs shadow-2xs cursor-pointer"
                              >
                                -
                              </button>
                              <span className="w-5 text-center font-black text-xs text-slate-900">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => handleUpdateUnsentQuantity(item.id, 1)}
                                className="w-6 h-6 rounded bg-white font-black text-slate-700 hover:bg-slate-200 flex items-center justify-center text-xs shadow-2xs cursor-pointer"
                              >
                                +
                              </button>
                            </div>

                            <button
                              onClick={() => handleRemoveItem(item.id, false)}
                              className="text-red-500 hover:text-red-700 font-bold text-[10px] flex items-center gap-0.5 cursor-pointer"
                            >
                              <Trash2 size={12} /> [QUITAR]
                            </button>
                          </div>

                          {/* Note Input */}
                          <div className="pt-0.5">
                            <input
                              type="text"
                              className="nota w-full border-b border-slate-200 text-[10px] text-slate-700 py-1 outline-hidden focus:border-orange-500 bg-transparent placeholder-slate-400 font-medium"
                              placeholder="Nota: Sin cebolla, término 3/4, etc..."
                              value={item.note || ''}
                              onChange={(e) => handleUpdateNote(item.id, e.target.value)}
                            />
                          </div>

                          {/* Quick Tag Shortcuts */}
                          <div className="flex flex-wrap gap-1 pt-0.5">
                            {QUICK_NOTES.slice(0, 4).map((qTag) => (
                              <button
                                key={qTag}
                                onClick={() => handleAppendQuickNote(item.id, qTag)}
                                className="text-[9px] px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded font-medium transition cursor-pointer"
                              >
                                +{qTag}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SECTION 2: SENT ITEMS (YA ENVIADOS A COCINA) */}
                {sentItems.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                      <span className="text-[11px] font-extrabold text-slate-600 uppercase tracking-tight flex items-center gap-1">
                        <CheckCircle2 size={13} className="text-emerald-600" />
                        Ya Enviados a Cocina ({sentItems.reduce((s, it) => s + it.quantity, 0)})
                      </span>
                      <span className="text-[9px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        En Preparación
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {sentItems.map((item) => (
                        <div
                          key={item.id}
                          className="bg-slate-50/90 p-2.5 rounded-xl border border-slate-200 space-y-1 transition hover:bg-white"
                        >
                          <div className="flex justify-between items-start">
                            <div className="pr-2 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-black text-slate-900 text-xs">
                                  {item.quantity}x
                                </span>
                                <span className="text-xs font-bold text-slate-800 leading-tight">
                                  {item.name}
                                </span>
                                {item.round && (
                                  <span className="text-[8px] font-bold bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded">
                                    Ronda #{item.round}
                                  </span>
                                )}
                              </div>

                              {item.isCombo && (
                                <span className="text-[9px] text-blue-600 font-semibold block mt-0.5">
                                  🍟 Combo (Papas + Bebida)
                                </span>
                              )}
                              {item.term && (
                                <span className="text-[9px] text-amber-700 font-semibold block mt-0.5">
                                  🥩 Término: {item.term}
                                </span>
                              )}
                              {item.note && (
                                <span className="text-[9px] text-red-600 bg-red-50 p-0.5 px-1 rounded block mt-0.5 font-medium">
                                  Nota: {item.note}
                                </span>
                              )}
                            </div>

                            <div className="text-right">
                              <span className="font-bold text-xs text-slate-800 block">
                                {formatCOP(item.price * item.quantity)}
                              </span>
                            </div>
                          </div>

                          {/* Actions for sent item: Ask for another (adición) or void */}
                          <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[10px]">
                            <button
                              onClick={() => handleAddAnotherOfSentItem(item)}
                              className="text-orange-600 hover:text-orange-700 font-extrabold flex items-center gap-0.5 cursor-pointer"
                            >
                              <Plus size={11} /> Pedir otro (Adición)
                            </button>

                            <button
                              onClick={() => handleRemoveItem(item.id, true)}
                              className="text-slate-400 hover:text-red-600 font-medium text-[9px] cursor-pointer"
                              title="Anular plato de la cuenta"
                            >
                              Anular plato
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer of Comanda */}
          <div className="footer-comanda p-3.5 bg-white border-t-2 border-slate-100 shrink-0 space-y-2">
            {/* Total Row */}
            <div className="flex justify-between items-center text-[#0f172a]">
              <div>
                <span className="font-extrabold tracking-tight text-xs text-slate-500 uppercase block">
                  TOTAL CUENTA
                </span>
                <span className="font-black text-2xl text-slate-950">
                  {formatCOP(totalOrderPrice)}
                </span>
              </div>

              {unsentItems.length > 0 && (
                <div className="text-right">
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full block">
                    + Adición: {formatCOP(unsentSubtotal)}
                  </span>
                </div>
              )}
            </div>

            {/* Main Action: Send to Kitchen */}
            {unsentItems.length > 0 ? (
              <button
                onClick={handleSendOrder}
                className={`btn-enviar w-full text-white font-black text-base py-3.5 rounded-2xl cursor-pointer flex items-center justify-center gap-2 shadow-lg transition uppercase tracking-wide active:scale-98 ${
                  isAdditionOrder
                    ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-900/20 ring-2 ring-amber-400'
                    : 'bg-[#16a34a] hover:bg-[#15803d] shadow-emerald-900/20'
                }`}
              >
                <Flame size={20} />
                <span>
                  {isAdditionOrder
                    ? `ENVIAR ADICIÓN A COCINA (${unsentItems.reduce((s, it) => s + it.quantity, 0)}) 🔥`
                    : `ENVIAR A COCINA 🔥 (${unsentItems.reduce((s, it) => s + it.quantity, 0)})`}
                </span>
              </button>
            ) : sentItems.length > 0 ? (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-2.5 rounded-xl text-center">
                <div className="text-xs font-black flex items-center justify-center gap-1">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  TODO ENVIADO A COCINA
                </div>
                <p className="text-[10px] text-emerald-700 mt-0.5">
                  Seleccione productos a la izquierda si el cliente pide adiciones.
                </p>
              </div>
            ) : null}

            {/* Secondary Action Buttons & Cashier Flow Status */}
            {table.status === 'cuenta' && (
              <div className="bg-cyan-50 border border-cyan-200 text-cyan-950 p-2 rounded-xl text-center text-xs">
                <div className="font-black flex items-center justify-center gap-1 text-[11px] text-cyan-900">
                  <Printer size={13} className="text-cyan-700" />
                  TICKET ENTREGADO AL CLIENTE
                </div>
                <p className="text-[10px] text-cyan-800 mt-0.5 font-medium">
                  El cliente pagará directamente en la caja principal con su ticket.
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => {
                  posAudio.playClick();
                  setTicketItemsToPrint(table.items);
                  setTicketIsAddition(false);
                  setTicketRoundNumber(table.currentRound || 1);
                  setTicketModalType('precuenta');
                  onUpdateTableStatus?.(table.id, 'cuenta');
                }}
                disabled={table.items.length === 0}
                className="py-2.5 px-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-900 font-extrabold text-[11px] flex items-center justify-center gap-1.5 border border-orange-200 transition disabled:opacity-50 cursor-pointer shadow-2xs"
                title="Imprimir ticket para que el cliente lleve a la caja"
              >
                <Printer size={14} className="text-orange-600" />
                <span>Ticket para Caja</span>
              </button>

              <button
                onClick={() => {
                  posAudio.playClick();
                  setShowCajaModal(true);
                }}
                disabled={table.items.length === 0}
                className="py-2.5 px-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-400 font-extrabold text-[11px] flex items-center justify-center gap-1.5 transition disabled:opacity-50 shadow-xs cursor-pointer"
                title="Cobrar cuenta directamente en caja"
              >
                <CreditCard size={14} />
                <span>Cobrar en Caja</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Item Customization Modal */}
      {selectedItemForModal && (
        <ItemOptionsModal
          item={selectedItemForModal}
          onClose={() => setSelectedItemForModal(null)}
          onAdd={handleAddCustomizedItem}
        />
      )}

      {/* Ticket Modal (Kitchen / Pre-bill) */}
      {ticketModalType && (
        <TicketModal
          type={ticketModalType}
          table={{
            ...table,
            customerName: customerNameInput || table.customerName,
            address: deliveryAddressInput || table.address,
          }}
          itemsToPrint={ticketItemsToPrint}
          orderNumber={table.orderNumber || 1}
          waiterName={waiterName}
          isAddition={ticketIsAddition}
          roundNumber={ticketRoundNumber}
          onClose={() => setTicketModalType(null)}
        />
      )}

      {/* Caja & Cobro Modal */}
      {showCajaModal && (
        <CajaModal
          table={{
            ...table,
            customerName: customerNameInput || table.customerName,
            address: deliveryAddressInput || table.address,
          }}
          onClose={() => setShowCajaModal(false)}
          onCompletePayment={(receipt) => {
            setShowCajaModal(false);
            onCompletePayment(receipt);
          }}
        />
      )}
    </div>
  );
};
