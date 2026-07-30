/**
 * CONSTRUCTORA WM/M&S - APU LIBRARY COUNT CHECK
 * Slogan: "CONSTRUYENDO EL FUTURO"
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yibjsruoxjlgdnkgylld.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpYmpzcnVveGpsZ2Rua2d5bGxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzNjQ3OTYsImV4cCI6MjEwMDk0MDc5Nn0.aZuVrUHA4Sh8h3SBl96QCTmh6dTQSm0tXXFjMR5nRv8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAPUCount() {
  console.log('🔍 Verificando cantidad de items en APU Library...\n');

  const { data, error } = await supabase
    .from('apu_library')
    .select('*', { count: 'exact' });

  if (error) {
    console.log('❌ Error:', error.message);
  } else {
    console.log(`✅ Total de items en APU Library: ${data.length}`);
    
    if (data.length === 40) {
      console.log('✅ Todos los 40 items APU residenciales están cargados');
    } else {
      console.log(`⚠️ Se esperaban 40 items, pero hay ${data.length}`);
    }

    console.log('\n📊 Distribución por categoría:');
    const categories = {} as Record<string, number>;
    data.forEach(item => {
      categories[item.category] = (categories[item.category] || 0) + 1;
    });

    Object.entries(categories).forEach(([category, count]) => {
      console.log(`   ${category}: ${count} items`);
    });
  }
}

checkAPUCount().catch(console.error);