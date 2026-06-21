# Skills Reference — `.claude/skills`

Tài liệu mô tả các skill cục bộ trong dự án, bao gồm cả skills mới được Matt Pocock cập nhật.

---

## Bảng tổng hợp skills

| #   | Skill                                         | Nhóm                   | Gọi khi (Trigger)                                                                                                 | Vấn đề giải quyết                                                                                            | Cách hoạt động                                                                                                                                                                                                                                                                                      | Đầu ra                                                                                                                        | Lưu ý quan trọng                                                                                                                                    |
| --- | --------------------------------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **design-an-interface**                       | Thiết kế & Kiến trúc   | Muốn thiết kế API/interface mới, so sánh cách tổ chức module, hoặc nói _"design it twice"_                        | Ý tưởng đầu tiên hiếm khi là tốt nhất — commit sớm vào 1 thiết kế dễ dẫn đến refactor tốn kém sau            | Spawn 3+ sub-agent song song, mỗi agent nhận ràng buộc khác nhau (ít method nhất / linh hoạt nhất / tối ưu use case phổ biến / theo paradigm cụ thể). So sánh về: độ đơn giản, tính general-purpose, hiệu quả implementation, và "depth"                                                            | Các bản thiết kế interface kèm ví dụ sử dụng, phân tích trade-off, gợi ý tổng hợp                                            | Không implement — chỉ về hình dạng interface. Nguồn gốc từ _A Philosophy of Software Design_                                                        |
| 2   | **qa**                                        | QA & Issue Tracking    | Muốn báo cáo bug bằng hội thoại, chạy phiên QA, hoặc nói _"QA session"_                                           | Tự soạn GitHub Issue mất thời gian, dễ thiếu ngữ cảnh và dùng sai tên domain                                 | (1) Lắng nghe, hỏi tối đa 2-3 câu. (2) Spawn agent khám phá codebase học domain language. (3) Quyết định 1 issue hay tách nhiều. (4) Tạo Issue qua `gh issue create` ngay                                                                                                                           | GitHub Issues với template: _What happened / What expected / Steps to reproduce / Additional context_                        | Issues phải durable — không chứa file path hay line number                                                                                          |
| 3   | **request-refactor-plan**                     | Thiết kế & Kiến trúc   | Muốn lên kế hoạch refactor, tạo RFC, hoặc chia nhỏ refactor thành các bước an toàn                                | Refactor không có kế hoạch dễ scope creep, gây regression, hoặc bỏ sót test coverage                         | (1) Hỏi user mô tả chi tiết. (2) Khám phá codebase. (3) Đề xuất lựa chọn khác. (4) Xác định phạm vi. (5) Kiểm tra test coverage. (6) Chia tiny commits (Martin Fowler). (7) Tạo GitHub Issue                                                                                                        | GitHub Issue với: Problem Statement, Solution, danh sách Commits, Decision Document, Testing Decisions                       | Issue không chứa file path cụ thể. Phần Commits là trọng tâm — càng nhỏ càng tốt                                                                    |
| 4   | **ubiquitous-language**                       | Domain & Documentation | Muốn định nghĩa domain terms, xây glossary, hoặc đề cập _"DDD"_ / _"domain model"_                                | Cùng khái niệm gọi nhiều tên khác nhau gây nhầm lẫn trong code, docs và team                                 | Quét hội thoại tìm danh từ/động từ domain-relevant. Phát hiện synonym và ambiguity. Đề xuất thuật ngữ chuẩn. Viết ví dụ hội thoại Dev ↔ Domain Expert                                                                                                                                               | `UBIQUITOUS_LANGUAGE.md` với bảng thuật ngữ, cột "Aliases to avoid", quan hệ terms, ví dụ hội thoại                          | Chỉ include domain terms — bỏ qua khái niệm lập trình thuần túy                                                                                     |
| 5   | **git-guardrails-claude-code**                | Tooling & Setup        | Muốn ngăn Claude chạy lệnh git nguy hiểm, hoặc block `git push`/`reset` trong Claude Code                         | Claude Code có thể tự ý chạy `git push --force` hay `git reset --hard` mà không có confirmation              | Cài PreToolUse hook intercept mọi lệnh Bash. Block lệnh nguy hiểm với exit code 2: `push`, `reset --hard`, `clean -f`, `branch -D`, `checkout .`, `restore .`                                                                                                                                       | Script `.claude/hooks/block-dangerous-git.sh` + entry trong `settings.json`                                                  | Hỏi user muốn cài project-scope hay global-scope                                                                                                    |
| 6   | **migrate-to-shoehorn**                       | Tooling & Setup        | Muốn thay `as` assertions trong tests, đề cập shoehorn, hoặc cần truyền partial data an toàn                      | `as Type` trong tests che giấu lỗi TypeScript thật                                                           | Tìm `as [Type]` và `as unknown as Type` trong `*.test.ts`/`*.spec.ts`. Thay bằng `fromPartial()` hoặc `fromAny()`. Thêm import. Chạy type check                                                                                                                                                     | Test files được migrate, imports được thêm, type check pass                                                                  | Chỉ dùng trong test code — không bao giờ dùng shoehorn trong production                                                                             |
| 7   | **scaffold-exercises**                        | Tooling & Setup        | Muốn tạo cấu trúc thư mục exercises, tạo stubs, hoặc thiết lập section mới cho khóa học                           | Tạo thủ công hàng chục thư mục exercises với quy ước đặt tên rất dễ sai                                      | Parse kế hoạch → tạo thư mục `XX-section/XX.YY-exercise/{problem,solution,explainer}/` → tạo stub `readme.md` → lint → fix → commit                                                                                                                                                                 | Cấu trúc thư mục exercises đúng chuẩn, lint pass, commit sẵn sàng                                                            | Dùng `git mv` khi đổi tên. Không để `.gitkeep` hay `speaker-notes.md`                                                                               |
| 8   | **setup-pre-commit**                          | Tooling & Setup        | Muốn thêm pre-commit hooks, cài Husky, hoặc enforce format/typecheck/test trước mỗi commit                        | Code formatting không nhất quán, type errors và test failures được commit vào repo                           | (1) Detect package manager. (2) Install husky lint-staged prettier. (3) `npx husky init`. (4) Tạo `.husky/pre-commit`. (5) Tạo `.lintstagedrc` và `.prettierrc`. (6) Commit smoke test                                                                                                              | `.husky/pre-commit`, `.lintstagedrc`, `.prettierrc`, `prepare` script trong `package.json`                                   | Husky v9+ không cần shebang                                                                                                                         |
| 9   | **edit-article**                              | Domain & Documentation | Muốn chỉnh sửa, revise hoặc cải thiện một bản thảo bài viết                                                       | Bài viết thô thường có sections sắp xếp sai thứ tự logic, đoạn văn quá dài                                   | (1) Chia bài viết thành sections theo headings, ánh xạ thứ tự phụ thuộc như DAG. Xác nhận với user. (2) Rewrite từng section: clarity, coherence, flow — mỗi đoạn ≤ 240 ký tự                                                                                                                       | Bài viết được rewrite từng section theo thứ tự logic                                                                         | `disable-model-invocation: true`. Skill đơn giản — chỉ 2 bước                                                                                       |
| 10  | **obsidian-vault**                            | Domain & Documentation | Muốn tìm, tạo hoặc quản lý notes trong Obsidian vault                                                             | Vault có path cố định và quy ước đặt tên/linking riêng                                                       | Vault ở `/mnt/d/Obsidian Vault/AI Research/`. Tìm bằng Glob/Grep. Tạo notes theo Title Case, thêm `[[wikilinks]]`. Index notes là danh sách wikilinks thuần túy                                                                                                                                     | Notes được tìm thấy, hoặc notes mới với wikilinks và index entries                                                           | Tổ chức phẳng — không dùng folder. Tên file phải Title Case                                                                                         |
| 11  | **prototype**                                 | Thiết kế & Kiến trúc   | Muốn prototype, sanity-check state machine, mockup UI, hoặc nói _"prototype this"_                                | Commit sớm vào implementation trước khi validate là rủi ro lớn                                               | Xác định câu hỏi → phân nhánh: **Logic**: terminal app tương tác nhỏ in state sau mỗi action. **UI**: route với nhiều variations, chuyển đổi bằng URL param + floating bar                                                                                                                          | Throwaway code chạy được bằng 1 lệnh. Kèm ghi chú câu hỏi đã trả lời                                                         | `disable-model-invocation: true`. Không tests, không abstractions. Mục tiêu: học nhanh rồi xóa                                                      |
| 12  | **caveman**                                   | Meta Skills            | Nói _"caveman mode"_, _"less tokens"_, _"be brief"_, hoặc gọi `/caveman`                                          | Phản hồi mặc định của AI dài dòng với filler, tốn token và làm chậm workflow                                 | Bỏ hoàn toàn: articles, filler words, pleasantries, hedging. Dùng fragments, arrows, viết tắt. Giữ nguyên: technical terms, code blocks, error messages                                                                                                                                             | Phản hồi giảm ~75% token, giữ 100% độ chính xác kỹ thuật                                                                     | Duy trì suốt session, tắt khi nói _"stop caveman"_                                                                                                  |
| 13  | **grill-me** _(updated)_                      | Thiết kế & Kiến trúc   | Muốn stress-test kế hoạch, được hỏi bài về thiết kế, hoặc nói _"grill me"_                                        | Kế hoạch thường có assumption ẩn — chỉ phát hiện khi bị hỏi dồn                                              | **Shell skill** — delegate sang `/grilling` (skill lõi mới). Không còn chứa logic nội tuyến                                                                                                                                                                                                         | Như `/grilling`: shared understanding đã được kiểm chứng về thiết kế                                                         | `disable-model-invocation: true`. Dùng `/grilling` trực tiếp nếu muốn rõ ràng hơn                                                                   |
| 14  | **handoff**                                   | Domain & Documentation | Muốn bàn giao context cho agent khác hoặc session làm việc tiếp theo                                              | Context window có giới hạn — session mới không có memory về những gì đã làm                                  | Nén hội thoại thành handoff document. Không duplicate artifacts (PRD, ADR, issues, diffs) — chỉ reference. Điều chỉnh nội dung theo argument. Đề xuất skills nên dùng                                                                                                                               | File markdown tại `mktemp -t handoff-XXXXXX.md`                                                                              | `disable-model-invocation: true`. Đọc file trước khi write                                                                                          |
| 15  | **write-a-skill**                             | Meta Skills            | Muốn tạo, viết hoặc build một skill mới                                                                           | Skill viết sai cấu trúc hoặc description mơ hồ sẽ không được agent trigger đúng lúc                          | (1) Thu thập yêu cầu. (2) Soạn SKILL.md với frontmatter đúng. (3) Tách file phụ nếu > 100 dòng. (4) Review với user. (5) Verify checklist                                                                                                                                                           | Thư mục `skill-name/SKILL.md` trong `.claude/skills/`                                                                        | Description là thứ duy nhất agent thấy khi quyết định load skill. Max 1024 chars                                                                    |
| 16  | **diagnose**                                  | QA & Issue Tracking    | Nói _"diagnose this"_ / _"debug this"_, báo lỗi, có gì đó broken/throwing/failing                                 | Debug khó vì thiếu vòng lặp phản hồi xác định                                                                | **6 pha**: (1) Build feedback loop. (2) Reproduce. (3) Hypothesise 3-5 ranked hypothesis. (4) Instrument từng probe — 1 biến/lần. (5) Fix + regression test. (6) Cleanup + post-mortem                                                                                                              | Bug reproduce + fix, regression test pass, debug logs xóa sạch                                                               | Phase 1 là cốt lõi — không proceed Phase 2 nếu chưa có loop tin cậy                                                                                 |
| 17  | **grill-with-docs** _(updated)_               | Thiết kế & Kiến trúc   | Muốn stress-test kế hoạch có liên kết đến domain model hiện có, cập nhật `CONTEXT.md`/ADRs inline                 | Kế hoạch mâu thuẫn với thuật ngữ hoặc quyết định đã có trong docs                                            | **Shell skill** — delegate sang `/grilling` + `/domain-modeling`. Không còn chứa logic nội tuyến. File phụ `ADR-FORMAT.md` và `CONTEXT-FORMAT.md` đã bị xóa (chuyển vào `domain-modeling/`)                                                                                                         | Như chạy cả 2 skills: grilling + domain model được cập nhật inline                                                           | `disable-model-invocation: true`. Dùng cặp `/grilling` + `/domain-modeling` trực tiếp nếu muốn rõ ràng hơn                                          |
| 18  | **improve-codebase-architecture** _(updated)_ | Thiết kế & Kiến trúc   | Muốn cải thiện architecture, tìm refactoring opportunities, làm codebase testable/AI-navigable hơn                | Module shallow gây khó test, khó maintain, phải bounce qua nhiều file                                        | `disable-model-invocation: true`. (1) Đọc `CONTEXT.md` + ADRs. (2) Explore tìm friction. (3) Viết **HTML report** vào OS temp dir với candidate cards. (4) Grill user về candidate đã chọn qua `/grilling`. (5) Cập nhật domain model qua `/domain-modeling`. (6) Offer ADR nếu candidate bị reject | HTML report với candidate cards (before/after viz). `CONTEXT.md` cập nhật. ADR nếu cần                                       | Vocabulary từ `/codebase-design` (module/interface/seam/adapter/depth/leverage/locality). `LANGUAGE.md` cũ đã bị xóa. Không propose interface ngay  |
| 19  | **setup-matt-pocock-skills** _(updated)_      | Tooling & Setup        | Chạy trước khi dùng `to-issues`, `to-prd`, `triage`, `diagnose`, `tdd`, `improve-codebase-architecture`           | Các engineering skills cần biết issue tracker, label vocabulary, domain layout trước khi hoạt động đúng      | (1) Explore git remote, CLAUDE.md, CONTEXT.md, docs/adr/, docs/agents/. (2) Hỏi user **4 quyết định**: A) Issue tracker (GitHub/GitLab/Local/Other). B) **PRs/MRs có là triage surface không** (GitHub/GitLab only). C) Triage labels. D) Domain layout. (3) Write config files                     | Block `## Agent skills` trong CLAUDE.md, 3 files: `docs/agents/{issue-tracker,triage-labels,domain}.md`                      | `disable-model-invocation: true`. **Mới**: hỏi thêm về PR/MR triage surface — khi `yes`, `/triage` sẽ include external PRs                          |
| 20  | **tdd** _(updated)_                           | QA & Issue Tracking    | Muốn build feature/fix bug theo TDD, đề cập _"red-green-refactor"_, muốn integration tests                        | Horizontal slicing tạo tests xấu — test shape thay vì behavior thật                                          | Vertical slices — 1 test → 1 impl → repeat. (1) Planning: đọc `CONTEXT.md` (nếu có), confirm interface + behaviors. (2) Xác định cơ hội deep modules — dùng `/codebase-design`. (3) Tracer bullet test e2e đầu tiên. (4) Incremental RED→GREEN→Refactor                                             | Tests qua public interface chỉ, từng behavior một, survive internal refactor                                                 | Không horizontal slice. Không mock internal collaborators. File phụ `deep-modules.md`, `interface-design.md` đã xóa → dùng `/codebase-design`       |
| 21  | **to-issues** _(updated)_                     | QA & Issue Tracking    | Muốn convert plan/spec/PRD thành issues, tạo implementation tickets, hoặc nói _"break this down into issues"_     | Chia plan thành issues dễ bị horizontal slice — mỗi issue không deliverable độc lập                          | (1) Gather context. (2) Explore codebase. (3) Draft vertical slices. (4) Quiz user về granularity, dependencies. (5) Publish issues in dependency order                                                                                                                                             | GitHub Issues với: Parent / What to build / Acceptance criteria / Blocked by. Label `ready-for-agent`                        | `disable-model-invocation: true`. Mỗi slice phải demoable. Không file paths trong issue body                                                        |
| 22  | **to-prd** _(updated)_                        | Domain & Documentation | Muốn tạo PRD từ context conversation hiện tại, không muốn bị phỏng vấn thêm                                       | Tổng hợp thủ công PRD từ nhiều quyết định rải rác trong hội thoại rất mất thời gian                          | (1) Explore codebase dùng domain vocabulary. (2) Sketch seams (prefer existing, highest seam). (3) Confirm với user. (4) Write PRD. (5) Publish với label `ready-for-agent`                                                                                                                         | GitHub Issue với PRD: Problem Statement / Solution / User Stories / Implementation Decisions / Testing Decisions             | `disable-model-invocation: true`. Không phỏng vấn user — synthesize từ context. Không file paths trong Implementation Decisions                     |
| 23  | **triage** _(updated)_                        | QA & Issue Tracking    | Muốn triage issues (và external PRs nếu được cấu hình), chuẩn bị issues cho AFK agent, quản lý issue workflow     | Issues mới vào không được categorize đúng, thiếu thông tin cho agent để pick up                              | State machine: unlabeled → `needs-triage` → {`needs-info` / `ready-for-agent` / `ready-for-human` / `wontfix`}. **PR support**: nếu được cấu hình, triage cả external PRs (PR = issue with code). Step 4 dùng `/grilling` + `/domain-modeling`. Step 1 check `.out-of-scope/` KB                    | Issues labeled, agent brief hoặc triage notes comment, wontfix closed. Rejected enhancements ghi vào `.out-of-scope/`        | `disable-model-invocation: true`. Mọi comment phải bắt đầu bằng AI-generated disclaimer. Resolve `#42` là issue hay PR trước khi act                |
| 24  | **zoom-out**                                  | Thiết kế & Kiến trúc   | Không quen với đoạn code, cần hiểu context rộng hơn, hoặc nói _"zoom out"_ / _"give me the map"_                  | Đọc code chi tiết mà không có bản đồ module-level dễ bị lost                                                 | Agent tự re-orient: đi lên 1 layer abstraction, tạo bản đồ tất cả relevant modules và callers, dùng vocabulary từ domain glossary                                                                                                                                                                   | Bản đồ modules + callers theo domain vocabulary                                                                              | `disable-model-invocation: true`. Skill cực kỳ ngắn — instruction để agent re-orient                                                                |
| 25  | **grilling** _(NEW)_                          | Thiết kế & Kiến trúc   | Core grilling skill — được gọi bởi `/grill-me`, `/grill-with-docs`, `/triage`, `/decision-mapping`                | Kế hoạch có assumption ẩn và dependency chưa giải quyết — cần phỏng vấn có hệ thống theo decision tree       | Phỏng vấn relentlessly: đi theo từng nhánh decision tree, resolve dependency giữa decisions theo thứ tự. Với mỗi câu: đưa ra recommended answer trước. Nếu câu hỏi có thể trả lời bằng cách đọc code → tự đọc thay vì hỏi. Hỏi từng câu một                                                         | Shared understanding đã được kiểm chứng về toàn bộ thiết kế, không còn assumption mơ hồ                                      | Skill lõi — thường được gọi từ skill khác, không cần gọi trực tiếp nếu dùng `/grill-me`                                                             |
| 26  | **domain-modeling** _(NEW)_                   | Domain & Documentation | Muốn build/sharpen domain model, pin down thuật ngữ, ghi lại ADR, hoặc được gọi bởi skill khác cần maintain model | Thuật ngữ mơ hồ, mâu thuẫn với CONTEXT.md hiện có, hoặc quyết định quan trọng chưa được ghi lại              | Challenge terminology vs CONTEXT.md. Sharpen fuzzy language (đề xuất canonical term). Stress-test domain relationships với concrete scenarios. Cross-reference code vs phát biểu của user. Update `CONTEXT.md` ngay khi term resolve (không batch). Offer ADR chỉ khi đủ 3 tiêu chí                 | `CONTEXT.md` được cập nhật inline, ADRs mới (nếu đủ tiêu chí: hard-to-reverse + surprising + real trade-off)                 | Tách từ `grill-with-docs`. `CONTEXT.md` chỉ là glossary — không chứa implementation details. Tạo file lazily khi cần                                |
| 27  | **codebase-design** _(NEW)_                   | Thiết kế & Kiến trúc   | Muốn thiết kế/improve module interface, tìm deepening opportunities, quyết định seam placement, làm code testable | Thiếu vocabulary và principles chung để nói về deep modules — mỗi skill dùng cách diễn đạt khác nhau         | Cung cấp shared vocabulary và principles: module/interface/implementation/depth/seam/adapter/leverage/locality. Diagrams deep vs shallow. Testability principles. Deepening strategy (`DEEPENING.md`). Design-it-twice (`DESIGN-IT-TWICE.md`)                                                       | Vocabulary dùng nhất quán, decisions về seam placement, interface redesigned theo principles                                 | Tổng hợp từ `LANGUAGE.md`, `deep-modules.md`, `interface-design.md` (tất cả đã bị xóa). Được reference bởi `improve-codebase-architecture` và `tdd` |
| 28  | **decision-mapping** _(NEW)_                  | Thiết kế & Kiến trúc   | Có ý tưởng loose cần nhiều hơn 1 agent session để thành plan — gọi khi idea cần research/prototype/discussion     | Loose idea không thể plan ngay trong 1 session — cần xác định open decisions và resolve từng cái theo thứ tự | **Bootstrap**: grill + domain-modeling để surface open decisions → viết decision map (fog-of-war structure). **Resume**: load map, resolve ticket được chỉ định (gọi `/grilling`, `/prototype`, hoặc research), ghi kết quả, thêm tickets mới được khám phá                                         | File Markdown decision map với numbered tickets. Mỗi ticket: blocked-by, type (Research/Prototype/Discuss), Question, Answer | `disable-model-invocation: true`. Mỗi ticket = 1 session ~100K token. Nếu ban đầu không có fog-of-war → đề nghị skip map, implement ngay            |

