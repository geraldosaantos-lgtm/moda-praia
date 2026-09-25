import React, { useState } from 'react';
import {
  X,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  QrCode,
  Banknote,
  CheckCircle2,
  Printer,
  Sparkles,
  User,
} from 'lucide-react';
import type { Product, SaleItem, Sale } from '../types';

interface PointOfSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  currentUserName: string;
  initialProduct?: Product | null;
  onCompleteSale: (saleData: {
    items: SaleItem[];
    customerName: string;
    sellerName: string;
    paymentMethod: 'pix' | 'cartao_credito' | 'cartao_debito' | 'dinheiro' | 'a_prazo';
    installments: number;
  }) => Promise<Sale>;
}

export const PointOfSaleModal: React.FC<PointOfSaleModalProps> = ({
  isOpen,
  onClose,
  products,
  currentUserName,
  initialProduct,
  onCompleteSale,
}) => {
  const [selectedProductId, setSelectedProductId] = useState<string>(
    initialProduct?.id || (products[0]?.id ?? '')
  );
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [cartItems, setCartItems] = useState<SaleItem[]>([]);
  const [customerName, setCustomerName] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<
    'pix' | 'cartao_credito' | 'cartao_debito' | 'dinheiro' | 'a_prazo'
  >('pix');
  const [installments, setInstallments] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);

  React.useEffect(() => {
    if (initialProduct) {
      setSelectedProductId(initialProduct.id);
      const available = initialProduct.sizes.find((s) => s.quantity > 0);
      if (available) setSelectedSize(available.size);
    } else if (products.length > 0 && !selectedProductId) {
      setSelectedProductId(products[0].id);
      const available = products[0].sizes.find((s) => s.quantity > 0);
      if (available) setSelectedSize(available.size);
    }
  }, [initialProduct, products]);

  if (!isOpen) return null;

  const currentSelectedProduct = products.find((p) => p.id === selectedProductId);

  const handleAddToCart = () => {
    if (!currentSelectedProduct) return;
    const sizeToUse =
      selectedSize || currentSelectedProduct.sizes.find((s) => s.quantity > 0)?.size || 'Único';

    const existingIndex = cartItems.findIndex(
      (item) => item.productId === currentSelectedProduct.id && item.size === sizeToUse
    );

    const unitPrice =
      paymentMethod === 'cartao_credito' && installments > 1
        ? currentSelectedProduct.pricing.calculatedInstallmentPrice
        : currentSelectedProduct.pricing.calculatedCashPrice;

    if (existingIndex > -1) {
      const updated = [...cartItems];
      updated[existingIndex].quantity += 1;
      updated[existingIndex].total = updated[existingIndex].quantity * unitPrice;
      setCartItems(updated);
    } else {
      const newItem: SaleItem = {
        productId: currentSelectedProduct.id,
        productName: currentSelectedProduct.name,
        sku: currentSelectedProduct.sku,
        size: sizeToUse,
        quantity: 1,
        unitPrice,
        unitCost: currentSelectedProduct.costs.totalCost,
        total: unitPrice,
      };
      setCartItems([...cartItems, newItem]);
    }
  };

  const handleUpdateQuantity = (index: number, delta: number) => {
    const updated = [...cartItems];
    const newQty = updated[index].quantity + delta;
    if (newQty <= 0) {
      setCartItems(updated.filter((_, i) => i !== index));
    } else {
      updated[index].quantity = newQty;
      updated[index].total = newQty * updated[index].unitPrice;
      setCartItems(updated);
    }
  };

  const handleRemoveItem = (index: number) => {
    setCartItems(cartItems.filter((_, i) => i !== index));
  };

  const totalCartAmount = cartItems.reduce((acc, item) => acc + item.total, 0);

  const handleFinishSale = async () => {
    if (cartItems.length === 0) return;
    setIsProcessing(true);
    try {
      const sale = await onCompleteSale({
        items: cartItems,
        customerName: customerName.trim() || 'Cliente Balcão',
        sellerName: currentUserName || 'Consultora de Moda',
        paymentMethod,
        installments: paymentMethod === 'cartao_credito' ? installments : 1,
      });
      setCompletedSale(sale);
    } catch (err: any) {
      alert(err.message || 'Erro ao registrar a venda');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetAll = () => {
    setCartItems([]);
    setCustomerName('');
    setCompletedSale(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <ShoppingCart className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-800 font-editorial">
                Ponto de Venda (PDV Rápido)
              </h2>
              <p className="text-xs text-slate-500">
                Lançamento imediato de peças, baixa de estoque por tamanho e comprovante.
              </p>
            </div>
          </div>
          <button
            onClick={resetAll}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {completedSale ? (
          /* Receipt View */
          <div className="p-8 text-center space-y-4 overflow-y-auto">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-bold text-slate-800 font-editorial">
              Venda Finalizada com Sucesso!
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Estoque baixado automaticamente e lançamento financeiro registrado na categoria de Vendas.
            </p>

            <div className="max-w-sm mx-auto bg-slate-50 p-4 rounded-xl border border-slate-200 text-left font-mono text-xs space-y-2">
              <div className="flex justify-between border-b border-slate-200 pb-2 font-bold text-slate-800">
                <span>Comprovante #{completedSale.code}</span>
                <span className="capitalize">{completedSale.paymentMethod}</span>
              </div>
              <div className="text-[11px] text-slate-500">
                Cliente: {completedSale.customerName} · Atendente: {completedSale.sellerName}
              </div>
              <div className="divide-y divide-slate-200 pt-1">
                {completedSale.items.map((item, idx) => (
                  <div key={idx} className="py-1 flex justify-between text-slate-700">
                    <span>
                      {item.quantity}x {item.productName} ({item.size})
                    </span>
                    <span>R$ {item.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-300 pt-2 flex justify-between font-bold text-sm text-slate-900">
                <span>TOTAL:</span>
                <span>R$ {completedSale.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-4">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                Imprimir Recibo
              </button>
              <button
                onClick={() => {
                  setCompletedSale(null);
                  setCartItems([]);
                }}
                className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors"
              >
                Nova Venda
              </button>
            </div>
          </div>
        ) : (
          /* POS Form */
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {/* Customer & Product Selection */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Cliente */}
              <div className="md:col-span-6">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome da Cliente (opcional)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Ex: Mariana Silva (ou deixe Balcão)"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              </div>

              {/* Atendente */}
              <div className="md:col-span-6">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Consultora / Atendente
                </label>
                <input
                  type="text"
                  disabled
                  value={currentUserName}
                  className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-lg text-slate-600"
                />
              </div>

              {/* Seleção do Produto */}
              <div className="md:col-span-7">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Selecionar Peça do Catálogo *
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => {
                    setSelectedProductId(e.target.value);
                    const prod = products.find((p) => p.id === e.target.value);
                    if (prod) {
                      const avail = prod.sizes.find((s) => s.quantity > 0);
                      setSelectedSize(avail?.size || '');
                    }
                  }}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id} disabled={p.totalStock <= 0}>
                      {p.name} ({p.sku}) - Estoque: {p.totalStock} un - R${' '}
                      {p.pricing.calculatedCashPrice.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tamanho */}
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tamanho *
                </label>
                <select
                  value={selectedSize}
                  onChange={(e) => setSelectedSize(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500"
                >
                  {currentSelectedProduct?.sizes.map((s) => (
                    <option key={s.size} value={s.size} disabled={s.quantity <= 0}>
                      {s.size} ({s.quantity} em estoque)
                    </option>
                  ))}
                </select>
              </div>

              {/* Botão Adicionar */}
              <div className="md:col-span-2 flex items-end">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={!currentSelectedProduct || currentSelectedProduct.totalStock <= 0}
                  className="w-full py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-rose-600 rounded-lg transition-colors flex items-center justify-center gap-1 disabled:opacity-40"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Incluir</span>
                </button>
              </div>
            </div>

            {/* Cart Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider flex justify-between">
                <span>Itens da Sacola</span>
                <span>{cartItems.length} item(ns)</span>
              </div>

              {cartItems.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  A sacola de compras está vazia. Selecione uma peça acima para incluir.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                  {cartItems.map((item, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-slate-800">{item.productName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Tamanho: <b className="text-slate-700">{item.size}</b> · Un: R${' '}
                          {item.unitPrice.toFixed(2)}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(idx, -1)}
                            className="p-1 hover:bg-white rounded transition-colors text-slate-600"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center font-bold text-xs">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(idx, 1)}
                            className="p-1 hover:bg-white rounded transition-colors text-slate-600"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <span className="w-20 text-right font-bold text-slate-900 font-editorial">
                          R$ {item.total.toFixed(2)}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Payment Options */}
            <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-3">
              <label className="block text-xs font-semibold text-slate-700">
                Forma de Pagamento
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('pix')}
                  className={`p-2.5 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 transition-colors ${
                    paymentMethod === 'pix'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <QrCode className="w-4 h-4 text-emerald-600" />
                  PIX
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('cartao_credito')}
                  className={`p-2.5 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 transition-colors ${
                    paymentMethod === 'cartao_credito'
                      ? 'bg-rose-50 border-rose-500 text-rose-800 font-bold shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-rose-600" />
                  Cartão Crédito
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('cartao_debito')}
                  className={`p-2.5 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 transition-colors ${
                    paymentMethod === 'cartao_debito'
                      ? 'bg-rose-50 border-rose-500 text-rose-800 font-bold shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-slate-600" />
                  Cartão Débito
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('dinheiro')}
                  className={`p-2.5 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 transition-colors ${
                    paymentMethod === 'dinheiro'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Banknote className="w-4 h-4 text-emerald-600" />
                  Dinheiro
                </button>
              </div>

              {/* Installments selector if credit card */}
              {paymentMethod === 'cartao_credito' && (
                <div className="pt-2 flex items-center gap-3 text-xs">
                  <span className="text-slate-600 font-medium">Parcelamento:</span>
                  <select
                    value={installments}
                    onChange={(e) => setInstallments(parseInt(e.target.value) || 1)}
                    className="px-3 py-1.5 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-rose-500"
                  >
                    <option value="1">1x (À vista no cartão)</option>
                    <option value="2">2x de R$ {(totalCartAmount / 2).toFixed(2)}</option>
                    <option value="3">3x de R$ {(totalCartAmount / 3).toFixed(2)}</option>
                    <option value="4">4x de R$ {(totalCartAmount / 4).toFixed(2)}</option>
                    <option value="6">6x de R$ {(totalCartAmount / 6).toFixed(2)}</option>
                  </select>
                </div>
              )}
            </div>

            {/* Total and Submit */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <div>
                <span className="text-xs text-slate-500 block">Total a Pagar:</span>
                <span className="text-2xl font-extrabold text-slate-900 font-editorial">
                  R$ {totalCartAmount.toFixed(2)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={resetAll}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleFinishSale}
                  disabled={isProcessing || cartItems.length === 0}
                  className="px-6 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-all disabled:opacity-40"
                >
                  {isProcessing ? 'Finalizando...' : 'Concluir Venda'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
