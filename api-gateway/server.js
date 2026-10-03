require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { createProxyMiddleware } = require("http-proxy-middleware");
const config = require("./config");

const app = express();

// Enable CORS
app.use(cors());

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const reqPath = req.originalUrl || req.path;

  let targetService = "Gateway";
  if (reqPath.startsWith("/users")) {
    targetService = `User Service (${config.services.user.url})`;
  } else if (reqPath.startsWith("/products")) {
    targetService = `Product Service (${config.services.product.url})`;
  } else if (reqPath.startsWith("/orders")) {
    targetService = `Order Service (${config.services.order.url})`;
  }

  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`[GATEWAY LOG] ${req.method} ${reqPath} -> Target: ${targetService} | Status: ${res.statusCode} (${duration}ms)`);
  });

  next();
});

// GET /health - API Gateway health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "UP",
    service: "API Gateway",
    timestamp: new Date().toISOString(),
    routes: {
      users: config.services.user.url,
      products: config.services.product.url,
      orders: config.services.order.url
    }
  });
});

// Error handler for proxy routing failures
function handleProxyError(err, req, res, serviceName, targetUrl) {
  console.error(`[GATEWAY PROXY ERROR] Failed to proxy request to ${serviceName} (${targetUrl}): ${err.message}`);
  if (!res.headersSent) {
    res.status(503).json({
      error: "Service Unavailable",
      message: `The ${serviceName} is currently unreachable at ${targetUrl}.`,
      targetService: serviceName,
      status: 503,
      timestamp: new Date().toISOString()
    });
  }
}

// Proxy helper generator using pathFilter to preserve complete request paths (/users, /products, /orders)
function createServiceProxy(pathPattern, targetUrl, serviceName) {
  return createProxyMiddleware({
    pathFilter: pathPattern,
    target: targetUrl,
    changeOrigin: true,
    onError: (err, req, res) => handleProxyError(err, req, res, serviceName, targetUrl),
    on: {
      error: (err, req, res) => handleProxyError(err, req, res, serviceName, targetUrl)
    }
  });
}

// Configuration-driven route proxies (preserves full path /users, /products, /orders without path stripping)
app.use(createServiceProxy("/users", config.services.user.url, "User Service"));
app.use(createServiceProxy("/products", config.services.product.url, "Product Service"));
app.use(createServiceProxy("/orders", config.services.order.url, "Order Service"));

// 404 Handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `No gateway route found for ${req.method} ${req.originalUrl}`
  });
});

// Start Gateway server
app.listen(config.port, () => {
  console.log(`==================================================`);
  console.log(`🚀 API Gateway running on http://localhost:${config.port}`);
  console.log(`📍 User Service Route    -> ${config.services.user.path} -> ${config.services.user.url}`);
  console.log(`📍 Product Service Route -> ${config.services.product.path} -> ${config.services.product.url}`);
  console.log(`📍 Order Service Route   -> ${config.services.order.path} -> ${config.services.order.url}`);
  console.log(`==================================================`);
});
