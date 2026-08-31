# MASTER PROMPT CHO CODEX — TIXFLOW V2 / QLDA / 9 TUẦN

> Dán toàn bộ nội dung file này vào Codex tại thư mục gốc repository TixFlow V2. Đây là **lệnh triển khai thực tế**, không chỉ là yêu cầu viết kế hoạch.
>
> **Ngày chốt phạm vi:** 02/11/2026, múi giờ `Asia/Ho_Chi_Minh`.
> **Cửa sổ kiểm toán 9 tuần:** 31/08/2026–02/11/2026. Đề bài gốc vẫn quy định bằng chứng xuyên suốt **15 tuần**. Không được mô tả cửa sổ 9 tuần là đã đáp ứng yêu cầu 15 tuần nếu chưa có căn cứ.

## 0. VAI TRÒ, MỤC TIÊU, CHẾ ĐỘ LÀM VIỆC

Bạn là một nhóm tác nhân kỹ thuật gồm: Principal Software Engineer, Technical Lead, PM/Scrum Master, DevOps/CloudOps, QA Lead, Technical Writer.

**Mục tiêu chính:** triển khai TixFlow V2 thành hệ thống bán vé sự kiện hoạt động được trên HTTPS công khai, với phần mềm, quy trình và bằng chứng quản trị có thể kiểm chứng. Không dừng ở README, kế hoạch hay mockup. Hãy sửa mã nguồn, tạo test, chạy test, tạo GitHub Issues/Projects/Milestones/PR khi có quyền, cập nhật tài liệu và cung cấp URL/SHA thực tế.

**Hành vi bắt buộc:**
- Đọc workspace và tài liệu gốc trước khi hành động. Không xóa hoặc ghi đè lịch sử/công việc không liên quan.
- Tự chọn thứ tự công việc dựa trên dependencies, P0 trước P1; làm tối đa những phần thực thi được ngay, không hỏi lại thông tin đã có.
- Sau mỗi nhóm thay đổi: lint → typecheck → unit/integration phù hợp → build/E2E phù hợp → cập nhật Issue/PR/evidence; không nói PASS khi chưa chạy.
- Mỗi thay đổi là một đơn vị logic có thể review. Không tạo commit rỗng/giả, không tách code tùy tiện chỉ nhằm tăng số commit.
- Chỉ sử dụng GitHub, credential và identity thực sự được cấp quyền. Không commit hoặc review **giả danh** ba thành viên; không thay author/committer date, `GIT_AUTHOR_DATE`, `GIT_COMMITTER_DATE`, `git filter-repo`, `rebase` để sửa quá khứ hoặc force-push nhằm tạo lịch sử giả.
- Tất cả báo cáo phải phân biệt `VERIFIED`, `IMPLEMENTED_NOT_TESTED`, `PLANNED`, `PENDING_HUMAN`, `BLOCKED`, `FAILED`. Không tự tạo chữ ký, email UAT, approval, biến cố quản trị, CI pass, velocity hoặc cloud deployment giả.
- **Không khởi tạo tài nguyên AWS tính phí, thay đổi DNS/production, kích hoạt thanh toán thực, publish dữ liệu cá nhân hoặc xóa tài nguyên trước khi có phê duyệt rõ ràng.** Được phép tự tạo IaC, workflow, Docker, runbooks, local tests và PR.

## 1. NGUỒN THAM CHIẾU VÀ NGUYÊN TẮC ƯU TIÊN

1. Hướng dẫn QLDA VKU do người dùng cung cấp (`Pasted markdown(1).md`, hoặc file tương ứng trong `docs/qlda/source/`), gồm Authenticity Gate, GitHub Ecosystem, gói bằng chứng 8 mục và defense 16 phút.
2. Repository tham khảo: `https://github.com/nvtank/ticketflow-aws` (đọc mã nguồn/tài liệu hiện có, KHÔNG mặc định đây là sản phẩm đạt chuẩn hay có AWS đã triển khai).
3. File kế hoạch trước đây, nếu có: `TixFlow_V2_15_Week_Rebuild_Plan.md`, dùng làm reference backlog/kiến trúc **không dùng lịch 15 tuần làm lịch thực thi mới**.
4. Repository đang mở của nhóm V2: coi đây là nguồn sự thật cho code/commit/CI và kết quả hiện tại.

Nếu nguồn mâu thuẫn: **yêu cầu giảng viên > yêu cầu an toàn/chân thực > trạng thái GitHub và kiểm thử xác minh > kế hoạch đề xuất**. Lập bảng sai khác, không lờ đi.

