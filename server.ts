import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';
import { fileURLToPath } from 'url';
import type {
  Product,
  FinancialTransaction,
  Sale,
  SalesGoal,
  User,
  BusinessAnalytics,
  ComboSuggestion,
  PriceAuditAlert,
  CompanySettings,
} from './src/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Initialize Gemini SDK with telemetry header per skill instructions
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Data file path
const DATA_DIR = path.resolve(__dirname, 'data');
const DATA_FILE = path.resolve(DATA_DIR, 'store.json');

// Ensure directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial Mock Seed Data
const initialUsers: User[] = [
  {
    id: 'usr-admin-1',
    name: 'Helena Castro',
    email: 'admin@auramoda.com.br',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-seller-1',
    name: 'Camila Rocha',
    email: 'vendedor@auramoda.com.br',
    role: 'vendedor',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  },
];

const initialProducts: Product[] = [
  {
    id: 'prod-001',
    sku: 'PRAIA-BIQ-2026-01',
    name: 'Biquíni Cortininha Ripple Solar',
    category: 'moda_praia',
    description: 'Top cortininha com babadinho levanta-bumbum em tecido canelado acetinado com proteção UV50+.',
    color: 'Terracota / Dourado',
    sizes: [
      { size: 'P', quantity: 8 },
      { size: 'M', quantity: 14 },
      { size: 'G', quantity: 6 },
    ],
    totalStock: 28,
    minStockAlert: 8,
    costs: {
      itemCost: 38.0,
      supplierShipping: 3.5,
      packagingCost: 2.5,
      otherCosts: 1.0,
      totalCost: 45.0,
    },
    pricing: {
      cashMarkupPercent: 144.2,
      installmentMarkupPercent: 12.0,
      maxInstallments: 3,
      calculatedCashPrice: 109.9,
      calculatedInstallmentPrice: 123.0,
      calculatedInstallmentValue: 41.0,
      cashGrossProfit: 64.9,
      cashMarginPercent: 59.05,
    },
    salesCount: 42,
    lastSaleDate: '2026-09-22',
    daysWithoutSale: 1,
    createdAt: '2026-08-10',
    imageUrl: 'https://images.unsplash.com/photo-1582639510494-c80b5de9f148?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'prod-002',
    sku: 'PRAIA-MAI-2026-02',
    name: 'Maiô Sunset Cavado com Cinto',
    category: 'moda_praia',
    description: 'Maiô elegante com decote em V, cinto embutido e fivela resinada dourada anti-oxidação.',
    color: 'Verde Oliva',
    sizes: [
      { size: 'M', quantity: 10 },
      { size: 'G', quantity: 7 },
      { size: 'GG', quantity: 4 },
    ],
    totalStock: 21,
    minStockAlert: 6,
    costs: {
      itemCost: 62.0,
      supplierShipping: 4.0,
      packagingCost: 3.0,
      otherCosts: 2.0,
      totalCost: 71.0,
    },
    pricing: {
      cashMarkupPercent: 139.3,
      installmentMarkupPercent: 11.5,
      maxInstallments: 4,
      calculatedCashPrice: 169.9,
      calculatedInstallmentPrice: 189.9,
      calculatedInstallmentValue: 47.48,
      cashGrossProfit: 98.9,
      cashMarginPercent: 58.21,
    },
    salesCount: 26,
    lastSaleDate: '2026-09-20',
    daysWithoutSale: 3,
    createdAt: '2026-08-15',
    imageUrl: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'prod-003',
    sku: 'PRAIA-SAI-2026-03',
    name: 'Saída de Praia Chemise Rendada',
    category: 'moda_praia',
    description: 'Chemise longa em crepe leve com acabamentos em renda e botões de madrepérola.',
    color: 'Off-White',
    sizes: [
      { size: 'Único', quantity: 15 },
    ],
    totalStock: 15,
    minStockAlert: 5,
    costs: {
      itemCost: 48.0,
      supplierShipping: 3.5,
      packagingCost: 2.5,
      otherCosts: 1.0,
      totalCost: 55.0,
    },
    pricing: {
      cashMarkupPercent: 136.2,
      installmentMarkupPercent: 10.0,
      maxInstallments: 3,
      calculatedCashPrice: 129.9,
      calculatedInstallmentPrice: 142.9,
      calculatedInstallmentValue: 47.63,
      cashGrossProfit: 74.9,
      cashMarginPercent: 57.66,
    },
    salesCount: 31,
    lastSaleDate: '2026-09-21',
    daysWithoutSale: 2,
    createdAt: '2026-08-12',
    imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'prod-004',
    sku: 'INT-CONJ-2026-04',
    name: 'Conjunto Lingerie Renda Sofia',
    category: 'moda_intima',
    description: 'Sutiã com aro estruturado em renda floral macia e calcinha fio duplo conforto.',
    color: 'Preto / Pérola',
    sizes: [
      { size: 'P', quantity: 9 },
      { size: 'M', quantity: 16 },
      { size: 'G', quantity: 12 },
    ],
    totalStock: 37,
    minStockAlert: 10,
    costs: {
      itemCost: 34.0,
      supplierShipping: 2.5,
      packagingCost: 3.5,
      otherCosts: 1.0,
      totalCost: 41.0,
    },
    pricing: {
      cashMarkupPercent: 141.2,
      installmentMarkupPercent: 10.0,
      maxInstallments: 3,
      calculatedCashPrice: 98.9,
      calculatedInstallmentPrice: 108.9,
      calculatedInstallmentValue: 36.3,
      cashGrossProfit: 57.9,
      cashMarginPercent: 58.54,
    },
    salesCount: 54,
    lastSaleDate: '2026-09-23',
    daysWithoutSale: 0,
    createdAt: '2026-07-28',
    imageUrl: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'prod-005',
    sku: 'INT-ROBE-2026-05',
    name: 'Robe Acetinado Noite de Seda',
    category: 'moda_intima',
    description: 'Robe com toque de seda suave, mangas com detalhes em renda e faixa para amarração na cintura.',
    color: 'Rosé Nude',
    sizes: [
      { size: 'P/M', quantity: 6 },
      { size: 'G/GG', quantity: 5 },
    ],
    totalStock: 11,
    minStockAlert: 4,
    costs: {
      itemCost: 46.0,
      supplierShipping: 3.0,
      packagingCost: 3.5,
      otherCosts: 1.5,
      totalCost: 54.0,
    },
    pricing: {
      cashMarkupPercent: 159.1,
      installmentMarkupPercent: 10.0,
      maxInstallments: 3,
      calculatedCashPrice: 139.9,
      calculatedInstallmentPrice: 153.9,
      calculatedInstallmentValue: 51.3,
      cashGrossProfit: 85.9,
      cashMarginPercent: 61.4,
    },
    salesCount: 19,
    lastSaleDate: '2026-09-18',
    daysWithoutSale: 5,
    createdAt: '2026-08-01',
    imageUrl: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'prod-006',
    sku: 'INT-KIT-2026-06',
    name: 'Kit 3 Calcinhas Sem Costura Confort',
    category: 'moda_intima',
    description: 'Trio de calcinhas corte a laser que não marcam sob biquínis, vestidos e calças.',
    color: 'Nude / Preto / Branco',
    sizes: [
      { size: 'P', quantity: 20 },
      { size: 'M', quantity: 28 },
      { size: 'G', quantity: 18 },
    ],
    totalStock: 66,
    minStockAlert: 15,
    costs: {
      itemCost: 19.5,
      supplierShipping: 1.5,
      packagingCost: 2.0,
      otherCosts: 0.5,
      totalCost: 23.5,
    },
    pricing: {
      cashMarkupPercent: 154.9,
      installmentMarkupPercent: 8.5,
      maxInstallments: 2,
      calculatedCashPrice: 59.9,
      calculatedInstallmentPrice: 65.0,
      calculatedInstallmentValue: 32.5,
      cashGrossProfit: 36.4,
      cashMarginPercent: 60.77,
    },
    salesCount: 68,
    lastSaleDate: '2026-09-23',
    daysWithoutSale: 0,
    createdAt: '2026-07-15',
    imageUrl: 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'prod-007',
    sku: 'PRAIA-HOT-2026-07',
    name: 'Biquíni Hot Pant Neon Sunset',
    category: 'moda_praia',
    description: 'Modelo cintura alta vintage com bojo estruturado em tecido neon especial.',
    color: 'Coral Neon',
    sizes: [
      { size: 'M', quantity: 9 },
      { size: 'G', quantity: 7 },
    ],
    totalStock: 16,
    minStockAlert: 5,
    costs: {
      itemCost: 47.0,
      supplierShipping: 3.5,
      packagingCost: 2.5,
      otherCosts: 1.0,
      totalCost: 54.0,
    },
    pricing: {
      cashMarkupPercent: 159.1,
      installmentMarkupPercent: 10.0,
      maxInstallments: 3,
      calculatedCashPrice: 139.9,
      calculatedInstallmentPrice: 153.9,
      calculatedInstallmentValue: 51.3,
      cashGrossProfit: 85.9,
      cashMarginPercent: 61.4,
    },
    salesCount: 3,
    lastSaleDate: '2026-07-18',
    daysWithoutSale: 67, // PEÇA ENCALHADA! Capital parado
    createdAt: '2026-06-20',
    imageUrl: 'https://images.unsplash.com/photo-1516762689617-e1cffcef479d?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'prod-008',
    sku: 'PRAIA-TOP-2026-08',
    name: 'Top Faixa Lastex Bojo Removível',
    category: 'moda_praia',
    description: 'Top versátil que pode ser usado na praia ou como cropped em looks urbanos.',
    color: 'Azul Turquesa',
    sizes: [
      { size: 'P', quantity: 2 },
      { size: 'M', quantity: 1 },
    ],
    totalStock: 3, // ESTOQUE CRÍTICO
    minStockAlert: 6,
    costs: {
      itemCost: 35.0,
      supplierShipping: 3.0,
      packagingCost: 2.0,
      otherCosts: 1.0,
      totalCost: 41.0,
    },
    pricing: {
      cashMarkupPercent: 46.1, // MARGEM BAIXA / ALERTA DE PRECIFICAÇÃO
      installmentMarkupPercent: 8.0,
      maxInstallments: 2,
      calculatedCashPrice: 59.9,
      calculatedInstallmentPrice: 64.9,
      calculatedInstallmentValue: 32.45,
      cashGrossProfit: 18.9,
      cashMarginPercent: 31.55,
    },
    salesCount: 18,
    lastSaleDate: '2026-09-15',
    daysWithoutSale: 8,
    createdAt: '2026-08-05',
    imageUrl: 'https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?w=500&auto=format&fit=crop&q=80',
  },
];

