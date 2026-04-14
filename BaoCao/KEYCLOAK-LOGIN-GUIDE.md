# Hướng dẫn sử dụng chức năng đăng nhập Keycloak

## Thông tin cấu hình

### Keycloak Server
- **URL**: http://localhost:8081
- **Admin Console**: http://localhost:8081/admin
- **Admin User**: admin / admin

### Realm Configuration
- **Realm Name**: TranHuuNhan_52300235
- **Client ID**: flask-app
- **Client Type**: Public Client
- **Redirect URIs**: http://localhost/*, http://127.0.0.1/*

### Test Users
- **Username**: sv01
- **Password**: 123
- **Email**: nhanhuutran006@gmail.com
- **Full Name**: TRAN HUU NHAN

## Cách sử dụng

### 1. Truy cập Website
Mở trình duyệt và truy cập: http://localhost

### 2. Đăng nhập
1. Click nút **"🔐 Đăng nhập"** ở góc phải trên cùng
2. Bạn sẽ được chuyển hướng đến trang đăng nhập Keycloak
3. Nhập thông tin đăng nhập:
   - Username: `sv01`
   - Password: `123`
4. Click **"Sign In"**
5. Bạn sẽ được chuyển hướng về website với trạng thái đã đăng nhập

### 3. Tính năng sau khi đăng nhập
- Hiển thị thông tin user ở góc phải trên cùng
- Hiển thị nội dung protected (chỉ dành cho thành viên đã đăng nhập)
- Có thể test API bảo mật với nút **"🔐 Test Secure API"**

### 4. Đăng xuất
Click nút **"🚪 Đăng xuất"** để đăng xuất khỏi hệ thống

## Test API Endpoints

### Public API (không cần đăng nhập)
```bash
curl http://localhost/api/hello
```

### Secure API (cần đăng nhập)
```bash
# Sẽ trả về 401 nếu không có token
curl http://localhost/api/secure

# Với token (sau khi đăng nhập qua web)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost/api/secure
```

## Troubleshooting

### Nếu gặp lỗi khi đăng nhập
1. Kiểm tra Keycloak đang chạy: http://localhost:8081
2. Kiểm tra realm và client đã được tạo
3. Kiểm tra user sv01 đã được tạo và có password đúng

### Nếu cần tạo lại cấu hình Keycloak
```bash
# Vào container Keycloak
docker exec -it authentication-identity-server bash

# Cấu hình kcadm
/opt/keycloak/bin/kcadm.sh config credentials --server http://localhost:8080 --realm master --user admin --password admin

# Tạo realm (nếu chưa có)
/opt/keycloak/bin/kcadm.sh create realms -s realm=TranHuuNhan_52300235 -s enabled=true

# Tạo client (nếu chưa có)
/opt/keycloak/bin/kcadm.sh create clients -r TranHuuNhan_52300235 -s clientId=flask-app -s enabled=true -s publicClient=true -s directAccessGrantsEnabled=true -s standardFlowEnabled=true

# Tạo user (nếu chưa có)
/opt/keycloak/bin/kcadm.sh create users -r TranHuuNhan_52300235 -s username=sv01 -s enabled=true -s firstName="TRAN HUU" -s lastName="NHAN" -s email="nhanhuutran006@gmail.com"

# Đặt password cho user
/opt/keycloak/bin/kcadm.sh set-password -r TranHuuNhan_52300235 --username sv01 --new-password 123
```

## Kiến trúc Authentication Flow

1. **User click "Đăng nhập"** → Redirect đến Keycloak login page
2. **User nhập credentials** → Keycloak xác thực
3. **Keycloak redirect về website** với authorization code
4. **JavaScript exchange code** → Access token
5. **Website hiển thị user info** và enable protected features
6. **API calls sử dụng Bearer token** để truy cập secure endpoints

## Files liên quan

- `web-frontend-server/html/index.html` - Trang chủ với UI đăng nhập
- `web-frontend-server/html/keycloak-auth.js` - JavaScript xử lý authentication
- `application-backend-server/app.py` - Backend API với Keycloak integration
- `docker-compose.yml` - Cấu hình Keycloak container