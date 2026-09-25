-- ============================================================================
-- MIGRATION 03: Database Functions & Automated Triggers
-- Versão: 20260923000003
-- Descrição: Automação de baixa de estoque no PDV, registro no fluxo de caixa,
--            atualização de timestamps e auditoria contínua de margem
-- ============================================================================

-- 1. Função Genérica: Atualização de Timestamp (atualizado_em)
CREATE OR REPLACE FUNCTION public.set_timestamp_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers de timestamp
DROP TRIGGER IF EXISTS trg_usuarios_updated_at ON public.usuarios;
CREATE TRIGGER trg_usuarios_updated_at
BEFORE UPDATE ON public.usuarios
FOR EACH ROW EXECUTE FUNCTION public.set_timestamp_atualizado_em();

DROP TRIGGER IF EXISTS trg_produtos_updated_at ON public.produtos;
CREATE TRIGGER trg_produtos_updated_at
BEFORE UPDATE ON public.produtos
FOR EACH ROW EXECUTE FUNCTION public.set_timestamp_atualizado_em();

DROP TRIGGER IF EXISTS trg_produto_tamanhos_updated_at ON public.produto_tamanhos;
CREATE TRIGGER trg_produto_tamanhos_updated_at
BEFORE UPDATE ON public.produto_tamanhos
FOR EACH ROW EXECUTE FUNCTION public.set_timestamp_atualizado_em();

DROP TRIGGER IF EXISTS trg_movimentacoes_updated_at ON public.movimentacoes_financeiras;
CREATE TRIGGER trg_movimentacoes_updated_at
BEFORE UPDATE ON public.movimentacoes_financeiras
FOR EACH ROW EXECUTE FUNCTION public.set_timestamp_atualizado_em();

DROP TRIGGER IF EXISTS trg_metas_updated_at ON public.metas_vendas;
CREATE TRIGGER trg_metas_updated_at
BEFORE UPDATE ON public.metas_vendas
FOR EACH ROW EXECUTE FUNCTION public.set_timestamp_atualizado_em();

-- 2. Função & Trigger: Baixa Automática de Estoque na Venda
CREATE OR REPLACE FUNCTION public.processar_baixa_estoque_venda()
RETURNS TRIGGER AS $$
DECLARE
    v_estoque_atual INT;
BEGIN
    -- Obter e descontar da grade de tamanho correspondente
    UPDATE public.produto_tamanhos
    SET quantidade = GREATEST(0, quantidade - NEW.quantidade)
    WHERE produto_id = NEW.produto_id AND tamanho = NEW.tamanho
    RETURNING quantidade INTO v_estoque_atual;

    -- Atualizar métricas do produto (total vendido e zerar dias sem venda)
    UPDATE public.produtos
    SET 
        total_vendido = total_vendido + NEW.quantidade,
        dias_sem_venda = 0,
        atualizado_em = timezone('utc'::text, now())
    WHERE id = NEW.produto_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_baixa_estoque_venda_item ON public.venda_itens;
CREATE TRIGGER trg_baixa_estoque_venda_item
AFTER INSERT ON public.venda_itens
FOR EACH ROW EXECUTE FUNCTION public.processar_baixa_estoque_venda();

-- 3. Função & Trigger: Lançamento Automático no Fluxo de Caixa ao Finalizar Venda
CREATE OR REPLACE FUNCTION public.lancar_receita_venda_fluxo_caixa()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.movimentacoes_financeiras (
        tipo,
        categoria,
        descricao,
        valor,
        data_vencimento,
        data_pagamento,
        status,
        forma_pagamento,
        documento_ref
    ) VALUES (
        'receita',
        'Vendas PDV Balcão',
        'Venda ' || NEW.codigo_venda || ' - ' || COALESCE(NEW.cliente_nome, 'Cliente Balcão') || ' (Atendente: ' || NEW.vendedor_nome || ')',
        NEW.valor_total,
        CURRENT_DATE,
        CURRENT_DATE,
        'recebido',
        NEW.forma_pagamento,
        NEW.codigo_venda
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_lancar_fluxo_caixa_venda ON public.vendas;
CREATE TRIGGER trg_lancar_fluxo_caixa_venda
AFTER INSERT ON public.vendas
FOR EACH ROW EXECUTE FUNCTION public.lancar_receita_venda_fluxo_caixa();

-- 4. Função & Trigger: Auditoria de Margem de Contribuição e Preço Mínimo
CREATE OR REPLACE FUNCTION public.auditar_margem_produto()
RETURNS TRIGGER AS $$
DECLARE
    v_custo NUMERIC(10,2);
    v_margem_pct NUMERIC(6,2);
BEGIN
    v_custo := COALESCE(NEW.custo_peca, 0) + COALESCE(NEW.custo_frete_fornecedor, 0) + 
               COALESCE(NEW.custo_embalagem, 0) + COALESCE(NEW.outros_custos, 0);

    -- Evitar divisão por zero
    IF NEW.preco_a_vista > 0 AND v_custo > 0 THEN
        v_margem_pct := ((NEW.preco_a_vista - v_custo) / NEW.preco_a_vista) * 100.0;

        -- Se margem estiver abaixo de 40%, registrar alerta crítico de auditoria
        IF v_margem_pct < 40.0 THEN
            INSERT INTO public.auditoria_precos_log (
                produto_id,
                tipo_alerta,
                severidade,
                titulo,
                mensagem,
                acao_sugerida
            ) VALUES (
                NEW.id,
                'margem_baixa',
                'critica',
                'Margem de Contribuição Perigosa: ' || ROUND(v_margem_pct, 1) || '%',
                'O produto ' || NEW.modelo || ' (SKU ' || NEW.sku || ') está operando com preço de venda R$ ' || NEW.preco_a_vista || ' para um CMV de R$ ' || v_custo || '.',
                'Aumentar o preço à vista para no mínimo R$ ' || ROUND((v_custo / 0.50)::numeric, 2) || ' para atingir a margem meta de 50%.'
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auditar_margem_produto ON public.produtos;
CREATE TRIGGER trg_auditar_margem_produto
AFTER INSERT OR UPDATE OF preco_a_vista, custo_peca, custo_frete_fornecedor, custo_embalagem, outros_custos
ON public.produtos
FOR EACH ROW EXECUTE FUNCTION public.auditar_margem_produto();

-- 5. View para Visão Geral de Estoque Consolidado
CREATE OR REPLACE VIEW public.vw_produtos_com_estoque AS
SELECT 
    p.id,
    p.sku,
    p.modelo,
    p.categoria,
    p.cor,
    p.estampa,
    p.alerta_estoque_minimo,
    p.custo_total_cmv,
    p.preco_a_vista,
    p.preco_a_prazo,
    p.total_vendido,
    p.dias_sem_venda,
    p.imagem_url,
    COALESCE(SUM(pt.quantidade), 0)::INT AS estoque_total,
    CASE 
        WHEN COALESCE(SUM(pt.quantidade), 0) <= p.alerta_estoque_minimo THEN true 
        ELSE false 
    END AS alerta_estoque_baixo,
    ROUND(((p.preco_a_vista - p.custo_total_cmv) / NULLIF(p.preco_a_vista, 0)) * 100, 2) AS margem_contribuicao_pct
FROM public.produtos p
LEFT JOIN public.produto_tamanhos pt ON pt.produto_id = p.id
GROUP BY p.id;
