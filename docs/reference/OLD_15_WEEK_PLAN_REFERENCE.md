# TIXFLOW V2 — KẾ HOẠCH TÁI XÂY DỰNG DỰ ÁN 15 TUẦN

**Phiên bản:** 1.0 — Bản kế hoạch đề xuất, chưa phải hồ sơ nghiệm thu.  
**Ngày lập kế hoạch:** 02/11/2026.  
**Dự án tham khảo:** https://github.com/nvtank/ticketflow-aws  
**Đề xuất repository mới:** `tixflow-v2` (tên tạm; chưa tạo trên GitHub).  
**Đối chiếu:** Hướng dẫn đồ án Quản trị dự án phần mềm VKU do nhóm cung cấp.

> Mọi mốc "Tuần 1–15" là tuần học, phải ánh xạ sang lịch chính thức của lớp sau khi xác nhận. Tất cả Story Points, mục tiêu chất lượng, thời lượng và kiến trúc cloud dưới đây là **đề xuất để nhóm xác nhận trong buổi kickoff**, không phải số liệu đã đo hay hạng mục đã thực hiện.

## I. Mục tiêu và nguyên tắc tái xây dựng

**Business problem:** Ban tổ chức các workshop/sự kiện quy mô nhỏ cần tạo sự kiện, quản lý vé/ghế, tiếp nhận đăng ký hoặc thanh toán, phát hành QR và kiểm tra vào cổng; khách cần khám phá sự kiện, chọn vé, thanh toán/đặt vé và theo dõi trạng thái.

**Mục tiêu sản phẩm:** Một ứng dụng web HTTPS hoạt động với database thật, có tối thiểu bốn vai trò CUSTOMER, ORGANIZER, STAFF, ADMIN và chạy được luồng end-to-end: tạo sự kiện → duyệt → mở bán → giữ ghế → đặt hàng/thanh toán được xác minh → nhận QR → staff check-in → organizer xem báo cáo.

**Mục tiêu QLDA:** Repository thật có đóng góp xuyên suốt 15 tuần; GitHub Project, Issues, PR review, CI, Sprint retrospectives, WBS 100% Rule, Risk Register, ít nhất một biến cố quản lý có xử lý thực tế, stakeholder thật, UAT Signoff, báo cáo và demo 16 phút.

**Nguyên tắc:** Tạo repository mới để tách lịch sử đội cũ; dùng repo cũ như tài liệu tham khảo. Không nhận công lao đóng góp cũ là kết quả nhóm mới, không backdate/giả commit hoặc dựng biến cố quản lý. Nếu tái sử dụng mã nguồn, ghi rõ xuất xứ, kiểm tra quyền và sự đồng ý của người đóng góp tương ứng; repo cũ chưa hiển thị giấy phép LICENSE công khai. Giữ lịch sử cũ nguyên vẹn.

### Hướng nguồn gốc đề tài

Đề xuất **Pathway 3** nếu nhóm nhận được yêu cầu thử nghiệm và xác nhận từ một CLB/đơn vị tổ chức sự kiện tại VKU. Ngay Tuần 1 cần có **stakeholder cụ thể và bằng chứng liên hệ**. Nếu không thể xác nhận, chuyển sang Pathway 1 nếu thực sự song hành học phần chuyên ngành và có giảng viên/nhóm người dùng thử nghiệm. Không tự ghi tên hoặc chữ ký stakeholder khi chưa có sự đồng ý.

## II. Nhân sự, trách nhiệm và QA

| Nhân sự | Vai trò chính | Ownership | Trách nhiệm QA/bổ trợ |
|---|---|---|---|
| Nguyễn Văn Tuấn Anh | PM + CloudOps | Charter, WBS, Scope/Risk, GitHub Project, stakeholder, DevOps/AWS, backup, monitoring, UAT, evidence | Chủ trì test plan, E2E execution, chất lượng phát hành và demo; review phần cloud |
| Nguyễn Văn Hoàn | Full-stack (Frontend Owner) | Next.js, design system, trang public/organizer/customer/staff, API client, tính khả dụng, một số endpoint hỗ trợ | Playwright E2E, accessibility/responsive, review PR API tích hợp theo luồng |
| Đoàn Quang Tuấn An | Tech Lead + Backend | System architecture, NestJS, Prisma/DB, JWT/RBAC, event lifecycle, booking transaction, order/payment, check-in | Vitest/unit/integration, security, API contract, review kỹ thuật, quyết định kiến trúc |

**5 vai trò chuẩn QLDA:** PM = Tuấn Anh; Technical Lead = Tuấn An; Backend = Tuấn An + Hoàn hỗ trợ; Frontend = Hoàn; QA/Test = cả ba, Tuấn Anh tổng hợp bằng chứng.

