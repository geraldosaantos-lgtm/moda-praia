import React, { useState } from 'react';
import {
  Sparkles,
  ShoppingCart,
  Plus,
  Shield,
  User,
  Database,
  Menu,
  X,
  ChevronDown,
  Building2,
} from 'lucide-react';
import type { UserRole, User as UserType, CompanySettings } from '../types';

interface HeaderProps {
  currentUser: UserType;
  companySettings: CompanySettings;
  onSwitchUser: (role: UserRole) => void;
  onOpenPOS: () => void;
  onOpenNewProduct: () => void;
  onOpenSupabaseModal: () => void;
  onOpenCompanySettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  companySettings,
  onSwitchUser,
  onOpenPOS,
  onOpenNewProduct,
  onOpenSupabaseModal,
  onOpenCompanySettings,
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const isAdmin = currentUser.role === 'admin';
  const brandInitial = (companySettings.name || 'M').charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div 
          onClick={onOpenCompanySettings}
          className="flex items-center gap-3 cursor-pointer group"
          title="Clique para editar dados da empresa e logotipo"
        >
          {companySettings.logoUrl ? (
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 p-0.5 overflow-hidden shadow-2xs flex items-center justify-center shrink-0 group-hover:border-rose-300 transition-colors">
              <img
                src={companySettings.logoUrl}
                alt={companySettings.name}
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 via-rose-500 to-amber-500 flex items-center justify-center text-white font-serif font-bold text-xl shadow-xs group-hover:scale-105 transition-transform shrink-0">
              {brandInitial}
            </div>
          )}
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-editorial text-lg sm:text-xl font-bold tracking-tight text-slate-900 group-hover:text-rose-600 transition-colors">
                {companySettings.name || 'Minha Loja'}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 hidden sm:inline-block">
                {companySettings.segment || 'Moda Praia & Íntima'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 -mt-0.5 font-sans hidden md:block">
              {companySettings.phone ? `WhatsApp: ${companySettings.phone}` : 'Gestão Comercial, Precificação & PDV'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Company Data Button */}
          <button
            onClick={onOpenCompanySettings}
            className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-rose-700 bg-slate-100 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1.5 border border-slate-200"
            title="Configurar Dados da Empresa, Logotipo e Limpeza de Dados"
          >
            <Building2 className="w-3.5 h-3.5 text-rose-600" />
            <span className="hidden sm:inline">Empresa</span>
          </button>

          {/* Supabase & Infra Button */}
          <button
            onClick={onOpenSupabaseModal}
            className="px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors flex items-center gap-1.5"
            title="Ver Script Supabase, Deploy e Segurança"
          >
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden lg:inline">Supabase</span>
          </button>

          {/* Quick Sale / PDV Button */}
          <button
            onClick={onOpenPOS}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
          >
            <ShoppingCart className="w-3.5 h-3.5 text-rose-400" />
            <span>PDV Venda</span>
          </button>

          {/* New Product (Admin only) */}
          {isAdmin && (
            <button
              onClick={onOpenNewProduct}
              className="hidden sm:flex px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-2xs transition-colors items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova Peça</span>
            </button>
          )}

          {/* User Profile & Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-7 h-7 rounded-full object-cover border border-rose-200"
              />
              <div className="text-left hidden lg:block">
                <div className="text-xs font-semibold text-slate-800 leading-tight">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-slate-400 capitalize">
                  {currentUser.role === 'admin' ? 'Administradora' : 'Vendedora'}
                </div>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {/* Dropdown */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in">
                <div className="px-4 py-2 border-b border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Perfil Ativo
                  </span>
                  <div className="font-semibold text-xs text-slate-800">{currentUser.name}</div>
                  <div className="text-[11px] text-slate-500">{currentUser.email}</div>
                </div>

                <div className="px-4 py-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Alternar Papel (Teste RBAC):
                  </span>
                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        onSwitchUser('admin');
                        setIsUserMenuOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium flex items-center justify-between transition-colors ${
                        currentUser.role === 'admin'
                          ? 'bg-rose-50 text-rose-700 font-bold'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>Administradora (Acesso Total)</span>
                      {currentUser.role === 'admin' && (
                        <span className="w-2 h-2 rounded-full bg-rose-600" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        onSwitchUser('vendedor');
                        setIsUserMenuOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium flex items-center justify-between transition-colors ${
                        currentUser.role === 'vendedor'
                          ? 'bg-rose-50 text-rose-700 font-bold'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>Vendedora (Custos Ocultos)</span>
                      {currentUser.role === 'vendedor' && (
                        <span className="w-2 h-2 rounded-full bg-rose-600" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="px-4 py-2 border-t border-slate-100">
                  <button
                    onClick={() => {
                      onOpenCompanySettings();
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium text-rose-700 hover:bg-rose-50 flex items-center gap-1.5 transition-colors"
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Configurar Empresa & Logo</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