**Đặc biệt:** tài liệu repo cũ có ghi đã tái dựng/simulate commit timestamps vào tháng 10/2026. Phải kiểm toán và gắn cờ lịch sử đó; không sử dụng những ngày giả lập làm bằng chứng 9 tuần học tập thật. Nếu repo cũ không có `LICENSE` thích hợp, không mặc định sao chép toàn bộ code sang repo mới là hợp lệ; chỉ tham khảo thiết kế hoặc xin quyền sử dụng trước khi tái sử dụng.

## 2. NHÂN SỰ VÀ QUYỀN SỞ HỮU CÔNG VIỆC

**A — Nguyễn Văn Tuấn Anh**
- GitHub: `nvtank`; email: `tuannguyen.120910@gmail.com`.
- Role: **Project Manager / Scrum Master + CloudOps**.
- DRI: Charter, scope/WBS, stakeholder & UAT coordination, GitHub Projects, risk/change management, CI/CD, Docker, AWS, observability, security/release runbook, backup, evidence và báo cáo.
- Chỉ commit dưới identity `nvtank` khi phiên Git xác thực thực sự thuộc tài khoản này.

**B — Đoàn Quang Tuấn An**
- GitHub: `TuanAn0311`; email: `dqta74@gmail.com`.
- Role: **Tech Lead / System Architect + Backend Engineer**.
- DRI: ADR/architecture, ERD/Prisma, NestJS, JWT & RBAC, event lifecycle, atomic booking, payment verification, signed ticket, check-in, unit/integration/security tests, technical PR reviews.
- Chỉ người có quyền với identity này mới tạo các commit được gán tác giả Tuấn An.

**C — Nguyễn Văn Hoàn**
- GitHub: `nguyen-van-hoan`; email: `nguyenvanh842k5@gmail.com`.
- Role: **Full-stack Developer / Frontend Owner**.
- DRI: Next.js UI/UX, responsive, event catalog, organizer/admin/customer/staff screens, booking/checkout/ticket views, API integration, E2E Playwright, accessibility, backend hỗ trợ theo Issue.
- Chỉ người có quyền với identity này mới tạo các commit được gán tác giả Hoàn.

**Bù đủ 5 vai trò VKU:** PM=Tuấn Anh, Tech Lead=Tuấn An, Backend=Tuấn An (+Hoàn), Frontend=Hoàn, QA/Test=cả ba; Tuấn Anh tổng hợp QA evidence. Mỗi Issue chỉ có một DRI chính, có người review khác DRI. `Assignee` khác với `Git commit author`; không gán author chỉ vì task assigned.

**Peer review gợi ý:** PR của Tuấn Anh → Tuấn An/Hoàn; PR của Tuấn An → Hoàn/Tuấn Anh (review chuyên môn phù hợp); PR của Hoàn → Tuấn An/Tuấn Anh. Không tự thực hiện approval thay người khác.

## 3. PHẠM VI 9 TUẦN VÀ PHẦN CHÊNH VỚI RUBRIC 15 TUẦN

Cửa sổ lập báo cáo/kiểm toán gần nhất:

| Tuần | Ngày | Sprint | Product gate | DRI trọng tâm |
|---|---|---|---|---|
| W1 | 31/08–06/09/2026 | Kickoff | Charter, stakeholder, WBS, architecture, backlog, local foundation | A+B+C |
| W2 | 07/09–13/09/2026 | S1 | Auth, RBAC, DB schema, frontend shell, CI | A+B+C |
| W3 | 14/09–20/09/2026 | S1 | Event draft/approval/catalog + Sprint 1 Review/Retro | B+C, A điều phối |
| W4 | 21/09–27/09/2026 | S2 | Inventory/seat grid, booking policies/transactions | B+C |
| W5 | 28/09–04/10/2026 | S2 | Order, TTL, concurrency/realtime, Sprint 2 Retro | B+C, A staging |
| W6 | 05/10–11/10/2026 | S3 | Payment provider adapter, verified settlement, QR tickets | B+C, A secrets/CI |
| W7 | 12/10–18/10/2026 | S3 | One-time check-in, analytics, E2E, Sprint 3 Retro | B+C, A quality |
| W8 | 19/10–25/10/2026 | S4 | AWS deployment, HTTPS, backup, monitoring, security | A, B+C hỗ trợ |
| W9 | 26/10–02/11/2026 | S4 | Regression, UAT, release, evidence, final retro, defense | A+B+C |

Các ngày trong bảng là **timebox để đối chiếu với bằng chứng thực** chứ không phải chỉ thị backdate commit. Vì 02/11/2026 đã đến, hãy kiểm tra lịch sử thật cho W1–W9; chỉ ghi `DONE` cho tuần thực sự có bằng chứng. Phần chưa làm phải tạo thành backlog triển khai bắt đầu **từ ngày thực tế**, không tự nói đã hoàn thành ở tuần cũ.