**Nguyên tắc phân công:** Một Issue có đúng một Directly Responsible Individual (DRI), có reviewer khác người implement. Quyết định nghiệp vụ do PM thống nhất với stakeholder; quyết định kiến trúc do Tech Lead, nhưng thay đổi ảnh hưởng chi phí/cloud cần PM phê duyệt. Không tự merge PR của mình nếu không có review từ thành viên khác.

**Ước tính công sức:** 10–12 giờ/người/tuần × 3 × 15 tuần = khoảng 450–540 giờ danh nghĩa; dành 15–20% cho bug, kiểm thử lại và thay đổi. Không xem Story Point là giờ công; nhóm dùng Planning Poker 1/2/3/5/8 để ước lượng tương đối rồi hiệu chỉnh theo velocity thực.

## III. Scope baseline v1.0

### In-scope (MVP bắt buộc)

1. Web responsive: danh sách/tìm kiếm sự kiện, chi tiết và đăng nhập.
2. Auth JWT, refresh cookie, RBAC: CUSTOMER, ORGANIZER, STAFF, ADMIN; membership theo tổ chức.
3. Organizer tạo/sửa nháp, cấu hình địa điểm/zone/giá/ghế; gửi duyệt; Admin duyệt/từ chối; công bố sự kiện.
4. Booking: hiển thị tồn kho; giữ ghế với transaction PostgreSQL, TTL dự kiến 5 phút, tối đa số vé theo event, phát hiện xung đột hai người đặt cùng ghế, release/expire.
5. Orders: giá lấy từ server, idempotent checkout; payment adapter mock cho automated tests, tích hợp PayOS khi được cấp quyền/credentials hợp lệ; không phát hành vé chỉ dựa trên redirect thành công.
6. QR tickets có chữ ký/định danh an toàn, staff check-in một lần; analytics cơ bản theo dữ liệu thật.
7. Socket.IO cập nhật tình trạng ghế, sau-commit; REST vẫn là dữ liệu chuẩn khi reconnect.
8. Hạ tầng chạy local Docker; GitHub CI; môi trường staging sớm; bản demo public HTTPS trên AWS theo phương án tối giản; backup và log.
9. Unit/integration/E2E và bằng chứng Sprint/UAT.

### Out-of-scope tại mốc MVP

- Waiting Room dùng Redis/Lua và chống bot/quy mô 1.000 người (stretch, chỉ làm khi baseline đạt).
- Venue Studio kéo thả nâng cao, animation phức tạp, cộng đồng/nghệ sĩ, mạng xã hội.
- Google OAuth, email/SMS tự động, coupon, multi-tenant billing, refund automation.
- SLA production/HA/multi-region, cân bằng tải và tự động scale.
- Thanh toán tiền thật nếu chưa có thông tin nhà cung cấp, môi trường public HTTPS, chấp thuận/điều kiện vận hành phù hợp.

**P0/P1:** P0 = một event có hai loại giá, hành trình mua/nhận vé/check-in hoàn tất. P1 = realtime, analytics dashboard đẹp, nâng cấp cloud; stretch = waiting room, Venue Studio nâng cao, social features.

## IV. Kiến trúc đề xuất

**Monorepo** `pnpm` chứa `apps/web` (Next.js), `apps/api` (NestJS), `packages/shared` (DTO/types/schema), `infrastructure` (Docker + Terraform + vận hành), `docs`, `e2e`.

```text
Browser HTTPS
   |
   v
Caddy reverse proxy (AWS EC2; TLS tự động với domain hợp lệ)
   |-- / --> Next.js web :3000
   |-- /api/v1 --> NestJS API :4000
   |-- /socket.io --> NestJS WebSocket
                        |-- Prisma --> PostgreSQL (private, persistent volume)
                        |-- Redis (private, ephemeral cache)

GitHub PR --> GitHub Actions: lint/typecheck/unit/integration/build/E2E
main release --> GitHub Actions OIDC -> ECR -> AWS SSM deploy on EC2
Monitoring: healthcheck + CloudWatch logs/alerts; Database backup -> S3 encrypted
```

**Cloud lựa chọn cho đồ án:** 1 EC2 instance phù hợp tài nguyên, Docker Compose, Caddy, ECR, IAM role/SSM, S3 backup, CloudWatch, AWS Budgets. Đây là triển khai **single-node/demo**; PostgreSQL trên cùng máy tạo single point of failure, phải có backup/restore được thử nghiệm. Nâng cấp RDS/ElastiCache/ALB/ECS chỉ khi ngân sách và yêu cầu cho phép. Không công bố khả năng chịu tải chưa đo. DNS và công cụ SSL hợp lệ là điều kiện để HTTPS.

**Bảo mật:** Security Group chỉ mở 80/443 (SSH không public nếu dùng SSM), DB/Redis không publish công khai, secrets trong GitHub Environments/SSM, OIDC không dùng access key dài hạn, log không lộ token, database migration có quy trình rollback/dump. Docker image và cơ chế deploy dùng immutable version tags.

