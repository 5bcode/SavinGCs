import { POST } from '../app/api/auth/login/route';
import { NextRequest } from 'next/server';

async function testAuthTiming() {
  console.log('Testing authentication timing...');

  // Real user query
  const startReal = performance.now();
  const reqReal = new NextRequest('http://localhost:3000/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username: 'gary', password: 'wrongpassword' }),
  });
  await POST(reqReal);
  const endReal = performance.now();
  console.log(`Real user (wrong password) took: ${(endReal - startReal).toFixed(2)}ms`);

  // Fake user query
  const startFake = performance.now();
  const reqFake = new NextRequest('http://localhost:3000/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username: 'nonexistentuser', password: 'wrongpassword' }),
  });
  await POST(reqFake);
  const endFake = performance.now();
  console.log(`Fake user took: ${(endFake - startFake).toFixed(2)}ms`);

  const diff = Math.abs((endReal - startReal) - (endFake - startFake));
  console.log(`Difference: ${diff.toFixed(2)}ms`);

  if (diff < 50) {
    console.log('✅ Timing attack mitigated successfully!');
  } else {
    console.log('❌ Timing attack vulnerability may still exist (diff too large).');
  }
}

testAuthTiming().catch(console.error);
