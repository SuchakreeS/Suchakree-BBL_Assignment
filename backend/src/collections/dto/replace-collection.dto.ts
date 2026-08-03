import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ReplaceCollectionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;
}