## V. WBS (100% Rule) và gói bàn giao

| WBS | Work package | Deliverables chính | Accountable owner |
|---|---|---|---|
| 1.0 | Project Governance | Charter, stakeholder, scope, WBS, 15-week baseline, board, Sprint docs, Risk/Change/UAT | Tuấn Anh |
| 2.0 | Discovery & Architecture | User stories, personas, C4, ERD, ADR, API contracts, test strategy | Tuấn An + Hoàn |
| 3.0 | Foundation & Access | pnpm monorepo, Docker dev/test, design system, auth, RBAC, tests, CI | Tuấn An / Hoàn / Tuấn Anh |
| 4.0 | Event & Inventory | Organization, event CRUD/approval, public catalog, zone/seat grid, tests | Tuấn An + Hoàn |
| 5.0 | Booking & Realtime | Atomic hold, TTL, order, socket, customer UI, race tests | Tuấn An + Hoàn |
| 6.0 | Payment & Tickets | Provider abstraction, reconciliation, signed QR, ticket UI, tests | Tuấn An + Hoàn |
| 7.0 | Check-in & Reporting | Staff workflow, one-time check-in, analytics, tests | Tuấn An + Hoàn |
| 8.0 | Cloud, Release & Quality | staging/production HTTPS, CI/CD, monitoring, backup/restore, E2E, security | Tuấn Anh + cả nhóm |
| 9.0 | Acceptance & Closure | UAT, feedback/fixes, 7 evidence artifacts + slides, final demo & retrospective | Tuấn Anh + cả nhóm |

Mỗi WBS package có một dictionary entry: ID, mô tả, phạm vi công việc, DRI, đầu ra, deadline, dependencies, estimate, acceptance criteria và link Issue/PR/test evidence.

## VI. Lộ trình 15 tuần (6 Sprint, 2 tuần/Sprint)

| Tuần | Sprint | Tuấn Anh — PM/CloudOps | Hoàn — Full-stack | Tuấn An — Tech Lead/BE | Deliverable/gate |
|---|---|---|---|---|---|
| 1 | Inception | Stakeholder, Charter, WBS, risk v1, Project board, lịch họp | Figma/wireframe, user journeys | ERD v1, module map, ADR, contracts | Charter/Scope baseline, backlog v1 |
| 2 | S1 | Docker dev, env/secrets policy, GitHub templates | Next.js shell, auth pages | API bootstrap, Prisma initial, user schema | Web/API/DB chạy local |
| 3 | S1 | CI lint/typecheck/build/test, Sprint dashboard | Auth forms, protected routes | JWT/refresh/RBAC, tests | Demo login 4 roles, S1 Review + Retro |
| 4 | S2 | Staging infra skeleton, logs, risk review | Public event list/detail, organizer forms | Event/organization tables, CRUD | Tạo và xem sự kiện nháp |
| 5 | S2 | Staging HTTPS, deploy runbook | Organizer seat-grid + Admin review UI | Inventory/price, approval lifecycle, audit | Event draft → published, S2 Retro |
| 6 | S3 | Observability và acceptance traces | Customer seat selector, countdown UI | Hold transaction, TTL, ownership | Hai user tranh một ghế an toàn |
| 7 | S3 | Risk v2, CPM/velocity update, staging test | Realtime states + checkout UX | Orders/expire/reconcile, Socket.IO, race tests | Seat hold/order/realtime, S3 Review |
| 8 | S4 | Payment config strategy, secret handling | Checkout UI, các trạng thái payment | Provider adapter, payment initiation/idempotency | Order → payment pending |
| 9 | S4 | Webhook HTTPS staging, API ops runbook | My tickets, QR UI | Payment verification, QR issuance, regression | Payment verified → QR, S4 Review |
| 10 | S5 | Cloud prod pipeline v1, budget alerts | Staff scan/check-in UI | Check-in transaction/RBAC/audit | QR check-in một lần |
| 11 | S5 | Incident runbook, proof exports | Organizer reporting dashboard | Revenue/occupancy/check-in metrics | Reports lấy DB thật, S5 Review |
| 12 | S6 | AWS production deploy, backups/restore drill | Full browser E2E/responsive fixes | Security hardening/integration gates | Public HTTPS demo, rollback verified |
| 13 | S6 | Performance measurement nhỏ, risk/change control, release freeze | Bug fixes, demo UX, accessibility | Race/payment regression, API docs | Feature-complete candidate, S6 Review |
| 14 | Acceptance | UAT session với stakeholder, CR nếu phát sinh, evidence audit | Fix UAT UI, demo steps | Fix UAT API, verify invariants | Signed UAT hoặc email nghiệm thu thật |
| 15 | Closure | Final report 15–25 trang, Drive link, kiểm chứng tất cả artifact | Slide, rehearsal, video backup | Tech appendix, database/architecture Q&A | 8 tài liệu, demo 16 phút, Final Retro |

