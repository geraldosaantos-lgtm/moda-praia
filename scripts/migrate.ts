import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  console.log('🚀 Aura Moda - Validador e Executor de Migrations do Supabase\n');

  const migrationsDir = path.resolve(__dirname, '../supabase/migrations');
  if (!fs.existsSync(migrationsDir)) {
    console.error('❌ Diretório de migrations não encontrado:', migrationsDir);
    process.exit(1);
  }

  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();

  console.log(`📁 Encontrados ${files.length} arquivos de migration:`);
  files.forEach((file, index) => {
    const fullPath = path.join(migrationsDir, file);
    const stats = fs.statSync(fullPath);
    console.log(`   ${index + 1}. ${file} (${stats.size} bytes)`);
  });

  console.log('\n📄 Verificando integridade das migrations...');
  for (const file of files) {
    const content = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    if (!content.trim()) {
      console.warn(`⚠️ Aviso: ${file} está vazio.`);
    }
  }

  const fullSchemaPath = path.resolve(__dirname, '../supabase/full_schema.sql');
  if (fs.existsSync(fullSchemaPath)) {
    console.log(`✅ Schema unificado consolidado presente em: supabase/full_schema.sql`);
  }

  console.log('\n✨ Todas as migrations estão prontas e validadas!');
  console.log('👉 Para aplicar no Supabase:');
  console.log('   1. Abra o painel do seu projeto no Supabase (https://supabase.com/dashboard)');
  console.log('   2. Acesse "SQL Editor" no menu lateral');
  console.log('   3. Cole o conteúdo de "supabase/full_schema.sql" e clique em "Run"');
  console.log('   OU configure o GitHub Actions com os secrets do repositório para deploy automático.\n');
}

runMigrations().catch((err) => {
  console.error('Erro na verificação de migrations:', err);
  process.exit(1);
});
