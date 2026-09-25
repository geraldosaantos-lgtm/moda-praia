import { getSupabase } from './supabase';
import {
  INITIAL_PRODUCTS,
  INITIAL_FINANCIALS,
  INITIAL_SALES,
  INITIAL_GOALS,
  INITIAL_COMBOS,
  DEFAULT_COMPANY_SETTINGS,
  DEMO_PRODUCTS,
  DEMO_FINANCIALS,
  DEMO_SALES,
  DEMO_COMBOS,
} from './initialData';
import type {
  Product,
  FinancialTransaction,
  Sale,
  SalesGoal,
  BusinessAnalytics,
  PriceAuditAlert,
  CompanySettings,
} from '../types';

const getSb = (): any => getSupabase();

const STORAGE_KEYS = {
  PRODUCTS: 'AURA_PRODUCTS',
  FINANCIALS: 'AURA_FINANCIALS',
  SALES: 'AURA_SALES',
  GOALS: 'AURA_GOALS',
  COMPANY: 'AURA_COMPANY_SETTINGS',
  CLEAN_INITIALIZED: 'AURA_STORE_CLEAN_V2',
};

// Safe localStorage helpers
function getStored<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.warn(`Error reading ${key} from localStorage:`, e);
    return fallback;
  }
}

function setStored<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`Error saving ${key} to localStorage:`, e);
  }
}

// Limpa dados legados de teste na primeira carga para garantir tela limpa
function ensureCleanStateOnFirstLoad() {
  if (typeof window === 'undefined') return;
  const isCleaned = localStorage.getItem(STORAGE_KEYS.CLEAN_INITIALIZED);
  if (!isCleaned) {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.FINANCIALS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(INITIAL_GOALS));
    localStorage.setItem(STORAGE_KEYS.CLEAN_INITIALIZED, 'true');
  }
}

ensureCleanStateOnFirstLoad();

// ======================== COMPANY SETTINGS ========================
export async function fetchCompanySettings(): Promise<CompanySettings> {
  const cached = getStored<CompanySettings | null>(STORAGE_KEYS.COMPANY, null);
  if (cached && cached.name) {
    return cached;
  }

  try {
    const res = await fetch('/api/company');
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const json = await res.json();
      if (json && json.company) {
        setStored(STORAGE_KEYS.COMPANY, json.company);
        return json.company;
      }
    }
  } catch {
    // Vercel / offline fallback
  }

  setStored(STORAGE_KEYS.COMPANY, DEFAULT_COMPANY_SETTINGS);
  return DEFAULT_COMPANY_SETTINGS;
}

export async function saveCompanySettings(settings: CompanySettings): Promise<CompanySettings> {
  setStored(STORAGE_KEYS.COMPANY, settings);
  try {
    await fetch('/api/company', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company: settings }),
    });
  } catch {
    // Non-blocking
  }
  return settings;
}

export async function resetAllTestData(): Promise<void> {
  setStored(STORAGE_KEYS.PRODUCTS, []);
  setStored(STORAGE_KEYS.FINANCIALS, []);
  setStored(STORAGE_KEYS.SALES, []);
  setStored(STORAGE_KEYS.GOALS, INITIAL_GOALS);
  setStored(STORAGE_KEYS.CLEAN_INITIALIZED, 'true');

  try {
    await fetch('/api/reset-data', { method: 'POST' });
  } catch {
    // Non-blocking
  }
}

export async function loadDemoData(): Promise<void> {
  setStored(STORAGE_KEYS.PRODUCTS, DEMO_PRODUCTS);
  setStored(STORAGE_KEYS.FINANCIALS, DEMO_FINANCIALS);
  setStored(STORAGE_KEYS.SALES, DEMO_SALES);
  setStored(STORAGE_KEYS.GOALS, {
    day: { id: 'goal-day', period: 'dia', targetAmount: 800, currentAmount: 469.7, targetTicket: 180, currentTicket: 234.85, totalSalesCount: 2 },
    week: { id: 'goal-week', period: 'semana', targetAmount: 5000, currentAmount: 3680, targetTicket: 180, currentTicket: 193.68, totalSalesCount: 19 },
    month: { id: 'goal-month', period: 'mes', targetAmount: 22000, currentAmount: 16840, targetTicket: 185, currentTicket: 191.36, totalSalesCount: 88 },
  });

  try {
    await fetch('/api/seed-demo', { method: 'POST' });
  } catch {
    // Non-blocking
  }
}


