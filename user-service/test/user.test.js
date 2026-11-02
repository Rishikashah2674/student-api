const { describe, it } = require('node:test');
const assert = require('node:assert');
const { EventEmitter } = require('node:events');
const mongoose = require('mongoose');
const { app, parseUserId } = require('../server');
const User = require('../models/User');

function dispatchRequest(method, url, bodyData = null) {
  return new Promise((resolve) => {
    const req = new EventEmitter();
    req.method = method;
    req.url = url;
    req.originalUrl = url;
    req.headers = { 'content-type': 'application/json' };
    req.path = url.split('?')[0];
    req.body = bodyData || {};

    const res = new EventEmitter();
    let body = '';
    let statusCode = 200;
    const headers = {};

    res.setHeader = (k, v) => { headers[k.toLowerCase()] = v; };
    res.getHeader = (k) => headers[k.toLowerCase()];
    res.status = (code) => { statusCode = code; return res; };
    res.set = (k, v) => { headers[k.toLowerCase()] = v; return res; };
    res.json = (data) => {
      body = JSON.stringify(data);
      res.emit('finish');
      resolve({ status: statusCode, body: data, text: () => body, headers });
    };
    res.end = (chunk) => {
      if (chunk) body += chunk;
      res.emit('finish');
      resolve({ status: statusCode, body, text: () => body, headers });
    };

    app(req, res);
  });
}

describe('User Service Unit & Route Tests', () => {
  it('Helper: parseUserId parses numbers and handles ObjectIds', () => {
    assert.strictEqual(parseUserId('101'), 101);
    assert.strictEqual(parseUserId(105), 105);
    const validId = new mongoose.Types.ObjectId().toString();
    assert.strictEqual(parseUserId(validId), validId);
    assert.strictEqual(parseUserId('custom-str-id'), 'custom-str-id');
  });

  it('Model Validation: User schema requires name and valid email', async () => {
    const invalidUser = new User({});
    let error;
    try {
      await invalidUser.validate();
    } catch (err) {
      error = err;
    }
    assert.ok(error, 'Validation should fail on empty user');
    assert.ok(error.errors.name, 'Name should be required');
    assert.ok(error.errors.email, 'Email should be required');
  });

  it('Model Defaults: User schema applies default role and department', () => {
    const user = new User({ name: 'John Doe', email: 'john@campus.edu' });
    assert.strictEqual(user.role, 'student');
    assert.strictEqual(user.department, 'Computer Science');
  });

  it('GET /: returns running service confirmation', async () => {
    const res = await dispatchRequest('GET', '/');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.service, 'User Service');
    assert.strictEqual(res.body.status, 'running');
  });

  it('GET /health: returns UP or DEGRADED health status structure', async () => {
    const res = await dispatchRequest('GET', '/health');
    assert.ok([200, 503].includes(res.status), 'Should return standard health status');
    assert.strictEqual(res.body.service, 'User Service');
    assert.ok(res.body.status, 'Status field should exist');
    assert.ok(res.body.database, 'Database state field should exist');
  });

  it('GET /metrics: returns Prometheus formatted metric output', async () => {
    const res = await dispatchRequest('GET', '/metrics');
    assert.strictEqual(res.status, 200);
    const text = res.text();
    assert.ok(text.includes('user_service_'), 'Should contain user_service prefix metrics');
    assert.ok(text.includes('http_requests_total'), 'Should contain http_requests_total');
  });
});
