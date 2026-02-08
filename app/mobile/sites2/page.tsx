import { requireAuth } from '@/lib/auth/ultra-simple'
import { ORGANIZATION_UNASSIGNED_LABEL } from '@/lib/sites/site-response'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { MobileAuthGuard } from '@/modules/mobile/components/auth/mobile-auth-guard'
import { MobileLayoutWithAuth } from '@/modules/mobile/components/layout/MobileLayoutWithAuth'
import { readFile } from 'fs/promises'
import { headers } from 'next/headers'
import path from 'path'

export const dynamic = 'force-dynamic'

type MobileSitesListItem = {
  id: string
  name: string
  status?: string | null
  organization_name?: string | null
  address?: string | null
  manager_name?: string | null
  safety_manager_name?: string | null
}

type Sites2CardItem = {
  id: number
  pinned: boolean
  status: 'ing' | 'plan' | 'done' | 'stop'
  contractor: string
  affil: string
  name: string
  addr: string
  days: number
  mp: number
  manager: string
  safety: string
  phoneM: string
  phoneS: string
  lodge: string
  note: string
  lastDate: string
  lastTime: string
  drawings: { construction: unknown[]; progress: unknown[]; completion: unknown[] }
  ptw: null
  workLog: null
  doc: null
  punch: null
  images: unknown[]
  isLocal: boolean
  db_site_id: string
}

function mapDbStatusToMock(status?: string | null): Sites2CardItem['status'] {
  const normalized = (status || '').toLowerCase()
  if (!normalized) return 'ing'
  if (
    ['done', 'completed', 'complete', 'finished', 'finish', 'end', 'ended', 'closed'].includes(
      normalized
    )
  ) {
    return 'done'
  }
  if (
    [
      'paused',
      'hold',
      'on_hold',
      'stop',
      'stopped',
      'suspended',
      'canceled',
      'cancel',
      'inactive',
    ].includes(normalized)
  ) {
    return 'stop'
  }
  if (['wait', 'pending', 'plan', 'planned', 'scheduled', 'ready'].includes(normalized)) {
    return 'plan'
  }
  return 'ing'
}