// ======================== PRODUCTS ========================
export async function fetchProducts(): Promise<Product[]> {
  const supabase = getSb();

  // 1. Try Supabase first if configured
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select(`
          id,
          sku,
          modelo,
          categoria,
          descricao,
          cor,
          estampa,
          alerta_estoque_minimo,
          custo_peca,
          custo_frete_fornecedor,
          custo_embalagem,
          outros_custos,
          custo_total_cmv,
          markup_a_vista_pct,
          markup_a_prazo_pct,
          preco_a_vista,
          preco_a_prazo,
          max_parcelas,
          total_vendido,
          dias_sem_venda,
          imagem_url,
          criado_em,
          produto_tamanhos (
            tamanho,
            quantidade,
            codigo_barras
          )
        `)
        .eq('ativo', true)
        .order('criado_em', { ascending: false });

      if (!error && data && data.length > 0) {
        const mappedProducts: Product[] = data.map((row: any) => {
          const sizes = (row.produto_tamanhos || []).map((t: any) => ({
            size: t.tamanho,
            quantity: Number(t.quantidade) || 0,
          }));
          const totalStock = sizes.reduce((acc: number, s: any) => acc + s.quantity, 0);
          const totalCost =
            Number(row.custo_total_cmv) ||
            Number(row.custo_peca) +
              Number(row.custo_frete_fornecedor) +
              Number(row.custo_embalagem) +
              Number(row.outros_custos);
          const cashPrice = Number(row.preco_a_vista) || 0;
          const instPrice = Number(row.preco_a_prazo) || 0;
          const installments = Number(row.max_parcelas) || 3;
          const grossProfit = Number((cashPrice - totalCost).toFixed(2));
          const marginPct = cashPrice > 0 ? Number(((grossProfit / cashPrice) * 100).toFixed(2)) : 0;

          return {
            id: row.id,
            sku: row.sku,
            name: row.modelo,
            category: row.categoria,
            description: row.descricao || '',
            color: row.cor || '',
            sizes,
            totalStock,
            minStockAlert: Number(row.alerta_estoque_minimo) || 5,
            costs: {
              itemCost: Number(row.custo_peca) || 0,
              supplierShipping: Number(row.custo_frete_fornecedor) || 0,
              packagingCost: Number(row.custo_embalagem) || 0,
              otherCosts: Number(row.outros_custos) || 0,
              totalCost,
            },
            pricing: {
              cashMarkupPercent: Number(row.markup_a_vista_pct) || 120,
              installmentMarkupPercent: Number(row.markup_a_prazo_pct) || 10,
              maxInstallments: installments,
              calculatedCashPrice: cashPrice,
              calculatedInstallmentPrice: instPrice,
              calculatedInstallmentValue: Number((instPrice / installments).toFixed(2)),
              cashGrossProfit: grossProfit,
              cashMarginPercent: marginPct,
            },
            salesCount: Number(row.total_vendido) || 0,
            daysWithoutSale: Number(row.dias_sem_venda) || 0,
            createdAt: row.criado_em,
            imageUrl: row.imagem_url || '',
          };
        });

        setStored(STORAGE_KEYS.PRODUCTS, mappedProducts);
        return mappedProducts;
      }
    } catch (err) {
      console.warn('Supabase fetch products error, checking alternatives:', err);
    }
  }

  // 2. Try Node/Server API endpoint (e.g. localhost or dev container)
  try {
    const res = await fetch('/api/products');
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const json = await res.json();
      if (json && Array.isArray(json.products) && json.products.length > 0) {
        setStored(STORAGE_KEYS.PRODUCTS, json.products);
        return json.products;
      }
    }
  } catch {
    // Expected on static deployments like Vercel
  }

  // 3. Fallback to localStorage or Initial Clean State
  const cached = getStored<Product[] | null>(STORAGE_KEYS.PRODUCTS, null);
  if (cached !== null && Array.isArray(cached)) {
    return cached;
  }

  // Initialize with clean empty dataset
  setStored(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
  return INITIAL_PRODUCTS;
}

