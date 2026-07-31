import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';
import { UpdateBookmarkDto } from './dto/update-bookmark.dto';

@Injectable()
export class BookmarksService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertCollectionOwnership(ownerId: string, collectionId: string) {
    const collection = await this.prisma.collection.findFirst({
      where: { id: collectionId, ownerId },
    });
    if (!collection) {
      throw new NotFoundException('Collection not found');
    }
  }

  async create(ownerId: string, dto: CreateBookmarkDto) {
    if (dto.collectionId) {
      await this.assertCollectionOwnership(ownerId, dto.collectionId);
    }
    return this.prisma.bookmark.create({
      data: {
        ownerId,
        title: dto.title,
        url: dto.url,
        collectionId: dto.collectionId,
      },
    });
  }

  findAll(ownerId: string) {
    return this.prisma.bookmark.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(ownerId: string, id: string) {
    const bookmark = await this.prisma.bookmark.findFirst({
      where: { id, ownerId },
    });
    if (!bookmark) {
      throw new NotFoundException('Bookmark not found');
    }
    return bookmark;
  }

  async update(ownerId: string, id: string, dto: UpdateBookmarkDto) {
    if (dto.collectionId) {
      await this.assertCollectionOwnership(ownerId, dto.collectionId);
    }
    const { count } = await this.prisma.bookmark.updateMany({
      where: { id, ownerId },
      data: dto,
    });
    if (count === 0) {
      throw new NotFoundException('Bookmark not found');
    }
    return this.findOne(ownerId, id);
  }

  async remove(ownerId: string, id: string) {
    const { count } = await this.prisma.bookmark.deleteMany({
      where: { id, ownerId },
    });
    if (count === 0) {
      throw new NotFoundException('Bookmark not found');
    }
  }
}
