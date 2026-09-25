import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Building2,
  Upload,
  Image as ImageIcon,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Smartphone,
  Instagram,
  Mail,
  MapPin,
  QrCode,
  FileText,
  Save,
  Sparkles,
} from 'lucide-react';
import type { CompanySettings } from '../types';

interface CompanySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  companySettings: CompanySettings;
  onSaveSettings: (settings: CompanySettings) => Promise<void>;
  onResetAllData: () => Promise<void>;
  onLoadDemoData: () => Promise<void>;
}

export const CompanySettingsModal: React.FC<CompanySettingsModalProps> = ({
  isOpen,
  onClose,
  companySettings,
  onSaveSettings,
  onResetAllData,
  onLoadDemoData,
}) => {
  const [formData, setFormData] = useState<CompanySettings>(companySettings);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'receipt' | 'reset'>('profile');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFormData(companySettings);
  }, [companySettings, isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (field: keyof CompanySettings, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setSaveSuccess(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('A imagem do logo deve ter no máximo 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        handleInputChange('logoUrl', result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('O nome da empresa/loja é obrigatório.');
      return;
    }

    setIsSaving(true);
    try {
      await onSaveSettings(formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Erro ao salvar dados da empresa:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExecuteReset = async () => {
    setIsResetting(true);
    try {
      await onResetAllData();
      setConfirmResetOpen(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Erro ao limpar base:', err);
    } finally {
      setIsResetting(false);
    }
  };

  const handleExecuteDemoLoad = async () => {
    setIsResetting(true);
    try {
      await onLoadDemoData();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Erro ao carregar exemplos:', err);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shadow-2xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 font-editorial">
                Dados & Identidade da Empresa
              </h2>
              <p className="text-xs text-slate-500">
                Personalize o nome da sua marca, logotipo, dados fiscais e comprovantes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-tabs */}
        <div className="flex border-b border-slate-200 px-6 bg-white gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveSubTab('profile')}
            className={`py-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'profile'
                ? 'border-rose-600 text-rose-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Perfil & Logotipo</span>
          </button>
          <button
            onClick={() => setActiveSubTab('receipt')}
            className={`py-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'receipt'
                ? 'border-rose-600 text-rose-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Recibos & PIX</span>
          </button>
          <button
            onClick={() => setActiveSubTab('reset')}
            className={`py-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'reset'
                ? 'border-amber-600 text-amber-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Limpeza de Dados (Reset)</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 flex-1">
          {saveSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Dados da empresa salvos e atualizados com sucesso!</span>
            </div>
          )}

          {activeSubTab === 'profile' && (
            <div className="space-y-6">
              {/* Logo Section */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <label className="block text-xs font-semibold text-slate-800">
                  Logotipo da Marca / Loja
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Preview Box */}
                  <div className="w-20 h-20 rounded-2xl bg-white border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs relative group">
                    {formData.logoUrl ? (
                      <img
                        src={formData.logoUrl}
                        alt="Logo da Empresa"
                        className="w-full h-full object-contain p-1"
                      />
                    ) : (
                      <div className="text-center p-2 text-slate-400">
                        <ImageIcon className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                        <span className="text-[10px] block leading-tight">Sem Logo</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex-1 space-y-2 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 font-medium rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5 text-rose-600" />
                        <span>Carregar do Dispositivo</span>
                      </button>
                      {formData.logoUrl && (
                        <button
                          type="button"
                          onClick={() => handleInputChange('logoUrl', '')}
                          className="px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remover</span>
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Formatos recomendados: PNG, JPG ou WebP quadrado (ex: 200x200px) com fundo transparente ou branco.
                    </p>
                  </div>
                </div>

                {/* Ou URL Direta */}
                <div className="pt-2 border-t border-slate-200">
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">
                    Ou informe a URL de uma imagem na internet:
                  </label>
                  <input
                    type="url"
                    placeholder="https://exemplo.com.br/logo.png"
                    value={formData.logoUrl || ''}
                    onChange={(e) => handleInputChange('logoUrl', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              </div>

              {/* Company Identity Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nome da Loja / Marca Fantasia *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Sol & Mar Beachwear"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Segmento de Atuação
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Moda Praia, Fitness & Íntima"
                    value={formData.segment || ''}
                    onChange={(e) => handleInputChange('segment', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Razão Social (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Sol e Mar Confecções e Comércio LTDA"
                    value={formData.corporateName || ''}
                    onChange={(e) => handleInputChange('corporateName', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    CNPJ ou CPF da Empresa
                  </label>
                  <input
                    type="text"
                    placeholder="00.000.000/0001-00"
                    value={formData.cnpj || ''}
                    onChange={(e) => handleInputChange('cnpj', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-500 font-mono"
                  />
                </div>
              </div>

              {/* Contacts */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                    <span>WhatsApp / Telefone</span>
                  </label>
                  <input
                    type="text"
                    placeholder="(00) 90000-0000"
                    value={formData.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Instagram className="w-3.5 h-3.5 text-slate-400" />
                    <span>Instagram</span>
                  </label>
                  <input
                    type="text"
                    placeholder="@sualoja"
                    value={formData.instagram || ''}
                    onChange={(e) => handleInputChange('instagram', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>E-mail Comercial</span>
                  </label>
                  <input
                    type="email"
                    placeholder="contato@sualoja.com.br"
                    value={formData.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="text-xs">
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>Endereço Completo (Loja Física / Showroom / Cidade)</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Av. Beira Mar, 450 - Centro, Florianópolis - SC"
                  value={formData.address || ''}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>
            </div>
          )}

          {activeSubTab === 'receipt' && (
            <div className="space-y-5 text-xs">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1 flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-emerald-600" />
                    <span>Chave PIX da Empresa</span>
                  </label>
                  <p className="text-[11px] text-slate-500 mb-2">
                    Essa chave é apresentada nas vendas do PDV e pode ser inserida nos comprovantes para facilitar o pagamento das clientes.
                  </p>
                  <input
                    type="text"
                    placeholder="Ex: financeiro@sualoja.com.br ou CNPJ ou Telefone"
                    value={formData.pixKey || ''}
                    onChange={(e) => handleInputChange('pixKey', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-rose-600" />
                    <span>Mensagem de Rodapé dos Comprovantes de Venda</span>
                  </label>
                  <p className="text-[11px] text-slate-500 mb-2">
                    Texto que será impresso no final de cada recibo de venda entregue à cliente.
                  </p>
                  <textarea
                    rows={3}
                    placeholder="Ex: Agradecemos a sua preferência! Trocas em até 15 dias com etiqueta fixada na peça. Siga-nos no Instagram @sualoja"
                    value={formData.receiptMessage || ''}
                    onChange={(e) => handleInputChange('receiptMessage', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500 leading-relaxed"
                  />
                </div>
              </div>

              {/* Receipt Preview Card */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Prévia do Cabeçalho e Rodapé do Recibo:
                </span>
                <div className="bg-slate-50 p-4 rounded-lg font-mono text-[11px] text-slate-700 max-w-sm mx-auto space-y-2 border border-dashed border-slate-300 text-center">
                  <div className="font-bold text-sm text-slate-900">{formData.name || 'Nome da Loja'}</div>
                  {formData.segment && <div className="text-[10px] text-slate-500">{formData.segment}</div>}
                  {formData.cnpj && <div className="text-[10px]">CNPJ: {formData.cnpj}</div>}
                  {formData.phone && <div className="text-[10px]">WhatsApp: {formData.phone}</div>}
                  {formData.address && <div className="text-[10px] text-slate-500">{formData.address}</div>}
                  <div className="border-t border-slate-300 pt-2 text-[10px] text-slate-400">
                    [... itens da venda ...]
                  </div>
                  {formData.pixKey && (
                    <div className="bg-emerald-50 text-emerald-800 p-1.5 rounded text-[10px]">
                      Chave PIX: {formData.pixKey}
                    </div>
                  )}
                  <div className="border-t border-slate-300 pt-2 text-[10px] italic text-slate-600">
                    "{formData.receiptMessage || 'Obrigada pela preferência!'}"
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSubTab === 'reset' && (
            <div className="space-y-4 text-xs">
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl space-y-3">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-amber-900">
                      Limpeza de Dados de Teste & Demonstração
                    </h4>
                    <p className="text-amber-800 text-[11px] mt-1 leading-relaxed">
                      Se você deseja começar a usar o aplicativo para a sua loja real, utilize o botão abaixo para remover todos os produtos, vendas e lançamentos financeiros criados como exemplo.
                    </p>
                  </div>
                </div>

                {!confirmResetOpen ? (
                  <button
                    type="button"
                    onClick={() => setConfirmResetOpen(true)}
                    className="w-full sm:w-auto px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg shadow-2xs transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Limpar Todas as Informações de Teste (Resetar Base)</span>
                  </button>
                ) : (
                  <div className="bg-white p-3 rounded-lg border border-rose-300 space-y-2 animate-in fade-in">
                    <p className="font-bold text-rose-800 text-xs">
                      Tem certeza? Essa ação vai zerar o catálogo, histórico de vendas e contas a pagar/receber para deixar o sistema 100% limpo.
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        disabled={isResetting}
                        onClick={handleExecuteReset}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-md transition-colors"
                      >
                        {isResetting ? 'Limpando...' : 'Sim, Limpar Tudo Agora'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmResetOpen(false)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-md transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-slate-500" />
                  <h4 className="font-semibold text-slate-800">
                    Restaurar Dados de Exemplo (Demonstração)
                  </h4>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Caso deseje testar novamente os relatórios, IA e métricas com dados simulados, você pode recarregar as peças de exemplo a qualquer momento.
                </p>
                <button
                  type="button"
                  disabled={isResetting}
                  onClick={handleExecuteDemoLoad}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 font-medium rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
                  <span>Restaurar Catálogo de Demonstração</span>
                </button>
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Fechar
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-2xs transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Salvando...' : 'Salvar Dados da Empresa'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
