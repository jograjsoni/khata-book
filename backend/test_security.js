async function testSecurity() {
  const baseUrl = 'http://localhost:4000';
  console.log('=== Running Security & JWT & Rate Limiter Tests ===');

  // 1. Unauthenticated request to protected endpoint must return 401
  const unauthRes = await fetch(`${baseUrl}/api/parties`);
  const unauthData = await unauthRes.json();
  console.log('1. Unauthenticated access blocked (HTTP 401):', unauthRes.status === 401, 'Code:', unauthData.code);
  if (unauthRes.status !== 401) throw new Error('Unauthenticated request was not blocked!');

  // 2. Tampered JWT token must return 401 INVALID_TOKEN
  const badTokenRes = await fetch(`${baseUrl}/api/parties`, {
    headers: { Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalidpayload.signature' },
  });
  const badTokenData = await badTokenRes.json();
  console.log('2. Tampered token rejected (HTTP 401):', badTokenRes.status === 401, 'Code:', badTokenData.code);
  if (badTokenRes.status !== 401) throw new Error('Tampered token was not rejected!');

  // 3. Backdoor removal check: admin123 / password123 must be rejected
  const backdoorRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ emailOrPhone: 'testmerchant@gmail.com', password: 'admin123' }),
  });
  const backdoorData = await backdoorRes.json();
  console.log('3. Backdoor admin123 rejected:', backdoorRes.status === 401, 'Error:', backdoorData.error);
  if (backdoorRes.status !== 401) throw new Error('Backdoor admin123 is still active!');

  // 4. Session endpoint creates valid cryptographically signed JWT for guest/device
  const sessionRes = await fetch(`${baseUrl}/api/auth/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceId: 'test_dev_device_1', businessName: 'Dev Hardware Store' }),
  });
  const sessionData = await sessionRes.json();
  console.log('4. Device session provisioned:', sessionData.success, 'Token valid:', !!sessionData.token);
  if (!sessionData.token) throw new Error('Failed to create device session token');

  // 5. Test Rate Limiter by making rapid requests to /api/auth/login
  console.log('5. Testing rate limiter threshold...');
  let hitRateLimit = false;
  let retryAfterHeader = null;
  for (let i = 0; i < 15; i++) {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-test-client-id': 'security-audit-rate-limit',
      },
      body: JSON.stringify({ emailOrPhone: 'nonexistent@test.com', password: 'wrongpassword' }),
    });
    if (res.status === 429) {
      hitRateLimit = true;
      retryAfterHeader = res.headers.get('retry-after');
      const body = await res.json();
      console.log(`   -> Rate limit hit at request ${i + 1} with HTTP 429! Code: ${body.code}, Retry-After: ${retryAfterHeader}s`);
      break;
    }
  }
  console.log('   Strict Rate Limiter Active & Effective:', hitRateLimit);
  if (!hitRateLimit) throw new Error('Rate limiter failed to trigger!');

  console.log('=== ALL SECURITY AUDIT TESTS PASSED WITH 100% SUCCESS ===');
}

testSecurity().catch((err) => {
  console.error('Security test failed:', err);
  process.exit(1);
});
