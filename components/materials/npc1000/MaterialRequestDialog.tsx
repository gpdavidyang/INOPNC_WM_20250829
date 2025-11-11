'use client'

import { getSessionUser } from '@/lib/supabase/session'
import {
  DEFAULT_MATERIAL_PRIORITY,
  MATERIAL_PRIORITY_OPTIONS,
  MaterialPriorityValue,
} from '@/lib/materials/priorities'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  siteId: string
  siteName?: string
  onSuccess?: () => void
}

export default function MaterialRequestDialog({
  open,
  onOpenChange,
  siteId,
  siteName,
  onSuccess,
}: Props) {
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()

  // State
  const [saving, setSaving] = useState(false)
  const [requestTitle, setRequestTitle] = useState('')
  const [requestNotes, setRequestNotes] = useState('')
  const [quantity, setQuantity] = useState('')
  const [urgency, setUrgency] = useState<MaterialPriorityValue>(DEFAULT_MATERIAL_PRIORITY)

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

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setRequestTitle('')
      setRequestNotes('')
      setQuantity('')
      setUrgency(DEFAULT_MATERIAL_PRIORITY)
    }
  }, [open])

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
        priority: urgency,
        notes: requestNotes || undefined,
      })

      if (result.success) {
        toast.success('NPC-1000 요청이 성공적으로 제출되었습니다.')
        onSuccess?.()
        onOpenChange(false)
        // Reset form
        setRequestTitle('')
        setRequestNotes('')
        setQuantity('')
        setUrgency(DEFAULT_MATERIAL_PRIORITY)
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className={getFullTypographyClass('heading', 'lg', isLargeFont)}>
            자재 요청
          </DialogTitle>
          {siteName && (
            <p
              className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-muted-foreground`}
            >
              현장: {siteName}
            </p>
          )}
        </DialogHeader>

        <div className="space-y-6">
          {/* Request Basic Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title" className={getFullTypographyClass('body', 'sm', isLargeFont)}>
                요청 제목 *
              </Label>
              <Input
                id="title"
                placeholder="예: 콘크리트 자재 긴급 요청"
                value={requestTitle}
                onChange={e => setRequestTitle(e.target.value)}
                className={getFullTypographyClass('body', 'sm', isLargeFont)}
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
                onChange={e => setRequestNotes(e.target.value)}
                rows={3}
                className={getFullTypographyClass('body', 'sm', isLargeFont)}
              />
            </div>
          </div>

          {/* NPC-1000 Request Section */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Package className={`${getIconSize()} text-blue-600`} />
              <h3 className={`${getFullTypographyClass('heading', 'sm', isLargeFont)} font-medium`}>
                NPC-1000
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className={getFullTypographyClass('body', 'sm', isLargeFont)}>수량 *</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    placeholder="0"
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                    className="flex-1"
                  />
                  <div className="flex items-center px-3 py-2 bg-gray-50 dark:bg-gray-800 border rounded-md">
                    <span
                      className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-muted-foreground`}
                    >
                      말
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <Label className={getFullTypographyClass('body', 'sm', isLargeFont)}>긴급도</Label>
                <Select
                  value={urgency}
                  onValueChange={(value: MaterialPriorityValue) => setUrgency(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MATERIAL_PRIORITY_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
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
            {saving ? '제출 중...' : '요청'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