---

## Changelog — Cập nhật skills (Matt Pocock)

### Thay đổi lớn nhất: Tách thành skills nhỏ, chuyên biệt

Matt Pocock đã **extract** logic từ các skills lớn thành skills nhỏ độc lập, để dễ compose và reuse:

| Skills cũ (logic nội tuyến)                  | Skills mới (tách ra)                                        |
| -------------------------------------------- | ----------------------------------------------------------- |
| `grill-me`                                   | → gọi `/grilling`                                           |
| `grill-with-docs`                            | → gọi `/grilling` + `/domain-modeling`                      |
| `improve-codebase-architecture`              | → gọi `/codebase-design` + `/grilling` + `/domain-modeling` |
| `tdd` (deep-modules.md, interface-design.md) | → gọi `/codebase-design`                                    |
| `triage` step 4                              | → gọi `/grilling` + `/domain-modeling`                      |

### Skills mới được tạo

#### `grilling` — Core interviewing loop

- Extracted từ `grill-me`. Là lõi của tất cả "grilling sessions".
- Phỏng vấn theo decision tree, từng câu một, đưa recommended answer trước.

#### `domain-modeling` — Maintain domain model

- Extracted từ `grill-with-docs`. Chứa `ADR-FORMAT.md` và `CONTEXT-FORMAT.md` (trước kia trong `grill-with-docs/`).
- Challenge terminology, sharpen fuzzy language, update `CONTEXT.md` inline, offer ADRs sparingly.