**Bắt buộc xuất `15_WEEK_REQUIREMENT_GAP.md`:** đề bài gốc yêu cầu commit trải đều 15 tuần và gói bằng chứng xuyên học kỳ. Việc người dùng chọn báo cáo 9 tuần **không sửa được tiêu chí giảng viên**. Nêu rõ 6 tuần/khung kỳ còn thiếu bằng chứng nếu có; đề xuất trao đổi giảng viên để được xác nhận điều chỉnh thay vì che giấu.

## 4. ĐỊNH NGHĨA SẢN PHẨM VÀ SCOPE BASELINE

TixFlow V2 là nền tảng đặt vé sự kiện dành cho organizer/customer/admin/staff, có quy trình vận hành thật. Luồng giá trị phải hoàn chỉnh:

`Organizer tạo event và cấu hình ghế/giá → Admin duyệt → Customer chọn/giữ ghế → tạo order và thanh toán được xác minh → nhận vé QR → Staff check-in đúng một lần → Organizer xem thống kê thật.`

**P0 / bắt buộc:**
- Monorepo pnpm, Next.js/React/TypeScript, NestJS, PostgreSQL/Prisma, Docker Compose, REST, shared DTO, validated env.
- JWT auth, refresh token rotation, logout, RBAC CUSTOMER/ORGANIZER/STAFF/ADMIN; organization membership scope.
- Event CRUD, review/publish, danh mục/tìm kiếm/chi tiết, ticket type/zone/seat inventory.
- Atomic seat hold, TTL theo server, idempotency, double-booking prevention và orders lấy giá server.
- Payment abstraction; mock chỉ trong dev/test; PayOS thật chỉ xác nhận khi có credentials, HTTPS webhook và kiểm chứng thật.
- QR chỉ phát hành sau settlement được xác minh, ticket ownership, check-in atomic one-time.
- Analytics số liệu thực; Next.js responsive; unit/integration/E2E; CI và HTTPS cloud thực khi có phê duyệt.
- GitHub governance, stakeholder thật, 1 biến cố quản trị thật, 8 artifacts.

**P1 / optional nếu dư năng lực:** Socket.IO realtime, Venue Studio nâng cao, Waiting Room Redis, Google OAuth, community/artist discovery. Không cho P1 chặn MVP P0.

**Nonfunctional acceptance:** định nghĩa rõ trước khi code: quyền truy cập, validation, CSRF/CORS/cookie, no secrets, endpoint error handling, reliable DB transactions, migration rollback, test data isolated, staging HTTPS, backup/restore validation, accessible responsive UI. Không tuyên bố throughput, SLA hay tải chưa đo.

## 5. KIẾN TRÚC MỤC TIÊU VÀ CLOUDOPS

Ưu tiên **modular monolith** thay vì microservices:

```text
apps/web                    Next.js, REST client, TanStack Query
apps/api                    NestJS modular API + Socket.IO nếu có
apps/api/prisma             PostgreSQL schema/migration
packages/shared             DTO/contracts/Zod validation
infrastructure/docker       local/test/prod compose
infrastructure/aws          Terraform/IaC, AWS docs, deploy script
.github/workflows           CI/CD (không chứa credentials)
e2e                         Playwright
docs/qlda                   governance/evidence/report
```

Local: Docker Compose PostgreSQL/Redis private, web/api healthchecks. Cloud demo phù hợp chi phí: `Route53 hoặc DNS hiện có → Caddy HTTPS → EC2 Docker Compose (Next/Nest/Postgres/Redis)`, GitHub Actions qua OIDC, ECR, IAM/SSM, CloudWatch, encrypted backup S3, budget alerts. Đây là single-node demo, không được ghi HA. Nếu AWS bị khóa/thiếu ngân sách thì dùng staging public HTTPS thay thế nếu được duyệt; ghi sai khác scope có kiểm soát.

Không `terraform apply`, `aws ec2 run-instances`, đăng ký domain tốn phí hay deploy production trước khi được người dùng phê duyệt khoản chi/đối tượng môi trường. Được tạo đủ IaC/workflows, validate/plan/read-only khi an toàn.

## 6. WBS 100% RULE VÀ GÓI CÔNG VIỆC

