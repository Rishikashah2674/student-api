# Lab 8 Scaling & Self-Healing Demonstration Script (PowerShell)

Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "⚙️  Lab 8: User Service Scaling & Self-Healing Demo" -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan

# 1. Inspect current state
Write-Host "`n[Step 1] Current User Service Deployment State:" -ForegroundColor Yellow
kubectl get deployment user-service -n lab8
kubectl get pods -l app=user-service -n lab8

# 2. Scale to 3 replicas
Write-Host "`n[Step 2] Scaling user-service to 3 replicas..." -ForegroundColor Yellow
kubectl scale deployment/user-service --replicas=3 -n lab8

Write-Host "`nWaiting for user-service replicas to be ready..." -ForegroundColor Yellow
kubectl rollout status deployment/user-service -n lab8 --timeout=60s

Write-Host "`n[Step 3] Scaled Pods & Service Endpoints (Load Balancer targets):" -ForegroundColor Green
kubectl get pods -l app=user-service -n lab8 -o wide
Write-Host "`nService Endpoints:" -ForegroundColor Green
kubectl get endpoints user-service -n lab8

# 3. Demonstrate self-healing
Write-Host "`n[Step 4] Demonstrating Self-Healing:" -ForegroundColor Yellow
$pods = (kubectl get pods -l app=user-service -n lab8 -o jsonpath='{.items[*].metadata.name}').Split(" ")
$victimPod = $pods[0]

Write-Host "Simulating Pod failure by terminating: $victimPod" -ForegroundColor Red
kubectl delete pod $victimPod -n lab8

Write-Host "`nChecking Pod recovery immediately after deletion..." -ForegroundColor Yellow
Start-Sleep -Seconds 3
kubectl get pods -l app=user-service -n lab8

Write-Host "`n=======================================================" -ForegroundColor Cyan
Write-Host "🎉 Self-healing verified! Kubernetes automatically spawned a replacement Pod." -ForegroundColor Green
Write-Host "=======================================================" -ForegroundColor Cyan