export async function saveProduct(productData: Partial<Product>, editId?: string): Promise<Product> {
  const currentProducts = await fetchProducts();
  let updatedProduct: Product;

  if (editId) {
    const existingIndex = currentProducts.findIndex((p) => p.id === editId);
    if (existingIndex >= 0) {
      updatedProduct = {
        ...currentProducts[existingIndex],
        ...productData,
        id: editId,
      } as Product;
      currentProducts[existingIndex] = updatedProduct;
    } else {
      updatedProduct = productData as Product;
      currentProducts.unshift(updatedProduct);
    }
  } else {
    const newId = `prod-${Date.now()}`;
    const totalCost =
      (productData.costs?.itemCost || 0) +
      (productData.costs?.supplierShipping || 0) +
      (productData.costs?.packagingCost || 0) +
      (productData.costs?.otherCosts || 0);

    const sizes = productData.sizes || [];
    const totalStock = sizes.reduce((acc, s) => acc + s.quantity, 0);

    updatedProduct = {
      id: newId,
      sku: productData.sku || `ITEM-${Date.now().toString().slice(-4)}`,
      name: productData.name || 'Novo Produto',
      category: productData.category || 'moda_praia',
      description: productData.description || '',
      color: productData.color || '',
      sizes,
      totalStock,
      minStockAlert: productData.minStockAlert || 5,
      costs: {
        itemCost: productData.costs?.itemCost || 0,
        supplierShipping: productData.costs?.supplierShipping || 0,
        packagingCost: productData.costs?.packagingCost || 0,
        otherCosts: productData.costs?.otherCosts || 0,
        totalCost,
      },
      pricing: productData.pricing || {
        cashMarkupPercent: 120,
        installmentMarkupPercent: 10,
        maxInstallments: 3,
        calculatedCashPrice: totalCost * 2.2,
        calculatedInstallmentPrice: totalCost * 2.4,
        calculatedInstallmentValue: (totalCost * 2.4) / 3,
        cashGrossProfit: totalCost * 1.2,
        cashMarginPercent: 54.5,
      },
      salesCount: 0,
      daysWithoutSale: 0,
      createdAt: new Date().toISOString(),
      imageUrl:
        productData.imageUrl ||
        'https://images.unsplash.com/photo-1582639510494-c80b5de9f148?w=500&auto=format&fit=crop&q=80',
    };
    currentProducts.unshift(updatedProduct);
  }

  // Update local storage cache immediately
  setStored(STORAGE_KEYS.PRODUCTS, currentProducts);

  // Background sync to Supabase if connected
  const supabase = getSb();
  if (supabase) {
    try {
      const prodPayload = {
        sku: updatedProduct.sku,
        modelo: updatedProduct.name,
        categoria: updatedProduct.category,
        descricao: updatedProduct.description,
        cor: updatedProduct.color || '',
        alerta_estoque_minimo: updatedProduct.minStockAlert,
        custo_peca: updatedProduct.costs.itemCost,
        custo_frete_fornecedor: updatedProduct.costs.supplierShipping,
        custo_embalagem: updatedProduct.costs.packagingCost,
        outros_custos: updatedProduct.costs.otherCosts,
        markup_a_vista_pct: updatedProduct.pricing.cashMarkupPercent,
        markup_a_prazo_pct: updatedProduct.pricing.installmentMarkupPercent,
        preco_a_vista: updatedProduct.pricing.calculatedCashPrice,
        preco_a_prazo: updatedProduct.pricing.calculatedInstallmentPrice,
        max_parcelas: updatedProduct.pricing.maxInstallments,
        imagem_url: updatedProduct.imageUrl,
        ativo: true,
      };

      if (editId && !editId.startsWith('prod-')) {
        // Valid UUID
        await supabase.from('produtos').update(prodPayload).eq('id', editId);
      } else {
        const { data: inserted } = await supabase.from('produtos').insert(prodPayload).select('id').single();
        if (inserted && updatedProduct.sizes.length > 0) {
          const sizesPayload = updatedProduct.sizes.map((s) => ({
            produto_id: inserted.id,
            tamanho: s.size,
            quantidade: s.quantity,
          }));
          await supabase.from('produto_tamanhos').insert(sizesPayload);
        }
      }
    } catch (e) {
      console.warn('Supabase product sync warning:', e);
    }
  }

  // Also notify server endpoint if running
  try {
    const url = editId ? `/api/products/${editId}` : '/api/products';
    const method = editId ? 'PUT' : 'POST';
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData),
    });
  } catch {
    // Non-blocking
  }

  return updatedProduct;
}

