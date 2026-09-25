export type UserRole = 'admin' | 'vendedor';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export type ProductCategory = 'moda_praia' | 'moda_intima' | 'vestuario' | 'acessorios';

export interface SizeStock {
  size: string;
  quantity: number;
}

export interface ProductCostBreakdown {
  itemCost: number;          // Valor da peça (fornecedor)
  supplierShipping: number;  // Valor do frete do fornecedor por peça
  packagingCost: number;     // Embalagens (sacola, seda, tag, saquinho)
  otherCosts: number;        // Outros custos diretos
  totalCost: number;         // Custo Total de Aquisição (CMV)
}

export interface PricingFormula {
  cashMarkupPercent: number;          // Markup desejado à vista (ex: 120%)
  installmentMarkupPercent: number;   // Acréscimo para venda a prazo/cartão (ex: 12%)
  maxInstallments: number;            // Quantidade de parcelas sem juros (ex: 3)
  calculatedCashPrice: number;        // Preço sugerido/definido à vista
  calculatedInstallmentPrice: number; // Preço sugerido/definido a prazo
  calculatedInstallmentValue: number; // Valor de cada parcela
  cashGrossProfit: number;            // Lucro bruto unitário em R$
  cashMarginPercent: number;          // Margem percentual sobre o preço de venda
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: ProductCategory;
  description: string;
  sizes: SizeStock[];
  totalStock: number;
  minStockAlert: number;
  costs: ProductCostBreakdown;
  pricing: PricingFormula;
  salesCount: number;
  lastSaleDate?: string;
  daysWithoutSale: number;
  createdAt: string;
  imageUrl?: string;
  color?: string;
}

export type TransactionType = 'receita' | 'despesa';
export type TransactionStatus = 'pendente' | 'pago' | 'recebido' | 'vencido';
export type TransactionCategory =
  | 'venda_loja'
  | 'fornecedor_pecas'
  | 'frete_fornecedor'
  | 'embalagens'
  | 'aluguel_loja'
  | 'energia_agua_internet'
  | 'marketing_anuncios'
  | 'taxa_cartao'
  | 'outros';

export interface FinancialTransaction {
  id: string;
  type: TransactionType;
  category: TransactionCategory;
  description: string;
  amount: number;
  dueDate: string;
  paymentDate?: string;
  status: TransactionStatus;
  paymentMethod?: 'pix' | 'cartao_credito' | 'cartao_debito' | 'dinheiro' | 'boleto';
  referenceId?: string;
  createdAt: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  sku: string;
  size: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  total: number;
}

export interface Sale {
  id: string;
  code: string;
  items: SaleItem[];
  totalAmount: number;
  totalCost: number;
  profit: number;
  paymentMethod: 'pix' | 'cartao_credito' | 'cartao_debito' | 'dinheiro' | 'a_prazo';
  installments?: number;
  customerName?: string;
  sellerName: string;
  date: string;
}

export interface SalesGoal {
  id: string;
  period: 'dia' | 'semana' | 'mes';
  targetAmount: number;
  currentAmount: number;
  targetTicket: number;
  currentTicket: number;
  totalSalesCount: number;
}

export interface ComboSuggestion {
  id: string;
  title: string;
  category: string;
  productIds: string[];
  productNames: string[];
  originalTotal: number;
  comboPrice: number;
  discountPercent: number;
  estimatedMarginPercent: number;
  strategicReason: string;
}

export interface PriceAuditAlert {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  currentCashPrice: number;
  totalCost: number;
  currentMarginPercent: number;
  issueType: 'margem_baixa' | 'encalhado' | 'markup_desalinhado' | 'estoque_critico';
  severity: 'aviso' | 'urgente' | 'oportunidade';
  title: string;
  description: string;
  suggestedAction: string;
  suggestedDiscountPercent?: number;
  suggestedPrice?: number;
}

export interface BusinessAnalytics {
  bestSellers: Product[];
  deadStock: Product[];
  combos: ComboSuggestion[];
  goals: {
    day: SalesGoal;
    week: SalesGoal;
    month: SalesGoal;
  };
  priceAudits: PriceAuditAlert[];
  summary: {
    totalInventoryValueCost: number;
    totalInventoryValueRetail: number;
    potentialProfit: number;
    stagnantCapital: number;
    averageTicket: number;
    monthlySalesTotal: number;
  };
}
export interface CompanySettings {
  name: string;
  corporateName?: string;
  cnpj?: string;
  phone?: string;
  email?: string;
  instagram?: string;
  address?: string;
  logoUrl?: string;
  pixKey?: string;
  segment?: string;
  receiptMessage?: string;
}
