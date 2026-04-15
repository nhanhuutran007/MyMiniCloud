# MyMiniCloud - Mini Cloud Project

## 1. Mục tiêu & Chức năng chính

**MyMiniCloud** là một hệ thống kiến trúc Microservices mô phỏng một môi trường Cloud thu nhỏ, được triển khai và tự động hóa thông qua Docker Compose. Dự án này xây dựng một “mini cloud platform” gồm các thành phần mục tiêu chính:

- **Web Frontend Server** – Nginx host website tĩnh (Trang Home, Blog, System Panel), hỗ trợ SSI.
- **Application Backend Server** – Flask API xử lý logic nghiệp vụ, kết nối DB và xác thực OIDC.
- **Relational Database Server** – MariaDB lưu trữ dữ liệu (Schema `minicloud` và `studentdb`).
- **Authentication & Identity Server** – Keycloak quản lý định danh và bảo mật API.
- **Object Storage Server** – MinIO lưu trữ tệp tin (S3 compatible).
- **Internal DNS Server** – BIND9 quản lý tên miền nội bộ `*.cloud.local`.
- **Monitoring Stack** – Node Exporter, Prometheus và Grafana để giám sát hệ thống.
- **API Gateway / Load Balancer** – Nginx là cửa ngõ duy nhất, phân phối traffic tới các Web Replicas.

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
├─ .gitignore                             (Bỏ qua các tệp không cần thiết)
├─ docker-compose.yml                     (Nhạc trưởng điều phối 9 loại dịch vụ)
│
├─ api-gateway-proxy-server/              (Nginx - Reverse Proxy & Entry Point)
│  └─ nginx.conf                          (Cấu hình định tuyến và Docker DNS)
│
├─ application-backend-server/            (Flask - Logic nghiệp vụ & API)
│  ├─ app.py                              (Xử lý DB, Auth Keycloak, REST API)
│  ├─ students.json                       (Dữ liệu dự phòng/mock data)
│  └─ Dockerfile
│
├─ authentication-identity-server/        (Keycloak - IAM & SSO)
│  └─ .gitkeep                            (Sử dụng image: keycloak:latest)
│
├─ internal-dns-server/                   (BIND9 - Phân giải Domain nội bộ)
│  ├─ Dockerfile                          (Build từ image: ubuntu/bind9)
│  ├─ named.conf.options                  (Cấu hình forwarders & access)
│  ├─ named.conf.local                    (Khai báo zone cloud.local)
│  └─ zones/                  
│     └─ db.cloud.local                   (Bản ghi DNS cho *.cloud.local)
│
├─ monitoring-grafana-dashboard-server/   (Grafana - Trực quan hóa dữ liệu)
│  └─ .gitkeep                            (Sử dụng image: grafana/grafana)
│
├─ monitoring-prometheus-server/          (Prometheus - Thu thập Metrics)
│  └─ prometheus.yml                      (Cấu hình các jobs scrape data)
│
├─ object-storage-server/                 (MinIO - S3 Object Storage)
│  └─ data/                               (Dữ liệu lưu trữ các bucket)
│
├─ relational-database-server/            (MariaDB - Cơ sở dữ liệu quan hệ)
│  └─ init/                               (Khởi tạo dữ liệu tự động)
│     ├─ 001_init.sql                     (Schema minicloud)
│     └─ 002_init.sql                     (Schema studentdb)
│
└─ web-frontend-server/                   (Nginx - Giao diện người dùng)
   ├─ html/                               (Mã nguồn Website & System Panel)
   ├─ conf.default                        (Cấu hình Nginx với SSI enabled)
   ├─ metrics.txt                         (Endpoint metrics cho Prometheus)
   └─ Dockerfile
