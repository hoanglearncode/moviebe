todo:
- phát triển thêm các api cho việc quản lý màn hình details partner hiện tại chưa có

- bổ sung api cho màn hình kiểm soát user ở phía admin
- config lại fe chưa khớp ở màn hình quản lý user ở phía admin này

- phân tích màn hình thống kê + db để hoàn thiện màn hình thống kê

- kiểm tra lỗi ko ổn định do api refresh token gây ra

- đưa dịch vụ đang bị lẫn trong màn content về màn dịch vụ cho việc quản lý riêng
- phí sàn sẽ được admin thiết lập khi duyệt phim giá trị mặc định được thiết lập trong màn cài đặt

- xử lý phân quyền ở fe tương tự như be
- xử lý lại màn cài đặt phân quyền ở setting cho phép ghi đè quyền với role
- xử lý thêm chức năng ghi đè quyền mới ở màn hình user/partner details
- xử lý lỗi màn report

Lỗi:
- socket sau khi partner request chưa hoạt động (phải logout thủ công)
- hệ thống phân quyền chưa được triển khai (lấy từ admin ra phân quyền cho sliderbar + middleware)