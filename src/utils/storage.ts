import { ActiveTable, KitchenOrder, PaymentReceipt } from '../types';

const TABLES_KEY = 'pollos_sabor_tables_v1';
const KITCHEN_KEY = 'pollos_sabor_kitchen_v1';
const RECEIPTS_KEY = 'pollos_sabor_receipts_v1';
const SETTINGS_KEY = 'pollos_sabor_settings_v1';

export const INITIAL_TABLES: ActiveTable[] = [
  ...Array.from({ length: 30 }, (_, i) => ({
    id: `Mesa ${i + 1}`,
    label: `Mesa ${i + 1}`,
    type: 'mesa' as const,
    status: 'libre' as const,
    items: [],
  })),
  {
    id: 'Barra',
    label: 'Barra',
    type: 'barra' as const,
    status: 'libre' as const,
    items: [],
  },
  {
    id: 'Domicilio',
    label: 'Domicilio',
    type: 'domicilio' as const,
    status: 'libre' as const,
    items: [],
  },
];

export interface AppSettings {
  waiterName: string;
  restaurantName: string;
  nit: string;
  phone: string;
  address: string;
  soundEnabled: boolean;
  tableCount: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  waiterName: 'Mesero 1',
  restaurantName: 'POLLOS & SABOR',
  nit: '901.234.567-8',
  phone: '315 313 4721',
  address: 'Sede Principal',
  soundEnabled: true,
  tableCount: 30,
};

export const loadStoredTables = (): ActiveTable[] => {
  try {
    const raw = localStorage.getItem(TABLES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load stored tables', e);
  }
  return INITIAL_TABLES;
};

export const saveStoredTables = (tables: ActiveTable[]) => {
  try {
    localStorage.setItem(TABLES_KEY, JSON.stringify(tables));
  } catch (e) {
    console.error('Failed to save tables', e);
  }
};

export const loadStoredKitchen = (): KitchenOrder[] => {
  try {
    const raw = localStorage.getItem(KITCHEN_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  return [];
};

export const saveStoredKitchen = (orders: KitchenOrder[]) => {
  try {
    localStorage.setItem(KITCHEN_KEY, JSON.stringify(orders));
  } catch {}
};

export const loadStoredReceipts = (): PaymentReceipt[] => {
  try {
    const raw = localStorage.getItem(RECEIPTS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  return [];
};

export const saveStoredReceipts = (receipts: PaymentReceipt[]) => {
  try {
    localStorage.setItem(RECEIPTS_KEY, JSON.stringify(receipts));
  } catch {}
};

export const loadStoredSettings = (): AppSettings => {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch {}
  return DEFAULT_SETTINGS;
};

export const saveStoredSettings = (settings: AppSettings) => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {}
};
