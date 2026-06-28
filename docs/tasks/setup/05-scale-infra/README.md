# 🛠️ 05-scale-infra — Hạ tầng scale (Post-MVP)

> ⚠️ Phần lớn task này **không nằm trong MVP**. Self-learn ([`../../docs/ROADMAP.md`](../../docs/ROADMAP.md)) chỉ giữ 4 task chính: TASK-301 (unit test), TASK-302 (e2e), TASK-313 (rate limit), TASK-320 (RBAC). Còn lại là backlog.

## 🎯 Mục đích

Đưa hệ thống từ "chạy được trên localhost" sang **"chạy production an toàn"**: test coverage, cache, security hardening, observability, deployment automation.

## 🚦 Tiêu chí kích hoạt

Mỗi task chỉ làm khi có **triệu chứng cụ thể**, không làm theo checklist:

| Triệu chứng                                    | Task tương ứng                       |
| :--------------------------------------------- | :----------------------------------- |
| Bug fix trước đó tái phát                      | TASK-301, 302 (test)                 |
| API list/search > 500ms                        | TASK-304 (DB optimize), 306 (cache)  |
| Bị brute-force / scraping                      | TASK-313 (rate limit)                |
| Deploy thủ công + lỗi người                    | TASK-308 (CI/CD), 309 (deploy)       |
| Khó debug bug production                       | TASK-312 (logging/tracing)           |
| Cần phân quyền chi tiết hơn USER/STAFF/ADMIN   | TASK-320 (RBAC)                      |
| Cần version API mà không break client cũ       | TASK-314 (API versioning)            |
| Feature toggle theo user/env                   | TASK-315 (feature flags)             |
| Search ILIKE chậm + cần fuzzy/relevance        | TASK-316 (Elasticsearch)             |
| Module trong monolith deploy chậm cản team khác | TASK-321 (Docker/K8s — chuẩn bị split) |

## 📋 Tasks (16)

| ID       | Topic                          | File                                                            |
| :------- | :----------------------------- | :-------------------------------------------------------------- |
| TASK-301 | Unit Tests                     | [link](./01-unit-tests.md)                          |
| TASK-302 | E2E Tests                      | [link](./02-e2e-tests.md)                           |
| TASK-304 | Database Optimization          | [link](./03-db-optimization.md)                     |
| TASK-306 | Add Caching                    | [link](./04-caching.md)                               |
| TASK-307 | Security Enhancements          | [link](./05-security.md)                     |
| TASK-308 | Setup CI/CD                    | [link](./06-cicd.md)                                |
| TASK-309 | Production Deployment          | [link](./07-prod-deploy.md)                     |
| TASK-310 | Clean Architecture Boundaries  | [link](./08-clean-arch.md)     |
| TASK-311 | Advanced Caching Strategy      | [link](./09-caching-advanced.md)                 |
| TASK-312 | Logging / Monitoring / Tracing | [link](./10-observability.md)                |
| TASK-313 | Rate Limiting                  | [link](./11-rate-limit.md)            |
| TASK-314 | API Versioning                 | [link](./12-api-versioning.md)                            |
| TASK-315 | Feature Flags                  | [link](./13-feature-flags.md)               |
| TASK-316 | Elasticsearch Integration      | [link](./14-elasticsearch.md)                 |
| TASK-320 | RBAC                           | [link](./15-rbac.md)            |
| TASK-321 | Docker & Kubernetes            | [link](./16-docker-k8s.md)           |

## 📅 Đề xuất thứ tự (nếu làm sau MVP)

1. TASK-301 + 302 (test) — luôn đầu tiên, làm bệ đỡ cho mọi refactor sau.
2. TASK-313 (rate limit) — nhanh, giảm rủi ro abuse ngay.
3. TASK-307 (security) + TASK-320 (RBAC) — trước khi expose ra real users.
4. TASK-308 + 309 (CI/CD + deploy) — automate trước khi scale team.
5. TASK-312 (logging/tracing) — bắt buộc khi có user thật.
6. TASK-304 + 306 (DB optimize + cache) — khi đo được latency thực.
7. Còn lại: chỉ làm khi gặp triệu chứng.
