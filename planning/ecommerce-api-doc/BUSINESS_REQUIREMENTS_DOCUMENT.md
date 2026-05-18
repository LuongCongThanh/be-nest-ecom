# Business Requirements Document: E-commerce API

> [!NOTE]
> Đây là tài liệu nghiệp vụ chuẩn ở mức BA/PM cho dự án E-commerce API. Tài liệu này đóng vai trò nguồn tham chiếu gốc để đồng bộ giữa business, product, engineering, QA và vận hành.

---

## 1. Executive Summary

E-commerce API là nền tảng backend phục vụ vận hành hệ thống bán hàng trực tuyến, tập trung vào 4 năng lực cốt lõi: quản lý người dùng, quản lý danh mục sản phẩm, giỏ hàng và đơn hàng. Hệ thống được xây dựng bằng NestJS, Prisma ORM và PostgreSQL, hướng tới mô hình API-first, dễ mở rộng sang web storefront, admin portal, mobile app và tích hợp bên thứ ba.

Mục tiêu của tài liệu này là chuyển hóa nhu cầu kinh doanh thành yêu cầu rõ ràng, đo lường được và có thể triển khai được. Tài liệu này ưu tiên tính thực thi: mỗi yêu cầu đều phải gắn với giá trị kinh doanh, actor sử dụng, điều kiện chấp nhận và ràng buộc kỹ thuật chính.

---

## 2. Business Context

### 2.1 Problem Statement

Doanh nghiệp cần một backend thống nhất để:

- Quản lý danh mục sản phẩm và cấu trúc phân loại theo ngành hàng.
- Hỗ trợ khách hàng đăng ký, đăng nhập và quản lý hồ sơ.
- Cho phép khách hàng duyệt sản phẩm, thêm vào giỏ hàng và tạo đơn hàng.
- Cho phép bộ phận vận hành theo dõi trạng thái đơn hàng và thanh toán.
- Tạo nền tảng cho các giai đoạn tăng trưởng tiếp theo như khuyến mãi, đánh giá sản phẩm, thanh toán nâng cao, loyalty và analytics.

### 2.2 Business Opportunity

- Rút ngắn thời gian đưa sản phẩm ra thị trường nhờ backend dùng chung cho nhiều kênh bán.
- Giảm sai lệch dữ liệu giữa catalog, tồn kho, giỏ hàng và đơn hàng.
- Tăng tỷ lệ chuyển đổi bằng trải nghiệm mua hàng ổn định, tốc độ phản hồi tốt và dữ liệu sản phẩm nhất quán.
- Tạo nền tảng dữ liệu chuẩn để triển khai báo cáo doanh thu, retention và hành vi mua hàng.

---

## 3. Product Vision And Goals

### 3.1 Product Vision

Xây dựng một nền tảng E-commerce API có thể phục vụ từ MVP đến giai đoạn scale-up, cho phép triển khai nhanh các chức năng thương mại điện tử cốt lõi mà vẫn giữ được tính bảo mật, toàn vẹn dữ liệu và khả năng mở rộng.

### 3.2 Business Goals

- Hỗ trợ launch MVP bán hàng trực tuyến với đầy đủ luồng browse, add-to-cart và order placement.
- Chuẩn hóa dữ liệu nghiệp vụ để giảm lỗi vận hành trong xử lý đơn hàng.
- Tăng khả năng mở rộng tính năng mà không cần viết lại lõi hệ thống.
- Tạo điều kiện tích hợp dashboard, payment gateway và kênh bán mới trong các phase sau.

### 3.3 Success Metrics

| Nhóm        | KPI                                              | Mục tiêu giai đoạn MVP         |
| ----------- | ------------------------------------------------ | ------------------------------ |
| Acquisition | Tỷ lệ đăng ký thành công                         | >= 85% số lượt bắt đầu đăng ký |
| Activation  | Tỷ lệ người dùng thêm ít nhất 1 sản phẩm vào giỏ | >= 35% người dùng đăng nhập    |
| Conversion  | Tỷ lệ tạo đơn hàng thành công                    | >= 3% tổng session mua sắm     |
| Reliability | Tỷ lệ request API thành công                     | >= 99.5%                       |
| Performance | P95 response time cho catalog APIs               | < 400 ms                       |
| Operations  | Tỷ lệ đơn hàng lỗi cần xử lý tay                 | < 2%                           |

