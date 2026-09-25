### 📋 Descrição das Alterações
Descreva de forma concisa as modificações introduzidas neste Pull Request (ex: nova funcionalidade de estoque, ajuste de precificação, migration SQL, etc.).

### 🔍 Módulos Impactados
- [ ] Catálogo & Grade de Peças
- [ ] Precificador & Composição de CMV
- [ ] Fluxo de Caixa / Financeiro
- [ ] Ponto de Venda (PDV Balcão)
- [ ] Inteligência de Vendas (IA & Metas)
- [ ] Supabase / Migrations / RLS
- [ ] CI/CD & Deploy

### ✅ Checklist de Qualidade
- [ ] O código passou no linter (`npm run lint`) sem erros de tipagem TypeScript.
- [ ] A aplicação compila com sucesso (`npm run build`).
- [ ] As políticas RLS e permissões por cargo (Admin vs Vendedora) foram mantidas ou testadas.
- [ ] As novas tabelas ou colunas possuem migrations correspondentes na pasta `/supabase/migrations`.
- [ ] Nenhuma credencial ou chave privada foi incluída no código.
