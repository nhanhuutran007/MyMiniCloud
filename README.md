# MyMiniCloud - Mini Cloud Project

## 1. Mục tiêu & Chức năng chính

**MyMiniCloud** là một hệ thống kiến trúc Microservices mô phỏng một môi trường Cloud thu nhỏ, được triển khai và tự động hóa thông qua Docker Compose. Dự án này xây dựng một “mini cloud platform” gồm các thành phần mục tiêu chính:

- **Web Frontend Server** – Nginx static site (trang Home + Blog cá nhân).
- **Application Backend Server** – Flask API xử lý các endpoint (`/hello`, `/secure`, `/student`).
- **Relational Database Server** – MariaDB lưu trữ dữ liệu có cấu trúc (`minicloud` & `studentdb`).
- **Authentication & Identity Server** – Keycloak quản lý định danh (OIDC, realm riêng, client `flask-app`).
- **Object Storage Server** – MinIO lưu trữ đối tượng (bucket `profile-pics`, `documents`).
- **Internal DNS Server** – BIND9 quản lý tên miền nội bộ (zone `cloud.local`).
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
├─ .gitignore                          (Bỏ qua các file không cần thiết trên Git)
├─ docker-compose.yml                  (File thiết kế Orchestrator khởi chạy toàn cụm node)
├─ test-load-balancer.ps1              (Script test Real Load Balancing)
│
├─ api-gateway-proxy-server/           (Nginx cấu hình Load Balancing & API Gateway)
│  └─ nginx.conf                       (Điều phối route và Docker DNS resolution)
│
├─ application-backend-server/         (Ứng dụng Flask đảm nhận RESTful APIs)
│  ├─ app.py                           (Mã nguồn chính xử lý kết nối Database & Auth Keycloak)
│  ├─ students.json                    (Tài nguyên mock data ban đầu)
│  └─ Dockerfile
│
├─ authentication-identity-server/     (Máy chủ cấp phát và định danh OAuth2/OIDC)
│  └─ .gitkeep                         (Sử dụng base image quay.io/keycloak/keycloak)
│
├─ internal-dns-server/                (BIND9 Server phân giải tên miền nội bộ)
│  ├─ Dockerfile                       (Build image từ ubuntu/bind9:latest)
│  ├─ named.conf.options               (Cấu hình chung: forwarders, allow-query)
│  ├─ named.conf.local                 (Khai báo zone cloud.local)
│  └─ zones/                  
│     └─ db.cloud.local                (File ánh xạ các Domain ảo thành IP thực tế của cụm)
│
├─ monitoring-grafana-dashboard-server/ (Giao diện hiển thị biểu đồ đo lường)
│  └─ .gitkeep                         (Sử dụng image grafana/grafana)
│
├─ monitoring-prometheus-server/       (Kho cào/thu thập dữ liệu Metrics)
│  └─ prometheus.yml                   (Lịch trình và mục tiêu thu thập node / web)
│
├─ object-storage-server/              (MinIO - Kho lưu trữ Objects Data độc lập)
│  └─ data/                            (Thư mục Map Volumes ảo chứa bucket: profile-pics...)
│
├─ relational-database-server/         (Ổ lưu trữ dữ liệu cấu trúc MariaDB)
│  └─ init/                            (Tự động seed dữ liệu lúc bootup)
│     ├─ 001_init.sql                  (Cấu hình Scheme Myminicloud)
│     └─ 002_init.sql                  (Cấu hình Scheme Studentdb)
│
└─ web-frontend-server/                (Web Frontend với Real Load Balancing)
   ├─ html/                            (Website tĩnh với System Panel tích hợp)
   ├─ conf.default                     (Nginx config với SSI enabled)
   ├─ metrics.txt                      (Metrics endpoint cho Prometheus)
   └─ Dockerfile
