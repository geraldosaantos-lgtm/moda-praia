import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Calculator,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Package,
  Layers,
  HelpCircle,
} from 'lucide-react';
import type { Product, ProductCategory, SizeStock } from '../types';
import { BarcodeBadge } from './BarcodeBadge';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: Partial<Product>) => Promise<void>;
  productToEdit?: Product | null;
}

const CATEGORIES: { value: ProductCategory; label: string }[] = [
  { value: 'moda_praia', label: 'Moda Praia (Biquínis, Maiôs, Saídas)' },
  { value: 'moda_intima', label: 'Moda Íntima & Lingerie' },
  { value: 'vestuario', label: 'Vestuário & Moda Casual' },
  { value: 'acessorios', label: 'Acessórios & Bolsas' },
];

const DEFAULT_SIZES = ['P', 'M', 'G', 'GG'];

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  productToEdit,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ProductCategory>('moda_praia');
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [minStockAlert, setMinStockAlert] = useState(5);

  // Sizes & Quantities
  const [sizes, setSizes] = useState<SizeStock[]>([
    { size: 'P', quantity: 5 },
    { size: 'M', quantity: 10 },
    { size: 'G', quantity: 5 },
  ]);
  const [newSizeName, setNewSizeName] = useState('');

  // Cost Breakdown
  const [itemCost, setItemCost] = useState<number>(35.0);
  const [supplierShipping, setSupplierShipping] = useState<number>(3.0);
  const [packagingCost, setPackagingCost] = useState<number>(2.5);
  const [otherCosts, setOtherCosts] = useState<number>(1.0);

  // Pricing Form
  const [cashMarkupPercent, setCashMarkupPercent] = useState<number>(140);
  const [installmentMarkupPercent, setInstallmentMarkupPercent] = useState<number>(12);
  const [maxInstallments, setMaxInstallments] = useState<number>(3);

  // Manual overrides if user tweaks price directly
  const [customCashPrice, setCustomCashPrice] = useState<number | null>(null);
  const [customInstallmentPrice, setCustomInstallmentPrice] = useState<number | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setCategory(productToEdit.category);
      setSku(productToEdit.sku);
      setDescription(productToEdit.description || '');
      setColor(productToEdit.color || '');
      setImageUrl(productToEdit.imageUrl || '');
      setMinStockAlert(productToEdit.minStockAlert || 5);
      setSizes(productToEdit.sizes || []);
      setItemCost(productToEdit.costs.itemCost);
      setSupplierShipping(productToEdit.costs.supplierShipping);
      setPackagingCost(productToEdit.costs.packagingCost);
      setOtherCosts(productToEdit.costs.otherCosts);
      setCashMarkupPercent(productToEdit.pricing.cashMarkupPercent);
      setInstallmentMarkupPercent(productToEdit.pricing.installmentMarkupPercent);
      setMaxInstallments(productToEdit.pricing.maxInstallments);
      setCustomCashPrice(productToEdit.pricing.calculatedCashPrice);
      setCustomInstallmentPrice(productToEdit.pricing.calculatedInstallmentPrice);
    } else {
      resetForm();
      generateNewSku('moda_praia', 'Biquíni');
    }
  }, [productToEdit, isOpen]);

  const resetForm = () => {
    setName('');
    setCategory('moda_praia');
    setDescription('');
    setColor('');
    setImageUrl('');
    setMinStockAlert(5);
    setSizes([
      { size: 'P', quantity: 4 },
      { size: 'M', quantity: 8 },
      { size: 'G', quantity: 4 },
    ]);
    setItemCost(38.0);
    setSupplierShipping(3.5);
    setPackagingCost(2.5);
    setOtherCosts(1.0);
    setCashMarkupPercent(140);
    setInstallmentMarkupPercent(12);
    setMaxInstallments(3);
    setCustomCashPrice(null);
    setCustomInstallmentPrice(null);
    setErrorMsg('');
  };

  const generateNewSku = async (cat: string, modelName: string) => {
    try {
      const res = await fetch('/api/products/generate-sku', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: cat, name: modelName }),
      });
      const data = await res.json();
      if (data.sku) {
        setSku(data.sku);
      }
    } catch {
      const rand = Math.floor(1000 + Math.random() * 9000);
      setSku(`MODA-${rand}`);
    }
  };

  // Calculations
  const totalCost = Number((itemCost + supplierShipping + packagingCost + otherCosts).toFixed(2));

  // Calculated suggested cash price
  const calculatedCashPrice =
    customCashPrice !== null
      ? customCashPrice
      : Number((totalCost * (1 + cashMarkupPercent / 100)).toFixed(2));

  // Calculated suggested installment price
  const calculatedInstallmentPrice =
    customInstallmentPrice !== null
      ? customInstallmentPrice
      : Number((calculatedCashPrice * (1 + installmentMarkupPercent / 100)).toFixed(2));

  const calculatedInstallmentValue = Number(
    (calculatedInstallmentPrice / Math.max(1, maxInstallments)).toFixed(2)
  );

  const cashGrossProfit = Number((calculatedCashPrice - totalCost).toFixed(2));
  const cashMarginPercent =
    calculatedCashPrice > 0
      ? Number((((calculatedCashPrice - totalCost) / calculatedCashPrice) * 100).toFixed(2))
      : 0;

  const totalStockQuantity = sizes.reduce((acc, s) => acc + (Number(s.quantity) || 0), 0);

  // Helper to round to classic retail psychological price (.90)
  const applyPsychologicalPricing = () => {
    const rounded = Math.floor(calculatedCashPrice) + 0.9;
    setCustomCashPrice(Number(rounded.toFixed(2)));
    const inst = Number((rounded * (1 + installmentMarkupPercent / 100)).toFixed(2));
    setCustomInstallmentPrice(inst);
  };

  // Size handlers
  const handleSizeQuantityChange = (index: number, qty: number) => {
    const updated = [...sizes];
    updated[index].quantity = Math.max(0, qty);
    setSizes(updated);
  };

  const handleAddSize = () => {
    if (!newSizeName.trim()) return;
    const cleanSize = newSizeName.trim().toUpperCase();
    if (sizes.some((s) => s.size === cleanSize)) {
      setErrorMsg(`O tamanho "${cleanSize}" já existe na grade.`);
      return;
    }
    setSizes([...sizes, { size: cleanSize, quantity: 4 }]);
    setNewSizeName('');
    setErrorMsg('');
  };

  const handleRemoveSize = (index: number) => {
    if (sizes.length <= 1) {
      setErrorMsg('O produto deve ter ao menos um tamanho cadastrado.');
      return;
    }
    setSizes(sizes.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Informe o modelo/nome da peça.');
      return;
    }
    if (!sku.trim()) {
      setErrorMsg('O código único (SKU) é obrigatório.');
      return;
    }
    if (totalCost <= 0) {
      setErrorMsg('O custo total da peça deve ser maior que zero.');
      return;
    }
    if (calculatedCashPrice <= totalCost) {
      setErrorMsg('O preço de venda à vista não pode ser menor que o custo total (prejuízo).');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      await onSave({
        sku,
        name,
        category,
        description,
        color,
        imageUrl:
          imageUrl.trim() ||
          (category === 'moda_praia'
            ? 'https://images.unsplash.com/photo-1582639510494-c80b5de9f148?w=500&auto=format&fit=crop&q=80'
            : 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&auto=format&fit=crop&q=80'),
        sizes,
        totalStock: totalStockQuantity,
        minStockAlert,
        costs: {
          itemCost,
          supplierShipping,
          packagingCost,
          otherCosts,
          totalCost,
        },
        pricing: {
          cashMarkupPercent,
          installmentMarkupPercent,
          maxInstallments,
          calculatedCashPrice,
          calculatedInstallmentPrice,
          calculatedInstallmentValue,
          cashGrossProfit,
          cashMarginPercent,
        },
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao salvar a peça');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl my-auto max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
                <Package className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-slate-800 font-editorial">
                {productToEdit ? 'Editar Peça' : 'Cadastro de Nova Peça'}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Informe os dados do modelo, controle a grade de estoque e precifique automaticamente.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 flex-1">
          {/* Section 1: Informações Gerais */}
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              <Layers className="w-4 h-4" />
              <span>1. Informações Básicas do Modelo</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Modelo */}
              <div className="md:col-span-6">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Modelo / Nome da Peça *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Biquíni Ripple Cortininha, Maiô Sunset..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              {/* Categoria */}
              <div className="md:col-span-6">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Categoria *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ProductCategory)}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* SKU e Código de Barras */}
              <div className="md:col-span-6">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Código Único da Peça (SKU) *
                  </label>
                  <button
                    type="button"
                    onClick={() => generateNewSku(category, name || 'PECA')}
                    className="text-[11px] text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    Gerar Código
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Ex: PRAIA-BIQ-2026-01"
                    value={sku}
                    onChange={(e) => setSku(e.target.value.toUpperCase())}
                    className="flex-1 font-mono text-sm px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg uppercase focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                  {sku && <BarcodeBadge sku={sku} showText={false} className="hidden sm:inline-flex" />}
                </div>
              </div>

              {/* Cor / Estampa */}
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cor / Estampa
                </label>
                <input
                  type="text"
                  placeholder="Ex: Terracota / Dourado"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              {/* Alerta Estoque Mínimo */}
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Estoque Mínimo (Alerta)
                </label>
                <input
                  type="number"
                  min="1"
                  value={minStockAlert}
                  onChange={(e) => setMinStockAlert(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              {/* URL da Imagem */}
              <div className="md:col-span-12">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  URL da Foto do Produto (opcional)
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100" />

          {/* Section 2: Grade de Tamanhos & Estoque */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <Package className="w-4 h-4" />
                <span>2. Grade de Tamanhos & Quantidades em Estoque</span>
              </div>
              <div className="text-xs text-slate-600 font-medium">
                Total em Estoque:{' '}
                <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                  {totalStockQuantity} peças
                </span>
              </div>
            </div>

            <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200">
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 mb-3">
                {sizes.map((s, idx) => (
                  <div
                    key={idx}
                    className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                        {s.size}
                      </span>
                      {sizes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSize(idx)}
                          className="text-slate-400 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block">Qtd:</label>
                      <input
                        type="number"
                        min="0"
                        value={s.quantity}
                        onChange={(e) =>
                          handleSizeQuantityChange(idx, parseInt(e.target.value) || 0)
                        }
                        className="w-full text-center text-sm font-semibold py-1 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Adicionar novo tamanho */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60">
                <span className="text-xs text-slate-500">Adicionar tamanho:</span>
                <input
                  type="text"
                  placeholder="Ex: XG, 42..."
                  value={newSizeName}
                  onChange={(e) => setNewSizeName(e.target.value)}
                  className="w-24 px-2.5 py-1 text-xs uppercase bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-rose-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSize();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddSize}
                  className="px-2.5 py-1 text-xs font-medium bg-slate-800 text-white rounded-md hover:bg-slate-900 transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Incluir
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100" />

          {/* Section 3: Composição de Custos */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <DollarSign className="w-4 h-4" />
                <span>3. Composição de Custos Unitários (Fornecedor & Insumos)</span>
              </div>
              <div className="text-xs text-slate-700">
                Custo Total (CMV):{' '}
                <span className="font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                  R$ {totalCost.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/80 p-4 rounded-xl border border-slate-200">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  1. Custo da Peça (Fornecedor)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-slate-400">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={itemCost}
                    onChange={(e) => {
                      setItemCost(parseFloat(e.target.value) || 0);
                      setCustomCashPrice(null);
                    }}
                    className="w-full pl-8 pr-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  2. Frete do Fornecedor / Peça
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-slate-400">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={supplierShipping}
                    onChange={(e) => {
                      setSupplierShipping(parseFloat(e.target.value) || 0);
                      setCustomCashPrice(null);
                    }}
                    className="w-full pl-8 pr-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  3. Embalagens (Sacola, Tag, Seda)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-slate-400">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={packagingCost}
                    onChange={(e) => {
                      setPackagingCost(parseFloat(e.target.value) || 0);
                      setCustomCashPrice(null);
                    }}
                    className="w-full pl-8 pr-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  4. Outros Custos Diretos
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-slate-400">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={otherCosts}
                    onChange={(e) => {
                      setOtherCosts(parseFloat(e.target.value) || 0);
                      setCustomCashPrice(null);
                    }}
                    className="w-full pl-8 pr-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500 font-semibold"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100" />

          {/* Section 4: Precificação Automática & Indicadores de Margem */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <Calculator className="w-4 h-4" />
                <span>4. Formação Automática de Preço (À Vista e a Prazo)</span>
              </div>
              <button
                type="button"
                onClick={applyPsychologicalPricing}
                className="text-xs text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-md font-medium transition-colors"
              >
                Arredondar para R$ ...,90
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Painel de Parâmetros */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Parâmetros de Margem Desejada
                </h4>

                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                    <span>Markup Desejado à Vista</span>
                    <span className="font-bold text-slate-900">{cashMarkupPercent}%</span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="250"
                    step="5"
                    value={cashMarkupPercent}
                    onChange={(e) => {
                      setCashMarkupPercent(parseFloat(e.target.value));
                      setCustomCashPrice(null);
                      setCustomInstallmentPrice(null);
                    }}
                    className="w-full accent-rose-600"
                  />
                  <span className="text-[10px] text-slate-400">
                    Recomendado para vestuário e moda praia: 120% a 180%
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Acréscimo a Prazo / Taxa Cartão (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="40"
                      value={installmentMarkupPercent}
                      onChange={(e) => {
                        setInstallmentMarkupPercent(parseFloat(e.target.value) || 0);
                        setCustomInstallmentPrice(null);
                      }}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Parcelas Sem Juros
                    </label>
                    <select
                      value={maxInstallments}
                      onChange={(e) => setMaxInstallments(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500 font-semibold"
                    >
                      <option value="1">1x (Sem parcelamento)</option>
                      <option value="2">2x</option>
                      <option value="3">3x (Padrão Moda)</option>
                      <option value="4">4x</option>
                      <option value="6">6x</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Resultado & Validador de Margem */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4 rounded-xl shadow-md flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-700 mb-3">
                    <span className="text-xs text-slate-300 uppercase tracking-wider font-medium">
                      Preços Finais Calculados
                    </span>
                    {cashMarginPercent >= 50 ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Margem Segura
                      </span>
                    ) : cashMarginPercent >= 40 ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-medium">
                        <AlertTriangle className="w-3.5 h-3.5" /> Margem de Alerta
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-rose-400 font-bold">
                        <AlertTriangle className="w-3.5 h-3.5" /> Margem Baixa / Risco
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <span className="text-[11px] text-slate-400 block">Preço à Vista:</span>
                      <div className="text-2xl font-extrabold text-emerald-400 font-editorial">
                        R$ {calculatedCashPrice.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block">
                        Preço a Prazo ({maxInstallments}x de R$ {calculatedInstallmentValue.toFixed(2)}):
                      </span>
                      <div className="text-xl font-bold text-white font-editorial">
                        R$ {calculatedInstallmentPrice.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-700/80 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400">Lucro Bruto Unitário: </span>
                    <span className="font-bold text-white">R$ {cashGrossProfit.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Margem sobre Venda: </span>
                    <span
                      className={`font-bold ${
                        cashMarginPercent >= 50
                          ? 'text-emerald-400'
                          : cashMarginPercent >= 40
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {cashMarginPercent.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Salvando...' : productToEdit ? 'Atualizar Peça' : 'Salvar no Catálogo'}
          </button>
        </div>
      </div>
    </div>
  );
};