export async function deleteProduct(id: string): Promise<void> {
  const currentProducts = await fetchProducts();
  const filtered = currentProducts.filter((p) => p.id !== id);
  setStored(STORAGE_KEYS.PRODUCTS, filtered);

  const supabase = getSb();
  if (supabase) {
    try {
      await supabase.from('produtos').update({ ativo: false }).eq('id', id);
    } catch (e) {
      console.warn('Supabase product deletion warning:', e);
    }
  }

  try {
    await fetch(`/api/products/${id}`, { method: 'DELETE' });
  } catch {
    // Non-blocking
  }
}

// ======================== FINANCIALS ========================
export async function fetchFinancials(): Promise<FinancialTransaction[]> {
  const supabase = getSb();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('movimentacoes_financeiras')
        .select('*')
        .order('data_vencimento', { ascending: false });

      if (!error && data && data.length > 0) {
        const mapped: FinancialTransaction[] = data.map((row: any) => ({
          id: row.id,
          type: row.tipo,
          category: row.categoria,
          description: row.descricao,
          amount: Number(row.valor),
          dueDate: row.data_vencimento,
          paymentDate: row.data_pagamento || undefined,
          status: row.status,
          paymentMethod: row.forma_pagamento || undefined,
          referenceId: row.documento_ref || undefined,
          createdAt: row.criado_em,
        }));
        setStored(STORAGE_KEYS.FINANCIALS, mapped);
        return mapped;
      }
    } catch (e) {
      console.warn('Supabase financials error:', e);
    }
  }

  try {
    const res = await fetch('/api/financials');
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const json = await res.json();
      if (json && Array.isArray(json.transactions)) {
        setStored(STORAGE_KEYS.FINANCIALS, json.transactions);
        return json.transactions;
      }
    }
  } catch {
    // Vercel static fallback
  }

  const cached = getStored<FinancialTransaction[] | null>(STORAGE_KEYS.FINANCIALS, null);
  if (cached !== null && Array.isArray(cached)) {
    return cached;
  }

  setStored(STORAGE_KEYS.FINANCIALS, INITIAL_FINANCIALS);
  return INITIAL_FINANCIALS;
}

export async function saveFinancial(txData: Partial<FinancialTransaction>): Promise<FinancialTransaction> {
  const current = await fetchFinancials();
  const newTx: FinancialTransaction = {
    id: txData.id || `fin-${Date.now()}`,
    type: txData.type || 'despesa',
    category: txData.category || 'outros',
    description: txData.description || 'Movimentação sem descrição',
    amount: Number(txData.amount) || 0,
    dueDate: txData.dueDate || new Date().toISOString().split('T')[0],
    paymentDate: txData.paymentDate,
    status: txData.status || 'pendente',
    paymentMethod: txData.paymentMethod,
    referenceId: txData.referenceId,
    createdAt: new Date().toISOString(),
  };

  const updated = [newTx, ...current];
  setStored(STORAGE_KEYS.FINANCIALS, updated);

  const supabase = getSb();
  if (supabase) {
    try {
      await supabase.from('movimentacoes_financeiras').insert({
        tipo: newTx.type,
        categoria: newTx.category,
        descricao: newTx.description,
        valor: newTx.amount,
        data_vencimento: newTx.dueDate,
        data_pagamento: newTx.paymentDate || null,
        status: newTx.status,
        forma_pagamento: newTx.paymentMethod || null,
        documento_ref: newTx.referenceId || null,
      });
    } catch (e) {
      console.warn('Supabase financial sync warning:', e);
    }
  }

  try {
    await fetch('/api/financials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(txData),
    });
  } catch {
    // Non-blocking
  }

  return newTx;
}

