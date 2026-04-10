"use strict";
/**
 * Seed Configuration Presets
 * Các cấu hình thường dùng để tạo seed users
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.troubleshootingGuide = exports.performanceGuide = exports.seedExamples = exports.seedPresets = void 0;
/**
 * Configuration Profiles (Cấu hình có sẵn)
 */
exports.seedPresets = {
    /**
     * Quick Test: 100 users với tất cả dữ liệu
     * Dùng: Quick local testing
     * Thời gian: ~2 giây
     */
    quickTest: {
        count: 100,
        batchSize: 50,
        includePhone: true,
        includeBio: true,
        includeLocation: true,
        defaultRole: "USER",
        defaultStatus: "ACTIVE",
    },
    /**
     * Small Dataset: 1,000 users
     * Dùng: Development testing
     * Thời gian: ~5 giây
     */
    smallDataset: {
        count: 1000,
        batchSize: 100,
        includePhone: true,
        includeBio: true,
        includeLocation: true,
        defaultRole: "USER",
        defaultStatus: "ACTIVE",
    },
    /**
     * Medium Dataset: 5,000 users
     * Dùng: Performance testing
     * Thời gian: ~15 giây
     */
    mediumDataset: {
        count: 5000,
        batchSize: 200,
        includePhone: true,
        includeBio: false,
        includeLocation: true,
        defaultRole: "USER",
        defaultStatus: "ACTIVE",
    },
    /**
     * Large Dataset: 10,000 users
     * Dùng: Load testing, stress testing
     * Thời gian: ~30-45 giây
     */
    largeDataset: {
        count: 10000,
        batchSize: 200,
        includePhone: true,
        includeBio: false,
        includeLocation: true,
        defaultRole: "USER",
        defaultStatus: "ACTIVE",
    },
    /**
     * Very Large Dataset: 50,000 users
     * Dùng: Extensive load testing
     * Thời gian: ~2-3 phút
     * ⚠️ Cần database resoures tốt
     */
    veryLargeDataset: {
        count: 50000,
        batchSize: 500,
        includePhone: false,
        includeBio: false,
        includeLocation: false,
        defaultRole: "USER",
        defaultStatus: "ACTIVE",
    },
    /**
     * Minimal Profile: Chỉ thông tin cơ bản
     * Dùng: Khi database storage bị giới hạn
     * Thời gian: Nhanh
     */
    minimalProfile: {
        count: 1000,
        batchSize: 100,
        includePhone: false,
        includeBio: false,
        includeLocation: false,
        defaultRole: "USER",
        defaultStatus: "ACTIVE",
    },
    /**
     * Full Profile: Tất cả dữ liệu
     * Dùng: Realistic testing
     * Thời gian: Chậm
     */
    fullProfile: {
        count: 1000,
        batchSize: 100,
        includePhone: true,
        includeBio: true,
        includeLocation: true,
        defaultRole: "USER",
        defaultStatus: "ACTIVE",
    },
    /**
     * Partner Testing: Tạo PARTNER users
     * Dùng: Partner flow testing
     */
    partnerTesting: {
        count: 100,
        batchSize: 50,
        includePhone: true,
        includeBio: true,
        includeLocation: true,
        defaultRole: "PARTNER",
        defaultStatus: "PENDING",
    },
    /**
     * Multi-Role: Mix of different roles
     * Dùng: Chạy nhiều lần với roles khác nhau
     * NOTE: Cần chạy multiple requests
     */
    adminUsers: {
        count: 10,
        batchSize: 10,
        includePhone: true,
        includeBio: true,
        includeLocation: true,
        defaultRole: "ADMIN",
        defaultStatus: "ACTIVE",
    },
    /**
     * Inactive Users: Tạo INACTIVE users
     * Dùng: Test inactive user workflows
     */
    inactiveUsers: {
        count: 1000,
        batchSize: 100,
        includePhone: true,
        includeBio: false,
        includeLocation: false,
        defaultRole: "USER",
        defaultStatus: "INACTIVE",
    },
    /**
     * Banned Users: Tạo BANNED users
     * Dùng: Test banned user workflows
     */
    bannedUsers: {
        count: 100,
        batchSize: 50,
        includePhone: false,
        includeBio: false,
        includeLocation: false,
        defaultRole: "USER",
        defaultStatus: "BANNED",
    },
    /**
     * Pending Users: Tạo PENDING users
     * Dùng: Test pending verification workflows
     */
    pendingUsers: {
        count: 500,
        batchSize: 100,
        includePhone: true,
        includeBio: false,
        includeLocation: true,
        defaultRole: "USER",
        defaultStatus: "PENDING",
    },
};
/**
 * Usage examples in code
 */
