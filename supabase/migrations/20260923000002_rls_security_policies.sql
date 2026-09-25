-- ============================================================================
-- MIGRATION 02: Row Level Security (RLS) & Role-Based Access Control (RBAC)
-- Versão: 20260923000002
-- Descrição: Políticas granulares de segurança para Admin vs Vendedora
-- ============================================================================

-- 1. Habilitar RLS em todas as tabelas públicas
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produto_tamanhos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimentacoes_financeiras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venda_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metas_vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.combos_promocionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditoria_precos_log ENABLE ROW LEVEL SECURITY;

-- 2. Função Auxiliar: Verificar se o usuário autenticado atual é Administrador
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

-- 3. Políticas para USUARIOS
DROP POLICY IF EXISTS "Usuários autenticados podem ver lista de usuários" ON public.usuarios;
CREATE POLICY "Usuários autenticados podem ver lista de usuários"
ON public.usuarios FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Apenas admins podem inserir ou modificar usuários" ON public.usuarios;
CREATE POLICY "Apenas admins podem inserir ou modificar usuários"
ON public.usuarios FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 4. Políticas para PRODUTOS
DROP POLICY IF EXISTS "Leitura de produtos permitida a usuários autenticados" ON public.produtos;
CREATE POLICY "Leitura de produtos permitida a usuários autenticados"
ON public.produtos FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Apenas admins podem criar, editar ou excluir produtos" ON public.produtos;
CREATE POLICY "Apenas admins podem criar, editar ou excluir produtos"
ON public.produtos FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 5. Políticas para PRODUTO_TAMANHOS (Grade de estoque)
DROP POLICY IF EXISTS "Leitura de tamanhos permitida a usuários autenticados" ON public.produto_tamanhos;
CREATE POLICY "Leitura de tamanhos permitida a usuários autenticados"
ON public.produto_tamanhos FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Admins podem alterar grade e estoque diretamente" ON public.produto_tamanhos;
CREATE POLICY "Admins podem alterar grade e estoque diretamente"
ON public.produto_tamanhos FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Vendedores autenticados podem atualizar estoque via baixa de venda" ON public.produto_tamanhos;
CREATE POLICY "Vendedores autenticados podem atualizar estoque via baixa de venda"
ON public.produto_tamanhos FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 6. Políticas para MOVIMENTAÇÕES FINANCEIRAS (Controle restrito à administração)
DROP POLICY IF EXISTS "Apenas admins podem visualizar movimentações financeiras" ON public.movimentacoes_financeiras;
CREATE POLICY "Apenas admins podem visualizar movimentações financeiras"
ON public.movimentacoes_financeiras FOR SELECT
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "Apenas admins podem gerenciar movimentações financeiras" ON public.movimentacoes_financeiras;
CREATE POLICY "Apenas admins podem gerenciar movimentações financeiras"
ON public.movimentacoes_financeiras FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 7. Políticas para VENDAS (PDV)
DROP POLICY IF EXISTS "Admins e vendedores autenticados podem registrar vendas" ON public.vendas;
CREATE POLICY "Admins e vendedores autenticados podem registrar vendas"
ON public.vendas FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Visualização de vendas: Admins veem tudo, Vendedores veem todas do dia/balcão" ON public.vendas;
CREATE POLICY "Visualização de vendas: Admins veem tudo, Vendedores veem todas do dia/balcão"
ON public.vendas FOR SELECT
TO authenticated
USING (
    public.is_admin() OR 
    vendedor_id IN (SELECT id FROM public.usuarios WHERE auth_user_id = auth.uid()) OR
    true
);

DROP POLICY IF EXISTS "Apenas admins podem excluir ou estornar vendas" ON public.vendas;
CREATE POLICY "Apenas admins podem excluir ou estornar vendas"
ON public.vendas FOR DELETE
TO authenticated
USING (public.is_admin());

-- 8. Políticas para VENDA_ITENS
DROP POLICY IF EXISTS "Inserção de itens de venda no checkout" ON public.venda_itens;
CREATE POLICY "Inserção de itens de venda no checkout"
ON public.venda_itens FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Visualização de itens de vendas" ON public.venda_itens;
CREATE POLICY "Visualização de itens de vendas"
ON public.venda_itens FOR SELECT
TO authenticated
USING (true);

-- 9. Políticas para METAS_VENDAS
DROP POLICY IF EXISTS "Todos autenticados podem visualizar as metas" ON public.metas_vendas;
CREATE POLICY "Todos autenticados podem visualizar as metas"
ON public.metas_vendas FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Apenas admins podem ajustar as metas" ON public.metas_vendas;
CREATE POLICY "Apenas admins podem ajustar as metas"
ON public.metas_vendas FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 10. Políticas para COMBOS_PROMOCIONAIS & AUDITORIA
DROP POLICY IF EXISTS "Visualização de combos para equipe de vendas" ON public.combos_promocionais;
CREATE POLICY "Visualização de combos para equipe de vendas"
ON public.combos_promocionais FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Apenas admins gerenciam combos" ON public.combos_promocionais;
CREATE POLICY "Apenas admins gerenciam combos"
ON public.combos_promocionais FOR ALL
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "Apenas admins acessam logs de auditoria de preço" ON public.auditoria_precos_log;
CREATE POLICY "Apenas admins acessam logs de auditoria de preço"
ON public.auditoria_precos_log FOR ALL
TO authenticated
USING (public.is_admin());
