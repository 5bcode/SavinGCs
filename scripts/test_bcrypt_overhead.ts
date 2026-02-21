import bcrypt from 'bcryptjs';

console.log('--- Testing Bcrypt Overhead ---');

const password = 'my-secret-password';
const hash = bcrypt.hashSync(password, 10);
const DUMMY_HASH = bcrypt.hashSync('dummy', 10);

// Baseline: String comparison (User not found)
const start1 = process.hrtime();
const result1 = 'invalid_user_hash' === 'invalid_user_hash'; // Simulating immediate return if user not found (DB lookup is fast)
const end1 = process.hrtime(start1);
const time1 = (end1[0] * 1000 + end1[1] / 1e6).toFixed(3);
console.log(`User Not Found (string compare): ${time1}ms`);

// Scenario: User found (Bcrypt compare)
const start2 = process.hrtime();
const result2 = bcrypt.compareSync(password, hash);
const end2 = process.hrtime(start2);
const time2 = (end2[0] * 1000 + end2[1] / 1e6).toFixed(3);
console.log(`User Found (bcrypt compare): ${time2}ms`);

// Scenario: User not found but using Dummy Hash (Mitigation)
const start3 = process.hrtime();
const result3 = bcrypt.compareSync(password, DUMMY_HASH);
const end3 = process.hrtime(start3);
const time3 = (end3[0] * 1000 + end3[1] / 1e6).toFixed(3);
console.log(`User Not Found (with mitigation): ${time3}ms`);

console.log('------------------------------');
if (parseFloat(time2) > parseFloat(time1) * 10) {
    console.log('✅ Vulnerability Confirmed: Significant timing difference detected.');
} else {
    console.log('❌ Timing difference negligible (check bcrypt rounds).');
}

if (Math.abs(parseFloat(time2) - parseFloat(time3)) < 20) { // allowing 20ms variance
    console.log('✅ Mitigation Effective: Timing is consistent.');
} else {
    console.log(`⚠️ Mitigation Warning: Timing difference detected (${Math.abs(parseFloat(time2) - parseFloat(time3)).toFixed(3)}ms).`);
}
