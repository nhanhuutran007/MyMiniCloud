# 🔍 Kiểm tra CI/CD Pipeline Status

## 📋 Thông tin vừa thực hiện

✅ **Commit pushed**: `feat: add System panel with EC2 SSH testing commands`  
✅ **Branch**: `develop` (sẽ trigger Staging Deployment)  
✅ **Repository**: `https://github.com/nhanhuutran007/MyMiniCloud`  

## 🚀 Cách kiểm tra CI/CD Pipeline

### **Bước 1: Mở GitHub Actions**
1. Vào GitHub repository: `https://github.com/nhanhuutran007/MyMiniCloud`
2. Click tab **"Actions"**
3. Tìm workflow **"Universal Docker Compose CI/CD"**
4. Click vào run mới nhất (commit: `feat: add System panel...`)

### **Bước 2: Monitor Pipeline Progress**

Pipeline sẽ chạy theo thứ tự:

```
🔒 1. Security Validation (2-3 phút)
├── ✅ Trivy vulnerability scanner
├── ✅ Docker Compose validation  
└── ✅ Secrets scanning

🔨 2. Build Docker Images (5-7 phút)
├── ✅ web-frontend-server
├── ✅ application-backend-server
└── ✅ internal-dns-server

🧪 3. Integration Testing (3-5 phút)
├── ✅ Start all services
├── ✅ Health check
└── ✅ API testing

🚀 4. Deploy to Staging (2-3 phút)
├── ✅ SSH connection to EC2
├── ✅ Copy deployment script
├── ✅ Run deployment
└── ✅ Health verification
```

**Tổng thời gian dự kiến: 12-18 phút**

## 🔐 Kiểm tra GitHub Secrets

### **Required Secrets (4 secrets):**

Vào **Settings** → **Secrets and variables** → **Actions** và verify:

```
✅ DOCKER_USERNAME
├─ Value: nhanhuutran007
└─ Status: Should show ••••••••••••••••

✅ DOCKER_PASSWORD  
├─ Value: [your Docker Hub password/token]
└─ Status: Should show ••••••••••••••••

✅ MINICLOUD_SSH_KEY
├─ Value: [SSH private key content]
└─ Status: Should show ••••••••••••••••

✅ MINICLOUD_HOST
├─ Value: ec2-13-214-23-181.ap-southeast-1.compute.amazonaws.com
└─ Status: Should show ••••••••••••••••
```

### **Nếu thiếu secrets:**
- Pipeline sẽ fail ở bước "Setup SSH" hoặc "Login to Docker Hub"
- Error message sẽ hiển thị: `Error: Secret MINICLOUD_SSH_KEY not found`

## 🧪 Expected Results

### **✅ Success Indicators:**

1. **GitHub Actions Tab:**
   - ✅ All steps show green checkmarks
   - ✅ "Deploy to staging" step completes
   - ✅ No red X marks

2. **EC2 Instance:**
   ```bash
   # Sau khi deployment hoàn thành, services sẽ chạy trên EC2
   # Có thể test bằng cách truy cập:
   http://ec2-13-214-23-181.ap-southeast-1.compute.amazonaws.com
   ```

3. **Logs Success Messages:**
   ```
   ✅ SSH connection successful
   ✅ Deployment script copied
   ✅ Services started successfully
   ✅ Health check passed
   ✅ Staging deployment completed
   ```

### **❌ Common Failure Points:**

1. **SSH Connection Failed:**
   ```
   Error: Permission denied (publickey)
   ```
   → Check `MINICLOUD_SSH_KEY` format

2. **Docker Login Failed:**
   ```
   Error: unauthorized: authentication required
   ```
   → Check `DOCKER_USERNAME` và `DOCKER_PASSWORD`

3. **Host Connection Timeout:**
   ```
   Error: ssh: connect to host ... port 22: Connection timed out
   ```
   → Check EC2 instance running và Security Group

## 🔧 Troubleshooting Steps

### **Nếu Pipeline Fails:**

1. **Check GitHub Actions Logs:**
   - Click vào failed step
   - Expand error logs
   - Look for specific error messages

2. **Common Fixes:**
   ```bash
   # Re-check secrets format
   # Verify EC2 instance is running
   # Check Security Group allows SSH (port 22)
   # Verify SSH key permissions
   ```

3. **Manual SSH Test:**
   ```bash
   # Test SSH connection manually (if you have the key file)
   ssh -i "minicloud-key.pem" ubuntu@ec2-13-214-23-181.ap-southeast-1.compute.amazonaws.com
   ```

## 📊 Real-time Monitoring

### **While Pipeline is Running:**

1. **GitHub Actions Page:**
   - Refresh để xem progress
   - Click vào running step để xem live logs

2. **Expected Timeline:**
   - **0-3 min**: Security validation
   - **3-10 min**: Docker builds
   - **10-15 min**: Integration testing
   - **15-18 min**: Deployment to EC2

3. **Success Confirmation:**
   - All steps show ✅
   - Final message: "Staging deployment completed"
   - EC2 services accessible via public IP

## 🎯 Next Steps After Success

1. **Test Staging Environment:**
   ```bash
   # Access staging via EC2 public IP
   curl http://ec2-13-214-23-181.ap-southeast-1.compute.amazonaws.com
   ```

2. **Test Production Deployment:**
   ```bash
   # Merge develop to main for production deployment
   git checkout main
   git merge develop
   git push origin main
   ```

3. **Monitor Both Environments:**
   - Staging: Triggered by `develop` branch
   - Production: Triggered by `main` branch

---

**🔗 Quick Links:**
- **GitHub Actions**: https://github.com/nhanhuutran007/MyMiniCloud/actions
- **Repository Settings**: https://github.com/nhanhuutran007/MyMiniCloud/settings/secrets/actions
- **EC2 Application**: http://ec2-13-214-23-181.ap-southeast-1.compute.amazonaws.com