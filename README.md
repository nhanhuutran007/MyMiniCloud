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
│
├─ api-gateway-proxy-server/           (Nginx cấu hình tĩnh Load Balancing & API Gateway)
│  ├─ nginx.conf                       (Điều phối route và Round Robin)
│  └─ Dockerfile              
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
├─ web-frontend-server/                (Bản web tĩnh cơ sở mẫu thiết kế UI/UX)
│  ├─ html/                            (Thư mục chứa mã nguồn website tĩnh: Trang chủ, Blog)
│  ├─ conf.default                     (Nginx Server block config)
│  ├─ metrics.txt                      (Trang lộ trình Metrics mẫu để Prometheus theo dõi)
│  └─ Dockerfile
│
├─ web-frontend-server-1/              (Bản sao Frontend làm Node 1 cân bằng tải)
│  ├─ html/                            (Đã biến thể thành giao diện SERVER 1)
│  └─ Dockerfile
│
└─ web-frontend-server-2/              (Bản sao Frontend làm Node 2 cân bằng tải)
   ├─ html/                            (Đã biến thể thành giao diện SERVER 2)
   └─ Dockerfile
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

### 6.9. API Gateway Proxy Server & Load Balancer Test

**Mục tiêu:** Chứng minh API Gateway hoạt động ổn định và thuật toán phân tải Round Robin của Nginx điều hướng request luân phiên giữa các node.

**Cách thực hiện:**

**Bước 1: Nhân bản Web Server để dễ nhận biết**
Vào thư mục dự án, nhân bản thư mục `web-frontend-server` làm 2 thư mục mới:
- `web-frontend-server1`
- `web-frontend-server2`

Mở file `web-frontend-server1/html/index.html` và sửa thẻ title/tiêu đề thành: `<h1>MyMiniCloud – Home (SERVER 1)</h1>`
Mở file `web-frontend-server2/html/index.html` và sửa thẻ title/tiêu đề thành: `<h1>MyMiniCloud – Home (SERVER 2)</h1>`

**Bước 2: Cập nhật file docker-compose.yml**
Mở file `docker-compose.yml`, xóa khối cấu hình `web-frontend-server` cũ và thêm 2 khối mới vào vị trí đó:
```yaml
  web-frontend-server1:
    build: ./web-frontend-server1
    container_name: web-frontend-server1
    networks: [cloud-net]

  web-frontend-server2:
    build: ./web-frontend-server2
    container_name: web-frontend-server2
    networks: [cloud-net]
```
Tiếp tục tìm phần `api-gateway-proxy-server`. Cập nhật mục `depends_on`:
```yaml
  api-gateway-proxy-server:
    image: nginx:stable
    container_name: api-gateway-proxy-server
    depends_on:
      - web-frontend-server1
      - web-frontend-server2
      - application-backend-server
      - authentication-identity-server
    ports: [ "80:80" ]
    volumes:
      - ./api-gateway-proxy-server/nginx.conf:/etc/nginx/nginx.conf:ro
    networks: [cloud-net]
    restart: unless-stopped
```

**Bước 3: Cấu hình Load Balancer (Round Robin) & Route /student**
Mở file `api-gateway-proxy-server/nginx.conf`. Xóa toàn bộ nội dung cũ và chép đoạn cấu hình dưới đây vào:
```nginx
events {}
http {
    upstream web_cluster {
        server web-frontend-server1:80;
        server web-frontend-server2:80;
    }

    server {
        listen 80;

        location / {
            proxy_pass http://web_cluster;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /student/ {
            proxy_pass http://application-backend-server:8081/student;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        location /api/ {
            proxy_pass http://application-backend-server:8081/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        location /auth/ {
            proxy_pass http://authentication-identity-server:8080/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
}
```

**Bước 4: Khởi động lại hệ thống**
Mở Terminal, chạy 2 lệnh sau để Docker cập nhật kiến trúc:
```bash
docker compose down
docker compose up -d --build
```

**Kiểm tra và thực hiện:**

**1. Kiểm thử Route /student/:**
Mở Terminal, chạy lệnh:
```bash
curl http://localhost/student/
```

**2. Kiểm thử Cân Bằng Tải (Load Balancing):**
Mở trình duyệt Web, truy cập URL: `http://localhost/`

- Lần 1: Giao diện sẽ hiện chữ **MyMiniCloud – Home (SERVER 1)**.
- Tải lại trang (F5): Giao diện đổi thành **MyMiniCloud – Home (SERVER 2)**.
- Tải lại trang lần nữa (F5): Giao diện quay về **SERVER 1**.
(Trang web sẽ tự động luân phiên đổi qua đổi lại giữa 2 server).

**Kết quả dự kiến:**
- Lệnh curl trả về danh sách sinh viên định dạng JSON.
- Giao diện người dùng trên web luân chuyển tự động, chứng minh Load Balancer hoạt động thành công.

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
Các image tùy chỉnh của hệ thống (bao gồm Web Server và Application Backend) đã được triển khai và đẩy trực tiếp lên kho chứa Docker Hub để sẵn sàng pull về trên môi trường Cloud thực tế (như AWS EC2):

- **Docker Hub Profile:** [https://hub.docker.com/u/nhanhuutran007](https://hub.docker.com/u/nhanhuutran007)
- **Các Repository chính:**
  - `nhanhuutran007/myminicloud-web:latest`
  - `nhanhuutran007/myminicloud-web1:latest`
  - `nhanhuutran007/myminicloud-web2:latest`
  - `nhanhuutran007/myminicloud-app:latest`