const initialFinancials: FinancialTransaction[] = [
  {
    id: 'fin-001',
    type: 'despesa',
    category: 'fornecedor_pecas',
    description: 'Confecção Mar & Sol - Lote Biquínis Canelados UV50+',
    amount: 1950.0,
    dueDate: '2026-09-28',
    status: 'pendente',
    createdAt: '2026-09-10',
  },
  {
    id: 'fin-002',
    type: 'despesa',
    category: 'embalagens',
    description: 'Gráfica Boutique - 500 Sacolas Kraft personalizadas + Papel de Seda',
    amount: 680.0,
    dueDate: '2026-09-25',
    status: 'pendente',
    createdAt: '2026-09-15',
  },
  {
    id: 'fin-003',
    type: 'despesa',
    category: 'aluguel_loja',
    description: 'Aluguel Showroom & Espaço Físico',
    amount: 2200.0,
    dueDate: '2026-09-10',
    paymentDate: '2026-09-09',
    status: 'pago',
    paymentMethod: 'pix',
    createdAt: '2026-09-01',
  },
  {
    id: 'fin-004',
    type: 'despesa',
    category: 'energia_agua_internet',
    description: 'Luz comercial & Fibra Óptica Loja',
    amount: 345.5,
    dueDate: '2026-09-15',
    paymentDate: '2026-09-14',
    status: 'pago',
    paymentMethod: 'boleto',
    createdAt: '2026-09-02',
  },
  {
    id: 'fin-005',
    type: 'despesa',
    category: 'marketing_anuncios',
    description: 'Campanha Tráfego Pago Instagram (Coleção Verão & Lingerie)',
    amount: 500.0,
    dueDate: '2026-09-20',
    status: 'vencido', // CONTA VENCIDA PARA ALERTA
    createdAt: '2026-09-05',
  },
  {
    id: 'fin-006',
    type: 'receita',
    category: 'venda_loja',
    description: 'Venda Balcão #VND-1048 - Camila Rocha (Pix)',
    amount: 339.7,
    dueDate: '2026-09-22',
    paymentDate: '2026-09-22',
    status: 'recebido',
    paymentMethod: 'pix',
    createdAt: '2026-09-22',
  },
  {
    id: 'fin-007',
    type: 'receita',
    category: 'venda_loja',
    description: 'Recebimento Cartão Crédito (Venda #VND-1049 em 3x)',
    amount: 469.8,
    dueDate: '2026-09-30',
    status: 'pendente', // CONTAS A RECEBER
    paymentMethod: 'cartao_credito',
    createdAt: '2026-09-23',
  },
  {
    id: 'fin-008',
    type: 'receita',
    category: 'venda_loja',
    description: 'Venda Loja #VND-1045 - Helena Castro (Dinheiro)',
    amount: 198.8,
    dueDate: '2026-09-21',
    paymentDate: '2026-09-21',
    status: 'recebido',
    paymentMethod: 'dinheiro',
    createdAt: '2026-09-21',
  },
  {
    id: 'fin-009',
    type: 'receita',
    category: 'venda_loja',
    description: 'Recebimento Maquininha Cartão de Débito',
    amount: 620.0,
    dueDate: '2026-09-23',
    paymentDate: '2026-09-23',
    status: 'recebido',
    paymentMethod: 'cartao_debito',
    createdAt: '2026-09-23',
  },
];

