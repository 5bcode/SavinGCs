import { signSession, verifySession } from '../lib/session';

console.log('Running Session Security Verification...');

const payload = { id: 1, username: 'testuser', role: 'admin' };
console.log('Payload:', payload);

// Test 1: Signing
console.log('\n--- Test 1: Signing ---');
const signedSession = signSession(payload);
console.log('Signed Session:', signedSession);

if (typeof signedSession === 'string' && signedSession.includes('.')) {
    console.log('✅ Signing successful (format looks correct)');
} else {
    console.error('❌ Signing failed');
    process.exit(1);
}

// Test 2: Verification
console.log('\n--- Test 2: Verification ---');
const verifiedPayload = verifySession(signedSession);
console.log('Verified Payload:', verifiedPayload);

if (JSON.stringify(verifiedPayload) === JSON.stringify(payload)) {
    console.log('✅ Verification successful');
} else {
    console.error('❌ Verification failed');
    process.exit(1);
}

// Test 3: Tampering (Modifying signature)
console.log('\n--- Test 3: Tampering (Signature) ---');
const parts = signedSession.split('.');
const tamperedSignature = parts[1].replace('a', 'b'); // Change one char
const tamperedSession = `${parts[0]}.${tamperedSignature}`;
console.log('Tampered Session:', tamperedSession);

const verifiedTampered = verifySession(tamperedSession);
if (verifiedTampered === null) {
    console.log('✅ Tampered signature rejected correctly');
} else {
    console.error('❌ Tampered signature was ACCEPTED! (Critical Failure)');
    process.exit(1);
}

// Test 4: Tampering (Modifying Payload)
console.log('\n--- Test 4: Tampering (Payload) ---');
const tamperedPayload = Buffer.from(JSON.stringify({ ...payload, role: 'superadmin' })).toString('base64');
const tamperedSessionPayload = `${tamperedPayload}.${parts[1]}`;
console.log('Tampered Payload Session:', tamperedSessionPayload);

const verifiedTamperedPayload = verifySession(tamperedSessionPayload);
if (verifiedTamperedPayload === null) {
    console.log('✅ Tampered payload rejected correctly');
} else {
    console.error('❌ Tampered payload was ACCEPTED! (Critical Failure)');
    process.exit(1);
}

console.log('\n🎉 All security checks passed!');
