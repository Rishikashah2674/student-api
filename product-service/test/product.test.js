const { describe, it } = require('node:test');
const assert = require('node:assert');
const { EventEmitter } = require('node:events');
const mongoose = require('mongoose');
const { app, parseProductId } = require('../server');
const Product = require('../models/Product');

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

describe('Product Service Unit & Route Tests', () => {
  it('Helper: parseProductId parses numbers and handles ObjectIds', () => {
    assert.strictEqual(parseProductId('501'), 501);
    assert.strictEqual(parseProductId(505), 505);
    const validId = new mongoose.Types.ObjectId().toString();
    assert.strictEqual(parseProductId(validId), validId);
    assert.strictEqual(parseProductId('custom-sku-123'), 'custom-sku-123');
  });

  it('Model Validation: Product schema requires name and valid price', async () => {
    const invalidProduct = new Product({});
    let error;
    try {
      await invalidProduct.validate();
    } catch (err) {
      error = err;
    }
    assert.ok(error, 'Validation should fail on empty product');
    assert.ok(error.errors.name, 'Name should be required');
    assert.ok(error.errors.price, 'Price should be required');
  });

  it('Model Validation: Product rejects negative prices', async () => {
    const negativePriceProduct = new Product({ name: 'Book', price: -10 });
    let error;
    try {
      await negativePriceProduct.validate();
    } catch (err) {
      error = err;
    }
    assert.ok(error, 'Validation should fail on negative price');
    assert.ok(error.errors.price);
  });

  it('Model Defaults: Product schema applies default category and stock', () => {
    const product = new Product({ name: 'Lab Notebook', price: 9.99 });
    assert.strictEqual(product.category, 'General');
    assert.strictEqual(product.stock, 100);
  });

  it('GET /: returns running service confirmation', async () => {
    const res = await dispatchRequest('GET', '/');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.service, 'Product Service');
    assert.strictEqual(res.body.status, 'running');
  });

  it('GET /health: returns UP or DEGRADED health status structure', async () => {
    const res = await dispatchRequest('GET', '/health');
    assert.ok([200, 503].includes(res.status));
    assert.strictEqual(res.body.service, 'Product Service');
    assert.ok(res.body.status);
    assert.ok(res.body.database);
  });

  it('GET /metrics: returns Prometheus formatted metric output', async () => {
    const res = await dispatchRequest('GET', '/metrics');
    assert.strictEqual(res.status, 200);
    const text = res.text();
    assert.ok(text.includes('product_service_'), 'Should contain product_service prefix');
    assert.ok(text.includes('http_requests_total'), 'Should contain http_requests_total');
  });
});

