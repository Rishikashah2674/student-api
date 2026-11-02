/**
 * Lab 8 Gateway Verification Script
 * Validates baseline & Kubernetes API Gateway routes and proxy communication
 * to User, Product, and Order microservices.
 *
 * Usage: node scripts/test-gateway.js [optionalGatewayUrl]
 */

const BASE_URL = process.argv[2] || process.env.GATEWAY_URL || "http://localhost:3000";

let passed = 0;
let failed = 0;

async function assertResponse(name, fn) {
  process.stdout.write(`▶ Testing: ${name}... `);
  try {
    const ok = await fn();
    if (ok !== false) {
      console.log(`✅ PASSED`);
      passed++;
    } else {
      console.log(`❌ FAILED`);
      failed++;
    }
  } catch (err) {
    console.log(`❌ ERROR: ${err.message}`);
    failed++;
  }
}

async function runTests() {
  console.log(`=======================================================`);
  console.log(`🧪 Lab 8 API Gateway Verification Suite`);
  console.log(`📍 Testing Gateway at: ${BASE_URL}`);
  console.log(`=======================================================\n`);

  // 1. Gateway Health Check
  await assertResponse("Gateway GET /health", async () => {
    const res = await fetch(`${BASE_URL}/health`);
    const data = await res.json();
    return res.status === 200 && data.status === "UP" && data.service === "API Gateway";
  });

  // 2. Gateway Prometheus Metrics
  await assertResponse("Gateway GET /metrics", async () => {
    const res = await fetch(`${BASE_URL}/metrics`);
    const text = await res.text();
    return res.status === 200 && text.includes("http_requests_total");
  });

  // 3. User Service - Get All Users
  await assertResponse("User Service GET /users", async () => {
    const res = await fetch(`${BASE_URL}/users`);
    return res.status === 200 && Array.isArray(await res.json());
  });

  // 4. User Service - Create User
  let createdUserId = null;
  await assertResponse("User Service POST /users", async () => {
    const testEmail = `k8s_test_${Date.now()}@example.com`;
    const res = await fetch(`${BASE_URL}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Kubernetes Test User",
        email: testEmail,
        role: "student",
        department: "Computer Science"
      })
    });
    if (res.status === 201) {
      const data = await res.json();
      createdUserId = data.id || data._id;
      return true;
    }
    return false;
  });

  // 5. Product Service - Get All Products
  await assertResponse("Product Service GET /products", async () => {
    const res = await fetch(`${BASE_URL}/products`);
    return res.status === 200 && Array.isArray(await res.json());
  });

  // 6. Product Service - Create Product
  let createdProductId = null;
  await assertResponse("Product Service POST /products", async () => {
    const res = await fetch(`${BASE_URL}/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: `K8s Monitored Item ${Date.now()}`,
        price: 29.99,
        category: "Cloud",
        stock: 50
      })
    });
    if (res.status === 201) {
      const data = await res.json();
      createdProductId = data.id || data._id;
      return true;
    }
    return false;
  });

  // 7. Order Service - Get All Orders
  await assertResponse("Order Service GET /orders", async () => {
    const res = await fetch(`${BASE_URL}/orders`);
    return res.status === 200 && Array.isArray(await res.json());
  });

  // 8. Order Service - Create Order (Validates User & Product inter-service call)
  if (createdUserId && createdProductId) {
    await assertResponse("Order Service POST /orders (Inter-service orchestration)", async () => {
      const res = await fetch(`${BASE_URL}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: createdUserId,
          productId: createdProductId,
          quantity: 2
        })
      });
      return res.status === 201;
    });
  }

  // 9. Unmapped Route (Expects 404 Not Found)
  await assertResponse("Gateway 404 Route Handling (GET /unknown-route)", async () => {
    const res = await fetch(`${BASE_URL}/unknown-route`);
    const data = await res.json();
    return res.status === 404 && data.error === "Not Found";
  });

  console.log(`\n=======================================================`);
  console.log(`📊 Summary: ${passed} Passed, ${failed} Failed`);
  console.log(`=======================================================`);
  if (failed > 0) process.exit(1);
}

runTests();

