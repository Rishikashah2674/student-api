# Lab 8 Kubernetes Deployment & Verification Script (PowerShell)
param (
    [switch]$SkipMonitoring = $false
)

Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "☸️  Deploying Lab 8 Kubernetes Microservices (Namespace: lab8)" -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan

# 1. Verify cluster connection
Write-Host "`n[1/7] Verifying Kubernetes cluster connectivity..." -ForegroundColor Yellow
try {
    kubectl cluster-info
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Cannot connect to Kubernetes cluster. Please start Minikube or Docker Desktop Kubernetes."
        exit 1
    }
    Write-Host "Kubernetes Nodes:" -ForegroundColor Green
    kubectl get nodes
} catch {
    Write-Error "Failed to execute kubectl. Is kubectl installed and in PATH?"
    exit 1
}

# 2. Create namespace
Write-Host "`n[2/7] Creating / verifying 'lab8' namespace..." -ForegroundColor Yellow
kubectl apply -f k8s/00-namespace.yaml

# 3. Apply ConfigMap
Write-Host "`n[3/7] Applying ConfigMap..." -ForegroundColor Yellow
kubectl apply -f k8s/01-configmap.yaml

# 4. Apply Secrets
Write-Host "`n[4/7] Applying Secrets..." -ForegroundColor Yellow
if (Test-Path "k8s/02-secrets.yaml") {
    kubectl apply -f k8s/02-secrets.yaml
} else {
    Write-Warning "k8s/02-secrets.yaml not found! Applying k8s/02-secrets.yaml.example..."
    kubectl apply -f k8s/02-secrets.yaml.example
}

# 5. Apply Microservices & Gateway
Write-Host "`n[5/7] Deploying Microservices & API Gateway..." -ForegroundColor Yellow
kubectl apply -f k8s/user-service.yaml
kubectl apply -f k8s/product-service.yaml
kubectl apply -f k8s/order-service.yaml
kubectl apply -f k8s/api-gateway.yaml

# 6. Apply Prometheus & Grafana Monitoring
if (-not $SkipMonitoring) {
    Write-Host "`n[6/7] Deploying Prometheus & Grafana Monitoring..." -ForegroundColor Yellow
    kubectl apply -f k8s/monitoring/01-prometheus-configmap.yaml
    kubectl apply -f k8s/monitoring/02-prometheus.yaml
    kubectl apply -f k8s/monitoring/03-grafana-datasources.yaml
    kubectl apply -f k8s/monitoring/04-grafana.yaml
} else {
    Write-Host "`n[6/7] Skipping monitoring setup as requested." -ForegroundColor DarkGray
}

# 7. Check rollout status
Write-Host "`n[7/7] Waiting for rollouts to complete..." -ForegroundColor Yellow
kubectl rollout status deployment/user-service -n lab8 --timeout=90s
kubectl rollout status deployment/product-service -n lab8 --timeout=90s
kubectl rollout status deployment/order-service -n lab8 --timeout=90s
kubectl rollout status deployment/api-gateway -n lab8 --timeout=90s

Write-Host "`n=======================================================" -ForegroundColor Cyan
Write-Host "✅ Deployment Complete! Current Cluster State:" -ForegroundColor Green
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "`n--- Pods in 'lab8' ---" -ForegroundColor Yellow
kubectl get pods -n lab8 -o wide

Write-Host "`n--- Services in 'lab8' ---" -ForegroundColor Yellow
kubectl get svc -n lab8

Write-Host "`n--- Endpoints in 'lab8' ---" -ForegroundColor Yellow
kubectl get endpoints -n lab8

Write-Host "`n💡 Access API Gateway locally via port-forward:" -ForegroundColor Cyan
Write-Host "kubectl port-forward svc/api-gateway 3000:3000 -n lab8" -ForegroundColor White
Write-Host "`n💡 Access Prometheus locally via port-forward:" -ForegroundColor Cyan
Write-Host "kubectl port-forward svc/prometheus-service 9090:9090 -n lab8" -ForegroundColor White
Write-Host "`n💡 Access Grafana locally via port-forward:" -ForegroundColor Cyan
Write-Host "kubectl port-forward svc/grafana-service 3005:3000 -n lab8  (Credentials: admin / admin)" -ForegroundColor White

