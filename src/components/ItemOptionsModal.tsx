import React, { useState } from 'react';
import { MenuItem, OrderItem } from '../types';
import { formatCOP, QUICK_NOTES } from '../data/menu';
import { X, Plus, Check } from 'lucide-react';

interface ItemOptionsModalProps {
  item: MenuItem;
  onClose: () => void;
  onAdd: (orderItem: OrderItem) => void;
}

export const ItemOptionsModal: React.FC<ItemOptionsModalProps> = ({
  item,
  onClose,
  onAdd,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [isCombo, setIsCombo] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState<string>('');
  const [selectedDrinkType, setSelectedDrinkType] = useState<string>('');
  const [customNote, setCustomNote] = useState('');
  const [selectedQuickNotes, setSelectedQuickNotes] = useState<string[]>([]);

  const isParrilla = item.cat === 'Parrilla' || item.cat === 'Típicos' || item.name.toLowerCase().includes('churrasco') || item.name.toLowerCase().includes('pechuga');
  const isJuice = item.cat === 'Bebidas' && item.name.toLowerCase().includes('jugo');
  const isSoda = item.cat === 'Bebidas' && item.name.toLowerCase().includes('gaseosa');

  const unitPrice = item.price + (isCombo && item.comboExtra ? item.comboExtra : 0);
  const totalPrice = unitPrice * quantity;

  const toggleQuickNote = (note: string) => {
    if (selectedQuickNotes.includes(note)) {
      setSelectedQuickNotes(selectedQuickNotes.filter((n) => n !== note));
    } else {
      setSelectedQuickNotes([...selectedQuickNotes, note]);
    }
  };

  const handleConfirm = () => {
    const combinedNotes = [
      ...selectedQuickNotes,
      selectedTerm ? `Término: ${selectedTerm}` : '',
      selectedDrinkType ? `Preparación: ${selectedDrinkType}` : '',
      customNote.trim(),
    ]
      .filter(Boolean)
      .join(', ');

    const newOrderItem: OrderItem = {
      id: `${item.id}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      menuItemId: item.id,
      name: isCombo ? `${item.name} (COMBO)` : item.name,
      desc: item.desc,
      price: unitPrice,
      quantity,
      isCombo,
      comboNote: isCombo ? 'Incluye Papa Francesa + Bebida' : undefined,
      note: combinedNotes,
      term: selectedTerm || undefined,
      beverageType: selectedDrinkType || undefined,
      area: item.area,
      timestamp: Date.now(),
    };

    onAdd(newOrderItem);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
      <div className="bg-white text-slate-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
          <div>
            <span className="text-orange-500 font-bold text-xs uppercase tracking-wider">
              Personalizar Pedido
            </span>
            <h2 className="text-lg font-bold leading-tight">{item.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4 text-sm">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <p className="text-slate-600 text-xs">{item.desc}</p>
            <div className="mt-2 text-base font-black text-slate-900">
              Precio Base: {formatCOP(item.price)}
            </div>
          </div>

          {/* Combo Option if available */}
          {item.combo && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <div className="font-bold text-blue-900 text-sm">
                    Convertir en Combo (+{formatCOP(item.comboExtra || 8000)})
                  </div>
                  <div className="text-xs text-blue-700">
                    Incluye Papa a la Francesa + Gaseosa o Limonada Natural
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isCombo}
                  onChange={(e) => setIsCombo(e.target.checked)}
                  className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                />
              </label>
            </div>
          )}

          {/* Término de carne for Parrilla */}
          {isParrilla && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Término de la Carne
              </label>
              <div className="grid grid-cols-4 gap-2">
                {['1/2 (Medio)', '3/4 (Tres cuartos)', 'Bien Asado', 'Término Azul'].map(
                  (term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() =>
                        setSelectedTerm(selectedTerm === term ? '' : term)
                      }
                      className={`p-2 rounded-lg text-xs font-bold border transition ${
                        selectedTerm === term
                          ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {term}
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          {/* Bebidas modifiers */}
          {isJuice && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Sabor del Jugo
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['Mora', 'Mango', 'Maracuyá', 'Lulo', 'Guanábana', 'Fresa'].map(
                  (fruit) => (
                    <button
                      key={fruit}
                      type="button"
                      onClick={() =>
                        setSelectedDrinkType(
                          selectedDrinkType === fruit ? '' : fruit
                        )
                      }
                      className={`p-2 rounded-lg text-xs font-bold border transition ${
                        selectedDrinkType === fruit
                          ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {fruit}
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          {isSoda && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Sabor de Gaseosa
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['Coca Cola', 'Colombiana', 'Manzana Postobón', 'Cuatro', 'Sprite', 'Pepsi'].map(
                  (soda) => (
                    <button
                      key={soda}
                      type="button"
                      onClick={() =>
                        setSelectedDrinkType(
                          selectedDrinkType === soda ? '' : soda
                        )
                      }
                      className={`p-2 rounded-lg text-xs font-bold border transition ${
                        selectedDrinkType === soda
                          ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {soda}
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          {/* Quick Notes Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
              Notas Rápidas para Cocina
            </label>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_NOTES.slice(0, 10).map((qNote) => {
                const isSelected = selectedQuickNotes.includes(qNote);
                return (
                  <button
                    key={qNote}
                    type="button"
                    onClick={() => toggleQuickNote(qNote)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition ${
                      isSelected
                        ? 'bg-slate-800 text-white border-slate-800'
                        : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {isSelected && '✓ '}
                    {qNote}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Note input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Observación Especial
            </label>
            <input
              type="text"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="Ej: Sin cebolla, extra salsa, ensalada aparte..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-orange-500 bg-white"
            />
          </div>

          {/* Quantity selector */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-200">
            <span className="text-xs font-bold text-slate-700 uppercase">
              Cantidad
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-300 font-black text-slate-700 hover:bg-slate-200 flex items-center justify-center text-lg active:scale-95 transition"
              >
                -
              </button>
              <span className="w-8 text-center font-black text-lg text-slate-900">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-300 font-black text-slate-700 hover:bg-slate-200 flex items-center justify-center text-lg active:scale-95 transition"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] text-slate-500 font-bold uppercase">
              Total a Agregar
            </div>
            <div className="text-xl font-black text-slate-900">
              {formatCOP(totalPrice)}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 active:scale-95 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md transition"
            >
              <Check size={16} />
              Agregar a la Orden
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