```

---

## 5. Hướng dẫn Triển khai

### 5.1. Yêu cầu hệ thống
- Đã cài đặt **Docker** & **Docker Compose**.
- Các Port sau cần được giải phóng: `80`, `8080`, `8081`, `3306`, `9000`, `9001`, `9090`, `9100`, `3000`, `1053`.

# Di chuyển vào thư mục dự án
cd tranhuunhanminiclouddemo

# Khởi động hệ thống với 3 replicas của web-frontend-server để test Load Balancing
docker compose up -d --scale web-frontend-server=3

# Kiểm tra trạng thái các container
docker compose ps
```

### 5.3. Kiểm tra phân tải (Load Balancing)
Vì hệ thống sử dụng **Real Load Balancing**, bạn có thể kiểm tra bằng cách truy cập `http://localhost` và Refresh trang. Container ID (Hostname) hiển thị ở phía trên Header sẽ thay đổi sau mỗi lần tải trang, chứng minh Docker đang điều phối traffic.

Bạn cũng có thể dùng `curl` để kiểm tra nhanh:
```bash
for i in {1..5}; do curl -s http://localhost | grep -o "Container: [a-f0-9]*"; done
```

---

## 6. Demo & Kiểm thử từng Server

### 6.1. Web Frontend & Real Load Balancing

**Mục tiêu:** Kiểm tra website tĩnh, giao diện quản lý System Panel và khả năng phân tải thực sự qua Docker replicas.

**Hoạt động chính:**
- **SSI Hostname Display:** Sử dụng Nginx Server Side Includes (SSI) để lấy biến `$hostname` của container và hiển thị trực tiếp lên header. Điều này giúp nhận diện container nào đang xử lý request.
- **Metrics Scraping:** Cung cấp endpoint `/metrics` để Prometheus thu thập dữ liệu về traffic, trạng thái server và tài nguyên.
- **System Panel Integration:** Tích hợp bảng điều khiển tại `/blog/system-panel.html` cho phép truy cập nhanh các dịch vụ (MinIO, Grafana...) và chạy các lệnh kiểm tra.