### 3.4 North Star Metric

Số đơn hàng thành công mỗi ngày.

Lý do: đây là chỉ số phản ánh trực tiếp giá trị mà nền tảng tạo ra cho doanh nghiệp, đồng thời phụ thuộc vào toàn bộ chuỗi năng lực cốt lõi như catalog, auth, cart, checkout và vận hành đơn hàng.

---

## 4. Stakeholders And Actors

### 4.1 Stakeholders

| Nhóm            | Mục tiêu chính                                                       |
| --------------- | -------------------------------------------------------------------- |
| Business Owner  | Tăng doanh thu, kiểm soát vận hành và mở rộng kênh bán               |
| Product Manager | Đảm bảo roadmap bám mục tiêu tăng trưởng và trải nghiệm mua hàng     |
| Operations / CS | Theo dõi đơn hàng, cập nhật trạng thái, xử lý khiếu nại              |
| Marketing       | Quản lý danh mục nổi bật, nội dung sản phẩm và chương trình bán hàng |
| Engineering     | Xây nền tảng ổn định, dễ mở rộng, dễ tích hợp                        |
| QA              | Đảm bảo luồng nghiệp vụ chính hoạt động đúng và ổn định              |

### 4.2 Primary Actors

| Actor             | Vai trò                                                   |
| ----------------- | --------------------------------------------------------- |
| Guest             | Duyệt catalog, xem chi tiết sản phẩm                      |
| Customer          | Đăng ký, đăng nhập, quản lý hồ sơ, giỏ hàng, đặt hàng     |
| Admin             | Quản lý users, categories, products, orders               |
| Staff             | Vận hành đơn hàng, hỗ trợ khách hàng, cập nhật trạng thái |
| External Services | Payment gateway, email service, file storage, analytics   |

---

## 5. Scope Definition

### 5.1 In Scope For MVP

- Quản lý tài khoản người dùng với JWT authentication.
- Quản lý người dùng và hồ sơ cơ bản.
- Quản lý danh mục sản phẩm nhiều cấp.
- Quản lý sản phẩm với giá, SKU, tồn kho, hình ảnh và trạng thái hoạt động.
- Giỏ hàng theo người dùng.
- Tạo đơn hàng và lưu snapshot địa chỉ giao hàng.
- Theo dõi trạng thái đơn hàng và trạng thái thanh toán.
- Tài liệu API, validation, error handling, logging cơ bản.

### 5.2 Near-Term Scope

- Refresh token và session management.
- Xác thực email, quên mật khẩu.
- Search, filter, sorting cho product catalog.
- Review, rating, wishlist, coupon, shipping methods.
- Dashboard thống kê và analytics.

### 5.3 Out Of Scope For MVP

- Marketplace nhiều nhà bán.
- OMS/WMS đầy đủ cho kho nâng cao.
- Recommendation engine và personalization theo ML.
- Kiến trúc microservices hoàn chỉnh.
- Tích hợp ERP/CRM enterprise hai chiều.

---

## 6. Business Capabilities

| Capability            | Mô tả                                         | Priority    |
| --------------------- | --------------------------------------------- | ----------- |
| Identity & Access     | Xác thực, phân quyền, quản lý phiên đăng nhập | Must Have   |
| Catalog Management    | Quản lý category, product, metadata sản phẩm  | Must Have   |
| Cart Management       | Giữ trạng thái giỏ hàng theo người dùng       | Must Have   |
| Order Management      | Tạo đơn, theo dõi vòng đời đơn hàng           | Must Have   |
| Payment Recording     | Ghi nhận tình trạng thanh toán                | Must Have   |
| Customer Profile      | Địa chỉ, hồ sơ, lịch sử tương tác cơ bản      | Should Have |
| Reporting & Analytics | Báo cáo đơn hàng, doanh thu, funnel           | Should Have |
| Promotion Engine      | Coupon, discount, campaign                    | Could Have  |

---

## 7. End-To-End Business Flows

