import React, { useState, useEffect } from 'react';
import { ActiveTable, KitchenOrder, OrderItem, PaymentReceipt, TableStatus } from './types';
import {
  loadStoredTables,
  saveStoredTables,
  loadStoredKitchen,
  saveStoredKitchen,
  loadStoredReceipts,
  saveStoredReceipts,
  loadStoredSettings,
  saveStoredSettings,
  AppSettings,
} from './utils/storage';
import { posAudio } from './utils/audio';
import { MesasSelector } from './components/MesasSelector';
import { PosOrderView } from './components/PosOrderView';
import { KitchenKds } from './components/KitchenKds';
import { SalesHistoryModal } from './components/SalesHistoryModal';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'mesas' | 'pedido' | 'cocina'>('mesas');
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [tables, setTables] = useState<ActiveTable[]>(loadStoredTables);
  const [kitchenOrders, setKitchenOrders] = useState<KitchenOrder[]>(loadStoredKitchen);
  const [receipts, setReceipts] = useState<PaymentReceipt[]>(loadStoredReceipts);
  const [settings, setSettings] = useState<AppSettings>(loadStoredSettings);
  const [showSalesModal, setShowSalesModal] = useState(false);

  // Sync state changes to local storage
  useEffect(() => {
    saveStoredTables(tables);
  }, [tables]);

  useEffect(() => {
    saveStoredKitchen(kitchenOrders);
  }, [kitchenOrders]);

  useEffect(() => {
    saveStoredReceipts(receipts);
  }, [receipts]);

  useEffect(() => {
    saveStoredSettings(settings);
    posAudio.toggleSound(settings.soundEnabled);
  }, [settings]);

  // Selected table reference
  const currentTable = tables.find((t) => t.id === selectedTableId) || null;

  const handleSelectTable = (tableId: string) => {
    setSelectedTableId(tableId);
    setCurrentScreen('pedido');
  };

  const handleUpdateTableItems = (tableId: string, newItems: OrderItem[]) => {
    setTables((prev) =>
      prev.map((t) => {
        if (t.id === tableId) {
          const status = newItems.length === 0 ? 'libre' : t.status === 'libre' ? 'activo' : t.status;
          return {
            ...t,
            items: newItems,
            status,
            openedAt: t.openedAt || Date.now(),
            waiterName: settings.waiterName,
          };
        }
        return t;
      })
    );
  };

  const handleSendToKitchen = (table: ActiveTable, itemsToSend: OrderItem[]) => {
    const isAddition = table.items.some((it) => it.sentToKitchen);
    const prevRound = table.currentRound || 1;
    const roundNumber = isAddition ? prevRound + 1 : 1;
    const orderNumber = table.orderNumber || Math.floor(Math.random() * 900 + 100);

    const stampedItems = itemsToSend.map((it) => ({
      ...it,
      sentToKitchen: true,
      round: roundNumber,
      sentAt: Date.now(),
    }));

    const newKitchenOrder: KitchenOrder = {
      id: `k-${Date.now()}`,
      orderNumber,
      tableLabel: table.label,
      tableType: table.type,
      customerName: table.customerName,
      items: stampedItems,
      status: 'pendiente',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      waiterName: settings.waiterName,
      isAddition,
      additionRound: roundNumber,
    };

    setKitchenOrders((prev) => [newKitchenOrder, ...prev]);

    setTables((prev) =>
      prev.map((t) => {
        if (t.id === table.id) {
          // Merge sent status to matching items in table
          const sentIds = new Set(itemsToSend.map((it) => it.id));
          const updatedTableItems = t.items.map((it) => {
            if (sentIds.has(it.id)) {
              return {
                ...it,
                sentToKitchen: true,
                round: it.round || roundNumber,
                sentAt: it.sentAt || Date.now(),
              };
            }
            return it;
          });

          return {
            ...t,
            customerName: table.customerName,
            address: table.address,
            status: 'cocina',
            orderNumber,
            currentRound: roundNumber,
            items: updatedTableItems,
            lastKitchenSendAt: Date.now(),
          };
        }
        return t;
      })
    );
  };

  const handleUpdateTableStatus = (tableId: string, status: TableStatus) => {
    setTables((prev) =>
      prev.map((t) => (t.id === tableId ? { ...t, status } : t))
    );
  };

  const handleCompletePayment = (receipt: PaymentReceipt) => {
    setReceipts((prev) => [receipt, ...prev]);

    // Reset and free table
    setTables((prev) =>
      prev.map((t) => {
        if (t.id === selectedTableId || t.label === receipt.tableLabel) {
          return {
            ...t,
            items: [],
            status: 'libre',
            customerName: undefined,
            phone: undefined,
            address: undefined,
            openedAt: undefined,
            lastKitchenSendAt: undefined,
            orderNumber: undefined,
            currentRound: 1,
          };
        }
        return t;
      })
    );

    // If we were inside the single order screen, return to mesas
    if (currentScreen === 'pedido') {
      setCurrentScreen('mesas');
      setSelectedTableId(null);
    }
  };

  const handleUpdateKitchenStatus = (
    orderId: string,
    status: 'pendiente' | 'preparando' | 'listo' | 'entregado'
  ) => {
    setKitchenOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, status, updatedAt: Date.now() } : o
      )
    );
  };

  const handleDeleteKitchenOrder = (orderId: string) => {
    setKitchenOrders((prev) => prev.filter((o) => o.id !== orderId));
  };

  const handleClearReceipts = () => {
    setReceipts([]);
  };

  return (
    <div className="w-full h-screen bg-[#0f172a] text-slate-100 overflow-hidden font-sans">
      {currentScreen === 'mesas' && (
        <MesasSelector
          tables={tables}
          kitchenOrders={kitchenOrders}
          waiterName={settings.waiterName}
          onChangeWaiterName={(name) =>
            setSettings((prev) => ({ ...prev, waiterName: name }))
          }
          onSelectTable={handleSelectTable}
          onOpenKitchen={() => setCurrentScreen('cocina')}
          onOpenSalesHistory={() => setShowSalesModal(true)}
          soundEnabled={settings.soundEnabled}
          onToggleSound={() =>
            setSettings((prev) => ({
              ...prev,
              soundEnabled: !prev.soundEnabled,
            }))
          }
        />
      )}

      {currentScreen === 'pedido' && currentTable && (
        <PosOrderView
          table={currentTable}
          waiterName={settings.waiterName}
          onBackToTables={() => {
            setCurrentScreen('mesas');
            setSelectedTableId(null);
          }}
          onUpdateTableItems={handleUpdateTableItems}
          onUpdateTableStatus={handleUpdateTableStatus}
          onSendToKitchen={handleSendToKitchen}
          onCompletePayment={handleCompletePayment}
        />
      )}

      {currentScreen === 'cocina' && (
        <KitchenKds
          orders={kitchenOrders}
          onBackToTables={() => setCurrentScreen('mesas')}
          onUpdateStatus={handleUpdateKitchenStatus}
          onDeleteOrder={handleDeleteKitchenOrder}
        />
      )}

      {showSalesModal && (
        <SalesHistoryModal
          receipts={receipts}
          tables={tables}
          onClose={() => setShowSalesModal(false)}
          onClearReceipts={handleClearReceipts}
          onCompletePayment={handleCompletePayment}
          onSelectTable={(tableId) => {
            setShowSalesModal(false);
            handleSelectTable(tableId);
          }}
        />
      )}
    </div>
  );
}