const initialSales: Sale[] = [
  {
    id: 'sale-001',
    code: 'VND-1047',
    customerName: 'Mariana Lima',
    sellerName: 'Camila Rocha',
    date: '2026-09-21T14:20:00Z',
    items: [
      {
        productId: 'prod-001',
        productName: 'Biquíni Cortininha Ripple Solar',
        sku: 'PRAIA-BIQ-2026-01',
        size: 'M',
        quantity: 1,
        unitPrice: 109.9,
        unitCost: 45.0,
        total: 109.9,
      },
      {
        productId: 'prod-003',
        productName: 'Saída de Praia Chemise Rendada',
        sku: 'PRAIA-SAI-2026-03',
        size: 'Único',
        quantity: 1,
        unitPrice: 129.9,
        unitCost: 55.0,
        total: 129.9,
      },
    ],
    totalAmount: 239.8,
    totalCost: 100.0,
    profit: 139.8,
    paymentMethod: 'pix',
  },
  {
    id: 'sale-002',
    code: 'VND-1048',
    customerName: 'Isabela Fontes',
    sellerName: 'Camila Rocha',
    date: '2026-09-22T16:45:00Z',
    items: [
      {
        productId: 'prod-004',
        productName: 'Conjunto Lingerie Renda Sofia',
        sku: 'INT-CONJ-2026-04',
        size: 'M',
        quantity: 1,
        unitPrice: 98.9,
        unitCost: 41.0,
        total: 98.9,
      },
      {
        productId: 'prod-005',
        productName: 'Robe Acetinado Noite de Seda',
        sku: 'INT-ROBE-2026-05',
        size: 'P/M',
        quantity: 1,
        unitPrice: 139.9,
        unitCost: 54.0,
        total: 139.9,
      },
      {
        productId: 'prod-006',
        productName: 'Kit 3 Calcinhas Sem Costura Confort',
        sku: 'INT-KIT-2026-06',
        size: 'M',
        quantity: 1,
        unitPrice: 59.9,
        unitCost: 23.5,
        total: 59.9,
      },
    ],
    totalAmount: 298.7,
    totalCost: 118.5,
    profit: 180.2,
    paymentMethod: 'cartao_credito',
    installments: 3,
  },
  {
    id: 'sale-003',
    code: 'VND-1049',
    customerName: 'Carolina Meireles',
    sellerName: 'Helena Castro',
    date: '2026-09-23T11:15:00Z',
    items: [
      {
        productId: 'prod-002',
        productName: 'Maiô Sunset Cavado com Cinto',
        sku: 'PRAIA-MAI-2026-02',
        size: 'M',
        quantity: 2,
        unitPrice: 169.9,
        unitCost: 71.0,
        total: 339.8,
      },
      {
        productId: 'prod-003',
        productName: 'Saída de Praia Chemise Rendada',
        sku: 'PRAIA-SAI-2026-03',
        size: 'Único',
        quantity: 1,
        unitPrice: 129.9,
        unitCost: 55.0,
        total: 129.9,
      },
    ],
    totalAmount: 469.7,
    totalCost: 197.0,
    profit: 272.7,
    paymentMethod: 'cartao_credito',
    installments: 3,
  },
];