**Critical path sơ bộ:** Scope/contract → Auth/RBAC → Event/Inventory → Atomic Hold → Orders/Payment → QR → Check-in → UAT → Sign-off. Các hạng mục CloudOps nền tảng và FE có thể chạy song song nhưng staging phải sẵn trước UAT; không có mã thanh toán/ghế thật thì không được sign-off core flow. Nếu vượt năng lực, bỏ tính năng stretch trước; dự phòng 15–20% capacity mỗi sprint.

**Sprint cadence:** Monday planning ~45m; standup 10–15m × 3 lần/tuần; PR review liên tục; Friday weekly status 20m; cuối Sprint: review 30m + retrospective 30m. Khung giờ thật do nhóm thống nhất.

## VII. GitHub Issue backlog đề xuất

SP chỉ là ước lượng khởi tạo để Planning Poker; chưa phản ánh velocity thực tế. ID `TF-xxx` là mã lập kế hoạch, **chưa tạo Issues trên GitHub**.

| ID | WBS | Issue / Acceptance evidence | Owner | Tuần | SP |
|---|---|---|---|---|---:|
| TF-001 | 1.0 | Charter + stakeholder contact; lưu phiên bản có người duyệt | Anh | 1 | 3 |
| TF-002 | 1.0 | Scope, WBS tree, WBS Dictionary + dependencies | Anh | 1 | 5 |
| TF-003 | 1.0 | GitHub Project board + Issue/PR/ADR/DoD templates | Anh | 1 | 3 |
| TF-004 | 2.0 | C4/ERD/OpenAPI draft, policy booking/permission | An | 1–2 | 5 |
| TF-005 | 3.0 | pnpm monorepo + shared contracts + base API health | An | 2 | 3 |
| TF-006 | 3.0 | Next.js layout, design tokens, navigation | Hoàn | 2 | 5 |
| TF-007 | 3.0 | PostgreSQL/Prisma user/session schema migration | An | 2 | 5 |
| TF-008 | 8.0 | Docker Compose + env/secret setup không commit secret | Anh | 2 | 5 |
| TF-009 | 8.0 | PR CI: install/lint/typecheck/test/build | Anh | 3 | 5 |
| TF-010 | 3.0 | Register/login/refresh/logout + RBAC | An | 3 | 8 |
| TF-011 | 3.0 | Auth UI, loading/error/session redirects | Hoàn | 3 | 5 |
| TF-012 | 3.0 | Integration tests 4 roles + cross-org access denies | An | 3 | 5 |
| TF-013 | 4.0 | Event/organization/venue/ticket type schema | An | 4 | 5 |
| TF-014 | 4.0 | Organizer CRUD + Admin approval + audit | An | 4–5 | 8 |
| TF-015 | 4.0 | Public catalog/detail + organizer/admin UI | Hoàn | 4–5 | 8 |
| TF-016 | 4.0 | Atomic seat inventory creation + stock rules | An | 5 | 5 |
| TF-017 | 4.0 | Organizer basic seat grid with two price types | Hoàn | 5 | 5 |
| TF-018 | 8.0 | Staging HTTPS + deploy script/runbook | Anh | 5 | 8 |
| TF-019 | 5.0 | Atomic seat holds: ownership, dedupe and max qty | An | 6 | 8 |
| TF-020 | 5.0 | 300s hold expiry/reclaim + idempotent release | An | 6–7 | 5 |
| TF-021 | 5.0 | Customer booking selector + server countdown | Hoàn | 6–7 | 8 |
| TF-022 | 5.0 | Concurrent same-seat 20/100 request tests | An | 7 | 8 |
| TF-023 | 5.0 | Authenticated Socket.IO room, update after commit | An | 7 | 5 |
| TF-024 | 5.0 | Realtime client + reconnect REST resync | Hoàn | 7 | 3 |
| TF-025 | 6.0 | Payment adapter (mock + provider if authorized) | An | 8 | 8 |
| TF-026 | 5/6 | Order state machine, server total, idempotency | An | 8 | 8 |
| TF-027 | 6.0 | Checkout/payment states including failure/expiry | Hoàn | 8–9 | 5 |
| TF-028 | 6.0 | Signed QR ticket issuance after verified payment | An | 9 | 5 |
| TF-029 | 6.0 | My Tickets + owned QR details | Hoàn | 9 | 5 |
| TF-030 | 6.0 | Duplicate webhook/late-payment regression evidence | An | 9 | 5 |
| TF-031 | 7.0 | Staff RBAC, verify vs confirm, single-use check-in | An | 10 | 8 |
| TF-032 | 7.0 | Staff scanner and manual fallback UI | Hoàn | 10 | 5 |
| TF-033 | 7.0 | True revenue, occupancy, attendance aggregations | An | 11 | 5 |
| TF-034 | 7.0 | Organizer/admin reporting dashboards | Hoàn | 11 | 5 |
| TF-035 | 8.0 | AWS IaC, ECR/SSM/GitHub OIDC CD, TLS | Anh | 10–12 | 8 |
| TF-036 | 8.0 | CloudWatch, alarm, backup + verified restore | Anh | 12 | 5 |
| TF-037 | 8.0 | Browser E2E end-to-end four roles, responsive | Hoàn | 12 | 8 |
| TF-038 | 8.0 | Security tests/permission matrix/negative cases | An | 12 | 5 |
| TF-039 | 8.0 | Small measured load test, bottleneck report, recovery | Anh | 13 | 5 |
| TF-040 | 1.0 | Risk evolution, real challenge or approved scope CR | Anh | Theo thực tế | 3 |
| TF-041 | 9.0 | UAT script/test session + stakeholder sign-off | Anh | 14 | 5 |
| TF-042 | 9.0 | UAT defect fixes + regression | Hoàn (An review) | 14 | 5 |
| TF-043 | 9.0 | Final report 7 chapters, traceable GitHub evidence | Anh | 14–15 | 8 |
| TF-044 | 9.0 | Slide 8–10 pages, live-demo script, offline fallback | Hoàn | 15 | 5 |
| TF-045 | 9.0 | Final retro, Drive evidence audit, signoff check | Anh | 15 | 5 |

