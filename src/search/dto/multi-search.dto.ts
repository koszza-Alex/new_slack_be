import { IsString, IsUUID} from "class-validator";

export class MultiSearchDto {

  @IsString()
  keyword: string;

  @IsUUID()
  workspaceId: string;

}