- `1.0`: Governance (Charter, stakeholder, WBS, scope, schedule, budget, risks, communications, changes, Sprint ceremonies).
- `2.0`: Requirements & Architecture (business case, user stories, ADR/C4, ERD, APIs, NFR, UX prototypes).
- `3.0`: Foundation & Identity (workspace, DB/migrations, Next/Nest, auth, RBAC, CI basic).
- `4.0`: Event & Seat Inventory (event lifecycle, catalog, approval, pricing, seats).
- `5.0`: Booking & Orders (atomic holds, TTL, idempotency, realtime optional, order).
- `6.0`: Payment & QR Tickets (provider abstraction, settlement integrity, QR/ownership).
- `7.0`: Check-in & Analytics (staff auth, atomic check-in, reporting).
- `8.0`: QA / Cloud / Release (tests, CI/CD, cloud, backup, monitoring, security, runbooks).
- `9.0`: UAT & Closure (stakeholder acceptance, evidence package, final report, defense).

Tạo WBS tree và WBS Dictionary cho từng leaf, có `WBS ID, parent, description, owner, inputs, deliverable, acceptance criteria, dependencies, estimated effort/story points, due timebox, issue link`. Đảm bảo không bỏ sót quản trị/QA/evidence; không đếm trùng deliverable.

## 7. BACKLOG BẮT BUỘC — TẠO ISSUES VÀ CHIA OWNER

Tạo **ít nhất 45 GitHub Issues** từ backlog bên dưới nếu repo có quyền. Tiền tố dùng `TF2-001`…`TF2-045` làm mã nghiệp vụ ổn định trong title/body, **không nhầm với GitHub issue number**. Nếu Issue đã có cùng mã thì update/skip thay vì tạo trùng. Sprint timebox là kế hoạch, không phải bằng chứng đã hoàn thành.

| ID | Sprint / W | Issue deliverable | DRI | Reviewer |
|---|---|---|---|---|
| TF2-001 | Kickoff/W1 | Charter 13 mục + Business Case + SMART goals | A | B |
| TF2-002 | Kickoff/W1 | Stakeholder register, sourcing pathway, UAT criteria | A | C |
| TF2-003 | Kickoff/W1 | Scope baseline + WBS 100% + WBS Dictionary | A | B |
| TF2-004 | Kickoff/W1 | Risk Register v1, communications/change plan | A | C |
| TF2-005 | Kickoff/W1 | GitHub Project board, issue/PR templates, labels & milestones | A | B |
| TF2-006 | Kickoff/W1 | Requirements, personas, user journeys, NFR | C | A |
| TF2-007 | Kickoff/W1 | ADR/C4/ERD, API contracts & DB design | B | C |
| TF2-008 | S1/W2 | pnpm monorepo, TS strict, lint/format, shared contracts | B | A |
| TF2-009 | S1/W2 | Docker local/test DB, Redis, env samples, healthcheck | A | B |
| TF2-010 | S1/W2 | CI: lint/typecheck/build/test + branch rules instructions | A | B |
| TF2-011 | S1/W2 | Prisma schema/migrations/dev-test seed | B | C |
| TF2-012 | S1/W2–3 | JWT/refresh/session/RBAC/organization policy | B | A |
| TF2-013 | S1/W2–3 | Next design system + auth/workspace UI | C | B |
| TF2-014 | S1/W3 | Event CRUD + lifecycle/review backend | B | C |
| TF2-015 | S1/W3 | Organizer/Admin event forms + review screens | C | B |
| TF2-016 | S1/W3 | Public events catalog/search/detail + integration | C | B |
| TF2-017 | S1/W3 | Auth/event unit/integration/E2E + Sprint 1 Retro | A (retro), B+C (tests) | B |
| TF2-018 | S2/W4 | Zone/ticket type/seat schema + validation | B | C |
| TF2-019 | S2/W4 | Organizer seat grid + pricing UI | C | B |
| TF2-020 | S2/W4 | Atomic hold service/row locks/TTL/ownership | B | C |
| TF2-021 | S2/W4–5 | Seat selector, countdown, availability UI | C | B |
| TF2-022 | S2/W5 | Idempotent order, server amount, release/expiry | B | A |
| TF2-023 | S2/W5 | Concurrent booking/rollback/TTL tests | B | C |
| TF2-024 | S2/W5 | Realtime Socket.IO with REST resync (P1) | B | C |
| TF2-025 | S2/W5 | Checkout UI + order history | C | B |
| TF2-026 | S2/W5 | Staging, error logs, Sprint 2 review/retro | A | C |
| TF2-027 | S3/W6 | Payment provider interface + mock dev/test | B | A |
| TF2-028 | S3/W6 | PayOS integration, signed webhook/idempotency/reconciliation | B | A |
| TF2-029 | S3/W6 | Payment screen/status/error/cancel flows | C | B |
| TF2-030 | S3/W6 | Signed QR ticket issuance + authorization | B | C |
| TF2-031 | S3/W6 | My Tickets + QR frontend | C | B |
| TF2-032 | S3/W7 | Staff assignment + one-time check-in transaction | B | A |
| TF2-033 | S3/W7 | Mobile check-in UI/scanner/fallback | C | B |
| TF2-034 | S3/W7 | Sales/occupancy/check-in analytics API | B | C |
| TF2-035 | S3/W7 | Organizer analytics charts + filters | C | B |
| TF2-036 | S3/W7 | Payment/check-in concurrency/E2E, risk evolution, S3 retro | A (risk/retro), B+C (tests) | B |
| TF2-037 | S4/W8 | Prod Dockerfiles and immutable builds | A | B |
| TF2-038 | S4/W8 | AWS IaC/IAM OIDC/ECR/SSM/HTTPS runbook | A | B |
| TF2-039 | S4/W8 | CD workflow, healthchecks, safe rollout/rollback | A | B |
| TF2-040 | S4/W8 | CloudWatch/logging/S3 backup + restore drill | A | B |
| TF2-041 | S4/W8–9 | Security checks, dependency scan, test matrix, regression | B (security), C (E2E), A (matrix) | A |
| TF2-042 | S4/W9 | Stakeholder UAT script, feedback & sign-off request | A | C |
| TF2-043 | S4/W9 | Actual risk/change record + final sprint retro | A | B |
| TF2-044 | S4/W9 | Final Technical Report 7 chapters, evidence index | A | B+C |
| TF2-045 | S4/W9 | Slides, live demo script, final release checklist | A | B+C |

