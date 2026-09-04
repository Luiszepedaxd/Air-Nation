/**
 * Elimina todos los usuarios de prueba cuyo email contiene "@stress.dev"
 * Útil cuando el cleanup automático falla por timeout de red.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { createClient } = require('@supabase/supabase-js');

const adminClient = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  console.log('Buscando usuarios de prueba (@stress.dev)…');
  const { data, error } = await adminClient.auth.admin.listUsers({ perPage: 200 });
  if (error) { console.error('Error:', error.message); process.exit(1); }

  const testUsers = (data?.users || []).filter(u => u.email?.includes('@stress.dev'));
  console.log(`Encontrados: ${testUsers.length} usuarios de prueba.`);

  let deleted = 0;
  for (const user of testUsers) {
    const { error: delErr } = await adminClient.auth.admin.deleteUser(user.id);
    if (delErr) {
      console.log(`  ⚠ No eliminado: ${user.email} — ${delErr.message}`);
    } else {
      console.log(`  ✓ Eliminado: ${user.email}`);
      deleted++;
    }
  }
  console.log(`\nListo. ${deleted}/${testUsers.length} usuarios eliminados.`);
}

main().catch(e => { console.error(e.message); process.exit(1); });
