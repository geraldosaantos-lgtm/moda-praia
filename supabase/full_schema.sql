-- ============================================================================
-- AURA MODA - SCRIPT COMPLETO E UNIFICADO PARA SUPABASE (POSTGRESQL)
-- Inclui: Tabelas, Tipos, RLS, Triggers de Baixa de Estoque, Fluxo de Caixa e Seeds
-- ============================================================================

-- 1. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cargo_usuario') THEN
        CREATE TYPE cargo_usuario AS ENUM ('admin', 'vendedor');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'categoria_produto') THEN
        CREATE TYPE categoria_produto AS ENUM ('moda_praia', 'moda_intima', 'vestuario', 'acessorios');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_movimentacao') THEN
        CREATE TYPE tipo_movimentacao AS ENUM ('receita', 'despesa');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_financeiro') THEN
        CREATE TYPE status_financeiro AS ENUM ('pendente', 'pago', 'recebido', 'vencido');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'periodo_meta') THEN
        CREATE TYPE periodo_meta AS ENUM ('dia', 'semana', 'mes');
    END IF;
END $$;

-- 3. TABELAS
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE,
    email TEXT UNIQUE NOT NULL,
    nome TEXT NOT NULL,
    cargo cargo_usuario NOT NULL DEFAULT 'vendedor',
    avatar_url TEXT,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.produtos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku TEXT UNIQUE NOT NULL,
    modelo TEXT NOT NULL,
    categoria categoria_produto NOT NULL,
    descricao TEXT,
    cor TEXT NOT NULL,
    estampa TEXT,
    alerta_estoque_minimo INT NOT NULL DEFAULT 5,
    custo_peca NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    custo_frete_fornecedor NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    custo_embalagem NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    outros_custos NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    custo_total_cmv NUMERIC(10,2) GENERATED ALWAYS AS (
        custo_peca + custo_frete_fornecedor + custo_embalagem + outros_custos
    ) STORED,
    markup_a_vista_pct NUMERIC(6,2) NOT NULL DEFAULT 120.00,
    markup_a_prazo_pct NUMERIC(6,2) NOT NULL DEFAULT 12.00,
    preco_a_vista NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    preco_a_prazo NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    max_parcelas INT NOT NULL DEFAULT 3,
    total_vendido INT NOT NULL DEFAULT 0,
    dias_sem_venda INT NOT NULL DEFAULT 0,
    imagem_url TEXT,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.produto_tamanhos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    produto_id UUID NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
    tamanho VARCHAR(10) NOT NULL,
    quantidade INT NOT NULL DEFAULT 0 CHECK (quantidade >= 0),
    codigo_barras TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(produto_id, tamanho)
);

CREATE TABLE IF NOT EXISTS public.movimentacoes_financeiras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo tipo_movimentacao NOT NULL,
    categoria TEXT NOT NULL,
    descricao TEXT NOT NULL,
    valor NUMERIC(10,2) NOT NULL CHECK (valor >= 0),
    data_vencimento DATE NOT NULL,
    data_pagamento DATE,
    status status_financeiro NOT NULL DEFAULT 'pendente',
    forma_pagamento TEXT,
    documento_ref TEXT,
    usuario_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.vendas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_venda TEXT UNIQUE NOT NULL,
    cliente_nome TEXT DEFAULT 'Cliente Balcão',
    cliente_telefone TEXT,
    vendedor_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    vendedor_nome TEXT NOT NULL,
    subtotal NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    desconto NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    valor_total NUMERIC(10,2) NOT NULL,
    custo_total NUMERIC(10,2) NOT NULL,
    lucro_bruto NUMERIC(10,2) NOT NULL,
    margem_lucro_pct NUMERIC(6,2) NOT NULL DEFAULT 0.00,
    forma_pagamento TEXT NOT NULL,
    parcelas INT NOT NULL DEFAULT 1,
    observacoes TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.venda_itens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venda_id UUID NOT NULL REFERENCES public.vendas(id) ON DELETE CASCADE,
    produto_id UUID REFERENCES public.produtos(id) ON DELETE SET NULL,
    tamanho VARCHAR(10) NOT NULL,
    quantidade INT NOT NULL CHECK (quantidade > 0),
    preco_unitario NUMERIC(10,2) NOT NULL,
    custo_unitario NUMERIC(10,2) NOT NULL,
    total NUMERIC(10,2) NOT NULL,
    lucro_item NUMERIC(10,2) NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.metas_vendas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    periodo periodo_meta NOT NULL UNIQUE,
    valor_meta NUMERIC(10,2) NOT NULL,
    meta_ticket_medio NUMERIC(10,2) NOT NULL,
    meta_pecas_atendimento NUMERIC(4,1) NOT NULL DEFAULT 2.0,
    observacoes TEXT,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.combos_promocionais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    descricao TEXT NOT NULL,
    produtos_ids UUID[] NOT NULL,
    preco_original NUMERIC(10,2) NOT NULL,
    preco_combo NUMERIC(10,2) NOT NULL,
    desconto_percentual NUMERIC(5,2) NOT NULL,
    margem_resultante_pct NUMERIC(5,2) NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.auditoria_precos_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    produto_id UUID REFERENCES public.produtos(id) ON DELETE CASCADE,
    tipo_alerta TEXT NOT NULL,
    severidade TEXT NOT NULL CHECK (severidade IN ('baixa', 'media', 'alta', 'critica')),
    titulo TEXT NOT NULL,
    mensagem TEXT NOT NULL,
    acao_sugerida TEXT NOT NULL,
    resolvido BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ÍNDICES