**Cảnh báo planning:** Có nhiều Issue 8 SP/phức tạp; khi Sprint Planning nên chia thành Issue 3–5 SP hoặc child tasks để review/test trong 2–3 ngày. Các việc nhiều người thực hiện phải có subtask/PR nhỏ. WBS gói công việc không được tính trùng với subtask.

## VIII. Product Backlog: User stories và Acceptance Criteria mẫu

**US-01 — Buyer login:** Với vai trò CUSTOMER, tôi có thể đăng ký/đăng nhập để mua vé. AC: email trùng báo 409; mật khẩu không lưu plain text; refresh token được bảo vệ; logout thu hồi phiên; staff/organizer/customer không tự truy cập route ADMIN.

**US-02 — Organizer publish:** ORGANIZER có thể tạo nháp event với loại vé, thời gian và venue; sau khi gửi duyệt, ADMIN duyệt mới xuất hiện trong public catalog. AC: event rejected sửa/gửi lại được; owner tổ chức khác không thể sửa; chặn chỉnh cấu trúc ghế khi đã có giao dịch.

**US-03 — Concurrent booking:** Hai CUSTOMER cùng chọn một ghế; đúng tối đa một người giữ ghế thành công. AC: hold có server deadline, hết hạn thì người khác được giữ; order không gia hạn hold; idempotent retry không nhân đôi order; giá/ghế xác định từ server.

**US-04 — Payment:** Customer có đơn valid thanh toán qua provider; hệ thống phát hành vé **chỉ sau khi xác minh thanh toán**. AC: redirect thành công không phát vé; webhook trùng không phát vé trùng; payment muộn không chiếm chỗ đã thuộc người khác; log không có credentials.

**US-05 — Check-in:** STAFF được phân công có thể xác minh QR và xác nhận vào cổng. AC: verify không tiêu thụ; confirm VALID→USED atomic; hai yêu cầu quét đồng thời chỉ một thành công; khác sự kiện/không được phân công bị từ chối.

**US-06 — Real analytics:** ORGANIZER xem số vé bán, doanh thu đơn đã PAID, attendance. AC: query từ DB thật, lọc theo tổ chức, không hardcode KPI hoặc đếm lặp payment.

## IX. Quản trị công việc GitHub

**Board columns:** `Backlog` → `Ready` → `In Progress` → `In Review` → `Done`. Mỗi Issue gồm `WBS`, `Sprint`, `Story points`, `Priority P0/P1`, `Owner`, `Acceptance Criteria`, `Dependency`, `Risk`, `Evidence link`.

**Labels đề xuất:** `type:feature`, `type:bug`, `type:docs`, `type:test`, `area:frontend`, `area:backend`, `area:cloud`, `priority:P0`, `priority:P1`, `status:blocked`, `risk`, `scope-change`.

**Workflow:** Issue Ready → `feature/TF-xxx-short-name` → Conventional Commits → Draft PR → automated quality checks → 1 peer approval → merge (squash) → issue Done. `main` protected: require checks, PR, prevent direct push; `develop` tùy thực tiễn. Chính sách branch/ruleset phải được kiểm tra bằng tài khoản có quyền Admin; chưa khẳng định đã bật.