Với Issue có nhiều contributor, chia ra sub-issues cụ thể để **mỗi Issue cuối cùng có một DRI**; reviewer phải là cá nhân khác; PR links và AC rõ. Các Issue về Sprint/Retro không thể tự chuyển DONE khi chưa có cuộc họp thật. Thêm `P1` nếu có thời gian, không xóa P0 để trốn hạn.

## 8. SPRINTS, MILESTONES, ESTIMATION, PROJECT BOARD

Tạo 4 Sprint Milestones (`S1 Foundation & Events`, `S2 Inventory & Booking`, `S3 Payments & Check-in`, `S4 Cloud & Acceptance`) + `Kickoff`, với due dates thuộc timebox nêu trên cho mục đích **phân tích kế hoạch lịch sử**. Nếu hiện tại mới bắt đầu thực thi, tạo **lịch Sprint tiếp diễn từ hôm nay trở đi** và ghi rõ baseline/forecast mới, không gán Issue/PR đóng về tuần quá khứ.

GitHub Projects (Board và Table) phải có:
- Status: `Backlog`, `Ready`, `In Progress`, `In Review`, `Done`.
- Fields: `Sprint`, `Priority (P0/P1/P2)`, `Story Points`, `WBS`, `Module`, `DRI`, `Target Week`, `Actual Start`, `Actual Done`, `Evidence URL` nếu khả năng Projects API hỗ trợ.
- Views: Backlog, Current Sprint, By Owner, Roadmap/Milestones, Blocked, Done/Velocity.
- Labels: `type:feature`, `type:bug`, `type:docs`, `type:test`, `type:devops`, `priority:p0`, `priority:p1`, `area:frontend`, `area:backend`, `area:cloudops`, `area:qlda`, `status:blocked`, `needs:human`, `security`.
- Story Points Fibonacci `1,2,3,5,8`, estimates bằng Planning Poker của nhóm; các ước lượng do Codex dự thảo phải có nhãn `PROPOSED` trước khi nhóm xác nhận.

Workflow phải gắn trạng thái Project thực: Issue backlog → Ready khi DoR pass → In Progress khi bắt đầu → In Review khi có PR → Done khi merged/DoD pass. Nếu GitHub Projects API thiếu quyền, tự tạo bảng backlog CSV/JSON và **script idempotent** để người có quyền chạy, kèm lỗi cụ thể; không báo board được tạo nếu không có URL.

Tạo Sprint Planning/Review/Retro templates; Week1/W3/W5/W7/W9 checkpoint; xuất burndown bằng số liệu đóng Issue theo từng ngày thật, không vẽ đường burn giả. CPM/critical path chỉ coi là dự báo khi chưa có số thực.

## 9. QUY TẮC TẠO COMMIT, BRANCH, PR THEO ROLE

**Bạn được chủ động tạo commit và PR thực tế khi phiên đang mở có quyền phù hợp**, song tuyệt đối không giả danh người khác. Quy trình cho từng Issue:

