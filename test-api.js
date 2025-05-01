// This is a simple Node.js script to test the /api/calculate endpoint
// Run with: node test-api.js

async function testCalculateAPI() {
  try {
    // Valid test case
    console.log("Testing with valid input:");
    const validResponse = await fetch('http://localhost:3000/api/calculate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        initialAmountUSD: 100,
        exchangeRate: 5.0,
        reductions: '10, 20, 30'
      })
    });
    
    const validData = await validResponse.json();
    console.log(`Status: ${validResponse.status}`);
    console.log(JSON.stringify(validData, null, 2));
    
    // Invalid test case - missing fields
    console.log("\nTesting with missing fields:");
    const missingFieldsResponse = await fetch('http://localhost:3000/api/calculate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        initialAmountUSD: 100,
        // Missing exchangeRate and reductions
      })
    });
    
    const missingFieldsData = await missingFieldsResponse.json();
    console.log(`Status: ${missingFieldsResponse.status}`);
    console.log(JSON.stringify(missingFieldsData, null, 2));
    
    // Invalid test case - negative values
    console.log("\nTesting with negative values:");
    const negativeValuesResponse = await fetch('http://localhost:3000/api/calculate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        initialAmountUSD: -100,
        exchangeRate: 5.0,
        reductions: '10, 20, 30'
      })
    });
    
    const negativeValuesData = await negativeValuesResponse.json();
    console.log(`Status: ${negativeValuesResponse.status}`);
    console.log(JSON.stringify(negativeValuesData, null, 2));
    
    // Invalid test case - invalid percentages
    console.log("\nTesting with invalid percentages:");
    const invalidPercentagesResponse = await fetch('http://localhost:3000/api/calculate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        initialAmountUSD: 100,
        exchangeRate: 5.0,
        reductions: '10, abc, 30'
      })
    });
    
    const invalidPercentagesData = await invalidPercentagesResponse.json();
    console.log(`Status: ${invalidPercentagesResponse.status}`);
    console.log(JSON.stringify(invalidPercentagesData, null, 2));
    
    // Invalid test case - percentages out of range
    console.log("\nTesting with percentages out of range:");
    const outOfRangeResponse = await fetch('http://localhost:3000/api/calculate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        initialAmountUSD: 100,
        exchangeRate: 5.0,
        reductions: '10, 110, 30'
      })
    });
    
    const outOfRangeData = await outOfRangeResponse.json();
    console.log(`Status: ${outOfRangeResponse.status}`);
    console.log(JSON.stringify(outOfRangeData, null, 2));
    
    // Test case - reduction to 0 or negative
    console.log("\nTesting with reduction to 0 or negative:");
    const reductionToZeroResponse = await fetch('http://localhost:3000/api/calculate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        initialAmountUSD: 100,
        exchangeRate: 5.0,
        reductions: '10, 20, 100'
      })
    });
    
    const reductionToZeroData = await reductionToZeroResponse.json();
    console.log(`Status: ${reductionToZeroResponse.status}`);
    console.log(JSON.stringify(reductionToZeroData, null, 2));
    
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testCalculateAPI(); 