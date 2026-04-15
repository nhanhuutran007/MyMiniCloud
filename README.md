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

## 5. Hướng dẫn Triển khai (Localhost)

### 5.1. Yêu cầu hệ thống
- Đã cài đặt **Docker** & **Docker Compose**.
- Các Port sau cần được giải phóng: `80`, `8080`, `8081`, `3306`, `9000`, `9001`, `9090`, `9100`, `3000`, `1053`.

### 5.2. Khởi động
```bash
# Di chuyển vào thư mục dự án
cd tranhuunhanminiclouddemo

# Khởi động hệ thống với 3 replicas của web-frontend-server để test Load Balancing
docker compose up -d --scale web-frontend-server=3

# Kiểm tra trạng thái các container
docker compose ps
```

### 5.3. [DÀNH CHO EC2] Lệnh khởi động nhanh (3-trong-1)
Nếu bạn triển khai trên EC2, hãy dùng lệnh gộp này để tự động Khởi động, Phân tải và Sửa lỗi Keycloak cùng lúc:
```bash
# Di chuyển vào thư mục dự án và chạy lệnh gộp
cd ~/MyMiniCloud/tranhuunhanminiclouddemo && \
sudo docker-compose up -d --scale web-frontend-server=3 && \
sleep 30 && \
sudo docker exec authentication-identity-server /opt/keycloak/bin/kcadm.sh config credentials --server http://localhost:8080 --realm master --user admin --password admin && \
sudo docker exec authentication-identity-server /opt/keycloak/bin/kcadm.sh update realms/master -s sslRequired=none && \
sudo docker exec authentication-identity-server /opt/keycloak/bin/kcadm.sh update realms/TranHuuNhan_52300235 -s sslRequired=none
```

### 5.3. Kiểm tra phân tải (Load Balancing)
Vì hệ thống sử dụng **Real Load Balancing**, bạn có thể kiểm tra bằng cách truy cập `http://localhost` và Refresh trang. Container ID (Hostname) hiển thị ở phía trên Header sẽ thay đổi sau mỗi lần tải trang.

Bạn cũng có thể dùng `curl` để kiểm tra nhanh:
```bash
for i in {1..5}; do curl -s http://localhost | grep -o "Container: [a-f0-9]*"; done
```

---

## 6. Demo & Kiểm thử từng Server

### 6.1. Web Frontend & Real Load Balancing
- **SSI Hostname Display:** Header lấy biến `$hostname` hiển thị động.
- **System Panel:** Tích hợp tại `/blog/system-panel.html`.

### 6.2. Application Backend (Flask API)
- `GET /api/hello`: Kiểm tra trạng thái.
- `GET /api/student`: Trang danh sách sinh viên.
- `GET /api/students-db`: Quản lý sinh viên (MariaDB).

### 6.3. Relational Database (MariaDB)
```bash
# Xem dữ liệu minicloud
docker exec -it relational-database-server mariadb -u root -proot -D minicloud -e "SELECT * FROM notes;"
```

### 6.4. Authentication Identity (Keycloak)
- Admin Console: [http://localhost:8081/admin/](http://localhost:8081/admin/) (admin/admin).

### 6.5. Object Storage (MinIO)
- Console: [http://localhost:9001](http://localhost:9001) (minioadmin / minioadmin).

---

## 7. Triển khai trên AWS EC2

### 7.1. Cài đặt môi trường
- Chạy script cài đặt Docker trên Ubuntu 22.04 LTS.
- Mở cổng Security Group: 80, 8081, 3000, 9001, 9090.

### 7.2. Truy cập nhanh từ bên ngoài (IP: 52.220.231.37)
- **Website chính:** [http://52.220.231.37](http://52.220.231.37)
- **Manager Panel:** [http://52.220.231.37/blog/system-panel.html](http://52.220.231.37/blog/system-panel.html)
- **Grafana:** [http://52.220.231.37:3000](http://52.220.231.37:3000)
- **Keycloak Admin:** [http://52.220.231.37:8081/admin/](http://52.220.231.37:8081/admin/)

---

## 8. Troubleshooting (Xử lý sự cố EC2)

### 8.1. API 404 / Load Balancing không xoay
- Khởi động lại Gateway: `sudo docker-compose restart api-gateway-proxy-server`.

### 8.2. Keycloak "HTTPS Required"
```bash
sudo docker exec authentication-identity-server /opt/keycloak/bin/kcadm.sh config credentials --server http://localhost:8080 --realm master --user admin --password admin
sudo docker exec authentication-identity-server /opt/keycloak/bin/kcadm.sh update realms/master -s sslRequired=none
sudo docker exec authentication-identity-server /opt/keycloak/bin/kcadm.sh update realms/TranHuuNhan_52300235 -s sslRequired=none
```

### 8.3. Grafana "Internal Server Error"
```bash
sudo docker run --rm -v grafana-data:/volume alpine chown -R 472:0 /volume
sudo docker-compose restart monitoring-grafana-dashboard-server
```

---

## 9. Kiểm tra mạng nội bộ

### 9.1. Thông mạng Docker
```bash
docker run -it --rm --network cloud-net alpine ping -c 3 application-backend-server
```

### 9.2. DNS Resolution
```bash
docker run --rm --network cloud-net busybox nslookup web-frontend-server.cloud.local internal-dns-server
```

---

## 10. Tính năng mới - System Panel
- **UI Services:** Truy cập nhanh dashboard.
- **CLI Commands:** Copy lệnh copy-paste.
- **OIDC SSO:** Đăng nhập tập trung với Keycloak.

---

## 11. Bảo trì & Sao lưu (Maintenance)

### 11.1. Backup Volumes
```powershell
powershell.exe -ExecutionPolicy Bypass -File .\BaoCao\volume-backup-restore.ps1 -Action backup
```

### 11.2. Restore Volumes
```powershell
powershell.exe -ExecutionPolicy Bypass -File .\BaoCao\volume-backup-restore.ps1 -Action restore
```

---

## 12. Liên hệ & Tài liệu tham khảo
- **Keycloak Guide:** [KEYCLOAK-LOGIN-GUIDE.md](/BaoCao/KEYCLOAK-LOGIN-GUIDE.md)
- **Report:** [system-test-report.md](/BaoCao/system-test-report.md)
