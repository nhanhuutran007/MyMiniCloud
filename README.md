# MyMiniCloud - Mini Cloud Project

## 1. Mô tả dự án & Mục tiêu

**MyMiniCloud** là một hệ thống kiến trúc Microservices mô phỏng một môi trường Cloud thu nhỏ, được triển khai và tự động hóa thông qua Docker Compose. Dự án này bao gồm đa dạng các dịch vụ được container hóa nhằm cung cấp giải pháp toàn diện từ phục vụ web tĩnh, xử lý API, quản lý định danh người dùng, lưu trữ dữ liệu có cấu trúc và phi cấu trúc, đến việc giám sát hệ thống (Monitoring) và định tuyến nội bộ (DNS).

Ngoài việc là một nền tảng Cloud thu nhỏ, dự án đồng thời đóng vai trò làm không gian blog cá nhân để chia sẻ kiến thức về lập trình, học tập, Docker và Web Dev của nhóm sinh viên đam mê công nghệ.

Dự án này xây dựng một “mini cloud platform” gồm các thành phần mục tiêu chính:
- **Web Frontend Server** – Nginx static site (trang Home + Blog).
- **Application Backend Server** – Flask API (`/hello`, `/secure`, `/student`).
- **Relational Database Server** – MariaDB với DB `minicloud` & `studentdb`.
- **Authentication & Identity Server** – Keycloak (OIDC, realm riêng, client `flask-app`).
- **Object Storage Server** – MinIO (bucket `profile-pics`, `documents`).
- **Internal DNS Server** – CoreDNS (zone `cloud.local`).
- **Monitoring Node Exporter** – thu thập metric.
- **Monitoring Prometheus Server** – scrape metric từ Node Exporter & Web.
- **Monitoring Grafana Dashboard Server** – vẽ dashboard.
- **API Gateway / Reverse Proxy / Load Balancer** – Nginx: vào 1 cổng duy nhất, routing & cân bằng tải.

Toàn bộ chạy trên 1 mạng Docker duy nhất `cloud-net` thông qua `docker-compose.yml`.

---

## 2. Thành viên thực hiện

Dự án được triển khai:
- **Trần Hữu Nhân** (52300235) - Leader
- **Nguyễn Yến Phụng** (52300242) - Member
- **Đỗ Văn Trọng** (52300265) - Member

---

## 3. Cấu trúc thư mục dự án

```text
tranhuunhanminiclouddemo/
├─ docker-compose.yml
├─ web-frontend-server/
│  ├─ html/
│  │  ├─ index.html
│  │  └─ blog/
│  │     ├─ index.html
│  │     ├─ blog1.html, blog2.html, blog3.html
│  └─ Dockerfile
├─ web-frontend-server-1/
│  ├─ html/
│  │  └─ index.html
│  ├─ conf.default
│  └─ Dockerfile
├─ web-frontend-server-2/
│  ├─ html/
│  │  └─ index.html
│  ├─ conf.default
│  └─ Dockerfile
├─ application-backend-server/
│  ├─ app.py
│  ├─ students.json
│  └─ Dockerfile
├─ relational-database-server/
│  └─ init/
│     ├─ 001_init.sql         (DB minicloud + bảng notes)
│     └─ 002_init.sql         (DB studentdb + bảng students)
├─ authentication-identity-server/
├─ object-storage-server/
│  └─ data/                   (volume MinIO)
├─ internal-dns-server/
│  ├─ Corefile
│  └─ zones/
│     └─ db.cloud.local
├─ monitoring-prometheus-server/
│  └─ prometheus.yml
├─ monitoring-grafana-dashboard-server/
├─ api-gateway-proxy-server/
│  └─ nginx.conf
```

---

## 4. Kiến trúc tổng quan

### 4.1. Network & Container
- Mạng Docker: `cloud-net` (bridge).
- Mỗi server là 1 container độc lập, có `container_name` rõ ràng:
  - `web-frontend-server`, `web-frontend-server-1`, `web-frontend-server-2`
  - `application-backend-server`
  - `relational-database-server`
  - `authentication-identity-server`
  - `object-storage-server`
  - `internal-dns-server`
  - `monitoring-node-exporter-server`
  - `monitoring-prometheus-server`
  - `monitoring-grafana-dashboard-server`
  - `api-gateway-proxy-server`

Tất cả container kết nối vào `cloud-net` để mô phỏng hạ tầng của 1 Cloud Platform (tương tự AWS/Azure/GCP).

### 4.2. Port mapping (host → container)
- Web Frontend: `8080:80`
- App Backend: `8085:8081`
- MariaDB: `3306:3306`
- Keycloak: `8081:8080`
- MinIO: `9000:9000` (S3 API), `9001:9001` (console)
- DNS (CoreDNS): `1053:53/udp`
- Node Exporter: `9100:9100`
- Prometheus: `9090:9090`
- Grafana: `3000:3000`
- API Gateway: `80:80`

---

## 5. Sơ đồ Cấu trúc & Kiến trúc Tổng thể

![Sơ đồ Network](/BaoCao/sodo_network.png)

![Kiến trúc Tổng thể](/BaoCao/kientruc_tongthe.png)

