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
} from '@nestjs/common';
import { OwnerId } from '../auth/owner-id.decorator';
import { BookmarksService } from './bookmarks.service';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';
import { UpdateBookmarkDto } from './dto/update-bookmark.dto';

@Controller('bookmarks')
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  @Post()
  create(@OwnerId() ownerId: string, @Body() dto: CreateBookmarkDto) {
    return this.bookmarksService.create(ownerId, dto);
  }

  @Get()
  findAll(@OwnerId() ownerId: string) {
    return this.bookmarksService.findAll(ownerId);
  }

  @Get(':id')
  findOne(@OwnerId() ownerId: string, @Param('id') id: string) {
    return this.bookmarksService.findOne(ownerId, id);
  }

  @Patch(':id')
  update(@OwnerId() ownerId: string, @Param('id') id: string, @Body() dto: UpdateBookmarkDto) {
    return this.bookmarksService.update(ownerId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@OwnerId() ownerId: string, @Param('id') id: string) {
    return this.bookmarksService.remove(ownerId, id);
  }
}
