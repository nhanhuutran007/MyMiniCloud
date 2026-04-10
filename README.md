# MyMiniCloud - Mini Cloud Project

## 1. Mục tiêu & Chức năng chính

**MyMiniCloud** là một hệ thống kiến trúc Microservices mô phỏng một môi trường Cloud thu nhỏ, được triển khai và tự động hóa thông qua Docker Compose. Dự án này xây dựng một “mini cloud platform” gồm các thành phần mục tiêu chính:

- **Web Frontend Server** – Nginx static site (trang Home + Blog cá nhân).
- **Application Backend Server** – Flask API xử lý các endpoint (`/hello`, `/secure`, `/student`).
- **Relational Database Server** – MariaDB lưu trữ dữ liệu có cấu trúc (`minicloud` & `studentdb`).
- **Authentication & Identity Server** – Keycloak quản lý định danh (OIDC, realm riêng, client `flask-app`).
- **Object Storage Server** – MinIO lưu trữ đối tượng (bucket `profile-pics`, `documents`).
- **Internal DNS Server** – CoreDNS quản lý tên miền nội bộ (zone `cloud.local`).
- **Monitoring Node Exporter** – Thu thập chỉ số tài nguyên hệ thống.
- **Monitoring Prometheus Server** – Thu thập metric từ Node Exporter & Web Server.
- **Monitoring Grafana Dashboard Server** – Hệ thống hiển thị biểu đồ giám sát.
- **API Gateway / Load Balancer** – Nginx đóng vai trò cửa ngõ duy nhất, định tuyến và cân bằng tải.

Toàn bộ hệ thống chạy trên một mạng Docker duy nhất `cloud-net` để mô phỏng hạ tầng của một Cloud Platform thực thụ (tương tự AWS/Azure/GCP).

---

## 2. Thành viên thực hiện

Dự án được triển khai bởi:
- **Trần Hữu Nhân** - Leader
- **Nguyễn Yến Phụng** - Member
- **Đỗ Văn Trọng** - Member

---

## 3. Kiến trúc tổng quan

### 3.1. Network & Container
Hệ thống sử dụng mạng Docker `cloud-net` (bridge). Mỗi server là một container độc lập với định danh rõ ràng, kết nối vào mạng nội bộ để đảm bảo khả năng giao tiếp giữa các dịch vụ.

### 3.2. Sơ đồ Cấu trúc & Kiến trúc Tổng thể

![Sơ đồ Network](/BaoCao/sodo_network.png)

![Kiến trúc Tổng thể](/BaoCao/kientruc_tongthe.png)

---

## 4. Cấu trúc thư mục dự án

```text
tranhuunhanminiclouddemo/
├─ docker-compose.yml
├─ web-frontend-server/
│  ├─ html/ (Trang chủ & Blog)
│  └─ Dockerfile
├─ web-frontend-server-1, 2/ (Nodes cân bằng tải)
├─ application-backend-server/ (Flask API & students.json)
├─ relational-database-server/
│  └─ init/ (SQL scripts khởi tạo tự động)
├─ authentication-identity-server/ (Keycloak)
├─ object-storage-server/ (MinIO data)
├─ internal-dns-server/ (Corefile & Zone files)
├─ monitoring-prometheus-server/ (prometheus.yml)
├─ monitoring-grafana-dashboard-server/
└─ api-gateway-proxy-server/ (Nginx Load Balancer config)
```

---

## 5. Hướng dẫn Triển khai

### 5.1. Yêu cầu hệ thống
- Đã cài đặt **Docker** & **Docker Compose**.
- Các Port sau cần được giải phóng: `80`, `8080`, `8081`, `3306`, `9000`, `9001`, `9090`, `9100`, `3000`, `1053`.

### 5.2. Khởi động hệ thống
Từ thư mục gốc của dự án, thực hiện các lệnh sau:

```bash
# Build toàn bộ image (không dùng cache để đảm bảo cập nhật mới nhất)
docker-compose build --no-cache

# Khởi động cả cụm hệ thống
docker-compose up -d

# Kiểm tra trạng thái các container
docker-compose ps
```

---

## 6. Demo & Kiểm thử từng Server

