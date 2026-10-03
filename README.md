# Lab 7: API Gateway, Service Discovery & Cloud Deployment

## 1. Architecture

```
                  ┌──────────────────────────────────────────────┐
                  │                External Client               │
                  │              (Postman / Web App)             │
                  └──────────────────────┬───────────────────────┘
                                         │ HTTP Request
                                         │ http://localhost:3000
                                         ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│ Docker Host                                                                      │
│                                                                                  │
│   ┌──────────────────────────────────────────────────────────────────────────┐   │
│   │                        PUBLIC ENTRY POINT CONTAINER                      │   │
│   │   ┌──────────────────────────────────────────────────────────────────┐   │   │
│   │   │                       API Gateway Service                        │   │   │
│   │   │                       (api-gateway:3000)                         │   │   │
│   │   └────────┬───────────────────────┬────────────────────────┬────────┘   │   │
│   └────────────┼───────────────────────┼────────────────────────┼────────────┘   │
│                │                       │                        │                │
│ ┌──────────────┼───────────────────────┼────────────────────────┼──────────────┐ │
│ │              ▼                       ▼                        ▼              │ │
│ │  ┌──────────────────────┐  ┌────────────────────┐  ┌──────────────────────┐ │ │
│ │  │     User Service     │  │  Product Service   │  │    Order Service     │ │ │
│ │  │ (user-service:3001)  │  │(product-svc:3002)  │  │ (order-service:3003) │ │ │
│ │  └───────────┬──────────┘  └─────────┬──────────┘  └──────────┬───────────┘ │ │
│ │              │                       │                        │              │ │
│ │              ▼                       ▼                        ▼              │ │
│ │  ┌──────────────────────┐  ┌────────────────────┐  ┌──────────────────────┐ │ │
│ │  │       User DB        │  │     Product DB     │  │       Order DB       │ │ │
│ │  │ (user-db:27017)      │  │(product-db:27017)  │  │ (order-db:27017)     │ │ │
│ │  └──────────────────────┘  └────────────────────┘  └──────────────────────┘ │ │
│ │                                                                              │ │
│ │                INTERNAL DOCKER NETWORK: campus-network                       │ │
│ │              (No public host port access to microservices)                   │ │
│ └──────────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. API Gateway Overview & Discussion

### Why Use a Single API Gateway?
In a microservices architecture, exposing individual microservices directly to clients creates tight coupling, security risks, and management complexity. A single API Gateway provides:

1. **Single Entry Point**: Clients interact exclusively with one public base URL (`http://localhost:3000`), hiding internal microservice port numbers and network topology.
2. **Encapsulation of Service Structure**: Internal microservice refactoring, port changes, or container restructuring do not affect client applications.
3. **Centralized Logging**: All incoming HTTP requests, methods, targeted services, and response status codes are logged consistently at the gateway level.
4. **Centralized Error Handling**: Unreachable or failing downstream microservices are caught at the gateway, returning clean `502 Bad Gateway` or `503 Service Unavailable` status codes instead of hanging client connections or leaking stack traces.

---

## 3. Configuration-Based Service Discovery

### How Service Discovery Works in Lab 7
In this lab, **static configuration-based service discovery** is implemented. The API Gateway reads microservice locations dynamically from environment variables defined in `config.js`:

* `USER_SERVICE_URL` (Default: `http://user-service:3001`)
* `PRODUCT_SERVICE_URL` (Default: `http://product-service:3002`)
* `ORDER_SERVICE_URL` (Default: `http://order-service:3003`)

### Why URLs Are Not Hardcoded
Hardcoding service URLs in proxy routes creates brittle code that breaks when switching between local development, Docker container networks, and cloud deployment environments. Configuration-driven discovery allows changing microservice hostnames or ports strictly through environment variables without modifying or recompiling gateway source code.

