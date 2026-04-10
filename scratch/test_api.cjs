const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function test() {
  const content = fs.readFileSync('c:/Users/User/OneDrive/Documentos/GitHub/Portaldoalunoadm/src/app/pages/Treinamentos.tsx', 'utf8');
  const match = content.match(/publicAnonKey\s*=\s*"([^"]+)"/);
  const anonKey = match ? match[1] : '';

  const supabaseUrl = 'https://wytbbtlxrhkvqvlwjivc.supabase.co';
  const url = `${supabaseUrl}/functions/v1/treinamentos-crud`;

  console.log('Fetching from:', url);
  const response = await fetch(url, {
    headers: {
      'apikey': anonKey,
      'Authorization': `Bearer ${anonKey}`
    }
  });

  if (!response.ok) {
    console.error('Error:', response.status, await response.text());
    return;
  }

  const data = await response.json();
  console.log('Total Trainings:', data.length);
  data.forEach(t => {
    console.log(`- ${t.nome} (ID: ${t.id_treinamento}) - Modules: ${t.modules?.length || 0}`);
    if (t.modules) {
      t.modules.forEach(m => console.log(`  * ${m.nome} (Order: ${m.ordem})`));
    }
  });
}

test();
