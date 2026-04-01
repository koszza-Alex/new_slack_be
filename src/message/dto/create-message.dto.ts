// =========================
// view/dto/create-message.dto.ts
// =========================
import { IsOptional, IsString } from 'class-validator';

export class CreateMessageDto {
    @IsString()
    content: string;

    @IsString()
    channelId: string;

    @IsString()
    senderId: string;

    @IsOptional()
    @IsString()
    parentId?: string;
}
