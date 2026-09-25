import React, { useState } from 'react';
import {
  Sparkles,
  Target,
  TrendingUp,
  Clock,
  Package,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Percent,
  ShoppingCart,
  Lightbulb,
  RefreshCw,
  Edit3,
  Sliders,
  DollarSign,
  ChevronRight,
} from 'lucide-react';
import type { BusinessAnalytics, ComboSuggestion, PriceAuditAlert, Product } from '../types';

interface AISalesPlannerProps {
  analytics: BusinessAnalytics | null;
  isLoading: boolean;
  onRefreshAnalytics: () => void;
  onQuickSellCombo: (combo: ComboSuggestion) => void;
  onApplyDiscountToProduct?: (productId: string, discountPrice: number) => void;
  onUpdateGoals: (goals: { dayTarget: number; weekTarget: number; monthTarget: number }) => Promise<void>;
}

export const AISalesPlanner: React.FC<AISalesPlannerProps> = ({
  analytics,
  isLoading,
  onRefreshAnalytics,
  onQuickSellCombo,
  onUpdateGoals,
}) => {
  const [aiFocus, setAiFocus] = useState<string>('geral');
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isEditingGoals, setIsEditingGoals] = useState(false);

  // Goals edit state
  const [editDay, setEditDay] = useState<number>(analytics?.goals.day.targetAmount || 800);
  const [editWeek, setEditWeek] = useState<number>(analytics?.goals.week.targetAmount || 5000);
  const [editMonth, setEditMonth] = useState<number>(analytics?.goals.month.targetAmount || 22000);

  const handleGenerateAi = async (focus: string = aiFocus) => {
    setIsGeneratingAi(true);
    try {
      const res = await fetch('/api/ai/generate-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ focus }),
      });
      const data = await res.json();
      if (data.insights) {
        setAiReport(data.insights);
      }
    } catch (err) {
      console.error('Error generating AI report:', err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSaveGoals = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateGoals({
      dayTarget: editDay,
      weekTarget: editWeek,
      monthTarget: editMonth,
    });
    setIsEditingGoals(false);
  };

  if (!analytics) {
    return (
      <div className="p-12 text-center text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-rose-600" />
        <p className="text-sm">Carregando métricas de inteligência comercial...</p>
      </div>
    );
  }

  const dayPercent = Math.min(
    100,
    Math.round((analytics.goals.day.currentAmount / analytics.goals.day.targetAmount) * 100)
  );
  const weekPercent = Math.min(
    100,
    Math.round((analytics.goals.week.currentAmount / analytics.goals.week.targetAmount) * 100)
  );
  const monthPercent = Math.min(
    100,
    Math.round((analytics.goals.month.currentAmount / analytics.goals.month.targetAmount) * 100)
  );

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-rose-100 text-rose-700 rounded-lg">
              <Sparkles className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 font-editorial">
              Inteligência Artificial & Planejamento de Vendas
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Análise preditiva de giro de estoque, combos para ticket médio, metas e auditoria de margens.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEditDay(analytics.goals.day.targetAmount);
              setEditWeek(analytics.goals.week.targetAmount);
              setEditMonth(analytics.goals.month.targetAmount);
              setIsEditingGoals(true);
            }}
            className="px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-500" />
            <span>Ajustar Metas</span>
          </button>

          <button
            onClick={() => handleGenerateAi(aiFocus)}
            disabled={isGeneratingAi}
            className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 rounded-lg shadow-xs transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isGeneratingAi ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>{isGeneratingAi ? 'Consultando IA...' : 'Diagnóstico Gemini'}</span>
          </button>
        </div>
      </div>

      {/* 1. SEÇÃO DE METAS COMERCIAIS */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-rose-600" />
            <h2 className="text-base font-bold text-slate-900 font-editorial">
              Controle de Metas de Vendas (Dia, Semana & Mês)
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            Ticket Médio Atual: <b className="text-slate-900 font-mono">R$ {analytics.summary.averageTicket.toFixed(2)}</b> (Meta: R$ {analytics.goals.month.targetTicket.toFixed(2)})
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Meta do Dia */}
          <div className="bg-slate-50/90 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span className="font-semibold uppercase tracking-wider text-[11px]">Meta de Hoje</span>
              <span className="font-bold text-slate-800">{dayPercent}%</span>
            </div>
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-xl font-bold text-slate-900 font-editorial">
                R$ {analytics.goals.day.currentAmount.toFixed(2)}
              </span>
              <span className="text-xs text-slate-500">
                de R$ {analytics.goals.day.targetAmount.toFixed(2)}
              </span>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mb-2">
              <div
                className="bg-rose-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${dayPercent}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-500 flex justify-between">
              <span>{analytics.goals.day.totalSalesCount} vendas hoje</span>
              <span>
                Falta:{' '}
                <b>
                  R${' '}
                  {Math.max(
                    0,
                    analytics.goals.day.targetAmount - analytics.goals.day.currentAmount
                  ).toFixed(2)}
                </b>
              </span>
            </div>
          </div>

          {/* Meta da Semana */}
          <div className="bg-slate-50/90 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span className="font-semibold uppercase tracking-wider text-[11px]">Meta da Semana</span>
              <span className="font-bold text-slate-800">{weekPercent}%</span>
            </div>
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-xl font-bold text-slate-900 font-editorial">
                R$ {analytics.goals.week.currentAmount.toFixed(2)}
              </span>
              <span className="text-xs text-slate-500">
                de R$ {analytics.goals.week.targetAmount.toFixed(2)}
              </span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mb-2">
              <div
                className="bg-amber-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${weekPercent}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-500 flex justify-between">
              <span>{analytics.goals.week.totalSalesCount} vendas na semana</span>
              <span>
                Falta:{' '}
                <b>
                  R${' '}
                  {Math.max(
                    0,
                    analytics.goals.week.targetAmount - analytics.goals.week.currentAmount
                  ).toFixed(2)}
                </b>
              </span>
            </div>
          </div>

          {/* Meta do Mês */}
          <div className="bg-slate-50/90 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span className="font-semibold uppercase tracking-wider text-[11px]">Meta do Mês</span>
              <span className="font-bold text-slate-800">{monthPercent}%</span>
            </div>
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-xl font-bold text-slate-900 font-editorial">
                R$ {analytics.goals.month.currentAmount.toFixed(2)}
              </span>
              <span className="text-xs text-slate-500">
                de R$ {analytics.goals.month.targetAmount.toFixed(2)}
              </span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mb-2">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${monthPercent}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-500 flex justify-between">
              <span>{analytics.goals.month.totalSalesCount} vendas no mês</span>
              <span>
                Falta:{' '}
                <b>
                  R${' '}
                  {Math.max(
                    0,
                    analytics.goals.month.targetAmount - analytics.goals.month.currentAmount
                  ).toFixed(2)}
                </b>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. RELATÓRIO DO CONSULTOR GEMINI IA (Se gerado) */}
      {aiReport && (
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-700 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-700 mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold font-editorial text-amber-300">
                Plano Tático Executivo de Vendas (Gemini AI)
              </h2>
            </div>
            <button
              onClick={() => setAiReport(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Fechar relatório
            </button>
          </div>

          <div className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
            {aiReport}
          </div>

          <div className="mt-5 pt-3 border-t border-slate-700/80 flex items-center justify-between text-xs text-slate-400">
            <span>Powered by Gemini 3.8 Flash · Análise personalizada em tempo real</span>
            <button
              onClick={() => handleGenerateAi(aiFocus)}
              className="text-amber-300 hover:underline flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Atualizar Diagnóstico
            </button>
          </div>
        </div>
      )}

      {/* 3. PEÇAS MAIS VENDIDAS VS PEÇAS ENCALHADAS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Peças Mais Vendidas (Top Sellers) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="p-1 bg-amber-50 text-amber-600 rounded">
                  <TrendingUp className="w-4 h-4" />
                </span>
                <h3 className="text-base font-bold text-slate-900 font-editorial">
                  Peças Mais Vendidas (Curva ABC)
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">Alta Rotatividade</span>
            </div>

            <div className="space-y-3">
              {analytics.bestSellers.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-slate-50/70 rounded-xl border border-slate-100 hover:bg-slate-100/70 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-5 text-center font-bold text-xs text-slate-400">
                      #{idx + 1}
                    </span>
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-10 h-10 object-cover rounded-lg"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 line-clamp-1">
                        {item.name}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {item.sku} · Estoque: {item.totalStock} un
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-900 font-editorial block">
                      R$ {item.pricing.calculatedCashPrice.toFixed(2)}
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-600">
                      {item.salesCount} vendidas ({item.pricing.cashMarginPercent.toFixed(0)}% margem)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-slate-400 mt-4 pt-3 border-t border-slate-100">
            💡 Dica: Garanta que essas peças tenham sempre estoque de segurança e fiquem na vitrine principal.
          </p>
        </div>

        {/* Peças Encalhadas / Giro Lento */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="p-1 bg-amber-50 text-amber-700 rounded">
                  <Clock className="w-4 h-4" />
                </span>
                <h3 className="text-base font-bold text-slate-900 font-editorial">
                  Peças com Baixo Giro / Encalhadas
                </h3>
              </div>
              <span className="text-[11px] text-amber-700 font-semibold">
                R$ {analytics.summary.stagnantCapital.toFixed(2)} em capital parado
              </span>
            </div>

            <div className="space-y-3">
              {analytics.deadStock.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-xs">Parabéns! Nenhuma peça está com giro estagnado.</p>
                </div>
              ) : (
                analytics.deadStock.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-amber-50/40 rounded-xl border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-10 h-10 object-cover rounded-lg"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 line-clamp-1">
                          {item.name}
                        </h4>
                        <div className="flex items-center gap-2 text-[10px] text-amber-800 mt-0.5">
                          <span className="font-semibold">{item.daysWithoutSale} dias sem venda</span>
                          <span>·</span>
                          <span>Estoque: {item.totalStock} un</span>
                          <span>·</span>
                          <span>Custo parado: R$ {(item.costs.totalCost * item.totalStock).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <span className="text-xs font-mono font-bold text-slate-700">
                        R$ {item.pricing.calculatedCashPrice.toFixed(2)}
                      </span>
                      <button
                        onClick={() => {
                          const suggested = Number((item.pricing.calculatedCashPrice * 0.8).toFixed(2));
                          alert(
                            `Recomendação Administrativa:\nAplicar 20% de desconto na peça "${item.name}".\nPreço promocional sugerido: R$ ${suggested.toFixed(2)}.\nIsso preserva margem positiva de ${(
                              ((suggested - item.costs.totalCost) / suggested) *
                              100
                            ).toFixed(1)}% e devolve R$ ${(item.costs.totalCost * item.totalStock).toFixed(2)} em liquidez!`
                          );
                        }}
                        className="px-2.5 py-1 text-[11px] font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-md transition-colors whitespace-nowrap"
                      >
                        Sugerir Desconto
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <p className="text-[11px] text-slate-400 mt-4 pt-3 border-t border-slate-100">
            ⚠️ O custo de manter estoque parado é maior que conceder um desconto estratégico para recompor o caixa.
          </p>
        </div>
      </div>

      {/* 4. SUGESTÕES DE COMBOS PARA ELEVAR TICKET MÉDIO */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="p-1 bg-rose-50 text-rose-600 rounded">
              <Package className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-editorial">
                Combos Inteligentes (Maximizador de Ticket Médio)
              </h3>
              <p className="text-xs text-slate-500">
                Combinações estratégicas que incentivam a cliente a levar look completo com desconto atraente sem canibalizar a margem da loja.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {analytics.combos.map((combo) => (
            <div
              key={combo.id}
              className="bg-slate-50/90 rounded-xl p-4 border border-slate-200 flex flex-col justify-between hover:border-rose-300 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                  <span className="font-semibold text-rose-600 uppercase tracking-wider text-[10px]">
                    {combo.category}
                  </span>
                  <span className="bg-rose-100 text-rose-700 font-bold px-1.5 py-0.5 rounded text-[10px]">
                    -{combo.discountPercent}% OFF
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-900 font-editorial mb-2">
                  {combo.title}
                </h4>

                <div className="space-y-1 text-xs text-slate-600 mb-3 bg-white p-2 rounded-lg border border-slate-200/70">
                  {combo.productNames.map((pName, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[11px]">
                      <span className="text-slate-400">•</span>
                      <span className="truncate">{pName}</span>
                    </div>
                  ))}
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed mb-4">
                  {combo.strategicReason}
                </p>
              </div>

              <div>
                <div className="flex items-baseline justify-between pt-3 border-t border-slate-200 mb-3">
                  <div>
                    <span className="text-[10px] text-slate-400 line-through block">
                      De R$ {combo.originalTotal.toFixed(2)}
                    </span>
                    <span className="text-lg font-bold text-emerald-600 font-editorial">
                      Por R$ {combo.comboPrice.toFixed(2)}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500">
                    Margem: {combo.estimatedMarginPercent}%
                  </span>
                </div>

                <button
                  onClick={() => onQuickSellCombo(combo)}
                  className="w-full py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-rose-600 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Vender este Combo</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. AUDITORIA DE PRECIFICAÇÃO & TÉCNICAS ADMINISTRATIVAS */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="p-1 bg-rose-50 text-rose-600 rounded">
              <AlertTriangle className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-slate-900 font-editorial">
              Auditoria de Preços & Recomendações de Margem de Contribuição
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            {analytics.priceAudits.length} alertas identificados
          </span>
        </div>

        <div className="space-y-3">
          {analytics.priceAudits.map((audit) => {
            const isUrgent = audit.severity === 'urgente';

            return (
              <div
                key={audit.id}
                className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isUrgent
                    ? 'bg-rose-50/50 border-rose-200'
                    : 'bg-amber-50/40 border-amber-200'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        isUrgent ? 'bg-rose-600 text-white' : 'bg-amber-600 text-white'
                      }`}
                    >
                      {audit.severity}
                    </span>
                    <h4 className="text-xs font-bold text-slate-800">
                      {audit.productName} ({audit.sku})
                    </h4>
                  </div>
                  <p className="text-xs text-slate-700 font-medium">{audit.title}</p>
                  <p className="text-[11px] text-slate-500 max-w-2xl">{audit.description}</p>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
                  <div className="text-left sm:text-right text-xs">
                    <span className="text-slate-400 block text-[10px]">Ação Sugerida:</span>
                    <span className="font-semibold text-slate-900">{audit.suggestedAction}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal de Ajuste de Metas */}
      {isEditingGoals && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 animate-in fade-in">
            <h2 className="text-lg font-bold text-slate-900 font-editorial mb-1">
              Configurar Metas de Vendas
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Defina as metas da loja para manter a equipe focada no crescimento.
            </p>

            <form onSubmit={handleSaveGoals} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Meta Diária (R$)
                </label>
                <input
                  type="number"
                  min="100"
                  step="50"
                  required
                  value={editDay}
                  onChange={(e) => setEditDay(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Meta Semanal (R$)
                </label>
                <input
                  type="number"
                  min="500"
                  step="100"
                  required
                  value={editWeek}
                  onChange={(e) => setEditWeek(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Meta Mensal (R$)
                </label>
                <input
                  type="number"
                  min="2000"
                  step="500"
                  required
                  value={editMonth}
                  onChange={(e) => setEditMonth(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500 font-bold"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditingGoals(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg"
                >
                  Salvar Metas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
