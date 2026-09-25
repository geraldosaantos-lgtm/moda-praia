export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      usuarios: {
        Row: {
          id: string;
          auth_user_id: string | null;
          email: string;
          nome: string;
          cargo: 'admin' | 'vendedor';
          avatar_url: string | null;
          ativo: boolean;
          criado_em: string;
          atualizado_em: string;
        };
        Insert: {
          id?: string;
          auth_user_id?: string | null;
          email: string;
          nome: string;
          cargo?: 'admin' | 'vendedor';
          avatar_url?: string | null;
          ativo?: boolean;
          criado_em?: string;
          atualizado_em?: string;
        };
        Update: {
          id?: string;
          auth_user_id?: string | null;
          email?: string;
          nome?: string;
          cargo?: 'admin' | 'vendedor';
          avatar_url?: string | null;
          ativo?: boolean;
          criado_em?: string;
          atualizado_em?: string;
        };
      };
      produtos: {
        Row: {
          id: string;
          sku: string;
          modelo: string;
          categoria: 'moda_praia' | 'moda_intima' | 'vestuario' | 'acessorios';
          descricao: string | null;
          cor: string;
          estampa: string | null;
          alerta_estoque_minimo: number;
          custo_peca: number;
          custo_frete_fornecedor: number;
          custo_embalagem: number;
          outros_custos: number;
          custo_total_cmv: number;
          markup_a_vista_pct: number;
          markup_a_prazo_pct: number;
          preco_a_vista: number;
          preco_a_prazo: number;
          max_parcelas: number;
          total_vendido: number;
          dias_sem_venda: number;
          imagem_url: string | null;
          ativo: boolean;
          criado_em: string;
          atualizado_em: string;
        };
        Insert: {
          id?: string;
          sku: string;
          modelo: string;
          categoria: 'moda_praia' | 'moda_intima' | 'vestuario' | 'acessorios';
          descricao?: string | null;
          cor: string;
          estampa?: string | null;
          alerta_estoque_minimo?: number;
          custo_peca?: number;
          custo_frete_fornecedor?: number;
          custo_embalagem?: number;
          outros_custos?: number;
          markup_a_vista_pct?: number;
          markup_a_prazo_pct?: number;
          preco_a_vista?: number;
          preco_a_prazo?: number;
          max_parcelas?: number;
          total_vendido?: number;
          dias_sem_venda?: number;
          imagem_url?: string | null;
          ativo?: boolean;
          criado_em?: string;
          atualizado_em?: string;
        };
        Update: {
          id?: string;
          sku?: string;
          modelo?: string;
          categoria?: 'moda_praia' | 'moda_intima' | 'vestuario' | 'acessorios';
          descricao?: string | null;
          cor?: string;
          estampa?: string | null;
          alerta_estoque_minimo?: number;
          custo_peca?: number;
          custo_frete_fornecedor?: number;
          custo_embalagem?: number;
          outros_custos?: number;
          markup_a_vista_pct?: number;
          markup_a_prazo_pct?: number;
          preco_a_vista?: number;
          preco_a_prazo?: number;
          max_parcelas?: number;
          total_vendido?: number;
          dias_sem_venda?: number;
          imagem_url?: string | null;
          ativo?: boolean;
          criado_em?: string;
          atualizado_em?: string;
        };
      };
      produto_tamanhos: {
        Row: {
          id: string;
          produto_id: string;
          tamanho: string;
          quantidade: number;
          codigo_barras: string | null;
          criado_em: string;
          atualizado_em: string;
        };
        Insert: {
          id?: string;
          produto_id: string;
          tamanho: string;
          quantidade?: number;
          codigo_barras?: string | null;
          criado_em?: string;
          atualizado_em?: string;
        };
        Update: {
          id?: string;
          produto_id?: string;
          tamanho?: string;
          quantidade?: number;
          codigo_barras?: string | null;
          criado_em?: string;
          atualizado_em?: string;
        };
      };
      movimentacoes_financeiras: {
        Row: {
          id: string;
          tipo: 'receita' | 'despesa';
          categoria: string;
          descricao: string;
          valor: number;
          data_vencimento: string;
          data_pagamento: string | null;
          status: 'pendente' | 'pago' | 'recebido' | 'vencido';
          forma_pagamento: string | null;
          documento_ref: string | null;
          usuario_id: string | null;
          criado_em: string;
          atualizado_em: string;
        };
        Insert: {
          id?: string;
          tipo: 'receita' | 'despesa';
          categoria: string;
          descricao: string;
          valor: number;
          data_vencimento: string;
          data_pagamento?: string | null;
          status?: 'pendente' | 'pago' | 'recebido' | 'vencido';
          forma_pagamento?: string | null;
          documento_ref?: string | null;
          usuario_id?: string | null;
          criado_em?: string;
          atualizado_em?: string;
        };
        Update: {
          id?: string;
          tipo?: 'receita' | 'despesa';
          categoria?: string;
          descricao?: string;
          valor?: number;
          data_vencimento?: string;
          data_pagamento?: string | null;
          status?: 'pendente' | 'pago' | 'recebido' | 'vencido';
          forma_pagamento?: string | null;
          documento_ref?: string | null;
          usuario_id?: string | null;
          criado_em?: string;
          atualizado_em?: string;
        };
      };
      vendas: {
        Row: {
          id: string;
          codigo_venda: string;
          cliente_nome: string | null;
          cliente_telefone: string | null;
          vendedor_id: string | null;
          vendedor_nome: string;
          subtotal: number;
          desconto: number;
          valor_total: number;
          custo_total: number;
          lucro_bruto: number;
          margem_lucro_pct: number;
          forma_pagamento: string;
          parcelas: number;
          observacoes: string | null;
          criado_em: string;
        };
        Insert: {
          id?: string;
          codigo_venda: string;
          cliente_nome?: string | null;
          cliente_telefone?: string | null;
          vendedor_id?: string | null;
          vendedor_nome: string;
          subtotal?: number;
          desconto?: number;
          valor_total: number;
          custo_total: number;
          lucro_bruto: number;
          margem_lucro_pct?: number;
          forma_pagamento: string;
          parcelas?: number;
          observacoes?: string | null;
          criado_em?: string;
        };
        Update: {
          id?: string;
          codigo_venda?: string;
          cliente_nome?: string | null;
          cliente_telefone?: string | null;
          vendedor_id?: string | null;
          vendedor_nome?: string;
          subtotal?: number;
          desconto?: number;
          valor_total?: number;
          custo_total?: number;
          lucro_bruto?: number;
          margem_lucro_pct?: number;
          forma_pagamento?: string;
          parcelas?: number;
          observacoes?: string | null;
          criado_em?: string;
        };
      };
      venda_itens: {
        Row: {
          id: string;
          venda_id: string;
          produto_id: string | null;
          tamanho: string;
          quantidade: number;
          preco_unitario: number;
          custo_unitario: number;
          total: number;
          lucro_item: number;
          criado_em: string;
        };
        Insert: {
          id?: string;
          venda_id: string;
          produto_id?: string | null;
          tamanho: string;
          quantidade: number;
          preco_unitario: number;
          custo_unitario: number;
          total: number;
          lucro_item: number;
          criado_em?: string;
        };
        Update: {
          id?: string;
          venda_id?: string;
          produto_id?: string | null;
          tamanho?: string;
          quantidade?: number;
          preco_unitario?: number;
          custo_unitario?: number;
          total?: number;
          lucro_item?: number;
          criado_em?: string;
        };
      };
      metas_vendas: {
        Row: {
          id: string;
          periodo: 'dia' | 'semana' | 'mes';
          valor_meta: number;
          meta_ticket_medio: number;
          meta_pecas_atendimento: number;
          observacoes: string | null;
          atualizado_em: string;
        };
        Insert: {
          id?: string;
          periodo: 'dia' | 'semana' | 'mes';
          valor_meta: number;
          meta_ticket_medio: number;
          meta_pecas_atendimento?: number;
          observacoes?: string | null;
          atualizado_em?: string;
        };
        Update: {
          id?: string;
          periodo?: 'dia' | 'semana' | 'mes';
          valor_meta?: number;
          meta_ticket_medio?: number;
          meta_pecas_atendimento?: number;
          observacoes?: string | null;
          atualizado_em?: string;
        };
      };
    };
    Views: {
      vw_produtos_com_estoque: {
        Row: {
          id: string;
          sku: string;
          modelo: string;
          categoria: 'moda_praia' | 'moda_intima' | 'vestuario' | 'acessorios';
          cor: string;
          estampa: string | null;
          alerta_estoque_minimo: number;
          custo_total_cmv: number;
          preco_a_vista: number;
          preco_a_prazo: number;
          total_vendido: number;
          dias_sem_venda: number;
          imagem_url: string | null;
          estoque_total: number;
          alerta_estoque_baixo: boolean;
          margem_contribuicao_pct: number;
        };
      };
    };
  };
};