const initialGoals = {
  day: {
    id: 'goal-day',
    period: 'dia' as const,
    targetAmount: 800.0,
    currentAmount: 469.7,
    targetTicket: 180.0,
    currentTicket: 234.85,
    totalSalesCount: 2,
  },
  week: {
    id: 'goal-week',
    period: 'semana' as const,
    targetAmount: 5000.0,
    currentAmount: 3680.0,
    targetTicket: 180.0,
    currentTicket: 193.68,
    totalSalesCount: 19,
  },
  month: {
    id: 'goal-month',
    period: 'mes' as const,
    targetAmount: 22000.0,
    currentAmount: 16840.0,
    targetTicket: 185.0,
    currentTicket: 191.36,
    totalSalesCount: 88,
  },
};

// Store interface
interface StoreData {
  company?: CompanySettings;
  users: User[];
  products: Product[];
  financials: FinancialTransaction[];
  sales: Sale[];
  goals: typeof initialGoals;
  supabaseConfig?: {
    url: string;
    anonKey: string;
    connected: boolean;
  };
}

// In-memory store with file sync
let store: StoreData = {
  company: {
    name: 'Minha Marca',
    segment: 'Moda Praia & Vestuário',
    receiptMessage: 'Agradecemos a sua preferência! Trocas em até 15 dias com a etiqueta fixada na peça.',
  },
  users: initialUsers,
  products: initialProducts,
  financials: initialFinancials,
  sales: initialSales,
  goals: initialGoals,
  supabaseConfig: {
    url: '',
    anonKey: '',
    connected: false,
  },
};

function loadStore() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      store = { ...store, ...parsed };
    } else {
      saveStore();
    }
  } catch (err) {
    console.error('Error loading store, using defaults:', err);
  }
}

function saveStore() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving store:', err);
  }
}

loadStore();

// ===================== HELPER FUNCTIONS =====================
function generateSku(category: string, name: string): string {
  const catPrefix =
    category === 'moda_praia'
      ? 'PRAIA'
      : category === 'moda_intima'
      ? 'INT'
      : category === 'vestuario'
      ? 'VEST'
      : 'ACSS';

  const cleanName = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 4);

  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const year = new Date().getFullYear();

  return `${catPrefix}-${cleanName || 'ITEM'}-${year}-${randomNum}`;
}

function calculateAnalytics(): BusinessAnalytics {
  const products = store.products;
  const sales = store.sales;

  // Best Sellers (ordenados por volume de vendas)
  const bestSellers = [...products].sort((a, b) => b.salesCount - a.salesCount).slice(0, 4);

  // Dead Stock / Peças Encalhadas (mais de 30 dias sem venda ou sem vendas recentes e com estoque)
  const deadStock = [...products]
    .filter((p) => p.totalStock > 0 && (p.daysWithoutSale >= 30 || (p.salesCount <= 5 && p.totalStock >= 10)))
    .sort((a, b) => b.daysWithoutSale - a.daysWithoutSale);

  // Combos sugeridos estrategicamente (cross-selling moda praia e lingerie)
  const combos: ComboSuggestion[] = [
    {
      id: 'combo-001',
      title: 'Combo Sunset Beach Club',
      category: 'Moda Praia Completa',
      productIds: ['prod-001', 'prod-003'],
      productNames: ['Biquíni Cortininha Ripple Solar', 'Saída de Praia Chemise Rendada'],
      originalTotal: 109.9 + 129.9, // 239.80
      comboPrice: 209.9,
      discountPercent: 12.5,
      estimatedMarginPercent: 52.4,
      strategicReason:
        'Aumenta o ticket médio em +91% comparado à venda individual do biquíni. A chemise tem alta margem e estimula a compra de look completo.',
    },
    {
      id: 'combo-002',
      title: 'Combo Noite de Renda & Seda',
      category: 'Lingerie Premium',
      productIds: ['prod-004', 'prod-005'],
      productNames: ['Conjunto Lingerie Renda Sofia', 'Robe Acetinado Noite de Seda'],
      originalTotal: 98.9 + 139.9, // 238.80
      comboPrice: 214.9,
      discountPercent: 10.0,
      estimatedMarginPercent: 55.8,
      strategicReason:
        'Excelente apelo para presentes e noivas. Eleva o ticket da lingerie básica em mais de 117% através do robe acetinado.',
    },
    {
      id: 'combo-003',
      title: 'Combo Desova Fashion: Hot Pant + Top Faixa',
      category: 'Liquidação Estratégica',
      productIds: ['prod-007', 'prod-008'],
      productNames: ['Biquíni Hot Pant Neon Sunset', 'Top Faixa Lastex Bojo Removível'],
      originalTotal: 139.9 + 59.9, // 199.80
      comboPrice: 159.9,
      discountPercent: 20.0,
      estimatedMarginPercent: 40.5,
      strategicReason:
        'Acelera a saída da Hot Pant que está parada há 67 dias liberando R$ 864 em capital de giro sem gerar prejuízo.',
    },
  ];

  // Auditoria de Preços & Recomendações
  const priceAudits: PriceAuditAlert[] = [];

  products.forEach((prod) => {
    // 1. Margem de contribuição baixa (< 40%)
    if (prod.pricing.cashMarginPercent < 40) {
      priceAudits.push({
        id: `audit-margin-${prod.id}`,
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        currentCashPrice: prod.pricing.calculatedCashPrice,
        totalCost: prod.costs.totalCost,
        currentMarginPercent: prod.pricing.cashMarginPercent,
        issueType: 'margem_baixa',
        severity: 'urgente',
        title: 'Margem Bruta Abaixo do Limite de Segurança',
        description: `A margem atual de ${prod.pricing.cashMarginPercent.toFixed(1)}% é insuficiente para cobrir impostos, custos fixos e gerar lucro real no varejo de moda.`,
        suggestedAction: 'Aumentar o preço à vista para no mínimo R$ 82,00 (margem mínima de 50%).',
        suggestedPrice: Number((prod.costs.totalCost * 2.0).toFixed(2)),
      });
    }

    // 2. Peça Encalhada há muito tempo
    if (prod.daysWithoutSale >= 45 && prod.totalStock > 0) {
      const suggestedDiscount = 20;
      const discountedPrice = Number((prod.pricing.calculatedCashPrice * (1 - suggestedDiscount / 100)).toFixed(2));
      const newMargin = Number((((discountedPrice - prod.costs.totalCost) / discountedPrice) * 100).toFixed(1));

      priceAudits.push({
        id: `audit-dead-${prod.id}`,
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        currentCashPrice: prod.pricing.calculatedCashPrice,
        totalCost: prod.costs.totalCost,
        currentMarginPercent: prod.pricing.cashMarginPercent,
        issueType: 'encalhado',
        severity: 'aviso',
        title: `Giro Parado há ${prod.daysWithoutSale} Dias (${prod.totalStock} peças em estoque)`,
        description: `Capital estagnado no estoque de R$ ${(prod.costs.totalCost * prod.totalStock).toFixed(2)}. Cada dia parado gera custo de oportunidade.`,
        suggestedAction: `Aplicar promoção relâmpago de ${suggestedDiscount}% de desconto. Margem residual será saudável (${newMargin}%).`,
        suggestedDiscountPercent: suggestedDiscount,
        suggestedPrice: discountedPrice,
      });
    }

    // 3. Estoque Crítico
    if (prod.totalStock <= prod.minStockAlert && prod.salesCount > 10) {
      priceAudits.push({
        id: `audit-stock-${prod.id}`,
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        currentCashPrice: prod.pricing.calculatedCashPrice,
        totalCost: prod.costs.totalCost,
        currentMarginPercent: prod.pricing.cashMarginPercent,
        issueType: 'estoque_critico',
        severity: 'urgente',
        title: `Estoque Crítico (${prod.totalStock} un restantes)`,
        description: `Produto com boa saída (${prod.salesCount} vendas) atingiu nível de reposição. Risco de ruptura de vendas.`,
        suggestedAction: 'Fazer pedido imediato ao fornecedor para não perder vendas do fim de semana.',
      });
    }
  });

  // Totais de inventário
  const totalInventoryValueCost = products.reduce((acc, p) => acc + p.costs.totalCost * p.totalStock, 0);
  const totalInventoryValueRetail = products.reduce(
    (acc, p) => acc + p.pricing.calculatedCashPrice * p.totalStock,
    0
  );
  const potentialProfit = totalInventoryValueRetail - totalInventoryValueCost;
  const stagnantCapital = deadStock.reduce((acc, p) => acc + p.costs.totalCost * p.totalStock, 0);

  // Ticket médio das vendas cadastradas
  const totalSalesRevenue = sales.reduce((acc, s) => acc + s.totalAmount, 0);
  const averageTicket = sales.length > 0 ? totalSalesRevenue / sales.length : 0;

  return {
    bestSellers,
    deadStock,
    combos,
    goals: store.goals,
    priceAudits,
    summary: {
      totalInventoryValueCost: Number(totalInventoryValueCost.toFixed(2)),
      totalInventoryValueRetail: Number(totalInventoryValueRetail.toFixed(2)),
      potentialProfit: Number(potentialProfit.toFixed(2)),
      stagnantCapital: Number(stagnantCapital.toFixed(2)),
      averageTicket: Number(averageTicket.toFixed(2)),
      monthlySalesTotal: store.goals.month.currentAmount,
    },
  };
}

