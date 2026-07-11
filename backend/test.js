// Integration Test Suite for SafePassage
const { detectRedFlags } = require('./utils/detector');

function runDetectorTests() {
  console.log('🧪 Running Red-Flag Detector Logic Tests...');

  const testCases = [
    {
      text: 'They want me to pay before visa processing is complete.',
      expected: ['Payment requested prior to visa issuance']
    },
    {
      text: 'Apex Global offered a guaranteed visa to Germany but had no written contract.',
      expected: ['No formal written contract provided', 'Guaranteed visa promise (highly suspicious)']
    },
    {
      text: 'Mandatory training fee of 15,000 INR was charged upfront before signing contract.',
      expected: ['Mandatory paid training as a condition for job']
    },
    {
      text: 'They requested to keep original passport for safekeeping.',
      expected: ['Requirement to surrender original passport']
    },
    {
      text: 'Legitimate company, interview was online, did not ask for any deposit.',
      expected: []
    }
  ];

  let passed = 0;
  testCases.forEach((tc, idx) => {
    const results = detectRedFlags(tc.text);
    const matchesAll = tc.expected.every(val => results.includes(val)) && results.length === tc.expected.length;
    
    if (matchesAll) {
      console.log(`✅ Test Case ${idx + 1} Passed!`);
      passed++;
    } else {
      console.error(`❌ Test Case ${idx + 1} Failed!`);
      console.error(`   Input: "${tc.text}"`);
      console.error(`   Expected:`, tc.expected);
      console.error(`   Received:`, results);
    }
  });

  console.log(`📊 Detector Tests: ${passed}/${testCases.length} Passed\n`);
  return passed === testCases.length;
}

async function runDatabaseCheck() {
  console.log('🔌 Checking Database pool connectivity...');
  try {
    const { pool } = require('./config/db');
    const res = await pool.query('SELECT current_database(), NOW()');
    console.log(`✅ Database connection active on database: "${res.rows[0].current_database}"`);
    console.log(`✅ System Time: ${res.rows[0].now}`);
    return true;
  } catch (err) {
    console.error('❌ Database connection check failed.');
    console.error('   Reason:', err.message);
    console.log('ℹ️ Check backend/.env variables DB_USER, DB_PASSWORD, DB_NAME, DB_HOST, DB_PORT.\n');
    return false;
  }
}

async function runAllTests() {
  const detectorPassed = runDetectorTests();
  const dbPassed = await runDatabaseCheck();
  
  if (detectorPassed && dbPassed) {
    console.log('🏆 All tests completed successfully!');
    process.exit(0);
  } else if (detectorPassed) {
    console.warn('⚠️ Logical tests passed, but database connection could not be verified.');
    console.warn('   Ensure PostgreSQL is running and credentials in backend/.env are correct.');
    process.exit(0); // exit clean so build pipelines can continue locally
  } else {
    console.error('💥 Core logic tests failed!');
    process.exit(1);
  }
}

runAllTests();
