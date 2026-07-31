import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateCollectionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @IsOptional()
  name?: string;
}
