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

**Mục tiêu:** Kiểm tra web tĩnh và khả năng phân tải tự động qua Nginx Load Balancer.

**Cách thực hiện:** Đóng vai người dùng truy cập trực tiếp vào phân hệ web và tiếp cận thông qua API Gateway.

**Lệnh kiểm tra yêu cầu cơ bản:**
- Truy cập trực tiếp cổng Container 1: [http://localhost:8080](http://localhost:8080)
- Gọi web qua hệ Gateway: [http://localhost](http://localhost)

**Lệnh kiểm tra yêu cầu mở rộng:**
- Load Balancer Round Robin: Truy cập [http://localhost](http://localhost) và f5 liên tục (reload website nhiều lần).

**Kết quả dự kiến:** Hiệu ứng chuyển hướng trên trang thay đổi luân phiên theo chu kỳ giữa các node web frontend con chứng minh Load balancer điều phối request thành công.

### 6.2. Application Backend (Flask API)

**Mục tiêu:** Xác minh tính chuyên biệt về mặt logic của Application API và sự chuyển tiếp chuẩn xác từ tuyến Gateway.

**Cách thực hiện:** Dùng lệnh `curl` gọi các endpoint trực tiếp.

**Lệnh kiểm tra yêu cầu cơ bản:**
- Gọi API trạng thái (`hello`): `curl http://localhost/api/hello`

**Lệnh kiểm tra yêu cầu mở rộng:**
- Trả về danh sách sinh viên trực tiếp từ kết nối db (Mở rộng EXT 2 & 9): `curl http://localhost/student/`

**Kết quả dự kiến:**
- Lệnh `hello`: Trả lời thông báo chào mừng từ Flask API theo định dạng JSON chuyên nghiệp.
- Lệnh `student`: Load thành công danh sách tập sinh viên từ backend gửi lên dạng chuẩn.

### 6.3. Relational Database (MariaDB)

**Mục tiêu:** Kiểm chứng kết nối dữ liệu có cấu trúc từ backend, minh chứng sự tự động hóa Scripts khởi tạo.

**Cách thực hiện:** Giả lập container con để mở luồng mysql trỏ thẳng vào Master Data.

**Lệnh kiểm tra yêu cầu cơ bản:**
- Xác nhận tập dữ liệu của schema chính `minicloud`:
```bash
docker run -it --rm --network cloud-net mysql:8 sh -c 'mysql -h relational-database-server -uroot -proot -D minicloud -e "SHOW TABLES; SELECT * FROM notes;"'
```

**Lệnh kiểm tra yêu cầu mở rộng:**
- Xác nhận bảng thực thể dữ liệu mới cho luồng Database riêng biệt `studentdb`:
```bash
docker run -it --rm --network cloud-net mysql:8 sh -c 'mysql -h relational-database-server -uroot -proot -D studentdb -e "SELECT * FROM students;"'
```

**Kết quả dự kiến:** Hệ thống tự động phản hồi lại bảng chứa cấu hình dữ liệu được seed thành công bằng script SQL của hệ.

### 6.4. Authentication Identity (Keycloak)

**Mục tiêu:** Kiểm tra OIDC (OpenID Connect) và bảo mật Identity API theo quy chuẩn bảo vệ microservice.

**Cách thực hiện:** Thực thi tuần tự quy trình xin thông tin gói xác thực sau đó lấy Bearer Token chèn vào Header cho lệnh triệu gọi.

**Lệnh kiểm tra yêu cầu cơ bản:**
*Bước 1: Xin Token qua xác thực user*
```bash
curl -X POST "http://localhost:8081/realms/TranHuuNhan_52300235/protocol/openid-connect/token" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "username=sv01" \
     -d "password=123" \
     -d "grant_type=password" \
     -d "client_id=flask-app"
```
*(Copy giá trị trong `"access_token": "..."` từ chùm json trả về, giả sử là `<TOKEN_CỦA_BẠN>`)*

*Bước 2: Xuyên phòng vệ lớp cổng ngoài Gateway Port 80*
```bash
curl -H "Authorization: Bearer <TOKEN_CỦA_BẠN>" http://localhost/api/secure
```

**Lệnh kiểm tra yêu cầu mở rộng:**
*Xuyên phòng vệ cổng backend thuần (port 8085):*
```bash
curl -H "Authorization: Bearer <TOKEN_CỦA_BẠN>" http://localhost:8085/secure
```

**Kết quả dự kiến:**
- Nếu bạn gọi route `/secure` mà bỏ quên token, hệ thống Keycloak sẽ bẻ khóa chặn lại (401 Unauthorized).
- Nếu mã chuẩn xác, Backend Flask sẽ tiếp nhận và chào mừng thành công.

### 6.5. Object Storage (MinIO)

**Mục tiêu:** Cấp phát hạ tầng Storage chứa Object tĩnh như ảnh, tệp tin với bộ khung tiêu chuẩn S3 kết hợp Access Policy rõ ràng.

**Cách thực hiện:** Xác thực hệ Console Web và sau đó thao tác trên luồng terminal MinIO Client chuyển access policies.

**Lệnh kiểm tra yêu cầu cơ bản:**
- Mở Server Storage Engine: [http://localhost:9001](http://localhost:9001)
- Lệnh đăng nhập qua trình duyệt: `minioadmin` / `minioadmin`
- Xác minh hai bucket tự động được sinh: `profile-pics` và `documents`.

**Lệnh kiểm tra yêu cầu mở rộng:**
*(Thiết lập quyền truy cập Public trực tiếp qua cơ chế `mc` tích hợp sẵn trong MinIO)*

```bash
# Bước 1: Chui vào bên trong container MinIO
docker exec -it object-storage-server sh

# Bước 2: Khởi tạo biến môi trường MinIO Client (mc)
mc alias set local http://localhost:9000 minioadmin minioadmin

# Bước 3: Cấp quyền Public (Tải xuống/Xem tài nguyên) ở bucket profile-pics
mc anonymous set download local/profile-pics

# Bước 4: Kiểm tra lại quyền set
mc anonymous get local/profile-pics

# Bước 5: Thoát khỏi MinIO
exit
```

**Kết quả dự kiến:** URL hình ảnh trực tiếp (như: [http://localhost:9000/profile-pics/avatar.jpg](http://localhost:9000/profile-pics/avatar.jpg)) sau khi thiết lập được truy cập trơn tru mà không yêu cầu ID bảo mật.
### 6.6. Internal DNS (CoreDNS)

**Mục tiêu:** Thay vì giao tiếp bằng địa chỉ IP thô cứng, hệ thống Microservices sẽ phân giải tên miền định nghĩa linh hoạt theo pattern `*.cloud.local`.

**Cách thực hiện:** Kích hoạt một shell Alpine/Busybox chung cụm mạng ảo và dùng `nslookup` tra tên trên máy chủ CoreDNS.

**Lệnh kiểm tra yêu cầu cơ bản:**
Dùng container `busybox` tra cứu tuyến đầu:
```bash
docker run --rm --network cloud-net busybox nslookup web-frontend-server.cloud.local internal-dns-server
```

**Lệnh kiểm tra yêu cầu mở rộng:**
1. Khám phá các Backend Component:
```bash
docker run --rm --network cloud-net busybox nslookup app-backend.cloud.local internal-dns-server
docker run --rm --network cloud-net busybox nslookup minio.cloud.local internal-dns-server
docker run --rm --network cloud-net busybox nslookup keycloak.cloud.local internal-dns-server
```

2. Bổ sung bản ghi thực tế theo dự án thiết kế (Trang 25):
- Cập nhật trực tiếp: Mở Zone tại `tranhuunhanminiclouddemo/internal-dns-server/zones/db.cloud.local`.
- Ghi mới địa chỉ: `new-service IN A 10.10.10.50`
- Áp dụng thay đổi: `docker restart internal-dns-server`.

**Kết quả dự kiến:** Domain truy xuất chuyển giao được thành đúng IP nội mạng `cloud-net`, khi gõ lệnh nslookup hệ thống hiển thị chính xác tên miền tương quan (vd tên miền gốc, root ip...).

### 6.7. Monitoring (Prometheus & Grafana)

**Mục tiêu:** Tạo nên biểu đồ phân tích thời gian thực và log trạng thái tài nguyên cho toàn bộ Microservices Nodes.

**Cách thực hiện:** Trích xuất Target của Metrics trên Prometheus, sau đó nạp số liệu Data lên Dashboard đồ thị của Grafana.

**Lệnh kiểm tra yêu cầu cơ bản:**
- Giao diện Prometheus: Cập bến [http://localhost:9090](http://localhost:9090) và truy cập Status -> Targets.

**Lệnh kiểm tra yêu cầu mở rộng:**
- Giám sát qua Biểu diễn hình ảnh Dashboard: Vào thẳng [http://localhost:3000](http://localhost:3000) (User `admin/admin`), tạo Data Source móc nối đường truyền nội mạng `http://monitoring-prometheus-server:9090` rồi tự do vẽ thông số.

**Kết quả dự kiến:**
- Prometheus cho cờ hiệu UP xanh đối với toàn bộ tiến trình báo cáo.
- Grafana kết nối luồng dữ liệu trơn tru, hiển thị chuẩn hệ mét máy chủ (RAM, Disk, Network).

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

