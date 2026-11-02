#!/usr/bin/env bash
set -e

echo "======================================================="
echo "☸️  Deploying Lab 8 Kubernetes Microservices (Namespace: lab8)"
echo "======================================================="

# 1. Verify cluster connection
echo -e "\n[1/7] Verifying Kubernetes cluster connectivity..."
kubectl cluster-info || { echo "❌ Cannot connect to Kubernetes cluster. Please start Minikube or your cluster."; exit 1; }
kubectl get nodes

# 2. Create namespace
echo -e "\n[2/7] Creating / verifying 'lab8' namespace..."
kubectl apply -f k8s/00-namespace.yaml

# 3. Apply ConfigMap
echo -e "\n[3/7] Applying ConfigMap..."
kubectl apply -f k8s/01-configmap.yaml

# 4. Apply Secrets
echo -e "\n[4/7] Applying Secrets..."
if [ -f "k8s/02-secrets.yaml" ]; then
    kubectl apply -f k8s/02-secrets.yaml
else
    echo "⚠️ k8s/02-secrets.yaml not found! Applying k8s/02-secrets.yaml.example..."
    kubectl apply -f k8s/02-secrets.yaml.example
fi

# 5. Apply Microservices & Gateway
echo -e "\n[5/7] Deploying Microservices & API Gateway..."
kubectl apply -f k8s/user-service.yaml
kubectl apply -f k8s/product-service.yaml
kubectl apply -f k8s/order-service.yaml
kubectl apply -f k8s/api-gateway.yaml

# 6. Apply Prometheus & Grafana Monitoring
echo -e "\n[6/7] Deploying Prometheus & Grafana Monitoring..."
kubectl apply -f k8s/monitoring/01-prometheus-configmap.yaml
kubectl apply -f k8s/monitoring/02-prometheus.yaml
kubectl apply -f k8s/monitoring/03-grafana-datasources.yaml
kubectl apply -f k8s/monitoring/04-grafana.yaml

# 7. Check rollout status
echo -e "\n[7/7] Waiting for rollouts to complete..."
kubectl rollout status deployment/user-service -n lab8 --timeout=90s
kubectl rollout status deployment/product-service -n lab8 --timeout=90s
kubectl rollout status deployment/order-service -n lab8 --timeout=90s
kubectl rollout status deployment/api-gateway -n lab8 --timeout=90s

echo -e "\n======================================================="
echo "✅ Deployment Complete! Current Cluster State:"
echo "======================================================="
echo -e "\n--- Pods in 'lab8' ---"
kubectl get pods -n lab8 -o wide

echo -e "\n--- Services in 'lab8' ---"
kubectl get svc -n lab8

echo -e "\n--- Endpoints in 'lab8' ---"
kubectl get endpoints -n lab8

echo -e "\n💡 Access API Gateway locally via port-forward:"
echo "kubectl port-forward svc/api-gateway 3000:3000 -n lab8"
echo -e "\n💡 Access Prometheus locally via port-forward:"
echo "kubectl port-forward svc/prometheus-service 9090:9090 -n lab8"
echo -e "\n💡 Access Grafana locally via port-forward:"
echo "kubectl port-forward svc/grafana-service 3005:3000 -n lab8  (Credentials: admin / admin)"

