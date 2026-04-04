import { IsString, IsNotEmpty } from 'class-validator';

export class CreateConversationDto {
    @IsString()
    @IsNotEmpty()
    targetUserId: string;

    /** The requesting user's id — passed from frontend since JWT only carries email */
    @IsString()
    @IsNotEmpty()
    currentUserId: string;
}
