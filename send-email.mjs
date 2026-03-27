import nodemailer from "nodemailer";

// ============================================================
// CẤU HÌNH — Anh chỉ cần thay 2 dòng này:
const GMAIL_USER = "hoang.hust.bk@gmail.com";
const GMAIL_APP_PASSWORD = "bgqq dxnz cntz vwui";
// ============================================================

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_APP_PASSWORD,
  },
});

const htmlBody = `
<h2>📷 Bảng giá thuê GoPro Hero 13 tại Hà Nội (5 ngày)</h2>
<table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse; font-family:Arial, sans-serif;">
  <thead style="background-color:#4CAF50; color:white;">
    <tr>
      <th>#</th>
      <th>Cửa hàng</th>
      <th>Địa chỉ</th>
      <th>Liên hệ</th>
      <th>Giá / ngày</th>
      <th>Tổng 5 ngày</th>
    </tr>
  </thead>
  <tbody>
    <tr style="background:#f9f9f9;">
      <td>🥇 1</td>
      <td><strong>TADA Việt Nam</strong></td>
      <td>Hà Nội (giao tận nơi)</td>
      <td>Hotline/Zalo: 0902 075 959</td>
      <td>250.000 ₫</td>
      <td><strong style="color:green;">1.250.000 ₫</strong></td>
    </tr>
    <tr>
      <td>🥈 2</td>
      <td><strong>Fescamera</strong></td>
      <td>188B ngõ Quỳnh, Thanh Nhàn, Hai Bà Trưng, HN</td>
      <td>Hotline: 0963 567 333</td>
      <td>~300.000 ₫*</td>
      <td><strong style="color:#e67e22;">~1.500.000 ₫</strong></td>
    </tr>
    <tr style="background:#f9f9f9;">
      <td>🥉 3</td>
      <td><strong>Thuê Nhanh</strong></td>
      <td>Ngõ 487 Hoàng Quốc Việt, Nghĩa Đô, HN</td>
      <td>thuenhanh.vn</td>
      <td>700.000 ₫</td>
      <td><strong style="color:#c0392b;">3.500.000 ₫</strong></td>
    </tr>
  </tbody>
</table>
<p><em>* Fescamera giảm giá theo số ngày thuê, nên gọi xác nhận giá chính xác khi thuê 5 ngày.</em></p>
<hr/>
<p>🏆 <strong>Rẻ nhất:</strong> TADA Việt Nam — 1.250.000 ₫ / 5 ngày, giao tận nơi.</p>
<p style="font-size:12px; color:#999;">Email được gửi tự động bởi script Node.js / Nodemailer.</p>
`;

const info = await transporter.sendMail({
  from: `"GoPro Finder 🎥" <${GMAIL_USER}>`,
  to: "hoang.hust.bk@gmail.com",
  subject: "📷 Bảng giá thuê GoPro Hero 13 tại Hà Nội (5 ngày)",
  html: htmlBody,
});

console.log("✅ Email đã gửi thành công!");
console.log("📨 Message ID:", info.messageId);
