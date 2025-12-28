/**
 * Debug-Script für Auth-Probleme
 * Testet ob Token korrekt an API gesendet wird
 */

const API_URL = 'http://192.168.178.80:3001/api/v1';

async function debugAuth() {
  console.log('=== AUTH DEBUG ===\n');

  // 1. Test ohne Token
  console.log('1. Test ohne Token (sollte 401 geben):');
  try {
    const res1 = await fetch(`${API_URL}/manufacturers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test' }),
    });
    console.log(`   Status: ${res1.status} ${res1.statusText}`);
    const body1 = await res1.json();
    console.log(`   Response: ${JSON.stringify(body1)}\n`);
  } catch (e) {
    console.log(`   Error: ${e}\n`);
  }

  // 2. Test /me Endpoint (zeigt ob Auth-System funktioniert)
  console.log('2. Test /me ohne Token:');
  try {
    const res2 = await fetch(`${API_URL}/me`);
    console.log(`   Status: ${res2.status} ${res2.statusText}\n`);
  } catch (e) {
    console.log(`   Error: ${e}\n`);
  }

  // 3. Test Health Check
  console.log('3. Health Check:');
  try {
    const res3 = await fetch('http://192.168.178.80:3001/health');
    console.log(`   Status: ${res3.status}`);
    const body3 = await res3.json();
    console.log(`   Response: ${JSON.stringify(body3)}\n`);
  } catch (e) {
    console.log(`   Error: ${e}\n`);
  }

  console.log('=== ENDE ===');
  console.log('\nUm mit echtem Token zu testen:');
  console.log('1. Öffne Browser DevTools -> Network');
  console.log('2. Mache einen API-Call im Admin-Panel');
  console.log('3. Prüfe ob Authorization Header gesendet wird');
  console.log('4. Kopiere den Token und teste manuell mit curl:');
  console.log('   curl -X POST http://192.168.178.80:3001/api/v1/manufacturers \\');
  console.log('     -H "Content-Type: application/json" \\');
  console.log('     -H "Authorization: Bearer <TOKEN>" \\');
  console.log('     -d \'{"name":"Test"}\'');
}

debugAuth();
