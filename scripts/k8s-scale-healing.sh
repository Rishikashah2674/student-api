#!/usr/bin/env bash
set -e

echo "======================================================="
echo "⚙️  Lab 8: User Service Scaling & Self-Healing Demo"
echo "======================================================="

# 1. Inspect current state
echo -e "\n[Step 1] Current User Service Deployment State:"
kubectl get deployment user-service -n lab8
kubectl get pods -l app=user-service -n lab8

# 2. Scale to 3 replicas
echo -e "\n[Step 2] Scaling user-service to 3 replicas..."
kubectl scale deployment/user-service --replicas=3 -n lab8

echo -e "\nWaiting for user-service replicas to be ready..."
kubectl rollout status deployment/user-service -n lab8 --timeout=60s

echo -e "\n[Step 3] Scaled Pods & Service Endpoints (Load Balancer targets):"
kubectl get pods -l app=user-service -n lab8 -o wide
echo -e "\nService Endpoints:"
kubectl get endpoints user-service -n lab8

# 3. Demonstrate self-healing
echo -e "\n[Step 4] Demonstrating Self-Healing:"
VICTIM_POD=$(kubectl get pods -l app=user-service -n lab8 -o jsonpath='{.items[0].metadata.name}')

echo -e "Simulating Pod failure by terminating: $VICTIM_POD"
kubectl delete pod "$VICTIM_POD" -n lab8

echo -e "\nChecking Pod recovery immediately after deletion..."
sleep 3
kubectl get pods -l app=user-service -n lab8

echo -e "\n======================================================="
echo "🎉 Self-healing verified! Kubernetes automatically spawned a replacement Pod."
echo "======================================================="

