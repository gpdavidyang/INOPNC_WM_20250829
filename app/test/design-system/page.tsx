'use client'

import React from 'react'
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Chip,
  ChipGroup,
  Input,
  Field,
  Search,
  Badge,
  NotificationBadge,
  LoadingSpinner,
  LoadingSkeleton,
  Container,
  Stack,
  Row,
  Grid,
} from '@/modules/shared/ui'

export default function TestDesignSystemPage() {
  const [searchValue, setSearchValue] = React.useState('')
  const [notificationCount, setNotificationCount] = React.useState(3)

  const searchSuggestions = [
    { id: '1', label: '현장 관리', value: 'site-management' },
    { id: '2', label: '작업자 배정', value: 'worker-assignment' },
    { id: '3', label: '자재 관리', value: 'material-management' },
  ]

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <header
        style={{
          height: '56px',
          background: 'var(--card)',
          borderBottom: '1px solid var(--line)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
        }}
      >
        <div className="brand-title">INOPNC WM</div>
        <div className="ml-auto relative">
          <Button variant="ghost" className="relative">
            🔔
            <NotificationBadge
              count={notificationCount}
              pulse={notificationCount > 0}
              className="absolute -top-1 -right-1"
            />
          </Button>
        </div>
      </header>

      <main style={{ paddingTop: '76px' }}>
        <Container>
          <Stack gap="lg">
            <div>
              <h1 className="t-title mb-2">디자인 시스템 테스트</h1>
              <p className="t-cap">INOPNC WM 디자인 시스템의 모든 컴포넌트를 확인할 수 있습니다.</p>
            </div>

            {/* Buttons Section */}
            <Card>
              <CardHeader>
                <CardTitle>버튼 컴포넌트</CardTitle>
              </CardHeader>
              <CardContent>
                <Stack gap="md">
                  <Row gap="sm">
                    <Button>기본</Button>
                    <Button variant="primary">주요</Button>
                    <Button variant="gray">회색</Button>
                    <Button variant="sky">하늘색</Button>
                    <Button variant="outline">외곽선</Button>
                    <Button variant="ghost">투명</Button>
                    <Button variant="danger">위험</Button>
                  </Row>
                  <Row gap="sm">
                    <Button loading>로딩</Button>
                    <Button disabled>비활성</Button>
                    <Button ripple variant="primary">
                      리플 효과
                    </Button>
                  </Row>
                </Stack>
              </CardContent>
            </Card>

            {/* Chips Section */}
            <Card>
              <CardHeader>
                <CardTitle>칩 컴포넌트</CardTitle>
              </CardHeader>
              <CardContent>
                <Stack gap="md">
                  <ChipGroup>
                    <Chip>기본</Chip>
                    <Chip active>선택됨</Chip>
                    <Chip variant="tag1">태그1</Chip>
                    <Chip variant="tag3">태그3</Chip>
                    <Chip variant="tag4">태그4</Chip>
                    <Chip onRemove={() => console.log('removed')}>제거 가능</Chip>
                  </ChipGroup>
                </Stack>
              </CardContent>
            </Card>

            {/* Input Section */}
            <Card>
              <CardHeader>
                <CardTitle>입력 컴포넌트</CardTitle>
              </CardHeader>
              <CardContent>
                <Grid cols={2} gap="lg">
                  <Stack gap="md">
                    <Input placeholder="기본 입력" />
                    <Field label="이메일">
                      <input type="email" />
                    </Field>
                    <Field label="비밀번호">
                      <input type="password" />
                    </Field>
                  </Stack>
                  <Stack gap="md">
                    <Search
                      placeholder="검색..."
                      value={searchValue}
                      onChange={e => setSearchValue(e.target.value)}
                      suggestions={searchSuggestions}
                      onSuggestionSelect={suggestion => {
                        setSearchValue(suggestion.label)
                        console.log('Selected:', suggestion)
                      }}
                    />
                  </Stack>
                </Grid>
              </CardContent>
            </Card>

            {/* Badges Section */}
            <Card>
              <CardHeader>
                <CardTitle>뱃지 컴포넌트</CardTitle>
              </CardHeader>
              <CardContent>
                <Row gap="lg" align="center">
                  <Stack gap="sm">
                    <div className="t-cap">상태 뱃지</div>
                    <Row gap="sm" align="center">
                      <Badge variant="tag1" />
                      <Badge variant="tag2" />
                      <Badge variant="tag3" />
                      <Badge variant="tag4" />
                    </Row>
                  </Stack>
                  <Stack gap="sm">
                    <div className="t-cap">알림 뱃지</div>
                    <Row gap="sm" align="center">
                      <div className="relative inline-block">
                        <Button variant="ghost">메시지</Button>
                        <NotificationBadge count={5} />
                      </div>
                      <div className="relative inline-block">
                        <Button variant="ghost">알림</Button>
                        <NotificationBadge count={99} pulse />
                      </div>
                    </Row>
                  </Stack>
                </Row>
              </CardContent>
            </Card>

            {/* Loading Section */}
            <Card>
              <CardHeader>
                <CardTitle>로딩 컴포넌트</CardTitle>
              </CardHeader>
              <CardContent>
                <Stack gap="md">
                  <Row gap="lg" align="center">
                    <Stack gap="sm">
                      <div className="t-cap">스피너</div>
                      <Row gap="sm" align="center">
                        <LoadingSpinner size="sm" />
                        <LoadingSpinner size="md" />
                        <LoadingSpinner size="lg" />
                      </Row>
                    </Stack>
                  </Row>
                  <Stack gap="sm">
                    <div className="t-cap">스켈레톤</div>
                    <Stack gap="sm">
                      <LoadingSkeleton width="60%" height="20px" />
                      <LoadingSkeleton width="80%" height="16px" />
                      <LoadingSkeleton width="40%" height="16px" />
                    </Stack>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            {/* Layout Section */}
            <Card>
              <CardHeader>
                <CardTitle>레이아웃 컴포넌트</CardTitle>
              </CardHeader>
              <CardContent>
                <Stack gap="md">
                  <div>
                    <div className="t-cap mb-2">그리드 레이아웃</div>
                    <Grid cols={3} gap="sm">
                      <div className="card p-4 text-center">1</div>
                      <div className="card p-4 text-center">2</div>
                      <div className="card p-4 text-center">3</div>
                    </Grid>
                  </div>
                  <div>
                    <div className="t-cap mb-2">행 레이아웃</div>
                    <Row justify="between" className="card p-4">
                      <div>시작</div>
                      <div>중간</div>
                      <div>끝</div>
                    </Row>
                  </div>
                </Stack>
              </CardContent>
            </Card>

            {/* Interactive Demo */}
            <Card>
              <CardHeader>
                <CardTitle>인터랙티브 데모</CardTitle>
              </CardHeader>
              <CardContent>
                <Row gap="md">
                  <Button variant="primary" onClick={() => setNotificationCount(prev => prev + 1)}>
                    알림 추가 ({notificationCount})
                  </Button>
                  <Button variant="outline" onClick={() => setNotificationCount(0)}>
                    알림 초기화
                  </Button>
                </Row>
              </CardContent>
            </Card>
          </Stack>
        </Container>
      </main>
    </div>
  )
}
