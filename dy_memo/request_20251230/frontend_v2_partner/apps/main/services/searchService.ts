import { SearchRecord, SearchType } from '../types'

class SearchService {
  private records: Map<string, SearchRecord> = new Map()
  private prefixBucket: Map<string, Set<string>> = new Map()
  private initialized: boolean = false

  private normalize(str: string): string {
    return str.toLowerCase().replace(/\s+/g, '')
  }

  public addRecord(record: Omit<SearchRecord, 'searchText' | 'score'>): void {
    const normTitle = this.normalize(record.title)
    const normSub = this.normalize(record.subtitle)
    const normMeta = this.normalize(record.meta)

    const searchText = `${normTitle}|${normSub}|${normMeta}`

    const fullRecord: SearchRecord = {
      ...record,
      searchText,
      score: 0,
    }

    this.records.set(record.id, fullRecord)
    this.addToBucket(normTitle, record.id)
  }

  private addToBucket(normalizedTitle: string, id: string) {
    if (normalizedTitle.length > 0) {
      const p1 = normalizedTitle.substring(0, 1)
      if (!this.prefixBucket.has(p1)) this.prefixBucket.set(p1, new Set())
      this.prefixBucket.get(p1)!.add(id)
    }

    if (normalizedTitle.length > 1) {
      const p2 = normalizedTitle.substring(0, 2)
      if (!this.prefixBucket.has(p2)) this.prefixBucket.set(p2, new Set())
      this.prefixBucket.get(p2)!.add(id)
    }
  }

  public removeRecord(id: string) {
    this.records.delete(id)
  }

  public search(query: string, filterType: SearchType = 'ALL', limit: number = 50): SearchRecord[] {
    const q = this.normalize(query)
    if (!q) return []

    let candidates: string[] = []

    if (q.length <= 2 && this.prefixBucket.has(q)) {
      candidates = Array.from(this.prefixBucket.get(q)!)
    } else {
      candidates = Array.from(this.records.keys())
    }

    const results: SearchRecord[] = []

    for (const id of candidates) {
      const record = this.records.get(id)
      if (!record) continue

      if (filterType !== 'ALL' && record.type !== filterType) continue

      let score = 0
      const titleNorm = this.normalize(record.title)

      if (titleNorm === q) {
        score += 100
      } else if (titleNorm.startsWith(q)) {
        score += 80
      } else if (titleNorm.includes(q)) {
        score += 50
      } else if (record.searchText.includes(q)) {
        score += 20
      } else {
        continue
      }

      score += record.timestamp / 1000000000000

      record.score = score
      results.push(record)
    }

    results.sort((a, b) => (b.score || 0) - (a.score || 0))

    return results.slice(0, limit)
  }

  public loadMockData() {
    if (this.initialized) return

    const types: SearchType[] = ['SITE', 'LOG', 'DOC', 'PHOTO', 'DRAWING', 'EXPENSE']
    const statuses = ['진행중', '완료', '대기', '지연']

    for (let i = 0; i < 1000; i++) {
      const type = types[Math.floor(Math.random() * types.length)]
      const id = `item-${i}`
      this.addRecord({
        id,
        type,
        title: `현장 프로젝트 ${i} - ${type}`,
        subtitle: `서울시 강남구 삼성동 ${i}번지`,
        meta: `${statuses[i % 4]} | 2023-10-${(i % 30) + 1}`,
        flags: {
          hasPhoto: Math.random() > 0.5,
          hasDraw: Math.random() > 0.5,
          hasDoc: Math.random() > 0.5,
        },
        timestamp: Date.now() - Math.floor(Math.random() * 1000000000),
      })
    }

    this.addRecord({
      id: 'site1',
      type: 'SITE',
      title: '자이 아파트 101동',
      subtitle: '대구광역시 동구 동부로 149',
      meta: '진행중',
      flags: { hasPhoto: true, hasDraw: true, hasDoc: false },
      timestamp: Date.now(),
    })
    this.addRecord({
      id: 'site2',
      type: 'SITE',
      title: '삼성 반도체 P3',
      subtitle: '경기도 평택시 고덕면',
      meta: '예정',
      flags: { hasPhoto: false, hasDraw: true, hasDoc: true },
      timestamp: Date.now(),
    })

    this.initialized = true
  }
}

export const searchService = new SearchService()
