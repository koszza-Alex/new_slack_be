import { Controller, Get, Query } from "@nestjs/common";
import { SearchService } from "./search.service";
import { MultiSearchDto } from "./dto/multi-search.dto";

@Controller()
export class SearchController {

  constructor(
    private readonly searchService: SearchService,
  ) {}

  @Get("multi-search")
  async multiSearch(
    @Query() dto: MultiSearchDto,
  ) {
    console.log("111",dto.keyword, dto.workspaceId)
    return this.searchService.multiSearch(
      dto.keyword,
      dto.workspaceId,
    );

  }
}