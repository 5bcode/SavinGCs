
import { formatDateLong } from '../lib/utils';

function assert(condition: boolean, message: string) {
    if (!condition) {
        console.error(`❌ FAILED: ${message}`);
        process.exit(1);
    } else {
        console.log(`✅ PASSED: ${message}`);
    }
}

console.log('Testing formatDateLong...');

// Test 1: Standard YYYY-MM-DD
const d1 = '2023-01-01';
const r1 = formatDateLong(d1);
assert(r1 === '1 January 2023', `Expected "1 January 2023", got "${r1}"`);

// Test 2: Different month/day
const d2 = '2024-12-31';
const r2 = formatDateLong(d2);
assert(r2 === '31 December 2024', `Expected "31 December 2024", got "${r2}"`);

// Test 3: Single digit day
const d3 = '2023-05-05';
const r3 = formatDateLong(d3);
assert(r3 === '5 May 2023', `Expected "5 May 2023", got "${r3}"`);

// Test 4: Fallback to Date parsing (ISO)
const d4 = '2023-01-01T00:00:00Z';
const r4 = formatDateLong(d4);
// The fallback uses local timezone, so output depends on env.
// But verify it returns a non-empty string and doesn't crash.
assert(r4.length > 0 && r4.includes('2023') || r4.includes('2022'), `Fallback output looks reasonable: "${r4}"`);

// Test 5: Empty
assert(formatDateLong('') === '', 'Empty string returns empty string');

console.log('All tests passed!');
