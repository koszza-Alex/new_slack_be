import { IsString, IsNotEmpty } from 'class-validator';

export class ToggleReactionDto {
    @IsString()
    @IsNotEmpty()
    emoji: string;

    @IsString()
    @IsNotEmpty()
    userId: string;
}
