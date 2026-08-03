import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { OwnerId } from '../auth/owner-id.decorator';
import { CollectionsService } from './collections.service';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';
import { ReplaceCollectionDto } from './dto/replace-collection.dto';

@Controller('collections')
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Post()
  create(@OwnerId() ownerId: string, @Body() dto: CreateCollectionDto) {
    return this.collectionsService.create(ownerId, dto);
  }

  @Get()
  findAll(@OwnerId() ownerId: string) {
    return this.collectionsService.findAll(ownerId);
  }

  @Get(':id')
  findOne(@OwnerId() ownerId: string, @Param('id') id: string) {
    return this.collectionsService.findOne(ownerId, id);
  }

  @Get(':id/bookmarks')
  findBookmarks(@OwnerId() ownerId: string, @Param('id') id: string) {
    return this.collectionsService.findBookmarks(ownerId, id);
  }

  @Put(':id')
  replace(@OwnerId() ownerId: string, @Param('id') id: string, @Body() dto: ReplaceCollectionDto) {
    return this.collectionsService.replace(ownerId, id, dto);
  }

  @Patch(':id')
  update(@OwnerId() ownerId: string, @Param('id') id: string, @Body() dto: UpdateCollectionDto) {
    return this.collectionsService.update(ownerId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@OwnerId() ownerId: string, @Param('id') id: string) {
    return this.collectionsService.remove(ownerId, id);
  }
}