export async function updateFinancialStatus(id: string, status: any): Promise<void> {
  const current = await fetchFinancials();
  const updated = current.map((item) => {
    if (item.id === id) {
      const isPaid = status === 'pago' || status === 'recebido';
      return {
        ...item,
        status,
        paymentDate: isPaid ? new Date().toISOString().split('T')[0] : item.paymentDate,
      };
    }
    return item;
  });

  setStored(STORAGE_KEYS.FINANCIALS, updated);

  const supabase = getSb();
  if (supabase) {
    try {
      await supabase
        .from('movimentacoes_financeiras')
        .update({
          status,
          data_pagamento: status === 'pago' || status === 'recebido' ? new Date().toISOString().split('T')[0] : null,
        })
        .eq('id', id);
    } catch (e) {
      console.warn('Supabase status update warning:', e);
    }
  }

  try {
    await fetch(`/api/financials/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
  } catch {
    // Non-blocking
  }
}

export async function deleteFinancial(id: string): Promise<void> {
  const current = await fetchFinancials();
  const updated = current.filter((item) => item.id !== id);
  setStored(STORAGE_KEYS.FINANCIALS, updated);

  const supabase = getSb();
  if (supabase) {
    try {
      await supabase.from('movimentacoes_financeiras').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase delete warning:', e);
    }
  }

  try {
    await fetch(`/api/financials/${id}`, { method: 'DELETE' });
  } catch {
    // Non-blocking
  }
}

// ======================== SALES ========================
export async function fetchSales(): Promise<Sale[]> {
  const supabase = getSb();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('vendas')
        .select(`
          id,
          codigo_venda,
          cliente_nome,
          vendedor_nome,
          valor_total,
          custo_total,
          lucro_bruto,
          forma_pagamento,
          parcelas,
          criado_em,
          venda_itens (
            produto_id,
            tamanho,
            quantidade,
            preco_unitario,
            custo_unitario,
            total
          )
        `)
        .order('criado_em', { ascending: false });

      if (!error && data && data.length > 0) {
        const mapped: Sale[] = data.map((row: any) => ({
          id: row.id,
          code: row.codigo_venda,
          customerName: row.cliente_nome || 'Cliente Balcão',
          sellerName: row.vendedor_nome,
          date: row.criado_em,
          totalAmount: Number(row.valor_total),
          totalCost: Number(row.custo_total),
          profit: Number(row.lucro_bruto),
          paymentMethod: row.forma_pagamento as any,
          installments: row.parcelas || 1,
          items: (row.venda_itens || []).map((it: any) => ({
            productId: it.produto_id,
            productName: 'Item de Venda',
            sku: '',
            size: it.tamanho,
            quantity: it.quantidade,
            unitPrice: Number(it.preco_unitario),
            unitCost: Number(it.custo_unitario),
            total: Number(it.total),
          })),
        }));

        setStored(STORAGE_KEYS.SALES, mapped);
        return mapped;
      }
    } catch (e) {
      console.warn('Supabase sales error:', e);
    }
  }

  try {
    const res = await fetch('/api/sales');
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const json = await res.json();
      if (json && Array.isArray(json.sales)) {
        setStored(STORAGE_KEYS.SALES, json.sales);
        return json.sales;
      }
    }
  } catch {
    // Vercel static fallback
  }

  const cached = getStored<Sale[] | null>(STORAGE_KEYS.SALES, null);
  if (cached !== null && Array.isArray(cached)) {
    return cached;
  }

  setStored(STORAGE_KEYS.SALES, INITIAL_SALES);
  return INITIAL_SALES;
}

export async function createSale(saleData: any): Promise<Sale> {
  const currentSales = await fetchSales();
  const currentProducts = await fetchProducts();

  const saleNumber = 1050 + currentSales.length;
  const newSale: Sale = {
    id: `sale-${Date.now()}`,
    code: `VND-${saleNumber}`,
    customerName: saleData.customerName || 'Cliente Balcão',
    sellerName: saleData.sellerName || 'Helena Castro',
    date: new Date().toISOString(),
    items: saleData.items || [],
    totalAmount: Number(saleData.totalAmount) || 0,
    totalCost: Number(saleData.totalCost) || 0,
    profit: Number((saleData.totalAmount - saleData.totalCost).toFixed(2)) || 0,
    paymentMethod: saleData.paymentMethod || 'pix',
    installments: saleData.installments || 1,
  };

  // 1. Save sale to storage
  const updatedSales = [newSale, ...currentSales];
  setStored(STORAGE_KEYS.SALES, updatedSales);

  // 2. Decrement product stock in local storage
  const updatedProducts = currentProducts.map((p) => {
    const soldItem = newSale.items.find((it) => it.productId === p.id);
    if (!soldItem) return p;

    const updatedSizes = p.sizes.map((s) => {
      if (s.size === soldItem.size) {
        return { ...s, quantity: Math.max(0, s.quantity - soldItem.quantity) };
      }
      return s;
    });

    const newTotalStock = updatedSizes.reduce((acc, s) => acc + s.quantity, 0);
    return {
      ...p,
      sizes: updatedSizes,
      totalStock: newTotalStock,
      salesCount: (p.salesCount || 0) + soldItem.quantity,
      lastSaleDate: new Date().toISOString().split('T')[0],
      daysWithoutSale: 0,
    };
  });
  setStored(STORAGE_KEYS.PRODUCTS, updatedProducts);

  // 3. Add financial revenue transaction
  const isCredit = newSale.paymentMethod === 'cartao_credito' || newSale.paymentMethod === 'a_prazo';
  const newFinancial: FinancialTransaction = {
    id: `fin-sale-${Date.now()}`,
    type: 'receita',
    category: 'venda_loja',
    description: `Venda Balcão #${newSale.code} - ${newSale.sellerName}`,
    amount: newSale.totalAmount,
    dueDate: new Date().toISOString().split('T')[0],
    paymentDate: !isCredit ? new Date().toISOString().split('T')[0] : undefined,
    status: !isCredit ? 'recebido' : 'pendente',
    paymentMethod: newSale.paymentMethod as any,
    referenceId: newSale.code,
    createdAt: new Date().toISOString(),
  };
  const currentFinancials = await fetchFinancials();
  setStored(STORAGE_KEYS.FINANCIALS, [newFinancial, ...currentFinancials]);

  // 4. Update Goals
  const goals = getStored(STORAGE_KEYS.GOALS, INITIAL_GOALS);
  goals.day.currentAmount = Number((goals.day.currentAmount + newSale.totalAmount).toFixed(2));
  goals.day.totalSalesCount += 1;
  goals.day.currentTicket = Number((goals.day.currentAmount / goals.day.totalSalesCount).toFixed(2));

  goals.week.currentAmount = Number((goals.week.currentAmount + newSale.totalAmount).toFixed(2));
  goals.week.totalSalesCount += 1;
  goals.week.currentTicket = Number((goals.week.currentAmount / goals.week.totalSalesCount).toFixed(2));

  goals.month.currentAmount = Number((goals.month.currentAmount + newSale.totalAmount).toFixed(2));
  goals.month.totalSalesCount += 1;
  goals.month.currentTicket = Number((goals.month.currentAmount / goals.month.totalSalesCount).toFixed(2));
  setStored(STORAGE_KEYS.GOALS, goals);

  // 5. Sync to Supabase if connected
  const supabase = getSb();
  if (supabase) {
    try {
      const { data: insertedSale } = await supabase
        .from('vendas')
        .insert({
          codigo_venda: newSale.code,
          cliente_nome: newSale.customerName,
          vendedor_nome: newSale.sellerName,
          valor_total: newSale.totalAmount,
          custo_total: newSale.totalCost,
          lucro_bruto: newSale.profit,
          forma_pagamento: newSale.paymentMethod,
          parcelas: newSale.installments,
        })
        .select('id')
        .single();

      if (insertedSale && newSale.items.length > 0) {
        const itemsPayload = newSale.items.map((it) => ({
          venda_id: insertedSale.id,
          produto_id: it.productId.startsWith('prod-') ? null : it.productId,
          tamanho: it.size,
          quantidade: it.quantity,
          preco_unitario: it.unitPrice,
          custo_unitario: it.unitCost,
          total: it.total,
          lucro_item: it.total - it.unitCost * it.quantity,
        }));
        await supabase.from('venda_itens').insert(itemsPayload);
      }
    } catch (e) {
      console.warn('Supabase sale insert warning:', e);
    }
  }

  // 6. Try backend /api/sales
  try {
    await fetch('/api/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(saleData),
    });
  } catch {
    // Non-blocking
  }

  return newSale;
}