### 6.1. Web Frontend & Load Balancer
**Mục đích:** Kiểm tra web tĩnh và khả năng cân bằng tải.
- Truy cập trực tiếp: [http://localhost:8080](http://localhost:8080)
- Truy cập qua Gateway: [http://localhost](http://localhost)
- **Kiểm tra:** Bấm F5 liên tục, nội dung sẽ luân phiên giữa các server frontend (Round Robin).

### 6.2. Application Backend (Flask API)
**Mục đích:** Kiểm tra API hoạt động và định tuyến từ Gateway.
- Gọi API hello: `curl http://localhost/api/hello`
- Trả về danh sách sinh viên (EXT 2 & 9): `curl http://localhost/student/`

### 6.3. Relational Database (MariaDB)
**Mục đích:** Xác minh dữ liệu khởi tạo tự động.
- Kiểm tra bảng `notes`:
```bash
docker run -it --rm --network cloud-net mysql:8 sh -c 'mysql -h relational-database-server -uroot -proot -D minicloud -e "SHOW TABLES; SELECT * FROM notes;"'
```
- Kiểm tra danh sách sinh viên trong `studentdb`:
```bash
docker run -it --rm --network cloud-net mysql:8 sh -c 'mysql -h relational-database-server -uroot -proot -D studentdb -e "SELECT * FROM students;"'
```

### 6.4. Authentication Identity (Keycloak)
**Mục đích:** Kiểm tra OIDC và bảo mật API. Quá trình kiểm tra gồm 2 bước: lấy token và dùng token đó để truy cập tài nguyên bảo mật.

**Bước 1: Lấy Token (Access Token)**
Mở Terminal/PowerShell và thực thi lệnh `curl` sau để xin cấp token từ Keycloak (lưu ý Realm `TranHuuNhan_52300235` và password `123`):

```bash
curl -X POST "http://localhost:8081/realms/TranHuuNhan_52300235/protocol/openid-connect/token" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "username=sv01" \
     -d "password=123" \
     -d "grant_type=password" \
     -d "client_id=flask-app"
```
Kết quả trả về sẽ là một chuỗi JSON. Bạn hãy copy phần chữ dài loằng ngoằng nằm trong đoạn `"access_token": "..."` (không lặp lại dấu nháy kép).

**Bước 2: Truy cập API bảo mật (Secure API)**
Sử dụng Access Token vừa copy (`<TOKEN_CỦA_BẠN>`) để truy cập endpoint bảo mật `/secure`.

Ví dụ cụ thể: (thay chuỗi `eyJhbG...` bằng token thật của bạn)

*Cách 1: Truy cập thẳng vào Application Container qua Port 8085*
```bash
curl -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI..." http://localhost:8085/secure
```

*Cách 2: Truy cập thông qua API Gateway Server qua Port 80 (Khuyên dùng, chuẩn Microservices)*
```bash
curl -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI..." http://localhost/api/secure
```

### 6.5. Object Storage (MinIO)
- Console quản trị: [http://localhost:9001](http://localhost:9001)
- Tài khoản: `minioadmin` / `minioadmin`
- Sử dụng các bucket `profile-pics` và `documents` để lưu trữ dữ liệu.

### 6.6. Internal DNS (CoreDNS)
**Mục đích:** Phân giải tên miền `*.cloud.local`.
```bash
docker run --rm --network cloud-net busybox nslookup app-backend.cloud.local internal-dns-server
```

### 6.7. Monitoring (Prometheus & Grafana)
- **Prometheus:** [http://localhost:9090](http://localhost:9090) (Xem Status -> Targets).
- **Grafana:** [http://localhost:3000](http://localhost:3000) (User: `admin/admin`). Thêm Data Source từ `http://monitoring-prometheus-server:9090`.

---

## 7. Kiểm tra thông mạng & Docker Hub

### 7.1. Thông mạng giữa các container
Dùng lệnh ping nội bộ để xác nhận các container thấy nhau:
Có thể dùng ping từ 1 container bất kỳ (ví dụ từ `web-frontend-server`):

```bash
docker run -it --rm --network cloud-net alpine sh

# Trong shell của container:
ping -c 3 web-frontend-server
ping -c 3 relational-database-server
ping -c 3 authentication-identity-server
ping -c 3 object-storage-server
ping -c 3 monitoring-prometheus-server
ping -c 3 monitoring-grafana-dashboard-server
ping -c 3 internal-dns-server
```

### 7.2. Push Image lên Docker Hub
Hệ thống đã được đẩy image tùy chỉnh lên Docker Hub:
- **Repository:** `tranhuunhan/tranhuunhan-minicloud-backend`
- **Link:** [https://hub.docker.com/r/tranhuunhan/tranhuunhan-minicloud-backend](https://hub.docker.com/r/tranhuunhan/tranhuunhan-minicloud-backend)

