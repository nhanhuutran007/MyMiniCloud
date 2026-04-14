# 🔧 Debug Workflow Issues

## 📊 **Workflow đã được trigger!**

**Commit**: `test: trigger workflow after manual setup`  
**Time**: Just pushed to main branch  
**Expected**: Workflow should start running now  

## 🔍 **Cách kiểm tra workflow status:**

### **Bước 1: Mở GitHub Actions**
```
https://github.com/nhanhuutran007/MyMiniCloud/actions
```

### **Bước 2: Tìm workflow run mới nhất**
- Tìm run với commit message: "test: trigger workflow after manual setup"
- Status có thể là: 🟡 Running, ✅ Success, hoặc ❌ Failed

### **Bước 3: Click vào workflow run để xem chi tiết**
- Xem từng job: load-config, security-validation, build-images, etc.
- Click vào failed step để xem error logs

## 🚨 **Common Issues và Solutions:**

### **1. Missing Secrets Error**
```
Error: Secret DOCKER_USERNAME not found
Error: Secret MINICLOUD_SSH_KEY not found
```
**Solution**: Kiểm tra GitHub Secrets đã được thêm chưa:
- Settings → Secrets and variables → Actions
- Cần có: DOCKER_USERNAME, DOCKER_PASSWORD, MINICLOUD_SSH_KEY, MINICLOUD_HOST

### **2. Docker Build Failed**
```
Error: failed to solve: dockerfile parse error
```
**Solution**: Kiểm tra Dockerfile syntax trong các service folders

### **3. SSH Connection Failed**
```
Error: Permission denied (publickey)
Error: Connection timed out
```
**Solution**: 
- Kiểm tra MINICLOUD_SSH_KEY format (phải có BEGIN/END lines)
- Verify EC2 instance đang chạy
- Check Security Group allows SSH (port 22)

### **4. Integration Test Failed**
```
Error: curl: (7) Failed to connect to localhost port 80
```
**Solution**: Services chưa start đầy đủ, cần tăng wait time

### **5. Deployment Failed**
```
Error: /tmp/deploy.sh: No such file or directory
```
**Solution**: Deploy script không được copy đúng, check file permissions

## 📋 **Debugging Steps:**

### **Step 1: Check Workflow Logs**
1. Vào failed workflow run
2. Expand failed step
3. Copy error message

### **Step 2: Verify Prerequisites**
```bash
# Check if all required files exist
ls -la .github/workflows/
ls -la .github/scripts/
ls -la .github/configs/
```

### **Step 3: Test Locally**
```bash
# Test Docker Compose locally
docker compose config
docker compose up -d
docker compose ps
```

### **Step 4: Validate Secrets**
- DOCKER_USERNAME: nhanhuutran007
- DOCKER_PASSWORD: [your Docker Hub password/token]
- MINICLOUD_SSH_KEY: [full SSH private key with BEGIN/END]
- MINICLOUD_HOST: ec2-13-214-23-181.ap-southeast-1.compute.amazonaws.com

## 🎯 **Expected Workflow Flow:**

```
1. load-config (1-2 min)
   ├── Parse project configuration
   └── Set output variables

2. security-validation (2-3 min)
   ├── Trivy vulnerability scan
   ├── Docker Compose validation
   └── Secrets detection

3. build-images (5-7 min)
   ├── Build web-frontend-server
   ├── Build application-backend-server
   └── Build internal-dns-server

4. integration-test (3-5 min)
   ├── Start all services
   ├── Health checks
   └── API testing

5. deploy-production (2-3 min)
   ├── SSH to EC2
   ├── Copy deployment script
   ├── Run deployment
   └── Health verification
```

## 📞 **Next Steps:**

1. **Monitor GitHub Actions** - Xem workflow có chạy không
2. **Check for errors** - Nếu fail, xem error logs
3. **Fix issues** - Dựa vào error message để fix
4. **Re-trigger** - Push commit mới để test lại

---

**🔗 Quick Links:**
- **Actions**: https://github.com/nhanhuutran007/MyMiniCloud/actions
- **Secrets**: https://github.com/nhanhuutran007/MyMiniCloud/settings/secrets/actions
- **Workflow File**: https://github.com/nhanhuutran007/MyMiniCloud/blob/main/.github/workflows/ci-cd.yml