const request = require('supertest');

jest.mock('axios', () => ({
  post: jest.fn(async () => ({ data: { data: { id: 'vt-test-analysis' } } })),
  get: jest.fn(async () => ({
    data: {
      data: {
        attributes: {
          stats: { malicious: 5, harmless: 10, suspicious: 2, timeout: 0, undetected: 20, failure: 0 },
        },
      },
    },
  })),
}));

const { createTestApp } = require('./testServer');
const { login } = require('./utils');

describe('Scan Routes + Dashboard', () => {
  jest.setTimeout(30000);

  let app;
  let cleanup;
  let token;

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    cleanup = testApp.cleanup;

    // Signup via API first to ensure hashing/etc works
    await request(app)
      .post('/api/auth/signup')
      .send({
        name: 'Scanner User',
        email: 'scanner@example.com',
        password: 'password123',
      });

    const loginRes = await login(app, { email: 'scanner@example.com', password: 'password123' });
    token = loginRes.body.token;
  });

  afterAll(async () => {
    if (cleanup) await cleanup();
  });

  const authHeader = () => ({ Authorization: `Bearer ${token}` });

  test('Unauthorized requests are blocked (history)', async () => {
    const res = await request(app).get('/api/scans/history?scanType=url');
    expect(res.status).toBe(401);
  });

  test('URL scan creates history (201)', async () => {
    const res = await request(app)
      .post('/api/scans/url')
      .set(authHeader())
      .send({ url: 'http://secure-paypal-login-free.com' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('result');
    expect(res.body.result).toHaveProperty('riskPercentage');
  });

  test('Email scan creates history (201)', async () => {
    const res = await request(app)
      .post('/api/scans/email')
      .set(authHeader())
      .send({ content: 'Your bank account will be suspended. Verify immediately at http://example.com' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('result');
  });

  test('History returns saved scans (200)', async () => {
    const res = await request(app).get('/api/scans/history?scanType=url').set(authHeader());
    expect(res.status).toBe(200);

    const historyArray =
      (Array.isArray(res.body.history) && res.body.history) ||
      (Array.isArray(res.body.scans) && res.body.scans) ||
      (Array.isArray(res.body.data) && res.body.data);

    expect(Array.isArray(historyArray)).toBe(true);
    expect(historyArray.length).toBeGreaterThan(0);
  });

  test('Stats returns aggregated numbers (200)', async () => {
    const res = await request(app).get('/api/scans/stats').set(authHeader());
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('totalScans');
    expect(res.body).toHaveProperty('safeCount');
    expect(res.body).toHaveProperty('suspiciousCount');
    expect(res.body).toHaveProperty('maliciousCount');
  });
});
