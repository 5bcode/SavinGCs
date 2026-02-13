const crypto = require('crypto');

// Simulate the environment variable
process.env.SESSION_SECRET = 'test-secret';
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-secret-do-not-use-in-prod';

// --- COPIED LOGIC START ---

function signSession(payload) {
    const json = JSON.stringify(payload);
    const data = Buffer.from(json).toString('base64url');
    const signature = crypto
        .createHmac('sha256', SESSION_SECRET)
        .update(data)
        .digest('base64url');
    return `${data}.${signature}`;
}

function verifySession(token) {
    if (!token || typeof token !== 'string') return null;

    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [data, signature] = parts;
    const expectedSignature = crypto
        .createHmac('sha256', SESSION_SECRET)
        .update(data)
        .digest('base64url');

    // Use timingSafeEqual to prevent timing attacks
    const signatureBuf = Buffer.from(signature);
    const expectedBuf = Buffer.from(expectedSignature);

    if (signatureBuf.length !== expectedBuf.length) return null;

    if (!crypto.timingSafeEqual(signatureBuf, expectedBuf)) return null;

    try {
        return JSON.parse(Buffer.from(data, 'base64url').toString('utf-8'));
    } catch {
        return null;
    }
}
// --- COPIED LOGIC END ---

// TEST SUITE

console.log('Running Session Security Verification...');

// Test 1: Valid signature
const user = { id: 1, username: 'gary' };
const token = signSession(user);
const verified = verifySession(token);

if (verified && verified.id === 1) {
    console.log('✅ PASS: Valid signature verified');
} else {
    console.error('❌ FAIL: Valid signature failed verification');
    process.exit(1);
}

// Test 2: Invalid signature (tampered payload)
const parts = token.split('.');
// Manually change payload part
const tamperedPayload = Buffer.from(JSON.stringify({ id: 2, username: 'catherine' })).toString('base64url');
const tamperedToken = `${tamperedPayload}.${parts[1]}`;

if (verifySession(tamperedToken) === null) {
    console.log('✅ PASS: Tampered payload rejected');
} else {
    console.error('❌ FAIL: Tampered payload accepted!');
    process.exit(1);
}

// Test 3: Invalid signature (tampered signature)
// Change last char of signature
const tamperedSig = parts[1].substring(0, parts[1].length - 1) + (parts[1].endsWith('A') ? 'B' : 'A');
const tamperedSigToken = `${parts[0]}.${tamperedSig}`;

if (verifySession(tamperedSigToken) === null) {
    console.log('✅ PASS: Tampered signature rejected');
} else {
    console.error('❌ FAIL: Tampered signature accepted!');
    process.exit(1);
}

// Test 4: Plain JSON (legacy format)
const plainJson = JSON.stringify(user);
if (verifySession(plainJson) === null) {
    console.log('✅ PASS: Plain JSON rejected');
} else {
    console.error('❌ FAIL: Plain JSON accepted!');
    process.exit(1);
}

console.log('All security checks passed.');
