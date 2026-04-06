import { Injectable } from '@nestjs/common';
import { SearchService } from '../search.service';

/**
 * Search Presenter — mediates between SearchController and SearchService.
 */
@Injectable()
export class SearchPresenter {
    constructor(private readonly searchService: SearchService) {}

    multiSearch(keyword: string, workspaceId: string) {
        return this.searchService.multiSearch(keyword, workspaceId);
    }
}