// ===================== COMPANY SETTINGS ROUTES =====================
app.get('/api/company', (_req: Request, res: Response) => {
  const defaultCompany: CompanySettings = {
    name: 'Minha Marca',
    segment: 'Moda Praia & Vestuário',
    receiptMessage: 'Agradecemos a sua preferência! Trocas em até 15 dias com a etiqueta fixada na peça.',
  };
  res.json({ company: store.company || defaultCompany });
});

app.post('/api/company', (req: Request, res: Response) => {
  const { company } = req.body;
  if (!company || typeof company !== 'object') {
    return res.status(400).json({ error: 'Dados da empresa são obrigatórios' });
  }
  store.company = company;
  saveStore();
  res.json({ success: true, company: store.company });
});

// ===================== RESET / CLEAN DATA ROUTE =====================
app.post('/api/reset-data', (_req: Request, res: Response) => {
  store.products = [];
  store.financials = [];
  store.sales = [];
  store.goals = {
    day: { id: 'goal-day', period: 'dia', targetAmount: 1000, currentAmount: 0, targetTicket: 150, currentTicket: 0, totalSalesCount: 0 },
    week: { id: 'goal-week', period: 'semana', targetAmount: 6000, currentAmount: 0, targetTicket: 150, currentTicket: 0, totalSalesCount: 0 },
    month: { id: 'goal-month', period: 'mes', targetAmount: 25000, currentAmount: 0, targetTicket: 150, currentTicket: 0, totalSalesCount: 0 },
  };
  saveStore();
  res.json({ success: true, message: 'Dados de teste removidos com sucesso!' });
});

// ===================== AUTH ROUTES =====================
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'E-mail é obrigatório' });
  }

  // Find user
  const user = store.users.find((u) => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    return res.status(401).json({ error: 'Credenciais inválidas. Usuário não encontrado.' });
  }

  // Simple password check (demonstration mode handles admin123 or vendedor123)
  if (password !== 'admin123' && password !== 'vendedor123' && password !== '123456') {
    return res.status(401).json({ error: 'Senha incorreta. Dica: use "admin123" ou "vendedor123".' });
  }

  // Issue session token
  const token = Buffer.from(JSON.stringify({ id: user.id, role: user.role, time: Date.now() })).toString('base64');

  return res.json({
    user,
    token,
    message: 'Autenticado com sucesso!',
  });
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    // Default to admin for seamless first view if not signed in
    return res.json({ user: store.users[0] });
  }

  try {
    const token = authHeader.replace('Bearer ', '');
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
    const user = store.users.find((u) => u.id === decoded.id);
    if (user) {
      return res.json({ user });
    }
  } catch {
    // ignore
  }

  return res.json({ user: store.users[0] });
});