**PR checklist:** `Closes #...`, thay đổi + ảnh/screenshots nếu UI, migrations, test cases & real commands, risk/security notes, reviewer, link CI. Chỉ Done khi chạy được ở staging nếu task ảnh hưởng release, và evidence liên kết được từ Issue.

**Sprint ceremonies:** planning 45 phút; 3 standup/tuần 10–15 phút; sprint review 30 phút; retro 30 phút. Tuấn Anh làm Scrum Master; Tuấn An chủ trì kiến trúc; Hoàn demo tương tác web. Biên bản họp lưu thật (ngày, tham dự, quyết định, blockers/action owners).

**Definition of Ready:** Có user value, phạm vi, acceptance criteria có thể test, dữ liệu/API cần thiết, DRI, SP, dependencies. **Definition of Done:** Merge reviewed PR, lint/typecheck/build pass, test phù hợp pass, không commit secrets, cập nhật docs, có demo/evidence, acceptance criteria được PM/QA xác nhận.

**Metrics:** weekly planned-vs-done SP, burndown thực, velocity mỗi sprint, open/closed issues, PR review lead time, CI pass rate, bugs theo severity, UAT cases pass. Không đặt quota commit vô nghĩa hoặc giả số liệu/burndown. Baseline velocity chỉ có sau Sprint 1.

## X. Dependency/CPM & Milestone gates

| Gate | Deadline | Đầu ra/điều kiện không được bỏ |
|---|---|---|
| M0 | Cuối W1 | Charter + stakeholder, WBS/board/scope baseline |
| M1 | Cuối W3 | 4-role auth chạy trên local, CI và test auth |
| M2 | Cuối W5 | Event approve/publish + inventory, staging URL |
| M3 | Cuối W7 | Atomic hold/orders + concurrency tests |
| M4 | Cuối W9 | Verified payment/mock adapter + QR thật theo trạng thái DB |
| M5 | Cuối W11 | Staff check-in + analytics |
| M6 | Cuối W13 | Public HTTPS, backup restore, CI/E2E release candidate |
| M7 | Cuối W14 | UAT thật + signoff, mọi P0 bug được xử lý |
| M8 | Cuối W15 | Evidence Package 8 files, report/demo rehearsal |

CPM sơ bộ (tuần): stakeholder contract (1) → auth foundation (2) → event/inventory (2) → booking (2) → payment/QR (2) → checkin/analytics (2) → hardening/public release (2) → UAT (1) → closure (1) = 15. Đây là giả định ban đầu, cần xác định hoạt động song song/float qua WBS Dictionary rồi cập nhật CPM thực khi khối lượng thay đổi. Chừa buffer theo từng Sprint bằng cách cắt stretch tasks, không hứa có float ở cuối đường găng.

## XI. QA Test Matrix

| ID | Loại | Kịch bản | Chủ trì | Evidence |
|---|---|---|---|---|
| QA-01 | Unit | JWT/session/RBAC policy, validation | An | Vitest logs |
| QA-02 | Integration | Cross-org access, event approval lifecycle | An | Tests DB thật |
| QA-03 | Integration/concurrency | 20/100 request cùng ghế; đúng 1 hold, rollback atomic | An | Logs DB/test |
| QA-04 | Integration | TTL expiration, reclaim, retry idempotent | An | Timed test results |
| QA-05 | Integration | Payment callbacks duplicated/out-of-order, QR once | An | Test reports |
| QA-06 | Integration | QR verify/confirm; duplicate check-in refused | An | Test reports |
| QA-07 | E2E | Organizer create → Admin approve → buyer purchase → staff scan | Hoàn | Playwright trace/video |
| QA-08 | UI | 1440/768/390/320px, keyboard, empty/error states | Hoàn | Screenshots/checklist |
| QA-09 | Security | Forged token, wrong role, illegal edit, secrets scan | An + Anh | Audit checklist |
| QA-10 | Cloud/ops | HTTPS, DB non-public, backup and restore, deploy rollback | Anh | Runbook/logs |
| QA-11 | UAT | Stakeholder 5–8 scenarios with actual feedback | Anh | Signed record / email |

Các con số 20/100 là các kịch bản tranh chấp cục bộ, **không phải** tuyên bố hỗ trợ 100/1.000 người đồng thời trên internet.

## XII. Risk Register v1 (phải cập nhật ở từng Sprint)

Scale: Probability P 1–5, Impact I 1–5, score = P×I. Điểm chỉ là xếp hạng ban đầu.