```

---

## 5. Hướng dẫn Triển khai

### 5.1. Yêu cầu hệ thống
- Đã cài đặt **Docker** & **Docker Compose**.
- Các Port sau cần được giải phóng: `80`, `8080`, `8081`, `3306`, `9000`, `9001`, `9090`, `9100`, `3000`, `1053`.

### 5.2. Khởi động hệ thống với Real Load Balancing
Từ thư mục gốc của dự án, thực hiện các lệnh sau:

```bash
# Di chuyển vào thư mục dự án
cd tranhuunhanminiclouddemo

# Khởi động hệ thống với 3 replicas của web-frontend-server
docker compose up -d --scale web-frontend-server=3

# Kiểm tra trạng thái các container
docker compose ps

# Test Real Load Balancing
./test-load-balancer.ps1
```

### 5.3. Kiểm tra Real Load Balancing

Dự án đã bao gồm script tự động test Real Load Balancing:

**Trên Windows:**
```powershell
./test-load-balancer.ps1
```

Script sẽ tự động:
- Gửi 10 requests tới hệ thống
- Hiển thị Container ID của từng request
- Thống kê số lượng requests được xử lý bởi mỗi container
- Xác nhận Real Load Balancing đang hoạt động

---

## 6. Demo & Kiểm thử từng Server

### 6.1. Web Frontend & Real Load Balancing

**Mục tiêu:** Kiểm tra web tĩnh và khả năng phân tải thực sự qua Docker replicas với Nginx Load Balancer.

**Cách thực hiện:** Truy cập web qua API Gateway và quan sát Container ID thay đổi động.

**Lệnh kiểm tra Real Load Balancing:**
- Truy cập qua API Gateway: [http://localhost](http://localhost)
- Quan sát Container ID hiển thị động trên trang web
- Sử dụng script test tự động: `./test-load-balancer.ps1`

**Lệnh kiểm tra bằng curl:**
```bash
# Kiểm tra Container ID thay đổi - chạy nhiều lần
curl -s http://localhost | grep -o "Container: [a-f0-9]*"
curl -s http://localhost | grep -o "Container: [a-f0-9]*"
curl -s http://localhost | grep -o "Container: [a-f0-9]*"
```

**Kết quả dự kiến:** 
- Container ID sẽ thay đổi giữa các request, chứng minh Docker đang phân phối traffic giữa các replicas khác nhau
- Mỗi container hiển thị ID thực của mình thông qua Server Side Includes (SSI)
- Script test sẽ hiển thị thống kê phân phối requests giữa các containers

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
docker exec -it relational-database-server mariadb -u root -proot -D minicloud -e "SHOW TABLES; SELECT * FROM notes;"
```

**Lệnh kiểm tra yêu cầu mở rộng:**
- Xác nhận bảng thực thể dữ liệu mới cho luồng Database riêng biệt `studentdb`:
```bash
docker exec -it relational-database-server mariadb -u root -proot -D studentdb -e "SELECT * FROM students;"
```

**Lệnh kiểm tra kết nối từ bên ngoài (alternative):**
```bash
# Sử dụng mysql client từ container tạm thời
docker run -it --rm --network cloud-net mysql:8 mysql -h relational-database-server -uroot -proot -D studentdb -e "SELECT COUNT(*) as total_students FROM students;"
```

**Kết quả dự kiến:** Hệ thống tự động phản hồi lại bảng chứa cấu hình dữ liệu được seed thành công bằng script SQL của hệ.

### 6.4. Authentication Identity (Keycloak)

**Mục tiêu:** Kiểm tra OIDC (OpenID Connect) và bảo mật Identity API theo quy chuẩn bảo vệ microservice.

**Cách thực hiện:** Thực thi tuần tự quy trình xin thông tin gói xác thực sau đó lấy Bearer Token chèn vào Header cho lệnh triệu gọi.

**Lệnh kiểm tra yêu cầu cơ bản:**

