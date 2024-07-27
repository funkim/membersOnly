const prisma = require('../prisma');

const messages = async () => {
  try {
    return await prisma.message.findMany({
      include: { creator: true },
      orderBy: { timestamp: 'desc' },
    });
  } catch (err) {
    console.error('Error fetching messages', err);
    throw err;
  }
};

module.exports = { messages };
