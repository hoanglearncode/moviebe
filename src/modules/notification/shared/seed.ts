import { PrismaClient, EmailNotificationEvent } from "@prisma/client";

const EMAIL_TEMPLATES = [
  {
    event: EmailNotificationEvent.WELCOME_NEW_ACCOUNT,
    subject: "🎬 Chào mừng bạn đến với CinePass!",
    body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f5f5f5; padding: 20px;">
  <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <h1 style="color: #e50914; margin: 0 0 20px 0; font-size: 28px;">🎬 Chào mừng {{name}}!</h1>
    
    <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 15px 0;">
      Xin chào,
    </p>
    
    <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0 0 15px 0;">
      Chúng tôi rất vui được chào đón bạn đến với CinePass — nền tảng xem phim trực tuyến hàng đầu tại Việt Nam.
    </p>
    
    <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
      Tài khoản của bạn đã được tạo thành công! Hãy khám phá:
    </p>
    
    <ul style="color: #555; font-size: 15px; line-height: 2; margin: 0 0 20px 20px;">
      <li>Kho phim đa dạng từ Hollywood đến Bollywood</li>
      <li>Chất lượng HD, 4K với âm thanh Dolby Atmos</li>
      <li>Xem trên mọi thiết bị - TV, điện thoại, máy tính</li>
      <li>Gói Premium với ưu đãi đặc biệt</li>
    </ul>
    
    <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p style="color: #333; font-size: 14px; margin: 0;">
        <strong>Email của bạn:</strong> {{email}}
      </p>
    </div>
    
    <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
      Nếu có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi qua support@cinepass.com
    </p>
    
    <p style="color: #999; font-size: 12px; margin: 20px 0 0 0;">
      Trân trọng,<br/>
      <strong>Đội ngũ CinePass</strong>
    </p>
  </div>
</div>
    `,
    description: "Welcome email for new user registration",
    variables: ["name", "email"],
  },
  {
    event: EmailNotificationEvent.WELCOME_SOCIAL_LOGIN,
    subject: "🎬 Chào mừng bạn đến với CinePass (Đăng nhập {{provider}})",
    body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f5f5f5; padding: 20px;">
  <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <h1 style="color: #e50914; margin: 0 0 20px 0; font-size: 28px;">🎬 Chào mừng {{name}}!</h1>
    
    <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0 0 15px 0;">
      Tài khoản của bạn đã được tạo thông qua {{provider}}. 
    </p>
    
    <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
      Bạn giờ đã có thể tận hưởng toàn bộ dịch vụ của CinePass. Hãy bắt đầu xem phim yêu thích của bạn ngay bây giờ!
    </p>
    
    <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p style="color: #333; font-size: 14px; margin: 0;">
        <strong>Email của bạn:</strong> {{email}}
      </p>
    </div>
    
    <p style="color: #999; font-size: 12px; margin: 20px 0 0 0;">
      Trân trọng,<br/>
      <strong>Đội ngũ CinePass</strong>
    </p>
  </div>
</div>
    `,
    description: "Welcome email for social login (Google, Facebook, etc)",
    variables: ["name", "email", "provider"],
  },
  {
    event: EmailNotificationEvent.ACCOUNT_UPDATED_BY_ADMIN,
    subject: "📝 Thông báo: Tài khoản của bạn đã được cập nhật",
    body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f5f5f5; padding: 20px;">
  <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <h1 style="color: #0066cc; margin: 0 0 20px 0; font-size: 24px;">📝 Cập nhật tài khoản</h1>
    
    <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0 0 15px 0;">
      Xin chào {{name}},
    </p>
    
    <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
      Thông tin tài khoản của bạn vừa được cập nhật:
    </p>
    
    <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
      <p style="color: #333; font-size: 14px; margin: 0;">
        <strong>Các thay đổi:</strong> {{changes}}
      </p>
    </div>
    
    <p style="color: #555; font-size: 14px; line-height: 1.6; margin: 15px 0;">
      Nếu bạn không yêu cầu cập nhật này, vui lòng liên hệ với chúng tôi ngay.
    </p>
    
    <p style="color: #999; font-size: 12px; margin: 20px 0 0 0;">
      Trân trọng,<br/>
      <strong>Đội ngũ CinePass</strong>
    </p>
  </div>
</div>
    `,
    description: "Notification when admin updates user account",
    variables: ["name", "changes"],
  },
  {
    event: EmailNotificationEvent.PASSWORD_CHANGED,
    subject: "🔐 Xác nhận: Mật khẩu của bạn đã được thay đổi",
    body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f5f5f5; padding: 20px;">
  <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <h1 style="color: #28a745; margin: 0 0 20px 0; font-size: 24px;">🔐 Mật khẩu đã thay đổi</h1>
    
    <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0 0 15px 0;">
      Xin chào {{name}},
    </p>
    
    <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
      Mật khẩu của bạn đã được thay đổi thành công. Nếu đây không phải là yêu cầu của bạn, vui lòng đổi mật khẩu ngay.
    </p>
    
    <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p style="color: #333; font-size: 14px; margin: 0;">
        Tất cả các phiên đăng nhập khác đã bị đăng xuất.
      </p>
    </div>
    
    <p style="color: #999; font-size: 12px; margin: 20px 0 0 0;">
      Trân trọng,<br/>
      <strong>Đội ngũ CinePass</strong>
    </p>
  </div>
</div>
    `,
    description: "Confirmation email when user changes password",
    variables: ["name"],
  },
  {
    event: EmailNotificationEvent.ACCOUNT_DELETED,
    subject: "👋 Tài khoản của bạn đã bị xoá",
    body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f5f5f5; padding: 20px;">
  <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <h1 style="color: #dc3545; margin: 0 0 20px 0; font-size: 24px;">👋 Tài khoản bị xoá</h1>
    
    <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0 0 15px 0;">
      Xin chào {{name}},
    </p>
    
    <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
      Tài khoản của bạn đã bị xoá vĩnh viễn từ hệ thống CinePass. Tất cả dữ liệu liên quan cũng sẽ bị xoá.
    </p>
    
    <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 15px 0;">
      Nếu bạn muốn tạo lại tài khoản, bạn có thể đăng ký lại bất cứ lúc nào.
    </p>
    
    <p style="color: #999; font-size: 12px; margin: 20px 0 0 0;">
      Trân trọng,<br/>
      <strong>Đội ngũ CinePass</strong>
    </p>
  </div>
</div>
    `,
    description: "Notification when user account is deleted",
    variables: ["name"],
  },
  {
    event: EmailNotificationEvent.LOGIN_WARNING,
    subject: "⚠️ Cảnh báo: Phát hiện đăng nhập mới",
    body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f5f5f5; padding: 20px;">
  <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <h1 style="color: #ff6b6b; margin: 0 0 20px 0; font-size: 24px;">⚠️ Cảnh báo bảo mật</h1>
    
    <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
      Tài khoản của bạn vừa được đăng nhập từ một thiết bị mới:
    </p>
    
    <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p style="color: #333; font-size: 14px; margin: 5px 0;"><strong>Thiết bị:</strong> {{device}}</p>
      <p style="color: #333; font-size: 14px; margin: 5px 0;"><strong>Địa chỉ IP:</strong> {{ip}}</p>
      <p style="color: #333; font-size: 14px; margin: 5px 0;"><strong>Thời gian:</strong> {{time}}</p>
    </div>
    
    <p style="color: #dc3545; font-size: 14px; font-weight: bold; margin: 20px 0;">
      ⚠️ Nếu đây không phải là bạn, vui lòng đổi mật khẩu ngay và kiểm tra lịch sử tài khoản của bạn.
    </p>
    
    <p style="color: #999; font-size: 12px; margin: 20px 0 0 0;">
      Trân trọng,<br/>
      <strong>Đội ngũ CinePass</strong>
    </p>
  </div>
</div>
    `,
    description: "Security warning for suspicious login",
    variables: ["device", "ip", "time"],
  },
  {
    event: EmailNotificationEvent.PROMO_CAMPAIGN,
    subject: "🎁 Ưu đãi đặc biệt dành riêng cho bạn",
    body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f5f5f5; padding: 20px;">
  <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <h1 style="color: #e50914; margin: 0 0 20px 0; font-size: 28px;">🎁 Ưu đãi độc quyền!</h1>
    
    <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
      Xin chào {{name}},
    </p>
    
    <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin: 20px 0; border-radius: 5px;">
      <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0;">
        {{promotion_detail}}
      </p>
    </div>
    
    <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 20px 0;">
      Đừng bỏ lỡ cơ hội này! Ưu đãi có hạn, hãy tận dụng ngay.
    </p>
    
    <p style="color: #999; font-size: 12px; margin: 20px 0 0 0;">
      Trân trọng,<br/>
      <strong>Đội ngũ CinePass</strong>
    </p>
  </div>
</div>
    `,
    description: "Promotional campaign email",
    variables: ["name", "promotion_detail"],
  },

  {
    event: EmailNotificationEvent.VERIFY_EMAIL,
    subject: "🔐 Xác minh email của bạn",
    body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f5f5f5; padding: 20px;">
  <div style="background-color: white; border-radius: 8px; padding: 30px;">
    
    <h1 style="font-size: 24px; margin-bottom: 16px;">Xác minh email</h1>

    <p style="margin-bottom: 16px;">
      Xin chào {{name}},
    </p>

    <p style="margin-bottom: 20px;">
      Vui lòng xác minh email của bạn để kích hoạt tài khoản.
    </p>

    <div style="text-align: center; margin: 24px 0;">
      <a href="{{verify_url}}" 
         style="background: #111827; color: #fff; padding: 12px 20px; border-radius: 6px; text-decoration: none;">
        Xác minh email
      </a>
    </div>

    <p>Nếu nút không hoạt động, dùng link:</p>
    <p><a href="{{verify_url}}">{{verify_url}}</a></p>

    <p>Mã xác minh:</p>
    <pre>{{token}}</pre>

  </div>
</div>
  `,
    description: "Email verification",
    variables: ["name", "verify_url", "token"],
  },
  {
    event: EmailNotificationEvent.RESET_PASSWORD,
    subject: "🔑 Đặt lại mật khẩu",
    body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f5f5f5; padding: 20px;">
  <div style="background-color: white; border-radius: 8px; padding: 30px;">
    
    <h1 style="font-size: 24px; margin-bottom: 16px;">Đặt lại mật khẩu</h1>

    <p>Xin chào {{name}},</p>

    <p style="margin: 16px 0;">
      Bạn đã yêu cầu đặt lại mật khẩu. Nhấn nút bên dưới:
    </p>

    <div style="text-align: center; margin: 24px 0;">
      <a href="{{reset_url}}" 
         style="background: #dc3545; color: #fff; padding: 12px 20px; border-radius: 6px; text-decoration: none;">
        Đặt lại mật khẩu
      </a>
    </div>

    <p>Hoặc dùng link:</p>
    <p><a href="{{reset_url}}">{{reset_url}}</a></p>

    <p>Token:</p>
    <pre>{{token}}</pre>

  </div>
</div>
  `,
    description: "Reset password email",
    variables: ["name", "reset_url", "token"],
  },
];

export async function seedEmailTemplates(prisma: PrismaClient) {
  console.log("🌱 Seeding email templates...");

  for (const template of EMAIL_TEMPLATES) {
    try {
      const existing = await prisma.emailTemplate.findUnique({
        where: { event: template.event },
      });

      if (existing) {
        console.log(`  ✓ Template '${template.event}' already exists`);
        continue;
      }

      await prisma.emailTemplate.create({
        data: {
          event: template.event,
          subject: template.subject,
          body: template.body,
          description: template.description,
          variables: template.variables,
          isActive: true,
        },
      });

      console.log(`  ✓ Created template '${template.event}'`);
    } catch (error) {
      console.error(`  ✗ Failed to seed '${template.event}':`, error);
    }
  }

  console.log("✅ Email templates seeding completed!");
}