*Bước 1: Truy cập Keycloak Admin Console*
- URL: [http://localhost:8081/admin/master/console/](http://localhost:8081/admin/master/console/)
- Username: `admin` / Password: `admin`

*Bước 2: Xin Token qua xác thực user (cần setup user trước)*
```bash
# Lấy token từ Keycloak (thay thế username/password thực tế)
TOKEN=$(curl -s -X POST "http://localhost:8081/realms/TranHuuNhan_52300235/protocol/openid-connect/token" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "username=sv01" \
     -d "password=123" \
     -d "grant_type=password" \
     -d "client_id=flask-app" | jq -r '.access_token')

# Kiểm tra token có được tạo không
echo "Token: $TOKEN"
```

*Bước 3: Test API bảo mật qua Gateway*
```bash
# Sử dụng token để truy cập API bảo mật
curl -H "Authorization: Bearer $TOKEN" http://localhost/api/secure
```

**Lệnh kiểm tra yêu cầu mở rộng:**
*Test trực tiếp backend (port 8085):*
```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:8085/secure
```

**Lệnh kiểm tra không có token (sẽ trả về 401):**
```bash
curl -v http://localhost/api/secure
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
### 6.6. Internal DNS (BIND9)

**Mục tiêu:** Thay vì giao tiếp bằng địa chỉ IP thô cứng, hệ thống Microservices sẽ phân giải tên miền định nghĩa linh hoạt theo pattern `*.cloud.local`.

**Cách thực hiện:** Kích hoạt một shell Alpine/Busybox chung cụm mạng ảo và dùng `nslookup` tra tên trên máy chủ BIND9.

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

2. Bổ sung bản ghi thực tế theo dự án thiết kế:
- Cập nhật trực tiếp: Mở Zone tại `tranhuunhanminiclouddemo/internal-dns-server/zones/db.cloud.local`.
- Ghi mới địa chỉ: `new-service IN A 10.10.10.50`
- Áp dụng thay đổi: `docker restart internal-dns-server`.

**Kết quả dự kiến:** Domain truy xuất chuyển giao được thành đúng IP nội mạng `cloud-net`, khi gõ lệnh nslookup hệ thống hiển thị chính xác tên miền tương quan (vd tên miền gốc, root ip...).

### 6.7. Monitoring (Prometheus)

**Mục tiêu:** Thu thập metrics và trạng thái tài nguyên cho toàn bộ Microservices Nodes.

**Cách thực hiện:**

**Bước 1: Chỉnh sửa file cấu hình prometheus.yml**
Trong dự án của bạn, hãy tìm đến thư mục `monitoring-prometheus-server` và mở file `prometheus.yml` lên.
Mặc định ở phần cơ bản, file này đang có cấu hình scrape cho `node` (Node Exporter). Bạn cần bổ sung thêm cục cấu hình cho `web` vào dưới cùng.
> ⚠️ **LƯU Ý CỰC KỲ QUAN TRỌNG:** Trong file `.yml` (YAML), khoảng trắng (căn lề) là sự sống còn. Thụt lề sai 1 dấu cách là file sẽ bị lỗi.

Để an toàn tuyệt đối, bạn hãy xóa hết nội dung cũ và copy/paste toàn bộ đoạn code chuẩn dưới đây đè vào file `prometheus.yml` của bạn:

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'node'
    static_configs:
      - targets: ['monitoring-node-exporter-server:9100']

  - job_name: 'web'
    static_configs:
      - targets: ['web-frontend-server:80']
```
*(Sau khi paste xong, nhớ lưu file lại).*

**Bước 2: Khởi động lại (Restart) container Prometheus**
Vì bạn vừa thay đổi file cấu hình gốc, Prometheus đang chạy ngầm sẽ không tự đọc được nội dung mới. Bạn cần ra lệnh khởi động lại nó.
Mở Terminal và chạy lệnh sau:
```bash
docker restart monitoring-prometheus-server
```
*(Nếu nó in ra lại dòng chữ `monitoring-prometheus-server` là đã restart thành công).*

**Bước 3: Kiểm tra thành quả**
Mở trình duyệt web của bạn lên, truy cập vào đường dẫn:
👉 [http://localhost:9090/targets](http://localhost:9090/targets)

Lúc này, trên màn hình của bạn sẽ hiện ra 2 danh sách (Jobs) thay vì 1 cái như trước:
- Một cái là `node` (cái cũ, cổng 9100).
- Một cái mới mang tên `web` (trỏ vào `http://web-frontend-server:80/metrics`).

Hãy nhìn vào cột **State** (Trạng thái). Nếu mục `web` hiện chữ **UP** màu xanh lá cây, thì xin chúc mừng, bạn đã cấu hình thành công!

**Kết quả dự kiến:**
- Prometheus cho cờ hiệu UP xanh đối với toàn bộ các target được cấu hình (`node` và `web`).

### 6.8. Monitoring (Grafana Dashboard)

**Mục tiêu:** Trực quan hóa dữ liệu bằng các biểu đồ phân tích thời gian thực từ metrics của Prometheus.

**Cách thực hiện:** Khai báo Data Source trên Grafana trỏ về Prometheus và tạo Dashboard.

**Kiểm tra và thực hiện:**
- Truy cập Grafana: Vào thẳng [http://localhost:3000](http://localhost:3000) (Đăng nhập với User `admin` / Password `admin`).
- Tạo Data Source: Móc nối đường truyền nội mạng tới Prometheus qua URL `http://monitoring-prometheus-server:9090`.
- Thiết lập Dashboard: Tự do vẽ thông số hoặc import các dashboard có sẵn (ví dụ báo cáo Node Exporter).

**Kết quả dự kiến:**
- Grafana kết nối luồng dữ liệu trơn tru từ Prometheus.
- Hiển thị biểu đồ phân tích chuẩn xác cho hệ mét máy chủ (RAM, Disk, Network) và các dịch vụ khác.

### 6.9. Real Load Balancing với Docker Replicas

**Mục tiêu:** Chứng minh Real Load Balancing hoạt động với Docker replicas thay vì fake load balancing.

**Cách thực hiện:** Sử dụng Docker Compose scaling để tạo nhiều replicas từ cùng một image.

**Bước 1: Khởi động hệ thống với multiple replicas**
```bash
# Khởi động với 3 replicas của web-frontend-server
docker compose up -d --scale web-frontend-server=3

# Kiểm tra các replicas đã được tạo
docker compose ps | grep web-frontend-server
```

**Bước 2: Test Real Load Balancing**
```bash
# Sử dụng script test tự động
./test-load-balancer.ps1

# Hoặc test thủ công bằng curl
for i in {1..5}; do curl -s http://localhost | grep -o "Container: [a-f0-9]*"; done
```

**Bước 3: Quan sát Container ID thay đổi**
- Truy cập [http://localhost](http://localhost) trên trình duyệt
- Refresh trang nhiều lần (F5)
- Quan sát Container ID hiển thị ở giữa header thay đổi liên tục

**Kết quả dự kiến:**
- Script test hiển thị 3 Container IDs khác nhau xử lý requests
- Mỗi container hiển thị ID thực thông qua Server Side Includes (SSI)
- Requests được phân phối đều giữa các replicas (Round Robin)
- Chứng minh Docker đang thực hiện Real Load Balancing thay vì fake

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
# Kiểm tra Load Balancer trên EC2
curl -s http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4) | grep -o "Server [12]"

# Kiểm tra API backend
curl http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)/api/hello

# Kiểm tra student endpoint
curl http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)/student/
```

---

## 8. Kiểm tra thông mạng & Docker Hub

### 7.1. Thông mạng giữa các container

**Kiểm tra kết nối nội bộ giữa các container:**
```bash
# Tạo container tạm thời để test network
docker run -it --rm --network cloud-net alpine sh

# Trong shell của container, test ping các service:
ping -c 3 web-frontend-server-1
ping -c 3 web-frontend-server-2
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
docker run --rm --network cloud-net busybox nslookup web-frontend-server-1.cloud.local internal-dns-server
docker run --rm --network cloud-net busybox nslookup web-frontend-server-2.cloud.local internal-dns-server
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


