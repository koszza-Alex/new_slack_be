import { IsEmail, IsNotEmpty } from 'class-validator';

export class InvitedUserDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  workspaceName: string;
}