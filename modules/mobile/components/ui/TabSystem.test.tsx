import React from 'react'
import { render, fireEvent, screen } from '@testing-library/react'
import { TabSystem, TabPanel, Tab } from './TabSystem'

// Mock 데이터
const mockTabs: Tab[] = [
  { id: 'tab1', label: '전체', count: 5 },
  { id: 'tab2', label: '임시저장', count: 2 },
  { id: 'tab3', label: '작성완료', count: 3 }
]

const mockOnTabChange = jest.fn()

// 테스트용 컴포넌트
const TestTabSystem = ({ activeTab = 'tab1', tabs = mockTabs }) => (
  <TabSystem tabs={tabs} activeTab={activeTab} onTabChange={mockOnTabChange}>
    <TabPanel data-panel="tab1">전체 탭 내용</TabPanel>
    <TabPanel data-panel="tab2">임시저장 탭 내용</TabPanel>
    <TabPanel data-panel="tab3">작성완료 탭 내용</TabPanel>
  </TabSystem>
)

describe('TabSystem Keyboard Navigation', () => {
  beforeEach(() => {
    mockOnTabChange.mockClear()
  })

  // KN-001: 방향키 네비게이션 테스트
  describe('Arrow Key Navigation', () => {
    test('should navigate to next tab on ArrowRight', () => {
      render(<TestTabSystem activeTab="tab1" />)
      const tabList = screen.getByRole('tablist')
      
      fireEvent.keyDown(tabList, { key: 'ArrowRight' })
      
      expect(mockOnTabChange).toHaveBeenCalledWith('tab2')
    })

    test('should navigate to previous tab on ArrowLeft', () => {
      render(<TestTabSystem activeTab="tab2" />)
      const tabList = screen.getByRole('tablist')
      
      fireEvent.keyDown(tabList, { key: 'ArrowLeft' })
      
      expect(mockOnTabChange).toHaveBeenCalledWith('tab1')
    })

    test('should cycle to first tab from last tab on ArrowRight', () => {
      render(<TestTabSystem activeTab="tab3" />)
      const tabList = screen.getByRole('tablist')
      
      fireEvent.keyDown(tabList, { key: 'ArrowRight' })
      
      expect(mockOnTabChange).toHaveBeenCalledWith('tab1')
    })

    test('should cycle to last tab from first tab on ArrowLeft', () => {
      render(<TestTabSystem activeTab="tab1" />)
      const tabList = screen.getByRole('tablist')
      
      fireEvent.keyDown(tabList, { key: 'ArrowLeft' })
      
      expect(mockOnTabChange).toHaveBeenCalledWith('tab3')
    })

    test('should prevent default behavior on arrow key press', () => {
      render(<TestTabSystem />)
      const tabList = screen.getByRole('tablist')
      const result = fireEvent.keyDown(tabList, { key: 'ArrowRight' })

      expect(result).toBe(false)
    })
  })

  // KN-002: Home/End 키 네비게이션 테스트
  describe('Home/End Key Navigation', () => {
    test('should navigate to first tab on Home key', () => {
      render(<TestTabSystem activeTab="tab2" />)
      const tabList = screen.getByRole('tablist')
      
      fireEvent.keyDown(tabList, { key: 'Home' })
      
      expect(mockOnTabChange).toHaveBeenCalledWith('tab1')
    })

    test('should navigate to last tab on End key', () => {
      render(<TestTabSystem activeTab="tab1" />)
      const tabList = screen.getByRole('tablist')
      
      fireEvent.keyDown(tabList, { key: 'End' })
      
      expect(mockOnTabChange).toHaveBeenCalledWith('tab3')
    })

    test('should stay on first tab when already on first tab and Home is pressed', () => {
      render(<TestTabSystem activeTab="tab1" />)
      const tabList = screen.getByRole('tablist')

      fireEvent.keyDown(tabList, { key: 'Home' })

      expect(mockOnTabChange).not.toHaveBeenCalled()
    })

    test('should stay on last tab when already on last tab and End is pressed', () => {
      render(<TestTabSystem activeTab="tab3" />)
      const tabList = screen.getByRole('tablist')

      fireEvent.keyDown(tabList, { key: 'End' })

      expect(mockOnTabChange).not.toHaveBeenCalled()
    })

    test('should prevent default behavior on Home/End key press', () => {
      render(<TestTabSystem />)
      const tabList = screen.getByRole('tablist')
      
      const homeResult = fireEvent.keyDown(tabList, { key: 'Home' })
      expect(homeResult).toBe(false)

      const endResult = fireEvent.keyDown(tabList, { key: 'End' })
      expect(endResult).toBe(false)
    })
  })

  // KN-003: 포커스 관리 테스트
  describe('Focus Management', () => {
    test('should focus the new tab after keyboard navigation', () => {
      render(<TestTabSystem activeTab="tab1" />)
      const tabList = screen.getByRole('tablist')
      
      // Mock querySelector to return a focusable element
      const mockTab = { focus: jest.fn() }
      const querySelectorSpy = jest.spyOn(document, 'querySelector')
      querySelectorSpy.mockReturnValue(mockTab as any)
      
      fireEvent.keyDown(tabList, { key: 'ArrowRight' })
      
      expect(querySelectorSpy).toHaveBeenCalledWith('[role="tab"][data-tab-id="tab2"]')
      expect(mockTab.focus).toHaveBeenCalled()
      
      querySelectorSpy.mockRestore()
    })

    test('should not change focus if tab index does not change', () => {
      render(<TestTabSystem activeTab="tab1" />)
      const tabList = screen.getByRole('tablist')
      
      const querySelectorSpy = jest.spyOn(document, 'querySelector')
      
      // Press a key that doesn't change tab
      fireEvent.keyDown(tabList, { key: 'Space' })
      
      expect(querySelectorSpy).not.toHaveBeenCalled()
      expect(mockOnTabChange).not.toHaveBeenCalled()
      
      querySelectorSpy.mockRestore()
    })
  })

  // ARIA-001: ARIA 속성 테스트
  describe('ARIA Attributes', () => {
    test('should have proper tablist role and aria-label', () => {
      render(<TestTabSystem />)
      
      const tabList = screen.getByRole('tablist')
      expect(tabList).toHaveAttribute('aria-label', '작업일지 탭')
    })

    test('should have proper tab roles and attributes', () => {
      render(<TestTabSystem activeTab="tab2" />)
      
      const tabs = screen.getAllByRole('tab')
      expect(tabs).toHaveLength(3)
      
      // First tab (inactive)
      expect(tabs[0]).toHaveAttribute('data-tab-id', 'tab1')
      expect(tabs[0]).toHaveAttribute('aria-selected', 'false')
      expect(tabs[0]).toHaveAttribute('aria-controls', 'panel-tab1')
      expect(tabs[0]).toHaveAttribute('tabIndex', '-1')
      
      // Second tab (active)
      expect(tabs[1]).toHaveAttribute('data-tab-id', 'tab2')
      expect(tabs[1]).toHaveAttribute('aria-selected', 'true')
      expect(tabs[1]).toHaveAttribute('aria-controls', 'panel-tab2')
      expect(tabs[1]).toHaveAttribute('tabIndex', '0')
      
      // Third tab (inactive)
      expect(tabs[2]).toHaveAttribute('data-tab-id', 'tab3')
      expect(tabs[2]).toHaveAttribute('aria-selected', 'false')
      expect(tabs[2]).toHaveAttribute('aria-controls', 'panel-tab3')
      expect(tabs[2]).toHaveAttribute('tabIndex', '-1')
    })

    test('should have proper tabpanel roles and attributes', () => {
      render(<TestTabSystem activeTab="tab2" />)
      
      const panels = screen.getAllByRole('tabpanel', { hidden: true })
      expect(panels).toHaveLength(3)
      
      // Check panel attributes
      expect(panels[0]).toHaveAttribute('id', 'panel-tab1')
      expect(panels[0]).toHaveAttribute('aria-labelledby', 'tab-tab1')
      expect(panels[0]).toHaveAttribute('hidden')
      
      expect(panels[1]).toHaveAttribute('id', 'panel-tab2')
      expect(panels[1]).toHaveAttribute('aria-labelledby', 'tab-tab2')
      expect(panels[1]).not.toHaveAttribute('hidden')
      
      expect(panels[2]).toHaveAttribute('id', 'panel-tab3')
      expect(panels[2]).toHaveAttribute('aria-labelledby', 'tab-tab3')
      expect(panels[2]).toHaveAttribute('hidden')
    })

    test('should update aria-selected when active tab changes', () => {
      const { rerender } = render(<TestTabSystem activeTab="tab1" />)
      
      let tabs = screen.getAllByRole('tab')
      expect(tabs[0]).toHaveAttribute('aria-selected', 'true')
      expect(tabs[1]).toHaveAttribute('aria-selected', 'false')
      
      rerender(<TestTabSystem activeTab="tab2" />)
      
      tabs = screen.getAllByRole('tab')
      expect(tabs[0]).toHaveAttribute('aria-selected', 'false')
      expect(tabs[1]).toHaveAttribute('aria-selected', 'true')
    })
  })

  // 추가 테스트: 탭 클릭 동작
  describe('Tab Click Navigation', () => {
    test('should change tab when clicked', () => {
      render(<TestTabSystem activeTab="tab1" />)
      
      const secondTab = screen.getByRole('tab', { name: /임시저장/ })
      fireEvent.click(secondTab)
      
      expect(mockOnTabChange).toHaveBeenCalledWith('tab2')
    })

    test('should display tab count when provided', () => {
      render(<TestTabSystem />)
      
      expect(screen.getByText('5')).toBeInTheDocument() // 전체 탭 count
      expect(screen.getByText('2')).toBeInTheDocument() // 임시저장 탭 count
      expect(screen.getByText('3')).toBeInTheDocument() // 작성완료 탭 count
    })
  })

  // 추가 테스트: 탭 패널 내용 표시
  describe('Tab Panel Content', () => {
    test('should show correct panel content for active tab', () => {
      render(<TestTabSystem activeTab="tab2" />)
      
      expect(screen.getByText('임시저장 탭 내용')).toBeVisible()
      expect(screen.queryByText('전체 탭 내용')).not.toBeVisible()
      expect(screen.queryByText('작성완료 탭 내용')).not.toBeVisible()
    })

    test('should switch panel content when tab changes', () => {
      const { rerender } = render(<TestTabSystem activeTab="tab1" />)
      
      expect(screen.getByText('전체 탭 내용')).toBeVisible()
      
      rerender(<TestTabSystem activeTab="tab3" />)
      
      expect(screen.getByText('작성완료 탭 내용')).toBeVisible()
      expect(screen.queryByText('전체 탭 내용')).not.toBeVisible()
    })
  })

  // 추가 테스트: 변형(variant) 스타일링
  describe('Tab Variants', () => {
    test('should apply correct classes for grid variant', () => {
      render(
        <TabSystem
          tabs={mockTabs}
          activeTab="tab1"
          onTabChange={mockOnTabChange}
          variant="grid"
        />
      )
      
      const tabs = screen.getAllByRole('tab')
      expect(tabs[0]).toHaveClass('h-14', 'bg-[#1A254F]', 'text-white')
      expect(tabs[1]).toHaveClass('h-14', 'bg-white', 'text-[#667085]')
    })

    test('should apply correct classes for underline variant', () => {
      render(
        <TabSystem
          tabs={mockTabs}
          activeTab="tab1"
          onTabChange={mockOnTabChange}
          variant="underline"
        />
      )
      
      const tabs = screen.getAllByRole('tab')
      expect(tabs[0]).toHaveAttribute('data-state', 'active')
      expect(tabs[1]).toHaveAttribute('data-state', 'inactive')
    })
  })

  // 에러 케이스 테스트
  describe('Edge Cases', () => {
    test('should handle empty tabs array', () => {
      render(
        <TabSystem
          tabs={[]}
          activeTab=""
          onTabChange={mockOnTabChange}
        />
      )
      
      const tabList = screen.getByRole('tablist')
      fireEvent.keyDown(tabList, { key: 'ArrowRight' })
      
      expect(mockOnTabChange).not.toHaveBeenCalled()
    })

    test('should handle invalid active tab id', () => {
      render(<TestTabSystem activeTab="invalid-tab" />)
      
      const tabList = screen.getByRole('tablist')
      fireEvent.keyDown(tabList, { key: 'ArrowRight' })
      
      // Should still navigate to first tab
      expect(mockOnTabChange).toHaveBeenCalledWith('tab1')
    })

    test('should handle single tab navigation', () => {
      const singleTab: Tab[] = [{ id: 'only-tab', label: '단일 탭' }]
      
      render(
        <TabSystem
          tabs={singleTab}
          activeTab="only-tab"
          onTabChange={mockOnTabChange}
        >
          <TabPanel data-panel="only-tab">단일 탭 내용</TabPanel>
        </TabSystem>
      )
      
      const tabList = screen.getByRole('tablist')
      
      // Arrow keys should not change anything
      fireEvent.keyDown(tabList, { key: 'ArrowRight' })
      fireEvent.keyDown(tabList, { key: 'ArrowLeft' })
      fireEvent.keyDown(tabList, { key: 'Home' })
      fireEvent.keyDown(tabList, { key: 'End' })
      
      expect(mockOnTabChange).not.toHaveBeenCalled()
    })
  })
})