#### `codebase-design` — Shared vocabulary cho deep modules

- Tổng hợp từ 3 files đã bị xóa: `improve-codebase-architecture/LANGUAGE.md`, `tdd/deep-modules.md`, `tdd/interface-design.md`.
- Chứa: glossary (module/interface/seam/adapter/depth/leverage/locality), deep vs shallow diagrams, testability principles.
- Thêm: `DEEPENING.md` (deepening strategy) và `DESIGN-IT-TWICE.md` (parallel interface design).

#### `decision-mapping` — Stateful multi-session decision tracking

- **Hoàn toàn mới**. Dành cho loose ideas cần nhiều sessions.
- Tạo decision map (fog-of-war structure), drive user qua từng ticket theo thứ tự dependency.
- 3 ticket types: Research / Prototype / Discuss.

### Tính năng mới trong skills hiện có

#### `triage` — PR/MR triage support

- Nếu được cấu hình, triage cả external PRs (PR = issue with code, same state machine).
- Bước 4 grill dùng `/grilling` + `/domain-modeling` thay vì inline.
- Phân biệt `wontfix` rõ hơn: already-implemented vs rejected — chỉ ghi vào `.out-of-scope/` KB khi là rejected enhancement (không ghi khi already-implemented).

#### `setup-matt-pocock-skills` — PR/MR triage surface config