1. Xác định Issue đang `Ready`, dependency đã xong; kiểm tra clean tree/current branch và remote.
2. Tạo branch `feature/TF2-012-auth-rbac`, `fix/TF2-020-double-booking`, `docs/TF2-003-wbs`... từ base phù hợp. Nếu base nhánh protected, không push trực tiếp.
3. Implement một lát cắt hoàn chỉnh nhỏ, bổ sung test/docs; chạy check thật.
4. Commit với identity **thực tế của tài khoản đăng nhập**, message Conventional Commits, ví dụ `feat(auth): implement refresh rotation (TF2-012)`. Mã Issue là dấu vết công việc, không ép tên tác giả bằng email của DRI.
5. Push và tạo PR `gh pr create` nếu `gh auth status` có quyền; PR body gồm `Closes #NN`, WBS, scope, QA commands/results, screenshots (nếu UI), risks, checklist, reviewer được yêu cầu.
6. Request review của một thành viên khác. Chỉ merge sau khi **review approval thật** và CI pass; nếu reviewer chưa online thì để PR OPEN/PENDING, không tự approve.
7. Sau merge, chuyển Issue Done và cập nhật `EVIDENCE_INDEX.md`; nếu chưa merge chỉ để In Review.
8. Nếu không có quyền `push/issue/project`, tạo các file/scripts/patch locally và báo `BLOCKED_BY_PERMISSION`; không ngụy tạo issue numbers/PR links.

**Quy tắc author:**
- Không chạy `git config user.name`/`user.email` để mạo danh đồng đội; không dùng `--author`, `Co-authored-by` giả hoặc fake approval.
- Phiên Codex chạy với `nvtank` chỉ commit phần thay đổi mà phiên đó được phép ghi nhận do `nvtank` triển khai. Các task của Tuấn An/Hoàn phải giao cho tài khoản tương ứng qua Issue và PR. Nếu Codex thực thi code dưới tài khoản hiện tại thì báo đúng tác giả thực, có thể thay đổi người implement thực tế/DRI sau khi nhóm xác nhận.
- Không tự tạo 3 chuỗi commit tưởng như 3 người cùng làm nếu chỉ một phiên có quyền. Không backdate 9 tuần. Không squashing làm mất traceability nếu chưa có quyết định nhóm.
- Commit count không phải mục tiêu chất lượng; ưu tiên 1 commit/unit logic; có thể nhiều commit thực tế/PR khi module lớn.

**Commit map đề xuất (không phải số commit đã tồn tại):**
- A / Tuấn Anh: `docs(charter)`, `docs(wbs)`, `chore(project)`, `chore(docker)`, `ci(quality)`, `ci(deploy)`, `feat(infra)`, `test(ops)`, `docs(uat)`, `docs(report)`.
- B / Tuấn An: `feat(db)`, `feat(auth)`, `feat(events)`, `feat(inventory)`, `feat(booking)`, `feat(orders)`, `feat(payments)`, `feat(tickets)`, `feat(checkin)`, `test(backend)`.
- C / Hoàn: `feat(web-shell)`, `feat(auth-ui)`, `feat(event-ui)`, `feat(organizer-ui)`, `feat(seating-ui)`, `feat(booking-ui)`, `feat(checkout-ui)`, `feat(tickets-ui)`, `feat(staff-ui)`, `test(e2e)`.

Hãy tạo `docs/qlda/COMMIT_AND_PR_PLAN.md`: mỗi Issue → owner, planned logical commits, proposed branch, PR title, tests, reviewer, actual SHA/PR URL hoặc `PENDING`. Không phát minh SHA hoặc PR số giả.

## 10. DEFINITION OF READY / DONE VÀ CI

**DoR:** Issue có business value, scope, DRI, AC testable, dependencies, story points dự kiến, module, environment, security considerations; PO/PM đồng ý đưa vào Sprint.

**DoD:** code chức năng + test + docs, PR khác người review, CI lint/typecheck/format/unit/build và integration/E2E phù hợp PASS, security checks, không secrets, không hardcoded KPIs, Issue/Project cập nhật, evidence link và test commands thật, staging smoke test khi cần.

Tạo workflows tối thiểu:
- `ci.yml`: pnpm install frozen lockfile, eslint, prettier check, TypeScript, unit, test DB Redis/Postgres via Docker, integration, build, Playwright E2E (có thể tách job nặng/caching).
- `deploy.yml`: chỉ chạy sau approval GitHub Environment và credential/OIDC phù hợp; rollback khi healthcheck fail.
- `codeql`/dependency scan nếu khả thi; nguyên tắc không làm CI giả xanh bằng cách bỏ qua test.