exports.seedExamples = {
    /**
     * Example 1: Using preset
     */
    basicUsage: `
const config = seedPresets.smallDataset;
const response = await fetch('http://localhost:3000/v1/admin/users/seed', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': \`Bearer \${token}\`
  },
  body: JSON.stringify(config)
});
  `,
    /**
     * Example 2: Custom configuration
     */
    customConfig: `
const customConfig = {
  count: 2000,
  batchSize: 150,
  includePhone: true,
  includeBio: true,
  includeLocation: false,
  defaultRole: 'USER',
  defaultStatus: 'ACTIVE'
};
  `,
    /**
     * Example 3: Progressive seeding
     */
    progressiveSeeding: `
// Tạo 1000 active users
await seedUsers(seedPresets.smallDataset);

// Tạo 200 partner users
await seedUsers(seedPresets.partnerTesting);

// Tạo 100 inactive users
await seedUsers(seedPresets.inactiveUsers);
  `,
    /**
     * Example 4: Check stats
     */
    checkStats: `
const response = await fetch('http://localhost:3000/v1/admin/users/seed/stats', {
  headers: {
    'Authorization': \`Bearer \${token}\`
  }
});
const stats = await response.json();
console.log('Seed Users:', stats.data.totalSeedUsers);
console.log('By Status:', stats.data.statuses);
  `,
    /**
     * Example 5: Cleanup
     */
    cleanup: `
const response = await fetch('http://localhost:3000/v1/admin/users/seed', {
  method: 'DELETE',
  headers: {
    'Authorization': \`Bearer \${token}\`
  }
});
const result = await response.json();
console.log(\`Deleted \${result.data.deletedCount} users\`);
  `,
};
/**
 * Performance Guide
 * Thiết lập tối ưu cho các kích thước khác nhau
 */
exports.performanceGuide = {
    description: "Hướng dẫn tối ưu performance cho seed operations",
    small: {
        count: 1000,
        batchSize: 100,
        estimatedTime: "5 seconds",
        estimatedStorage: "2 MB",
        database: "Local/Development",
    },
    medium: {
        count: 10000,
        batchSize: 200,
        estimatedTime: "45 seconds",
        estimatedStorage: "20 MB",
        database: "Development/Staging",
    },
    large: {
        count: 50000,
        batchSize: 500,
        estimatedTime: "3 minutes",
        estimatedStorage: "100 MB",
        database: "Staging/Production-like",
    },
    verylarge: {
        count: 100000,
        batchSize: 1000,
        estimatedTime: "5-7 minutes",
        estimatedStorage: "200 MB",
        database: "High-end server",
    },
};
/**
 * Troubleshooting Guide
 */
exports.troubleshootingGuide = {
    slowSeed: {
        problem: "Seed operation quá chậm",
        solutions: [
            "Tăng batchSize (100 → 200-500)",
            "Giảm số lượng fields (disable bio, location)",
            "Kiểm tra database resources",
            "Chạy vào lúc ít traffic",
            "Kiểm tra disk I/O",
        ],
    },
    memoryIssue: {
        problem: "Out of memory error",
        solutions: [
            "Giảm batchSize",
            "Giảm count per request",
            "Chia thành nhiều requests nhỏ",
            "Tăng memory allocation",
            "Restart server trước seed",
        ],
    },
    partialSeed: {
        problem: "Chỉ một số users được tạo",
        solutions: [
            "Kiểm tra database connection",
            "Xem error logs",
            "Kiểm tra unique constraints",
            "Thử lại với numberOfSeed nhỏ hơn",
            "Kiểm tra disk space",
        ],
    },
    duplicateEmails: {
        problem: "Duplicate email errors",
        solutions: [
            "Clear seed users trước (DELETE /admin/users/seed)",
            "Email pattern là unique, prob cơ sở dữ liệu cũ",
            "Kiểm tra seed-generator logic",
        ],
    },
};