- Thêm câu hỏi mới: **"PRs có là request surface không?"** (GitHub/GitLab only, default: no).
- Khi `yes`, `issue-tracker.md` chứa hướng dẫn triage PRs với `gh pr`/`glab mr`.
- Summary line trong `CLAUDE.md` giờ bao gồm PR triage setting.

#### `review` — Validation trước khi chạy sub-agents

- Thêm bước verify fixed point resolves và diff non-empty trước khi spawn parallel agents.
- End summary: báo worst issue per axis riêng — không pick 1 winner across axes.
- Standards sources: làm gọn hướng dẫn (thay vì liệt kê cụ thể).

#### `teach` — Rework lớn về lesson structure

- Bỏ `GLOSSARY.md` → thay bằng `./reference/*.html` (HTML reference documents, đẹp, print-friendly).
- Thêm `./lessons/*.html` — mỗi lesson là 1 HTML file tự chứa (Tufte-style, ngắn, completable quickly).
- Thêm `./assets/*` — reusable components (stylesheets, quiz widgets, simulators) shared across lessons.
- Phân biệt **Fluency strength** (in-the-moment retrieval) vs **Storage strength** (long-term retention).
- Quiz format: mỗi answer phải cùng số words/characters — không hint qua formatting.
- Thêm `NOTES.md` — scratchpad cho user preferences.