// ===================== PRODUCTS ROUTES =====================
app.get('/api/products', (_req: Request, res: Response) => {
  res.json({ products: store.products });
});

app.post('/api/products/generate-sku', (req: Request, res: Response) => {
  const { category, name } = req.body;
  const sku = generateSku(category || 'moda_praia', name || 'PECA');
  res.json({ sku });
});

app.post('/api/products', (req: Request, res: Response) => {
  try {
    const data = req.body;
    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      sku: data.sku || generateSku(data.category, data.name),
      name: data.name,
      category: data.category || 'moda_praia',
      description: data.description || '',
      color: data.color || '',
      sizes: data.sizes || [{ size: 'M', quantity: 1 }],
      totalStock: (data.sizes || []).reduce((acc: number, s: { quantity: number }) => acc + (Number(s.quantity) || 0), 0),
      minStockAlert: Number(data.minStockAlert) || 5,
      costs: {
        itemCost: Number(data.costs?.itemCost) || 0,
        supplierShipping: Number(data.costs?.supplierShipping) || 0,
        packagingCost: Number(data.costs?.packagingCost) || 0,
        otherCosts: Number(data.costs?.otherCosts) || 0,
        totalCost:
          (Number(data.costs?.itemCost) || 0) +
          (Number(data.costs?.supplierShipping) || 0) +
          (Number(data.costs?.packagingCost) || 0) +
          (Number(data.costs?.otherCosts) || 0),
      },
      pricing: {
        cashMarkupPercent: Number(data.pricing?.cashMarkupPercent) || 120,
        installmentMarkupPercent: Number(data.pricing?.installmentMarkupPercent) || 12,
        maxInstallments: Number(data.pricing?.maxInstallments) || 3,
        calculatedCashPrice: Number(data.pricing?.calculatedCashPrice) || 0,
        calculatedInstallmentPrice: Number(data.pricing?.calculatedInstallmentPrice) || 0,
        calculatedInstallmentValue: Number(data.pricing?.calculatedInstallmentValue) || 0,
        cashGrossProfit: Number(data.pricing?.cashGrossProfit) || 0,
        cashMarginPercent: Number(data.pricing?.cashMarginPercent) || 0,
      },
      salesCount: 0,
      daysWithoutSale: 0,
      createdAt: new Date().toISOString().split('T')[0],
      imageUrl:
        data.imageUrl ||
        'https://images.unsplash.com/photo-1523381294911-8d3cead13475?w=500&auto=format&fit=crop&q=80',
    };

    store.products.unshift(newProduct);
    saveStore();

    res.status(201).json({ product: newProduct, message: 'Peça cadastrada com sucesso!' });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro ao cadastrar peça' });
  }
});

app.put('/api/products/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = store.products.findIndex((p) => p.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Produto não encontrado' });
  }

  const existing = store.products[index];
  const update = req.body;

  const updatedTotalStock = update.sizes
    ? update.sizes.reduce((acc: number, s: { quantity: number }) => acc + (Number(s.quantity) || 0), 0)
    : existing.totalStock;

  const updatedProduct: Product = {
    ...existing,
    ...update,
    totalStock: updatedTotalStock,
  };

  store.products[index] = updatedProduct;
  saveStore();

  res.json({ product: updatedProduct, message: 'Produto atualizado com sucesso!' });
});

app.delete('/api/products/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const initialLen = store.products.length;
  store.products = store.products.filter((p) => p.id !== id);

  if (store.products.length === initialLen) {
    return res.status(404).json({ error: 'Produto não encontrado' });
  }

  saveStore();
  res.json({ success: true, message: 'Peça excluída do catálogo.' });
});

// ===================== FINANCIAL ROUTES =====================
app.get('/api/financials', (_req: Request, res: Response) => {
  res.json({
    transactions: store.financials,
  });
});

app.post('/api/financials', (req: Request, res: Response) => {
  try {
    const data = req.body;
    const newTx: FinancialTransaction = {
      id: `fin-${Date.now()}`,
      type: data.type || 'despesa',
      category: data.category || 'outros',
      description: data.description,
      amount: Number(data.amount) || 0,
      dueDate: data.dueDate || new Date().toISOString().split('T')[0],
      paymentDate: data.paymentDate,
      status: data.status || 'pendente',
      paymentMethod: data.paymentMethod,
      createdAt: new Date().toISOString().split('T')[0],
    };

    store.financials.unshift(newTx);
    saveStore();

    res.status(201).json({ transaction: newTx, message: 'Lançamento financeiro registrado com sucesso!' });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Erro ao registrar movimentação financeira' });
  }
});

app.put('/api/financials/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = store.financials.findIndex((f) => f.id === id);

  if (idx === -1) {
    return res.status(404).json({ error: 'Lançamento financeiro não encontrado' });
  }

  store.financials[idx] = { ...store.financials[idx], ...req.body };
  saveStore();

  res.json({ transaction: store.financials[idx], message: 'Lançamento atualizado!' });
});

app.delete('/api/financials/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  store.financials = store.financials.filter((f) => f.id !== id);
  saveStore();
  res.json({ success: true, message: 'Registro financeiro removido' });
});

// ===================== SALES / PDV ROUTES =====================
app.get('/api/sales', (_req: Request, res: Response) => {
  res.json({ sales: store.sales });
});