function safeJsonForInlineScript(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

function injectDbSitesIntoMockHtml(html: string, sites: Sites2CardItem[]) {
  if (!sites.length) return html

  const payload = safeJsonForInlineScript(sites)
  const replacement = [
    '/* INOPNC: Inject sites from DB (server-rendered) */',
    '(function(){',
    '  try {',
    `    const dbSites = ${payload};`,
    '    if (Array.isArray(dbSites) && dbSites.length) {',
    '      allSites = dbSites;',
    '    } else {',
    '      initMockData();',
    '    }',
    '  } catch (e) {',
    '    initMockData();',
    '  }',
    '})();',
  ].join('\n')

  // Avoid replacing the function definition: only replace a standalone call line like `initMockData()` / `initMockData();`
  const callRegex = /(^|\n)([ \t]*)initMockData\(\)\s*;?/m
  if (!callRegex.test(html)) return html

  return html.replace(callRegex, (_match, prefix, indent: string) => {
    const indentedReplacement = replacement
      .split('\n')
      .map(line => `${indent}${line}`)
      .join('\n')
    return `${prefix}${indentedReplacement}`
  })
}

async function fetchMobileSitesList(): Promise<MobileSitesListItem[]> {
  try {
    const h = headers()
    const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000'
    const proto = h.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https')
    const baseUrl = `${proto}://${host}`
    const cookie = h.get('cookie') || ''

    const res = await fetch(`${baseUrl}/api/mobile/sites/list`, {
      cache: 'no-store',
      headers: cookie ? { cookie } : undefined,
    })

    if (!res.ok) return []
    const json = (await res.json().catch(() => null)) as unknown
    if (!json || typeof json !== 'object') return []
    if (!('success' in json) || (json as any).success !== true) return []
    if (!Array.isArray((json as any).data)) return []
    return (json as any).data
  } catch {
    return []
  }
}

async function fetchApprovedManDaysBySiteIds(siteIds: string[]): Promise<Map<string, number>> {
  if (siteIds.length === 0) return new Map()

  let client: any
  try {
    client = createServiceRoleClient()
  } catch {
    client = createClient()
  }

  try {
    const { data, error } = await client
      .from('daily_reports')
      .select('site_id, hours:total_labor_hours.sum()')
      .eq('status', 'approved')
      .in('site_id', siteIds)

    if (error || !Array.isArray(data)) return new Map()

    const result = new Map<string, number>()
    data.forEach((row: any) => {
      const siteId = row?.site_id ? String(row.site_id) : ''
      if (!siteId) return
      const hours = Number(row?.hours || 0)
      const manDays = Number.isFinite(hours) ? hours / 8 : 0
      result.set(siteId, Math.round(manDays * 10) / 10)
    })
    return result
  } catch {
    return new Map()
  }
}

export default async function MobileSites2Page() {
  await requireAuth('/mobile')

  const htmlPath = path.join(process.cwd(), 'dy_memo', 'request_20260111', '04site.html')
  const rawDoc = await readFile(htmlPath, 'utf8').catch(() => '')
  let srcDoc = rawDoc || ''

  const mobileSites = await fetchMobileSitesList()
  if (srcDoc && mobileSites.length) {
    const siteIds = mobileSites.map(site => String(site.id)).filter(Boolean)
    const approvedManDaysBySiteId = await fetchApprovedManDaysBySiteIds(siteIds)

    const mapped: Sites2CardItem[] = mobileSites.slice(0, 200).map((site, idx) => ({
      id: idx + 1,
      pinned: false,
      status: mapDbStatusToMock(site.status),
      contractor: (site.organization_name || '').trim() || ORGANIZATION_UNASSIGNED_LABEL,
      affil: (site.organization_name || '').trim() || ORGANIZATION_UNASSIGNED_LABEL,
      name: (site.name || '').trim() || '현장',
      addr: (site.address || '').trim(),
      days: 0,
      mp: approvedManDaysBySiteId.get(String(site.id)) || 0,
      manager: (site.manager_name || '').trim(),
      safety: (site.safety_manager_name || '').trim(),
      phoneM: '',
      phoneS: '',
      lodge: '',
      note: '',
      lastDate: '',
      lastTime: '',
      drawings: { construction: [], progress: [], completion: [] },
      ptw: null,
      workLog: null,
      doc: null,
      punch: null,
      images: [],
      isLocal: false,
      db_site_id: String(site.id),
    }))

    srcDoc = injectDbSitesIntoMockHtml(srcDoc, mapped)
  }

  // INOPNC: Validation & CSS Overrides (Applied to both Mock & Real Data)
  if (srcDoc) {
    const cssOverrides = `
    <style>
      /* Fix Scroll & Layout */
      html, body { min-height: 100vh !important; height: auto !important; overflow-y: auto !important; }
      .app-wrapper { min-height: 100vh !important; padding-bottom: 150px !important; }
      
      /* Fix Badge Sizing (Match Worklog Style) */
      .sub-badge {
        padding: 4px 10px !important;
        height: auto !important;
        min-height: 24px !important;
        border-radius: 6px !important;
        display: inline-flex !important;
        white-space: normal !important;
        line-height: 1.2 !important;
        font-weight: 700 !important;
        /* Force auto width, overriding inline flex:1 if present */
        flex: none !important;
        width: auto !important;
      }
      
      /* Reduce Card Header Padding */
      .card-header-main { padding: 16px 16px !important; }
      
      /* Tighten Row Spacing (Gap between Name and Address) */
      .site-top-row { margin-bottom: 4px !important; }
      .site-sub-info { margin-bottom: 6px !important; }
      .addr-row { padding-top: 0 !important; }
      
      /* Hide Unnecessary Badges (Keep only Affiliation) */
      .sub-badge.contractor, .sub-badge.weather { display: none !important; }
      
      /* Fix Icon Visibility - Enforce Dark Color on SVG Stroke */
      .btn-star, .data-icon { color: #475569 !important; } /* Slate 600 */
      .btn-star svg, .data-icon svg { stroke: #475569 !important; }
      
      .btn-star.active, .btn-star.active svg { color: var(--primary) !important; stroke: var(--primary) !important; }
      .data-icon.active, .data-icon.active svg { color: #1a254f !important; stroke: #1a254f !important; }
    </style>`
    srcDoc = srcDoc.replace('</head>', `${cssOverrides}</head>`)

    // INOPNC: Custom Logic Injection (Swapping Title <-> Affil)
    const scriptInjection = `
    <script>
    window.createCard = function(site) {
        const weather = WeatherService.getWeather(site.addr);
        let badgeClass = 'bdg-ing', badgeText = '진행중';
        if(site.status === 'wait') { badgeClass = 'bdg-wait'; badgeText = '예정'; }
        if(site.status === 'done') { badgeClass = 'bdg-done'; badgeText = '완료'; }
        const pinClass = site.pinned ? 'active' : '';
        
        const hasAddr = site.addr && site.addr !== '-' && site.addr !== '입력' && site.addr !== null && site.addr !== undefined && String(site.addr).trim() !== '';
        const addrDisplay = hasAddr ? site.addr : '<span style="color:var(--text-placeholder); font-weight:800;">데이터 없음</span>';
        
        const hasLodge = site.lodge && site.lodge !== '-' && site.lodge !== '입력' && site.lodge !== null && site.lodge !== undefined && String(site.lodge).trim() !== '';
        const lodgeDisplay = hasLodge ? site.lodge : '<span style="color:var(--primary); text-decoration:underline;">주소 찾기</span>';

        const affilClass = site.affil === '직접등록' ? 'sub-badge direct' : 'sub-badge affil';
        
        const hasDraw = !!(site.drawings && (site.drawings.construction.length || site.drawings.progress.length || site.drawings.completion.length));
        const hasPhoto = !!(site.images && site.images.length);
        const hasPTW = !!site.ptw;
        const hasLog = !!site.workLog;
        const hasAction = !!site.punch;

        let addrAction = hasAddr ? \`onclick="openTMap(this.dataset.addr)" data-addr="\${(site.addr || '').replace(/"/g, '&quot;')}"\` : \`onclick="showToast('현장 주소 데이터가 없습니다.')"\`;
        let addrCursor = hasAddr ? "cursor:pointer;" : "cursor:not-allowed; opacity:.85;";
        let addrIconStyle = !hasAddr ? 'border:1px dashed rgba(148,163,184,.7); color:var(--text-placeholder); background:transparent; cursor:not-allowed; opacity:.9;' : '';
        
        let lodgeTextAction = !hasLodge ? \`onclick="searchAddress(\${site.id}, 'lodge', 'tmap')"\` : \`onclick="openTMap(this.dataset.addr)" data-addr="\${(site.lodge || '').replace(/"/g, '&quot;')}"\`;
        let lodgeTextStyle = "cursor:pointer;";
         
        let lodgeIcon = hasLodge 
            ? \`<button class="btn-icon-sq" onclick="openTMap(this.dataset.addr)" data-addr="\${(site.lodge || '').replace(/"/g, '&quot;')}"><i data-lucide="map-pin" style="width:18px;"></i></button>\` 
            : \`<button class="btn-icon-sq" style="border:1px dashed var(--primary); color:var(--primary); background:transparent;" onclick="searchAddress(\${site.id}, 'lodge', 'tmap')"><i data-lucide="map-pin" style="width:18px;"></i></button>\`;
        
        const btnPhoneM = site.isLocal 
            ? \`<button class="btn-icon-sq" style="\${site.phoneM?'':'border:1px dashed var(--border); background:transparent;'}" onclick="handleLocalPhone(\${site.id}, 'phoneM')"><i data-lucide="phone" style="width:18px;"></i></button>\` 
            : \`<a href="tel:\${site.phoneM}" class="btn-icon-sq"><i data-lucide="phone" style="width:18px;"></i></a>\`;
        const btnPhoneS = site.isLocal 
            ? \`<button class="btn-icon-sq" style="\${site.phoneS?'':'border:1px dashed var(--border); background:transparent;'}" onclick="handleLocalPhone(\${site.id}, 'phoneS')"><i data-lucide="phone" style="width:18px;"></i></button>\` 
            : \`<a href="tel:\${site.phoneS}" class="btn-icon-sq"><i data-lucide="phone" style="width:18px;"></i></a>\`;

        const mgrVal = site.manager || '';
        const safVal = site.safety || '';
        const mgrAction = (site.isLocal && (!mgrVal || mgrVal==='-')) ? \`onclick="editInfo(\${site.id}, 'manager')"\` : '';
        const safAction = (site.isLocal && (!safVal || safVal==='-')) ? \`onclick="editInfo(\${site.id}, 'safety')"\` : '';
        const mgrStyle = (site.isLocal && (!mgrVal || mgrVal==='-')) ? "cursor:pointer; color:var(--text-placeholder);" : "";
        const safStyle = (site.isLocal && (!safVal || safVal==='-')) ? "cursor:pointer; color:var(--text-placeholder);" : "";

        const isExpanded = expandedCardIds.has(site.id) ? 'expanded' : '';
        const dateLabel = site.lastDate ? (site.lastTime ? \`\${site.lastDate} (최종 \${site.lastTime})\` : site.lastDate) : '';

        return \`
        <div class="site-card \${site.pinned ? 'pinned-item' : ''} \${isExpanded}" id="card-\${site.id}">
            <div class="card-header-main">
                \${dateLabel ? \`<div class="site-date">\${dateLabel}</div>\` : ''}
                
                <div class="site-top-row">
                    <!-- [SWAPPED] Affiliation Badge (Top Left) -->
                    <div style="flex:1; display:flex; align-items:center;">
                        <span class="\${affilClass}" style="margin-right:0;">\${site.affil}</span>
                    </div>
                    
                    <!-- Status & Pin (Top Right) -->
                    <div style="display:flex; gap:6px; align-items:center;">
                        <span class="site-badge \${badgeClass}">\${badgeText}</span>
                        <button class="btn-star \${pinClass}" onclick="togglePin(\${site.id}, event)"><i data-lucide="\${site.pinned ? 'pin-off' : 'pin'}" style="width:22px; height:22px; \${site.pinned ? 'color:var(--primary);' : ''}"></i></button>
                    </div>
                </div>

                <div class="site-sub-info">
                   <!-- [SWAPPED] Title (Below) -->
                   <div class="site-sub-left">
                       <div class="site-name-text" style="font-size:20px; font-weight:800; margin-right:8px;">\${site.name}</div>
                   </div>
                   <!-- Indicator Icons -->
                   <div class="indicator-group" style="margin-left:auto;">
                       <i data-lucide="map" class="data-icon \${hasDraw ? 'active' : ''}"></i>
                       <i data-lucide="camera" class="data-icon \${hasPhoto ? 'active' : ''}"></i>
                       <i data-lucide="file-check-2" class="data-icon \${hasPTW ? 'active' : ''}"></i>
                       <i data-lucide="clipboard-list" class="data-icon \${hasLog ? 'active' : ''}"></i>
                       <i data-lucide="check-circle-2" class="data-icon \${hasAction ? 'active' : ''}"></i>
                   </div>
                </div>

                <div class="addr-row">
                    <div class="addr-text" \${addrAction} style="\${addrCursor}"><span>\${addrDisplay}</span></div>
                    <button class="btn-icon-sq" \${addrAction} style="\${addrIconStyle}"><i data-lucide="map-pin" style="width:18px;"></i></button>
                </div>
            </div>
            
            <div class="card-body-detail">
                <div class="info-row"><span class="info-label">현장소장</span><div style="display:flex; align-items:center; gap:8px;"><span class="info-val" \${mgrAction} style="\${mgrStyle}">\${mgrVal || '입력'}</span>\${btnPhoneM}</div></div>
                <div class="info-row"><span class="info-label">안전담당</span><div style="display:flex; align-items:center; gap:8px;"><span class="info-val" \${safAction} style="\${safStyle}">\${safVal || '입력'}</span>\${btnPhoneS}</div></div>
                <div class="info-row"><span class="info-label" style="margin-bottom:0; align-self:center;">숙소</span><div style="display:flex; align-items:center; justify-content:flex-end; flex:1; gap:8px;"><span class="info-val" \${lodgeTextAction} style="\${lodgeTextStyle}">\${lodgeDisplay}</span>\${lodgeIcon}</div></div>
                <div class="stats-row" style="border-bottom:none;">
                    <div class="stat-item"><span class="stat-label">작업일 누계</span><span class="stat-val">\${site.days}일</span></div>
                    <div class="stat-item"><span class="stat-label">하자(미조치)</span><span class="stat-val danger">\${site.mp}건</span></div>
                </div>
                <div class="action-grid">
                    <button class="act-btn type-draw \${hasDraw ? '' : 'inactive'}" onclick="handleDrawClick(\${site.id})"><i data-lucide="map" class="act-icon"></i><span class="act-label">도면</span></button>
                    <button class="act-btn type-photo \${hasPhoto ? '' : 'inactive'}" onclick="checkData(\${site.id}, 'images', '사진')"><i data-lucide="camera" class="act-icon"></i><span class="act-label">사진</span></button>
                    <button class="act-btn type-ptw \${hasPTW ? '' : 'inactive'}" onclick="checkData(\${site.id}, 'ptw', 'PTW')"><i data-lucide="file-check-2" class="act-icon"></i><span class="act-label">PTW</span></button>
                    <button class="act-btn type-log \${hasLog ? '' : 'inactive'}" onclick="checkData(\${site.id}, 'workLog', '일지')"><i data-lucide="clipboard-list" class="act-icon"></i><span class="act-label">일지</span></button>
                    <button class="act-btn type-action \${hasAction ? '' : 'inactive'}" onclick="checkData(\${site.id}, 'punch', '조치')"><i data-lucide="check-circle-2" class="act-icon"></i><span class="act-label">조치</span></button>
                </div>
            </div>
            <div class="toggle-btn-area" onclick="toggleExpand(\${site.id})"><span class="toggle-text">상세 정보 보기</span><i data-lucide="chevron-down" class="chevron-icon"></i></div>
        </div>\`;
    };
    // Re-render
    setTimeout(() => { if(window.renderSites) window.renderSites(); }, 50);
    </script>
    `
    srcDoc = srcDoc.replace('</body>', `${scriptInjection}</body>`)
  }

  return (
    <MobileAuthGuard requiredRoles={['worker', 'site_manager', 'customer_manager', 'partner']}>
      <MobileLayoutWithAuth>
        {srcDoc ? (
          <div
            className="w-full"
            style={{
              height:
                'calc(100vh - var(--header-offset, calc(var(--header-h, 80px) + var(--safe-area-top, env(safe-area-inset-top, 0px)))) - 72px)',
            }}
          >
            <iframe
              title="현장정보2 목업"
              srcDoc={srcDoc}
              className="w-full h-full"
              style={{ border: '0' }}
              sandbox="allow-scripts allow-forms allow-popups allow-downloads allow-same-origin"
            />
          </div>
        ) : (
          <div className="px-5 py-8 text-sm text-slate-600">
            `dy_memo/request_20260111/04site.html` 파일을 읽지 못했습니다.
          </div>
        )}
      </MobileLayoutWithAuth>
    </MobileAuthGuard>
  )
}
