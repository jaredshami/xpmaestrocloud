const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

exports.getStats = async (req, res, next) => {
  try {
    const totalClients = await prisma.client.count();
    const totalInstances = await prisma.instance.count();
    const activeInstances = await prisma.instance.count({
      where: { status: 'active' },
    });

    const recentClients = await prisma.client.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
    });

    const recentInstances = await prisma.instance.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { client: true },
    });

    res.json({
      stats: {
        totalClients,
        totalInstances,
        activeInstances,
      },
      recentClients,
      recentInstances,
    });
  } catch (error) {
    next(error);
  }
};