CREATE INDEX IF NOT EXISTS idx_produtos_sku ON public.produtos(sku);
CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON public.produtos(categoria);
CREATE INDEX IF NOT EXISTS idx_produto_tamanhos_produto ON public.produto_tamanhos(produto_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_status ON public.movimentacoes_financeiras(status);
CREATE INDEX IF NOT EXISTS idx_vendas_codigo ON public.vendas(codigo_venda);

-- 4. SEGURANÇA E RLS
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produto_tamanhos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimentacoes_financeiras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venda_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metas_vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.combos_promocionais ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.usuarios
        WHERE (usuarios.auth_user_id = auth.uid() OR usuarios.id = auth.uid())
          AND usuarios.cargo = 'admin'
          AND usuarios.ativo = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permissões
DROP POLICY IF EXISTS "Leitura publica produtos" ON public.produtos;
CREATE POLICY "Leitura publica produtos" ON public.produtos FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin gerencia produtos" ON public.produtos;
CREATE POLICY "Admin gerencia produtos" ON public.produtos FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Leitura tamanhos" ON public.produto_tamanhos;
CREATE POLICY "Leitura tamanhos" ON public.produto_tamanhos FOR SELECT USING (true);

DROP POLICY IF EXISTS "Baixa estoque PDV" ON public.produto_tamanhos;
CREATE POLICY "Baixa estoque PDV" ON public.produto_tamanhos FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Admin financeiro" ON public.movimentacoes_financeiras;
CREATE POLICY "Admin financeiro" ON public.movimentacoes_financeiras FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Registrar vendas" ON public.vendas;
CREATE POLICY "Registrar vendas" ON public.vendas FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Consultar vendas" ON public.vendas;
CREATE POLICY "Consultar vendas" ON public.vendas FOR SELECT USING (true);

DROP POLICY IF EXISTS "Registrar itens venda" ON public.venda_itens;
CREATE POLICY "Registrar itens venda" ON public.venda_itens FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Consultar itens venda" ON public.venda_itens;
CREATE POLICY "Consultar itens venda" ON public.venda_itens FOR SELECT USING (true);

DROP POLICY IF EXISTS "Consultar metas" ON public.metas_vendas;
CREATE POLICY "Consultar metas" ON public.metas_vendas FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin gerencia metas" ON public.metas_vendas;
CREATE POLICY "Admin gerencia metas" ON public.metas_vendas FOR ALL USING (public.is_admin());

-- 5. TRIGGERS AUTOMATIZADOS
CREATE OR REPLACE FUNCTION public.processar_baixa_estoque_venda()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.produto_tamanhos
    SET quantidade = GREATEST(0, quantidade - NEW.quantidade)
    WHERE produto_id = NEW.produto_id AND tamanho = NEW.tamanho;

    UPDATE public.produtos
    SET total_vendido = total_vendido + NEW.quantidade, dias_sem_venda = 0, atualizado_em = timezone('utc'::text, now())
    WHERE id = NEW.produto_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_baixa_estoque_venda_item ON public.venda_itens;
CREATE TRIGGER trg_baixa_estoque_venda_item
AFTER INSERT ON public.venda_itens
FOR EACH ROW EXECUTE FUNCTION public.processar_baixa_estoque_venda();

CREATE OR REPLACE FUNCTION public.lancar_receita_venda_fluxo_caixa()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.movimentacoes_financeiras (
        tipo, categoria, descricao, valor, data_vencimento, data_pagamento, status, forma_pagamento, documento_ref
    ) VALUES (
        'receita', 'Vendas PDV Balcão', 'Venda ' || NEW.codigo_venda || ' - Atendente: ' || NEW.vendedor_nome,
        NEW.valor_total, CURRENT_DATE, CURRENT_DATE, 'recebido', NEW.forma_pagamento, NEW.codigo_venda
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_lancar_fluxo_caixa_venda ON public.vendas;
CREATE TRIGGER trg_lancar_fluxo_caixa_venda
AFTER INSERT ON public.vendas
FOR EACH ROW EXECUTE FUNCTION public.lancar_receita_venda_fluxo_caixa();

-- 6. DADOS INICIAIS (SEEDS)
INSERT INTO public.usuarios (id, email, nome, cargo, avatar_url)
VALUES 
  ('a0000000-0000-0000-0000-000000000001', 'admin@auramoda.com.br', 'Helena Castro', 'admin', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'),
  ('a0000000-0000-0000-0000-000000000002', 'vendedor@auramoda.com.br', 'Camila Rocha', 'vendedor', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80')
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.metas_vendas (periodo, valor_meta, meta_ticket_medio, meta_pecas_atendimento, observacoes)
VALUES 
  ('dia', 2200.00, 185.00, 2.2, 'Meta diária'),
  ('semana', 14000.00, 190.00, 2.3, 'Meta semanal'),
  ('mes', 55000.00, 195.00, 2.4, 'Meta mensal')
ON CONFLICT (periodo) DO NOTHING;

INSERT INTO public.produtos (
    id, sku, modelo, categoria, descricao, cor, estampa, alerta_estoque_minimo,
    custo_peca, custo_frete_fornecedor, custo_embalagem, outros_custos,
    markup_a_vista_pct, markup_a_prazo_pct, preco_a_vista, preco_a_prazo, max_parcelas,
    total_vendido, dias_sem_venda, imagem_url
) VALUES 
(
    'b0000000-0000-0000-0000-000000000001', 'PRAIA-BIQ-2026-01', 'Biquíni Cortininha Ripple Solar',
    'moda_praia', 'Top cortininha com babadinho levanta-bumbum em tecido canelado acetinado com proteção UV50+.',
    'Terracota / Dourado', 'Liso Acetinado', 8,
    38.00, 3.50, 2.50, 1.00, 144.20, 12.00, 109.90, 123.00, 3, 42, 1,
    'https://images.unsplash.com/photo-1582639510494-c80b5de9f148?w=500&auto=format&fit=crop&q=80'
),
(
    'b0000000-0000-0000-0000-000000000002', 'PRAIA-MAI-2026-02', 'Maiô Body Elegance Decote V',
    'moda_praia', 'Peça versátil praia e casual. Forro duplo e compressão leve.',
    'Verde Esmeralda', 'Liso', 5,
    55.00, 4.00, 3.50, 1.50, 142.10, 10.00, 154.90, 170.00, 3, 29, 2,
    'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=500&auto=format&fit=crop&q=80'
),
(
    'b0000000-0000-0000-0000-000000000003', 'INTIM-CON-2026-03', 'Conjunto Lingerie Renda Sofia',
    'moda_intima', 'Sutiã com aro sem bojo em renda francesa macia e calcinha asa-delta.',
    'Preto Clássico', 'Floral Delicado', 6,
    34.00, 3.00, 2.50, 0.50, 150.00, 10.00, 99.90, 110.00, 2, 38, 0,
    'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&auto=format&fit=crop&q=80'
),
(
    'b0000000-0000-0000-0000-000000000004', 'VEST-SAI-2026-04', 'Chemise Saída de Praia Linho Breeze',
    'vestuario', 'Camisão alongado em viscose com toque de linho, botões em madrepérola.',
    'Areia Off-White', 'Lisa', 4,
    48.00, 3.50, 3.00, 1.00, 152.00, 10.00, 139.90, 154.00, 3, 18, 3,
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&auto=format&fit=crop&q=80'
) ON CONFLICT (sku) DO NOTHING;

INSERT INTO public.produto_tamanhos (produto_id, tamanho, quantidade, codigo_barras)
VALUES 
    ('b0000000-0000-0000-0000-000000000001', 'P', 8, '7891001001014'),
    ('b0000000-0000-0000-0000-000000000001', 'M', 14, '7891001001021'),
    ('b0000000-0000-0000-0000-000000000001', 'G', 6, '7891001001038'),
    ('b0000000-0000-0000-0000-000000000002', 'P', 4, '7891001002011'),
    ('b0000000-0000-0000-0000-000000000002', 'M', 9, '7891001002028'),
    ('b0000000-0000-0000-0000-000000000002', 'G', 5, '7891001002035'),
    ('b0000000-0000-0000-0000-000000000003', 'P', 6, '7891001003018'),
    ('b0000000-0000-0000-0000-000000000003', 'M', 11, '7891001003025'),
    ('b0000000-0000-0000-0000-000000000003', 'G', 5, '7891001003032'),
    ('b0000000-0000-0000-0000-000000000004', 'Único', 12, '7891001004015')
ON CONFLICT (produto_id, tamanho) DO NOTHING;

INSERT INTO public.movimentacoes_financeiras (tipo, categoria, descricao, valor, data_vencimento, data_pagamento, status, forma_pagamento)
VALUES 
  ('despesa', 'Fornecedor de Peças', 'Fatura Fornecedor Sol & Mar Confecções', 2450.00, CURRENT_DATE + INTERVAL '5 days', NULL, 'pendente', 'Boleto Bancário'),
  ('despesa', 'Embalagens & Tags', 'Sacolas Kraft Personalizadas + Seda', 420.00, CURRENT_DATE + INTERVAL '1 day', NULL, 'pendente', 'Pix'),
  ('despesa', 'Aluguel & Condomínio', 'Aluguel Loja Física', 1900.00, CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE - INTERVAL '12 days', 'pago', 'Transferência'),
  ('receita', 'Vendas Balcão', 'Vendas Balcão Final de Semana', 2680.00, CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE - INTERVAL '2 days', 'recebido', 'Cartão de Crédito e Pix')
ON CONFLICT DO NOTHING;
