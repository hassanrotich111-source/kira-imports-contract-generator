// localStorage data layer - replaces the entire backend
const STORAGE_KEY = "kira_contracts";
const SETTINGS_KEY = "kira_settings";

export interface Equipment {
  id: string;
  name: string;
  description: string;
  imageData: string; // base64
  buyingPrice: number;
  shippingFee: number;
  importerFee: number;
  quantity: number;
}

export interface Contract {
  id: string;
  contractNumber: string;
  contractDate: string; // YYYY-MM-DD
  buyerName: string;
  buyerId: string;
  buyerMobile: string;
  buyerBusinessName: string;
  paymentMethod: string;
  status: "draft" | "generated";
  createdAt: string;
  equipments: Equipment[];
}

export interface Settings {
  importerName: string;
  importerId: string;
  importerMobile: string;
  importerBusinessName: string;
  contractNumberPrefix: string;
  defaultPaymentMethod: string;
}

const defaultSettings: Settings = {
  importerName: "Diana Chepkirui",
  importerId: "39460195",
  importerMobile: "0792821836",
  importerBusinessName: "Kira Imports",
  contractNumberPrefix: "KIC",
  defaultPaymentMethod: "bank transfer",
};

// ---- Settings ----
export function getSettings(): Settings {
  const raw = localStorage.getItem(SETTINGS_KEY);
  return raw ? JSON.parse(raw) : { ...defaultSettings };
}

export function saveSettings(settings: Settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// ---- Contracts ----
function readContracts(): Contract[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function writeContracts(contracts: Contract[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(contracts));
}

export function listContracts(search?: string): Contract[] {
  let contracts = readContracts();
  if (search) {
    const s = search.toLowerCase();
    contracts = contracts.filter(
      (c) =>
        c.buyerName.toLowerCase().includes(s) ||
        c.contractNumber.toLowerCase().includes(s) ||
        c.buyerBusinessName.toLowerCase().includes(s)
    );
  }
  return contracts.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getContract(id: string): Contract | undefined {
  return readContracts().find((c) => c.id === id);
}

export function createContract(data: Omit<Contract, "id" | "contractNumber" | "createdAt" | "status">): Contract {
  const settings = getSettings();
  const contracts = readContracts();
  const nextNum = contracts.length + 1;
  const prefix = settings.contractNumberPrefix || "KIC";
  const contractNumber = `${prefix}-${String(nextNum).padStart(4, "0")}`;

  const contract: Contract = {
    ...data,
    id: crypto.randomUUID(),
    contractNumber,
    status: "draft",
    createdAt: new Date().toISOString(),
  };

  contracts.push(contract);
  writeContracts(contracts);
  return contract;
}

export function updateContract(id: string, data: Partial<Contract>): Contract | undefined {
  const contracts = readContracts();
  const idx = contracts.findIndex((c) => c.id === id);
  if (idx === -1) return undefined;
  contracts[idx] = { ...contracts[idx], ...data };
  writeContracts(contracts);
  return contracts[idx];
}

export function deleteContract(id: string) {
  const contracts = readContracts().filter((c) => c.id !== id);
  writeContracts(contracts);
}

// ---- Helpers ----
export function calcTotals(equipments: Equipment[]) {
  const totalBP = equipments.reduce((s, e) => s + (e.buyingPrice || 0), 0);
  const totalShipping = equipments.reduce((s, e) => s + (e.shippingFee || 0), 0);
  const totalImporterFee = equipments.reduce((s, e) => s + (e.importerFee || 0), 0);
  const grandTotal = totalBP + totalShipping + totalImporterFee;
  const upfrontPayment = totalBP + totalImporterFee;
  return { totalBP, totalShipping, totalImporterFee, grandTotal, upfrontPayment };
}

export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}

export function numberToWord(n: number): string {
  const words = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];
  return n <= 10 ? words[n] || String(n) : String(n);
}
