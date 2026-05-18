# 🔮 Future — Post-MVP Features

> ⚠️ **Đọc kỹ trước khi làm**: phần lớn task ở đây là **systems engineering quy mô lớn** hoặc feature phụ thuộc nhiều stakeholder. Self-learn track ([`../../ROADMAP-SELF-LEARN.md`](../../ROADMAP-SELF-LEARN.md)) **cắt 80% phần này khỏi roadmap chính**.

---

## 🎯 Mục đích thư mục

Lưu spec của các feature **đã thiết kế nhưng hoãn**:

- Không phải core revenue (cart/order/payment).
- Tốn nhiều effort, ROI chưa rõ ở giai đoạn MVP.
- Đa số cần infrastructure mới (WS, MQ, ML pipeline, OAuth provider...).

---

## 🚦 Tiêu chí xét làm

Chỉ chuyển 1 task từ `07-future/` sang roadmap chính khi đáp ứng **ÍT NHẤT 2** điều kiện:

1. **MVP đã ship** (production users đang dùng).
2. **Có data/metric đo lường** lý do làm (vd. churn cao → loyalty; search slow → ML rec).
3. **Có resource cụ thể** (thời gian/người) để duy trì sau khi build.
4. **Không có alternative đơn giản hơn** (vd. email thay WS, Postgres FTS thay Elasticsearch).

---

## 📋 Tasks (13)

| ID       | Topic                          | Khi nào cân nhắc                                     |
| :------- | :----------------------------- | :--------------------------------------------------- |
| TASK-303 | Loyalty / Membership System    | Khi có >1000 user và churn rate đo được.             |
| TASK-305 | AI Recommendation Engine       | Khi có ≥6 tháng data hành vi.                        |
| TASK-317 | Admin Dashboard Statistics     | Khi admin keo than vì query DB tay.                  |
| TASK-318 | Real-time Notifications (WS)   | Khi polling/email không kịp UX.                      |
| TASK-319 | Two-Factor Authentication      | Khi store dữ liệu nhạy cảm (financial, health, PII). |
| TASK-322 | GraphQL API                    | KHÔNG làm song song REST — chọn 1.                   |
| TASK-323 | Microservices Architecture    | Khi 1 module deploy chậm cản team khác. **>20 dev.** |
| TASK-324 | Message Queue (RabbitMQ/Kafka) | Khi cần async work > 30s hoặc cross-service event.   |
| TASK-325 | Multi-language (i18n)          | Khi launch market thứ 2.                             |
| TASK-326 | Multi-currency                 | Khi launch market thứ 2 + currency khác.             |
| TASK-327 | OAuth Social Login             | Khi conversion rate signup thấp.                     |
| TASK-328 | Product Recommendations (ML)   | Cùng tiêu chí TASK-305.                              |
| TASK-329 | Analytics Dashboard            | Khi GA / Mixpanel không đủ — thường KHÔNG cần. |

---

## 🚫 Cảnh báo cụ thể

- **TASK-323 (Microservices)**: gần như không bao giờ là quyết định đúng cho team < 20 người. Monolith mỗi module rõ ràng (current architecture) đủ scale tới triệu user.
- **TASK-322 (GraphQL)**: nếu đã có REST + Swagger, đừng làm GraphQL **song song** — vĩnh viễn chia đôi maintenance. Quyết định ngay từ đầu.
- **TASK-321 (Kubernetes — ở `setup/05-scale-infra/`)**: docker-compose + 1 VPS chạy được tới 10K req/min. K8s chỉ cần khi đã scale qua mức đó hoặc team dedicated ops.
