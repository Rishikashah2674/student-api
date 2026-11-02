const { describe, it } = require('node:test');
const assert = require('node:assert');
const { EventEmitter } = require('node:events');
const mongoose = require('mongoose');
const { app, parseOrderId } = require('../server');
const Order = require('../models/Order');

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

describe('Order Service Unit & Route Tests', () => {
  it('Helper: parseOrderId parses numbers and handles string IDs', () => {
    assert.strictEqual(parseOrderId('1001'), 1001);
    assert.strictEqual(parseOrderId(1005), 1005);
    const validId = new mongoose.Types.ObjectId().toString();
    assert.strictEqual(parseOrderId(validId), validId);
    assert.strictEqual(parseOrderId('order-uuid-999'), 'order-uuid-999');
  });

  it('Model Validation: Order schema requires userId, productId, and totalPrice', async () => {
    const invalidOrder = new Order({});
    let error;
    try {
      await invalidOrder.validate();
    } catch (err) {
      error = err;
    }
    assert.ok(error, 'Validation should fail on empty order');
    assert.ok(error.errors.userId, 'userId should be required');
    assert.ok(error.errors.productId, 'productId should be required');
    assert.ok(error.errors.totalPrice, 'totalPrice should be required');
  });

  it('Model Validation: Order quantity must be at least 1', async () => {
    const invalidQtyOrder = new Order({
      userId: 101,
      productId: 501,
      quantity: 0,
      totalPrice: 20
    });
    let error;
    try {
      await invalidQtyOrder.validate();
    } catch (err) {
      error = err;
    }
    assert.ok(error, 'Validation should fail on zero quantity');
    assert.ok(error.errors.quantity);
  });

  it('Model Defaults: Order schema applies default status and quantity', () => {
    const order = new Order({
      userId: 101,
      productId: 501,
      totalPrice: 29.99
    });
    assert.strictEqual(order.status, 'CREATED');
    assert.strictEqual(order.quantity, 1);
  });

  it('GET /: returns running service confirmation and dependencies', async () => {
    const res = await dispatchRequest('GET', '/');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.service, 'Order Service');
    assert.strictEqual(res.body.status, 'running');
    assert.ok(res.body.dependencies, 'Dependencies field should exist');
    assert.ok(res.body.dependencies.userServiceUrl);
    assert.ok(res.body.dependencies.productServiceUrl);
  });

  it('GET /health: returns UP or DEGRADED health status structure', async () => {
    const res = await dispatchRequest('GET', '/health');
    assert.ok([200, 503].includes(res.status));
    assert.strictEqual(res.body.service, 'Order Service');
    assert.ok(res.body.status);
    assert.ok(res.body.database);
  });

  it('GET /metrics: returns Prometheus formatted metric output', async () => {
    const res = await dispatchRequest('GET', '/metrics');
    assert.strictEqual(res.status, 200);
    const text = res.text();
    assert.ok(text.includes('order_service_'), 'Should contain order_service prefix');
    assert.ok(text.includes('http_requests_total'), 'Should contain http_requests_total');
  });
});

