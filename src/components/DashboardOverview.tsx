import React from 'react';
import {
  TrendingUp,
  Package,
  DollarSign,
  Clock,
  Sparkles,
  ArrowUpRight,
  ArrowRight,
  ShoppingCart,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import type { BusinessAnalytics, Sale, Product, UserRole } from '../types';

interface DashboardOverviewProps {
  analytics: BusinessAnalytics | null;
  sales: Sale[];
  userRole: UserRole;
  onNavigateTab: (tab: 'catalog' | 'financials' | 'ai' | 'pos') => void;
  onOpenNewProduct: () => void;
  onOpenPOS: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  analytics,
  sales,
  userRole,
  onNavigateTab,
  onOpenNewProduct,
  onOpenPOS,
}) => {
  const isAdmin = userRole === 'admin';

  if (!analytics) return null;

  const monthProgress = Math.min(
    100,
    Math.round((analytics.summary.monthlySalesTotal / analytics.goals.month.targetAmount) * 100)
  );

  return (
    <div className="space-y-6">
      {/* Welcome & Quick Action Card */}
      <div className="bg-gradient-to-r from-rose-900 via-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sistema Inteligente de Gestão & Varejo</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-editorial tracking-tight text-white">
            Painel Executivo Aura Moda
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
            Controle seguro para sua boutique de moda praia e lingerie: precificação matemática com margem de segurança, fluxo financeiro e IA preditiva de vendas.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={onOpenPOS}
              className="px-4 py-2 text-xs font-semibold text-slate-950 bg-white hover:bg-slate-100 rounded-xl transition-colors shadow-xs flex items-center gap-2"
            >
              <ShoppingCart className="w-4 h-4 text-rose-600" />
              <span>Abrir PDV (Nova Venda)</span>
            </button>
            {isAdmin && (
              <button
                onClick={onOpenNewProduct}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-xs flex items-center gap-2"
              >
                <Package className="w-4 h-4" />
                <span>Cadastrar Peça & Precificar</span>
              </button>
            )}
            <button
              onClick={() => onNavigateTab('ai')}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-xl transition-colors flex items-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Ver Sugestões da IA</span>
            </button>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-rose-500/20 to-transparent blur-2xl pointer-events-none" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Faturamento do Mês */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Faturamento no Mês</span>
            <span className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-editorial">
            R$ {analytics.summary.monthlySalesTotal.toFixed(2)}
          </div>
          <div className="mt-2">
            <div className="flex justify-between text-[11px] text-slate-500 mb-1">
              <span>Progresso da Meta:</span>
              <span className="font-bold text-slate-800">{monthProgress}%</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-rose-600 h-full rounded-full"
                style={{ width: `${monthProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Ticket Médio */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Ticket Médio por Venda</span>
            <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-editorial">
            R$ {analytics.summary.averageTicket.toFixed(2)}
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold mt-2 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> Acima da meta de R${' '}
            {analytics.goals.month.targetTicket.toFixed(2)}
          </p>
        </div>

        {/* Valor do Estoque */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Estoque a Preço de Venda</span>
            <span className="p-1.5 bg-slate-100 text-slate-600 rounded-lg">
              <Package className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-editorial">
            R$ {analytics.summary.totalInventoryValueRetail.toFixed(2)}
          </div>
          {isAdmin && (
            <p className="text-[11px] text-slate-500 mt-2">
              Custo: R$ {analytics.summary.totalInventoryValueCost.toFixed(2)} (Lucro Potencial: R${' '}
              {analytics.summary.potentialProfit.toFixed(2)})
            </p>
          )}
        </div>

        {/* Capital Estagnado */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Capital em Risco (Encalhado)</span>
            <span className="p-1.5 bg-amber-50 text-amber-700 rounded-lg">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-amber-600 font-editorial">
            R$ {analytics.summary.stagnantCapital.toFixed(2)}
          </div>
          <button
            onClick={() => onNavigateTab('ai')}
            className="text-[11px] text-amber-700 font-semibold hover:underline mt-2 flex items-center gap-1"
          >
            <span>Ver estratégia de desova</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Two columns: Best Sellers vs Recent Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Curva ABC - Top Sellers */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
                <TrendingUp className="w-4 h-4" />
              </span>
              <h3 className="font-bold text-slate-900 font-editorial text-base">
                Destaques do Catálogo (Top Sellers)
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('catalog')}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold"
            >
              Ver Todas
            </button>
          </div>

          <div className="space-y-3">
            {analytics.bestSellers.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-11 h-11 rounded-lg object-cover"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{item.name}</h4>
                    <span className="text-[11px] text-slate-400 font-mono">
                      SKU: {item.sku} · {item.totalStock} un em estoque
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-slate-900 font-editorial block">
                    R$ {item.pricing.calculatedCashPrice.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-semibold">
                    {item.salesCount} vendidas
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Últimas Vendas no Caixa */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-slate-100 text-slate-700 rounded-lg">
                <ShoppingCart className="w-4 h-4" />
              </span>
              <h3 className="font-bold text-slate-900 font-editorial text-base">
                Últimas Vendas Registradas (PDV)
              </h3>
            </div>
            <button
              onClick={onOpenPOS}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold"
            >
              + Nova Venda
            </button>
          </div>

          <div className="space-y-3">
            {sales.slice(0, 3).map((sale) => (
              <div
                key={sale.id}
                className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-800">#{sale.code}</span>
                    <span className="text-[10px] uppercase font-mono text-slate-400">
                      {sale.paymentMethod}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {sale.customerName} · {sale.items.length} produto(s)
                  </p>
                </div>

                <div className="text-right">
                  <span className="font-bold text-sm text-slate-900 font-editorial block">
                    R$ {sale.totalAmount.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Atendente: {sale.sellerName}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
