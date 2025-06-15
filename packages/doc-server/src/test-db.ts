import { PrismaClient } from '../generated/prisma';

async function testConnection() {
  const prisma = new PrismaClient();

  try {
    // 测试数据库连接
    await prisma.$connect();
    console.log('✅ 数据库连接成功！');

    // 尝试执行一个简单的查询
    await prisma.$runCommandRaw({ ping: 1 });
    console.log('数据库查询测试成功！');
  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