| Risk | P×I | Trigger | Mitigation | Owner |
|---|---:|---|---|---|
| R1 Trễ backend critical path | 4×5=20 | Auth/booking SP carry-over 2 tuần | Chia issue ≤5 SP, Hoàn hỗ trợ endpoint, cắt feature stretch | Anh + An |
| R2 Double booking/race condition | 3×5=15 | Same seat 2 successful holds | DB locks/constraints/idempotency, concurrency test | An |
| R3 Payment verification không hoàn chỉnh | 3×5=15 | Không có webhook/credentials, callback lỗi | Provider abstraction + mock test; chỉ claim real transfer khi verified | An |
| R4 AWS costs/credit exceeded | 3×4=12 | Bill forecast vượt trần được duyệt | Budget alerts, 1-node staging, stop nonessential services | Anh |
| R5 Member availability/scope creep | 4×4=16 | Burn-down flat, extra features giữa Sprint | Baseline, CCB quyết định, ưu tiên P0, capacity buffer | Anh |
| R6 Cloud instance/database failure | 3×5=15 | Healthcheck unavailable/data corrupted | Backups, restore drill, rollback images, local fallback | Anh |
| R7 Thiếu stakeholder/UAT signoff | 3×5=15 | Chưa xác nhận stakeholder cuối W2 | Liên hệ sớm; chốt Pathway phù hợp, lịch UAT W14 | Anh |
| R8 Auth/secret leak | 3×5=15 | Secrets in commit/log | Secret scan/rotation, OIDC, IAM least privilege | An + Anh |
| R9 Historical evidence không đủ/chồng lẫn | 4×5=20 | Repo lịch sử cũ, commit burst/backdate | New repo and honest provenance, weekly PR/sprint evidence | Anh |

**Risk evolution:** lưu Risk Register Sprint 1 và Sprint 2 với before/after scores, trigger, action taken, proof URLs. Nếu một risk trở thành issue, ghi actual resolution và impact. Không tạo sự cố giả để điền biểu mẫu.

## XIII. Scope Change Control

`CR-ID` → Người đề xuất/Ngày thật → Baseline bị ảnh hưởng → Lợi ích → Tác động SP/chi phí/timeline/risk → Recommendation của Tech Lead → CCB (Tuấn Anh + Tuấn An + stakeholder trong phạm vi cho phép) → Decision Approved/Rejected/Deferred → Updated Issues/Sprint Plan → Evidence và closeout.

Ví dụ **tình huống có thể phát sinh, không phải biến cố đã xảy ra**: stakeholder muốn thêm sơ đồ ghế kéo thả vào W8. CCB quyết định deferred sang post-MVP vì ảnh hưởng booking/payment critical path; cập nhật baseline và biên bản. Chỉ dùng hồ sơ chính thức nếu yêu cầu thực sự được stakeholder đưa ra và có quyết định thật.

## XIV. Kế hoạch AWS chi tiết cho PM/CloudOps

- **Tuần 1–2:** AWS account, MFA, budget ceiling đã duyệt, IAM roles, Terraform skeleton, local Compose và diagrams.
- **Tuần 3–5:** Containerize API/web, lên staging HTTPS; DNS/certificate; migrations guarded; health endpoint; test environment variables; không publish DB/Redis.
- **Tuần 6–9:** pipeline CI, artifact digest, protected deploy credentials với OIDC, ECR image, secret management, webhook callback URL và observability.
- **Tuần 10–12:** production/demo EC2 size theo đo thực tế, GitHub Actions→ECR→SSM deploy, lệnh rollback, CloudWatch log/alarms, encrypted S3 backup và restore test.
- **Tuần 13–15:** load baseline có đo, runbook, game-day rollback/restore, UAT deployment freeze, demo backup local/video, lưu bằng chứng production HTTPS.

**Checklist vận hành:** `GET /health/live`, `GET /health/ready`, DB/Redis private, firewall ports, audit AWS spending, credential ownership, backup retention, log redaction, rollback to previous tag, restart policy, post-deployment smoke tests.

**Giới hạn:** EC2 + database cùng node chỉ là demo/evaluation, không đạt HA; nếu stakeholder đòi dùng lâu dài cần RDS/managed Redis và kế hoạch bảo trì, security review, capacity, DR, tài chính riêng. Không chắc chắn AWS free tier; giá kiểm tra thực tế trước triển khai.

## XV. Stakeholder, UAT & buổi bảo vệ

**Stakeholder candidate:** một CLB/ban tổ chức workshop trong trường, do Tuấn Anh trực tiếp xác nhận nhu cầu, sự đồng ý và lịch UAT. Không tự ghi rằng VKU hoặc CLB đã đặt hàng trước khi có chứng cứ.

**UAT quy trình:** 1) nhận business acceptance criteria; 2) setup staging/prod demo; 3) hướng dẫn người dùng thử; 4) thực hiện 5–8 task quan sát được; 5) lập defect/feedback log; 6) xử lý P0/P1; 7) sign-off qua email/biên bản có tên, vai trò, ngày thực tế và quyết định; 8) chụp bằng chứng bảo mật thông tin.

