/**
 * CONSTRUCTORA WM/M&S - SUPABASE SCHEMA VALIDATION SCRIPT
 * Slogan: "CONSTRUYENDO EL FUTURO"
 * 
 * Script para validar la alineación entre la base de datos remota de Supabase
 * y las interfaces TypeScript de la suite local
 * 
 * Ejecutar: npx tsx scripts/validate-supabase-schema.ts
 */

import { validateSupabaseSchema, formatValidationReport } from '../lib/supabase/schema-validator';

async function main() {
  console.log('🔍 Validando esquema de Supabase...\n');

  try {
    const report = await validateSupabaseSchema();
    const formattedReport = formatValidationReport(report);
    
    console.log(formattedReport);

    // Exit with appropriate code
    if (report.misalignedTables > 0) {
      console.error('\n❌ Esquema desalineado - Se requieren migraciones');
      process.exit(1);
    } else if (report.partialTables > 0) {
      console.warn('\n⚠️ Esquema parcialmente alineado - Se requieren algunas adiciones');
      process.exit(2);
    } else {
      console.log('\n✅ Esquema completamente alineado');
      process.exit(0);
    }
  } catch (error) {
    console.error('Error durante validación:', error);
    process.exit(3);
  }
}

main();
