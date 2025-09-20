'use client'

import { getSessionUser } from '@/lib/supabase/session'

export default function MaterialRequestPage() {
  const router = useRouter()
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()
  
  // State
  const [saving, setSaving] = useState(false)
  const [requestTitle, setRequestTitle] = useState('')
  const [requestNotes, setRequestNotes] = useState('')
  const [quantity, setQuantity] = useState('')
  const [urgency, setUrgency] = useState<'normal' | 'urgent' | 'emergency'>('normal')
  const [siteId, setSiteId] = useState<string>('')
  const [siteName, setSiteName] = useState<string>('')

  // Touch-responsive sizing
  const getButtonSize = () => {
    if (touchMode === 'glove') return 'full'
    if (touchMode === 'precision') return 'compact'
    return 'standard'
  }

  const getIconSize = () => {
    if (touchMode === 'glove') return 'h-6 w-6'
    if (isLargeFont) return 'h-5 w-5'
    return 'h-4 w-4'
  }

  // Load current site info
  useEffect(() => {
    const loadSiteInfo = async () => {
      const result = await getCurrentUserSite()
      if (result.success && result.data) {
        setSiteId(result.data.site_id)
        setSiteName(result.data.site_name)
      }
    }
    loadSiteInfo()
  }, [])

  const submitRequest = async () => {
    if (!requestTitle.trim()) {
      toast.error('요청 제목을 입력해주세요.')
      return
    }

    if (!quantity) {
      toast.error('수량을 입력해주세요.')
      return
    }

    const quantityNum = parseFloat(quantity)
    if (isNaN(quantityNum) || quantityNum <= 0) {
      toast.error('올바른 수량을 입력해주세요.')
      return
    }

    setSaving(true)
    try {
      const supabase = createClient()
      
      // Get current user session
      if (!(await getSessionUser(supabase))) throw new Error('로그인이 필요합니다.')

      // Get NPC-1000 material ID from database
      const { data: npcMaterial } = await supabase
        .from('materials')
        .select('id')
        .like('code', 'NPC-1000')
        .single()

      if (!npcMaterial) {
        throw new Error('NPC-1000 자재를 찾을 수 없습니다.')
      }

      // Create single NPC-1000 request
      const result = await createMaterialRequest({
        siteId: siteId,
        materialCode: 'NPC-1000',
        requestedQuantity: quantityNum,
        requestDate: new Date().toISOString(),
        notes: `${urgency === 'emergency' ? '[긴급] ' : urgency === 'urgent' ? '[급함] ' : ''}${requestNotes || ''}`
      })

      if (result.success) {
        toast.success('NPC-1000 요청이 성공적으로 제출되었습니다.')
        router.back()
      } else {
        throw new Error(result.error || '요청 제출에 실패했습니다.')
      }
      
    } catch (error) {
      console.error('Error submitting request:', error)
      toast.error('요청 제출에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ArrowLeft className={getIconSize()} />
          </Button>
          <div>
            <h1 className={getFullTypographyClass('heading', 'xl', isLargeFont)}>
              NPC-1000 자재 요청
            </h1>
            {siteName && (
              <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-muted-foreground`}>
                현장: {siteName}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Request Basic Info */}
        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="title" className={getFullTypographyClass('body', 'sm', isLargeFont)}>
                요청 제목 *
              </Label>
              <Input
                id="title"
                placeholder="예: 콘크리트 자재 긴급 요청"
                value={requestTitle}
                onChange={(e) => setRequestTitle(e.target.value)}
                className={`mt-1 ${getFullTypographyClass('body', 'sm', isLargeFont)}`}
              />
            </div>
            
            <div>
              <Label htmlFor="notes" className={getFullTypographyClass('body', 'sm', isLargeFont)}>
                요청 사유
              </Label>
              <Textarea
                id="notes"
                placeholder="요청 배경이나 특별한 요구사항을 입력하세요"
                value={requestNotes}
                onChange={(e) => setRequestNotes(e.target.value)}
                rows={3}
                className={`mt-1 ${getFullTypographyClass('body', 'sm', isLargeFont)}`}
              />
            </div>
          </div>
        </Card>

        {/* NPC-1000 Request Section */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Package className={`${getIconSize()} text-blue-600`} />
            <h3 className={`${getFullTypographyClass('heading', 'sm', isLargeFont)} font-medium`}>
              NPC-1000 수량 정보
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className={getFullTypographyClass('body', 'sm', isLargeFont)}>
                수량 *
              </Label>
              <div className="flex gap-2 mt-1">
                <Input
                  type="number"
                  step="1"
                  min="0"
                  placeholder="0"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="flex-1"
                />
                <div className="flex items-center px-3 py-2 bg-gray-50 dark:bg-gray-800 border rounded-md">
                  <span className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-muted-foreground`}>
                    말
                  </span>
                </div>
              </div>
            </div>

            <div>
              <Label className={getFullTypographyClass('body', 'sm', isLargeFont)}>긴급도</Label>
              <Select value={urgency} onValueChange={(value: 'normal' | 'urgent' | 'emergency') => setUrgency(value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">보통</SelectItem>
                  <SelectItem value="urgent">급함</SelectItem>
                  <SelectItem value="emergency">긴급</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => router.back()}
            disabled={saving}
            size={getButtonSize()}
          >
            취소
          </Button>
          <Button
            onClick={submitRequest}
            disabled={saving || !requestTitle.trim() || !quantity}
            size={getButtonSize()}
          >
            {saving ? '제출 중...' : '요청 제출'}
          </Button>
        </div>
      </div>
    </div>
  )
}
