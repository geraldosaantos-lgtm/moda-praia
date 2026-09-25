import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

// Helper to normalize Supabase URL
export function normalizeSupabaseUrl(url: string): string {
  let cleaned = url.trim();
  if (!cleaned) return '';
  if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    cleaned = 'https://' + cleaned;
  }
  return cleaned.replace(/\/+$/, '');
}

// Retrieve credentials from environment variables or local storage
const envUrl = normalizeSupabaseUrl((import.meta.env.VITE_SUPABASE_URL as string) || '');
const envKey = ((import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '').trim();

const storedUrl = typeof window !== 'undefined' ? normalizeSupabaseUrl(localStorage.getItem('AURA_SUPABASE_URL') || '') : '';
const storedKey = typeof window !== 'undefined' ? (localStorage.getItem('AURA_SUPABASE_KEY') || '').trim() : '';

export const SUPABASE_URL = envUrl || storedUrl;
export const SUPABASE_ANON_KEY = envKey || storedKey;

let supabaseInstance: SupabaseClient<Database> | null = null;

export const getSupabase = (): SupabaseClient<Database> | null => {
  const activeUrl = normalizeSupabaseUrl(
    (typeof window !== 'undefined' && localStorage.getItem('AURA_SUPABASE_URL')) || envUrl
  );
  const activeKey =
    ((typeof window !== 'undefined' && localStorage.getItem('AURA_SUPABASE_KEY')) || envKey).trim();

  if (!activeUrl || !activeKey) {
    return null;
  }

  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient<Database>(activeUrl, activeKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
    } catch (e) {
      console.error('Error creating Supabase client:', e);
      return null;
    }
  }
  return supabaseInstance;
};

export const resetSupabaseClient = (url: string, anonKey: string) => {
  const cleanUrl = normalizeSupabaseUrl(url);
  const cleanKey = anonKey.trim();

  if (typeof window !== 'undefined') {
    localStorage.setItem('AURA_SUPABASE_URL', cleanUrl);
    localStorage.setItem('AURA_SUPABASE_KEY', cleanKey);
  }

  if (cleanUrl && cleanKey) {
    try {
      supabaseInstance = createClient<Database>(cleanUrl, cleanKey);
    } catch {
      supabaseInstance = null;
    }
  } else {
    supabaseInstance = null;
  }
  return supabaseInstance;
};

export async function testSupabaseConnection(
  url?: string,
  key?: string
): Promise<{ success: boolean; message: string; stage?: 'credentials' | 'network' | 'schema' | 'ok' }> {
  const targetUrl = normalizeSupabaseUrl(url || SUPABASE_URL);
  const targetKey = (key || SUPABASE_ANON_KEY).trim();

  if (!targetUrl || !targetKey) {
    return {
      success: false,
      stage: 'credentials',
      message: 'Preencha o Project URL e a Anon Key do Supabase.',
    };
  }

  // Pre-validation checks to catch common user errors
  if (!targetUrl.includes('.supabase.co') && !targetUrl.includes('localhost') && !targetUrl.includes('127.0.0.1')) {
    return {
      success: false,
      stage: 'credentials',
      message: 'Atenção: A URL do Supabase normalmente tem o formato "https://[id-do-projeto].supabase.co". Verifique se copiou corretamente.',
    };
  }

  if (targetKey.startsWith('sbp_')) {
    return {
      success: false,
      stage: 'credentials',
      message: 'Você colou um Personal Access Token ("sbp_..."). Você deve usar a chave "anon public" que começa com "eyJhbGciOi...". Encontre-a em Project Settings > API.',
    };
  }

  try {
    const client = createClient(targetUrl, targetKey);

    // Test a basic request with timeout
    const fetchPromise = client.from('produtos').select('count', { count: 'exact', head: true });
    const timeoutPromise = new Promise<{ error: any }>((_, reject) =>
      setTimeout(() => reject(new Error('Tempo limite excedido ao contatar o Supabase. Verifique se o projeto está ativo e sem pausar.')), 8000)
    );

    const { error } = (await Promise.race([fetchPromise, timeoutPromise])) as any;

    if (error) {
      // Table doesn't exist yet - but connection succeeded!
      if (
        error.code === '42P01' ||
        error.message?.includes('does not exist') ||
        error.message?.includes('relation "public.produtos" does not exist')
      ) {
        return {
          success: true,
          stage: 'schema',
          message: '✅ Conexão estabelecida com sucesso! Seu projeto Supabase está online. O próximo passo é colar o script SQL no "SQL Editor" para criar as tabelas.',
        };
      }

      if (error.code === 'PGRST301' || error.message?.includes('JWT') || error.message?.includes('apikey')) {
        return {
          success: false,
          stage: 'credentials',
          message: '❌ Chave de API inválida (Anon Key incorreta). Verifique em Project Settings > API se copiou a chave "anon public" inteira.',
        };
      }

      return {
        success: false,
        stage: 'network',
        message: `Erro do Supabase (${error.code || 'API'}): ${error.message}`,
      };
    }

    return {
      success: true,
      stage: 'ok',
      message: '🎉 Conexão 100% ativa! Seu banco de dados Supabase e as tabelas de produtos estão sincronizados e prontos para uso.',
    };
  } catch (err: any) {
    return {
      success: false,
      stage: 'network',
      message: err.message || 'Não foi possível alcançar o servidor do Supabase. Verifique a URL e sua conexão com a internet.',
    };
  }
}
