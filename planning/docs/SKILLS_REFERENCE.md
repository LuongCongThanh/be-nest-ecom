# Skills Reference — `.claude/skills`

Tài liệu mô tả 24 skill cục bộ trong dự án.

---

| #   | Skill                             | Nhóm                   | Gọi khi (Trigger)                                                                                                                                                                  | Vấn đề giải quyết                                                                                                                                                                 | Cách hoạt động                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Đầu ra                                                                                                                                                          | Lưu ý quan trọng                                                                                                                                                                           |
| --- | --------------------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | **design-an-interface**           | Thiết kế & Kiến trúc   | Muốn thiết kế API/interface mới, so sánh cách tổ chức module, hoặc nói _"design it twice"_                                                                                         | Ý tưởng đầu tiên hiếm khi là tốt nhất — commit sớm vào 1 thiết kế dễ dẫn đến refactor tốn kém sau                                                                                 | Spawn 3+ sub-agent **song song**, mỗi agent nhận ràng buộc khác nhau (ít method nhất / linh hoạt nhất / tối ưu use case phổ biến / theo paradigm cụ thể). So sánh về: độ đơn giản, tính general-purpose, hiệu quả implementation, và "depth"                                                                                                                                                                                                                                                                                                                                    | Các bản thiết kế interface kèm ví dụ sử dụng thực tế, phân tích trade-off bằng văn xuôi, gợi ý tổng hợp tốt nhất                                                | Skill này **không implement** — chỉ về hình dạng interface. Nguồn gốc từ _A Philosophy of Software Design_                                                                                 |
| 2   | **qa**                            | QA & Issue Tracking    | Muốn báo cáo bug bằng hội thoại, chạy phiên QA, hoặc nói _"QA session"_                                                                                                            | Tự soạn GitHub Issue mất thời gian, dễ thiếu ngữ cảnh và dùng sai tên domain                                                                                                      | (1) Lắng nghe, hỏi tối đa 2-3 câu làm rõ. (2) Spawn agent khám phá codebase trong nền để học domain language. (3) Quyết định 1 issue hay tách nhiều. (4) Tạo Issue qua `gh issue create` ngay — không hỏi thêm                                                                                                                                                                                                                                                                                                                                                                  | GitHub Issues với template: _What happened / What expected / Steps to reproduce / Additional context_. Nếu nhiều issues: có quan hệ blocking rõ ràng            | Issues phải **durable** — đọc được sau khi refactor lớn. Không chứa file path hay line number                                                                                              |
| 3   | **request-refactor-plan**         | Thiết kế & Kiến trúc   | Muốn lên kế hoạch refactor, tạo RFC, hoặc chia nhỏ refactor thành các bước an toàn                                                                                                 | Refactor không có kế hoạch dễ scope creep, gây regression, hoặc bỏ sót test coverage                                                                                              | (1) Hỏi user mô tả chi tiết. (2) Khám phá codebase xác nhận assertions. (3) Đề xuất lựa chọn khác. (4) Xác định phạm vi chính xác. (5) Kiểm tra test coverage. (6) Chia thành **tiny commits** (Martin Fowler). (7) Tạo GitHub Issue                                                                                                                                                                                                                                                                                                                                            | GitHub Issue với: Problem Statement, Solution, danh sách Commits chi tiết, Decision Document, Testing Decisions, Out of Scope                                   | Issue không chứa file path cụ thể. Phần Commits là trọng tâm — càng nhỏ càng tốt                                                                                                           |
| 4   | **ubiquitous-language**           | Domain & Documentation | Muốn định nghĩa domain terms, xây glossary, hoặc đề cập _"DDD"_ / _"domain model"_                                                                                                 | Cùng khái niệm gọi nhiều tên khác nhau (Order vs Purchase vs Transaction) gây nhầm lẫn trong code, docs và giao tiếp team                                                         | Quét hội thoại tìm: (1) danh từ/động từ domain-relevant. (2) Phát hiện synonym và ambiguity. (3) Đề xuất thuật ngữ chuẩn tắc. (4) Viết ví dụ hội thoại Dev ↔ Domain Expert minh họa                                                                                                                                                                                                                                                                                                                                                                                             | `UBIQUITOUS_LANGUAGE.md` với: bảng thuật ngữ theo nhóm, cột "Aliases to avoid", quan hệ giữa terms, ví dụ hội thoại, mục "Flagged ambiguities"                  | Chỉ include domain terms — bỏ qua khái niệm lập trình thuần túy. Gọi lại nhiều lần để cập nhật                                                                                             |
| 5   | **git-guardrails-claude-code**    | Tooling & Setup        | Muốn ngăn Claude chạy lệnh git nguy hiểm, hoặc block `git push`/`reset` trong Claude Code                                                                                          | Claude Code có thể tự ý chạy `git push --force` hay `git reset --hard` mà không có confirmation từ user                                                                           | Cài **PreToolUse hook** intercept mọi lệnh Bash. Hook kiểm tra và block lệnh git nguy hiểm với exit code 2 trước khi thực thi: `push`, `reset --hard`, `clean -f`, `branch -D`, `checkout .`, `restore .`                                                                                                                                                                                                                                                                                                                                                                       | Script `.claude/hooks/block-dangerous-git.sh` + entry trong `settings.json` (project hoặc global scope)                                                         | Hỏi user muốn cài project-scope hay global-scope. Có thể tùy chỉnh danh sách lệnh bị block                                                                                                 |
| 6   | **migrate-to-shoehorn**           | Tooling & Setup        | Muốn thay `as` assertions trong tests, đề cập shoehorn, hoặc cần truyền partial data an toàn                                                                                       | `as Type` trong tests che giấu lỗi TypeScript thật. `as unknown as Type` còn tệ hơn — hoàn toàn bypass type system                                                                | Tìm `as [Type]` và `as unknown as Type` trong `*.test.ts`/`*.spec.ts`. Thay bằng: `fromPartial()` (partial data vẫn type-check), `fromAny()` (data sai type có chủ đích). Thêm import. Chạy type check                                                                                                                                                                                                                                                                                                                                                                          | Test files được migrate, imports được thêm, type check pass                                                                                                     | **Chỉ dùng trong test code** — không bao giờ dùng shoehorn trong production                                                                                                                |
| 7   | **scaffold-exercises**            | Tooling & Setup        | Muốn tạo cấu trúc thư mục exercises, tạo stubs, hoặc thiết lập section mới cho khóa học                                                                                            | Tạo thủ công hàng chục thư mục exercises với quy ước đặt tên và cấu trúc file rất dễ sai                                                                                          | Parse kế hoạch → tạo thư mục `XX-section/XX.YY-exercise/{problem,solution,explainer}/` → tạo stub `readme.md` → chạy `pnpm ai-hero-cli internal lint` → fix lỗi → commit                                                                                                                                                                                                                                                                                                                                                                                                        | Cấu trúc thư mục exercises đúng chuẩn, lint pass, commit sẵn sàng                                                                                               | Dùng `git mv` khi đổi tên (giữ git history). Không để `.gitkeep` hay `speaker-notes.md`                                                                                                    |
| 8   | **setup-pre-commit**              | Tooling & Setup        | Muốn thêm pre-commit hooks, cài Husky, hoặc enforce format/typecheck/test trước mỗi commit                                                                                         | Code formatting không nhất quán, type errors và test failures được commit vào repo vì không có gate kiểm tra                                                                      | (1) Detect package manager. (2) Install `husky lint-staged prettier`. (3) `npx husky init`. (4) Tạo `.husky/pre-commit`: lint-staged → typecheck → test. (5) Tạo `.lintstagedrc` và `.prettierrc`. (6) Commit để smoke test                                                                                                                                                                                                                                                                                                                                                     | `.husky/pre-commit` executable, `.lintstagedrc`, `.prettierrc`, `prepare` script trong `package.json`                                                           | Husky v9+ không cần shebang. `prettier --ignore-unknown` bỏ qua file không parse được                                                                                                      |
| 9   | **edit-article**                  | Domain & Documentation | Muốn chỉnh sửa, revise hoặc cải thiện một bản thảo bài viết                                                                                                                        | Bài viết thô thường có sections sắp xếp sai thứ tự logic, đoạn văn quá dài, ý không rõ ràng                                                                                       | (1) Chia bài viết thành sections theo headings, ánh xạ thứ tự phụ thuộc như DAG. Xác nhận với user. (2) Rewrite từng section: cải thiện clarity, coherence, flow — mỗi đoạn ≤ 240 ký tự                                                                                                                                                                                                                                                                                                                                                                                         | Bài viết được rewrite từng section theo thứ tự logic                                                                                                            | Skill đơn giản nhất — chỉ 2 bước. Không có workflow phức tạp                                                                                                                               |
| 10  | **obsidian-vault**                | Domain & Documentation | Muốn tìm, tạo hoặc quản lý notes trong Obsidian vault                                                                                                                              | Vault có path cố định và quy ước đặt tên/linking riêng — cần context để tương tác đúng                                                                                            | Vault ở `/mnt/d/Obsidian Vault/AI Research/`. Tìm bằng Glob/Grep. Tạo notes theo Title Case, thêm `[[wikilinks]]` đến notes liên quan ở cuối. Index notes là danh sách wikilinks thuần túy                                                                                                                                                                                                                                                                                                                                                                                      | Notes được tìm thấy (paths), hoặc notes mới với wikilinks và index entries                                                                                      | Tổ chức phẳng — không dùng folder. Tên file phải Title Case                                                                                                                                |
| 11  | **prototype**                     | Thiết kế & Kiến trúc   | Muốn prototype, sanity-check state machine, mockup UI, hoặc nói _"prototype this"_ / _"let me play with it"_                                                                       | Một số câu hỏi thiết kế khó trả lời trên giấy — commit sớm vào implementation trước khi validate là rủi ro lớn                                                                    | Xác định câu hỏi → phân nhánh: **Logic**: terminal app tương tác nhỏ, in toàn bộ state sau mỗi action. **UI**: route với nhiều variations hoàn toàn khác nhau, chuyển đổi bằng URL param + floating bar. Code đặt gần module/page liên quan                                                                                                                                                                                                                                                                                                                                     | Throwaway code chạy được bằng 1 lệnh. Kèm ghi chú câu hỏi đã trả lời (ADR/NOTES.md). Xóa hoặc hấp thụ khi xong                                                  | Không có tests, không abstractions. State sống trong memory. Mục tiêu: học nhanh rồi xóa                                                                                                   |
| 12  | **caveman**                       | Meta Skills            | Nói _"caveman mode"_, _"less tokens"_, _"be brief"_, hoặc gọi `/caveman`                                                                                                           | Phản hồi mặc định của AI dài dòng với filler ("Sure! I'd be happy to help..."), tốn token và làm chậm workflow                                                                    | Bỏ hoàn toàn: articles, filler words, pleasantries, hedging. Dùng fragments, arrows (`X -> Y`), viết tắt (DB/auth/req/res). Giữ nguyên: technical terms, code blocks, error messages. Ngoại lệ tự động cho security warnings và destructive ops                                                                                                                                                                                                                                                                                                                                 | Phản hồi giảm ~75% token, giữ 100% độ chính xác kỹ thuật                                                                                                        | Duy trì suốt session, không tự tắt. Tắt khi nói _"stop caveman"_ hoặc _"normal mode"_                                                                                                      |
| 13  | **grill-me**                      | Thiết kế & Kiến trúc   | Muốn stress-test kế hoạch, được hỏi bài về thiết kế, hoặc nói _"grill me"_                                                                                                         | Kế hoạch thường có assumption ẩn, dependency chưa giải quyết — chỉ phát hiện khi bị hỏi dồn                                                                                       | Phỏng vấn từng câu một theo thứ tự dependency trong decision tree. Với mỗi câu: đưa ra đề xuất của mình trước, rồi hỏi user. Nếu câu hỏi trả lời được bằng cách đọc code → tự đọc thay vì hỏi                                                                                                                                                                                                                                                                                                                                                                                   | Shared understanding đã được kiểm chứng về toàn bộ thiết kế, không còn assumption mơ hồ                                                                         | Hỏi **từng câu một** — không dump nhiều câu cùng lúc                                                                                                                                       |
| 14  | **handoff**                       | Domain & Documentation | Muốn bàn giao context cho agent khác hoặc session làm việc tiếp theo                                                                                                               | Context window có giới hạn — session mới không có memory về những gì đã làm, phải giải thích lại rất tốn thời gian                                                                | Nén hội thoại thành handoff document. Không duplicate artifacts đã có (PRD, ADR, issues, diffs) — chỉ reference theo path/URL. Nếu user truyền argument mô tả session tiếp theo → điều chỉnh nội dung cho phù hợp. Đề xuất skills nên dùng                                                                                                                                                                                                                                                                                                                                      | File markdown tại `mktemp -t handoff-XXXXXX.md`: context cần thiết, công việc dang dở, decisions đã đưa ra, next steps, suggested skills                        | Đọc file trước khi write (dùng `mktemp` để tránh ghi đè)                                                                                                                                   |
| 15  | **write-a-skill**                 | Meta Skills            | Muốn tạo, viết hoặc build một skill mới                                                                                                                                            | Skill viết sai cấu trúc hoặc description mơ hồ sẽ không được agent nhận ra và trigger đúng lúc                                                                                    | (1) Thu thập yêu cầu: domain, use cases, cần scripts không. (2) Soạn SKILL.md với frontmatter đúng. (3) Tách file phụ nếu SKILL.md > 100 dòng. (4) Review với user. (5) Verify checklist                                                                                                                                                                                                                                                                                                                                                                                        | Thư mục `skill-name/SKILL.md` (+ file phụ nếu cần) trong `.claude/skills/`                                                                                      | Description là thứ **duy nhất** agent thấy khi quyết định load skill. Phải rõ triggers. Max 1024 chars                                                                                     |
| 16  | **diagnose**                      | QA & Issue Tracking    | Nói _"diagnose this"_ / _"debug this"_, báo lỗi, có gì đó broken/throwing/failing, hoặc mô tả performance regression                                                               | Debug khó vì thiếu vòng lặp phản hồi xác định — staring at code mà không có signal pass/fail không giải quyết được bug                                                            | **6 pha**: (1) **Build feedback loop** (failing test / curl / CLI snapshot / Playwright / replay trace / throwaway harness / fuzz / bisect / differential / HITL script — dừng lại nếu không build được). (2) **Reproduce** xác nhận đúng bug của user. (3) **Hypothesise** 3–5 hypothesis ranked, show user trước khi test. (4) **Instrument** từng probe mapped vào 1 hypothesis, 1 biến/lần — tag log `[DEBUG-xxxx]`. (5) **Fix + regression test** — viết test trước fix, chỉ nếu có correct seam. (6) **Cleanup + post-mortem** xóa log, xác nhận original repro không còn | Bug được reproduce và fix, regression test pass, debug logs xóa sạch (`grep` tag), commit message ghi rõ hypothesis đúng                                        | Phase 1 là cốt lõi — dành effort không cân xứng để build feedback loop. **Không proceed Phase 2 nếu chưa có loop tin cậy**                                                                 |
| 17  | **grill-with-docs**               | Thiết kế & Kiến trúc   | Muốn stress-test kế hoạch dựa trên domain model hiện có, cập nhật `CONTEXT.md`/ADRs inline, hoặc nói _"grill me against the docs"_                                                 | Kế hoạch mâu thuẫn với thuật ngữ hoặc quyết định đã có trong docs — phát hiện muộn tốn kém refactor                                                                               | Phỏng vấn từng câu theo dependency trong decision tree. Challenge terminology vs `CONTEXT.md`. Cross-reference code với những gì user phát biểu. Update `CONTEXT.md` ngay khi term được resolve (không batch). Offer ADR chỉ khi đủ 3 tiêu chí: hard-to-reverse + surprising-without-context + real trade-off                                                                                                                                                                                                                                                                   | `CONTEXT.md` được cập nhật inline, ADRs mới (nếu đủ tiêu chí), shared understanding đã được kiểm chứng                                                          | **Khác `/grill-me`**: biết docs domain hiện có và update chúng inline. ADR chỉ khi đủ cả 3 tiêu chí — không tạo ADR cho "lý do tạm thời"                                                   |
| 18  | **improve-codebase-architecture** | Thiết kế & Kiến trúc   | Muốn cải thiện architecture, tìm refactoring opportunities, consolidate tightly-coupled modules, hoặc làm codebase testable/AI-navigable hơn                                       | Module shallow (interface gần bằng implementation) gây khó test, khó maintain, phải bounce qua nhiều file để hiểu 1 khái niệm — "deletion test" thất bại                          | (1) Đọc `CONTEXT.md` + ADRs. (2) Explore tìm friction (module shallow, no test seam, leaked coupling). (3) Present numbered list candidates với files/problem/solution/benefits. (4) Grilling loop: grill → quyết định → side effects inline (update `CONTEXT.md`, offer ADR khi reject có lý do load-bearing)                                                                                                                                                                                                                                                                  | Danh sách deepening opportunities. `CONTEXT.md` được cập nhật khi tìm ra term mới. ADR nếu cần                                                                  | Dùng vocabulary từ `LANGUAGE.md`: **module/interface/seam/adapter/depth/leverage/locality**. **Không propose interfaces ngay** — grill user trước. Đánh dấu rõ nếu candidate mâu thuẫn ADR |
| 19  | **setup-matt-pocock-skills**      | Tooling & Setup        | Chạy trước khi dùng lần đầu `to-issues`, `to-prd`, `triage`, `diagnose`, `tdd`, `improve-codebase-architecture`, `zoom-out` — hoặc nếu các skill đó thiếu context về issue tracker | Các engineering skills cần biết issue tracker, label vocabulary, và domain layout trước khi hoạt động đúng — không có config này chúng không biết gọi `gh` hay viết markdown file | (1) Explore: `git remote`, `CLAUDE.md`, `CONTEXT.md`, `docs/adr/`, `docs/agents/`. (2) Hỏi user **3 quyết định từng cái một** với explainer: A) Issue tracker (GitHub / GitLab / Local markdown / Other). B) Triage labels (5 vai trò canonical, override nếu cần). C) Domain layout (single-context / multi-context). (3) Confirm + show draft. (4) Write vào `CLAUDE.md`/`AGENTS.md` + 3 files `docs/agents/`                                                                                                                                                                 | Block `## Agent skills` trong `CLAUDE.md`/`AGENTS.md`, 3 files: `docs/agents/issue-tracker.md`, `docs/agents/triage-labels.md`, `docs/agents/domain.md`         | `disable-model-invocation: true`. Luôn edit file **đã có**, không tạo mới `AGENTS.md` khi `CLAUDE.md` đã tồn tại. Chỉ cần chạy 1 lần — sau đó sửa thẳng `docs/agents/*.md`                 |
| 20  | **tdd**                           | QA & Issue Tracking    | Muốn build feature/fix bug theo TDD, đề cập _"red-green-refactor"_, muốn integration tests, hoặc test-first development                                                            | Horizontal slicing (viết toàn bộ tests rồi mới implement) tạo tests xấu — test shape thay vì behavior thật, dễ vượt qua khi behavior sai                                          | **Vertical slices** — 1 test → 1 impl → repeat. (1) Planning: confirm interface + behaviors + deep module opportunities. (2) Tracer bullet: 1 test e2e đầu tiên. (3) Incremental loop: RED→GREEN từng behavior. (4) Refactor sau khi GREEN (extract duplication, deepen modules). Không refactor khi còn RED                                                                                                                                                                                                                                                                    | Tests qua public interface chỉ, từng behavior một, mỗi test survive internal refactor                                                                           | **Không horizontal slice**. Test mô tả behavior — không implementation. Không mock internal collaborators trừ boundary thật sự                                                             |
| 21  | **to-issues**                     | QA & Issue Tracking    | Muốn convert plan/spec/PRD thành issues, tạo implementation tickets, hoặc nói _"break this down into issues"_                                                                      | Chia plan thành issues dễ bị horizontal slice (1 issue = 1 layer) — mỗi issue không deliverable độc lập                                                                           | (1) Gather context từ conversation (hoặc fetch issue theo argument). (2) Explore codebase. (3) Draft vertical slices: mỗi slice qua TẤT CẢ layers, demoable độc lập, phân loại HITL/AFK. (4) Quiz user về granularity, dependencies, HITL/AFK. (5) Publish issues in dependency order                                                                                                                                                                                                                                                                                           | GitHub Issues với template: Parent / What to build / Acceptance criteria / Blocked by. Label `ready-for-agent`                                                  | Mỗi slice phải demoable/verifiable độc lập. **Không file paths** trong issue body. Publish blockers trước để có real issue ID cho "Blocked by"                                             |
| 22  | **to-prd**                        | Domain & Documentation | Muốn tạo PRD từ context conversation hiện tại, không muốn bị phỏng vấn thêm, hoặc nói _"write a PRD"_                                                                              | Tổng hợp thủ công PRD từ nhiều quyết định rải rác trong hội thoại rất mất thời gian và dễ bỏ sót                                                                                  | (1) Explore codebase dùng domain vocabulary. (2) Sketch modules cần build/modify — tìm cơ hội deep modules. (3) Confirm với user modules + testing scope. (4) Write PRD theo template. (5) Publish lên issue tracker với label `ready-for-agent`                                                                                                                                                                                                                                                                                                                                | GitHub Issue với PRD: Problem Statement / Solution / User Stories (dài, numbered) / Implementation Decisions / Testing Decisions / Out of Scope / Further Notes | **Không phỏng vấn user** — synthesize từ context sẵn có. Không file paths trong Implementation Decisions. Ngoại lệ: snippet từ prototype encode decision thì inline (trim)                 |
| 23  | **triage**                        | QA & Issue Tracking    | Muốn triage issues, review incoming bugs/features, chuẩn bị issues cho AFK agent, hoặc quản lý issue workflow                                                                      | Issues mới vào không được categorize đúng, thiếu thông tin cho agent để pick up, hoặc bị kẹt trong queue                                                                          | State machine: unlabeled → `needs-triage` → {`needs-info` / `ready-for-agent` / `ready-for-human` / `wontfix`}. Mỗi issue: (1) Gather context. (2) Recommend category (bug/enhancement) + state. (3) Reproduce bugs. (4) Grill nếu cần (`/grill-with-docs`). (5) Apply: post agent brief / triage notes / close wontfix. Quick override nếu maintainer chỉ định state trực tiếp                                                                                                                                                                                                 | Issues được labeled (category + state), agent brief hoặc triage notes comment, wontfix closed. Bucket view: unlabeled / needs-triage / needs-info-with-activity | Mọi comment **phải** bắt đầu bằng disclaimer AI-generated. Chạy `/setup-matt-pocock-skills` nếu thiếu context issue tracker. Conflict giữa labels → hỏi maintainer trước khi làm gì        |
| 24  | **zoom-out**                      | Thiết kế & Kiến trúc   | Không quen với đoạn code, cần hiểu context rộng hơn hoặc big picture, hoặc nói _"zoom out"_ / _"give me the map"_                                                                  | Đọc code chi tiết mà không có bản đồ module-level dễ bị lost — không biết đang ở đâu trong toàn bộ hệ thống                                                                       | Agent tự re-orient: đi lên 1 layer abstraction, tạo bản đồ tất cả relevant modules và callers, dùng vocabulary từ domain glossary của project                                                                                                                                                                                                                                                                                                                                                                                                                                   | Bản đồ modules + callers theo domain vocabulary                                                                                                                 | `disable-model-invocation: true`. Skill cực kỳ ngắn — chỉ là instruction để agent re-orient, không phải workflow                                                                           |

---

## Hướng dẫn sử dụng Skills

### Cú pháp gọi skill

```
/gsd-<tên-skill>
```

Ví dụ:

```
/gsd-plan-phase
/gsd-debug
/gsd-code-review
```

### Khi nào dùng skill nào?

**Bắt đầu dự án mới**

```
/gsd-new-project
```

Dùng khi: chưa có gì, muốn tạo roadmap, chia phases, định nghĩa milestone từ đầu.

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

**Scenario: Bắt đầu Phase 3 Scale**

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

_Cập nhật lần cuối: 2026-05-16_
