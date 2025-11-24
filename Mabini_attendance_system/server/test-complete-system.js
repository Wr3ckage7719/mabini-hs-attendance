/**
 * Automated test of entire system after fixes
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function testCompleteSystem() {
    console.log('\n===========================================');
    console.log('🧪 COMPLETE SYSTEM TEST');
    console.log('===========================================\n');

    const results = {
        passed: [],
        failed: []
    };

    // Test 1: Can read students table
    console.log('TEST 1: Students table access...');
    const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .limit(1);
    
    if (studentsError) {
        console.log('   ❌ FAILED:', studentsError.message);
        results.failed.push('Students table access blocked (RLS issue)');
    } else {
        console.log('   ✅ PASSED - Can read students table');
        results.passed.push('Students table accessible');
    }

    // Test 2: Can read teachers table
    console.log('\nTEST 2: Teachers table access...');
    const { data: teachers, error: teachersError } = await supabase
        .from('teachers')
        .select('*')
        .limit(1);
    
    if (teachersError) {
        console.log('   ❌ FAILED:', teachersError.message);
        results.failed.push('Teachers table access blocked (RLS issue)');
    } else {
        console.log('   ✅ PASSED - Can read teachers table');
        results.passed.push('Teachers table accessible');
    }

    // Test 3: Can read account_retrievals
    console.log('\nTEST 3: Account retrievals table access...');
    const { data: retrievals, error: retrievalsError } = await supabase
        .from('account_retrievals')
        .select('*')
        .limit(1);
    
    if (retrievalsError) {
        console.log('   ❌ FAILED:', retrievalsError.message);
        results.failed.push('Account retrievals access blocked');
    } else {
        console.log('   ✅ PASSED - Can read account_retrievals');
        results.passed.push('Account retrievals accessible');
    }

    // Test 4: Students have passwords
    console.log('\nTEST 4: Student credentials check...');
    const { data: withCreds, error: credsError } = await supabase
        .from('students')
        .select('email, password')
        .not('email', 'is', null)
        .not('password', 'is', null);
    
    if (credsError) {
        console.log('   ❌ FAILED:', credsError.message);
        results.failed.push('Cannot check student passwords');
    } else if (withCreds.length === 0) {
        console.log('   ⚠️  WARNING - No students have passwords set');
        results.failed.push('No students with passwords');
    } else {
        console.log(`   ✅ PASSED - ${withCreds.length} students have passwords`);
        results.passed.push(`${withCreds.length} students ready to login`);
    }

    // Test 5: Can simulate login query
    console.log('\nTEST 5: Login simulation...');
    const testEmail = 'niccolobalon@mabinicolleges.edu.ph';
    const { data: loginTest, error: loginError } = await supabase
        .from('students')
        .select('*')
        .eq('email', testEmail)
        .maybeSingle();
    
    if (loginError) {
        console.log('   ❌ FAILED:', loginError.message);
        results.failed.push('Login query failed (RLS blocking)');
    } else if (!loginTest) {
        console.log('   ⚠️  WARNING - Test student not found');
        results.failed.push('Test student not in database');
    } else if (!loginTest.password) {
        console.log('   ⚠️  WARNING - Test student has no password');
        results.failed.push('Test student missing password');
    } else {
        console.log('   ✅ PASSED - Login query works');
        console.log(`      Email: ${loginTest.email}`);
        console.log(`      Password: ${loginTest.password}`);
        results.passed.push('Login simulation successful');
    }

    // Test 6: Can check duplicate retrieval
    console.log('\nTEST 6: Duplicate check simulation...');
    const { data: dupCheck, error: dupError } = await supabase
        .from('account_retrievals')
        .select('*')
        .eq('email', testEmail)
        .maybeSingle();
    
    if (dupError) {
        console.log('   ❌ FAILED:', dupError.message);
        results.failed.push('Duplicate check failed');
    } else {
        console.log('   ✅ PASSED - Duplicate check works');
        if (dupCheck) {
            console.log('      Already retrieved: YES');
        } else {
            console.log('      Already retrieved: NO');
        }
        results.passed.push('Duplicate prevention working');
    }

    // Summary
    console.log('\n===========================================');
    console.log('📊 TEST SUMMARY');
    console.log('===========================================\n');
    
    console.log(`✅ PASSED: ${results.passed.length}`);
    results.passed.forEach(test => console.log(`   ✓ ${test}`));
    
    console.log(`\n❌ FAILED: ${results.failed.length}`);
    results.failed.forEach(test => console.log(`   ✗ ${test}`));
    
    console.log('\n===========================================');
    
    if (results.failed.length === 0) {
        console.log('🎉 ALL TESTS PASSED!');
        console.log('✅ System is ready for use');
        console.log('\nNext steps:');
        console.log('1. Update Vercel env variable for email');
        console.log('2. Test account retrieval end-to-end');
        console.log('3. Share passwords with existing students\n');
    } else {
        console.log('⚠️  SOME TESTS FAILED');
        console.log('\nFixes needed:');
        if (results.failed.some(f => f.includes('RLS'))) {
            console.log('→ Run FIX_RLS_STUDENTS_TEACHERS.sql in Supabase');
        }
        if (results.failed.some(f => f.includes('password'))) {
            console.log('→ Students need to use account retrieval');
        }
        console.log('');
    }
}

testCompleteSystem()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('\n❌ Test error:', err);
        process.exit(1);
    });
