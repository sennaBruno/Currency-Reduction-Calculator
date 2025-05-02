// Simple test script to verify the exchange rate API endpoint

async function testExchangeRateEndpoint() {
  try {
    console.log('Testing the Exchange Rate API endpoint...');
    
    // Make a request to the API endpoint
    const response = await fetch('http://localhost:3000/api/exchange-rate');
    
    // Check the status
    console.log('Response status:', response.status);
    
    // Log the headers
    console.log('Cache-Control header:', response.headers.get('Cache-Control'));
    
    // Parse the response
    const data = await response.json();
    
    // Log the response data
    console.log('Response data:', data);
    
    // Make a second request to verify caching behavior
    console.log('\nMaking a second request to verify caching behavior...');
    const secondResponse = await fetch('http://localhost:3000/api/exchange-rate');
    const secondData = await secondResponse.json();
    console.log('Second response data:', secondData);
    
    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('Error testing the Exchange Rate API:', error);
  }
}

// Run the test
testExchangeRateEndpoint(); 