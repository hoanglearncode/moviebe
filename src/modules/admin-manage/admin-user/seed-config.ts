export const seedPresets = {
  quickTest: {
    count: 100,
    batchSize: 50,
    includePhone: true,
    includeBio: true,
    includeLocation: true,
    defaultRole: "USER" as const,
    defaultStatus: "ACTIVE" as const,
  },

  smallDataset: {
    count: 1000,
    batchSize: 100,
    includePhone: true,
    includeBio: true,
    includeLocation: true,
    defaultRole: "USER" as const,
    defaultStatus: "ACTIVE" as const,
  },

  mediumDataset: {
    count: 5000,
    batchSize: 200,
    includePhone: true,
    includeBio: false,
    includeLocation: true,
    defaultRole: "USER" as const,
    defaultStatus: "ACTIVE" as const,
  },

  largeDataset: {
    count: 10000,
    batchSize: 200,
    includePhone: true,
    includeBio: false,
    includeLocation: true,
    defaultRole: "USER" as const,
    defaultStatus: "ACTIVE" as const,
  },

  veryLargeDataset: {
    count: 50000,
    batchSize: 500,
    includePhone: false,
    includeBio: false,
    includeLocation: false,
    defaultRole: "USER" as const,
    defaultStatus: "ACTIVE" as const,
  },

  minimalProfile: {
    count: 1000,
    batchSize: 100,
    includePhone: false,
    includeBio: false,
    includeLocation: false,
    defaultRole: "USER" as const,
    defaultStatus: "ACTIVE" as const,
  },

  fullProfile: {
    count: 1000,
    batchSize: 100,
    includePhone: true,
    includeBio: true,
    includeLocation: true,
    defaultRole: "USER" as const,
    defaultStatus: "ACTIVE" as const,
  },

  partnerTesting: {
    count: 100,
    batchSize: 50,
    includePhone: true,
    includeBio: true,
    includeLocation: true,
    defaultRole: "PARTNER" as const,
    defaultStatus: "PENDING" as const,
  },

  adminUsers: {
    count: 10,
    batchSize: 10,
    includePhone: true,
    includeBio: true,
    includeLocation: true,
    defaultRole: "ADMIN" as const,
    defaultStatus: "ACTIVE" as const,
  },

  inactiveUsers: {
    count: 1000,
    batchSize: 100,
    includePhone: true,
    includeBio: false,
    includeLocation: false,
    defaultRole: "USER" as const,
    defaultStatus: "INACTIVE" as const,
  },

  bannedUsers: {
    count: 100,
    batchSize: 50,
    includePhone: false,
    includeBio: false,
    includeLocation: false,
    defaultRole: "USER" as const,
    defaultStatus: "BANNED" as const,
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
    defaultRole: "USER" as const,
    defaultStatus: "PENDING" as const,
  },
};

export const seedExamples = {
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

  progressiveSeeding: `
// Tạo 1000 active users
await seedUsers(seedPresets.smallDataset);

// Tạo 200 partner users
await seedUsers(seedPresets.partnerTesting);

// Tạo 100 inactive users
await seedUsers(seedPresets.inactiveUsers);
  `,

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
export const performanceGuide = {
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
export const troubleshootingGuide = {
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
