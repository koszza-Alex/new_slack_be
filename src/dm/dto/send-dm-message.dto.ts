import { IsString, IsNotEmpty } from 'class-validator';

export class SendDmMessageDto {
    @IsString()
    @IsNotEmpty()
    senderId: string;

    @IsString()
    @IsNotEmpty()
    content: string;
}