### 7.1 Customer Purchase Flow

```mermaid
flowchart LR
    A[Guest truy cập catalog] --> B[Xem category va product]
    B --> C[Dang ky / Dang nhap]
    C --> D[Them san pham vao gio hang]
    D --> E[Cap nhat so luong va kiem tra ton kho]
    E --> F[Nhap dia chi giao hang]
    F --> G[Tao don hang]
    G --> H[Ghi nhan thanh toan]
    H --> I[Van hanh xu ly don]
    I --> J[Hoan tat giao hang]
```

### 7.2 Admin Operations Flow

- Tạo và cập nhật category.
- Tạo và cập nhật product, bao gồm giá bán, SKU, tồn kho và trạng thái active.
- Theo dõi đơn hàng theo trạng thái: pending, confirmed, processing, shipped, delivered, cancelled, refunded.
- Theo dõi thanh toán: pending, paid, failed, refunded.

---

## 8. Functional Requirements

### 8.1 Identity And Access

| ID         | Requirement                                       | Priority  | Acceptance Criteria                                                  |
| ---------- | ------------------------------------------------- | --------- | -------------------------------------------------------------------- |
| FR-AUTH-01 | Người dùng có thể đăng ký bằng email và password  | Must Have | Email là duy nhất, dữ liệu đầu vào được validate, password được hash |
| FR-AUTH-02 | Người dùng có thể đăng nhập để nhận access token  | Must Have | Token hợp lệ, trả về profile cơ bản, không lộ dữ liệu nhạy cảm       |
| FR-AUTH-03 | Hệ thống phân biệt vai trò user, admin, staff     | Must Have | Endpoint quản trị bị chặn nếu không đủ quyền                         |
| FR-AUTH-04 | Hệ thống giới hạn tần suất request để chống abuse | Must Have | API auth bị throttle theo cấu hình toàn cục                          |

### 8.2 User Profile

| ID         | Requirement                                         | Priority    | Acceptance Criteria                                           |
| ---------- | --------------------------------------------------- | ----------- | ------------------------------------------------------------- |
| FR-USER-01 | Người dùng xem được hồ sơ của mình                  | Must Have   | Trả về thông tin cá nhân không gồm password                   |
| FR-USER-02 | Người dùng cập nhật được thông tin hồ sơ cơ bản     | Must Have   | Validate input, ghi log cập nhật, dữ liệu được lưu thành công |
| FR-USER-03 | Người dùng quản lý được danh sách địa chỉ giao hàng | Should Have | Có thể đánh dấu địa chỉ mặc định                              |

### 8.3 Category Management

| ID        | Requirement                                         | Priority  | Acceptance Criteria                              |
| --------- | --------------------------------------------------- | --------- | ------------------------------------------------ |
| FR-CAT-01 | Admin tạo category nhiều cấp                        | Must Have | Hỗ trợ `parentId`, không tạo vòng lặp phân cấp   |
| FR-CAT-02 | Hệ thống trả về category tree phục vụ storefront    | Must Have | Dữ liệu phân cấp đúng và chỉ trả category active |
| FR-CAT-03 | Category có slug duy nhất để phục vụ SEO và routing | Must Have | Không cho phép trùng slug                        |

### 8.4 Product Catalog

| ID         | Requirement                                                    | Priority    | Acceptance Criteria                                        |
| ---------- | -------------------------------------------------------------- | ----------- | ---------------------------------------------------------- |
| FR-PROD-01 | Admin tạo sản phẩm với name, slug, SKU, price, stock, category | Must Have   | Các trường bắt buộc đầy đủ, SKU và slug là duy nhất        |
| FR-PROD-02 | Người dùng xem danh sách và chi tiết sản phẩm active           | Must Have   | Chỉ hiển thị sản phẩm active và chưa bị soft-delete        |
| FR-PROD-03 | Hỗ trợ hình ảnh, tags và metadata SEO                          | Should Have | Lưu được JSON metadata hợp lệ                              |
| FR-PROD-04 | Hỗ trợ so sánh giá gốc và giá bán                              | Should Have | `comparePrice` lớn hơn hoặc bằng `price` khi được cung cấp |

