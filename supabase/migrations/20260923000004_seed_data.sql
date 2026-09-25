-- ============================================================================
-- MIGRATION 04: Seed Data - Aura Moda (Dados Iniciais e Catálogo)
-- Versão: 20260923000004
-- Descrição: População inicial de usuários, produtos, grade de tamanhos,
--            movimentações de fluxo de caixa, metas e combos comerciais
-- ============================================================================

-- 1. Usuários Padrão (Administradora e Consultora de Vendas)
INSERT INTO public.usuarios (id, email, nome, cargo, avatar_url)
VALUES 
  ('a0000000-0000-0000-0000-000000000001', 'admin@auramoda.com.br', 'Helena Castro', 'admin', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'),
  ('a0000000-0000-0000-0000-000000000002', 'vendedor@auramoda.com.br', 'Camila Rocha', 'vendedor', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80')
ON CONFLICT (email) DO NOTHING;

-- 2. Metas de Vendas (Diária, Semanal, Mensal)
INSERT INTO public.metas_vendas (periodo, valor_meta, meta_ticket_medio, meta_pecas_atendimento, observacoes)
VALUES 
  ('dia', 2200.00, 185.00, 2.2, 'Meta focada em combos de biquíni + saída de praia'),
  ('semana', 14000.00, 190.00, 2.3, 'Campanha de lançamento da nova coleção solar'),
  ('mes', 55000.00, 195.00, 2.4, 'Meta de faturamento líquido mensal para a loja física e WhatsApp')
ON CONFLICT (periodo) DO UPDATE SET
  valor_meta = EXCLUDED.valor_meta,
  meta_ticket_medio = EXCLUDED.meta_ticket_medio;

-- 3. Catálogo de Produtos
-- Produto 1: Biquíni Cortininha Ripple Solar
INSERT INTO public.produtos (
    id, sku, modelo, categoria, descricao, cor, estampa, alerta_estoque_minimo,
    custo_peca, custo_frete_fornecedor, custo_embalagem, outros_custos,
    markup_a_vista_pct, markup_a_prazo_pct, preco_a_vista, preco_a_prazo, max_parcelas,
    total_vendido, dias_sem_venda, imagem_url
) VALUES (
    'b0000000-0000-0000-0000-000000000001',
    'PRAIA-BIQ-2026-01',
    'Biquíni Cortininha Ripple Solar',
    'moda_praia',
    'Top cortininha com babadinho levanta-bumbum em tecido canelado acetinado com proteção UV50+.',
    'Terracota / Dourado',
    'Liso Acetinado',
    8,
    38.00, 3.50, 2.50, 1.00,
    144.20, 12.00, 109.90, 123.00, 3,
    42, 1,
    'https://images.unsplash.com/photo-1582639510494-c80b5de9f148?w=500&auto=format&fit=crop&q=80'
) ON CONFLICT (sku) DO NOTHING;

-- Grade de Tamanhos do Produto 1
INSERT INTO public.produto_tamanhos (produto_id, tamanho, quantidade, codigo_barras)
VALUES 
    ('b0000000-0000-0000-0000-000000000001', 'P', 8, '7891001001014'),
    ('b0000000-0000-0000-0000-000000000001', 'M', 14, '7891001001021'),
    ('b0000000-0000-0000-0000-000000000001', 'G', 6, '7891001001038')
ON CONFLICT (produto_id, tamanho) DO NOTHING;

-- Produto 2: Maiô Body Elegance Decote V
INSERT INTO public.produtos (
    id, sku, modelo, categoria, descricao, cor, estampa, alerta_estoque_minimo,
    custo_peca, custo_frete_fornecedor, custo_embalagem, outros_custos,
    markup_a_vista_pct, markup_a_prazo_pct, preco_a_vista, preco_a_prazo, max_parcelas,
    total_vendido, dias_sem_venda, imagem_url
) VALUES (
    'b0000000-0000-0000-0000-000000000002',
    'PRAIA-MAI-2026-02',
    'Maiô Body Elegance Decote V',
    'moda_praia',
    'Peça versátil que transita da praia aos looks casuais com alfaiataria. Forro duplo e compressão leve.',
    'Verde Esmeralda',
    'Liso',
    5,
    55.00, 4.00, 3.50, 1.50,
    142.10, 10.00, 154.90, 170.00, 3,
    29, 2,
    'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=500&auto=format&fit=crop&q=80'
) ON CONFLICT (sku) DO NOTHING;

INSERT INTO public.produto_tamanhos (produto_id, tamanho, quantidade, codigo_barras)
VALUES 
    ('b0000000-0000-0000-0000-000000000002', 'P', 4, '7891001002011'),
    ('b0000000-0000-0000-0000-000000000002', 'M', 9, '7891001002028'),
    ('b0000000-0000-0000-0000-000000000002', 'G', 5, '7891001002035'),
    ('b0000000-0000-0000-0000-000000000002', 'GG', 3, '7891001002042')
ON CONFLICT (produto_id, tamanho) DO NOTHING;

-- Produto 3: Conjunto Lingerie Renda Sofia
INSERT INTO public.produtos (
    id, sku, modelo, categoria, descricao, cor, estampa, alerta_estoque_minimo,
    custo_peca, custo_frete_fornecedor, custo_embalagem, outros_custos,
    markup_a_vista_pct, markup_a_prazo_pct, preco_a_vista, preco_a_prazo, max_parcelas,
    total_vendido, dias_sem_venda, imagem_url
) VALUES (
    'b0000000-0000-0000-0000-000000000003',
    'INTIM-CON-2026-03',
    'Conjunto Lingerie Renda Sofia',
    'moda_intima',
    'Sutiã com aro sem bojo em renda francesa macia e calcinha asa-delta com acabamento invisível.',
    'Preto Clássico',
    'Floral Delicado',
    6,
    34.00, 3.00, 2.50, 0.50,
    150.00, 10.00, 99.90, 110.00, 2,
    38, 0,
    'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&auto=format&fit=crop&q=80'
) ON CONFLICT (sku) DO NOTHING;

INSERT INTO public.produto_tamanhos (produto_id, tamanho, quantidade, codigo_barras)
VALUES 
    ('b0000000-0000-0000-0000-000000000003', 'P', 6, '7891001003018'),
    ('b0000000-0000-0000-0000-000000000003', 'M', 11, '7891001003025'),
    ('b0000000-0000-0000-0000-000000000003', 'G', 5, '7891001003032')
ON CONFLICT (produto_id, tamanho) DO NOTHING;

-- Produto 4: Chemise Saída de Praia Linho Breeze
INSERT INTO public.produtos (
    id, sku, modelo, categoria, descricao, cor, estampa, alerta_estoque_minimo,
    custo_peca, custo_frete_fornecedor, custo_embalagem, outros_custos,
    markup_a_vista_pct, markup_a_prazo_pct, preco_a_vista, preco_a_prazo, max_parcelas,
    total_vendido, dias_sem_venda, imagem_url
) VALUES (
    'b0000000-0000-0000-0000-000000000004',
    'VEST-SAI-2026-04',
    'Chemise Saída de Praia Linho Breeze',
    'vestuario',
    'Camisão alongado em viscose com toque de linho, botões em madrepérola e fendas laterais elegantes.',
    'Areia Off-White',
    'Lisa',
    4,
    48.00, 3.50, 3.00, 1.00,
    152.00, 10.00, 139.90, 154.00, 3,
    18, 3,
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&auto=format&fit=crop&q=80'
) ON CONFLICT (sku) DO NOTHING;

INSERT INTO public.produto_tamanhos (produto_id, tamanho, quantidade, codigo_barras)
VALUES 
    ('b0000000-0000-0000-0000-000000000004', 'Único', 12, '7891001004015')
ON CONFLICT (produto_id, tamanho) DO NOTHING;

-- 4. Movimentações Financeiras Iniciais (Fluxo de Caixa)
INSERT INTO public.movimentacoes_financeiras (
    tipo, categoria, descricao, valor, data_vencimento, data_pagamento, status, forma_pagamento
) VALUES 
  ('despesa', 'Fornecedor de Peças', 'Fatura Fornecedor Sol & Mar Confecções (Lote Biquínis Coleção Verão)', 2450.00, '2026-09-28', NULL, 'pendente', 'Boleto Bancário'),
  ('despesa', 'Embalagens & Tags', 'Lote de Sacolas Personalizadas Kraft + Papel Seda Perfumado', 420.00, '2026-09-24', NULL, 'pendente', 'Pix'),
  ('despesa', 'Aluguel & Condomínio', 'Aluguel Ponto Comercial Loja Física', 1900.00, '2026-09-10', '2026-09-08', 'pago', 'Transferência'),
  ('despesa', 'Frete e Logística', 'Transportadora Jadlog - Reposição de Mercadorias', 165.00, '2026-09-15', '2026-09-15', 'pago', 'Pix'),
  ('receita', 'Vendas Balcão', 'Vendas Balcão Sábado - Lançamento Coleção Solar', 2680.00, '2026-09-20', '2026-09-20', 'recebido', 'Cartão de Crédito e Pix'),
  ('receita', 'Vendas WhatsApp', 'Vendas Delivery e Condicional Clientes VIP', 1340.00, '2026-09-22', '2026-09-22', 'recebido', 'Pix')
ON CONFLICT DO NOTHING;

-- 5. Combos Promocionais Sugeridos
INSERT INTO public.combos_promocionais (
    nome, descricao, produtos_ids, preco_original, preco_combo, desconto_percentual, margem_resultante_pct
) VALUES (
    'Combo Resort Tropical',
    'Biquíni Cortininha Ripple + Chemise Saída de Praia Linho Breeze',
    ARRAY['b0000000-0000-0000-0000-000000000001'::uuid, 'b0000000-0000-0000-0000-000000000004'::uuid],
    249.80,
    219.90,
    11.97,
    54.30
),
(
    'Combo Elegância Praia & Noite',
    'Maiô Body Elegance Decote V + Chemise Saída Linho',
    ARRAY['b0000000-0000-0000-0000-000000000002'::uuid, 'b0000000-0000-0000-0000-000000000004'::uuid],
    294.80,
    259.90,
    11.84,
    53.60
) ON CONFLICT DO NOTHING;