app.post('/api/sales', (req: Request, res: Response) => {
  try {
    const { items, customerName, sellerName, paymentMethod, installments } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ error: 'Nenhum item na venda' });
    }

    let totalAmount = 0;
    let totalCost = 0;

    // Deduct inventory stock
    for (const item of items) {
      const prod = store.products.find((p) => p.id === item.productId);
      if (prod) {
        // Decrease size stock
        const sizeObj = prod.sizes.find((s) => s.size === item.size);
        if (sizeObj) {
          sizeObj.quantity = Math.max(0, sizeObj.quantity - item.quantity);
        }
        prod.totalStock = prod.sizes.reduce((acc, s) => acc + s.quantity, 0);
        prod.salesCount += item.quantity;
        prod.lastSaleDate = new Date().toISOString().split('T')[0];
        prod.daysWithoutSale = 0;
      }
      totalAmount += item.unitPrice * item.quantity;
      totalCost += item.unitCost * item.quantity;
    }

    const saleCode = `VND-${Math.floor(1000 + Math.random() * 9000)}`;
    const newSale: Sale = {
      id: `sale-${Date.now()}`,
      code: saleCode,
      items,
      totalAmount: Number(totalAmount.toFixed(2)),
      totalCost: Number(totalCost.toFixed(2)),
      profit: Number((totalAmount - totalCost).toFixed(2)),
      paymentMethod: paymentMethod || 'pix',
      installments: installments || 1,
      customerName: customerName || 'Cliente Balcão',
      sellerName: sellerName || 'Atendente',
      date: new Date().toISOString(),
    };

    store.sales.unshift(newSale);

    // Create corresponding financial transaction
    const finTx: FinancialTransaction = {
      id: `fin-sale-${Date.now()}`,
      type: 'receita',
      category: 'venda_loja',
      description: `Venda ${saleCode} - ${customerName || 'Balcão'} (${paymentMethod})`,
      amount: newSale.totalAmount,
      dueDate: new Date().toISOString().split('T')[0],
      paymentDate: paymentMethod === 'a_prazo' ? undefined : new Date().toISOString().split('T')[0],
      status: paymentMethod === 'a_prazo' ? 'pendente' : 'recebido',
      paymentMethod,
      referenceId: newSale.id,
      createdAt: new Date().toISOString().split('T')[0],
    };

    store.financials.unshift(finTx);

    // Update goals
    store.goals.day.currentAmount += newSale.totalAmount;
    store.goals.day.totalSalesCount += 1;
    store.goals.day.currentTicket = store.goals.day.currentAmount / store.goals.day.totalSalesCount;

    store.goals.week.currentAmount += newSale.totalAmount;
    store.goals.week.totalSalesCount += 1;
    store.goals.week.currentTicket = store.goals.week.currentAmount / store.goals.week.totalSalesCount;

    store.goals.month.currentAmount += newSale.totalAmount;
    store.goals.month.totalSalesCount += 1;
    store.goals.month.currentTicket = store.goals.month.currentAmount / store.goals.month.totalSalesCount;

    saveStore();

    res.status(201).json({ sale: newSale, message: 'Venda finalizada com sucesso e estoque atualizado!' });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Erro ao registrar venda' });
  }
});

// Update Goals
app.put('/api/goals', (req: Request, res: Response) => {
  const { dayTarget, weekTarget, monthTarget, dayTicket, weekTicket, monthTicket } = req.body;

  if (dayTarget !== undefined) store.goals.day.targetAmount = Number(dayTarget);
  if (weekTarget !== undefined) store.goals.week.targetAmount = Number(weekTarget);
  if (monthTarget !== undefined) store.goals.month.targetAmount = Number(monthTarget);

  if (dayTicket !== undefined) store.goals.day.targetTicket = Number(dayTicket);
  if (weekTicket !== undefined) store.goals.week.targetTicket = Number(weekTicket);
  if (monthTicket !== undefined) store.goals.month.targetTicket = Number(monthTicket);

  saveStore();
  res.json({ goals: store.goals, message: 'Metas comerciais atualizadas com sucesso!' });
});

// ===================== AI & BUSINESS ANALYTICS =====================
app.get('/api/ai/analytics', (_req: Request, res: Response) => {
  const analytics = calculateAnalytics();
  res.json(analytics);
});

