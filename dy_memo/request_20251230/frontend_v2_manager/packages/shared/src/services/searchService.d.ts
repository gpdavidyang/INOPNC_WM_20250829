import { SearchRecord, SearchType } from '../types'
declare class SearchService {
  private records
  private prefixBucket
  private initialized
  private normalize
  addRecord(record: Omit<SearchRecord, 'searchText' | 'score'>): void
  private addToBucket
  removeRecord(id: string): void
  search(query: string, filterType?: SearchType, limit?: number): SearchRecord[]
  loadMockData(): void
}
export declare const searchService: SearchService
export {}
//# sourceMappingURL=searchService.d.ts.map
