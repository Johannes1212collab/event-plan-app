const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findFirst();
    const event = await prisma.event.create({
        data: {
            title: 'Final Cache Bypass Test',
            description: 'Testing canonical URL evasion by creating a literally fresh database ID so Messenger cannot possibly recognize it.',
            date: new Date(),
            isFullDay: false,
            accessCode: 'test' + Date.now(),
            hostId: user.id
        }
    });
    console.log('NEW EVENT ID:', event.id);
}

main().catch(console.error).finally(() => prisma.$disconnect());
