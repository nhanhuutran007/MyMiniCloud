# 🔐 Hướng dẫn chi tiết Setup GitHub Secrets

## 📋 Thông tin cần thiết

Bạn cần chuẩn bị 4 secrets sau:

| Secret Name | Value | Mô tả |
|-------------|-------|-------|
| `DOCKER_USERNAME` | `nhanhuutran007` | Docker Hub username |
| `DOCKER_PASSWORD` | `[your_password]` | Docker Hub password hoặc access token |
| `MINICLOUD_SSH_KEY` | `[nội dung file pem]` | SSH private key để kết nối EC2 |
| `MINICLOUD_HOST` | `ec2-13-214-23-181.ap-southeast-1.compute.amazonaws.com` | EC2 hostname |

## 🚀 Bước 1: Truy cập GitHub Repository Settings

1. **Mở GitHub repository** của bạn trong browser
2. **Click tab "Settings"** (ở góc phải, cạnh About)
3. **Scroll xuống sidebar bên trái** → tìm section "Security"
4. **Click "Secrets and variables"** → **Click "Actions"**

## 🔑 Bước 2: Thêm từng Secret

### **2.1. Thêm DOCKER_USERNAME**

1. **Click "New repository secret"** (nút xanh)
2. **Name**: `DOCKER_USERNAME`
3. **Secret**: `nhanhuutran007`
4. **Click "Add secret"**

### **2.2. Thêm DOCKER_PASSWORD**

1. **Click "New repository secret"**
2. **Name**: `DOCKER_PASSWORD`
3. **Secret**: [Nhập Docker Hub password của bạn]
   
   💡 **Tip**: Nên sử dụng Access Token thay vì password:
   - Vào Docker Hub → Account Settings → Security → New Access Token
   - Copy token và paste vào đây

4. **Click "Add secret"**

### **2.3. Thêm MINICLOUD_SSH_KEY**

Đây là bước quan trọng nhất:

1. **Lấy nội dung SSH key**:

   **Trên Windows:**
   ```powershell
   # Mở PowerShell trong thư mục chứa minicloud-key.pem
   Get-Content minicloud-key.pem | Set-Clipboard
   # Nội dung đã được copy vào clipboard
   ```

   **Trên Linux/Mac:**
   ```bash
   # Hiển thị nội dung file
   cat minicloud-key.pem
   # Copy manual toàn bộ nội dung
   ```

2. **Thêm secret**:
   - **Click "New repository secret"**
   - **Name**: `MINICLOUD_SSH_KEY`
   - **Secret**: Paste toàn bộ nội dung SSH key
   
   ⚠️ **Quan trọng**: Phải bao gồm cả dòng đầu và cuối:
   ```
   -----BEGIN RSA PRIVATE KEY-----
   [nội dung key ở giữa]
   -----END RSA PRIVATE KEY-----
   ```

3. **Click "Add secret"**

### **2.4. Thêm MINICLOUD_HOST**

1. **Click "New repository secret"**
2. **Name**: `MINICLOUD_HOST`
3. **Secret**: `ec2-13-214-23-181.ap-southeast-1.compute.amazonaws.com`
4. **Click "Add secret"**

## ✅ Bước 3: Verify Secrets đã được thêm

Sau khi thêm xong, bạn sẽ thấy 4 secrets trong danh sách:

```
Repository secrets (4)
├── DOCKER_USERNAME        ••••••••••••••••
├── DOCKER_PASSWORD        ••••••••••••••••
├── MINICLOUD_SSH_KEY      ••••••••••••••••
└── MINICLOUD_HOST         ••••••••••••••••
```

## 🧪 Bước 4: Test SSH Key Format

Để đảm bảo SSH key đúng format, test trên máy local:

```bash
# Test SSH connection
ssh -i "minicloud-key.pem" ubuntu@ec2-13-214-23-181.ap-southeast-1.compute.amazonaws.com

# Nếu thành công, key format đúng
# Nếu lỗi "bad permissions", chạy:
chmod 600 minicloud-key.pem
```

## 🚨 Common Issues & Solutions

### **Issue 1: SSH Key Format Error**
```
Error: Load key "minicloud-key.pem": invalid format
```

**Solution**: Đảm bảo copy đúng format:
- Bao gồm dòng `-----BEGIN RSA PRIVATE KEY-----`
- Bao gồm dòng `-----END RSA PRIVATE KEY-----`
- Không có khoảng trắng thừa ở đầu/cuối
- Không bị ngắt dòng sai

### **Issue 2: Docker Login Failed**
```
Error: unauthorized: authentication required
```

**Solution**: 
- Kiểm tra username: `nhanhuutran007`
- Sử dụng Access Token thay vì password
- Đảm bảo không có khoảng trắng thừa

### **Issue 3: Host Connection Timeout**
```
Error: ssh: connect to host ... port 22: Connection timed out
```

**Solution**:
- Kiểm tra EC2 instance đang chạy
- Kiểm tra Security Group cho phép SSH (port 22)
- Verify hostname chính xác

## 🎯 Bước 5: Test CI/CD Pipeline

Sau khi setup secrets xong:

### **5.1. Test Staging Deployment**
```bash
# Tạo develop branch
git checkout -b develop
echo "# Test staging deployment" >> test-staging.md
git add test-staging.md
git commit -m "test: staging deployment"
git push origin develop
```

### **5.2. Monitor GitHub Actions**
1. Vào tab **"Actions"** trong GitHub repository
2. Xem workflow **"Universal Docker Compose CI/CD"** chạy
3. Click vào run để xem chi tiết logs

### **5.3. Expected Results**
✅ Security validation passed  
✅ Docker images built successfully  
✅ Integration tests passed  
✅ SSH connection to EC2 successful  
✅ Deployment completed  
✅ Health check passed  

## 📞 Troubleshooting Steps

Nếu CI/CD fail:

1. **Check GitHub Actions logs**:
   - Vào Actions tab → Click failed run
   - Expand failed step để xem error message

2. **Common fixes**:
   ```bash
   # Re-add SSH key với format đúng
   # Verify EC2 instance running
   # Check Security Group rules
   # Test SSH connection manually
   ```

3. **Debug SSH connection**:
   ```bash
   # Trên máy local
   ssh -i "minicloud-key.pem" -v ubuntu@ec2-13-214-23-181.ap-southeast-1.compute.amazonaws.com
   # -v flag sẽ show verbose logs
   ```

## 🎉 Success Indicators

Khi setup thành công:
- ✅ 4 secrets hiển thị trong GitHub Settings
- ✅ Push code trigger GitHub Actions
- ✅ SSH connection thành công trong logs
- ✅ Docker containers deploy trên EC2
- ✅ Application accessible qua EC2 public IP

---

**🚀 Sau khi hoàn thành, mỗi lần push code sẽ tự động deploy lên EC2!**