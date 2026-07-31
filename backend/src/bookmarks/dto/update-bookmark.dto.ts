import { IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class UpdateBookmarkDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @IsOptional()
  title?: string;

  @IsUrl({ require_protocol: true })
  @IsOptional()
  url?: string;

  @IsString()
  @IsOptional()
  collectionId?: string;
}
