import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../src/generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? 'file:./prisma/dev.db' }),
});

const USER_A = 'auth0|user-a';
const USER_B = 'auth0|user-b';

async function main() {
  await prisma.bookmark.deleteMany();
  await prisma.collection.deleteMany();

  const collectionA = await prisma.collection.create({
    data: { ownerId: USER_A, name: 'User A - Reading List' },
  });
  await prisma.bookmark.create({
    data: {
      ownerId: USER_A,
      title: 'NestJS Docs',
      url: 'https://docs.nestjs.com',
      collectionId: collectionA.id,
    },
  });

  const collectionB = await prisma.collection.create({
    data: { ownerId: USER_B, name: 'User B - Recipes' },
  });
  await prisma.bookmark.create({
    data: {
      ownerId: USER_B,
      title: 'Prisma Docs',
      url: 'https://www.prisma.io/docs',
      collectionId: collectionB.id,
    },
  });

  console.log('Seeded users:', { USER_A, USER_B });
}


main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