### Static Configuration vs. Dynamic Service Discovery
* **Static Configuration (This Lab)**: Service locations are fixed in environment variables or configuration files. Suitable for predictable containerized deployments like Docker Compose or single-cluster setups.
* **Dynamic Discovery (Consul, Eureka, Kubernetes DNS)**: Microservices register themselves with a central Service Registry upon startup. The gateway queries the registry dynamically to obtain service endpoints.
* **What Dynamic Discovery Provides**:
  * Automatic registration and deregistration of transient instances.
  * Real-time health checks and removal of unhealthy nodes.
  * Dynamic load balancing across multiple scaled instances.
  * Seamless support for auto-scaling and zero-downtime deployments.

---

## 4. API Gateway Route Table & Endpoints

All requests must be directed to the **API Gateway** on port `3000`.

| Client Request Path | Target Microservice | Internal Destination | Purpose |
| :--- | :--- | :--- | :--- |
| `GET /health` | **API Gateway** | Internal Gateway Handler | Gateway status & route health check |
| `/users/*` | **User Service** | `http://user-service:3001/users/*` | User management CRUD operations |
| `/products/*` | **Product Service** | `http://product-service:3002/products/*` | Product catalog CRUD operations |
| `/orders/*` | **Order Service** | `http://order-service:3003/orders/*` | Order placement & retrieval |

### Detailed API Endpoints (Called via Gateway `http://localhost:3000`)

#### User Endpoints
* `POST /users` - Create user
* `GET /users` - Retrieve all users
* `GET /users/:id` - Retrieve user by ID
* `PUT /users/:id` - Update user by ID
* `DELETE /users/:id` - Delete user by ID

#### Product Endpoints
* `POST /products` - Create product
* `GET /products` - Retrieve all products
* `GET /products/:id` - Retrieve product by ID
* `PUT /products/:id` - Update product by ID
* `DELETE /products/:id` - Delete product by ID

#### Order Endpoints
* `POST /orders` - Place order (Validates user & product via User/Product services)
* `GET /orders` - Retrieve all orders
* `GET /orders/:id` - Retrieve order by ID

---

## 5. Local Setup & Testing

### 1. Build and Run Docker Compose System
Run the complete stack in detached mode:

```bash
docker compose up --build -d
```

### 2. Verify Container Status
Check that all 7 containers are running and that only `api-gateway` exposes host port `3000`:

```bash
docker compose ps
```

### 3. Verify Gateway Health
```bash
curl http://localhost:3000/health
```
*Expected Response (`200 OK`)*:
```json
{
  "status": "UP",
  "service": "API Gateway",
  "timestamp": "2026-10-03T14:00:00.000Z",
  "routes": {
    "users": "http://user-service:3001",
    "products": "http://product-service:3002",
    "orders": "http://order-service:3003"
  }
}
```

### 4. Postman Collection Testing
Import `Lab7_APIGateway.postman_collection.json` into Postman and execute requests sequentially:
1. `GET http://localhost:3000/health`
2. `POST http://localhost:3000/users`
3. `GET http://localhost:3000/users`
4. `POST http://localhost:3000/products`
5. `GET http://localhost:3000/products`
6. `POST http://localhost:3000/orders`
7. `GET http://localhost:3000/orders`

---

## 6. Error Handling & Unreachable Service Test

### 502 / 503 Resilient Error Handling
When a downstream microservice is offline, crashed, or unreachable, the gateway catches the proxy connection failure and immediately responds with a structured `503 Service Unavailable` JSON payload:

```json
{
  "error": "Service Unavailable",
  "message": "The User Service is currently unreachable at http://user-service:3001.",
  "targetService": "User Service",
  "status": 503,
  "timestamp": "2026-10-03T14:05:00.000Z"
}
```

### Testing Unreachable Service Scenario
1. Stop the target microservice:
   ```bash
   docker stop user-service
   ```
2. Send a request to the gateway user endpoint:
   ```bash
   curl http://localhost:3000/users
   ```
