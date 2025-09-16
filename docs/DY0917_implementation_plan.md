# DY0917 Implementation Plan - 출력현황 (Work Output Status) Feature

## 📋 Executive Summary

Complete reimplementation of the /mobile/sites page to match the worklog.html reference file with 100% UI/UX fidelity. The current implementation shows incorrect content (SiteInfoPage) and needs to be replaced with a Work Output Management system featuring calendar views, salary calculations, and payslip generation.

## 🔍 Current Issues

1. **Wrong Component Rendering**: `/mobile/sites` currently renders `SiteInfoPage` instead of work output functionality
2. **Mixed Content**: Features are scattered across different pages instead of being consolidated
3. **Missing Core Features**: Calendar view, salary calculations, PDF generation not implemented
4. **UI/UX Mismatch**: Current implementation doesn't match the reference HTML design

## 🎯 Target Implementation

Based on reference file: `/Users/davidyang/workspace/INOPNC_WM_20250829/dy_memo/new_image_html_v2.0/html로 미리보기 화면/worklog.html`

### Core Features Required:

1. **Tab Navigation**
   - 출력현황 (Output Status) tab
   - 급여현황 (Salary Status) tab

2. **출력현황 Tab Features**
   - Calendar grid view showing daily work logs
   - Month/Year navigation
   - Site filter dropdown
   - Work log indicators (colored dots)
   - Monthly statistics display
   - Public service log integration

3. **급여현황 Tab Features**
   - Monthly salary calculation form
   - Individual/All worker selection
   - Payslip preview
   - PDF generation and download
   - Print functionality

4. **Global Features**
   - Dark mode support with CSS variables
   - Font size toggle (100% / 150%)
   - Responsive mobile design
   - Smooth transitions and animations

## 📂 File Structure

```
/app/mobile/sites/
├── page.tsx (Update to use new component)
└── layout.tsx (If needed for specific layouts)

/modules/mobile/components/work-output/
├── WorkOutputPage.tsx (Main container)
├── WorkOutputTabs.tsx (Tab navigation)
├── OutputStatusTab.tsx (출력현황 content)
├── SalaryStatusTab.tsx (급여현황 content)
├── CalendarView.tsx (Calendar grid component)
├── SiteFilter.tsx (Site selection dropdown)
├── MonthlyStats.tsx (Statistics display)
├── SalaryCalculator.tsx (Salary form)
├── PayslipGenerator.tsx (PDF generation)
└── styles/
    └── work-output.css (Custom styles)
```

## 🔄 Implementation Steps

### Phase 1: Setup and Structure (Day 1)

1. **Create new component structure**
   - Create `/modules/mobile/components/work-output/` directory
   - Create `WorkOutputPage.tsx` as main container
   - Implement basic tab navigation structure

2. **Update routing**
   - Modify `/app/mobile/sites/page.tsx` to use `WorkOutputPage`
   - Ensure proper authentication guards remain in place

3. **Setup CSS architecture**
   - Create CSS module for work-output styles
   - Implement CSS variables for theming
   - Add Tailwind configurations as needed

### Phase 2: 출력현황 Tab Implementation (Day 2-3)

1. **Calendar Component**

   ```typescript
   // CalendarView.tsx structure
   ;-generateCalendarGrid(year, month) -
     renderDayCell(date, workLogs) -
     handleMonthNavigation() -
     fetchWorkLogs(startDate, endDate)
   ```

2. **Site Filter**

   ```typescript
   // SiteFilter.tsx
   - Dropdown with "전체 현장" as default
   - Dynamic site list from API
   - Filter calendar data on selection
   ```

3. **Monthly Statistics**
   ```typescript
   // MonthlyStats.tsx
   - Total work days calculation
   - Work hours aggregation
   - Public/regular work separation
   ```

### Phase 3: 급여현황 Tab Implementation (Day 4-5)

1. **Salary Calculator Form**

   ```typescript
   // SalaryCalculator.tsx
   - Month/Year selection
   - Worker selection (individual/all)
   - Fetch salary data from API
   - Calculate totals and deductions
   ```

2. **Payslip Generator**
   ```typescript
   // PayslipGenerator.tsx
   - HTML template for payslip
   - PDF generation using html2pdf.js
   - Download functionality
   - Print preview
   ```

### Phase 4: Global Features (Day 6)

1. **Dark Mode Implementation**

   ```css
   /* CSS Variables */
   :root {
     --bg-primary: #ffffff;
     --text-primary: #000000;
   }

   [data-theme='dark'] {
     --bg-primary: #1a1a1a;
     --text-primary: #ffffff;
   }
   ```

2. **Font Size Toggle**

   ```typescript
   // Font scale classes
   .fs-100 { font-size: 1rem; }
   .fs-150 { font-size: 1.5rem; }
   ```

3. **Responsive Design**
   - Mobile-first approach
   - Touch-friendly interface
   - Smooth animations

## 🔗 API Integration Points

### Required Endpoints:

1. `GET /api/work-logs`
   - Parameters: userId, startDate, endDate, siteId
   - Returns: Array of work log entries

2. `GET /api/sites`
   - Returns: List of available sites for filtering

3. `GET /api/salary/calculate`
   - Parameters: userId, month, year
   - Returns: Salary calculation details

4. `POST /api/payslip/generate`
   - Parameters: salaryData, format (pdf/html)
   - Returns: Generated payslip file

## 🧪 Testing Strategy

### Unit Tests:

- Calendar generation logic
- Date calculations
- Salary calculation formulas
- Filter functionality

### Integration Tests:

- Tab switching
- API data fetching
- PDF generation
- Theme switching

### E2E Tests:

- Complete user flow from calendar view to payslip download
- Site filtering and data updates
- Dark mode and font size persistence

## 📊 Success Metrics

1. **UI/UX Match**: 100% fidelity with reference HTML
2. **Performance**: Page load < 2 seconds
3. **Responsiveness**: Smooth interactions on all mobile devices
4. **Accessibility**: WCAG 2.1 AA compliance
5. **Browser Support**: Chrome, Safari, Firefox mobile versions

## ⚠️ Risk Mitigation

1. **Data Loading**: Implement skeleton loaders for better UX
2. **PDF Generation**: Fallback to server-side generation if client fails
3. **State Management**: Use React Context for global state
4. **Error Handling**: Comprehensive error boundaries and user feedback

## 📅 Timeline

- **Week 1**: Phase 1-2 (Setup and 출력현황 tab)
- **Week 2**: Phase 3-4 (급여현황 tab and global features)
- **Week 3**: Testing, bug fixes, and optimization

## 🚀 Deployment Strategy

1. Feature branch development
2. Staging environment testing
3. Progressive rollout with feature flags
4. Monitor user feedback and performance metrics

## 📝 Notes

- All text should support Korean language
- Date formats should follow Korean conventions (YYYY년 MM월 DD일)
- Currency formatting for Korean Won (₩)
- Maintain existing authentication and authorization systems

---

**Document Created**: 2024-09-17
**Author**: Implementation Team
**Reference**: worklog.html
**Target Route**: /mobile/sites
