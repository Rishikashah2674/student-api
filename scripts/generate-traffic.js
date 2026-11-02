/**
 * Lab 8: Traffic Generator for Prometheus & Grafana Monitoring
 * Sends automated HTTP traffic through the API Gateway to produce observable
 * metrics for throughput, latency, and error rate.
 *
 * Usage:
 *   node scripts/generate-traffic.js [gatewayUrl] [requestsCount]
 * Default:
 *   node scripts/generate-traffic.js http://localhost:3000 60
 */

const gatewayUrl = process.argv[2] || process.env.GATEWAY_URL || "http://localhost:3000";
const totalRequests = parseInt(process.argv[3], 10) || 60;

console.log(`=======================================================`);
console.log(`🚀 Starting Traffic Generation for Lab 8 Monitoring`);
console.log(`📍 Target Gateway URL: ${gatewayUrl}`);
console.log(`📊 Total Requests:     ${totalRequests}`);
console.log(`=======================================================\n`);

const sampleUsers = [
  { name: "Alice Wonderland", email: "alice.k8s@test.com", role: "student", department: "Computer Science" },
  { name: "Bob Builder", email: "bob.k8s@test.com", role: "instructor", department: "Engineering" }
];

const sampleProducts = [
  { name: "Kubernetes Handbook", price: 39.99, category: "Books", stock: 50 },
  { name: "Cloud DevOps Hoodie", price: 49.99, category: "Apparel", stock: 100 }
];

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendRequest(label, method, path, body = null) {
  const url = `${gatewayUrl.replace(/\/$/, "")}${path}`;
  const start = Date.now();
  try {
    const options = {
      method,
      headers: { "Content-Type": "application/json" }
    };
    if (body) {
      options.body = JSON.stringify(body);
    }

    const res = await fetch(url, options);
    const duration = Date.now() - start;
    console.log(`[${res.status}] ${method.padEnd(6)} ${path.padEnd(25)} -> ${duration}ms (${label})`);
    return res.status;
  } catch (err) {
    const duration = Date.now() - start;
    console.error(`[ERR] ${method.padEnd(6)} ${path.padEnd(25)} -> ${err.message} (${duration}ms)`);
    return 0;
  }
}

async function runTraffic() {
  let createdUserId = null;
  let createdProductId = null;

  for (let i = 1; i <= totalRequests; i++) {
    console.log(`--- [Batch ${i}/${totalRequests}] ---`);

    // 1. Health check
    await sendRequest("Health Check", "GET", "/health");

    // 2. Fetch all users
    await sendRequest("List Users", "GET", "/users");

    // 3. Create user occasionally
    if (i % 5 === 0) {
      const u = sampleUsers[i % sampleUsers.length];
      const email = `test_${Date.now()}_${i}@test.com`;
      const res = await sendRequest("Create User", "POST", "/users", { ...u, email });
    }

    // 4. Fetch all products
    await sendRequest("List Products", "GET", "/products");

    // 5. Create product occasionally
    if (i % 6 === 0) {
      const p = sampleProducts[i % sampleProducts.length];
      await sendRequest("Create Product", "POST", "/products", { ...p, name: `${p.name} #${i}` });
    }

    // 6. Fetch all orders
    await sendRequest("List Orders", "GET", "/orders");

    // 7. Intentional 404 (Generates error metric in Grafana)
    if (i % 4 === 0) {
      await sendRequest("Intentional 404", "GET", "/non-existent-endpoint");
    }

    // 8. Intentional 400 (Bad POST data)
    if (i % 7 === 0) {
      await sendRequest("Intentional 400", "POST", "/users", { invalidField: true });
    }

    // Delay between batches to simulate real user pacing
    await sleep(400);
  }

  console.log(`\n=======================================================`);
  console.log(`✅ Traffic generation complete!`);
  console.log(`📈 Check Prometheus targets at http://localhost:30090/targets`);
  console.log(`📊 Check Grafana dashboard at http://localhost:30300`);
  console.log(`=======================================================`);
}

runTraffic();