### Files đã bị xóa

| File đã xóa                                                        | Nội dung đã chuyển sang                                             |
| ------------------------------------------------------------------ | ------------------------------------------------------------------- |
| `.claude/skills/grill-with-docs/ADR-FORMAT.md`                     | `.claude/skills/domain-modeling/ADR-FORMAT.md`                      |
| `.claude/skills/grill-with-docs/CONTEXT-FORMAT.md`                 | `.claude/skills/domain-modeling/CONTEXT-FORMAT.md`                  |
| `.claude/skills/improve-codebase-architecture/LANGUAGE.md`         | `.claude/skills/codebase-design/SKILL.md` (glossary section)        |
| `.claude/skills/improve-codebase-architecture/DEEPENING.md`        | `.claude/skills/codebase-design/DEEPENING.md`                       |
| `.claude/skills/improve-codebase-architecture/INTERFACE-DESIGN.md` | `.claude/skills/codebase-design/DESIGN-IT-TWICE.md`                 |
| `.claude/skills/tdd/deep-modules.md`                               | `.claude/skills/codebase-design/SKILL.md` (deep vs shallow section) |
| `.claude/skills/tdd/interface-design.md`                           | `.claude/skills/codebase-design/SKILL.md` (testability section)     |

### Thêm `disable-model-invocation: true`

