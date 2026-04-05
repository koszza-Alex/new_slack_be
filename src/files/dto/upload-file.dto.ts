import { IsString, IsOptional } from 'class-validator';

export class UploadFileDto {
  @IsString()
  workspaceId: string;

  @IsOptional()
  @IsString()
  channelId?: string;

  @IsOptional()
  @IsString()
  messageId?: string;
}