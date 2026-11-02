const { describe, it } = require('node:test');
const assert = require('node:assert');
const { EventEmitter } = require('node:events');
const app = require('../server');
const config = require('../config');

// Lightweight in-memory request dispatcher for reliable testing across all environments
function dispatchRequest(method, url) {
  return new Promise((resolve) => {
    const req = new EventEmitter();
    req.method = method;
    req.url = url;
    req.originalUrl = url;
    req.headers = {};
    req.path = url.split('?')[0];

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

describe('API Gateway Unit & Route Tests', () => {
  it('Configuration: exports port and service definitions', () => {
    assert.ok(config.port, 'Port should be defined');
    assert.ok(config.services.user.url, 'User service URL should be defined');
    assert.ok(config.services.product.url, 'Product service URL should be defined');
    assert.ok(config.services.order.url, 'Order service URL should be defined');
    assert.strictEqual(config.services.user.path, '/users');
    assert.strictEqual(config.services.product.path, '/products');
    assert.strictEqual(config.services.order.path, '/orders');
  });

  it('GET /health: returns HTTP 200 with UP status and route mapping', async () => {
    const res = await dispatchRequest('GET', '/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'UP');
    assert.strictEqual(res.body.service, 'API Gateway');
    assert.ok(res.body.timestamp, 'Timestamp should exist');
    assert.ok(res.body.routes, 'Routes mapping should exist');
    assert.ok(res.body.routes.users);
    assert.ok(res.body.routes.products);
    assert.ok(res.body.routes.orders);
  });

  it('GET /metrics: returns HTTP 200 and Prometheus metrics format', async () => {
    const res = await dispatchRequest('GET', '/metrics');
    assert.strictEqual(res.status, 200);
    const text = res.text();
    assert.ok(text.includes('gateway_'), 'Should contain gateway default metrics');
    assert.ok(text.includes('http_requests_total'), 'Should contain http_requests_total metric');
  });

  it('404 Handler: unmatched route returns 404 with structured JSON', async () => {
    const res = await dispatchRequest('GET', '/non-existent-route-for-testing');
    assert.strictEqual(res.status, 404);
    assert.strictEqual(res.body.error, 'Not Found');
    assert.ok(res.body.message.includes('No gateway route found'));
  });
});
