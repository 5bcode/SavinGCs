const crypto = require('crypto');

// Note: This script duplicates logic from lib/auth.ts because we cannot import
// modules that depend on 'next/server' (like NextRequest) in a standalone Node script
// without a full build environment, which is currently unavailable.

// MOCK CONSTANTS
const SESSION_SECRET = 'dev-secret-do-not-use-in-prod';

// COPIED LOGIC FROM lib/auth.ts (converted to CommonJS for node script)
function signSession(payload) {
    const json = JSON.stringify(payload);
    const data = Buffer.from(json).toString('base64');
    const signature = crypto
        .createHmac('sha256', SESSION_SECRET)
        .update(data)
        .digest('base64')
        .replace(/=+$/, '');

    return `${data}.${signature}`;
}

function verifySession(token) {
    if (!token || !token.includes('.')) return null;

    const [data, signature] = token.split('.');
    if (!data || !signature) return null;

    const expectedSignature = crypto
        .createHmac('sha256', SESSION_SECRET)
        .update(data)
        .digest('base64')
        .replace(/=+$/, '');

    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
        return null;
    }

    try {
        const json = Buffer.from(data, 'base64').toString('utf-8');
        return JSON.parse(json);
    } catch {
        return null;
    }
}

// TEST CASES
console.log('Running Security Verification...');

const user = { id: 1, username: 'gary', displayName: 'Gary' };
console.log('User:', user);

// 1. Sign
const token = signSession(user);
console.log('Signed Token:', token);

// 2. Verify Valid
const verified = verifySession(token);
console.log('Verified User:', verified);

if (verified && verified.id === user.id) {
    console.log('✅ Success: Token verified correctly.');
} else {
    console.error('❌ Failed: Token verification failed.');
    process.exit(1);
}

// 3. Verify Tampered (Data modified)
const [data, sig] = token.split('.');
const tamperedData = Buffer.from(JSON.stringify({ ...user, id: 2 })).toString('base64');
const tamperedToken = `${tamperedData}.${sig}`;
console.log('Tampered Token (ID changed):', tamperedToken);

const verifiedTampered = verifySession(tamperedToken);
if (verifiedTampered === null) {
    console.log('✅ Success: Tampered token rejected.');
} else {
    console.error('❌ Failed: Tampered token was accepted!', verifiedTampered);
    process.exit(1);
}

// 4. Verify Legacy Plain JSON (Should be rejected now)
const legacyCookie = JSON.stringify(user);
console.log('Legacy Cookie:', legacyCookie);
const verifiedLegacy = verifySession(legacyCookie);
if (verifiedLegacy === null) {
    console.log('✅ Success: Legacy plain JSON cookie rejected by verifySession.');
} else {
    console.error('❌ Failed: Legacy cookie accepted by verifySession (should be null as it has no signature).', verifiedLegacy);
    // Note: getSessionUser might handle legacy fallback differently if we decided so,
    // but verifySession itself should return null.
    process.exit(1);
}

console.log('ALL SECURITY CHECKS PASSED');
