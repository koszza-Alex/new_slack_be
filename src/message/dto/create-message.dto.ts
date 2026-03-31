// =========================
// view/dto/create-message.dto.ts
// =========================
import { IsString } from 'class-validator';

export class CreateMessageDto {
    @IsString()
    content: string;

    @IsString()
    channelId: string;

    @IsString()
    senderId: string;
}
