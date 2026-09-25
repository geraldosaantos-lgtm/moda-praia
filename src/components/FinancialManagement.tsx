import React, { useState } from 'react';
import {
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Calendar,
  Filter,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Trash2,
  FileText,
  CreditCard,
  Building,
  Truck,
  Box,
} from 'lucide-react';
import type { FinancialTransaction, TransactionCategory, TransactionType, TransactionStatus, UserRole } from '../types';

interface FinancialManagementProps {
  transactions: FinancialTransaction[];
  userRole: UserRole;
  onAddTransaction: (tx: Partial<FinancialTransaction>) => Promise<void>;
  onUpdateStatus: (id: string, newStatus: TransactionStatus) => Promise<void>;
  onDeleteTransaction: (id: string) => Promise<void>;
}

export const FinancialManagement: React.FC<FinancialManagementProps> = ({
  transactions,
  userRole,
  onAddTransaction,
  onUpdateStatus,
  onDeleteTransaction,
}) => {
  const [selectedType, setSelectedType] = useState<'all' | 'despesa' | 'receita'>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [formType, setFormType] = useState<TransactionType>('despesa');
  const [formCategory, setFormCategory] = useState<TransactionCategory>('fornecedor_pecas');
  const [formDesc, setFormDesc] = useState('');
  const [formAmount, setFormAmount] = useState<number>(0);
  const [formDueDate, setFormDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [formPaymentMethod, setFormPaymentMethod] = useState<'pix' | 'boleto' | 'cartao_credito' | 'dinheiro'>('pix');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAdmin = userRole === 'admin';

  // Calculate totals
  const totalRecebido = transactions
    .filter((t) => t.type === 'receita' && t.status === 'recebido')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalPago = transactions
    .filter((t) => t.type === 'despesa' && t.status === 'pago')
    .reduce((acc, t) => acc + t.amount, 0);

  const saldoCaixa = totalRecebido - totalPago;

  const contasAPagar = transactions
    .filter((t) => t.type === 'despesa' && (t.status === 'pendente' || t.status === 'vencido'))
    .reduce((acc, t) => acc + t.amount, 0);

  const contasAReceber = transactions
    .filter((t) => t.type === 'receita' && t.status === 'pendente')
    .reduce((acc, t) => acc + t.amount, 0);

  const contasVencidasCount = transactions.filter((t) => t.status === 'vencido').length;

  // Filter list
  const filtered = transactions.filter((t) => {
    const matchesType = selectedType === 'all' || t.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || t.status === selectedStatus;
    return matchesType && matchesStatus;
  });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDesc.trim() || formAmount <= 0) return;

    setIsSubmitting(true);
    try {
      await onAddTransaction({
        type: formType,
        category: formCategory,
        description: formDesc,
        amount: Number(formAmount),
        dueDate: formDueDate,
        status: 'pendente',
        paymentMethod: formPaymentMethod,
      });
      setIsModalOpen(false);
      setFormDesc('');
      setFormAmount(0);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryLabel = (cat: TransactionCategory) => {
    switch (cat) {
      case 'venda_loja':
        return 'Venda da Loja';
      case 'fornecedor_pecas':
        return 'Fornecedor de Peças';
      case 'frete_fornecedor':
        return 'Frete Fornecedor';
      case 'embalagens':
        return 'Embalagens & Sacolas';
      case 'aluguel_loja':
        return 'Aluguel do Ponto';
      case 'energia_agua_internet':
        return 'Luz, Água & Fibra';
      case 'marketing_anuncios':
        return 'Tráfego & Marketing';
      case 'taxa_cartao':
        return 'Taxas de Cartão';
      default:
        return 'Outras Operações';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-editorial">
            Controle Financeiro & Fluxo de Caixa
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Acompanhe contas a pagar, a receber, despesas com fornecedores e receitas em tempo real.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Lançamento</span>
          </button>
        )}
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Saldo Líquido */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Saldo Real em Caixa</span>
            <span className="p-1.5 bg-slate-100 text-slate-600 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-editorial">
            R$ {saldoCaixa.toFixed(2)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Receitas recebidas subtraídas das contas pagas
          </p>
        </div>

        {/* Contas a Pagar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Contas a Pagar (Despesas)</span>
            <span className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
              <ArrowDownRight className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-rose-600 font-editorial">
            R$ {contasAPagar.toFixed(2)}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] mt-1">
            {contasVencidasCount > 0 ? (
              <span className="text-rose-600 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {contasVencidasCount} conta(s) vencida(s)!
              </span>
            ) : (
              <span className="text-slate-400">Nenhuma conta vencida</span>
            )}
          </div>
        </div>

        {/* Contas a Receber */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Contas a Receber (Receitas)</span>
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <ArrowUpRight className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 font-editorial">
            R$ {contasAReceber.toFixed(2)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Cartão de crédito parcelado e crediário a liquidar
          </p>
        </div>

        {/* Previsão de Fechamento */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-2xl shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Projeção Operacional</span>
            <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300">
              DRE Mensal
            </span>
          </div>
          <div className="text-xl font-bold text-emerald-400 font-editorial">
            + R$ {(saldoCaixa + contasAReceber - contasAPagar).toFixed(2)}
          </div>
          <span className="text-[10px] text-slate-400">
            Resultado previsto após liquidação de todos os títulos
          </span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        {/* Type Toggle Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => setSelectedType('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              selectedType === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todos os Títulos ({transactions.length})
          </button>
          <button
            onClick={() => setSelectedType('despesa')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
              selectedType === 'despesa'
                ? 'bg-white text-rose-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowDownRight className="w-3.5 h-3.5 text-rose-600" />
            Contas a Pagar
          </button>
          <button
            onClick={() => setSelectedType('receita')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
              selectedType === 'receita'
                ? 'bg-white text-emerald-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
            Contas a Receber
          </button>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1 text-xs">
          <span className="text-slate-400 mr-1">Status:</span>
          {['all', 'pendente', 'pago', 'recebido', 'vencido'].map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors capitalize ${
                selectedStatus === status
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {status === 'all' ? 'Todos' : status}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-medium uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Tipo & Categoria</th>
                <th className="py-3.5 px-4">Descrição do Lançamento</th>
                <th className="py-3.5 px-4">Vencimento</th>
                <th className="py-3.5 px-4">Valor</th>
                <th className="py-3.5 px-4">Status</th>
                {isAdmin && <th className="py-3.5 px-4 text-right">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Nenhum registro financeiro encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filtered.map((t) => {
                  const isExpense = t.type === 'despesa';

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Tipo & Categoria */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`p-1.5 rounded-lg ${
                              isExpense ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                            }`}
                          >
                            {isExpense ? (
                              <ArrowDownRight className="w-4 h-4" />
                            ) : (
                              <ArrowUpRight className="w-4 h-4" />
                            )}
                          </span>
                          <div>
                            <span className="font-semibold text-slate-800 block">
                              {isExpense ? 'Despesa' : 'Receita'}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {getCategoryLabel(t.category)}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Descrição */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800 max-w-xs truncate">
                          {t.description}
                        </div>
                        {t.paymentMethod && (
                          <span className="text-[10px] text-slate-400 uppercase">
                            Via {t.paymentMethod.replace('_', ' ')}
                          </span>
                        )}
                      </td>

                      {/* Vencimento */}
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{t.dueDate}</span>
                        </div>
                      </td>

                      {/* Valor */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`font-bold font-editorial text-sm ${
                            isExpense ? 'text-rose-600' : 'text-emerald-600'
                          }`}
                        >
                          {isExpense ? '-' : '+'} R$ {t.amount.toFixed(2)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {t.status === 'pago' || t.status === 'recebido' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                            <CheckCircle2 className="w-3 h-3" />
                            {t.status === 'pago' ? 'Pago' : 'Recebido'}
                          </span>
                        ) : t.status === 'vencido' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md">
                            <AlertCircle className="w-3 h-3" />
                            Vencido
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                            <Clock className="w-3 h-3" />
                            Pendente
                          </span>
                        )}
                      </td>

                      {/* Ações */}
                      {isAdmin && (
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {t.status === 'pendente' || t.status === 'vencido' ? (
                              <button
                                onClick={() =>
                                  onUpdateStatus(t.id, isExpense ? 'pago' : 'recebido')
                                }
                                className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors"
                              >
                                Baixar {isExpense ? 'Pagamento' : 'Recebimento'}
                              </button>
                            ) : null}

                            <button
                              onClick={() => {
                                if (confirm('Deseja excluir este registro financeiro?')) {
                                  onDeleteTransaction(t.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                              title="Excluir lançamento"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Novo Lançamento Financeiro */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h2 className="text-lg font-bold text-slate-900 font-editorial mb-1">
              Novo Lançamento Financeiro
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Cadastre despesas (fornecedores, aluguel, embalagens) ou novas receitas da loja.
            </p>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {/* Tipo */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => {
                    setFormType('despesa');
                    setFormCategory('fornecedor_pecas');
                  }}
                  className={`py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    formType === 'despesa'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Contas a Pagar (Despesa)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormType('receita');
                    setFormCategory('venda_loja');
                  }}
                  className={`py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    formType === 'receita'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Contas a Receber (Receita)
                </button>
              </div>

              {/* Categoria */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Categoria *
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as TransactionCategory)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500"
                >
                  {formType === 'despesa' ? (
                    <>
                      <option value="fornecedor_pecas">Fornecedor de Peças / Confecção</option>
                      <option value="frete_fornecedor">Frete de Mercadorias</option>
                      <option value="embalagens">Embalagens, Sacolas & Tags</option>
                      <option value="aluguel_loja">Aluguel do Espaço / Showroom</option>
                      <option value="energia_agua_internet">Luz, Água & Fibra Óptica</option>
                      <option value="marketing_anuncios">Tráfego Pago / Instagram</option>
                      <option value="outros">Outros Custos Fixos</option>
                    </>
                  ) : (
                    <>
                      <option value="venda_loja">Venda da Loja</option>
                      <option value="outros">Outras Entradas</option>
                    </>
                  )}
                </select>
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Descrição do Título *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Confecção Verão - 30 peças, Gráfica Sacolas..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              {/* Valor & Vencimento */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Valor (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={formAmount || ''}
                    onChange={(e) => setFormAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Data de Vencimento *
                  </label>
                  <input
                    type="date"
                    required
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              </div>

              {/* Forma de Pagamento Prevista */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Forma de Pagamento
                </label>
                <select
                  value={formPaymentMethod}
                  onChange={(e) => setFormPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500"
                >
                  <option value="pix">PIX</option>
                  <option value="boleto">Boleto Bancário</option>
                  <option value="cartao_credito">Cartão de Crédito</option>
                  <option value="dinheiro">Dinheiro em Espécie</option>
                </select>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar Registro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
