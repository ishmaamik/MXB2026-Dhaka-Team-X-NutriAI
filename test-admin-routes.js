const http = require('http');

// Test function to check if routes exist
function testRoute(path, method = 'GET') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: `/api${path}`,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: data
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (method === 'POST') {
      req.write('{}');
    }
    req.end();
  });
}

// Test the routes
async function testAdminRoutes() {
  console.log('Testing Admin Routes...\n');
  
  try {
    // Test health endpoint first
    const health = await testRoute('/health');
    console.log('✅ Health check:', health.status);
    
    // Test admin routes (should return 401 since we're not authenticated)
    const adminStats = await testRoute('/admin/stats');
    console.log('📊 Admin Stats:', adminStats.status, '- Expected: 401 (Unauthorized)');
    
    const adminFoods = await testRoute('/admin/foods', 'POST');
    console.log('🍎 Admin Add Food:', adminFoods.status, '- Expected: 401 (Unauthorized)');
    
    const adminResources = await testRoute('/admin/resources', 'POST');
    console.log('📚 Admin Add Resource:', adminResources.status, '- Expected: 401 (Unauthorized)');
    
    console.log('\nIf all routes return 401, the admin routes are working but require authentication!');
    console.log('If any route returns 404, there\'s a routing issue.');
    
  } catch (error) {
    console.error('Error testing routes:', error.message);
  }
}

testAdminRoutes();