Kiểm thử nghiệp vụ trọng yếu: không truy cập tenant khác, refresh reuse, 2/20/100 concurrent booking cùng ghế, hold TTL/reclaim, server-priced order, duplicate payment webhook, forged payment redirect, ticket signature/ownership, check-in đua đồng thời, role/scoping, responsive 320/390/desktop, E2E full flow. Nếu không test được 100 concurrency vì hạ tầng, báo giới hạn thay vì tuyên bố PASS.

## 11. QUẢN TRỊ RỦI RO, CHANGE CONTROL, STAKEHOLDER

Risk Register khởi tạo gồm ít nhất: backend bottleneck/ownership, double booking, payment verification, AWS cost, unauthorized exposure, CI failures, stakeholder unavailable, 9-vs-15-week evidence gap, licensing/provenance, member availability, demo outage. Mỗi rủi ro có probability, impact, score, owner, mitigation, trigger, contingency, status, review date; lưu lịch sử cập nhật qua Sprint.

Một biến cố quản lý thật (scope change, blocker tiến độ, technical risk) phải có ticket/decision log/approved Change Request từ người có thẩm quyền; không dựng sự cố. Tạo form: `CR-ID, reason, alternatives, scope/schedule/cost/quality impact, approval request, actual approval evidence, baseline revision`.

Stakeholder có thể là CLB/phòng ban VKU/đơn vị tổ chức sự kiện/giảng viên thử nghiệm thật. Cần thông tin thực và quyền liên hệ của nhóm; Codex **không tự đặt tên, email, chữ ký**. Tạo UAT case checklist, email draft/nội dung xin xác nhận nhưng không gửi hoặc claim sign-off khi chưa có quyền/phản hồi.

## 12. BỘ HỒ SƠ BẮT BUỘC VÀ RUBRIC

Dưới `docs/qlda/evidence/` tạo `COMPLIANCE_MATRIX.md`, `EVIDENCE_INDEX.md`, `ARTIFACT_CHECKLIST.md` ánh xạ theo 4 thành phần: Authenticity Gate, Plan 30%, Methodology 20%, Execution 30%, Defense 20%. Mỗi yêu cầu phải map `Requirement → WBS → Issue → PR/commit → test/log/URL → deliverable → status`.

Chuẩn bị đúng 8 deliverables do giảng viên yêu cầu (trạng thái `DRAFT` đến khi được xác minh):

1. `01_Final_Technical_Report.pdf` — báo cáo 15–25 trang/7 chương, chỉ kể thực tế trong thì quá khứ khi có đủ evidence.
2. `02_Project_Charter_Signed.pdf` — Charter 13 mục; không đặt `Signed` khi chưa có chữ ký thật.
3. `03_WBS_and_WBS_Dictionary.pdf` — 100% Rule.
4. `04_Risk_Register_Evolution.xlsx` — cập nhật có lịch sử qua các Sprint.
5. `05_Sprint_Retrospectives.pdf` — Sprint 1 Retro và Final Retro (4Ls/Sailboat), nội dung từ họp thật.
6. `06_Scope_Change_Control_Record.pdf` — CR được duyệt thực tế; nếu chưa có thì để PENDING.
7. `07_Stakeholder_Acceptance_Signoff.pdf` — UAT được stakeholder thật ký/xác nhận, không tự sinh chữ ký.
8. `08_Presentation_Slide_Deck.pdf` — 8–10 slides, 6 phút trình bày.

Thư mục Google Drive cuối cùng phải bật `Anyone with the link can view` theo đề bài, nhưng cần người có quyền upload/chia sẻ và rà soát dữ liệu nhạy cảm trước khi công khai. Chỉ xác nhận trạng thái này sau khi truy cập và kiểm thử thực.

Báo cáo có 7 chương: Business Case/SMART, Methodology/Governance, Scope/WBS, Estimation/CPM/Velocity, Execution/Test/CI, Risk/Change Control, UAT/Closure/Lessons Learned.

Tạo demo script 5 phút, Q&A 5 phút, tổng thời gian bảo vệ 16 phút. Nếu live cloud fail chuẩn bị local Docker/video fallback có nhãn phương án dự phòng.

## 13. QUY TRÌNH TỰ ĐỘNG TRIỂN KHAI — THỰC HIỆN THEO THỨ TỰ

**Phase A — Audit và governance (bắt đầu ngay)**
1. `pwd`, `git status -sb`, `git remote -v`, `git log --all`, `gh auth status` (nếu `gh` có), kiểm tra manifest/config/test/code. Không in secrets.
2. Xác định có repo V2 mới hay đang ở repo cũ; không phá repo cũ. Nếu workspace cũ, làm việc trong nhánh/không gian được cho phép và đề xuất repo V2 riêng.
3. Xây compliance matrix với trạng thái thực, gap 9/15 tuần, provenance audit, architecture gap.
4. Tạo Project Charter draft, Scope/WBS Dictionary, roadmap 9 tuần, RACI, risk v1, test plan, sprint ceremonies.
5. Tạo `.github` templates, labels, milestones, Projects, 45 Issues ở trên nếu có quyền; idempotent sync; capture URLs.

