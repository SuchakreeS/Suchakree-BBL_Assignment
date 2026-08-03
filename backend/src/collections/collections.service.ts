import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';
import { ReplaceCollectionDto } from './dto/replace-collection.dto';

@Injectable()
export class CollectionsService {
  constructor(private readonly prisma: PrismaService) {}

  create(ownerId: string, dto: CreateCollectionDto) {
    return this.prisma.collection.create({
      data: { ownerId, name: dto.name },
    });
  }

  findAll(ownerId: string) {
    return this.prisma.collection.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(ownerId: string, id: string) {
    const collection = await this.prisma.collection.findFirst({
      where: { id, ownerId },
    });
    if (!collection) {
      throw new NotFoundException('Collection not found');
    }
    return collection;
  }

  async update(ownerId: string, id: string, dto: UpdateCollectionDto | ReplaceCollectionDto) {
    const { count } = await this.prisma.collection.updateMany({
      where: { id, ownerId },
      data: dto,
    });
    if (count === 0) {
      throw new NotFoundException('Collection not found');
    }
    return this.findOne(ownerId, id);
  }

  async replace(ownerId: string, id: string, dto: ReplaceCollectionDto) {
    return this.update(ownerId, id, dto);
  }

  async findBookmarks(ownerId: string, id: string) {
    await this.findOne(ownerId, id);
    return this.prisma.bookmark.findMany({
      where: { ownerId, collectionId: id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async remove(ownerId: string, id: string) {
    const { count } = await this.prisma.collection.deleteMany({
      where: { id, ownerId },
    });
    if (count === 0) {
      throw new NotFoundException('Collection not found');
    }
  }
}