Các skills sau giờ là "shell skills" (chỉ delegate sang skills khác, không có logic nội tuyến):

- `grill-me`, `grill-with-docs`, `improve-codebase-architecture`, `prototype`, `handoff`, `edit-article`, `to-issues`, `to-prd`, `triage`, `decision-mapping`

---

## Hướng dẫn sử dụng Skills

### Cú pháp gọi skill

```
/tên-skill
```

Ví dụ:

```
/grilling
/domain-modeling
/codebase-design
/decision-mapping
```

### Khi nào dùng skill nào?

**Stress-test kế hoạch**

```
/grill-me           → shell gọi /grilling
/grilling           → trực tiếp (nếu muốn)
/grill-with-docs    → grilling + cập nhật CONTEXT.md/ADRs inline
```

**Thiết kế module / interface**

```
/codebase-design    → vocabulary + principles cho deep modules
/design-an-interface → design-it-twice với parallel sub-agents
```

**Domain model**

```
/domain-modeling    → build/sharpen CONTEXT.md và ADRs
/ubiquitous-language → xây glossary từ conversation
```

**Idea mới cần nhiều sessions**

```
/decision-mapping   → tạo decision map, drive qua từng ticket
```

**Bắt đầu dự án mới**

```
/gsd-new-project
```

**Làm việc trong 1 phase — luồng chuẩn**

```
1. /gsd-spec-phase     → viết đặc tả kỹ thuật
2. /gsd-plan-phase     → lập kế hoạch task chi tiết
3. /gsd-execute-phase  → thực thi từng task
4. /gsd-verify-work    → kiểm tra đã đạt mục tiêu chưa
5. /gsd-ship           → đẩy lên production
```

**Làm nhanh không cần ceremony**

