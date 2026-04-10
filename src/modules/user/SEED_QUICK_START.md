# 🌱 Hướng Dẫn Nhanh - Seed Users API

## Cú Pháp Nhanh

### 1️⃣ Tạo 10,000 Users

```bash
curl -X POST http://localhost:3000/v1/admin/users/seed \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{"count": 10000}'
```

### 2️⃣ Tạo 5,000 Users (Nhanh)

```bash
curl -X POST http://localhost:3000/v1/admin/users/seed \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "count": 5000,
    "batchSize": 200,
    "includeBio": false,
    "includePhone": true
  }'
```

### 3️⃣ Xem Số Users

```bash
curl -X GET http://localhost:3000/v1/admin/users/seed/stats \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### 4️⃣ Xóa Tất Cả Seed Users

```bash
curl -X DELETE http://localhost:3000/v1/admin/users/seed \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## 📋 Tham Số Cấu Hình

| Tham số | Mặc định | Min | Max | Mô tả |
|---------|---------|-----|-----|-------|
| `count` | *(bắt buộc)* | 1 | 100,000 | Số users cần tạo |
| `batchSize` | 100 | 10 | 1,000 | Kích thước batch |
| `includePhone` | true | - | - | Có số điện thoại |
| `includeBio` | true | - | - | Có bio |
| `includeLocation` | true | - | - | Có vị trí |
| `defaultRole` | "USER" | - | - | USER/ADMIN/PARTNER |
| `defaultStatus` | "ACTIVE" | - | - | ACTIVE/INACTIVE/BANNED/PENDING |

---

## ⚡ Cấu Hình Được Khuyến Nghị

### Để Testing
```json
{"count": 1000, "batchSize": 100}
```

### Để Load Testing  
```json
{"count": 10000, "batchSize": 200}
```

### Để Performance Testing
```json
{"count": 50000, "batchSize": 500}
```

---

## 📝 JSON Examples

### Minimal (Nhanh)
```json
{
  "count": 1000
}
```

### Full (Realistic)
```json
{
  "count": 5000,
  "batchSize": 200,
  "includePhone": true,
  "includeBio": true,
  "includeLocation": true,
  "defaultRole": "USER",
  "defaultStatus": "ACTIVE"
}
```

### PARTNER Test
```json
{
  "count": 500,
  "defaultRole": "PARTNER",
  "defaultStatus": "PENDING"
}
```

---

## 🎯 Kết Quả Trả Về

### Success (201)
```json
{
  "message": "Successfully seeded 10000 users",
  "data": {
    "totalRequested": 10000,
    "totalCreated": 10000,
    "totalFailed": 0,
    "duration": "45230ms"
  }
}
```

### Stats Response
```json
{
  "data": {
    "totalSeedUsers": 10000,
    "roles": {"USER": 9950, "ADMIN": 30, "PARTNER": 20},
    "statuses": {"ACTIVE": 10000}
  }
}
```

---

## 🔧 Troubleshooting

| Lỗi | Giải pháp |
|-----|----------|
| Quá chậm | ↑ batchSize, ↓ bio/location |
| Out of Memory | ↓ batchSize, ↓ count/request |
| Timeout | ↓ count/request |
| Email exists | DELETE seed trước, thử lại |

---

## 💡 Tips

1. **Development**: Dùng 1,000-5,000 users
2. **Testing Performance**: 10,000+ users
3. **Cleanup**: Luôn DELETE sau testing
4. **Check Status**: GET stats trước/sau
5. **Batch**: Tạo từng type users riêng

---

## 📚 Full Documentation

Xem `SEED_API_GUIDE.md` để tài liệu đầy đủ

---

**Status**: ✅ Ready to Use  
**Last Updated**: April 9, 2026
