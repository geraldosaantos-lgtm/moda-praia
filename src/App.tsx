import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard,
  Package,
  DollarSign,
  Sparkles,
  Database,
  ShoppingCart,
  Plus,
  Shield,
  Layers,
} from 'lucide-react';
import type {
  Product,
  FinancialTransaction,
  Sale,
  BusinessAnalytics,
  User,
  UserRole,
  ComboSuggestion,
} from './types';
import {
  fetchProducts,
  fetchFinancials,
  fetchSales,
  calculateAnalytics,
  saveProduct,
  deleteProduct,
  saveFinancial,
  updateFinancialStatus,
  deleteFinancial,
  createSale,
  updateGoals,
} from './lib/dataService';
import { Header } from './components/Header';
import { DashboardOverview } from './components/DashboardOverview';
import { ProductsCatalog } from './components/ProductsCatalog';
import { FinancialManagement } from './components/FinancialManagement';
import { AISalesPlanner } from './components/AISalesPlanner';
import { ProductFormModal } from './components/ProductFormModal';
import { PointOfSaleModal } from './components/PointOfSaleModal';
import { SupabaseAndSecurityModal } from './components/SupabaseAndSecurityModal';

type NavTab = 'dashboard' | 'catalog' | 'financials' | 'ai';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [currentUser, setCurrentUser] = useState<User>({
    id: 'usr-admin-1',
    name: 'Helena Castro',
    email: 'admin@auramoda.com.br',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  });

  // Main data states
  const [products, setProducts] = useState<Product[]>([]);
  const [financials, setFinancials] = useState<FinancialTransaction[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [analytics, setAnalytics] = useState<BusinessAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);

  const [isPOSOpen, setIsPOSOpen] = useState(false);
  const [posInitialProduct, setPosInitialProduct] = useState<Product | null>(null);

  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);

  // Fetch initial data
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [fetchedProducts, fetchedFinancials, fetchedSales] = await Promise.all([
        fetchProducts(),
        fetchFinancials(),
        fetchSales(),
      ]);

      setProducts(fetchedProducts);
      setFinancials(fetchedFinancials);
      setSales(fetchedSales);

      const computedAnalytics = calculateAnalytics(fetchedProducts, fetchedSales);
      setAnalytics(computedAnalytics);
    } catch (err) {
      console.error('Error fetching store data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // User Switcher (Helena - Admin vs Camila - Vendedora)
  const handleSwitchUser = (role: UserRole) => {
    if (role === 'admin') {
      setCurrentUser({
        id: 'usr-admin-1',
        name: 'Helena Castro',
        email: 'admin@auramoda.com.br',
        role: 'admin',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      });
    } else {
      setCurrentUser({
        id: 'usr-seller-1',
        name: 'Camila Rocha',
        email: 'vendedor@auramoda.com.br',
        role: 'vendedor',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      });
    }
  };

  // Product CRUD
  const handleSaveProduct = async (productData: Partial<Product>) => {
    await saveProduct(productData, productToEdit?.id);
    await fetchData();
  };

  const handleDeleteProduct = async (id: string) => {
    await deleteProduct(id);
    await fetchData();
  };

  // Financial CRUD
  const handleAddFinancial = async (tx: Partial<FinancialTransaction>) => {
    await saveFinancial(tx);
    await fetchData();
  };

  const handleUpdateFinancialStatus = async (id: string, newStatus: any) => {
    await updateFinancialStatus(id, newStatus);
    await fetchData();
  };

  const handleDeleteFinancial = async (id: string) => {
    await deleteFinancial(id);
    await fetchData();
  };

  // POS Sale Completion
  const handleCompleteSale = async (saleData: any) => {
    const sale = await createSale(saleData);
    await fetchData();
    return sale;
  };

  // Goals Update
  const handleUpdateGoals = async (goals: any) => {
    await updateGoals(goals);
    await fetchData();
  };

  // Quick sell triggers
  const handleQuickSellProduct = (prod: Product) => {
    setPosInitialProduct(prod);
    setIsPOSOpen(true);
  };

  const handleQuickSellCombo = (combo: ComboSuggestion) => {
    // Open POS with first product pre-selected
    const firstProd = products.find((p) => p.id === combo.productIds[0]);
    setPosInitialProduct(firstProd || null);
    setIsPOSOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 pb-20 md:pb-10 font-sans">
      {/* Top Application Header */}
      <Header
        currentUser={currentUser}
        onSwitchUser={handleSwitchUser}
        onOpenPOS={() => {
          setPosInitialProduct(null);
          setIsPOSOpen(true);
        }}
        onOpenNewProduct={() => {
          setProductToEdit(null);
          setIsProductModalOpen(true);
        }}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Navigation Tabs (Desktop / Tablet) */}
        <div className="flex items-center justify-between border-b border-slate-200">
          <nav className="flex space-x-1 sm:space-x-4 overflow-x-auto text-xs font-semibold">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-3 px-3.5 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'dashboard'
                  ? 'border-rose-600 text-rose-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Visão Geral & Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('catalog')}
              className={`py-3 px-3.5 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'catalog'
                  ? 'border-rose-600 text-rose-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Catálogo & Precificação ({products.length})</span>
            </button>

            {currentUser.role === 'admin' && (
              <button
                onClick={() => setActiveTab('financials')}
                className={`py-3 px-3.5 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'financials'
                    ? 'border-rose-600 text-rose-600'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <DollarSign className="w-4 h-4" />
                <span>Controle Financeiro</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('ai')}
              className={`py-3 px-3.5 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'ai'
                  ? 'border-rose-600 text-rose-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>IA & Planejamento de Vendas</span>
            </button>
          </nav>

          <div className="hidden lg:flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Sistema Seguro & Ativo
            </span>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'dashboard' && (
          <DashboardOverview
            analytics={analytics}
            sales={sales}
            userRole={currentUser.role}
            onNavigateTab={(tab) => {
              if (tab === 'pos') {
                setPosInitialProduct(null);
                setIsPOSOpen(true);
              } else {
                setActiveTab(tab);
              }
            }}
            onOpenNewProduct={() => {
              setProductToEdit(null);
              setIsProductModalOpen(true);
            }}
            onOpenPOS={() => {
              setPosInitialProduct(null);
              setIsPOSOpen(true);
            }}
          />
        )}

        {activeTab === 'catalog' && (
          <ProductsCatalog
            products={products}
            userRole={currentUser.role}
            onOpenNewProduct={() => {
              setProductToEdit(null);
              setIsProductModalOpen(true);
            }}
            onEditProduct={(prod) => {
              setProductToEdit(prod);
              setIsProductModalOpen(true);
            }}
            onDeleteProduct={handleDeleteProduct}
            onQuickSell={handleQuickSellProduct}
          />
        )}

        {activeTab === 'financials' && currentUser.role === 'admin' && (
          <FinancialManagement
            transactions={financials}
            userRole={currentUser.role}
            onAddTransaction={handleAddFinancial}
            onUpdateStatus={handleUpdateFinancialStatus}
            onDeleteTransaction={handleDeleteFinancial}
          />
        )}

        {activeTab === 'ai' && (
          <AISalesPlanner
            analytics={analytics}
            isLoading={isLoading}
            onRefreshAnalytics={fetchData}
            onQuickSellCombo={handleQuickSellCombo}
            onUpdateGoals={handleUpdateGoals}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-4 py-2 flex items-center justify-around shadow-lg">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-1 text-[10px] ${
            activeTab === 'dashboard' ? 'text-rose-600 font-bold' : 'text-slate-500'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Início</span>
        </button>

        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex flex-col items-center gap-1 text-[10px] ${
            activeTab === 'catalog' ? 'text-rose-600 font-bold' : 'text-slate-500'
          }`}
        >
          <Package className="w-5 h-5" />
          <span>Peças</span>
        </button>

        <button
          onClick={() => {
            setPosInitialProduct(null);
            setIsPOSOpen(true);
          }}
          className="flex flex-col items-center -mt-5 bg-rose-600 text-white p-3 rounded-full shadow-lg hover:bg-rose-700"
        >
          <ShoppingCart className="w-5 h-5" />
        </button>

        {currentUser.role === 'admin' && (
          <button
            onClick={() => setActiveTab('financials')}
            className={`flex flex-col items-center gap-1 text-[10px] ${
              activeTab === 'financials' ? 'text-rose-600 font-bold' : 'text-slate-500'
            }`}
          >
            <DollarSign className="w-5 h-5" />
            <span>Finanças</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('ai')}
          className={`flex flex-col items-center gap-1 text-[10px] ${
            activeTab === 'ai' ? 'text-rose-600 font-bold' : 'text-slate-500'
          }`}
        >
          <Sparkles className="w-5 h-5 text-amber-500" />
          <span>IA Vendas</span>
        </button>
      </div>

      {/* Product Modal (Cadastro / Edição) */}
      <ProductFormModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setProductToEdit(null);
        }}
        onSave={handleSaveProduct}
        productToEdit={productToEdit}
      />

      {/* Point of Sale Modal */}
      <PointOfSaleModal
        isOpen={isPOSOpen}
        onClose={() => {
          setIsPOSOpen(false);
          setPosInitialProduct(null);
        }}
        products={products}
        currentUserName={currentUser.name}
        initialProduct={posInitialProduct}
        onCompleteSale={handleCompleteSale}
      />

      {/* Supabase & Cloud Architecture Modal */}
      <SupabaseAndSecurityModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
      />
    </div>
  );
}