**Phase B — Triển khai MVP theo vertical slices**
6. Setup monorepo/infra dev/auth; test/check/commit/PR theo identity hiện tại.
7. Event lifecycle + catalog; test/check/commit/PR.
8. Inventory + booking transactions + orders; race tests; test/check/commit/PR.
9. Payment adapter + verified settlement + QR; test/check/commit/PR.
10. Staff check-in + analytics + end-to-end happy/negative paths; test/check/commit/PR.

**Phase C — Cloud/Release**
11. Docker production + GitHub CI/CD + IaC + security + logs + backup/restore scripts.
12. Deploy public HTTPS **chỉ khi được phê duyệt quyền/cloud cost**; xác minh URL thật, SSL, healthcheck, rollback và UAT environment.
13. Regression, risk/issue review, evidence index, template UAT, final report/slides drafts.

Trong mỗi Phase, thực hiện được bao nhiêu thì làm bấy nhiêu và báo tiến độ thực; không có quyền để merge/approve/deploy thì để PR/code/tài liệu sẵn và báo blocker cụ thể. Không tự điền `DONE` cho tuần đã qua hay làm giả stakeholder.

## 14. ĐẦU RA TỐI THIỂU BẮT BUỘC NGAY Ở LƯỢT THỰC THI ĐẦU

Không chỉ trả lời bằng lý thuyết. Nếu có quyền ghi workspace, bắt buộc tạo/hoàn thiện các tệp:

```text
README.md
CONTRIBUTING.md
.github/ISSUE_TEMPLATE/feature.yml
.github/ISSUE_TEMPLATE/bug.yml
.github/PULL_REQUEST_TEMPLATE.md
.github/workflows/ci.yml
docs/qlda/COMPLIANCE_MATRIX.md
docs/qlda/15_WEEK_REQUIREMENT_GAP.md
docs/qlda/PROJECT_CHARTER_DRAFT.md
docs/qlda/SCOPE_BASELINE.md
docs/qlda/WBS.md
docs/qlda/WBS_DICTIONARY.md
docs/qlda/9_WEEK_ROADMAP.md
docs/qlda/SPRINTS.md
docs/qlda/PRODUCT_BACKLOG.md
docs/qlda/COMMIT_AND_PR_PLAN.md
docs/qlda/TEAM_RACI.md
docs/qlda/RISK_REGISTER.md
docs/qlda/CHANGE_REQUEST_TEMPLATE.md
docs/qlda/QUALITY_AND_TEST_PLAN.md
docs/qlda/evidence/EVIDENCE_INDEX.md
docs/qlda/evidence/ARTIFACT_CHECKLIST.md
scripts/github/sync-backlog.*
```

Chỉ tạo file khác nếu thật sự cần; tôn trọng file đang có, không overwrite vô ý. Giải thích tool/permission blocker kèm cách gỡ cụ thể. Khi đã có đủ setup, **chủ động bắt đầu Issue P0 đầu tiên có thể thực thi** và tiếp tục các Issues tiếp theo phù hợp phiên làm việc.

## 15. MẪU BÁO CÁO SAU MỖI VÒNG THỰC THI

Xuất bảng ngắn, có bằng chứng:

| Hạng mục | Đã thực hiện thực tế | Issue/PR/SHA | Test đã chạy | Status | Next action |
|---|---|---|---|---|---|

Kèm:
- Repo/branch hiện tại và authenticated GitHub identity.
- GitHub Project URL, Issue URLs, PR URLs thật (nếu tạo được).
- Tests đã chạy, lệnh, exit code, lỗi và cách xử lý.
- Đóng góp per role: **assigned vs actual authored**, không đánh đồng.
- Những việc `PENDING_HUMAN` (PR approval, stakeholder, AWS cost, UAT, signed docs).
- Số yêu cầu QLDA đáp ứng có dẫn evidence; chênh lệch tiêu chí 15 tuần.
- 3 việc ưu tiên tiếp theo theo dependency.

**Hãy bắt đầu bằng audit repository thực, sau đó thực hiện Phase A và các phần Phase B khả thi ngay. Không cần xin xác nhận cho việc đọc code, viết tài liệu, chạy test local hoặc tạo Issue/PR trong repo đã được cấp quyền; cần phê duyệt cho chi phí cloud, hành động trên production, xóa dữ liệu, mạo danh (không được làm) và bước nộp chính thức.**
