# 🛠️ 05-scale-infra — Hạ tầng scale (Post-MVP)

> ⚠️ Phần lớn task này **không nằm trong MVP**. Self-learn ([`../../ROADMAP-SELF-LEARN.md`](../../ROADMAP-SELF-LEARN.md)) chỉ giữ 4 task chính: TASK-301 (unit test), TASK-302 (e2e), TASK-313 (rate limit), TASK-320 (RBAC). Còn lại là backlog.

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
| TASK-301 | Unit Tests                     | [link](./TASK-301-Write-Unit-Tests.md)                          |
| TASK-302 | E2E Tests                      | [link](./TASK-302-Write-E2E-Tests.md)                           |
| TASK-304 | Database Optimization          | [link](./TASK-304-Database-Optimization.md)                     |
| TASK-306 | Add Caching                    | [link](./TASK-306-Add-Caching.md)                               |
| TASK-307 | Security Enhancements          | [link](./TASK-307-Security-Enhancements.md)                     |
| TASK-308 | Setup CI/CD                    | [link](./TASK-308-Setup-CICD.md)                                |
| TASK-309 | Production Deployment          | [link](./TASK-309-Production-Deployment.md)                     |
| TASK-310 | Clean Architecture Boundaries  | [link](./TASK-310-Enforce-Clean-Architecture-Boundaries.md)     |
| TASK-311 | Advanced Caching Strategy      | [link](./TASK-311-Advanced-Caching-Strategy.md)                 |
| TASK-312 | Logging / Monitoring / Tracing | [link](./TASK-312-Logging-Monitoring-Tracing.md)                |
| TASK-313 | Rate Limiting                  | [link](./TASK-313-Rate-Limiting-Abuse-Protection.md)            |
| TASK-314 | API Versioning                 | [link](./TASK-314-API-Versioning.md)                            |
| TASK-315 | Feature Flags                  | [link](./TASK-315-Feature-Flags-Config-Toggle.md)               |
| TASK-316 | Elasticsearch Integration      | [link](./TASK-316-Elasticsearch-Integration.md)                 |
| TASK-320 | RBAC                           | [link](./TASK-320-Role-Based-Access-Control-RBAC.md)            |
| TASK-321 | Docker & Kubernetes            | [link](./TASK-321-Docker-Kubernetes-Configuration.md)           |

## 📅 Đề xuất thứ tự (nếu làm sau MVP)

1. TASK-301 + 302 (test) — luôn đầu tiên, làm bệ đỡ cho mọi refactor sau.
2. TASK-313 (rate limit) — nhanh, giảm rủi ro abuse ngay.
3. TASK-307 (security) + TASK-320 (RBAC) — trước khi expose ra real users.
4. TASK-308 + 309 (CI/CD + deploy) — automate trước khi scale team.
5. TASK-312 (logging/tracing) — bắt buộc khi có user thật.
6. TASK-304 + 306 (DB optimize + cache) — khi đo được latency thực.
7. Còn lại: chỉ làm khi gặp triệu chứng.
