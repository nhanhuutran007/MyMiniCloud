# 🔍 Debug GitHub Actions Workflow

## ❌ **Vấn đề hiện tại:**
- GitHub Actions không hiển thị workflow nào
- Không có workflow runs trong Actions tab

## 🔧 **Các nguyên nhân có thể:**

### **1. Workflow Path Issues**
Workflow files phải ở đúng vị trí:
```
.github/workflows/ci-cd.yml ✅ (đã có)
.github/workflows/pr-validation.yml ✅ (đã có)
```

### **2. YAML Syntax Errors**
Nếu có lỗi syntax, workflow sẽ không chạy và không hiển thị error.

### **3. Repository Settings**
- Actions có thể bị disable trong repository settings
- Permissions có thể bị hạn chế

### **4. Branch Protection**
- Main branch có thể có protection rules
- Workflow có thể cần approval

## 🔍 **Cách kiểm tra:**

### **Bước 1: Kiểm tra Repository Settings**
1. Vào: `https://github.com/nhanhuutran007/MyMiniCloud/settings`
2. Click **"Actions"** → **"General"**
3. Đảm bảo **"Allow all actions and reusable workflows"** được chọn

### **Bước 2: Kiểm tra Workflow Syntax**
Có thể test syntax tại: https://rhysd.github.io/actionlint/

### **Bước 3: Kiểm tra Permissions**
- Repository có thể cần enable Actions
- User có thể cần quyền admin

### **Bước 4: Manual Trigger**
1. Vào Actions tab
2. Click workflow name (nếu có)
3. Click "Run workflow" button

## 🚨 **Troubleshooting Steps:**

### **Option 1: Check Repository Actions Settings**
```
Repository → Settings → Actions → General
- Allow GitHub Actions: ✅ Enable
- Actions permissions: ✅ Allow all actions
```

### **Option 2: Validate YAML Syntax**
Workflow có thể có lỗi syntax không hiển thị. Cần check:
- Indentation (spaces, not tabs)
- YAML structure
- Required fields

### **Option 3: Create Simple Test Workflow**
Tạo workflow đơn giản để test:
```yaml
name: Test
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: echo "Hello World"
```

### **Option 4: Check Branch Rules**
- Main branch có thể có protection
- Workflow có thể cần approval từ admin

## 📋 **Next Steps:**

1. **Kiểm tra Repository Settings** (quan trọng nhất)
2. **Validate workflow YAML syntax**
3. **Tạo simple test workflow**
4. **Check repository permissions**

## 🔗 **Links để kiểm tra:**
- Repository Settings: `https://github.com/nhanhuutran007/MyMiniCloud/settings`
- Actions Settings: `https://github.com/nhanhuutran007/MyMiniCloud/settings/actions`
- Workflow Files: `https://github.com/nhanhuutran007/MyMiniCloud/tree/main/.github/workflows`