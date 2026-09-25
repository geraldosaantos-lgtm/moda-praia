-- ============================================================================
-- MIGRATION 01: Initial Schema - Aura Moda (Moda Praia & Moda Íntima)
-- Versão: 20260923000001
-- Descrição: Estrutura inicial de tabelas, índices e tipos para o sistema de gestão
-- ============================================================================

-- 1. Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Criação de Tipos Enumerados (ENUMs)
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

-- 3. Tabela de Perfis de Usuários (com vinculo ao auth.users do Supabase se houver)
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

-- 4. Tabela de Produtos / Catálogo de Peças
CREATE TABLE IF NOT EXISTS public.produtos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku TEXT UNIQUE NOT NULL,
    modelo TEXT NOT NULL,
    categoria categoria_produto NOT NULL,
    descricao TEXT,
    cor TEXT NOT NULL,
    estampa TEXT,
    alerta_estoque_minimo INT NOT NULL DEFAULT 5,
    
    -- Composição de Custos de Aquisição (CMV)
    custo_peca NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    custo_frete_fornecedor NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    custo_embalagem NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    outros_custos NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    custo_total_cmv NUMERIC(10,2) GENERATED ALWAYS AS (
        custo_peca + custo_frete_fornecedor + custo_embalagem + outros_custos
    ) STORED,
    
    -- Formação de Preço e Markups
    markup_a_vista_pct NUMERIC(6,2) NOT NULL DEFAULT 120.00,
    markup_a_prazo_pct NUMERIC(6,2) NOT NULL DEFAULT 12.00,
    preco_a_vista NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    preco_a_prazo NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    max_parcelas INT NOT NULL DEFAULT 3,
    
    -- Métricas Comerciais e Estoque Geral
    total_vendido INT NOT NULL DEFAULT 0,
    dias_sem_venda INT NOT NULL DEFAULT 0,
    imagem_url TEXT,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Tabela de Grade de Tamanhos por Produto
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

-- 6. Tabela de Movimentações Financeiras (Contas a Pagar e Receber)
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

-- 7. Tabela de Vendas (PDV Balcão)
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

-- 8. Tabela de Itens da Venda
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

-- 9. Tabela de Metas de Vendas (Diária, Semanal, Mensal)
CREATE TABLE IF NOT EXISTS public.metas_vendas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    periodo periodo_meta NOT NULL UNIQUE,
    valor_meta NUMERIC(10,2) NOT NULL,
    meta_ticket_medio NUMERIC(10,2) NOT NULL,
    meta_pecas_atendimento NUMERIC(4,1) NOT NULL DEFAULT 2.0,
    observacoes TEXT,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Tabela de Combos Promocionais Sugeridos
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

-- 11. Tabela de Alertas de Auditoria de Preço
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

-- 12. Índices de Alta Performance
CREATE INDEX IF NOT EXISTS idx_produtos_sku ON public.produtos(sku);
CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON public.produtos(categoria);
CREATE INDEX IF NOT EXISTS idx_produtos_ativo ON public.produtos(ativo);
CREATE INDEX IF NOT EXISTS idx_produto_tamanhos_produto ON public.produto_tamanhos(produto_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_status ON public.movimentacoes_financeiras(status);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_data_vencimento ON public.movimentacoes_financeiras(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_tipo ON public.movimentacoes_financeiras(tipo);
CREATE INDEX IF NOT EXISTS idx_vendas_codigo ON public.vendas(codigo_venda);
CREATE INDEX IF NOT EXISTS idx_vendas_criado_em ON public.vendas(criado_em);
CREATE INDEX IF NOT EXISTS idx_venda_itens_venda ON public.venda_itens(venda_id);
CREATE INDEX IF NOT EXISTS idx_venda_itens_produto ON public.venda_itens(produto_id);
