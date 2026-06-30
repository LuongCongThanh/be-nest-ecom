# Hướng dẫn sử dụng Agents

Các agents dưới đây được cài vào `.claude/agents/` và có hiệu lực trong project này.
Để kích hoạt, chỉ cần **gọi tên agent + yêu cầu** trong Claude Code.

> **Tiếng Việt hay tiếng Anh đều được.** Claude hiểu cả hai, dùng ngôn ngữ nào tự nhiên hơn với bạn.

---

## Engineering Agents

### 🏗️ Backend Architect
**Dùng khi:** Thiết kế API, database schema, microservices, cloud infrastructure.

```
# Tiếng Việt
Dùng agent Backend Architect để thiết kế API và database schema cho module đơn hàng
Dùng agent Backend Architect để review kiến trúc hiện tại và đề xuất cải tiến
Nhờ Backend Architect thiết kế luồng tích hợp với cổng thanh toán

# Tiếng Anh
Use the Backend Architect agent to design the order module API and database schema
Use the Backend Architect agent to plan the payment service integration
```

---

### 👁️ Code Reviewer
**Dùng khi:** Review PR, kiểm tra code quality trước khi merge.

```
# Tiếng Việt
Dùng agent Code Reviewer để review các thay đổi trong module auth
Nhờ Code Reviewer kiểm tra PR này xem có bug hoặc lỗ hổng bảo mật không
Dùng Code Reviewer để cho ý kiến về cách implement cart service

# Tiếng Anh
Use the Code Reviewer agent to review the auth module changes
Use the Code Reviewer agent to check this PR for bugs and security issues
```

---

### 🗄️ Database Optimizer
**Dùng khi:** Tối ưu query chậm, thiết kế index, phân tích EXPLAIN ANALYZE.

```
# Tiếng Việt
Dùng agent Database Optimizer để phân tích query tìm kiếm sản phẩm đang chạy chậm
Nhờ Database Optimizer gợi ý index phù hợp cho bảng orders
Dùng Database Optimizer để sửa vấn đề N+1 query trong cart service

# Tiếng Anh
Use the Database Optimizer agent to review the product search query
Use the Database Optimizer agent to suggest indexes for the orders table
```

---

### 🏛️ Software Architect
**Dùng khi:** Quyết định kiến trúc lớn, DDD, ADR (Architecture Decision Records), trade-off analysis.

```
# Tiếng Việt
Dùng agent Software Architect để thiết kế bounded context cho hệ thống e-commerce này
Nhờ Software Architect viết ADR cho quyết định chuyển từ REST sang GraphQL
Dùng Software Architect để so sánh monolith vs microservices cho payment module

# Tiếng Anh
Use the Software Architect agent to design the bounded contexts for this e-commerce system
Use the Software Architect agent to write an ADR for switching from REST to GraphQL
```

---

### 🌿 Git Workflow Master
**Dùng khi:** Git strategy, xử lý merge conflict, cleanup commit history, branch naming.

```
# Tiếng Việt
Dùng agent Git Workflow Master để giúp giải quyết merge conflict này
Nhờ Git Workflow Master xem lại chiến lược branch của project
Dùng Git Workflow Master để squash và dọn dẹp các commit trước khi tạo PR

# Tiếng Anh
Use the Git Workflow Master agent to help resolve this merge conflict
Use the Git Workflow Master agent to squash and clean up these commits before PR
```

---

### 🪡 Minimal Change Engineer
**Dùng khi:** Bug fix nhỏ, tuyệt đối không muốn scope creep, cần diff tối giản.

```
# Tiếng Việt
Dùng agent Minimal Change Engineer để chỉ sửa bug null pointer trong user service, không làm gì thêm
Nhờ Minimal Change Engineer thêm validation còn thiếu mà không refactor gì cả
Tôi chỉ muốn thay đổi nhỏ nhất có thể để fix lỗi này, dùng Minimal Change Engineer

# Tiếng Anh
Use the Minimal Change Engineer agent to fix only the null pointer bug in the user service
Use the Minimal Change Engineer agent — I want the smallest possible change to fix this issue
```

---

### 🛡️ SRE (Site Reliability Engineer)
**Dùng khi:** Thiết lập SLO/SLI, observability, monitoring, giảm toil, incident readiness.

```
# Tiếng Việt
Dùng agent SRE để định nghĩa SLO cho order processing service
Nhờ SRE thiết kế observability stack cho ứng dụng này
Dùng SRE để tạo incident runbook khi payment service bị lỗi

# Tiếng Anh
Use the SRE agent to define SLOs for the order processing service
Use the SRE agent to design the observability stack for this application
```