| Tình huống                      | Skill        |
| ------------------------------- | ------------ |
| Task nhỏ, fix lẹ                | `/gsd-quick` |
| Biết làm gì rồi, muốn chạy ngay | `/gsd-fast`  |
| Research kỹ thuật chưa biết     | `/gsd-spike` |

**Debug & sửa lỗi**

| Tình huống                    | Skill            |
| ----------------------------- | ---------------- |
| Có bug, chưa biết nguyên nhân | `/gsd-debug`     |
| Muốn tìm root cause sâu hơn   | `/gsd-forensics` |

**Review & kiểm tra chất lượng**

| Tình huống                     | Skill                  |
| ------------------------------ | ---------------------- |
| Review code trước khi merge    | `/gsd-code-review`     |
| Kiểm tra UI đạt chuẩn chưa     | `/gsd-ui-review`       |
| Kiểm tra toàn bộ milestone     | `/gsd-audit-milestone` |
| UAT với user/stakeholder       | `/gsd-audit-uat`       |
| Xác minh phase đã xong thật sự | `/gsd-verify-work`     |

**Quản lý tiến độ**

| Tình huống                   | Skill              |
| ---------------------------- | ------------------ |
| Xem đang làm đến đâu         | `/gsd-progress`    |
| Dừng giữa chừng, lưu context | `/gsd-pause-work`  |
| Tiếp tục hôm qua             | `/gsd-resume-work` |
| Lỡ làm sai, muốn quay lại    | `/gsd-undo`        |

**Hiểu codebase**

| Tình huống                     | Skill               |
| ------------------------------ | ------------------- |
| Mới vào project, muốn overview | `/gsd-map-codebase` |
| Muốn đào sâu 1 module cụ thể   | `/gsd-explore`      |

**Git & triển khai**

| Tình huống                   | Skill            |
| ---------------------------- | ---------------- |
| Tạo PR từ công việc hiện tại | `/gsd-pr-branch` |
| Deploy lên production        | `/gsd-ship`      |
| Dọn dẹp sau khi xong phase   | `/gsd-cleanup`   |

**Tài liệu**

| Tình huống                     | Skill              |
| ------------------------------ | ------------------ |
| Cập nhật docs sau khi thay đổi | `/gsd-docs-update` |
| Phác thảo ý tưởng nhanh        | `/gsd-sketch`      |
| Ghi lại quyết định quan trọng  | `/gsd-capture`     |

### Ví dụ thực tế trong project này

**Scenario: Implement Shopping Cart (TASK-207)**

```
/gsd-spec-phase    → đặc tả cart API, rules, edge cases
/gsd-plan-phase    → chia task: entity → service → controller → tests
/gsd-execute-phase → thực thi từng bước
/gsd-add-tests     → thêm unit/e2e tests
/gsd-code-review   → review trước khi merge
/gsd-pr-branch     → tạo PR
```

**Scenario: Bug production — giỏ hàng tính sai giá**

```
/gsd-debug        → reproduce → hypothesize → fix → test
/gsd-code-review  → review fix
/gsd-ship         → deploy hotfix
```

**Scenario: Bắt đầu giai đoạn Scale**

```
/gsd-new-milestone      → tạo milestone mới
/gsd-plan-phase         → plan toàn bộ phase
/gsd-execute-phase      → chạy từng task
/gsd-verify-work        → verify đạt goal
/gsd-complete-milestone → đóng milestone
```

### Nguyên tắc chọn skill

1. **Không biết bắt đầu từ đâu** → `/gsd-help`
2. **Dự án mới** → `new-project` → `plan-phase` → `execute-phase`
3. **Trong phase đang chạy** → `execute-phase` hoặc `quick`/`fast`
4. **Có vấn đề** → `debug` hoặc `forensics`
5. **Sắp xong** → `verify-work` → `pr-branch` → `ship`

---

## GSD Skills (Get Stuff Done Framework)

GSD là framework quản lý toàn vòng đời phần mềm tích hợp với Claude Code — từ ý tưởng đến production. Luồng điển hình: `new-project` → `plan-phase` → `execute-phase` → `verify-work` → `ship`.

### Project Lifecycle (Vòng đời dự án)

| Skill                    | Chức năng                                          |
| ------------------------ | -------------------------------------------------- |
| `gsd-new-project`        | Khởi tạo dự án mới: tạo roadmap, cấu trúc planning |
| `gsd-new-milestone`      | Tạo milestone mới trong dự án                      |
| `gsd-complete-milestone` | Hoàn thành và đóng một milestone                   |
| `gsd-milestone-summary`  | Tóm tắt trạng thái và kết quả của milestone        |

### Planning & Phases (Lập kế hoạch)

