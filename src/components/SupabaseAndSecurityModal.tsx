import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  ShieldCheck,
  Copy,
  Check,
  ExternalLink,
  Code2,
  Download,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  GitBranch,
  Key,
  HelpCircle,
  Play,
  ArrowRight,
  Info,
  UploadCloud,
  Globe,
} from 'lucide-react';
import { testSupabaseConnection, normalizeSupabaseUrl } from '../lib/supabase';
import { FULL_SUPABASE_SQL } from '../lib/sqlSchema';
import { seedDemoDataToSupabase } from '../lib/dataService';

interface SupabaseAndSecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type MigrationItem = {
  filename: string;
  size: number;
  sql: string;
};

export const SupabaseAndSecurityModal: React.FC<SupabaseAndSecurityModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'wizard' | 'migrations' | 'github' | 'security'>('wizard');
  const [selectedFile, setSelectedFile] = useState<string>('full_schema.sql');
  const [fullSqlSchema, setFullSqlSchema] = useState<string>(FULL_SUPABASE_SQL);
  const [migrations, setMigrations] = useState<MigrationItem[]>([]);
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedStep3, setCopiedStep3] = useState<boolean>(false);
  const [isSeeding, setIsSeeding] = useState<boolean>(false);
  const [seedMessage, setSeedMessage] = useState<string | null>(null);

  // Connection settings
  const [supabaseUrl, setSupabaseUrl] = useState<string>(
    () => (typeof window !== 'undefined' ? localStorage.getItem('AURA_SUPABASE_URL') || '' : '')
  );
  const [supabaseKey, setSupabaseKey] = useState<string>(
    () => (typeof window !== 'undefined' ? localStorage.getItem('AURA_SUPABASE_KEY') || '' : '')
  );
  const [testStatus, setTestStatus] = useState<{
    tested: boolean;
    loading: boolean;
    success: boolean;
    message: string;
    stage?: 'credentials' | 'network' | 'schema' | 'ok';
  }>({
    tested: false,
    loading: false,
    success: false,
    message: '',
  });

  // Load migrations and schema on modal open
  useEffect(() => {
    if (isOpen) {
      // Fetch full schema if server has it, otherwise default to FULL_SUPABASE_SQL
      fetch('/api/supabase/schema')
        .then((res) => {
          const contentType = res.headers.get('content-type') || '';
          if (res.ok && !contentType.includes('text/html')) {
            return res.text();
          }
          return FULL_SUPABASE_SQL;
        })
        .then((text) => {
          if (text && !text.includes('<!doctype') && !text.includes('<html')) {
            setFullSqlSchema(text);
          }
        })
        .catch(() => setFullSqlSchema(FULL_SUPABASE_SQL));

      // Fetch migrations list
      fetch('/api/supabase/migrations')
        .then((res) => res.json())
        .then((data) => {
          if (data.migrations) {
            setMigrations(data.migrations);
          }
        })
        .catch((err) => console.error(err));

      // Check server stored config
      fetch('/api/supabase/config')
        .then((res) => res.json())
        .then((data) => {
          if (data.config?.url && !supabaseUrl) setSupabaseUrl(data.config.url);
          if (data.config?.anonKey && !supabaseKey) setSupabaseKey(data.config.anonKey);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Active SQL to display based on selected file
  const currentSqlContent =
    selectedFile === 'full_schema.sql'
      ? fullSqlSchema
      : migrations.find((m) => m.filename === selectedFile)?.sql || fullSqlSchema;

  const handleCopySql = (textToCopy?: string, isStep3: boolean = false) => {
    navigator.clipboard.writeText(textToCopy || currentSqlContent);
    if (isStep3) {
      setCopiedStep3(true);
      setTimeout(() => setCopiedStep3(false), 2500);
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDownloadSql = () => {
    const blob = new Blob([currentSqlContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = selectedFile;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleTestConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = normalizeSupabaseUrl(supabaseUrl);
    const cleanKey = supabaseKey.trim();

    if (!cleanUrl || !cleanKey) {
      setTestStatus({
        tested: true,
        loading: false,
        success: false,
        stage: 'credentials',
        message: 'Por favor, informe a URL do Projeto e a chave "anon public" do Supabase.',
      });
      return;
    }

    setTestStatus({ tested: false, loading: true, success: false, message: 'Conectando ao Supabase...' });

    // Save locally
    if (typeof window !== 'undefined') {
      localStorage.setItem('AURA_SUPABASE_URL', cleanUrl);
      localStorage.setItem('AURA_SUPABASE_KEY', cleanKey);
    }

    // Save to server
    try {
      await fetch('/api/supabase/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: cleanUrl, anonKey: cleanKey }),
      });
    } catch {
      // ignore
    }

    const result = await testSupabaseConnection(cleanUrl, cleanKey);
    setTestStatus({
      tested: true,
      loading: false,
      success: result.success,
      stage: result.stage,
      message: result.message,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-600" />
              <h2 className="text-xl font-bold text-slate-900 font-editorial">
                Como Configurar o Supabase (Passo a Passo Fácil)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Siga as 4 etapas simples abaixo para conectar seu banco de dados na nuvem ou use a loja com o armazenamento local já ativo.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-3 border-b border-slate-200 flex items-center gap-2 sm:gap-6 text-xs font-semibold bg-white overflow-x-auto">
          <button
            onClick={() => setActiveTab('wizard')}
            className={`pb-3 flex items-center gap-1.5 transition-colors border-b-2 -mb-px whitespace-nowrap cursor-pointer ${
              activeTab === 'wizard'
                ? 'border-rose-600 text-rose-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Play className="w-4 h-4 text-emerald-600" />
            <span>Guia Rápido de Configuração (4 Passos)</span>
          </button>

          <button
            onClick={() => setActiveTab('migrations')}
            className={`pb-3 flex items-center gap-1.5 transition-colors border-b-2 -mb-px whitespace-nowrap cursor-pointer ${
              activeTab === 'migrations'
                ? 'border-rose-600 text-rose-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Ver Códigos SQL ({migrations.length + 1} arquivos)</span>
          </button>

          <button
            onClick={() => setActiveTab('github')}
            className={`pb-3 flex items-center gap-1.5 transition-colors border-b-2 -mb-px whitespace-nowrap cursor-pointer ${
              activeTab === 'github'
                ? 'border-rose-600 text-rose-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <GitBranch className="w-4 h-4" />
            <span>GitHub CI/CD & Deploy</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`pb-3 flex items-center gap-1.5 transition-colors border-b-2 -mb-px whitespace-nowrap cursor-pointer ${
              activeTab === 'security'
                ? 'border-rose-600 text-rose-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Permissões (Admin vs Vendedora)</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* TAB 1: STEP-BY-STEP WIZARD */}
          {activeTab === 'wizard' && (
            <div className="space-y-6">
              {/* Tranquility Banner: Local storage is already working */}
              <div className="p-3.5 bg-blue-50/90 border border-blue-200 rounded-xl flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-blue-900 text-xs">
                    Sua loja já está 100% funcionando!
                  </h4>
                  <p className="text-blue-700 text-[11px] mt-0.5 leading-relaxed">
                    Você não precisa se preocupar: mesmo sem configurar o Supabase agora, a loja Aura Moda funciona perfeitamente! O catálogo, os cálculos de preços, o PDV e o financeiro salvam automaticamente no servidor local. Conecte o Supabase quando desejar sincronizar em nuvem.
                  </p>
                </div>
              </div>

              {/* Step by Step Cards */}
              <div className="space-y-4">
                {/* PASSO 1 */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[11px] font-bold">
                        1
                      </span>
                      Criar um Projeto Grátis no Supabase
                    </span>
                    <a
                      href="https://supabase.com/dashboard/new"
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <span>Abrir Supabase Dashboard</span>
                      <ExternalLink className="w-3 h-3 text-slate-500" />
                    </a>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Se ainda não tem um projeto: acesse o link acima, faça login (com GitHub ou e-mail), clique em <b>"New Project"</b>, dê o nome <b>aura-moda</b>, defina uma senha e escolha a região (ex: <i>São Paulo - South America</i>). Em 1 minuto o banco estará criado!
                  </p>
                </div>

                {/* PASSO 2 */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[11px] font-bold">
                        2
                      </span>
                      Onde Pegar a URL e a Chave no Supabase
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-3 text-[11px] text-slate-700">
                    <p className="font-semibold text-slate-800">
                      Existem 3 formas super fáceis de achar esses 2 valores no Supabase:
                    </p>

                    <div className="space-y-2">
                      <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-lg">
                        <span className="font-bold text-emerald-950 block text-[11px]">
                          ⭐ Modo mais rápido (Botão "Connect" no topo):
                        </span>
                        <p className="text-emerald-800 text-[10px] mt-0.5">
                          No topo da página do seu projeto no Supabase, clique no botão <b>"Connect"</b>. Selecione qualquer opção (ex: App Frameworks) e ele exibirá a <b>URL</b> e a <b>Anon Key</b> imediatamente para copiar!
                        </p>
                      </div>

                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                        <span className="font-bold text-slate-800 block text-[11px]">
                          Opção 2: Pelo menu "API Docs" (&lt;&gt;):
                        </span>
                        <p className="text-slate-600 text-[10px] mt-0.5">
                          No menu lateral esquerdo, clique em <b>API Docs</b> (ícone de código). Logo no topo da página de introdução já aparecem a <b>URL</b> e a <b>chave pública (anon)</b>.
                        </p>
                      </div>

                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                        <span className="font-bold text-slate-800 block text-[11px]">
                          Opção 3: Pelas Configurações (Engrenagem ⚙️):
                        </span>
                        <p className="text-slate-600 text-[10px] mt-0.5">
                          Clique na <b>engrenagem ⚙️ (Project Settings)</b> no rodapé do menu esquerdo &gt; clique em <b>API</b> (ou <b>Data API</b>). Lá estão o <b>Project URL</b> e a chave <b>anon public</b>.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Form to paste keys */}
                  <form onSubmit={handleTestConnection} className="space-y-3 pt-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          1. Project URL (URL do Projeto)
                        </label>
                        <input
                          type="text"
                          placeholder="https://seu-projeto.supabase.co"
                          value={supabaseUrl}
                          onChange={(e) => setSupabaseUrl(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-xs focus:outline-none focus:ring-1 focus:ring-rose-500"
                        />
                        <span className="text-[10px] text-slate-400 mt-0.5 block">
                          Exemplo: <code>https://abcdxyz.supabase.co</code>
                        </span>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          2. Project API Key (Chave anon public)
                        </label>
                        <input
                          type="password"
                          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                          value={supabaseKey}
                          onChange={(e) => setSupabaseKey(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-xs focus:outline-none focus:ring-1 focus:ring-rose-500"
                        />
                        <span className="text-[10px] text-slate-400 mt-0.5 block">
                          A chave que começa com <code>eyJhbGciOi...</code> (não use a service_role)
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      <button
                        type="submit"
                        disabled={testStatus.loading}
                        className="py-2 px-4 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-60 rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
                      >
                        {testStatus.loading ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Verificando Conexão...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Salvar & Testar Conexão</span>
                          </>
                        )}
                      </button>

                      {testStatus.tested && (
                        <div
                          className={`flex-1 p-2 rounded-lg text-[11px] font-medium flex items-center gap-2 ${
                            testStatus.success
                              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                              : 'bg-rose-50 text-rose-900 border border-rose-200'
                          }`}
                        >
                          {testStatus.success ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          )}
                          <span>{testStatus.message}</span>
                        </div>
                      )}
                    </div>
                  </form>
                </div>

                {/* PASSO 3 */}
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-950 text-xs flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[11px] font-bold">
                        3
                      </span>
                      Criar as Tabelas no Supabase (SQL Editor)
                    </span>
                    <a
                      href="https://supabase.com/dashboard/project/_/sql/new"
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <span>Abrir SQL Editor do Supabase</span>
                      <ExternalLink className="w-3 h-3 text-emerald-600" />
                    </a>
                  </div>

                  <p className="text-emerald-900 text-[11px] leading-relaxed">
                    Copie todo o script SQL já pronto clicando no botão verde abaixo. Depois, cole na tela do <b>SQL Editor</b> do Supabase e clique no botão verde <b>RUN</b>:
                  </p>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => handleCopySql(fullSqlSchema, true)}
                      className="py-2.5 px-4 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
                    >
                      {copiedStep3 ? (
                        <>
                          <Check className="w-4 h-4 text-white" />
                          <span>Copiado com Sucesso! Agora Cole no SQL Editor</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copiar Script SQL Completo (1-Clique)</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleDownloadSql}
                      className="py-2.5 px-3 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Baixar full_schema.sql</span>
                    </button>
                  </div>
                </div>

                {/* PASSO 4 */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center text-[11px] font-bold">
                      4
                    </span>
                    Tudo Pronto! Banco na Nuvem Ativo
                  </span>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Assim que você rodar o SQL no Supabase, clique em <b>"Salvar & Testar Conexão"</b> no Passo 2.
                    Se desejar popular o banco na nuvem com o catálogo de demonstração da loja (peças, tamanhos e despesas), clique no botão abaixo:
                  </p>

                  <div className="pt-1">
                    <button
                      type="button"
                      disabled={isSeeding}
                      onClick={async () => {
                        setIsSeeding(true);
                        setSeedMessage(null);
                        const res = await seedDemoDataToSupabase();
                        setIsSeeding(false);
                        setSeedMessage(res.message);
                      }}
                      className="py-2 px-3 text-xs font-semibold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      {isSeeding ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-700" />
                          <span>Enviando dados para o Supabase...</span>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="w-4 h-4 text-emerald-700" />
                          <span>Popular Supabase com Dados Demo (1-Clique)</span>
                        </>
                      )}
                    </button>
                    {seedMessage && (
                      <p className="text-[11px] text-emerald-800 font-medium mt-2 bg-emerald-50 p-2 rounded border border-emerald-200">
                        {seedMessage}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MIGRATION FILES VIEWER */}
          {activeTab === 'migrations' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700 text-xs">Arquivo de Migration:</span>
                  <select
                    value={selectedFile}
                    onChange={(e) => setSelectedFile(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500 font-semibold"
                  >
                    <option value="full_schema.sql">🌟 full_schema.sql (Todas as Migrations Juntas)</option>
                    {migrations.map((m) => (
                      <option key={m.filename} value={m.filename}>
                        {m.filename} ({(m.size / 1024).toFixed(1)} KB)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopySql()}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar SQL</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleDownloadSql}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              </div>

              {/* Code Preview Box */}
              <div className="relative">
                <div className="absolute top-3 right-3 text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                  PostgreSQL / Supabase DDL
                </div>
                <pre className="p-4 bg-slate-900 text-slate-200 font-mono text-[11px] rounded-xl overflow-x-auto max-h-96 leading-relaxed border border-slate-800 select-all">
                  {currentSqlContent || '-- Carregando arquivo SQL...'}
                </pre>
              </div>

              {/* Migration Descriptions Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-[11px]">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="font-bold text-slate-800 block">01: Initial Schema</span>
                  <span className="text-slate-500">Tabelas de produtos, grade de tamanhos, financeiro e vendas.</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="font-bold text-slate-800 block">02: RLS & RBAC</span>
                  <span className="text-slate-500">Permissões para Administradora vs Vendedora.</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="font-bold text-slate-800 block">03: Triggers & Automação</span>
                  <span className="text-slate-500">Baixa automática de estoque e lançamento de receita no caixa.</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="font-bold text-slate-800 block">04: Seed Data</span>
                  <span className="text-slate-500">Peças reais de moda praia/íntima, metas e despesas de exemplo.</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: GITHUB & CI/CD CONFIGURATION */}
          {activeTab === 'github' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2">
                  <GitBranch className="w-5 h-5 text-rose-600" />
                  <h3 className="font-bold text-slate-900 text-xs">
                    Configurações e Workflows do GitHub Prontos
                  </h3>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  O repositório já conta com automações de Integração Contínua (CI) e execução de migrations configuradas em <code>.github/workflows/</code>:
                </p>

                <div className="space-y-2">
                  <div className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-slate-800 text-[11px]">.github/workflows/ci.yml</span>
                      <p className="text-slate-500 text-[10px]">
                        Verifica linter TypeScript, compilação Vite e valida integridade das migrations a cada push ou PR.
                      </p>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold text-[10px]">Ativo</span>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-slate-800 text-[11px]">.github/workflows/supabase-migration.yml</span>
                      <p className="text-slate-500 text-[10px]">
                        Aplica automaticamente novas migrations no Supabase quando novos arquivos SQL entram na branch <code>main</code>.
                      </p>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold text-[10px]">Ativo</span>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-slate-800 text-[11px]">.github/workflows/deploy-vercel.yml</span>
                      <p className="text-slate-500 text-[10px]">
                        Publica a versão de produção na Vercel com CDN global e certificados SSL automáticos.
                      </p>
                    </div>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-semibold text-[10px]">Pronto</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-slate-800 text-xs">
                      🔑 Secrets Necessários no Repositório do GitHub:
                    </h4>
                    <a
                      href="https://github.com/geraldosaantos-lgtm/moda-praia/settings/secrets/actions"
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded text-[11px] font-semibold flex items-center gap-1 transition-colors"
                    >
                      <span>Abrir Secrets no GitHub</span>
                      <ExternalLink className="w-3 h-3 text-slate-500" />
                    </a>
                  </div>
                  <p className="text-slate-600 text-[11px] mb-2">
                    Repositório: <b>geraldosaantos-lgtm/moda-praia</b> &gt; Cadastre as seguintes chaves em <b>New repository secret</b>:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-slate-700 font-mono text-[11px] bg-white p-3 rounded-lg border border-slate-200">
                    <li><b>VITE_SUPABASE_URL</b>: URL pública do projeto Supabase</li>
                    <li><b>VITE_SUPABASE_ANON_KEY</b>: Chave pública anônima</li>
                    <li><b>SUPABASE_PROJECT_ID</b>: ID de referência do seu projeto</li>
                    <li><b>SUPABASE_ACCESS_TOKEN</b>: Token pessoal de acesso gerado no Supabase</li>
                    <li><b>SUPABASE_DB_PASSWORD</b>: Senha do banco de dados</li>
                    <li><b>GEMINI_API_KEY</b>: Chave de API Google Gemini</li>
                  </ul>
                </div>

                {/* Vercel Environment Variables Guide */}
                <div className="mt-4 pt-4 border-t border-slate-200 bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-600" />
                    <h4 className="font-bold text-slate-900 text-xs">
                      🌐 Como Configurar as Variáveis na Vercel (Para o Site Carregar Seus Dados)
                    </h4>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Se você importou o repositório <b>moda-praia</b> na Vercel, adicione essas duas variáveis para sincronizar automaticamente com o Supabase:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-slate-700 text-[11px] bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <li>Acesse o painel do seu projeto na <b>Vercel</b></li>
                    <li>Clique na aba <b>Settings</b> &gt; <b>Environment Variables</b></li>
                    <li>Adicione <code>VITE_SUPABASE_URL</code> com o valor da sua URL do Supabase</li>
                    <li>Adicione <code>VITE_SUPABASE_ANON_KEY</code> com o valor da sua Anon Key</li>
                    <li>Clique em <b>Save</b> e depois em <b>Deployments</b> &gt; <b>Redeploy</b></li>
                  </ol>
                  <p className="text-[10px] text-slate-500 italic">
                    💡 Dica: Mesmo sem configurar a Vercel agora, o Aura Moda funciona no seu navegador com armazenamento local inteligente, permitindo cadastrar peças, registrar vendas e simular lucros sem erros!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SECURITY & RBAC */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* RBAC Rules */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4 text-rose-600" />
                    <span>Matriz de Controle de Acesso (RBAC)</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    O sistema e o banco de dados impõem segregação de funções estrita:
                  </p>
                  <div className="space-y-2 pt-1">
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <span className="font-bold text-rose-700 block">👑 Administradora (Helena)</span>
                      <span className="text-[11px] text-slate-600">
                        Visualiza CMV e custos de fornecedor, ajusta markups de produtos, cadastra novas peças, gerencia contas a pagar e tem acesso ao DRE.
                      </span>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <span className="font-bold text-slate-700 block">🛍️ Vendedora (Camila)</span>
                      <span className="text-[11px] text-slate-600">
                        Opera o PDV no balcão, consulta estoques por tamanho e preços ao consumidor. <b>Custos de fábrica e contas a pagar são 100% ocultados.</b>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Database Security */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Row Level Security (RLS) no PostgreSQL</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    A segurança não depende apenas do frontend: o próprio banco de dados PostgreSQL bloqueia operações não autorizadas.
                  </p>
                  <ul className="list-disc list-inside space-y-1.5 text-slate-600 text-[11px] pt-1">
                    <li>
                      <b>Tabela de Finanças:</b> Acesso restrito via função <code>is_admin()</code>.
                    </li>
                    <li>
                      <b>Triggers de Estoque:</b> Toda venda no PDV desconta estoque no banco e insere registro financeiro sem risco de inconsistência.
                    </li>
                    <li>
                      <b>Chaves Protegidas:</b> A chave do Gemini e os segredos operacionais nunca são expostos no bundle estático do cliente.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
            <span>PostgreSQL 15 &bull; Supabase CLI Ready &bull; Modo Seguro Ativo</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