**16 phút bảo vệ:** 6 phút slide 8–10 trang; 5 phút demo live; 5 phút Q&A. Demo: organizer tạo/gửi event (dùng dữ liệu chuẩn bị cho thời gian ngắn) → admin duyệt → buyer chọn/giữ ghế/checkout mock hoặc giao dịch xác minh hợp lệ → QR ticket → staff verify+confirm → dashboard attendance. Chuẩn bị video và Docker local làm fallback cho mất mạng.

## XVI. Evidence Package — khớp tài liệu VKU

Thư mục Google Drive cuối kỳ (quyền “Anyone with the link can view” theo yêu cầu nộp, nhưng không chứa secrets/PII):

1. `01_Final_Technical_Report.pdf` — 15–25 trang, 7 chương, mô tả việc **đã** làm và có liên kết bằng chứng thật.
2. `02_Project_Charter_Signed.pdf` — điều lệ dự án 13 mục, chữ ký đúng người khi được chấp thuận.
3. `03_WBS_and_WBS_Dictionary.pdf` — WBS 100% rule, từ điển WBS, owners và dependencies.
4. `04_Risk_Register_Evolution.xlsx` — baseline risk và biến đổi Sprint 1/Sprint 2.
5. `05_Sprint_Retrospectives.pdf` — Sprint 1 Retro + Final Retro (có thể bổ sung các Sprint khác).
6. `06_Scope_Change_Control_Record.pdf` — hồ sơ Approved CR **thực tế** nếu có; không giả biên bản.
7. `07_Stakeholder_Acceptance_Signoff.pdf` — UAT hoặc email nghiệm thu từ stakeholder thật.
8. `08_Presentation_Slide_Deck.pdf` — 8–10 slides.

Chỉ số minh chứng lấy từ GitHub thực: timeline Issues/PR/commits, Actions run, burndown, sprint velocities, blockers, merge approval, test logs, deploy logs. Điều lệ và danh sách 3 thành viên phải cập nhật nhất quán trong README, repo contributors page, report và slides.

## XVII. Những việc phải làm ngay (7 ngày đầu)

**Ngày 1:** 3 thành viên họp kickoff, xác nhận các vai trò, scope P0, tên repo mới; chọn thư ký biên bản.

**Ngày 2:** Tuấn Anh tìm stakeholder thật, ghi yêu cầu và acceptance scenario; đồng thời phác thảo Charter và Risk Register. Hoàn vẽ user journey/wireframe. Tuấn An phân tích DB/API critical path.

**Ngày 3:** Chốt architecture ADR, ERD v1, mô tả scope exclusions; đặt quy tắc GitHub, tạo repo mới và mời đúng team; không sao chép commit cũ.

**Ngày 4:** WBS tree + WBS Dictionary; tạo Epic/Issues dựa backlog; Planning Poker cho Sprint 1; chốt capacity thực.

**Ngày 5:** Thiết lập branch protection/rulesets, README, Issue/PR templates, Project Board, CI baseline.

**Ngày 6:** Thử bootstrap local: API/web/PostgreSQL/Redis, CI smoke test, onboarding instructions cho cả ba máy.

**Ngày 7:** Review inception artifacts, stakeholder status, risk mới, go/no-go cho Sprint 1; ghi biên bản thật và link evidence.

## XVIII. Quyết định cần xác nhận ở kickoff (chưa tự giả định)

- Nhóm sẽ chọn stakeholder thật nào và thuộc Pathway nào?
- Có quyền tái sử dụng phần code cũ hay chỉ tham khảo? Có quyền từ các người đóng góp cũ không?
- Lịch tuần học chính xác, deadline midterm/final, giờ mỗi người có thể cam kết?
- Giới hạn AWS budget tháng và tài nguyên/số tiền được cho phép?
- PayOS chỉ demo mock hay được dùng môi trường thật; ai sở hữu merchant account?
- MVP bán ghế có sơ đồ đơn giản hay bán vé đứng (general admission) để giảm độ phức tạp?
- Quy trình reviewer/cơ chế dự phòng nếu thành viên bận thi hoặc nghỉ?

---

### Nguồn tham chiếu

- GitHub repository: https://github.com/nvtank/ticketflow-aws
- README: https://github.com/nvtank/ticketflow-aws/blob/main/README.md
- Architecture: https://github.com/nvtank/ticketflow-aws/blob/main/docs/architecture.md
- Database: https://github.com/nvtank/ticketflow-aws/blob/main/docs/database.md
- Payment limits: https://github.com/nvtank/ticketflow-aws/blob/main/docs/payments.md
- Original commit timeline / provenance: https://github.com/nvtank/ticketflow-aws/blob/main/docs/commit-timeline.md
- VKU SPM Capstone Guidelines: tệp tài liệu QLDA do người dùng cung cấp.

*File này là bản kế hoạch khởi tạo từ phân tích repository và yêu cầu học phần; không ghi nhận các tác vụ chưa triển khai là đã hoàn thành.*