### 8.5 Cart Management

| ID         | Requirement                                           | Priority  | Acceptance Criteria                              |
| ---------- | ----------------------------------------------------- | --------- | ------------------------------------------------ |
| FR-CART-01 | Mỗi customer có tối đa một giỏ hàng đang hoạt động    | Must Have | `userId` là duy nhất trên cart                   |
| FR-CART-02 | Customer thêm sản phẩm vào giỏ                        | Must Have | Sản phẩm phải tồn tại, active và số lượng hợp lệ |
| FR-CART-03 | Customer cập nhật số lượng hoặc xóa sản phẩm khỏi giỏ | Must Have | Giỏ hàng phản ánh đúng tổng item sau thao tác    |
| FR-CART-04 | Hệ thống kiểm tra tồn kho trước khi tạo đơn           | Must Have | Không cho phép checkout nếu vượt stock khả dụng  |

### 8.6 Order Management

| ID        | Requirement                                                    | Priority  | Acceptance Criteria                                     |
| --------- | -------------------------------------------------------------- | --------- | ------------------------------------------------------- |
| FR-ORD-01 | Customer tạo đơn hàng từ giỏ hàng                              | Must Have | Tạo order, order items và tổng tiền nhất quán           |
| FR-ORD-02 | Hệ thống lưu snapshot địa chỉ giao hàng tại thời điểm đặt hàng | Must Have | Thay đổi địa chỉ sau này không làm sai dữ liệu order cũ |
| FR-ORD-03 | Hệ thống sinh `orderNumber` duy nhất                           | Must Have | Không trùng lặp giữa các đơn                            |
| FR-ORD-04 | Admin hoặc staff cập nhật trạng thái đơn hàng                  | Must Have | Chỉ cho phép chuyển trạng thái hợp lệ                   |
| FR-ORD-05 | Hệ thống ghi nhận trạng thái thanh toán                        | Must Have | Payment status đồng bộ với bản ghi payment              |

### 8.7 Administration And Reporting

| ID        | Requirement                                             | Priority    | Acceptance Criteria                       |
| --------- | ------------------------------------------------------- | ----------- | ----------------------------------------- |
| FR-ADM-01 | Admin xem danh sách users, products, categories, orders | Must Have   | Có phân trang và filtering cơ bản         |
| FR-ADM-02 | Admin theo dõi thống kê đơn hàng theo trạng thái        | Should Have | Có endpoint tổng hợp số lượng theo status |
| FR-ADM-03 | Hệ thống ghi log truy vết request bằng correlation id   | Must Have   | Mỗi request có request id phục vụ debug   |

---

## 9. Non-Functional Requirements

### 9.1 Security

- Password phải được hash bằng thư viện bảo mật phù hợp.
- Không trả dữ liệu nhạy cảm trong API response.
- Tất cả input phải đi qua DTO validation với whitelist và reject field không hợp lệ.
- Endpoint cần phân quyền phải dùng guard theo vai trò.
- Hạn chế abuse bằng rate limiting và logging.

### 9.2 Performance

- API catalog phải tối ưu cho đọc nhiều.
- Truy vấn danh sách phải hỗ trợ phân trang.
- Không trả payload thừa cho list endpoints.
- Các tác vụ tạo đơn và trừ tồn kho phải đảm bảo tính toàn vẹn giao dịch.

### 9.3 Reliability

- Có health check endpoint cho giám sát.
- Có format lỗi thống nhất để frontend và QA dễ xử lý.
- Có migration strategy rõ ràng cho mọi thay đổi schema.

### 9.4 Maintainability

- Tài liệu API phải cập nhật cùng tính năng.
- Cấu trúc module phải theo domain, dễ mở rộng.
- Mọi thay đổi lớn phải bám theo roadmap và task index.

---

## 10. Data Domain Summary

### 10.1 Core Entities In Current Design

- User
- Category
- Product
- Address
- Cart
- CartItem
- Order
- OrderItem
- Payment
- RefreshToken
- EmailVerificationToken
- ResetToken
- TokenBlacklist

### 10.2 Key Business Rules

