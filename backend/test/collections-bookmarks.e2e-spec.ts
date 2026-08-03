import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { FakeAuthGuard } from './fake-auth.guard';

const BACKEND_ROOT = path.join(__dirname, '..');
const TEST_DB_PATH = path.join(BACKEND_ROOT, 'prisma', 'test.db');
const DATABASE_URL = 'file:./prisma/test.db';

process.env.DATABASE_URL = DATABASE_URL;

const USER_ALPHA = 'auth0|user_alpha';
const USER_BETA = 'auth0|user_beta';

function cleanupTestDb() {
  for (const suffix of ['', '-journal', '-wal', '-shm']) {
    const file = `${TEST_DB_PATH}${suffix}`;
    if (fs.existsSync(file)) fs.unlinkSync(file);
  }
}

describe('Multi-tenant data isolation (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let betaCollectionId: string;
  let betaBookmarkId: string;

  beforeAll(async () => {
    cleanupTestDb();
    execSync('npx prisma migrate deploy', {
      cwd: BACKEND_ROOT,
      env: { ...process.env, DATABASE_URL },
      stdio: 'inherit',
    });

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalGuards(new FakeAuthGuard());
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();

    prisma = moduleRef.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
    cleanupTestDb();
  });

  beforeEach(async () => {
    await prisma.bookmark.deleteMany();
    await prisma.collection.deleteMany();

    const beta = await prisma.collection.create({
      data: { ownerId: USER_BETA, name: "Beta's Private Collection" },
    });
    betaCollectionId = beta.id;

    const betaBookmark = await prisma.bookmark.create({
      data: {
        ownerId: USER_BETA,
        title: "Beta's Private Bookmark",
        url: 'https://beta.example.com',
        collectionId: beta.id,
      },
    });
    betaBookmarkId = betaBookmark.id;
  });

  describe('Unauthenticated access', () => {
    it('rejects a request with no Authorization header (401)', async () => {
      await request(app.getHttpServer()).get('/collections').expect(401);
    });

    it('rejects a request with a malformed Authorization header (401)', async () => {
      await request(app.getHttpServer())
        .get('/collections')
        .set('Authorization', 'NotBearer garbage')
        .expect(401);
    });
  });

  describe('Cross-tenant attack: Alpha targeting Beta resources', () => {
    it('does not leak Beta data in Alpha\'s list results', async () => {
      const res = await request(app.getHttpServer())
        .get('/collections')
        .set('Authorization', `Bearer ${USER_ALPHA}`)
        .expect(200);
      expect(res.body).toEqual([]);
    });

    it('blocks reading Beta\'s collection by id (404)', async () => {
      await request(app.getHttpServer())
        .get(`/collections/${betaCollectionId}`)
        .set('Authorization', `Bearer ${USER_ALPHA}`)
        .expect(404);
    });

    it('blocks updating Beta\'s collection (404, data untouched)', async () => {
      await request(app.getHttpServer())
        .patch(`/collections/${betaCollectionId}`)
        .set('Authorization', `Bearer ${USER_ALPHA}`)
        .send({ name: 'Hijacked by Alpha' })
        .expect(404);

      const stillBeta = await prisma.collection.findUnique({ where: { id: betaCollectionId } });
      expect(stillBeta?.name).toBe("Beta's Private Collection");
    });

    it('blocks deleting Beta\'s collection (404, record survives)', async () => {
      await request(app.getHttpServer())
        .delete(`/collections/${betaCollectionId}`)
        .set('Authorization', `Bearer ${USER_ALPHA}`)
        .expect(404);

      const stillExists = await prisma.collection.findUnique({ where: { id: betaCollectionId } });
      expect(stillExists).not.toBeNull();
    });

    it('blocks reading Beta\'s bookmark by id (404)', async () => {
      await request(app.getHttpServer())
        .get(`/bookmarks/${betaBookmarkId}`)
        .set('Authorization', `Bearer ${USER_ALPHA}`)
        .expect(404);
    });

    it('blocks updating Beta\'s bookmark (404, data untouched)', async () => {
      await request(app.getHttpServer())
        .patch(`/bookmarks/${betaBookmarkId}`)
        .set('Authorization', `Bearer ${USER_ALPHA}`)
        .send({ title: 'Hijacked by Alpha' })
        .expect(404);

      const stillBeta = await prisma.bookmark.findUnique({ where: { id: betaBookmarkId } });
      expect(stillBeta?.title).toBe("Beta's Private Bookmark");
    });

    it('blocks deleting Beta\'s bookmark (404, record survives)', async () => {
      await request(app.getHttpServer())
        .delete(`/bookmarks/${betaBookmarkId}`)
        .set('Authorization', `Bearer ${USER_ALPHA}`)
        .expect(404);

      const stillExists = await prisma.bookmark.findUnique({ where: { id: betaBookmarkId } });
      expect(stillExists).not.toBeNull();
    });

    it('blocks attaching a new bookmark to Beta\'s collection via collectionId (404)', async () => {
      await request(app.getHttpServer())
        .post('/bookmarks')
        .set('Authorization', `Bearer ${USER_ALPHA}`)
        .send({
          title: 'Sneaky bookmark',
          url: 'https://evil.example.com',
          collectionId: betaCollectionId,
        })
        .expect(404);
    });

    it('blocks re-pointing Alpha\'s own bookmark onto Beta\'s collection (404)', async () => {
      const ownCollection = await request(app.getHttpServer())
        .post('/collections')
        .set('Authorization', `Bearer ${USER_ALPHA}`)
        .send({ name: "Alpha's Collection" })
        .expect(201);

      const ownBookmark = await request(app.getHttpServer())
        .post('/bookmarks')
        .set('Authorization', `Bearer ${USER_ALPHA}`)
        .send({
          title: "Alpha's Bookmark",
          url: 'https://alpha.example.com',
          collectionId: ownCollection.body.id,
        })
        .expect(201);

      await request(app.getHttpServer())
        .patch(`/bookmarks/${ownBookmark.body.id}`)
        .set('Authorization', `Bearer ${USER_ALPHA}`)
        .send({ collectionId: betaCollectionId })
        .expect(404);
    });
  });

  describe('Happy path: Alpha CRUD on own data', () => {
    it('creates, reads, lists, updates, and deletes its own collection', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/collections')
        .set('Authorization', `Bearer ${USER_ALPHA}`)
        .send({ name: "Alpha's Reading List" })
        .expect(201);

      expect(createRes.body.ownerId).toBe(USER_ALPHA);
      const collectionId = createRes.body.id;

      await request(app.getHttpServer())
        .get(`/collections/${collectionId}`)
        .set('Authorization', `Bearer ${USER_ALPHA}`)
        .expect(200)
        .expect((res) => expect(res.body.name).toBe("Alpha's Reading List"));

      const listRes = await request(app.getHttpServer())
        .get('/collections')
        .set('Authorization', `Bearer ${USER_ALPHA}`)
        .expect(200);
      expect(listRes.body).toHaveLength(1);
      expect(listRes.body[0].id).toBe(collectionId);

      await request(app.getHttpServer())
        .patch(`/collections/${collectionId}`)
        .set('Authorization', `Bearer ${USER_ALPHA}`)
        .send({ name: 'Renamed List' })
        .expect(200)
        .expect((res) => expect(res.body.name).toBe('Renamed List'));

      await request(app.getHttpServer())
        .delete(`/collections/${collectionId}`)
        .set('Authorization', `Bearer ${USER_ALPHA}`)
        .expect(204);

      await request(app.getHttpServer())
        .get(`/collections/${collectionId}`)
        .set('Authorization', `Bearer ${USER_ALPHA}`)
        .expect(404);
    });

    it('creates, reads, updates, and deletes its own bookmark', async () => {
      const collectionRes = await request(app.getHttpServer())
        .post('/collections')
        .set('Authorization', `Bearer ${USER_ALPHA}`)
        .send({ name: "Alpha's Bookmarks Home" })
        .expect(201);

      const createRes = await request(app.getHttpServer())
        .post('/bookmarks')
        .set('Authorization', `Bearer ${USER_ALPHA}`)
        .send({
          title: "Alpha's Bookmark",
          url: 'https://alpha.example.com',
          collectionId: collectionRes.body.id,
        })
        .expect(201);

      expect(createRes.body.ownerId).toBe(USER_ALPHA);
      const bookmarkId = createRes.body.id;

      await request(app.getHttpServer())
        .get(`/bookmarks/${bookmarkId}`)
        .set('Authorization', `Bearer ${USER_ALPHA}`)
        .expect(200);

      await request(app.getHttpServer())
        .patch(`/bookmarks/${bookmarkId}`)
        .set('Authorization', `Bearer ${USER_ALPHA}`)
        .send({ title: 'Updated Title' })
        .expect(200)
        .expect((res) => expect(res.body.title).toBe('Updated Title'));

      await request(app.getHttpServer())
        .delete(`/bookmarks/${bookmarkId}`)
        .set('Authorization', `Bearer ${USER_ALPHA}`)
        .expect(204);

      await request(app.getHttpServer())
        .get(`/bookmarks/${bookmarkId}`)
        .set('Authorization', `Bearer ${USER_ALPHA}`)
        .expect(404);
    });

    it('replaces a bookmark via PUT (full update)', async () => {
      const collectionRes = await request(app.getHttpServer())
        .post('/collections')
        .set('Authorization', `Bearer ${USER_ALPHA}`)
        .send({ name: "Alpha's PUT Home" })
        .expect(201);

      const createRes = await request(app.getHttpServer())
        .post('/bookmarks')
        .set('Authorization', `Bearer ${USER_ALPHA}`)
        .send({ title: 'Original', url: 'https://alpha.example.com', collectionId: collectionRes.body.id })
        .expect(201);

      await request(app.getHttpServer())
        .put(`/bookmarks/${createRes.body.id}`)
        .set('Authorization', `Bearer ${USER_ALPHA}`)
        .send({ title: 'Replaced', url: 'https://replaced.example.com' })
        .expect(200)
        .expect((res) => {
          expect(res.body.title).toBe('Replaced');
          expect(res.body.url).toBe('https://replaced.example.com');
        });
    });

    it('replaces a collection via PUT (full update)', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/collections')
        .set('Authorization', `Bearer ${USER_ALPHA}`)
        .send({ name: 'Original Name' })
        .expect(201);

      await request(app.getHttpServer())
        .put(`/collections/${createRes.body.id}`)
        .set('Authorization', `Bearer ${USER_ALPHA}`)
        .send({ name: 'Replaced Name' })
        .expect(200)
        .expect((res) => expect(res.body.name).toBe('Replaced Name'));
    });

    it('returns the caller identity from GET /me', async () => {
      await request(app.getHttpServer())
        .get('/me')
        .set('Authorization', `Bearer ${USER_ALPHA}`)
        .expect(200)
        .expect((res) => expect(res.body.sub).toBe(USER_ALPHA));
    });

    it('lists only its own bookmarks via GET /collections/:id/bookmarks', async () => {
      const collectionRes = await request(app.getHttpServer())
        .post('/collections')
        .set('Authorization', `Bearer ${USER_ALPHA}`)
        .send({ name: "Alpha's Nested Home" })
        .expect(201);

      await request(app.getHttpServer())
        .post('/bookmarks')
        .set('Authorization', `Bearer ${USER_ALPHA}`)
        .send({ title: 'Nested', url: 'https://nested.example.com', collectionId: collectionRes.body.id })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get(`/collections/${collectionRes.body.id}/bookmarks`)
        .set('Authorization', `Bearer ${USER_ALPHA}`)
        .expect(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].title).toBe('Nested');
    });

    it('blocks GET /collections/:id/bookmarks for another tenant\'s collection (404)', async () => {
      await request(app.getHttpServer())
        .get(`/collections/${betaCollectionId}/bookmarks`)
        .set('Authorization', `Bearer ${USER_ALPHA}`)
        .expect(404);
    });

    it('filters GET /bookmarks?collectionId= server-side, scoped to owner', async () => {
      const collectionRes = await request(app.getHttpServer())
        .post('/collections')
        .set('Authorization', `Bearer ${USER_ALPHA}`)
        .send({ name: "Alpha's Filter Home" })
        .expect(201);

      await request(app.getHttpServer())
        .post('/bookmarks')
        .set('Authorization', `Bearer ${USER_ALPHA}`)
        .send({ title: 'In collection', url: 'https://in.example.com', collectionId: collectionRes.body.id })
        .expect(201);
      await request(app.getHttpServer())
        .post('/bookmarks')
        .set('Authorization', `Bearer ${USER_ALPHA}`)
        .send({ title: 'Uncategorised', url: 'https://un.example.com' })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get(`/bookmarks?collectionId=${collectionRes.body.id}`)
        .set('Authorization', `Bearer ${USER_ALPHA}`)
        .expect(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].title).toBe('In collection');
    });

    it('blocks filtering GET /bookmarks?collectionId= by another tenant\'s collection (404)', async () => {
      await request(app.getHttpServer())
        .get(`/bookmarks?collectionId=${betaCollectionId}`)
        .set('Authorization', `Bearer ${USER_ALPHA}`)
        .expect(404);
    });
  });
});
