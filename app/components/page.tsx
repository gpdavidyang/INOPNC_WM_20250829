'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/custom-select"
import { Dropdown } from "@/components/ui/dropdown"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Container } from "@/components/ui/container"
import { Heading, Text } from "@/components/ui/typography"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { NavBar } from "@/components/ui/navbar"
import { BottomNavigation } from "@/components/ui/bottom-navigation"
import { NavigationController } from "@/components/navigation/navigation-controller"
import { Footer, SimpleFooter } from "@/components/ui/footer"
import { Calendar, CheckCircle, AlertCircle, XCircle, Home, Settings, User, Menu, FileText, Users, Bell, BarChart, FileImage, FolderOpen } from "lucide-react"
import { useState } from "react"

export default function ComponentsPage() {
  const [inputValue, setInputValue] = useState("")
  const [textareaValue, setTextareaValue] = useState("")
  const [selectValue, setSelectValue] = useState("")
  const [dropdownValue, setDropdownValue] = useState("")

  // Dropdown options
  const workTypeOptions = [
    { value: "", label: "작업 구분을 선택하세요" },
    { value: "foundation", label: "기초 공사" },
    { value: "structure", label: "구조물 공사" },
    { value: "finishing", label: "마감 공사" },
    { value: "electrical", label: "전기 공사" },
    { value: "plumbing", label: "배관 공사" },
    { value: "landscaping", label: "조경 공사" }
  ]

  // NavBar demo data
  const navItems = [
    { label: "대시보드", href: "/dashboard", icon: <Home className="h-4 w-4" /> },
    { label: "작업일지", href: "/worklogs", icon: <FileText className="h-4 w-4" />, badge: 3 },
    { label: "현장관리", href: "/sites", icon: <Calendar className="h-4 w-4" /> },
    { label: "작업자", href: "/workers", icon: <Users className="h-4 w-4" /> },
    { label: "보고서", href: "/reports", icon: <BarChart className="h-4 w-4" /> }
  ]

  // Bottom Navigation demo data - PRD 사양에 맞게 업데이트
  const bottomNavItems = [
    { 
      label: "빠른화면", 
      href: "/dashboard", 
      icon: <Home /> 
    },
    { 
      label: "출력정보", 
      href: "/dashboard/attendance", 
      icon: <Calendar /> 
    },
    { 
      label: "작업일지", 
      href: "/dashboard/daily-reports", 
      icon: <FileText />, 
      badge: 3 
    },
    { 
      label: "공도면", 
      href: "/dashboard/shared-documents", 
      icon: <FileImage />,
      specialAction: 'filter-blueprint' as const
    },
    { 
      label: "내문서함", 
      href: "/dashboard/my-documents", 
      icon: <FolderOpen /> 
    }
  ]

  // Demo user data for 공도면 특수 동작
  const demoUser = {
    id: "demo-user",
    active_site_id: "site-gangnam-a"
  }

  // Footer demo data
  const footerSections = [
    {
      title: "서비스",
      links: [
        { label: "작업일지 관리", href: "/features/worklogs" },
        { label: "현장 관리", href: "/features/sites" },
        { label: "보고서 생성", href: "/features/reports" },
        { label: "팀 협업", href: "/features/collaboration" }
      ]
    },
    {
      title: "회사",
      links: [
        { label: "회사 소개", href: "/about" },
        { label: "채용", href: "/careers" },
        { label: "뉴스", href: "/news" },
        { label: "문의하기", href: "/contact" }
      ]
    },
    {
      title: "지원",
      links: [
        { label: "도움말", href: "/help" },
        { label: "API 문서", href: "/docs" },
        { label: "가격 정책", href: "/pricing" },
        { label: "파트너", href: "/partners" }
      ]
    }
  ]

  const footerBottomLinks = [
    { label: "개인정보처리방침", href: "/privacy" },
    { label: "이용약관", href: "/terms" },
    { label: "쿠키 정책", href: "/cookies" }
  ]

  return (
    <NavigationController>
      <div className="min-h-screen bg-toss-gray-50 dark:bg-toss-gray-900">
      {/* Navigation Section Demo */}
      <section className="space-y-8 pb-12 bg-white dark:bg-toss-gray-900">
        <div className="space-y-4">
          <Container>
            <Heading variant="h2">내비게이션 바</Heading>
            <Text size="sm" color="muted">데스크톱과 모바일 반응형 내비게이션</Text>
          </Container>
        </div>
        
        {/* Desktop NavBar Demo */}
        <div className="border border-toss-gray-200 dark:border-toss-gray-700 rounded-lg overflow-hidden">
          <NavBar items={navItems} />
          <div className="h-40 bg-toss-gray-50 dark:bg-toss-gray-800 flex items-center justify-center">
            <Text color="muted">페이지 콘텐츠 영역</Text>
          </div>
        </div>

        {/* Mobile Bottom Navigation Demo */}
        <Container>
          <div className="space-y-4">
            <div>
              <Text size="sm" color="muted" className="mb-2">모바일 하단 내비게이션 - PRD 사양 적용</Text>
              <div className="text-xs text-gray-600 space-y-1">
                <p>• PRD 메뉴 구성: 빠른화면, 출력현황, 작업일지, 공도면, 내문서함</p>
                <p>• 공도면 특수 동작: 활성 현장으로 자동 필터링</p>
                <p>• 디자인: 44x44px 터치 영역, 24x24px 아이콘, 10px 폰트</p>
              </div>
            </div>
            <div className="relative border border-toss-gray-200 dark:border-toss-gray-700 rounded-lg overflow-hidden">
              <div className="h-96 bg-toss-gray-50 dark:bg-toss-gray-800 flex items-center justify-center">
                <div className="text-center">
                  <Text color="muted" className="mb-2">모바일 콘텐츠 영역</Text>
                  <Text size="xs" color="muted">공도면 버튼 클릭 시 현장 ID &quot;{demoUser.active_site_id}&quot;로 자동 필터링</Text>
                </div>
              </div>
              <BottomNavigation items={bottomNavItems} currentUser={demoUser} />
            </div>
          </div>
        </Container>
      </section>

      <div className="bg-white dark:bg-toss-gray-900">
      <Container className="py-8 space-y-12">
      {/* Page Header with Theme Toggle */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Heading variant="h1">UI 컴포넌트 데모</Heading>
            <Text size="lg" color="muted">
              Toss 디자인 시스템 기반 건설 작업일지 UI 컴포넌트
            </Text>
          </div>
        </div>
      </div>

      <Separator />

      {/* Typography Section */}
      <section className="space-y-6">
        <Heading variant="h2">타이포그래피</Heading>
        <div className="space-y-4">
          <Heading variant="h1">제목 1 (h1) - 페이지 대제목</Heading>
          <Heading variant="h2">제목 2 (h2) - 섹션 제목</Heading>
          <Heading variant="h3">제목 3 (h3) - 카드 제목</Heading>
          <Heading variant="h4">제목 4 (h4) - 부제목</Heading>
          
          <div className="space-y-2 mt-4">
            <Text size="3xl" weight="bold">3xl 텍스트 - 대시보드 수치</Text>
            <Text size="2xl">2xl 텍스트 - 페이지 제목</Text>
            <Text size="xl">xl 텍스트 - 섹션 제목</Text>
            <Text size="lg">lg 텍스트 - 부제목</Text>
            <Text size="base">base 텍스트 - 본문 (모바일 최적)</Text>
            <Text size="sm" color="muted">sm 텍스트 - 캡션, 메타 정보</Text>
            <Text size="xs" color="muted">xs 텍스트 - 보조 텍스트</Text>
          </div>

          <div className="space-y-2 mt-4">
            <Text color="primary">Primary 색상 텍스트</Text>
            <Text color="success">Success 색상 텍스트</Text>
            <Text color="warning">Warning 색상 텍스트</Text>
            <Text color="error">Error 색상 텍스트</Text>
            <Text color="muted">Muted 색상 텍스트</Text>
          </div>
        </div>
      </section>

      <Separator />

      {/* Buttons Section */}
      <section className="space-y-6">
        <Heading variant="h2">버튼</Heading>
        
        <div className="space-y-4">
          <div>
            <Text size="sm" color="muted" className="mb-2">버튼 변형</Text>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary">Primary Button</Button>
              <Button variant="secondary">Secondary Button</Button>
              <Button variant="danger">Danger Button</Button>
              <Button variant="ghost">Ghost Button</Button>
              <Button variant="outline">Outline Button</Button>
            </div>
          </div>

          <div>
            <Text size="sm" color="muted" className="mb-2">버튼 크기</Text>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="compact">Compact</Button>
              <Button size="standard">Standard</Button>
              <Button size="field">Field</Button>
            </div>
          </div>

          <div>
            <Text size="sm" color="muted" className="mb-2">버튼 상태</Text>
            <div className="flex flex-wrap gap-3">
              <Button disabled>Disabled</Button>
              <Button size="full">Full Width Button</Button>
            </div>
          </div>

          <div>
            <Text size="sm" color="muted" className="mb-2">아이콘 버튼</Text>
            <div className="flex flex-wrap gap-3">
              <Button size="compact">
                <Home className="mr-2 h-4 w-4" />
                홈으로
              </Button>
              <Button variant="secondary">
                <Settings className="mr-2 h-4 w-4" />
                설정
              </Button>
              <Button variant="ghost" size="compact">
                <Menu className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Separator />

      {/* Cards Section */}
      <section className="space-y-6">
        <Heading variant="h2">카드</Heading>
        
        <div className="p-8 -mx-8 bg-toss-gray-50 dark:bg-toss-gray-800/50 rounded-2xl">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>작업일지 카드</CardTitle>
              <CardDescription>2024년 1월 30일</CardDescription>
            </CardHeader>
            <CardContent>
              <Text>1층 철근 배근 작업을 완료했습니다. 총 12명의 작업자가 참여했습니다.</Text>
            </CardContent>
            <CardFooter className="gap-2">
              <Badge variant="success">완료</Badge>
              <Badge variant="secondary">12명</Badge>
            </CardFooter>
          </Card>

          <Card className="cursor-pointer hover:-translate-y-1">
            <CardHeader>
              <CardTitle>인터랙티브 카드</CardTitle>
              <CardDescription>클릭 가능한 카드</CardDescription>
            </CardHeader>
            <CardContent>
              <Text>호버 시 상승 효과가 있는 카드입니다.</Text>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>상태 표시 카드</CardTitle>
              <CardDescription>다양한 상태 표시</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <Text size="sm">작업 완료</Text>
                </div>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                  <Text size="sm">검토 필요</Text>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <Text size="sm">문제 발생</Text>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        </div>
      </section>

      <Separator />

      {/* Forms Section */}
      <section className="space-y-6">
        <Heading variant="h2">폼 요소</Heading>
        
        <div className="max-w-2xl space-y-6">
          <div className="space-y-2">
            <Label htmlFor="input-demo">입력 필드</Label>
            <Input
              id="input-demo"
              type="text"
              placeholder="작업 위치를 입력하세요"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <Text size="sm" color="muted">입력값: {inputValue || "없음"}</Text>
          </div>

          <div className="space-y-2">
            <Label htmlFor="textarea-demo">텍스트 영역</Label>
            <Textarea
              id="textarea-demo"
              placeholder="작업 내용을 상세히 설명해주세요"
              value={textareaValue}
              onChange={(e) => setTextareaValue(e.target.value)}
              rows={4}
            />
            <Text size="sm" color="muted">
              {textareaValue.length}/1000 자
            </Text>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date-input">날짜 입력</Label>
            <Input
              id="date-input"
              type="date"
              defaultValue="2024-01-30"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="number-input">작업 인원</Label>
            <Input
              id="number-input"
              type="number"
              placeholder="0"
              min="0"
              max="999"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="select-demo">작업 구분</Label>
            <Select
              value={selectValue}
              onValueChange={setSelectValue}
            >
              <SelectTrigger id="select-demo">
                <SelectValue placeholder="작업 구분을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="foundation">기초 공사</SelectItem>
                <SelectItem value="structure">구조물 공사</SelectItem>
                <SelectItem value="finishing">마감 공사</SelectItem>
                <SelectItem value="electrical">전기 공사</SelectItem>
                <SelectItem value="plumbing">배관 공사</SelectItem>
                <SelectItem value="landscaping">조경 공사</SelectItem>
              </SelectContent>
            </Select>
            <Text size="sm" color="muted">선택값: {selectValue || "없음"}</Text>
          </div>

          <div className="space-y-2">
            <Label htmlFor="select-workers">작업팀 선택</Label>
            <Select
              defaultValue="team1"
            >
              <SelectTrigger id="select-workers">
                <SelectValue placeholder="작업팀을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="team1">A팀 - 철근 전문</SelectItem>
                <SelectItem value="team2">B팀 - 콘크리트 전문</SelectItem>
                <SelectItem value="team3">C팀 - 마감 전문</SelectItem>
                <SelectItem value="team4">D팀 - 전기/설비</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="select-priority">우선순위</Label>
            <Select
              disabled
            >
              <SelectTrigger id="select-priority" disabled>
                <SelectValue placeholder="비활성화된 선택 박스" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">높음</SelectItem>
                <SelectItem value="medium">보통</SelectItem>
                <SelectItem value="low">낮음</SelectItem>
              </SelectContent>
            </Select>
            <Text size="sm" color="muted">disabled 상태 예시</Text>
          </div>
        </div>
      </section>

      <Separator />

      {/* Custom Dropdown Section */}
      <section className="space-y-6">
        <Heading variant="h2">커스텀 드롭다운</Heading>
        <Text size="sm" color="muted">완전한 스타일 제어가 가능한 커스텀 드롭다운</Text>
        
        <div className="max-w-2xl space-y-6">
          <div className="space-y-2">
            <Label>작업 구분 (커스텀)</Label>
            <Dropdown
              options={workTypeOptions.filter(opt => opt.value !== "")}
              value={dropdownValue}
              onChange={setDropdownValue}
              placeholder="작업 구분을 선택하세요"
            />
            <Text size="sm" color="muted">선택값: {dropdownValue || "없음"}</Text>
          </div>

          <div className="space-y-2">
            <Label>작업팀 선택 (기본값 있음)</Label>
            <Dropdown
              options={[
                { value: "team1", label: "A팀 - 철근 전문" },
                { value: "team2", label: "B팀 - 콘크리트 전문" },
                { value: "team3", label: "C팀 - 마감 전문" },
                { value: "team4", label: "D팀 - 전기/설비" }
              ]}
              value="team1"
              placeholder="팀을 선택하세요"
            />
          </div>

          <div className="space-y-2">
            <Label>비활성화된 드롭다운</Label>
            <Dropdown
              options={[
                { value: "high", label: "높음" },
                { value: "medium", label: "보통" },
                { value: "low", label: "낮음" }
              ]}
              placeholder="비활성화됨"
              disabled
            />
          </div>
        </div>
      </section>

      <Separator />

      {/* Badges Section */}
      <section className="space-y-6">
        <Heading variant="h2">배지</Heading>
        
        <div className="flex flex-wrap gap-3">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="error">Error</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>

        <div className="flex flex-wrap gap-3">
          <Badge variant="success">
            <CheckCircle className="mr-1 h-3 w-3" />
            승인됨
          </Badge>
          <Badge variant="warning">
            <AlertCircle className="mr-1 h-3 w-3" />
            검토 중
          </Badge>
          <Badge variant="error">
            <XCircle className="mr-1 h-3 w-3" />
            반려됨
          </Badge>
        </div>
      </section>

      <Separator />

      {/* Skeleton Section */}
      <section className="space-y-6">
        <Heading variant="h2">스켈레톤 (로딩 상태)</Heading>
        
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-5/6" />
            </CardContent>
            <CardFooter className="gap-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </CardFooter>
          </Card>

          <div className="space-y-2">
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
        </div>
      </section>

      <Separator />

      {/* Color Palette Section */}
      <section className="space-y-6">
        <Heading variant="h2">색상 팔레트</Heading>
        
        <div className="space-y-4">
          <div>
            <Text size="sm" color="muted" className="mb-2">Toss Blue</Text>
            <div className="flex gap-2 flex-wrap">
              <div className="w-20 h-20 bg-toss-blue-50 rounded-lg flex items-center justify-center border border-toss-gray-200 dark:border-toss-gray-700">
                <Text size="xs" className="text-toss-gray-700">50</Text>
              </div>
              <div className="w-20 h-20 bg-toss-blue-100 rounded-lg flex items-center justify-center border border-toss-gray-200 dark:border-toss-gray-700">
                <Text size="xs" className="text-toss-gray-700">100</Text>
              </div>
              <div className="w-20 h-20 bg-toss-blue-500 rounded-lg flex items-center justify-center">
                <Text size="xs" className="text-white">500</Text>
              </div>
              <div className="w-20 h-20 bg-toss-blue-600 rounded-lg flex items-center justify-center">
                <Text size="xs" className="text-white">600</Text>
              </div>
              <div className="w-20 h-20 bg-toss-blue-900 rounded-lg flex items-center justify-center">
                <Text size="xs" className="text-white">900</Text>
              </div>
            </div>
          </div>

          <div>
            <Text size="sm" color="muted" className="mb-2">Toss Gray</Text>
            <div className="flex gap-2 flex-wrap">
              <div className="w-20 h-20 bg-toss-gray-100 rounded-lg flex items-center justify-center border border-toss-gray-200 dark:border-toss-gray-700">
                <Text size="xs" className="text-toss-gray-700">100</Text>
              </div>
              <div className="w-20 h-20 bg-toss-gray-200 rounded-lg flex items-center justify-center border border-toss-gray-300 dark:border-toss-gray-700">
                <Text size="xs" className="text-toss-gray-700">200</Text>
              </div>
              <div className="w-20 h-20 bg-toss-gray-500 rounded-lg flex items-center justify-center">
                <Text size="xs" className="text-white">500</Text>
              </div>
              <div className="w-20 h-20 bg-toss-gray-900 rounded-lg flex items-center justify-center">
                <Text size="xs" className="text-white">900</Text>
              </div>
            </div>
          </div>

          <div>
            <Text size="sm" color="muted" className="mb-2">상태 색상</Text>
            <div className="flex gap-2">
              <div className="w-20 h-20 bg-green-500 rounded-lg flex items-center justify-center text-white">
                <Text size="xs" className="text-white">Success</Text>
              </div>
              <div className="w-20 h-20 bg-orange-500 rounded-lg flex items-center justify-center text-white">
                <Text size="xs" className="text-white">Warning</Text>
              </div>
              <div className="w-20 h-20 bg-red-500 rounded-lg flex items-center justify-center text-white">
                <Text size="xs" className="text-white">Error</Text>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Container>
    </div>

    {/* Footer Section Demo */}
    <section className="mt-20 space-y-8">
      <Container>
        <Separator className="mb-8" />
        <Heading variant="h2">푸터</Heading>
        <Text size="sm" color="muted" className="mb-8">전체 푸터와 심플 푸터 스타일</Text>
      </Container>

      {/* Full Footer Demo */}
      <div className="border-t">
        <Footer 
          sections={footerSections}
          bottomLinks={footerBottomLinks}
          copyright="© 2024 건설일지. All rights reserved."
        />
      </div>

      {/* Simple Footer Demo */}
      <Container>
        <Text size="sm" color="muted" className="mb-4">심플 푸터 스타일</Text>
      </Container>
      <div className="border rounded-lg overflow-hidden">
        <SimpleFooter />
      </div>
    </section>
      </div>
    </NavigationController>
  )
}