- Một user chỉ có một cart.
- Category hỗ trợ self-reference để xây cây phân cấp.
- Product có soft delete bằng `deletedAt`.
- Order phải lưu snapshot địa chỉ giao hàng.
- Payment được theo dõi độc lập nhưng gắn với order.
- Trạng thái nghiệp vụ phải được chuẩn hóa bằng enum.

---

## 11. API And Integration Principles

- Thiết kế theo REST, nhất quán URL, status code và cấu trúc response.
- Tài liệu Swagger/OpenAPI là nguồn contract cho frontend và QA.
- Sẵn sàng mở rộng tích hợp với payment gateway, email provider và object storage.
- Không phụ thuộc trực tiếp vào môi trường trong business logic; cấu hình đi qua ConfigService.

---

## 12. Release Roadmap By Business Value

### Phase 1: Foundation And Identity *(bounded context: Identity)*

- Đặc tả schema chiến lược (snapshot, delete strategy, FK rules) — xem `01-Phase-1-Foundation/CHARTER.md`.
- Hoàn thiện auth, user lifecycle: register/login, refresh token rotation, change password, account verification & recovery.
- _Engineering foundation (NestJS setup, config, DB, validation, migrations, conventions) được tách sang `planning/engineering/phase-1-foundation/`._

### Phase 2: Revenue Operations *(bounded contexts: Catalog + Commerce)*

- Đặc tả entity Catalog/Commerce (Category, Product, Cart, Order) và triển khai feature ngay sau đó.
- Hoàn thiện cart, order, payment recording.
- Bổ sung search, filtering, upload, review, coupon.

### Phase 3: Scale And Optimization

- Tăng cường testing, caching, observability, security.
- Bổ sung analytics, loyalty, recommendation, CI/CD.

---

## 13. Risks And Assumptions

### 13.1 Risks

- Tài liệu cũ hiện có chỗ chưa đồng bộ với codebase thực tế, đặc biệt ở tầng ORM và migration strategy.
- Nếu không kiểm soát chặt order transaction, có thể phát sinh lệch tồn kho hoặc sai tổng tiền.
- Nếu catalog mở rộng nhanh nhưng thiếu chiến lược search/indexing, hiệu năng đọc sẽ giảm.

### 13.2 Assumptions

- Giai đoạn hiện tại ưu tiên single-store, single-tenant.
- Giá, tồn kho và trạng thái sản phẩm được quản lý tập trung trong hệ thống này.
- Payment ở giai đoạn MVP có thể bắt đầu bằng payment recording trước khi tích hợp gateway đầy đủ.

---

## 14. Open Questions

- Mô hình thuế và phí vận chuyển có cố định hay phụ thuộc khu vực?
- Có cần hỗ trợ COD song song với online payment ngay từ MVP không?
- Có cần phân tách vai trò staff chi tiết hơn ngoài `admin` và `staff`?
- Có yêu cầu giữ lịch sử thay đổi giá sản phẩm riêng biệt không?
- Cần hỗ trợ multi-language và multi-currency ở phase nào?

---

## 15. Acceptance For Documentation Completion

Tài liệu được xem là đạt chuẩn khi:

- Có thể dùng để briefing cho Business Owner, PM, BA, Engineering và QA mà không cần giải thích lại phạm vi lõi.
- Mọi epic chính đều có mục tiêu kinh doanh, actor và acceptance criteria ở mức đủ để tách thành task kỹ thuật.
- KPI và roadmap phản ánh đúng thứ tự ưu tiên phát triển.
- Nội dung thống nhất với codebase hiện tại: NestJS, Prisma, PostgreSQL, JWT và module-based architecture.

---

## 16. Recommended Next Documentation Artifacts

- Product Requirements Document cho từng epic lớn: Auth, Catalog, Cart, Order.
- API Contract chuẩn OpenAPI cho các module đã implemented.
- User Journey và State Transition cho Order lifecycle.
- ADR cho các quyết định kiến trúc quan trọng như Prisma, JWT strategy và transaction boundaries.

---

Tài liệu này là baseline nghiệp vụ chuẩn cho dự án. Khi business model thay đổi, cần cập nhật tài liệu này trước khi mở rộng task roadmap hoặc triển khai kỹ thuật mới.
