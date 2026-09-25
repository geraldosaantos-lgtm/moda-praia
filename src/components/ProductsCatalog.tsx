import React, { useState } from 'react';
import {
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  ShoppingCart,
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle2,
  Eye,
  EyeOff,
  Layers,
  Sparkles,
} from 'lucide-react';
import type { Product, ProductCategory, UserRole } from '../types';
import { BarcodeBadge } from './BarcodeBadge';

interface ProductsCatalogProps {
  products: Product[];
  userRole: UserRole;
  onOpenNewProduct: () => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => Promise<void>;
  onQuickSell: (product: Product) => void;
}

export const ProductsCatalog: React.FC<ProductsCatalogProps> = ({
  products,
  userRole,
  onOpenNewProduct,
  onEditProduct,
  onDeleteProduct,
  onQuickSell,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [showSensitiveCosts, setShowSensitiveCosts] = useState<boolean>(userRole === 'admin');
  const [selectedSkuForBarcode, setSelectedSkuForBarcode] = useState<string | null>(null);

  const isAdmin = userRole === 'admin';

  // Filter products
  const filteredProducts = products.filter((prod) => {
    const matchesSearch =
      prod.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prod.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (prod.color && prod.color.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'all' || prod.category === selectedCategory;

    let matchesStatus = true;
    if (selectedStatusFilter === 'critical') {
      matchesStatus = prod.totalStock <= prod.minStockAlert;
    } else if (selectedStatusFilter === 'stagnant') {
      matchesStatus = prod.daysWithoutSale >= 30;
    } else if (selectedStatusFilter === 'bestseller') {
      matchesStatus = prod.salesCount >= 25;
    }

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categoryCounts = {
    all: products.length,
    moda_praia: products.filter((p) => p.category === 'moda_praia').length,
    moda_intima: products.filter((p) => p.category === 'moda_intima').length,
    vestuario: products.filter((p) => p.category === 'vestuario').length,
    acessorios: products.filter((p) => p.category === 'acessorios').length,
  };

  return (
    <div className="space-y-6">
      {/* Top Bar / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-editorial">
            Catálogo de Peças & Estoque
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Gerencie modelos de moda praia, moda íntima, custos de aquisição e códigos únicos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={() => setShowSensitiveCosts(!showSensitiveCosts)}
              className="px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5"
              title="Ocultar ou mostrar custos de fornecedor"
            >
              {showSensitiveCosts ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showSensitiveCosts ? 'Ocultar Custos' : 'Ver Custos'}</span>
            </button>
          )}

          {isAdmin && (
            <button
              onClick={onOpenNewProduct}
              className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Peça</span>
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por modelo, código SKU, cor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />
          </div>

          {/* Quick status filter buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setSelectedStatusFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                selectedStatusFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todos ({products.length})
            </button>
            <button
              onClick={() => setSelectedStatusFilter('bestseller')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 ${
                selectedStatusFilter === 'bestseller'
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
              Mais Vendidas
            </button>
            <button
              onClick={() => setSelectedStatusFilter('stagnant')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 ${
                selectedStatusFilter === 'stagnant'
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Encalhadas (&gt;30d)
            </button>
            <button
              onClick={() => setSelectedStatusFilter('critical')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 ${
                selectedStatusFilter === 'critical'
                  ? 'bg-rose-700 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Estoque Crítico
            </button>
          </div>
        </div>

        {/* Categories Pills */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 overflow-x-auto text-xs">
          <span className="text-slate-400 font-medium text-[11px] shrink-0">Categorias:</span>
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              selectedCategory === 'all'
                ? 'font-bold text-rose-600 bg-rose-50'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todas ({categoryCounts.all})
          </button>
          <span className="text-slate-300">·</span>
          <button
            onClick={() => setSelectedCategory('moda_praia')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              selectedCategory === 'moda_praia'
                ? 'font-bold text-rose-600 bg-rose-50'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Moda Praia ({categoryCounts.moda_praia})
          </button>
          <span className="text-slate-300">·</span>
          <button
            onClick={() => setSelectedCategory('moda_intima')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              selectedCategory === 'moda_intima'
                ? 'font-bold text-rose-600 bg-rose-50'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Moda Íntima ({categoryCounts.moda_intima})
          </button>
          <span className="text-slate-300">·</span>
          <button
            onClick={() => setSelectedCategory('vestuario')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              selectedCategory === 'vestuario'
                ? 'font-bold text-rose-600 bg-rose-50'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Vestuário ({categoryCounts.vestuario})
          </button>
        </div>
      </div>

      {/* Grid of Products */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-800">Nenhuma peça encontrada</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Ajuste os filtros de pesquisa ou cadastre novos modelos no catálogo.
          </p>
          {isAdmin && (
            <button
              onClick={onOpenNewProduct}
              className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Cadastrar Primeira Peça
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredProducts.map((prod) => {
            const isStagnant = prod.daysWithoutSale >= 30;
            const isLowStock = prod.totalStock <= prod.minStockAlert;
            const isBestSeller = prod.salesCount >= 25;

            return (
              <div
                key={prod.id}
                className="bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                {/* Product Image & Badges */}
                <div className="relative h-48 bg-slate-100 overflow-hidden">
                  <img
                    src={prod.imageUrl || 'https://images.unsplash.com/photo-1582639510494-c80b5de9f148?w=500&auto=format&fit=crop&q=80'}
                    alt={prod.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />

                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {isBestSeller && (
                      <span className="bg-amber-500/95 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> Mais Vendida
                      </span>
                    )}
                    {isStagnant && (
                      <span className="bg-amber-600/95 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {prod.daysWithoutSale}d sem giro
                      </span>
                    )}
                    {isLowStock && (
                      <span className="bg-rose-600/95 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Estoque Baixo
                      </span>
                    )}
                  </div>

                  {/* SKU quick tag */}
                  <button
                    onClick={() => setSelectedSkuForBarcode(prod.sku)}
                    className="absolute bottom-2 right-2 bg-slate-900/80 hover:bg-slate-900 text-white font-mono text-[10px] px-2 py-1 rounded backdrop-blur-xs transition-colors"
                    title="Ver Código de Barras"
                  >
                    {prod.sku}
                  </button>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                      <span className="uppercase tracking-wider">
                        {prod.category === 'moda_praia'
                          ? 'Moda Praia'
                          : prod.category === 'moda_intima'
                          ? 'Moda Íntima'
                          : prod.category === 'vestuario'
                          ? 'Vestuário'
                          : 'Acessório'}
                      </span>
                      {prod.color && <span>{prod.color}</span>}
                    </div>

                    <h3 className="font-semibold text-slate-800 text-sm leading-snug line-clamp-1 mb-2">
                      {prod.name}
                    </h3>

                    {/* Sizes Breakdown */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                        <span>Grade de Tamanhos:</span>
                        <span className="font-semibold text-slate-700">
                          Total: {prod.totalStock} un
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {prod.sizes.map((s, idx) => (
                          <span
                            key={idx}
                            className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                              s.quantity > 0
                                ? 'bg-slate-100 text-slate-700 border border-slate-200'
                                : 'bg-slate-50 text-slate-300 line-through border border-slate-100'
                            }`}
                          >
                            {s.size}:{s.quantity}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Pricing Section */}
                  <div className="pt-3 border-t border-slate-100 space-y-1.5">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-slate-500">À Vista:</span>
                      <span className="text-lg font-bold text-slate-900 font-editorial">
                        R$ {prod.pricing.calculatedCashPrice.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>A Prazo:</span>
                      <span>
                        {prod.pricing.maxInstallments}x de R${' '}
                        {prod.pricing.calculatedInstallmentValue.toFixed(2)}
                      </span>
                    </div>

                    {/* Sensitive Costs (Only for Admin when toggled) */}
                    {isAdmin && showSensitiveCosts && (
                      <div className="pt-2 mt-2 border-t border-dashed border-slate-200 text-[10px] text-slate-500 space-y-0.5 bg-slate-50 p-2 rounded-lg">
                        <div className="flex justify-between">
                          <span>Custo Total (CMV):</span>
                          <span className="font-semibold text-rose-700">
                            R$ {prod.costs.totalCost.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Lucro Bruto:</span>
                          <span className="font-semibold text-emerald-700">
                            R$ {prod.pricing.cashGrossProfit.toFixed(2)} ({prod.pricing.cashMarginPercent.toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="px-4 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onQuickSell(prod)}
                    disabled={prod.totalStock <= 0}
                    className="flex-1 py-1.5 px-3 text-xs font-semibold text-slate-900 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40"
                  >
                    <ShoppingCart className="w-3.5 h-3.5 text-rose-600" />
                    <span>Vender</span>
                  </button>

                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditProduct(prod)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-white rounded-md transition-colors"
                        title="Editar peça"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Deseja realmente excluir a peça "${prod.name}"?`)) {
                            onDeleteProduct(prod.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-md transition-colors"
                        title="Excluir peça"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Barcode Viewer Modal */}
      {selectedSkuForBarcode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Código de Barras da Peça</h3>
            <p className="text-xs text-slate-500 mb-4">Referência SKU para etiquetas e leitor</p>
            <div className="flex justify-center p-4 bg-slate-50 rounded-xl border border-slate-200 mb-4">
              <BarcodeBadge sku={selectedSkuForBarcode} className="scale-125 my-2" />
            </div>
            <button
              onClick={() => setSelectedSkuForBarcode(null)}
              className="w-full py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