// ======================== GOALS ========================
export async function fetchGoals(): Promise<{ day: SalesGoal; week: SalesGoal; month: SalesGoal }> {
  return getStored(STORAGE_KEYS.GOALS, INITIAL_GOALS);
}

export async function updateGoals(goals: any): Promise<void> {
  setStored(STORAGE_KEYS.GOALS, goals);
  try {
    await fetch('/api/goals', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(goals),
    });
  } catch {
    // Non-blocking
  }
}

// ======================== ANALYTICS & AUDITS ========================
export function calculateAnalytics(
  products: Product[],
  sales: Sale[],
  goals = getStored(STORAGE_KEYS.GOALS, INITIAL_GOALS)
): BusinessAnalytics {
  // Best Sellers (ordenados por volume de vendas)
  const bestSellers = [...products].sort((a, b) => b.salesCount - a.salesCount).slice(0, 4);

  // Dead Stock / Peças Encalhadas
  const deadStock = [...products]
    .filter((p) => p.totalStock > 0 && (p.daysWithoutSale >= 30 || (p.salesCount <= 5 && p.totalStock >= 10)))
    .sort((a, b) => b.daysWithoutSale - a.daysWithoutSale);

  // Combos: se tiver menos de 2 produtos cadastrados, retorna vazio
  const combos: ComboSuggestion[] = [];
  if (products.length >= 2) {
    // Sugestão automática básica baseada em categorias diferentes se houver
    const p1 = products[0];
    const p2 = products[1];
    if (p1 && p2) {
      const orig = Number((p1.pricing.calculatedCashPrice + p2.pricing.calculatedCashPrice).toFixed(2));
      const comboPr = Number((orig * 0.9).toFixed(2));
      combos.push({
        id: `combo-${p1.id}-${p2.id}`,
        title: `Combo Especial: ${p1.name} + ${p2.name}`,
        category: 'Combo Inteligente',
        productIds: [p1.id, p2.id],
        productNames: [p1.name, p2.name],
        originalTotal: orig,
        comboPrice: comboPr,
        discountPercent: 10,
        estimatedMarginPercent: Number((((comboPr - (p1.costs.totalCost + p2.costs.totalCost)) / comboPr) * 100).toFixed(1)),
        strategicReason: 'Eleva o ticket médio combinando duas peças do catálogo com 10% de desconto atrativo.',
      });
    }
  }

  // Price Audits
  const priceAudits: PriceAuditAlert[] = [];

  products.forEach((prod) => {
    // 1. Margem baixa (< 40%)
    if (prod.pricing.cashMarginPercent < 40) {
      priceAudits.push({
        id: `audit-margin-${prod.id}`,
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        currentCashPrice: prod.pricing.calculatedCashPrice,
        totalCost: prod.costs.totalCost,
        currentMarginPercent: prod.pricing.cashMarginPercent,
        issueType: 'margem_baixa',
        severity: 'urgente',
        title: 'Margem Bruta Abaixo do Limite de Segurança',
        description: `A margem atual de ${prod.pricing.cashMarginPercent.toFixed(1)}% é insuficiente para cobrir impostos, taxas de cartão e custos fixos.`,
        suggestedAction: 'Aumentar o markup para garantir margem mínima de 50%.',
        suggestedPrice: Number((prod.costs.totalCost * 2.0).toFixed(2)),
      });
    }

    // 2. Peça Encalhada
    if (prod.daysWithoutSale >= 45 && prod.totalStock > 0) {
      const suggestedDiscount = 20;
      const discountedPrice = Number((prod.pricing.calculatedCashPrice * (1 - suggestedDiscount / 100)).toFixed(2));
      const newMargin = Number((((discountedPrice - prod.costs.totalCost) / discountedPrice) * 100).toFixed(1));

      priceAudits.push({
        id: `audit-dead-${prod.id}`,
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        currentCashPrice: prod.pricing.calculatedCashPrice,
        totalCost: prod.costs.totalCost,
        currentMarginPercent: prod.pricing.cashMarginPercent,
        issueType: 'encalhado',
        severity: 'aviso',
        title: `Giro Parado há ${prod.daysWithoutSale} Dias (${prod.totalStock} peças em estoque)`,
        description: `Capital estagnado no estoque de R$ ${(prod.costs.totalCost * prod.totalStock).toFixed(2)}.`,
        suggestedAction: `Aplicar promoção relâmpago de ${suggestedDiscount}% de desconto. Margem residual será ${newMargin}%.`,
        suggestedDiscountPercent: suggestedDiscount,
        suggestedPrice: discountedPrice,
      });
    }

    // 3. Estoque Crítico
    if (prod.totalStock <= prod.minStockAlert && prod.salesCount > 10) {
      priceAudits.push({
        id: `audit-stock-${prod.id}`,
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        currentCashPrice: prod.pricing.calculatedCashPrice,
        totalCost: prod.costs.totalCost,
        currentMarginPercent: prod.pricing.cashMarginPercent,
        issueType: 'estoque_critico',
        severity: 'urgente',
        title: `Estoque Crítico (${prod.totalStock} un restantes)`,
        description: `Produto com boa saída (${prod.salesCount} vendas) atingiu o nível de reposição. Risco de ruptura.`,
        suggestedAction: 'Fazer pedido imediato ao fornecedor para reposição.',
      });
    }
  });

  const totalInventoryValueCost = products.reduce((acc, p) => acc + p.costs.totalCost * p.totalStock, 0);
  const totalInventoryValueRetail = products.reduce(
    (acc, p) => acc + p.pricing.calculatedCashPrice * p.totalStock,
    0
  );
  const potentialProfit = totalInventoryValueRetail - totalInventoryValueCost;
  const stagnantCapital = deadStock.reduce((acc, p) => acc + p.costs.totalCost * p.totalStock, 0);
  const totalSalesRevenue = sales.reduce((acc, s) => acc + s.totalAmount, 0);
  const averageTicket = sales.length > 0 ? totalSalesRevenue / sales.length : 0;

  // Atualiza currentAmount das metas com base nas vendas reais
  const activeGoals = {
    ...goals,
    month: {
      ...goals.month,
      currentAmount: Number(totalSalesRevenue.toFixed(2)),
      currentTicket: Number(averageTicket.toFixed(2)),
      totalSalesCount: sales.length,
    },
  };

  return {
    bestSellers,
    deadStock,
    combos,
    goals: activeGoals,
    priceAudits,
    summary: {
      totalInventoryValueCost: Number(totalInventoryValueCost.toFixed(2)),
      totalInventoryValueRetail: Number(totalInventoryValueRetail.toFixed(2)),
      potentialProfit: Number(potentialProfit.toFixed(2)),
      stagnantCapital: Number(stagnantCapital.toFixed(2)),
      averageTicket: Number(averageTicket.toFixed(2)),
      monthlySalesTotal: Number(totalSalesRevenue.toFixed(2)),
    },
  };
}

