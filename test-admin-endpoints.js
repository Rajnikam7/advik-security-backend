// Test script to verify admin endpoints
// Run this after starting the server: node test-admin-endpoints.js

const testAdminEndpoints = async () => {
  const baseURL = 'http://localhost:3000/api/security';
  
  try {
    // Step 1: Login as admin to get token
    console.log('🔐 Testing admin login...');
    const loginResponse = await fetch(`${baseURL}/auth/test-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: '8888888888',
        otp: '888888'
      })
    });
    
    const loginData = await loginResponse.json();
    
    if (!loginResponse.ok) {
      console.error('❌ Login failed:', loginData);
      return;
    }
    
    console.log('✅ Admin login successful');
    console.log('👤 User:', loginData.user);
    
    const token = loginData.token;
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // Step 2: Test dashboard stats
    console.log('\n📊 Testing dashboard stats...');
    const statsResponse = await fetch(`${baseURL}/admin/dashboard/stats`, {
      headers
    });
    
    if (statsResponse.ok) {
      const statsData = await statsResponse.json();
      console.log('✅ Dashboard stats:', statsData.data);
    } else {
      const error = await statsResponse.json();
      console.error('❌ Dashboard stats failed:', error);
    }
    
    // Step 3: Test get all users
    console.log('\n👥 Testing get all users...');
    const usersResponse = await fetch(`${baseURL}/admin/users`, {
      headers
    });
    
    if (usersResponse.ok) {
      const usersData = await usersResponse.json();
      console.log('✅ Users retrieved:', usersData.count, 'users found');
    } else {
      const error = await usersResponse.json();
      console.error('❌ Get users failed:', error);
    }
    
    // Step 4: Test customer login (should fail on admin endpoints)
    console.log('\n🔒 Testing customer access to admin endpoints...');
    const customerLoginResponse = await fetch(`${baseURL}/auth/test-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: '9999999999',
        otp: '999999'
      })
    });
    
    const customerData = await customerLoginResponse.json();
    const customerToken = customerData.token;
    
    const customerHeaders = {
      'Authorization': `Bearer ${customerToken}`,
      'Content-Type': 'application/json'
    };
    
    const customerStatsResponse = await fetch(`${baseURL}/admin/dashboard/stats`, {
      headers: customerHeaders
    });
    
    if (customerStatsResponse.status === 403) {
      console.log('✅ Customer correctly denied access to admin endpoints');
    } else {
      console.error('❌ Customer should not have access to admin endpoints');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Run the test
testAdminEndpoints();