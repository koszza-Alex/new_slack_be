import { Controller, Get, Query } from '@nestjs/common';
import { SearchPresenter } from '../presenter/search.presenter';
import { MultiSearchDto } from '../dto/multi-search.dto';

/**
 * Search View (REST) — HTTP interface only. No business logic.
 * Delegates everything to SearchPresenter.
 */
@Controller()
export class SearchController {
    constructor(private readonly presenter: SearchPresenter) {}

    @Get('multi-search')
    multiSearch(@Query() dto: MultiSearchDto) {
        return this.presenter.multiSearch(dto.keyword, dto.workspaceId);
    }
}