export async function fetchAnalyticsData(): Promise<BusinessAnalytics> {
  const [products, sales, goals] = await Promise.all([fetchProducts(), fetchSales(), fetchGoals()]);
  return calculateAnalytics(products, sales, goals);
}

// ======================== SUPABASE 1-CLICK SEED ========================
export async function seedDemoDataToSupabase(): Promise<{ success: boolean; message: string; count?: number }> {
  const supabase = getSb();
  if (!supabase) {
    return { success: false, message: 'Supabase não está configurado. Conecte com a URL e Anon Key primeiro.' };
  }

  try {
    let insertedCount = 0;
    for (const prod of INITIAL_PRODUCTS) {
      const { data: inserted, error: prodErr } = await supabase
        .from('produtos')
        .insert({
          sku: prod.sku,
          modelo: prod.name,
          categoria: prod.category,
          descricao: prod.description,
          cor: prod.color || '',
          alerta_estoque_minimo: prod.minStockAlert,
          custo_peca: prod.costs.itemCost,
          custo_frete_fornecedor: prod.costs.supplierShipping,
          custo_embalagem: prod.costs.packagingCost,
          outros_custos: prod.costs.otherCosts,
          markup_a_vista_pct: prod.pricing.cashMarkupPercent,
          markup_a_prazo_pct: prod.pricing.installmentMarkupPercent,
          preco_a_vista: prod.pricing.calculatedCashPrice,
          preco_a_prazo: prod.pricing.calculatedInstallmentPrice,
          max_parcelas: prod.pricing.maxInstallments,
          total_vendido: prod.salesCount,
          dias_sem_venda: prod.daysWithoutSale,
          imagem_url: prod.imageUrl,
          ativo: true,
        })
        .select('id')
        .single();

      if (!prodErr && inserted) {
        insertedCount++;
        const sizesData = prod.sizes.map((s) => ({
          produto_id: inserted.id,
          tamanho: s.size,
          quantidade: s.quantity,
        }));
        await supabase.from('produto_tamanhos').insert(sizesData);
      }
    }

    // Seed financial records
    for (const fin of INITIAL_FINANCIALS) {
      await supabase.from('movimentacoes_financeiras').insert({
        tipo: fin.type,
        categoria: fin.category,
        descricao: fin.description,
        valor: fin.amount,
        data_vencimento: fin.dueDate,
        data_pagamento: fin.paymentDate || null,
        status: fin.status,
        forma_pagamento: fin.paymentMethod || null,
      });
    }

    return {
      success: true,
      message: `🎉 ${insertedCount} produtos e todas as movimentações financeiras foram cadastrados no seu Supabase com sucesso!`,
      count: insertedCount,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Erro ao enviar dados para o Supabase: ${err.message}`,
    };
  }
}