app.post('/api/ai/generate-insights', async (req: Request, res: Response) => {
  try {
    const analytics = calculateAnalytics();
    const promptFocus = req.body.focus || 'geral';

    const storeSummaryText = `
Loja: Aura Moda (Especializada em Moda Praia, Lingerie e Homewear)
Resumo Atual:
- Faturamento do Mês: R$ ${analytics.summary.monthlySalesTotal.toFixed(2)} (Meta: R$ ${analytics.goals.month.targetAmount.toFixed(2)} - Atingido: ${((analytics.summary.monthlySalesTotal / analytics.goals.month.targetAmount) * 100).toFixed(1)}%)
- Ticket Médio Atual: R$ ${analytics.summary.averageTicket.toFixed(2)} (Meta: R$ ${analytics.goals.month.targetTicket.toFixed(2)})
- Valor Total do Estoque (Custo): R$ ${analytics.summary.totalInventoryValueCost.toFixed(2)}
- Valor Total do Estoque (Venda): R$ ${analytics.summary.totalInventoryValueRetail.toFixed(2)}
- Capital Parado em Peças Encalhadas: R$ ${analytics.summary.stagnantCapital.toFixed(2)}
- Peças com Alerta de Preço/Margem: ${analytics.priceAudits.length} itens

Peças Mais Vendidas:
${analytics.bestSellers.map((b) => `- ${b.name} (${b.category}): ${b.salesCount} vendas, Preço: R$ ${b.pricing.calculatedCashPrice.toFixed(2)}, Margem: ${b.pricing.cashMarginPercent.toFixed(1)}%`).join('\n')}

Peças com Baixo Giro / Encalhadas:
${analytics.deadStock.map((d) => `- ${d.name}: Estoque de ${d.totalStock} un, Sem vendas há ${d.daysWithoutSale} dias, Capital Parado: R$ ${(d.costs.totalCost * d.totalStock).toFixed(2)}`).join('\n')}

Alertas Críticos de Precificação:
${analytics.priceAudits.map((a) => `- [${a.severity.toUpperCase()}] ${a.productName}: ${a.title} - Ação: ${a.suggestedAction}`).join('\n')}
`;

    const systemPrompt = `Você é o Diretor Comercial e Consultor Executivo de Varejo de Moda da loja "Aura Moda".
Seu tom é profissional, ágil, encorajador e baseado em técnicas consolidadas de administração de empresas e varejo de moda (Curva ABC, Margem de Contribuição, Markup Divisor, Giro de Estoque e Cross-Selling de Moda Praia/Lingerie).
Responda sempre em português claro, elegante e diretamente aplicável com tópicos acionáveis.
Use emojis sutis e formatação Markdown limpa com subtítulos bem organizados.`;

    const userPrompt = `Com base nos dados em tempo real da loja, gere um Plano Tático Executivo de Planejamento de Vendas:
Foco da Análise Solicitada: ${promptFocus.toUpperCase()}

Dados da Loja:
${storeSummaryText}

Por favor, estruture seu plano tático em 4 seções principais:
1. 🎯 Diagnóstico Rápido de Vendas e Atingimento de Metas (Dia, Semana, Mês)
2. 💡 Estratégia de Combos e Elevação do Ticket Médio (Quais peças casar e como a vendedora deve abordar a cliente)
3. 📦 Plano de Choque para Desovar Peças Encalhadas (Sem destruir a percepção de valor da marca nem dar prejuízo)
4. ⚖️ Auditoria de Precificação e Markup (Ajustes de preços recomendados com base nas margens de contribuição)
Termine com 3 Ações Imediatas para Executar Hoje na Loja.`;

    if (!apiKey) {
      // Fallback response if GEMINI_API_KEY is not set
      return res.json({
        insights: `### 🎯 Diagnóstico Executivo de Vendas (Aura Moda)

**Status das Metas:**
- Atingimento do mês está em **${((analytics.summary.monthlySalesTotal / analytics.goals.month.targetAmount) * 100).toFixed(1)}%**.
- O ticket médio atual de **R$ ${analytics.summary.averageTicket.toFixed(2)}** está saudável e supera a meta de **R$ ${analytics.goals.month.targetTicket.toFixed(2)}**!

---

### 💡 Estratégia de Combos para Ticket Médio
1. **Look Praia Completo:** Associe o *Biquíni Cortininha Ripple* à *Chemise Rendada*. A vendedora deve posicionar a saída como item indispensável para transitar da praia ao restaurante.
2. **Presente Lingerie Sofisticada:** Alinhe o *Conjunto Renda Sofia* ao *Robe Acetinado*. Apresente como 'kit noite de autocuidado'.

---

### 📦 Plano de Choque para Peças Encalhadas
- **Hot Pant Neon (${analytics.deadStock[0]?.daysWithoutSale || 60} dias sem giro):** Há R$ ${analytics.summary.stagnantCapital.toFixed(2)} em capital parado. Crie a 'Oferta Relâmpago VIP' no WhatsApp com 20% de desconto. A margem residual ainda será de 40.5%, garantindo lucro e devolvendo liquidez ao caixa.

---

### ⚖️ Auditoria de Preço e Margens
- O item *Top Faixa Lastex* está com margem de apenas **31.5%**, abaixo da margem mínima recomendada de **50%**. Eleve o preço à vista de R$ 59,90 para **R$ 79,90** imediatamente.

---

### 🚀 3 Ações para Executar Hoje:
1. Treinar as consultoras para oferecer a Chemise em toda prova de biquíni.
2. Atualizar a etiqueta do Top Faixa para R$ 79,90.
3. Disparar mensagem para clientes selecionadas com a promoção especial da Hot Pant Neon.`,
        source: 'local_engine',
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
      },
    });

    const insightsText = response.text || 'Análise gerada com sucesso.';
    res.json({ insights: insightsText, source: 'gemini-3.8-flash' });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    res.status(500).json({
      error: 'Não foi possível contatar a IA no momento.',
      details: error.message,
    });
  }
});

// ===================== SUPABASE SQL MIGRATIONS & SCHEMA GENERATOR =====================
app.get('/api/supabase/schema', (_req: Request, res: Response) => {
  const fullSchemaPath = path.resolve(__dirname, 'supabase/full_schema.sql');
  if (fs.existsSync(fullSchemaPath)) {
    const content = fs.readFileSync(fullSchemaPath, 'utf-8');
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.send(content);
  }

  res.status(404).send('-- Arquivo de schema unificado não encontrado');
});

// List all migrations
app.get('/api/supabase/migrations', (_req: Request, res: Response) => {
  const migrationsDir = path.resolve(__dirname, 'supabase/migrations');
  if (!fs.existsSync(migrationsDir)) {
    return res.json({ migrations: [] });
  }

  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
  const migrations = files.map((file) => {
    const fullPath = path.join(migrationsDir, file);
    const content = fs.readFileSync(fullPath, 'utf-8');
    return {
      filename: file,
      size: fs.statSync(fullPath).size,
      sql: content,
    };
  });

  res.json({ migrations });
});

// Save Supabase Config
app.post('/api/supabase/config', (req: Request, res: Response) => {
  const { url, anonKey } = req.body;
  store.supabaseConfig = {
    url: url || '',
    anonKey: anonKey || '',
    connected: Boolean(url && anonKey),
  };
  saveStore();
  res.json({ success: true, message: 'Configuração do Supabase salva com sucesso!', config: store.supabaseConfig });
});

// Get Supabase Config
app.get('/api/supabase/config', (_req: Request, res: Response) => {
  res.json({ config: store.supabaseConfig || { url: '', anonKey: '', connected: false } });
});

// ===================== FRONTEND INTEGRATION =====================
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`✨ Servidor Aura Moda executando em http://localhost:${PORT}`);
  });
}

startServer();
