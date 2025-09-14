'use client'

import { useState } from 'react'
import { 
  Home, FileText, Calendar, Users, BarChart, 
  FileImage, FolderOpen, CheckCircle, AlertCircle, 
  XCircle, Settings, Menu
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

export default function ComponentsPage() {
  const [inputValue, setInputValue] = useState("")
  const [textareaValue, setTextareaValue] = useState("")
  const [selectValue, setSelectValue] = useState("")

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 space-y-12">
        {/* Page Header */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">UI 컴포넌트 데모</h1>
              <p className="text-lg text-gray-600">
                건설 작업일지 UI 컴포넌트
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Typography Section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">타이포그래피</h2>
          <div className="space-y-4">
            <h1 className="text-4xl font-bold">제목 1 (h1) - 페이지 대제목</h1>
            <h2 className="text-3xl font-semibold">제목 2 (h2) - 섹션 제목</h2>
            <h3 className="text-2xl font-medium">제목 3 (h3) - 카드 제목</h3>
            <h4 className="text-xl font-medium">제목 4 (h4) - 부제목</h4>
            
            <div className="space-y-2 mt-4">
              <p className="text-3xl font-bold">3xl 텍스트 - 대시보드 수치</p>
              <p className="text-2xl">2xl 텍스트 - 페이지 제목</p>
              <p className="text-xl">xl 텍스트 - 섹션 제목</p>
              <p className="text-lg">lg 텍스트 - 부제목</p>
              <p className="text-base">base 텍스트 - 본문 (모바일 최적)</p>
              <p className="text-sm text-gray-600">sm 텍스트 - 캡션, 메타 정보</p>
              <p className="text-xs text-gray-600">xs 텍스트 - 보조 텍스트</p>
            </div>

            <div className="space-y-2 mt-4">
              <p className="text-blue-600">Primary 색상 텍스트</p>
              <p className="text-green-600">Success 색상 텍스트</p>
              <p className="text-orange-600">Warning 색상 텍스트</p>
              <p className="text-red-600">Error 색상 텍스트</p>
              <p className="text-gray-600">Muted 색상 텍스트</p>
            </div>
          </div>
        </section>

        <Separator />

        {/* Buttons Section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">버튼</h2>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">버튼 변형</p>
              <div className="flex flex-wrap gap-3">
                <Button variant="default">Primary Button</Button>
                <Button variant="secondary">Secondary Button</Button>
                <Button variant="destructive">Danger Button</Button>
                <Button variant="ghost">Ghost Button</Button>
                <Button variant="outline">Outline Button</Button>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-2">버튼 크기</p>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large</Button>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-2">버튼 상태</p>
              <div className="flex flex-wrap gap-3">
                <Button disabled>Disabled</Button>
                <Button className="w-full">Full Width Button</Button>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-2">아이콘 버튼</p>
              <div className="flex flex-wrap gap-3">
                <Button size="sm">
                  <Home className="mr-2 h-4 w-4" />
                  홈으로
                </Button>
                <Button variant="secondary">
                  <Settings className="mr-2 h-4 w-4" />
                  설정
                </Button>
                <Button variant="ghost" size="sm">
                  <Menu className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        <Separator />

        {/* Cards Section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">카드</h2>
          
          <div className="p-8 -mx-8 bg-gray-100 rounded-2xl">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>작업일지 카드</CardTitle>
                  <CardDescription>2024년 1월 30일</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>1층 철근 배근 작업을 완료했습니다. 총 12명의 작업자가 참여했습니다.</p>
                </CardContent>
                <CardFooter className="gap-2">
                  <Badge variant="secondary" className="bg-green-100 text-green-800">완료</Badge>
                  <Badge variant="secondary">12명</Badge>
                </CardFooter>
              </Card>

              <Card className="cursor-pointer hover:-translate-y-1 transition-transform">
                <CardHeader>
                  <CardTitle>인터랙티브 카드</CardTitle>
                  <CardDescription>클릭 가능한 카드</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>호버 시 상승 효과가 있는 카드입니다.</p>
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
                      <p className="text-sm">작업 완료</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                      <p className="text-sm">검토 필요</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <p className="text-sm">문제 발생</p>
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
          <h2 className="text-2xl font-semibold">폼 요소</h2>
          
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
              <p className="text-sm text-gray-600">입력값: {inputValue || "없음"}</p>
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
              <p className="text-sm text-gray-600">
                {textareaValue.length}/1000 자
              </p>
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
              <p className="text-sm text-gray-600">선택값: {selectValue || "없음"}</p>
            </div>
          </div>
        </section>

        <Separator />

        {/* Badges Section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">배지</h2>
          
          <div className="flex flex-wrap gap-3">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="destructive">Error</Badge>
            <Badge variant="outline">Outline</Badge>
          </div>

          <div className="flex flex-wrap gap-3">
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <CheckCircle className="mr-1 h-3 w-3" />
              승인됨
            </Badge>
            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
              <AlertCircle className="mr-1 h-3 w-3" />
              검토 중
            </Badge>
            <Badge variant="destructive">
              <XCircle className="mr-1 h-3 w-3" />
              반려됨
            </Badge>
          </div>
        </section>
      </div>
    </div>
  )
}