**Lệnh kiểm thử:**
- Truy cập qua API Gateway: [http://localhost](http://localhost)
- Kiểm tra Container ID thay đổi (Load Balancing):
```bash
# Chạy nhiều lần để thấy Hostname thay đổi
curl -s http://localhost | grep -o "Container: [a-f0-9]*"
```

### 6.2. Application Backend (Flask API)

**Mục tiêu:** Xử lý logic nghiệp vụ, kết nối cơ sở dữ liệu và quản lý quyền truy cập qua Keycloak.

**Hoạt động chính:**
- **RESTful API:** Cung cấp các endpoint JSON chuẩn cho frontend.
- **Database Connectivity:** Kết nối trực tiếp tới MariaDB (`relational-database-server`) để thực hiện các thao tác CRUD trên bảng sinh viên.
- **Identity Verification:** Sử dụng thư viện `python-jose` để giải mã và xác thực JWT Token được gửi từ Keycloak, đảm bảo các endpoint bảo mật chỉ được truy cập bởi người dùng hợp lệ.
- **Fallback Mechanism:** Nếu không kết nối được tới MariaDB, server tự động chuyển sang đọc dữ liệu từ `students.json` để đảm bảo tính sẵn sàng.

**Các Endpoint chính:**
- `GET /api/hello`: Kiểm tra trạng thái server.
- `GET /api/student`: Hiển thị trang danh sách sinh viên (HTML).
- `GET /api/student/json`: Lấy dữ liệu sinh viên từ file JSON.
- `GET /api/students-db`: Trang quản lý CRUD sinh viên (HTML + MariaDB).
- `GET /api/students-db/json`: Lấy dữ liệu sinh viên từ MariaDB.
- `GET /api/secure`: Endpoint yêu cầu Bearer Token (Keycloak).

**Lệnh kiểm thử:**
- Trả về JSON chào mừng: `curl http://localhost/api/hello`
- Lấy danh sách sinh viên (JSON): `curl http://localhost/api/student/json`
- Truy cập trang quản lý sinh viên: [http://localhost/api/students-db](http://localhost/api/students-db)

### 6.3. Relational Database (MariaDB)

**Mục tiêu:** Lưu trữ dữ liệu có cấu trúc và cung cấp khả năng tự động khởi tạo dữ liệu.

**Hoạt động chính:**
- **Schema Management:** Quản lý hai database độc lập: `minicloud` (ghi chú hệ thống) và `studentdb` (thông tin sinh viên).
- **Auto Bootstrapping:** Sử dụng thư mục `/docker-entrypoint-initdb.d` để tự động chạy các script SQL (`001_init.sql`, `002_init.sql`) khi khởi tạo container lần đầu.
- **Data Persistence:** Sử dụng Docker Volumes (`mariadb-data`) để đảm bảo dữ liệu không bị mất khi container bị xóa.

**Lệnh kiểm tra dữ liệu:**
```bash
# Xem dữ liệu schema minicloud
docker exec -it relational-database-server mariadb -u root -proot -D minicloud -e "SELECT * FROM notes;"

# Xem dữ liệu schema studentdb
docker exec -it relational-database-server mariadb -u root -proot -D studentdb -e "SELECT * FROM students;"
```

### 6.4. Authentication Identity (Keycloak)

**Mục tiêu:** Quản lý định danh tập trung (SSO) và bảo vệ Microservices bằng quy chuẩn OIDC/OAuth2.

**Hoạt động chính:**
- **Realm & Client Configuration:** Khai báo Realm `TranHuuNhan_52300235` và Client `flask-app`. Cấu hình hỗ trợ song song cả **Localhost** và **EC2 IP** (52.220.231.37).
- **Identity Provider:** Lưu trữ thông tin người dùng và cấp phát Access Token (JWT).
- **Frontend Integration:** Tích hợp `keycloak-auth.js` để xử lý luồng đăng nhập/đăng xuất OIDC.
- **Automatic Logout Redirect:** Đã cấu hình `post_logout_redirect_uri` chuẩn OIDC để tự động quay về trang chủ sau khi đăng xuất thành công.
- **Backend Protection:** Application Server xác thực tính hợp lệ của Token trước khi trả về dữ liệu bảo mật qua middleware xác thực JWT.

**Lệnh kiểm thử:**
- Truy cập Admin Console: [http://localhost:8081/admin/](http://localhost:8081/admin/) (admin/admin)
- Kiểm tra luồng đăng nhập: Sử dụng nút **"🔐 Đăng nhập"** trên trang chủ.

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
### 6.6. Internal DNS (BIND9)

**Mục tiêu:** Cung cấp dịch vụ phân giải tên miền nội bộ cho các Microservices.

**Hoạt động chính:**
- **Zone Management:** Quản lý zone `cloud.local`.
- **Hostname Mapping:** Ánh xạ các tên miền như `app-backend.cloud.local`, `minio.cloud.local` về đúng IP của container trong mạng `cloud-net`.
- **Service Discovery:** Cho phép các service giao tiếp với nhau qua DNS thay vì IP tĩnh.

**Lệnh kiểm tra:**
```bash
# Test phân giải tên miền web-frontend-server
docker run --rm --network cloud-net busybox nslookup web-frontend-server.cloud.local internal-dns-server
```

### 6.7. Monitoring Stack (Prometheus & Grafana)

**Mục tiêu:** Thu thập metrics và trực quan hóa trạng thái sức khỏe của toàn bộ hạ tầng Microservices.

**Hoạt động chính:**
- **Data Collection:** Prometheus tự động "scrape" dữ liệu từ `node-exporter` (cổng 9100) và `web-frontend-server` (cổng 80).
- **Visualization:** Grafana kết nối tới Prometheus làm Data Source để hiển thị các biểu đồ RAM, CPU, Network.
- **Alerting:** Có khả năng cấu hình cảnh báo khi tài nguyên vượt ngưỡng.

**Lệnh kiểm tra:**
- Prometheus Targets: [http://localhost:9090/targets](http://localhost:9090/targets) (Kiểm tra trạng thái job 'web' và 'node' có UP hay không).
- Grafana Dashboard: [http://localhost:3000](http://localhost:3000) (admin/admin).

---

## 7. Triển khai trên AWS EC2

### 7.1. Yêu cầu EC2 Instance
- **Instance Type:** Tối thiểu t3.medium (2 vCPU, 4GB RAM)
- **Storage:** 20GB gp3 SSD
- **Security Group:** Mở các port: 22, 80, 3000, 8080, 8081, 8085, 9000, 9001, 9090, 9100
- **OS:** Ubuntu 22.04 LTS

### 7.2. Cài đặt Docker trên EC2
```bash
# Cập nhật hệ thống
sudo apt update && sudo apt upgrade -y

# Cài đặt Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Thêm user vào group docker
sudo usermod -aG docker $USER

# Khởi động Docker
sudo systemctl enable docker
sudo systemctl start docker

# Kiểm tra Docker
docker --version
```

### 7.3. Clone và khởi động dự án trên EC2
```bash
# Clone repository
git clone <YOUR_REPO_URL>
cd MyMiniCloud/tranhuunhanminiclouddemo

# Khởi động hệ thống
docker compose up -d

# Kiểm tra trạng thái
docker compose ps
```

### 7.4. Truy cập từ bên ngoài
Thay thế `localhost` bằng Public IP của EC2 instance:
- Web Frontend: `http://YOUR_EC2_IP`
- MinIO Console: `http://YOUR_EC2_IP:9001`
- Grafana: `http://YOUR_EC2_IP:3000`
- Prometheus: `http://YOUR_EC2_IP:9090`
- Keycloak: `http://YOUR_EC2_IP:8081`

### 7.5. Lệnh kiểm tra trên EC2
```bash
# Kiểm tra Load Balancer trên EC2 (Container ID sẽ thay đổi)
for i in {1..5}; do curl -s http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4) | grep -o "Container: [a-f0-9]*"; done

# Kiểm tra API backend
curl http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)/api/hello

# Kiểm tra student endpoint (MariaDB/JSON fallback)
curl http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)/api/student/json
```

---

## 8. Kiểm tra thông mạng & Docker Hub

### 7.1. Thông mạng giữa các container

**Kiểm tra kết nối nội bộ giữa các container:**
```bash
# Tạo container tạm thời để test network
docker run -it --rm --network cloud-net alpine sh

# Trong shell của container, test ping các service:
ping -c 3 web-frontend-server
ping -c 3 relational-database-server
ping -c 3 authentication-identity-server
ping -c 3 object-storage-server
ping -c 3 monitoring-prometheus-server
ping -c 3 monitoring-grafana-dashboard-server
ping -c 3 internal-dns-server
ping -c 3 application-backend-server

# Thoát khỏi container
exit
```

**Kiểm tra DNS resolution:**
```bash
# Test DNS resolution qua internal DNS server
docker run --rm --network cloud-net busybox nslookup web-frontend-server.cloud.local internal-dns-server
docker run --rm --network cloud-net busybox nslookup app-backend.cloud.local internal-dns-server
```

**Kiểm tra port connectivity:**
```bash
# Test kết nối port từ bên ngoài
curl -I http://localhost:8080  # Web Frontend Server trực tiếp
curl -I http://localhost      # Qua API Gateway
curl -I http://localhost:9001 # MinIO Console
curl -I http://localhost:3000 # Grafana
curl -I http://localhost:9090 # Prometheus
```

### 8.2. Docker Images & Real Load Balancing Architecture

Hệ thống đã được refactoring từ "fake load balancing" sang **Real Load Balancing** với Docker replicas. Các image tùy chỉnh đã được tối ưu hóa:

**Docker Hub Profile:** [https://hub.docker.com/u/nhanhuutran007](https://hub.docker.com/u/nhanhuutran007)

**Images hiện tại:**
- `nhanhuutran007/myminicloud-web:latest` - Web Frontend Server (với SSI và System Panel)
- `nhanhuutran007/myminicloud-app:latest` - Application Backend API

**Kiến trúc Real Load Balancing:**
- Sử dụng Docker Compose scaling: `--scale web-frontend-server=3`
- Một image duy nhất được replicated thành nhiều containers
- Docker tự động phân phối traffic qua internal DNS
- Container ID hiển thị động qua Server Side Includes (SSI)

**System Panel tích hợp:**
- Truy cập nút "⚙️ System" trên header của website
- Giao diện quản lý tập trung cho tất cả services
- Các nút truy cập nhanh đến dashboards (Grafana, Prometheus, MinIO, Keycloak)
- Test endpoints API trực tiếp từ giao diện web
- Copy commands CLI để quản lý hệ thống

---

## 9. Tính năng mới - System Panel

### 9.1. Truy cập System Panel
- Mở [http://localhost](http://localhost) 
- Click nút **"⚙️ System"** ở header
- System Panel sẽ tự động phát hiện host (localhost hoặc EC2 IP)

### 9.2. Các tính năng chính
**UI Services:** Các nút để mở trực tiếp giao diện web
- MinIO Console (Object Storage)
- Grafana Dashboard (Monitoring)
- Prometheus (Metrics Backend)
- Keycloak (Authentication & SSO)

**API Testing:** Test endpoints trực tiếp từ giao diện
- Load Balancer Test
- API Hello Endpoint
- Student List Endpoint
- **Students Database CRUD** (Mới thêm)

**CLI Commands:** Copy lệnh để chạy trong terminal
- MariaDB database commands
- Docker Compose management
- Nginx proxy commands
- DNS server commands
- System monitoring commands

**Students Display:** Hiển thị danh sách sinh viên trực tiếp trên trang chủ
- **Tự động tải dữ liệu** từ MariaDB hoặc JSON file
- **Fallback mechanism** - Nếu MariaDB không khả dụng, tự động chuyển sang JSON file
- **Real-time data** - Hiển thị dữ liệu thời gian thực từ backend
- **Responsive design** - Giao diện thích ứng với mọi kích thước màn hình

**Keycloak Authentication Integration:** Tích hợp đăng nhập SSO với Keycloak
- **Single Sign-On (SSO)** - Đăng nhập một lần, truy cập tất cả services
- **User Profile Display** - Hiển thị thông tin user khi đã đăng nhập
- **Protected Content** - Nội dung chỉ hiển thị cho user đã xác thực
- **Secure API Testing** - Test API bảo mật với JWT token
- **Auto Token Refresh** - Tự động refresh token khi hết hạn
- **Seamless Integration** - Tích hợp mượt mà với Keycloak JavaScript Adapter

---

## 10. Bảo trì & Sao lưu (Maintenance)

Hệ thống cung cấp công cụ sao lưu dữ liệu toàn diện để phục vụ việc di chuyển (migration) hoặc dự phòng.

### 10.1. Sao lưu Docket Volumes
Sử dụng script PowerShell được cung cấp để đóng gói toàn bộ dữ liệu từ MariaDB, Keycloak, Grafana và Prometheus:

```powershell
# Chạy từ thư mục gốc dự án
powershell.exe -ExecutionPolicy Bypass -File .\BaoCao\volume-backup-restore.ps1 -Action backup
```
Các tệp `.tar.gz` sẽ được lưu tại thư mục `./backup-volumes`.

### 10.2. Khôi phục dữ liệu (Trên môi trường mới/EC2)
Sau khi copy thư mục dự án và các tệp backup lên EC2:

```powershell
# Khôi phục dữ liệu vào các volume tương ứng
powershell.exe -ExecutionPolicy Bypass -File .\BaoCao\volume-backup-restore.ps1 -Action restore
```

---

## 11. Liên hệ & Tài liệu tham khảo
- **Tài liệu hướng dẫn Keycloak:** [KEYCLOAK-LOGIN-GUIDE.md](/BaoCao/KEYCLOAK-LOGIN-GUIDE.md)
- **Báo cáo hệ thống:** [system-test-report.md](/BaoCao/system-test-report.md)


