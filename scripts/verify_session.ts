import { signSession, verifySession } from '../lib/session';

async function test() {
    console.log('--- Testing Session Security ---');

    const user = { id: 1, username: 'testuser' };
    console.log('Original User:', user);

    // 1. Sign
    const signed = signSession(user);
    console.log('Signed Token:', signed);

    // 2. Verify
    const verified = verifySession(signed);
    console.log('Verified User:', verified);

    if (JSON.stringify(verified) !== JSON.stringify(user)) {
        console.error('❌ Verification failed: User mismatch');
        process.exit(1);
    }
    console.log('✅ verification successful');

    // 3. Tamper Payload (base64 part)
    const [encoded, signature] = signed.split('.');
    const json = Buffer.from(encoded, 'base64').toString();
    const tamperedJson = json.replace('testuser', 'admin');
    const tamperedEncoded = Buffer.from(tamperedJson).toString('base64');
    const tamperedToken = `${tamperedEncoded}.${signature}`;

    console.log('Tampered Token (payload):', tamperedToken);
    const tamperedVerify = verifySession(tamperedToken);
    if (tamperedVerify !== null) {
        console.error('❌ Verification failed: Accepted tampered payload');
        process.exit(1);
    }
    console.log('✅ Tampered payload rejected');

    // 4. Tamper Signature
    const tamperedSignature = signature.replace(/[a-f0-9]/, (c) => c === 'a' ? 'b' : 'a');
    const tamperedSigToken = `${encoded}.${tamperedSignature}`;

    console.log('Tampered Token (signature):', tamperedSigToken);
    const tamperedSigVerify = verifySession(tamperedSigToken);
    if (tamperedSigVerify !== null) {
        console.error('❌ Verification failed: Accepted tampered signature');
        process.exit(1);
    }
    console.log('✅ Tampered signature rejected');

    console.log('--- All Tests Passed ---');
}

test().catch(e => {
    console.error(e);
    process.exit(1);
});
