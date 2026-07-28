const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('admin123', 10);
  await prisma.adminUser.upsert({
    where: { username: 'admin' },
    update: {},
    create: { username: 'admin', password: hash, nickname: '超级管理员', role: 'admin' },
  });

  const configs = [
    { key: 'site_name', value: '蜜蜂影视', remark: '站点名称' },
    { key: 'site_logo', value: '', remark: '站点LOGO' },
    { key: 'site_announcement', value: '', remark: '站点公告' },
    { key: 'cdn_domain', value: '', remark: 'CDN加速域名' },
    { key: 'force_update_version', value: '0', remark: '强制更新版本号' },
  ];
  for (const c of configs) {
    await prisma.systemConfig.upsert({ where: { key: c.key }, update: {}, create: c });
  }

  const levels = [
    { name: '月度会员', price: 19.9, duration: 30, sort: 1 },
    { name: '季度会员', price: 49.9, duration: 90, sort: 2 },
    { name: '年度会员', price: 99.9, duration: 365, sort: 3 },
    { name: '永久会员', price: 299.9, duration: 36500, sort: 4 },
  ];
  for (const l of levels) {
    await prisma.memberLevel.create({ data: l }).catch(() => {});
  }

  await prisma.appChannel.upsert({
    where: { name: 'default' },
    update: {},
    create: { name: 'default', packageId: 'com.beetv.android.tv' },
  });

  console.log('Seed completed: admin/admin123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
