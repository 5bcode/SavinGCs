import { signSession, verifySession } from '../lib/session';

const payload = { id: 1, username: 'testuser', displayName: 'Test User' };

// Test 1: Sign and verify
console.log('--- Test 1: Sign and Verify ---');
const signed = signSession(payload);
console.log('Signed token:', signed);

const verified = verifySession(signed);
console.log('Verified payload:', verified);

if (JSON.stringify(verified) !== JSON.stringify(payload)) {
    console.error('FAIL: Verified payload does not match original');
    process.exit(1);
} else {
    console.log('PASS: Verify success');
}

// Test 2: Tampered payload
console.log('\n--- Test 2: Tampered Payload ---');
// Try to tamper with the payload part (before the dot)
const lastDot = signed.lastIndexOf('.');
const dataPart = signed.substring(0, lastDot);
const signaturePart = signed.substring(lastDot + 1);

// Parse, modify, and restringify to simulate tampering
const decoded = JSON.parse(dataPart);
decoded.username = 'admin';
const tamperedData = JSON.stringify(decoded);
const tamperedToken = `${tamperedData}.${signaturePart}`;

const verifiedTampered = verifySession(tamperedToken);
console.log('Tampered token:', tamperedToken);
console.log('Tampered verification result:', verifiedTampered);

if (verifiedTampered !== null) {
    console.error('FAIL: Tampered payload should be invalid');
    process.exit(1);
} else {
    console.log('PASS: Tamper detection success');
}

// Test 3: Invalid signature
console.log('\n--- Test 3: Invalid Signature ---');
// Modify the signature slightly
const invalidSignature = signaturePart.substring(0, signaturePart.length - 1) + (signaturePart.endsWith('a') ? 'b' : 'a');
const invalidSigned = `${dataPart}.${invalidSignature}`;

const verifiedInvalid = verifySession(invalidSigned);
console.log('Invalid signed token:', invalidSigned);
console.log('Invalid verification result:', verifiedInvalid);

if (verifiedInvalid !== null) {
    console.error('FAIL: Invalid signature should be rejected');
    process.exit(1);
} else {
    console.log('PASS: Signature check success');
}

// Test 4: Empty/Invalid format
console.log('\n--- Test 4: Edge Cases ---');
if (verifySession('') !== null) {
    console.error('FAIL: Empty string should return null');
    process.exit(1);
}
if (verifySession('invalidformat') !== null) {
    console.error('FAIL: Invalid format should return null');
    process.exit(1);
}
console.log('PASS: Edge cases success');

console.log('\nALL TESTS PASSED');