Hệ thống được thiết kế chạy trên một mạng Docker ảo (`cloud-net`), định hướng theo mô hình Microservices với các thành phần chính như sau:
- **API Gateway (Nginx)**: Điểm chạm duy nhất của hệ thống, tiếp nhận mọi request ở port `80`, định tuyến đến các luồng dịch vụ phía sau một cách linh hoạt (như tải web, gọi API backend `/api`, `/student` hay xác thực `/auth`), đồng thời hỗ trợ cân bằng tải.
- **Frontend & Backend**: Tách biệt rõ ràng. Web tĩnh phục vụ giao diện (được triển khai trên 2 Server độc lập để đảm bảo High Availability theo thuật toán Round-Robin), trong khi đó API nội bộ xử lý logic được viết rành mạch bằng Flask.
- **Database & Storage**: Tách biệt lưu trữ dữ liệu có cấu trúc (MariaDB với các script init database tự động) và lưu trữ dữ liệu phi cấu trúc như hình ảnh profile, tài liệu môn học (MinIO Object Storage tương thích S3).
- **Bảo mật & Phân giải DNS**: Quản lý truy cập Single Sign-On (SSO) và bảo mật API qua token OIDC/JWT với Keycloak; đồng bộ quản lý tên miền nội bộ của các nhóm container (như `app-backend.cloud.local`) bằng hệ thống CoreDNS.
- **Giám sát (Monitoring)**: Toàn bộ tiến trình Node và Web server được Node Exporter rà quét liên tục, đẩy số liệu về Prometheus, cho phép nhà quản trị quan sát trực quan sự biến động CPU, Memory trên Grafana Dashboard.

---

## 6. Hướng dẫn Triển khai & Sử dụng

### 6.1. Yêu cầu hệ thống
- Yêu cầu môi trường máy chủ đã cài đặt **Docker** và **Docker Compose**.
- Đảm bảo các TCP/UDP Port sau đang không bị chiếm dụng trên máy chủ: `80`, `8080`, `8081`, `3306`, `9000`, `9001`, `9090`, `9100`, `3000`, `1053`.

### 6.2. Cách triển khai hệ thống
Mở Terminal/Powershell, đi đến thư mục mã nguồn dự án:

**Khởi chạy toàn bộ hệ thống**
Hệ thống sẽ kéo các base image, tự động phân giải cấu hình build image và khởi tạo mạng nội bộ hoạt động theo chế độ background:
```bash
docker-compose build --no-cache
docker-compose up -d
```

Để kiểm tra danh sách và trạng thái các service đang chạy, dùng lệnh:
```bash
docker-compose ps
```

**Tắt và dọn dẹp hệ thống**
Để dừng và xóa bỏ cấu trúc container/network:
```bash
docker-compose down
```
*(Lưu ý: Nếu bạn muốn reset toàn bộ cả cơ sở dữ liệu `[database]` và lưu trữ `[object-storage]` đang mount vào trong các ổ cứng Volumes cục bộ, hãy thêm cờ `-v` vào câu lệnh trên).*

### 6.3. Demo và Kiểm thử
Sau khi hệ thống khởi tạo thành công ở lệnh `docker-compose up -d`, bạn có thể thực hiện kiểm thử theo thông tin sau:

- **Web Frontend (Home & Blog)**: 
  - Truy cập để đọc Blog thông qua API Gateway Server ở Cổng mạng chuẩn (`80`): `http://localhost/` 
  - *Nếu tải trang (F5) liên tục, API Gateway sẽ tự động cân bằng tải traffic chia đều xuống hai node `web-frontend-server-1` và `web-frontend-server-2`.*
- **Application Backend (API)**:
  - Qua Gateway: `http://localhost/api/hello`
  - Lấy thông tin sinh viên từ file cấu trúc JSON: `http://localhost/student/`
- **Quản trị Xác thực (Keycloak)**:
  - Cổng Admin: `http://localhost:8081` (Sau khi truy cập Realm, ứng dụng client `flask-app` sẽ có thể nhận JWT Token để mở endpoint `/secure` trên Flask API).
- **Lưu trữ Object Storage (MinIO)**:
  - Truy cập giao diện làm việc (Console) tại: `http://localhost:9001` (Sử dụng thông tin tài khoản và mật khẩu định nghĩa ở môi trường: `minioadmin` / `minioadmin`).
  - *Tham khảo tải tài liệu hoặc Avatar của sinh viên vào cấu trúc các Bucket.*
- **Giám sát (Prometheus & Grafana)**:
  - **Prometheus** (Engine lấy Metrics): `http://localhost:9090` (Truy cập `Status -> Targets` để xem Job đã thu thập được từ Web server và Node exporter hay chưa).
  - **Grafana** (Bảng thông tin điều khiển): `http://localhost:3000` (User mặc định `admin`/`admin`). Sau khi thêm Data Source Prometheus, bạn có thể tự Dashboard biểu đồ CPU, Network hệ thống.
- **Kiểm tra Phân giải DNS Nội bộ**:
  Mỗi ứng dụng nội bộ có một Zone ánh xạ riêng. Có thể kiểm thử DNS nội mạng bằng một container `busybox` như sau:
  ```bash
  docker run --rm --network cloud-net busybox nslookup web-frontend-server.cloud.local internal-dns-server
  ```