3. Confirm that the gateway returns status `503 Service Unavailable` without crashing or hanging.
4. Restart the service:
   ```bash
   docker start user-service
   ```

---

## 7. Cloud Deployment Guide (Render / Railway / Fly.io)

### Deployment Steps
1. Push the code repository to GitHub.
2. In your cloud provider dashboard (e.g., Render / Railway):
   * Create a Web Service for `api-gateway` pointing to `./api-gateway/Dockerfile`.
   * Create Web Services for `user-service`, `product-service`, and `order-service`.
3. Configure Cloud Environment Variables:
   * **API Gateway Service**:
     * `PORT` = `3000` (or `8080` as assigned by cloud provider)
     * `USER_SERVICE_URL` = `<deployed-user-service-url>`
     * `PRODUCT_SERVICE_URL` = `<deployed-product-service-url>`
     * `ORDER_SERVICE_URL` = `<deployed-order-service-url>`
   * **Microservices**:
     * `MONGODB_URI` = `mongodb+srv://<username>:<password>@cluster.mongodb.net/<dbname>`
4. Test the Deployed Gateway:
   * `GET https://<your-gateway-app>.onrender.com/health`
   * `GET https://<your-gateway-app>.onrender.com/users`

---

## 8. Troubleshooting Guide

| Problem | Cause | Solution |
| :--- | :--- | :--- |
| **Container Fails to Start** | Missing npm package or invalid Dockerfile syntax | Check `docker compose logs <service-name>` for exact error stack trace. |
| **`503 Service Unavailable`** | Target service container is stopped or service URL environment variable is incorrect | Verify target service is running with `docker compose ps` and check `USER_SERVICE_URL` env var. |
| **MongoDB Atlas Connection Error (`querySrv ECONNREFUSED` / IP Whitelist)** | Client IP not whitelisted on MongoDB Atlas or local DNS SRV blocking | Add `0.0.0.0/0` (Allow Access from Anywhere) in MongoDB Atlas Network Access rules. |
| **Port Conflict (`EADDRINUSE`)** | Port 3000, 3001, 3002, or 3003 is already occupied on host machine | Stop lingering background processes using `netstat -ano` or update host port mapping. |
| **Direct Microservice Access Fails** | Host port mappings were intentionally removed for Lab 7 security compliance | Route all requests through API Gateway (`http://localhost:3000`). |

---

## 9. Reflection

In Lab 6, client applications interacted directly with each microservice on distinct host ports (`:3001`, `:3002`, `:3003`), exposing internal architecture details and requiring clients to manage multiple service URLs. Upgrading to Lab 7 introduced a centralized API Gateway that acts as a single unified entry point on port `3000`. By implementing configuration-based service discovery using environment variables, microservice endpoints can be dynamically updated without modifying gateway source code. Removing public host port mappings from backend microservices ensures strict internal network isolation, while centralized gateway request logging and structured 503 error handling significantly improve system security, observability, and resilience.

---

## 10. Submission Evidence Checklist

- [ ] **Docker Compose Running**: Screenshot of `docker compose ps` showing 7 containers running and only `api-gateway` exposing port 3000.
- [ ] **Gateway Health Check**: Screenshot of `GET http://localhost:3000/health` returning `200 OK`.
- [ ] **Gateway → User Service**: Screenshot of `GET http://localhost:3000/users` returning user list.
- [ ] **Gateway → Product Service**: Screenshot of `GET http://localhost:3000/products` returning product list.
- [ ] **Gateway → Order Service**: Screenshot of `POST http://localhost:3000/orders` returning created order (`201 Created`).
- [ ] **Request Logging**: Terminal screenshot showing `[GATEWAY LOG]` entries printed during request routing.
- [ ] **Unreachable Service Error Handling**: Screenshot of `GET http://localhost:3000/users` returning `503 Service Unavailable` when `user-service` is stopped.
- [ ] **Service Discovery Proof**: Verification showing environment variable changing target service port dynamically.
