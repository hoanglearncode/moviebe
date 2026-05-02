Hệ thống chia làm 3 lớp theo thứ tự phụ thuộc:

**Giai đoạn 1 — Luôn chạy nền (không có trước sau):** Vận hành hệ thống (cron jobs), Log & Audit, và Dòng thông báo là hạ tầng nền — chúng hoạt động song song và là điều kiện tiên quyết cho tất cả mọi thứ.

**Giai đoạn 2 — Onboarding (thứ tự nghiêm ngặt):**

Visitor → Đăng ký → rồi tách ra hai nhánh song song:

- Nhánh trái: User hoạt động (browse, review, pass vé)
- Nhánh phải: Partner request → Partner khởi tạo → Partner setup (ba bước này phải tuần tự, không thể đảo)

**Giai đoạn 3 — Vận hành thường nhật (ba luồng song song):**

Mua vé, Partner quản trị, và Admin vận hành chạy độc lập cùng lúc — không luồng nào phụ thuộc luồng kia. Tất cả đều đổ vào Dòng tiền vì mọi giao dịch đều tạo `Transaction`.

**Quy tắc phụ thuộc chính:**

- Không có `Partner setup` → không có `Showtime` → không thể `Mua vé`
- Không có `Đăng ký` → không thể làm bất kỳ thứ gì có trạng thái (đặt vé, review, request partner)
- `Dòng tiền` không bao giờ xảy ra trước `Mua vé`
