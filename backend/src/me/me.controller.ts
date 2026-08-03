import { Controller, Get } from '@nestjs/common';
import { OwnerId } from '../auth/owner-id.decorator';

@Controller('me')
export class MeController {
  @Get()
  getMe(@OwnerId() ownerId: string) {
    return { sub: ownerId, ownerId };
  }
}