| Skill                      | Chức năng                                              |
| -------------------------- | ------------------------------------------------------ |
| `gsd-phase`                | Xem/quản lý phase hiện tại                             |
| `gsd-plan-phase`           | Lập kế hoạch chi tiết cho một phase                    |
| `gsd-spec-phase`           | Viết spec (đặc tả kỹ thuật) cho phase                  |
| `gsd-discuss-phase`        | Thảo luận và phân tích assumptions/decisions cho phase |
| `gsd-execute-phase`        | Thực thi plan của phase                                |
| `gsd-validate-phase`       | Kiểm tra phase đã đạt mục tiêu chưa                    |
| `gsd-ui-phase`             | Phase dành riêng cho UI/frontend                       |
| `gsd-ai-integration-phase` | Phase tích hợp AI/LLM vào ứng dụng                     |
| `gsd-secure-phase`         | Phase kiểm tra bảo mật                                 |
| `gsd-mvp-phase`            | Phase xây dựng MVP nhanh                               |
| `gsd-ultraplan-phase`      | Lập kế hoạch cực kỳ chi tiết (ultra-detailed planning) |
| `gsd-spike`                | Research nhanh một vấn đề kỹ thuật cụ thể              |

### Execution & Development (Thực thi)

| Skill              | Chức năng                               |
| ------------------ | --------------------------------------- |
| `gsd-fast`         | Thực thi nhanh, ít ceremony             |
| `gsd-quick`        | Làm task nhỏ, không cần planning đầy đủ |
| `gsd-add-tests`    | Thêm tests cho code hiện có             |
| `gsd-map-codebase` | Phân tích và map kiến trúc codebase     |
| `gsd-explore`      | Khám phá codebase để hiểu context       |
| `gsd-import`       | Import/tích hợp tài liệu vào dự án      |
| `gsd-ingest-docs`  | Nhập và phân loại tài liệu planning     |

### Review & Audit (Đánh giá)

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

### Debug & Fix (Gỡ lỗi)

| Skill           | Chức năng                                |
| --------------- | ---------------------------------------- |
| `gsd-debug`     | Debug có hệ thống theo scientific method |
| `gsd-forensics` | Điều tra nguyên nhân gốc rễ của vấn đề   |

### Workflow & Progress (Quản lý tiến độ)

| Skill             | Chức năng                          |
| ----------------- | ---------------------------------- |
| `gsd-progress`    | Xem tiến độ hiện tại               |
| `gsd-pause-work`  | Tạm dừng công việc, lưu checkpoint |
| `gsd-resume-work` | Tiếp tục công việc từ checkpoint   |
| `gsd-undo`        | Hoàn tác hành động vừa thực hiện   |
| `gsd-update`      | Cập nhật trạng thái task/phase     |
| `gsd-workstreams` | Quản lý nhiều workstream song song |
| `gsd-workspace`   | Xem/quản lý workspace hiện tại     |

### Git & Deployment (Git & triển khai)

| Skill           | Chức năng                                         |
| --------------- | ------------------------------------------------- |
| `gsd-pr-branch` | Tạo branch và PR từ phase hiện tại                |
| `gsd-ship`      | Đẩy code lên production                           |
| `gsd-cleanup`   | Dọn dẹp sau khi hoàn thành (xóa temp files, v.v.) |

### Intelligence & Analysis (Phân tích thông minh)

| Skill                   | Chức năng                                  |
| ----------------------- | ------------------------------------------ |
| `gsd-stats`             | Thống kê và metrics của dự án              |
| `gsd-health`            | Kiểm tra "sức khỏe" dự án                  |
| `gsd-surface`           | Làm nổi bật những vấn đề tiềm ẩn           |
| `gsd-profile-user`      | Phân tích hành vi developer để cá nhân hóa |
| `gsd-extract-learnings` | Rút ra bài học từ session/phase            |

### Content & Docs (Tài liệu)

| Skill             | Chức năng                           |
| ----------------- | ----------------------------------- |
| `gsd-docs-update` | Cập nhật tài liệu dự án             |
| `gsd-sketch`      | Phác thảo ý tưởng/design nhanh      |
| `gsd-capture`     | Ghi lại ý tưởng/context nhanh       |
| `gsd-thread`      | Quản lý thread/conversation context |

### NS Skills — Autonomous Mode (Chế độ tự động)

| Skill             | Chức năng                                |
| ----------------- | ---------------------------------------- |
| `gsd-ns-context`  | Cung cấp context cho chế độ autonomous   |
| `gsd-ns-ideate`   | Ideation trong autonomous mode           |
| `gsd-ns-manage`   | Quản lý tác vụ trong autonomous mode     |
| `gsd-ns-project`  | Project management trong autonomous mode |
| `gsd-ns-review`   | Review trong autonomous mode             |
| `gsd-ns-workflow` | Điều phối workflow tự động               |
| `gsd-autonomous`  | Chạy GSD hoàn toàn tự động               |

### Meta & Configuration (Cấu hình)

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

_Cập nhật lần cuối: 2026-06-21 — thêm 4 skills mới (grilling, domain-modeling, codebase-design, decision-mapping) và ghi nhận các thay đổi trong lần update của Matt Pocock._