---

## Security Agents

### 🔐 Application Security Engineer
**Dùng khi:** Threat modeling, SAST review, tích hợp security vào CI/CD, secure code review.

```
# Tiếng Việt
Dùng agent Application Security Engineer để làm threat model cho auth module
Nhờ AppSec Engineer review phần implement JWT xem có lỗ hổng không
Dùng AppSec Engineer để tích hợp SAST vào CI pipeline của chúng ta

# Tiếng Anh
Use the Application Security Engineer agent to do a threat model for the auth module
Use the Application Security Engineer agent to review the JWT implementation for vulnerabilities
```

---

### 🛡️ Senior SecOps Engineer
**Dùng khi:** Scan secrets/credentials bị lộ, kiểm tra CORS/rate limiting/security headers, audit bảo mật toàn diện.

```
# Tiếng Việt
Dùng agent Senior SecOps để scan PR này xem có secret nào bị lộ không trước khi merge
Nhờ Senior SecOps audit phần authentication và authorization
Dùng Senior SecOps để kiểm tra security headers và cấu hình CORS của API

# Tiếng Anh
Use the Senior SecOps agent to scan this PR for exposed secrets before merging
Use the Senior SecOps agent to audit the authentication and authorization controls
```

> **Lưu ý:** Agent này tự động scan secrets **trước** khi làm bất cứ điều gì khác.

---

## Testing Agents

### 🔌 API Tester
**Dùng khi:** Validate API endpoints, integration testing, kiểm tra contract API.

```
# Tiếng Việt
Dùng agent API Tester để viết test cases cho các endpoint của product catalog
Nhờ API Tester validate tích hợp payment webhook
Dùng API Tester để tạo bộ integration test cho luồng đặt hàng

# Tiếng Anh
Use the API Tester agent to write test cases for the product catalog endpoints
Use the API Tester agent to create an integration test suite for the order flow
```

---

### ⏱️ Performance Benchmarker
**Dùng khi:** Load testing, benchmark API response time, tìm bottleneck performance.

```
# Tiếng Việt
Dùng agent Performance Benchmarker để benchmark endpoint tìm kiếm sản phẩm
Nhờ Performance Benchmarker load test luồng checkout với k6
Dùng Performance Benchmarker để tìm bottleneck trong order service

# Tiếng Anh
Use the Performance Benchmarker agent to benchmark the product search endpoint
Use the Performance Benchmarker agent to load test the checkout flow with k6
```

---

### 🧐 Reality Checker
**Dùng khi:** Kiểm tra production readiness, cần bằng chứng cụ thể trước khi deploy.

```
# Tiếng Việt
Dùng agent Reality Checker để xác nhận auth module đã sẵn sàng lên production chưa
Nhờ Reality Checker kiểm tra tích hợp thanh toán trước khi go live
Dùng Reality Checker để đánh giá feature này thực sự done hay chỉ "trông có vẻ done"

# Tiếng Anh
Use the Reality Checker agent to certify the auth module is production-ready
Use the Reality Checker agent to validate the payment integration before going live
```

> **Lưu ý:** Agent này mặc định trả lời **"NEEDS WORK"** — chỉ approve khi có bằng chứng áp đảo.

---

## Kết hợp nhiều agents (workflow thực tế)

### Feature mới (ví dụ: Order module)
```
# Tiếng Việt
1. Dùng Software Architect để thiết kế bounded context cho order module
2. Dùng Backend Architect để thiết kế API và database schema
3. Dùng Database Optimizer để review schema và gợi ý index
4. Dùng Senior SecOps để review implementation trước khi tạo PR
5. Dùng Code Reviewer để review lần cuối
6. Dùng Reality Checker để xác nhận sẵn sàng production
```

### Bug fix
```
# Tiếng Việt
1. Dùng Minimal Change Engineer để fix [mô tả bug], không làm gì thêm
2. Dùng Code Reviewer để xác nhận fix đúng và tối giản
```

### Performance issue
```
# Tiếng Việt
1. Dùng Database Optimizer để phân tích query chậm
2. Dùng Performance Benchmarker để benchmark trước và sau khi fix
```

### Security review
```
# Tiếng Việt
1. Dùng Senior SecOps để scan secrets và các vấn đề bảo mật
2. Dùng Application Security Engineer để làm full threat model
```
