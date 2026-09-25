# 🌺 Aura Moda (Beach & Intimates) — Sistema de Gestão, Precificação & PDV

Sistema completo de gestão comercial, controle de estoque com grade dinâmica, precificador matemático automático baseado em CMV/Markup, fluxo de caixa e inteligência de vendas para lojas de moda praia e moda íntima.

---

## 🏗️ Arquitetura do Projeto

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS + Lucide Icons.
- **Backend**: Express com endpoints REST e proxy de segurança para IA.
- **Banco de Dados & Autenticação**: **Supabase (PostgreSQL 15)** com Row Level Security (RLS) e triggers automáticos.
- **CI/CD**: GitHub Actions (Lint, Typecheck, Build, Validação de Migrations e Deploy).
- **Inteligência Artificial**: Google Gemini (`gemini-3.8-flash`) para diagnóstico comercial e sugestão de combos de alto ticket médio.

---

## 🗄️ Estrutura de Migrations do Supabase

Todas as migrations do banco de dados estão localizadas na pasta [`/supabase/migrations`](./supabase/migrations):

| Migration | Arquivo | Descrição |
| :--- | :--- | :--- |
| **01 - Schema Inicial** | `20260923000001_initial_schema.sql` | Tabelas de usuários, produtos, grade de tamanhos, financeiro, vendas balcão, itens e metas. |
| **02 - Segurança & RLS** | `20260923000002_rls_security_policies.sql` | Políticas de Row Level Security e RBAC diferenciando Administradora e Vendedora. |
| **03 - Triggers & Automação** | `20260923000003_triggers_and_functions.sql` | Baixa de estoque automática no PDV, lançamento de receita no caixa e auditoria de margem. |
| **04 - Carga Inicial (Seeds)** | `20260923000004_seed_data.sql` | Catálogo de moda praia e íntima, usuários padrão, movimentações de caixa e metas. |
| **Unificado (1-Click)** | `supabase/full_schema.sql` | Script único consolidado contendo todas as etapas acima prontas para colar e executar. |

---

## 🚀 Como Configurar e Executar no Supabase

### Opção 1: Via SQL Editor do Painel Supabase (Recomendado e mais rápido)
1. Crie uma conta ou acesse [Supabase Dashboard](https://supabase.com/dashboard).
2. Crie um novo projeto (ex: `aura-moda-loja`).
3. No menu lateral esquerdo, clique no ícone **SQL Editor** (`>_`).
4. Abra o arquivo [`supabase/full_schema.sql`](./supabase/full_schema.sql) deste repositório, copie todo o conteúdo e cole no SQL Editor.
5. Clique no botão **Run** (Executar).
6. Pronto! Todas as tabelas, tipos, enums, triggers de estoque e dados iniciais foram gerados!

### Opção 2: Via Supabase CLI
```bash
# 1. Instalar Supabase CLI
npm install -g supabase

# 2. Login na sua conta
supabase login

# 3. Linkar ao seu projeto
supabase link --project-ref SEU_PROJECT_REF

# 4. Enviar as migrations para o banco
supabase db push
```

---

## 🔐 Configuração dos Secrets no GitHub (GitHub Actions)

Repositório configurado: **[github.com/geraldosaantos-lgtm/moda-praia](https://github.com/geraldosaantos-lgtm/moda-praia)**

Para ativar a integração contínua (CI) e o deploy automatizado de migrations pelo GitHub Actions, adicione os seguintes segredos no seu repositório:

1. Acesse: **https://github.com/geraldosaantos-lgtm/moda-praia/settings/secrets/actions**
2. Clique em **New repository secret** e cadastre as variáveis:

| Nome do Secret | Origem | Descrição |
| :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | Supabase > Project Settings > API | URL do projeto (`https://xxxx.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Supabase > Project Settings > API | Chave pública anônima do cliente |
| `SUPABASE_PROJECT_ID` | Supabase > General Settings | ID de referência do projeto |
| `SUPABASE_ACCESS_TOKEN` | Supabase > Account > Access Tokens | Token pessoal de acesso para CLI |
| `SUPABASE_DB_PASSWORD` | Senha definida na criação do banco | Senha da instância PostgreSQL |
| `GEMINI_API_KEY` | Google AI Studio | Chave para os diagnósticos de IA |

---

## 🌐 Deploy na Vercel

1. Importe o repositório no [Vercel](https://vercel.com).
2. Em **Environment Variables**, adicione:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `GEMINI_API_KEY`
3. O build command padrão é `npm run build` e a saída é `dist`.
4. Deploy em produção com 1 clique!

---

## 🛡️ Políticas de Segurança & RBAC

- **Administradora (Helena)**: Acesso ilimitado ao cadastro, edição, custos de fábrica dos fornecedores, fretes, margens reais de contribuição, contas a pagar e auditoria financeira.
- **Vendedora (Camila)**: Acesso ao catálogo para consulta de estoque, visualização da grade por tamanho, preços de venda ao consumidor e terminal de vendas balcão (PDV). Os custos confidenciais dos fornecedores e contas a pagar ficam restritos.
