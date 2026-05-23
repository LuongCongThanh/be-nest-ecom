# Skills Master Guide

> Tổng hợp từ: `AITrainingSkillsReport.md` · `be-skills-guide.md` · `SKILLS_REFERENCE.md`
> Cập nhật: 2026-05-23

---

## Mục lục

1. [AI Training Skills — Tư duy & Engineering Workflow](#1-ai-training-skills)
2. [Backend Engineering Skills — Ecommerce API](#2-backend-engineering-skills)
3. [Local Project Skills — `.claude/skills`](#3-local-project-skills)
4. [GSD Framework Skills](#4-gsd-framework-skills)

---

## 1. AI Training Skills

Repository: [sickn33/antigravity-awesome-skills](https://github.com/sickn33/antigravity-awesome-skills)

Mục tiêu: dạy AI suy nghĩ có structure · coding như senior engineer · debug có hệ thống · review code · tạo architecture · dạy học theo roadmap · multi-agent orchestration.

---

### 1.1 Danh sách skill tổng quát

| Nhóm                | Skill                      | Mục đích                                                   | Local Folder                                                                                                                               | SKILL.md                                                                                                   | GitHub                                                                                                    |
| ------------------- | -------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| 🧠 Tư Duy           | `brainstorming`            | Phân tích ý tưởng, roadmap, MVP planning                   | [Folder](../../.antigravity-awesome-skills/skills/brainstorming)                                                                           | [SKILL.md](../../.antigravity-awesome-skills/skills/brainstorming/SKILL.md)                                | [GitHub](https://github.com/sickn33/antigravity-awesome-skills/tree/main/skills/brainstorming)            |
| 🧠 Tư Duy           | `critical-thinking`        | Reasoning tốt hơn, phân tích đa chiều, giảm hallucination  | —                                                                                                                                          | —                                                                                                          | [GitHub](https://github.com/sickn33/antigravity-awesome-skills/tree/main/skills/critical-thinking)        |
| 🧠 Tư Duy           | `root-cause-analysis`      | Tìm nguyên nhân gốc, tránh fix bề mặt                      | —                                                                                                                                          | —                                                                                                          | [GitHub](https://github.com/sickn33/antigravity-awesome-skills/tree/main/skills/root-cause-analysis)      |
| 📚 Teaching         | `teaching-mode`            | AI làm teacher, giải thích từng bước, beginner → advanced  | —                                                                                                                                          | —                                                                                                          | [GitHub](https://github.com/sickn33/antigravity-awesome-skills/tree/main/skills/teaching-mode)            |
| 📚 Teaching         | `tutorial-builder`         | Tạo tutorial, lesson plan, learning roadmap                | [Folder](../../.antigravity-awesome-skills/skills/tutorial-engineer)                                                                       | [SKILL.md](../../.antigravity-awesome-skills/skills/tutorial-engineer/SKILL.md)                            | [GitHub](https://github.com/sickn33/antigravity-awesome-skills/tree/main/skills/tutorial-builder)         |
| 📚 Teaching         | `educational-steps`        | Chia nhỏ kiến thức, giải thích có progression              | —                                                                                                                                          | —                                                                                                          | [GitHub](https://github.com/sickn33/antigravity-awesome-skills/tree/main/skills/educational-steps)        |
| 🏗️ Coding Standards | `clean-architecture`       | Kiến trúc scalable, separation of concerns                 | [clean-code](../../.antigravity-awesome-skills/skills/clean-code) \| [architecture](../../.antigravity-awesome-skills/skills/architecture) | [SKILL.md](../../.antigravity-awesome-skills/skills/clean-code/SKILL.md)                                   | [GitHub](https://github.com/sickn33/antigravity-awesome-skills/tree/main/skills/clean-architecture)       |
| 🏗️ Coding Standards | `repository-pattern`       | Abstraction data layer, reusable repository workflow       | [Folder](../../.antigravity-awesome-skills/skills/architecture-patterns)                                                                   | [SKILL.md](../../.antigravity-awesome-skills/skills/architecture-patterns/SKILL.md)                        | [GitHub](https://github.com/sickn33/antigravity-awesome-skills/tree/main/skills/repository-pattern)       |
| 🏗️ Coding Standards | `refactoring`              | Improve existing code, remove technical debt               | [Folder](../../.antigravity-awesome-skills/skills/code-refactoring-refactor-clean)                                                         | [SKILL.md](../../.antigravity-awesome-skills/skills/code-refactoring-refactor-clean/SKILL.md)              | [GitHub](https://github.com/sickn33/antigravity-awesome-skills/tree/main/skills/refactoring)              |
| 🏗️ Coding Standards | `backend-guidelines`       | Backend best practices, scalable APIs, validation/security | [Folder](../../.antigravity-awesome-skills/skills/backend-dev-guidelines)                                                                  | [SKILL.md](../../.antigravity-awesome-skills/skills/backend-dev-guidelines/SKILL.md)                       | [GitHub](https://github.com/sickn33/antigravity-awesome-skills/tree/main/skills/backend-guidelines)       |
| 🏗️ Coding Standards | `frontend-patterns`        | Frontend architecture, reusable UI patterns                | [Folder](../../.antigravity-awesome-skills/skills/cc-skill-frontend-patterns)                                                              | [SKILL.md](../../.antigravity-awesome-skills/skills/cc-skill-frontend-patterns/SKILL.md)                   | [GitHub](https://github.com/sickn33/antigravity-awesome-skills/tree/main/skills/frontend-patterns)        |
| 🐛 Debugging        | `debugging-strategies`     | Systematic debugging, root cause investigation             | [Folder](../../.antigravity-awesome-skills/skills/debugging-strategies)                                                                    | [SKILL.md](../../.antigravity-awesome-skills/skills/debugging-strategies/SKILL.md)                         | [GitHub](https://github.com/sickn33/antigravity-awesome-skills/tree/main/skills/debugging-strategies)     |
| 🐛 Debugging        | `bug-investigation`        | Analyze production issues, reproduce bugs                  | [Folder](../../.antigravity-awesome-skills/skills/bug-hunter)                                                                              | [SKILL.md](../../.antigravity-awesome-skills/skills/bug-hunter/SKILL.md)                                   | [GitHub](https://github.com/sickn33/antigravity-awesome-skills/tree/main/skills/bug-investigation)        |
| 🧪 Testing & Review | `test-driven-development`  | TDD workflow, test-first development                       | [Folder](../../.antigravity-awesome-skills/skills/test-driven-development)                                                                 | [SKILL.md](../../.antigravity-awesome-skills/skills/test-driven-development/SKILL.md)                      | [GitHub](https://github.com/sickn33/antigravity-awesome-skills/tree/main/skills/test-driven-development)  |
| 🧪 Testing & Review | `code-reviewer`            | AI review code, detect bad practices                       | [Folder](../../.antigravity-awesome-skills/skills/code-reviewer)                                                                           | [SKILL.md](../../.antigravity-awesome-skills/skills/code-reviewer/SKILL.md)                                | [GitHub](https://github.com/sickn33/antigravity-awesome-skills/tree/main/skills/code-reviewer)            |
| 🧪 Testing & Review | `security-auditor`         | OWASP review, auth checking, vulnerability analysis        | [Folder](../../.antigravity-awesome-skills/skills/security-auditor)                                                                        | [SKILL.md](../../.antigravity-awesome-skills/skills/security-auditor/SKILL.md)                             | [GitHub](https://github.com/sickn33/antigravity-awesome-skills/tree/main/skills/security-auditor)         |
| 🎨 Frontend/UI      | `frontend-design`          | Improve UI/UX, modern frontend, responsive layout          | [Folder](../../.antigravity-awesome-skills/skills/frontend-design)                                                                         | [SKILL.md](../../.antigravity-awesome-skills/skills/frontend-design/SKILL.md)                              | [GitHub](https://github.com/sickn33/antigravity-awesome-skills/tree/main/skills/frontend-design)          |
| 🎨 Frontend/UI      | `tailwind-master`          | Optimize Tailwind workflow, responsive design              | [Folder](../../.antigravity-awesome-skills/skills/tailwind-patterns)                                                                       | [SKILL.md](../../.antigravity-awesome-skills/skills/tailwind-patterns/SKILL.md)                            | [GitHub](https://github.com/sickn33/antigravity-awesome-skills/tree/main/skills/tailwind-master)          |
| 🎨 Frontend/UI      | `accessibility-review`     | Accessibility audit, semantic HTML, keyboard nav           | [Folder](../../.antigravity-awesome-skills/skills/accessibility-compliance-accessibility-audit)                                            | [SKILL.md](../../.antigravity-awesome-skills/skills/accessibility-compliance-accessibility-audit/SKILL.md) | [GitHub](https://github.com/sickn33/antigravity-awesome-skills/tree/main/skills/accessibility-review)     |
| ⚙️ DevOps           | `docker-production`        | Production Docker setup, deployment workflow               | [Folder](../../.antigravity-awesome-skills/skills/docker-expert)                                                                           | [SKILL.md](../../.antigravity-awesome-skills/skills/docker-expert/SKILL.md)                                | [GitHub](https://github.com/sickn33/antigravity-awesome-skills/tree/main/skills/docker-production)        |
| ⚙️ DevOps           | `observability`            | Logging, monitoring, metrics/tracing                       | [Folder](../../.antigravity-awesome-skills/skills/observability-engineer)                                                                  | [SKILL.md](../../.antigravity-awesome-skills/skills/observability-engineer/SKILL.md)                       | [GitHub](https://github.com/sickn33/antigravity-awesome-skills/tree/main/skills/observability)            |
| ⚙️ DevOps           | `kubernetes-ops`           | Cluster management, scalable deployment                    | [Folder](../../.antigravity-awesome-skills/skills/kubernetes-deployment)                                                                   | [SKILL.md](../../.antigravity-awesome-skills/skills/kubernetes-deployment/SKILL.md)                        | [GitHub](https://github.com/sickn33/antigravity-awesome-skills/tree/main/skills/kubernetes-ops)           |
| 🤖 Multi-Agent      | `multi-agent-orchestrator` | Chia role cho nhiều AI, autonomous workflow                | [Folder](../../.antigravity-awesome-skills/skills/agent-orchestrator)                                                                      | [SKILL.md](../../.antigravity-awesome-skills/skills/agent-orchestrator/SKILL.md)                           | [GitHub](https://github.com/sickn33/antigravity-awesome-skills/tree/main/skills/multi-agent-orchestrator) |
| 🤖 Multi-Agent      | `task-delegation`          | Chia task giữa agents, routing workflow                    | [Folder](../../.antigravity-awesome-skills/skills/multi-agent-task-orchestrator)                                                           | [SKILL.md](../../.antigravity-awesome-skills/skills/multi-agent-task-orchestrator/SKILL.md)                | [GitHub](https://github.com/sickn33/antigravity-awesome-skills/tree/main/skills/task-delegation)          |
| 🤖 Multi-Agent      | `loki-mode`                | Advanced orchestration, autonomous execution               | [Folder](../../.antigravity-awesome-skills/skills/loki-mode)                                                                               | [SKILL.md](../../.antigravity-awesome-skills/skills/loki-mode/SKILL.md)                                    | [GitHub](https://github.com/sickn33/antigravity-awesome-skills/tree/main/skills/loki-mode)                |

> `—` = không có trong local `.antigravity-awesome-skills/skills`

---

### 1.2 Senior Thinking Skills

> Giúp AI **tư duy sâu như senior engineer** — mental model và reasoning framework, không phải tool hay linter.

| Skill                       | Tư duy dạy                                                                                           | Khi nào dùng                                                   | Local Folder                                                                 | SKILL.md                                                                                | Ghi chú                                                       |
| --------------------------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `uncle-bob-craft`           | SOLID, Clean Architecture, dependency boundaries, code smells, estimation                            | Review code, refactor, thảo luận architecture                  | [Folder](../../.antigravity-awesome-skills/skills/uncle-bob-craft)           | [SKILL.md](../../.antigravity-awesome-skills/skills/uncle-bob-craft/SKILL.md)           | Dùng ngay, không cần setup                                    |
| `logic-lens`                | Formal reasoning: race conditions, null/undefined, type safety, algorithm flaws, security injection  | Trước khi merge PR, debug khó, review security-sensitive code  | [Folder](../../.antigravity-awesome-skills/skills/logic-lens)                | [SKILL.md](../../.antigravity-awesome-skills/skills/logic-lens/SKILL.md)                | Dùng ngay, không cần setup                                    |
| `ejentum-reasoning-harness` | 679 cognitive ops: chống attention decay, reasoning decay, sycophantic collapse, hallucination drift | Phân tích phức tạp, architecture decision, multi-step planning | [Folder](../../.antigravity-awesome-skills/skills/ejentum-reasoning-harness) | [SKILL.md](../../.antigravity-awesome-skills/skills/ejentum-reasoning-harness/SKILL.md) | Cần setup MCP: `npx -y ejentum-mcp` + API key tại ejentum.com |

**Thứ tự học đề xuất:**

```text
uncle-bob-craft       → học tư duy nền tảng (SOLID, Clean Architecture)
      ↓
logic-lens            → áp dụng tư duy vào đọc & phân tích code
      ↓
ejentum-reasoning     → nâng lên cognitive framework (sau khi setup MCP)
```

---

### 1.3 AI Agent Skills

#### Tầng 1 — Dùng AI hiệu quả hơn

| Skill                  | Dạy gì                                                                                  | Khi nào dùng                                             | Local Folder                                                            | SKILL.md                                                                           |
| ---------------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `prompt-engineering`   | Few-shot learning, chain-of-thought, instruction tuning, prompt patterns chuẩn          | Muốn AI output chính xác hơn, debug agent behavior       | [Folder](../../.antigravity-awesome-skills/skills/prompt-engineering)   | [SKILL.md](../../.antigravity-awesome-skills/skills/prompt-engineering/SKILL.md)   |
| `context-manager`      | Quản lý context window, vector DB, knowledge graph, intelligent memory                  | Project lớn, AI bị quên context, cần memory architecture | [Folder](../../.antigravity-awesome-skills/skills/context-manager)      | [SKILL.md](../../.antigravity-awesome-skills/skills/context-manager/SKILL.md)      |
| `agent-memory-systems` | Short-term (context window) vs long-term (vector store), chunking, embedding, retrieval | Hiểu tại sao AI "quên", thiết kế memory cho agent        | [Folder](../../.antigravity-awesome-skills/skills/agent-memory-systems) | [SKILL.md](../../.antigravity-awesome-skills/skills/agent-memory-systems/SKILL.md) |

#### Tầng 2 — Điều khiển nhiều agent (Advanced)

| Skill                         | Dạy gì                                                                             | Khi nào dùng                                          | Local Folder                                                                   | SKILL.md                                                                                  |
| ----------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| `dispatching-parallel-agents` | Chạy nhiều agent song song cho task độc lập, tiết kiệm thời gian                   | Có 2+ task không phụ thuộc nhau                       | [Folder](../../.antigravity-awesome-skills/skills/dispatching-parallel-agents) | [SKILL.md](../../.antigravity-awesome-skills/skills/dispatching-parallel-agents/SKILL.md) |
| `subagent-driven-development` | Mỗi task → 1 fresh subagent + 2-stage review (spec → quality)                      | Thực thi implementation plan với nhiều task độc lập   | [Folder](../../.antigravity-awesome-skills/skills/subagent-driven-development) | [SKILL.md](../../.antigravity-awesome-skills/skills/subagent-driven-development/SKILL.md) |
| `tool-use-guardian`           | Reliability wrapper: auto-retry, fix truncated JSON, recover từ timeout/rate limit | Agent hay bị fail giữa chừng, tool call không ổn định | [Folder](../../.antigravity-awesome-skills/skills/tool-use-guardian)           | [SKILL.md](../../.antigravity-awesome-skills/skills/tool-use-guardian/SKILL.md)           |
| `loki-mode`                   | Advanced orchestration, autonomous execution toàn bộ workflow                      | Muốn AI tự chạy end-to-end không cần can thiệp        | [Folder](../../.antigravity-awesome-skills/skills/loki-mode)                   | [SKILL.md](../../.antigravity-awesome-skills/skills/loki-mode/SKILL.md)                   |

**Lộ trình học:**

```text
prompt-engineering           → viết prompt chuẩn trước
        ↓
context-manager              → hiểu & quản lý context/memory
agent-memory-systems         ↗
        ↓
dispatching-parallel-agents  → điều khiển nhiều agent
subagent-driven-development  ↗
        ↓
tool-use-guardian + loki-mode → production-grade autonomous agent
```

---

### 1.4 Documentation Skills

| Nhóm                   | Skill                           | Dạy gì                                                                    | Khi nào dùng                                          | Local Folder                                                                     | SKILL.md                                                                                    |
| ---------------------- | ------------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| BA / Business Document | `business-analyst`              | KPI framework, analytics, data-driven insights, strategic recommendations | Viết requirements, business case, phân tích nghiệp vụ | [Folder](../../.antigravity-awesome-skills/skills/business-analyst)              | [SKILL.md](../../.antigravity-awesome-skills/skills/business-analyst/SKILL.md)              |
| Technical Document     | `documentation`                 | Workflow bundle: API docs, architecture docs, README, code comments       | Cần nhiều loại doc cùng lúc cho 1 project             | [Folder](../../.antigravity-awesome-skills/skills/documentation)                 | [SKILL.md](../../.antigravity-awesome-skills/skills/documentation/SKILL.md)                 |
| Technical Document     | `docs-architect`                | Đọc codebase → tạo long-form technical manual / ebook                     | Muốn tài liệu hoá toàn bộ hệ thống từ code            | [Folder](../../.antigravity-awesome-skills/skills/docs-architect)                | [SKILL.md](../../.antigravity-awesome-skills/skills/docs-architect/SKILL.md)                |
| Technical Document     | `api-documenter`                | OpenAPI 3.1, interactive docs, SDK generation, developer portal           | Viết API doc chuẩn, build developer experience        | [Folder](../../.antigravity-awesome-skills/skills/api-documenter)                | [SKILL.md](../../.antigravity-awesome-skills/skills/api-documenter/SKILL.md)                |
| Technical Document     | `architecture-decision-records` | Viết ADR, ghi lại lý do technical decision, trade-offs, context           | Sau mỗi quyết định architecture quan trọng            | [Folder](../../.antigravity-awesome-skills/skills/architecture-decision-records) | [SKILL.md](../../.antigravity-awesome-skills/skills/architecture-decision-records/SKILL.md) |
| Technical Document     | `wiki-architect`                | Tạo wiki catalogue + onboarding guide từ codebase                         | Onboard member mới, document toàn bộ repo             | [Folder](../../.antigravity-awesome-skills/skills/wiki-architect)                | [SKILL.md](../../.antigravity-awesome-skills/skills/wiki-architect/SKILL.md)                |
| Hỗ trợ viết doc        | `openapi-spec-generation`       | Sinh OpenAPI spec từ code                                                 | Có REST API, cần spec chuẩn                           | [Folder](../../.antigravity-awesome-skills/skills/openapi-spec-generation)       | [SKILL.md](../../.antigravity-awesome-skills/skills/openapi-spec-generation/SKILL.md)       |
| Hỗ trợ viết doc        | `readme`                        | Viết README chuẩn, đầy đủ, đẹp                                            | Mỗi project/repo mới                                  | [Folder](../../.antigravity-awesome-skills/skills/readme)                        | [SKILL.md](../../.antigravity-awesome-skills/skills/readme/SKILL.md)                        |
| Hỗ trợ viết doc        | `documentation-templates`       | Template sẵn cho nhiều loại doc                                           | Muốn bắt đầu nhanh, không viết từ đầu                 | [Folder](../../.antigravity-awesome-skills/skills/documentation-templates)       | [SKILL.md](../../.antigravity-awesome-skills/skills/documentation-templates/SKILL.md)       |
| Hỗ trợ viết doc        | `writing-skills`                | Nâng cao chất lượng văn phong khi viết doc                                | Doc viết xong nhưng khó đọc, cần polish               | [Folder](../../.antigravity-awesome-skills/skills/writing-skills)                | [SKILL.md](../../.antigravity-awesome-skills/skills/writing-skills/SKILL.md)                |

**Chọn skill theo loại doc:**

```text
Viết requirements / nghiệp vụ  → business-analyst
Viết API doc                   → api-documenter + openapi-spec-generation
Viết technical manual          → docs-architect
Viết wiki / onboarding         → wiki-architect
Viết ADR                       → architecture-decision-records
Viết README                    → readme
Cần template nhanh             → documentation-templates
Polish văn phong               → writing-skills
```

---

### 1.5 Workflow đề xuất

| Workflow         | Skill chain                                                                                                         |
| ---------------- | ------------------------------------------------------------------------------------------------------------------- |
| 📚 Learning      | `brainstorming` → `teaching-mode` → `tutorial-builder` → `educational-steps`                                        |
| 🏗️ Backend       | `clean-architecture` → `backend-guidelines` → `repository-pattern` → `test-driven-development` → `security-auditor` |
| 🎨 Frontend      | `frontend-design` → `frontend-patterns` → `tailwind-master` → `accessibility-review`                                |
| 🐛 Debug         | `debugging-strategies` → `root-cause-analysis` → `bug-investigation`                                                |
| 🤖 Autonomous AI | `multi-agent-orchestrator` → `task-delegation` → `loki-mode`                                                        |

---

### 1.6 Ghi chú: Không có skill DSA

> Repo này **không có skill chuyên biệt về Algorithms / Data Structures**. Focus của repo là engineering workflow và coding standards.

| Workaround                          | Skill             | Cách dùng                                                                                                         |
| ----------------------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------- |
| Phân tích algorithm trong code thực | `logic-lens`      | Yêu cầu AI review algorithm correctness, boundary conditions, time/space complexity                               |
| Học DSA theo kiểu senior            | `uncle-bob-craft` | Hỏi AI giải thích trade-offs: "why this data structure?", "what's the complexity?", "when would you switch to X?" |

---

## 2. Backend Engineering Skills

Lộ trình kỹ năng Backend chuyên nghiệp cho Ecommerce API — từ thực thi cơ bản đến kiến trúc sư hệ thống.

---

### 2.1 Nền tảng & Framework

| Skill                       | Mô tả                                                                                        |
| --------------------------- | -------------------------------------------------------------------------------------------- |
| `nestjs-expert`             | Làm chủ Module, Dependency Injection, Testing và các giải pháp backend phức tạp với NestJS   |
| `typescript-advanced-types` | Sử dụng Generics, Mapped Types, Utility Types để đảm bảo type-safety cho logic Ecommerce     |
| `zod-validation-expert`     | Xây dựng hệ thống validation dữ liệu đầu vào (DTO) cực mạnh và tự động hóa schema validation |
| `javascript-mastery`        | Hiểu sâu về Event Loop, Async/Await và tối ưu hóa xử lý bất đồng bộ trong Node.js            |

### 2.2 Thiết kế & Phát triển API (REST/GraphQL)

| Skill                     | Mô tả                                                                                        |
| ------------------------- | -------------------------------------------------------------------------------------------- |
| `api-endpoint-builder`    | Kỹ năng "thực chiến" viết API Endpoint chuyên nghiệp từ Route, Validation đến Error Handling |
| `api-design-principles`   | Các nguyên tắc thiết kế API REST & GraphQL trực quan, bền vững và tuân thủ chuẩn cộng đồng   |
| `api-patterns`            | Áp dụng các pattern nâng cao: HATEOAS, Versioning, Cursor-based Pagination và API Gateway    |
| `graphql-architect`       | Thiết kế Schema, Resolver và Federation cho các hệ thống lớn đòi hỏi linh hoạt dữ liệu       |
| `error-handling-patterns` | Xây dựng hệ thống xử lý lỗi nhất quán, chuyên nghiệp giúp API tin cậy và dễ debug            |

### 2.3 Kiến trúc & Mở rộng (Senior Level)

| Skill                           | Mô tả                                                                                  |
| ------------------------------- | -------------------------------------------------------------------------------------- |
| `senior-architect`              | Tư duy hệ thống, quản lý technical debt và dẫn dắt các quyết định công nghệ quan trọng |
| `architecture-patterns`         | Làm chủ Event-driven, Microservices, Hexagonal, Clean Architecture                     |
| `architecture-decision-records` | Ghi chép và quản lý ADRs để theo dõi lịch sử và lý do của các quyết định kiến trúc     |
| `backend-architect`             | Thiết kế service boundaries, định nghĩa giao tiếp giữa các services và mở rộng quy mô  |
| `cqrs-implementation`           | Tách biệt mô hình Đọc và Ghi để tối ưu hiệu năng và khả năng mở rộng cho hệ thống lớn  |

### 2.4 Quản trị Dữ liệu

| Skill                       | Mô tả                                                                                            |
| --------------------------- | ------------------------------------------------------------------------------------------------ |
| `prisma-expert`             | Chuyên gia Prisma ORM: giải quyết N+1, migration an toàn và tối ưu hóa quan hệ phức tạp          |
| `sql-pro`                   | Master SQL nâng cao: CTEs, Window functions, tối ưu hóa Query Plans và thiết kế Schema chuẩn hóa |
| `postgresql-optimization`   | Quy trình tối ưu hóa hiệu năng Database toàn diện cho các hệ thống eCommerce chịu tải cao        |
| `sql-optimization-patterns` | Các mẫu tối ưu hóa SQL, chiến lược đánh Index và phân tích Query Plan chuyên sâu                 |
| `database-design`           | Thiết kế mô hình dữ liệu Ecommerce (Product, Order, Inventory) linh hoạt và tối ưu Index         |
| `algolia-search`            | Tích hợp công cụ tìm kiếm mạnh mẽ, giúp khách hàng tìm thấy sản phẩm nhanh nhất                  |

### 2.5 Auth, Roles & Security

| Skill                          | Mô tả                                                                                 |
| ------------------------------ | ------------------------------------------------------------------------------------- |
| `auth-implementation-patterns` | Làm chủ hệ thống Roles (RBAC), JWT, Secure Sessions và các flow đăng nhập bảo mật cao |
| `api-security-best-practices`  | Ngăn chặn OWASP Top 10, chống SQL Injection, XSS và áp dụng Rate Limiting bảo vệ API  |
| `web-security-testing`         | Quy trình thử nghiệm và kiểm soát an ninh (Pentesting) cho ứng dụng server-side       |

### 2.6 Ecommerce Features

| Skill                       | Mô tả                                                                                             |
| --------------------------- | ------------------------------------------------------------------------------------------------- |
| `payment-integration`       | Tích hợp cổng thanh toán chuyên nghiệp, xử lý Webhooks và đảm bảo tính Idempotency khi giao dịch  |
| `stripe-integration`        | Chuyên sâu về hệ sinh thái Stripe: Checkout, Subscriptions và API Billing                         |
| `file-uploads`              | Quản lý hình ảnh/video sản phẩm hiệu quả thông qua S3, Cloudflare R2 và tối ưu hóa dung lượng ảnh |
| `inventory-demand-planning` | Logic quản lý kho hàng, dự báo tồn kho và xử lý đơn hàng phức tạp                                 |

### 2.7 Chất lượng Code & Quy trình

| Skill                             | Mô tả                                                                                        |
| --------------------------------- | -------------------------------------------------------------------------------------------- |
| `code-refactoring-refactor-clean` | Biến code rối thành code sạch, xử lý code smell và tech debt                                 |
| `code-review-ai-ai-review`        | Tận dụng AI để tự động hóa soát lỗi, đề xuất tối ưu hóa logic và đảm bảo chuẩn quy trình     |
| `code-review-excellence`          | Quy trình Code Review chuẩn mực giúp nâng cao chất lượng code của toàn team                  |
| `test-driven-development`         | Quy trình Red-Green-Refactor giúp viết code chính xác, giảm thiểu bug và tự tin khi refactor |
| `javascript-testing-patterns`     | Chiến lược kiểm thử toàn diện: Unit Test, Integration Test và E2E Test cho Backend           |

### 2.8 Git & Workflow

| Skill                    | Mô tả                                                                                          |
| ------------------------ | ---------------------------------------------------------------------------------------------- |
| `commit`                 | Làm chủ chuẩn Conventional Commits giúp lịch sử Git sạch, dễ tra cứu và tự động hóa versioning |
| `git-advanced-workflows` | Rebase, Cherry-pick, xử lý Conflict phức tạp và Branching Strategy                             |
| `git-hooks-automation`   | Tự động hóa kiểm tra code trước khi commit bằng Husky và Git hooks                             |

### 2.9 Patterns & Scaffolding

| Skill                       | Mô tả                                                                         |
| --------------------------- | ----------------------------------------------------------------------------- |
| `cc-skill-backend-patterns` | Repository Pattern, Service Layer, Middleware và Error Handling chuẩn         |
| `cc-skill-coding-standards` | Tiêu chuẩn về đặt tên, cấu trúc thư mục (Folder Structure) và viết Clean Code |
| `nx-workspace-patterns`     | Monorepo và Scaffolding chuyên nghiệp cho các hệ thống backend quy mô lớn     |

### 2.10 Vận hành & Triển khai

| Skill                        | Mô tả                                                                                        |
| ---------------------------- | -------------------------------------------------------------------------------------------- |
| `deployment-pipeline-design` | Thiết kế các luồng CI/CD (GitHub Actions) để tự động hóa build/test/deploy                   |
| `docker-expert`              | Container hóa ứng dụng, tối ưu hóa Dockerfile và quản lý services môi trường local/staging   |
| `kubernetes-architect`       | Triển khai và vận hành hệ thống trên K8s, quản lý Auto-scaling và Resilience                 |
| `k6-load-testing`            | Viết script và thực hiện kiểm thử tải (Load/Stress Testing) để đảm bảo hệ thống chịu tải tốt |
| `observability-engineer`     | Xây dựng hệ thống giám sát (Monitoring), quản lý Log tập trung và truy vết lỗi (Tracing)     |
| `sentry-automation`          | Tự động hóa việc theo dõi lỗi, cảnh báo và triệt tiêu các vấn đề phát sinh trong production  |

### 2.11 Meta-Skills & Công cụ

| Skill           | Mô tả                                                                                         |
| --------------- | --------------------------------------------------------------------------------------------- |
| `skill-creator` | Tự động hóa quy trình tạo skill mới cho AI, biến AI thành trợ lý chuyên dụng của riêng bạn    |
| `build`         | Quy trình 4 bước chuẩn để xây dựng tính năng: Nghiên cứu → Lên kế hoạch → Theo dõi → Thực thi |
| `mcp-builder`   | Xây dựng Model Context Protocol server tùy chỉnh để kết nối AI với các data source riêng biệt |

### 2.12 Tích hợp AI

| Skill            | Mô tả                                                                                     |
| ---------------- | ----------------------------------------------------------------------------------------- |
| `gemini-api-dev` | Tích hợp Google Gemini vào Backend để xây dựng Chatbot tư vấn, gợi ý sản phẩm cá nhân hóa |

### 2.13 Quản lý Yêu cầu & Tài liệu

| Skill                             | Mô tả                                                                                                          |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `requirements-doc-expert`         | 🔥 **Master Skill** — Điều phối tất cả skill bên dưới để Review, Đánh giá và Hoàn thiện tài liệu chuyên nghiệp |
| `writing-plans`                   | Viết PRD (Product Requirement Document), đặc tả kỹ thuật và lộ trình thực thi chi tiết                         |
| `api-documenter`                  | Đặc tả API chuyên nghiệp với OpenAPI 3.1, xây dựng developer portals và hướng dẫn tích hợp                     |
| `wiki-architect`                  | Thiết kế cấu trúc Wiki, tạo hướng dẫn Onboarding và bản đồ hóa kiến trúc mã nguồn                              |
| `docs-architect`                  | Tư duy kiến trúc sư tài liệu, tổ chức thông tin khoa học và dễ tra cứu lâu dài                                 |
| `openapi-spec-generation`         | Tối ưu hóa file đặc tả OpenAPI giúp đồng bộ hóa giữa thiết kế và thực thi                                      |
| `api-documentation-generator`     | Tự động hóa việc tạo tài liệu Swagger/OpenAPI từ code NestJS                                                   |
| `code-documentation-doc-generate` | Sử dụng JSDoc và công cụ tự động chiết xuất tài liệu từ comment trong mã nguồn                                 |

### 2.14 Background & Queue

| Skill               | Mô tả                                                                                                |
| ------------------- | ---------------------------------------------------------------------------------------------------- |
| `bullmq-specialist` | Chuyên gia xử lý hàng đợi Redis-backed: quản lý job, retry và xử lý tác vụ nền (gửi mail, xử lý ảnh) |

### 2.15 Bảo trì & Nâng cấp

| Skill                              | Mô tả                                                                                               |
| ---------------------------------- | --------------------------------------------------------------------------------------------------- |
| `dependency-management-deps-audit` | Quy trình audit và cập nhật thư viện hệ thống chuyên nghiệp, tránh lỗ hổng bảo mật và code lỗi thời |

### 2.16 Phân tích Nghiệp vụ & Sản phẩm

| Skill                     | Mô tả                                                                                    |
| ------------------------- | ---------------------------------------------------------------------------------------- |
| `business-analyst`        | Khơi gợi yêu cầu, xác định KPI và chuyển đổi nhu cầu kinh doanh thành giải pháp kỹ thuật |
| `product-manager`         | Tư duy sản phẩm, quản lý yêu cầu ưu tiên (Backlog) và định hướng lộ trình phát triển     |
| `product-manager-toolkit` | Công cụ hỗ trợ viết PRD, phân tích phỏng vấn khách hàng và ưu tiên tính năng theo RICE   |
| `competitive-landscape`   | Nghiên cứu đối thủ để làm rõ các yêu cầu tính năng cạnh tranh cho Ecommerce              |

---

## 3. Local Project Skills

Tài liệu mô tả 24 skill cục bộ trong `.claude/skills` của dự án.

| #   | Skill                           | Nhóm                   | Trigger                                                                                                                     | Vấn đề giải quyết                                                                                              | Đầu ra chính                                                                                                | Lưu ý                                                                            | SKILL.md                                                                |
| --- | ------------------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| 1   | `design-an-interface`           | Thiết kế & Kiến trúc   | Muốn thiết kế API/interface mới, so sánh cách tổ chức module, hoặc _"design it twice"_                                      | Ý tưởng đầu tiên hiếm khi là tốt nhất — commit sớm vào 1 thiết kế dễ dẫn đến refactor tốn kém                  | Các bản thiết kế interface kèm ví dụ, phân tích trade-off, gợi ý tổng hợp tốt nhất                          | Không implement — chỉ về hình dạng interface                                     | [SKILL.md](../../.claude/skills/design-an-interface/SKILL.md)           |
| 2   | `qa`                            | QA & Issue Tracking    | Muốn báo cáo bug bằng hội thoại, chạy phiên QA, hoặc _"QA session"_                                                         | Tự soạn GitHub Issue mất thời gian, dễ thiếu ngữ cảnh và dùng sai tên domain                                   | GitHub Issues: _What happened / What expected / Steps to reproduce / Additional context_                    | Issues phải durable — không chứa file path hay line number                       | [SKILL.md](../../.claude/skills/qa/SKILL.md)                            |
| 3   | `request-refactor-plan`         | Thiết kế & Kiến trúc   | Muốn lên kế hoạch refactor, tạo RFC, hoặc chia nhỏ refactor thành các bước an toàn                                          | Refactor không có kế hoạch dễ scope creep, gây regression, hoặc bỏ sót test coverage                           | GitHub Issue với: Problem Statement, Solution, danh sách Commits chi tiết, Testing Decisions, Out of Scope  | Phần Commits là trọng tâm — càng nhỏ càng tốt                                    | [SKILL.md](../../.claude/skills/request-refactor-plan/SKILL.md)         |
| 4   | `ubiquitous-language`           | Domain & Documentation | Muốn định nghĩa domain terms, xây glossary, hoặc đề cập _"DDD"_ / _"domain model"_                                          | Cùng khái niệm gọi nhiều tên khác nhau gây nhầm lẫn trong code, docs và giao tiếp team                         | `UBIQUITOUS_LANGUAGE.md` với bảng thuật ngữ, "Aliases to avoid", quan hệ giữa terms, ví dụ hội thoại        | Chỉ include domain terms — bỏ qua khái niệm lập trình thuần túy                  | [SKILL.md](../../.claude/skills/ubiquitous-language/SKILL.md)           |
| 5   | `git-guardrails-claude-code`    | Tooling & Setup        | Muốn ngăn Claude chạy lệnh git nguy hiểm, hoặc block `git push`/`reset` trong Claude Code                                   | Claude Code có thể tự ý chạy `git push --force` hay `git reset --hard` mà không có confirmation từ user        | Script `.claude/hooks/block-dangerous-git.sh` + entry trong `settings.json`                                 | Hỏi user muốn cài project-scope hay global-scope                                 | [SKILL.md](../../.claude/skills/git-guardrails-claude-code/SKILL.md)    |
| 6   | `migrate-to-shoehorn`           | Tooling & Setup        | Muốn thay `as` assertions trong tests, đề cập shoehorn, hoặc cần truyền partial data an toàn                                | `as Type` trong tests che giấu lỗi TypeScript thật — bypass type system                                        | Test files được migrate, imports được thêm, type check pass                                                 | Chỉ dùng trong test code — không bao giờ dùng shoehorn trong production          | [SKILL.md](../../.claude/skills/migrate-to-shoehorn/SKILL.md)           |
| 7   | `scaffold-exercises`            | Tooling & Setup        | Muốn tạo cấu trúc thư mục exercises, tạo stubs, hoặc thiết lập section mới cho khóa học                                     | Tạo thủ công hàng chục thư mục exercises với quy ước đặt tên rất dễ sai                                        | Cấu trúc thư mục exercises đúng chuẩn, lint pass, commit sẵn sàng                                           | Dùng `git mv` khi đổi tên; không để `.gitkeep` hay `speaker-notes.md`            | [SKILL.md](../../.claude/skills/scaffold-exercises/SKILL.md)            |
| 8   | `setup-pre-commit`              | Tooling & Setup        | Muốn thêm pre-commit hooks, cài Husky, hoặc enforce format/typecheck/test trước mỗi commit                                  | Code formatting không nhất quán, type errors và test failures được commit vào repo vì thiếu gate kiểm tra      | `.husky/pre-commit`, `.lintstagedrc`, `.prettierrc`, `prepare` script trong `package.json`                  | Husky v9+ không cần shebang                                                      | [SKILL.md](../../.claude/skills/setup-pre-commit/SKILL.md)              |
| 9   | `edit-article`                  | Domain & Documentation | Muốn chỉnh sửa, revise hoặc cải thiện một bản thảo bài viết                                                                 | Bài viết thô thường có sections sắp xếp sai thứ tự logic, đoạn văn quá dài                                     | Bài viết được rewrite từng section theo thứ tự logic                                                        | Skill đơn giản nhất — chỉ 2 bước                                                 | [SKILL.md](../../.claude/skills/edit-article/SKILL.md)                  |
| 10  | `obsidian-vault`                | Domain & Documentation | Muốn tìm, tạo hoặc quản lý notes trong Obsidian vault                                                                       | Vault có path cố định và quy ước đặt tên/linking riêng — cần context để tương tác đúng                         | Notes được tìm thấy (paths), hoặc notes mới với wikilinks và index entries                                  | Tổ chức phẳng — không dùng folder; tên file phải Title Case                      | [SKILL.md](../../.claude/skills/obsidian-vault/SKILL.md)                |
| 11  | `prototype`                     | Thiết kế & Kiến trúc   | Muốn prototype, sanity-check state machine, mockup UI, hoặc _"prototype this"_                                              | Một số câu hỏi thiết kế khó trả lời trên giấy — commit sớm vào implementation trước khi validate là rủi ro lớn | Throwaway code chạy được bằng 1 lệnh; kèm ghi chú câu hỏi đã trả lời                                        | Không có tests, không abstractions. Mục tiêu: học nhanh rồi xóa                  | [SKILL.md](../../.claude/skills/prototype/SKILL.md)                     |
| 12  | `caveman`                       | Meta Skills            | Nói _"caveman mode"_, _"less tokens"_, _"be brief"_, hoặc `/caveman`                                                        | Phản hồi mặc định của AI dài dòng với filler, tốn token và làm chậm workflow                                   | Phản hồi giảm ~75% token, giữ 100% độ chính xác kỹ thuật                                                    | Duy trì suốt session. Tắt khi nói _"stop caveman"_ hoặc _"normal mode"_          | [SKILL.md](../../.claude/skills/caveman/SKILL.md)                       |
| 13  | `grill-me`                      | Thiết kế & Kiến trúc   | Muốn stress-test kế hoạch, được hỏi bài về thiết kế, hoặc _"grill me"_                                                      | Kế hoạch thường có assumption ẩn, dependency chưa giải quyết                                                   | Shared understanding đã được kiểm chứng về toàn bộ thiết kế                                                 | Hỏi từng câu một — không dump nhiều câu cùng lúc                                 | [SKILL.md](../../.claude/skills/grill-me/SKILL.md)                      |
| 14  | `handoff`                       | Domain & Documentation | Muốn bàn giao context cho agent khác hoặc session làm việc tiếp theo                                                        | Context window có giới hạn — session mới không có memory về những gì đã làm                                    | File markdown: context cần thiết, công việc dang dở, decisions đã đưa ra, next steps, suggested skills      | Dùng `mktemp` để tránh ghi đè file cũ                                            | [SKILL.md](../../.claude/skills/handoff/SKILL.md)                       |
| 15  | `write-a-skill`                 | Meta Skills            | Muốn tạo, viết hoặc build một skill mới                                                                                     | Skill viết sai cấu trúc hoặc description mơ hồ sẽ không được agent nhận ra và trigger đúng lúc                 | Thư mục `skill-name/SKILL.md` (+ file phụ nếu cần) trong `.claude/skills/`                                  | Description là thứ duy nhất agent thấy khi quyết định load skill. Max 1024 chars | [SKILL.md](../../.claude/skills/write-a-skill/SKILL.md)                 |
| 16  | `diagnose`                      | QA & Issue Tracking    | Nói _"diagnose this"_ / _"debug this"_, báo lỗi, có gì đó broken/throwing/failing                                           | Debug khó vì thiếu vòng lặp phản hồi xác định                                                                  | Bug được reproduce và fix, regression test pass, debug logs xóa sạch, commit message ghi rõ hypothesis đúng | Phase 1 (build feedback loop) là cốt lõi. Không proceed Phase 2 nếu chưa có loop | [SKILL.md](../../.claude/skills/diagnose/SKILL.md)                      |
| 17  | `grill-with-docs`               | Thiết kế & Kiến trúc   | Muốn stress-test kế hoạch dựa trên domain model hiện có, cập nhật `CONTEXT.md`/ADRs inline                                  | Kế hoạch mâu thuẫn với thuật ngữ hoặc quyết định đã có trong docs                                              | `CONTEXT.md` được cập nhật inline, ADRs mới (nếu đủ tiêu chí), shared understanding đã được kiểm chứng      | Khác `grill-me`: biết docs domain hiện có và update chúng inline                 | [SKILL.md](../../.claude/skills/grill-with-docs/SKILL.md)               |
| 18  | `improve-codebase-architecture` | Thiết kế & Kiến trúc   | Muốn cải thiện architecture, tìm refactoring opportunities, làm codebase testable/AI-navigable hơn                          | Module shallow gây khó test, khó maintain, phải bounce qua nhiều file để hiểu 1 khái niệm                      | Danh sách deepening opportunities; `CONTEXT.md` được cập nhật khi tìm ra term mới                           | Không propose interfaces ngay — grill user trước                                 | [SKILL.md](../../.claude/skills/improve-codebase-architecture/SKILL.md) |
| 19  | `setup-matt-pocock-skills`      | Tooling & Setup        | Chạy trước khi dùng lần đầu `to-issues`, `to-prd`, `triage`, `diagnose`, `tdd`, `improve-codebase-architecture`, `zoom-out` | Các engineering skills cần biết issue tracker, label vocabulary, và domain layout để hoạt động đúng            | Block `## Agent skills` trong `CLAUDE.md`, 3 files: `issue-tracker.md`, `triage-labels.md`, `domain.md`     | Chỉ cần chạy 1 lần                                                               | [SKILL.md](../../.claude/skills/setup-matt-pocock-skills/SKILL.md)      |
| 20  | `tdd`                           | QA & Issue Tracking    | Muốn build feature/fix bug theo TDD, đề cập _"red-green-refactor"_, muốn test-first development                             | Horizontal slicing tạo tests xấu — test shape thay vì behavior thật                                            | Tests qua public interface chỉ, từng behavior một, mỗi test survive internal refactor                       | Không horizontal slice. Test mô tả behavior — không implementation               | [SKILL.md](../../.claude/skills/tdd/SKILL.md)                           |
| 21  | `to-issues`                     | QA & Issue Tracking    | Muốn convert plan/spec/PRD thành issues, tạo implementation tickets, hoặc _"break this down into issues"_                   | Chia plan thành issues dễ bị horizontal slice — mỗi issue không deliverable độc lập                            | GitHub Issues: Parent / What to build / Acceptance criteria / Blocked by. Label `ready-for-agent`           | Không file paths trong issue body                                                | [SKILL.md](../../.claude/skills/to-issues/SKILL.md)                     |
| 22  | `to-prd`                        | Domain & Documentation | Muốn tạo PRD từ context conversation hiện tại, hoặc _"write a PRD"_                                                         | Tổng hợp thủ công PRD từ nhiều quyết định rải rác trong hội thoại rất mất thời gian                            | GitHub Issue với PRD: Problem Statement / Solution / User Stories / Implementation Decisions / Out of Scope | Không phỏng vấn user — synthesize từ context sẵn có                              | [SKILL.md](../../.claude/skills/to-prd/SKILL.md)                        |
| 23  | `triage`                        | QA & Issue Tracking    | Muốn triage issues, review incoming bugs/features, chuẩn bị issues cho AFK agent                                            | Issues mới vào không được categorize đúng, thiếu thông tin cho agent để pick up                                | Issues được labeled (category + state), agent brief hoặc triage notes comment, wontfix closed               | Mọi comment phải bắt đầu bằng disclaimer AI-generated                            | [SKILL.md](../../.claude/skills/triage/SKILL.md)                        |
| 24  | `zoom-out`                      | Thiết kế & Kiến trúc   | Không quen với đoạn code, cần hiểu context rộng hơn hoặc big picture, hoặc _"zoom out"_ / _"give me the map"_               | Đọc code chi tiết mà không có bản đồ module-level dễ bị lost                                                   | Bản đồ modules + callers theo domain vocabulary                                                             | Cực kỳ ngắn — chỉ là instruction để agent re-orient                              | [SKILL.md](../../.claude/skills/zoom-out/SKILL.md)                      |

---

### 3.1 Quick Reference — chọn skill theo tình huống

| Tình huống                             | Skill                            |
| -------------------------------------- | -------------------------------- |
| Thiết kế API/interface mới             | `/design-an-interface`           |
| Báo cáo bug bằng hội thoại             | `/qa`                            |
| Lên kế hoạch refactor                  | `/request-refactor-plan`         |
| Định nghĩa domain terms, xây glossary  | `/ubiquitous-language`           |
| Block lệnh git nguy hiểm               | `/git-guardrails-claude-code`    |
| Build feature theo TDD                 | `/tdd`                           |
| Convert plan thành issues              | `/to-issues`                     |
| Tạo PRD từ conversation                | `/to-prd`                        |
| Triage issues                          | `/triage`                        |
| Cần hiểu big picture của codebase      | `/zoom-out`                      |
| Stress-test kế hoạch                   | `/grill-me`                      |
| Stress-test kế hoạch với docs hiện có  | `/grill-with-docs`               |
| Cải thiện architecture                 | `/improve-codebase-architecture` |
| Debug có hệ thống                      | `/diagnose`                      |
| Viết/tạo skill mới                     | `/write-a-skill`                 |
| Bàn giao context cho session tiếp theo | `/handoff`                       |
| Phản hồi ngắn gọn, tiết kiệm token     | `/caveman`                       |
| Prototype / sanity-check thiết kế      | `/prototype`                     |
| Chỉnh sửa / revise bài viết            | `/edit-article`                  |
| Tìm/tạo notes trong Obsidian vault     | `/obsidian-vault`                |
| Thay `as` assertions trong tests       | `/migrate-to-shoehorn`           |
| Tạo cấu trúc thư mục exercises         | `/scaffold-exercises`            |
| Cài pre-commit hooks (Husky)           | `/setup-pre-commit`              |
| Setup lần đầu cho engineering skills   | `/setup-matt-pocock-skills`      |

---

## 4. GSD Framework Skills

GSD là framework quản lý toàn vòng đời phần mềm tích hợp với Claude Code — từ ý tưởng đến production.

**Luồng điển hình:** `new-project` → `spec-phase` → `plan-phase` → `execute-phase` → `verify-work` → `ship`

---

### 4.1 Project Lifecycle

| Skill                    | Chức năng                                          |
| ------------------------ | -------------------------------------------------- |
| `gsd-new-project`        | Khởi tạo dự án mới: tạo roadmap, cấu trúc planning |
| `gsd-new-milestone`      | Tạo milestone mới trong dự án                      |
| `gsd-complete-milestone` | Hoàn thành và đóng một milestone                   |
| `gsd-milestone-summary`  | Tóm tắt trạng thái và kết quả của milestone        |

### 4.2 Planning & Phases

| Skill                      | Chức năng                                              |
| -------------------------- | ------------------------------------------------------ |
| `gsd-phase`                | Xem/quản lý phase hiện tại                             |
| `gsd-spec-phase`           | Viết spec (đặc tả kỹ thuật) cho phase                  |
| `gsd-plan-phase`           | Lập kế hoạch chi tiết cho một phase                    |
| `gsd-discuss-phase`        | Thảo luận và phân tích assumptions/decisions cho phase |
| `gsd-execute-phase`        | Thực thi plan của phase                                |
| `gsd-validate-phase`       | Kiểm tra phase đã đạt mục tiêu chưa                    |
| `gsd-ui-phase`             | Phase dành riêng cho UI/frontend                       |
| `gsd-ai-integration-phase` | Phase tích hợp AI/LLM vào ứng dụng                     |
| `gsd-secure-phase`         | Phase kiểm tra bảo mật                                 |
| `gsd-mvp-phase`            | Phase xây dựng MVP nhanh                               |
| `gsd-ultraplan-phase`      | Lập kế hoạch cực kỳ chi tiết (ultra-detailed planning) |
| `gsd-spike`                | Research nhanh một vấn đề kỹ thuật cụ thể              |

### 4.3 Execution & Development

| Skill              | Chức năng                               |
| ------------------ | --------------------------------------- |
| `gsd-fast`         | Thực thi nhanh, ít ceremony             |
| `gsd-quick`        | Làm task nhỏ, không cần planning đầy đủ |
| `gsd-add-tests`    | Thêm tests cho code hiện có             |
| `gsd-map-codebase` | Phân tích và map kiến trúc codebase     |
| `gsd-explore`      | Khám phá codebase để hiểu context       |
| `gsd-import`       | Import/tích hợp tài liệu vào dự án      |
| `gsd-ingest-docs`  | Nhập và phân loại tài liệu planning     |

### 4.4 Review & Audit

| Skill                         | Chức năng                                  |
| ----------------------------- | ------------------------------------------ |
| `gsd-review`                  | Review tổng quan phase/milestone           |
| `gsd-code-review`             | Review code cho bugs, security, chất lượng |
| `gsd-audit-fix`               | Áp dụng các fix từ kết quả audit           |
| `gsd-audit-milestone`         | Audit toàn bộ milestone                    |
| `gsd-audit-uat`               | Kiểm thử chấp nhận người dùng (UAT)        |
| `gsd-ui-review`               | Đánh giá UI theo 6 tiêu chí chất lượng     |
| `gsd-eval-review`             | Review coverage của AI evaluation          |
| `gsd-plan-review-convergence` | Đảm bảo plan hội tụ về mục tiêu            |
| `gsd-verify-work`             | Xác minh công việc đã đạt mục tiêu phase   |

### 4.5 Debug & Fix

| Skill           | Chức năng                                |
| --------------- | ---------------------------------------- |
| `gsd-debug`     | Debug có hệ thống theo scientific method |
| `gsd-forensics` | Điều tra nguyên nhân gốc rễ của vấn đề   |

### 4.6 Workflow & Progress

| Skill             | Chức năng                          |
| ----------------- | ---------------------------------- |
| `gsd-progress`    | Xem tiến độ hiện tại               |
| `gsd-pause-work`  | Tạm dừng công việc, lưu checkpoint |
| `gsd-resume-work` | Tiếp tục công việc từ checkpoint   |
| `gsd-undo`        | Hoàn tác hành động vừa thực hiện   |
| `gsd-update`      | Cập nhật trạng thái task/phase     |
| `gsd-workstreams` | Quản lý nhiều workstream song song |
| `gsd-workspace`   | Xem/quản lý workspace hiện tại     |

### 4.7 Git & Deployment

| Skill           | Chức năng                                         |
| --------------- | ------------------------------------------------- |
| `gsd-pr-branch` | Tạo branch và PR từ phase hiện tại                |
| `gsd-ship`      | Đẩy code lên production                           |
| `gsd-cleanup`   | Dọn dẹp sau khi hoàn thành (xóa temp files, v.v.) |

### 4.8 Intelligence & Analysis

| Skill                   | Chức năng                                  |
| ----------------------- | ------------------------------------------ |
| `gsd-stats`             | Thống kê và metrics của dự án              |
| `gsd-health`            | Kiểm tra "sức khỏe" dự án                  |
| `gsd-surface`           | Làm nổi bật những vấn đề tiềm ẩn           |
| `gsd-profile-user`      | Phân tích hành vi developer để cá nhân hóa |
| `gsd-extract-learnings` | Rút ra bài học từ session/phase            |

### 4.9 Content & Docs

| Skill             | Chức năng                           |
| ----------------- | ----------------------------------- |
| `gsd-docs-update` | Cập nhật tài liệu dự án             |
| `gsd-sketch`      | Phác thảo ý tưởng/design nhanh      |
| `gsd-capture`     | Ghi lại ý tưởng/context nhanh       |
| `gsd-thread`      | Quản lý thread/conversation context |

### 4.10 NS Skills — Autonomous Mode

| Skill             | Chức năng                                |
| ----------------- | ---------------------------------------- |
| `gsd-ns-context`  | Cung cấp context cho chế độ autonomous   |
| `gsd-ns-ideate`   | Ideation trong autonomous mode           |
| `gsd-ns-manage`   | Quản lý tác vụ trong autonomous mode     |
| `gsd-ns-project`  | Project management trong autonomous mode |
| `gsd-ns-review`   | Review trong autonomous mode             |
| `gsd-ns-workflow` | Điều phối workflow tự động               |
| `gsd-autonomous`  | Chạy GSD hoàn toàn tự động               |

### 4.11 Meta & Configuration

| Skill                | Chức năng                         |
| -------------------- | --------------------------------- |
| `gsd-help`           | Hiển thị help về GSD              |
| `gsd-config`         | Cấu hình GSD settings             |
| `gsd-settings`       | Xem/thay đổi settings             |
| `gsd-inbox`          | Quản lý inbox tasks chưa xử lý    |
| `gsd-review-backlog` | Review và prioritize backlog      |
| `gsd-manager`        | Orchestrator chính của GSD system |
| `gsd-graphify`       | Tạo knowledge graph từ GSD data   |

---

### 4.12 Ví dụ thực tế

#### Implement Shopping Cart (TASK-207)

```bash
/gsd-spec-phase     # đặc tả cart API, rules, edge cases
/gsd-plan-phase     # chia task: entity → service → controller → tests
/gsd-execute-phase  # thực thi từng bước
/gsd-add-tests      # thêm unit/e2e tests
/gsd-code-review    # review trước khi merge
/gsd-pr-branch      # tạo PR
```

#### Bug production — giỏ hàng tính sai giá

```bash
/gsd-debug          # reproduce → hypothesize → fix → test
/gsd-code-review    # review fix
/gsd-ship           # deploy hotfix
```

#### Bắt đầu giai đoạn Scale

```bash
/gsd-new-milestone      # tạo milestone mới
/gsd-plan-phase         # plan toàn bộ phase
/gsd-execute-phase      # chạy từng task
/gsd-verify-work        # verify đạt goal
/gsd-complete-milestone # đóng milestone
```

---

### 4.13 Nguyên tắc chọn skill GSD

| Tình huống                    | Skill                                          |
| ----------------------------- | ---------------------------------------------- |
| Không biết bắt đầu từ đâu     | `/gsd-help`                                    |
| Dự án hoàn toàn mới           | `new-project` → `plan-phase` → `execute-phase` |
| Trong phase đang chạy         | `execute-phase` hoặc `quick` / `fast`          |
| Có vấn đề / bug               | `debug` hoặc `forensics`                       |
| Sắp xong phase                | `verify-work` → `pr-branch` → `ship`           |
| Cần xem tiến độ               | `progress`                                     |
| Muốn dừng và tiếp tục hôm sau | `pause-work` / `resume-work`                   |
