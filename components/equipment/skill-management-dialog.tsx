'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/custom-select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { useFontSize, getTypographyClass } from '@/contexts/FontSizeContext'
import { useTouchMode } from '@/contexts/TouchModeContext'
import { Settings, Plus, Trash2, Award, DollarSign, Calendar } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { upsertWorkerSkillAssignment } from '@/app/actions/equipment'
import { WorkerSkill, WorkerSkillAssignment } from '@/types/equipment'

interface SkillManagementDialogProps {
  worker: any
  skills: WorkerSkill[]
  skillAssignments: WorkerSkillAssignment[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function SkillManagementDialog({
  worker,
  skills,
  skillAssignments,
  open,
  onOpenChange,
  onSuccess
}: SkillManagementDialogProps) {
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()
  const { toast } = useToast()
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingSkill, setEditingSkill] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    skill_id: '',
    proficiency_level: 'beginner' as 'beginner' | 'intermediate' | 'advanced' | 'expert',
    certified: false,
    certification_date: '',
    certification_expiry: '',
    hourly_rate: 0,
    overtime_rate: 0
  })

  const availableSkills = skills.filter(skill => 
    !skillAssignments.some(sa => sa.skill_id === skill.id)
  )

  const handleAddSkill = () => {
    setEditingSkill('new')
    setFormData({
      skill_id: '',
      proficiency_level: 'beginner',
      certified: false,
      certification_date: '',
      certification_expiry: '',
      hourly_rate: 20000, // Default hourly rate
      overtime_rate: 30000
    })
  }

  const handleEditSkill = (skillAssignment: WorkerSkillAssignment) => {
    setEditingSkill(skillAssignment.id)
    setFormData({
      skill_id: skillAssignment.skill_id,
      proficiency_level: skillAssignment.proficiency_level,
      certified: skillAssignment.certified,
      certification_date: skillAssignment.certification_date || '',
      certification_expiry: skillAssignment.certification_expiry || '',
      hourly_rate: skillAssignment.hourly_rate || 20000,
      overtime_rate: skillAssignment.overtime_rate || 30000
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!worker || !formData.skill_id) {
      toast({
        title: '입력 오류',
        description: '기술을 선택해주세요.',
        variant: 'destructive'
      })
      return
    }

    setIsSubmitting(true)
    try {
      const result = await upsertWorkerSkillAssignment({
        worker_id: worker.id,
        skill_id: formData.skill_id,
        proficiency_level: formData.proficiency_level,
        certified: formData.certified,
        certification_date: formData.certification_date || undefined,
        certification_expiry: formData.certification_expiry || undefined,
        hourly_rate: formData.hourly_rate,
        overtime_rate: formData.overtime_rate
      })

      if (result.success) {
        const skill = skills.find(s => s.id === formData.skill_id)
        toast({
          title: '기술 관리 완료',
          description: `${skill?.name} 기술이 성공적으로 ${editingSkill === 'new' ? '추가' : '수정'}되었습니다.`
        })
        onSuccess()
        setEditingSkill(null)
        resetForm()
      } else {
        throw new Error(result.error)
      }
    } catch (error: unknown) {
      toast({
        title: '기술 관리 실패',
        description: error.message || '기술 관리에 실패했습니다.',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      skill_id: '',
      proficiency_level: 'beginner',
      certified: false,
      certification_date: '',
      certification_expiry: '',
      hourly_rate: 20000,
      overtime_rate: 30000
    })
  }

  const handleCancel = () => {
    setEditingSkill(null)
    resetForm()
  }

  const getButtonSize = () => {
    if (touchMode === 'glove') return 'field'
    if (touchMode === 'precision') return 'compact'
    return isLargeFont ? 'standard' : 'compact'
  }

  const getProficiencyColor = (level: string) => {
    switch (level) {
      case 'expert': return 'bg-purple-100 text-purple-800'
      case 'advanced': return 'bg-blue-100 text-blue-800'
      case 'intermediate': return 'bg-green-100 text-green-800'
      case 'beginner': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getProficiencyText = (level: string) => {
    switch (level) {
      case 'expert': return '전문가'
      case 'advanced': return '고급'
      case 'intermediate': return '중급'
      case 'beginner': return '초급'
      default: return level
    }
  }


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>
            기술 관리: {worker?.full_name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="px-6 py-4 space-y-6 flex-1 overflow-auto">
            {/* Current Skills */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className={`font-medium ${getTypographyClass('large', isLargeFont)}`}>
                  보유 기술 목록
                </h3>
                <Button 
                  size={getButtonSize()}
                  onClick={handleAddSkill}
                  disabled={availableSkills.length === 0}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  기술 추가
                </Button>
              </div>

            {skillAssignments.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {skillAssignments.map(skillAssignment => {
                  const skill = skills.find(s => s.id === skillAssignment.skill_id)
                  if (!skill) return null

                  return (
                    <div key={skillAssignment.id} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className={`font-medium ${getTypographyClass('base', isLargeFont)}`}>
                            {skill.name}
                          </h4>
                          {skill.category && (
                            <p className={`${getTypographyClass('small', isLargeFont)} text-gray-600`}>
                              분류: {skill.category}
                            </p>
                          )}
                        </div>
                        <Button
                          size="compact"
                          variant="outline"
                          onClick={() => handleEditSkill(skillAssignment)}
                        >
                          수정
                        </Button>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Badge className={getProficiencyColor(skillAssignment.proficiency_level)}>
                          {getProficiencyText(skillAssignment.proficiency_level)}
                        </Badge>
                        {skillAssignment.certified && (
                          <Badge variant="secondary" className="gap-1">
                            <Award className="h-3 w-3" />
                            인증
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className={`${getTypographyClass('small', isLargeFont)} text-gray-600`}>기본 시급</p>
                          <p className={`font-semibold ${getTypographyClass('base', isLargeFont)} text-green-600`}>
                            ₩{skillAssignment.hourly_rate?.toLocaleString()}/시간
                          </p>
                        </div>
                        <div>
                          <p className={`${getTypographyClass('small', isLargeFont)} text-gray-600`}>연장 시급</p>
                          <p className={`font-semibold ${getTypographyClass('base', isLargeFont)} text-amber-600`}>
                            ₩{skillAssignment.overtime_rate?.toLocaleString()}/시간
                          </p>
                        </div>
                      </div>

                      {skillAssignment.certification_date && (
                        <div>
                          <p className={`${getTypographyClass('small', isLargeFont)} text-gray-600`}>
                            인증일: {new Date(skillAssignment.certification_date).toLocaleDateString()}
                            {skillAssignment.certification_expiry && (
                              <span className="ml-2">
                                만료일: {new Date(skillAssignment.certification_expiry).toLocaleDateString()}
                              </span>
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Settings className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className={`${getTypographyClass('base', isLargeFont)} text-gray-500`}>
                  아직 할당된 기술이 없습니다.
                </p>
              </div>
            )}
          </div>

            {/* Add/Edit Skill Form */}
            {editingSkill && (
              <div className="border-t pt-6">
              <h3 className={`font-medium ${getTypographyClass('large', isLargeFont)} mb-4`}>
                {editingSkill === 'new' ? '새 기술 추가' : '기술 수정'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Skill Selection */}
                <div className="space-y-2">
                  <Label className={getTypographyClass('base', isLargeFont)}>
                    기술 선택 <span className="text-red-500">*</span>
                  </Label>
                  <Select 
                    value={formData.skill_id} 
                    onValueChange={(value) => setFormData({...formData, skill_id: value})}
                    disabled={editingSkill !== 'new'}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="기술을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {(editingSkill === 'new' ? availableSkills : skills).map(skill => (
                        <SelectItem key={skill.id} value={skill.id}>
                          {skill.name} {skill.category && `(${skill.category})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Proficiency Level */}
                <div className="space-y-2">
                  <Label className={getTypographyClass('base', isLargeFont)}>
                    숙련도 <span className="text-red-500">*</span>
                  </Label>
                  <Select 
                    value={formData.proficiency_level} 
                    onValueChange={(value: any) => setFormData({...formData, proficiency_level: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">초급</SelectItem>
                      <SelectItem value="intermediate">중급</SelectItem>
                      <SelectItem value="advanced">고급</SelectItem>
                      <SelectItem value="expert">전문가</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Hourly Rates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className={getTypographyClass('base', isLargeFont)}>
                      기본 시급 (원/시간) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="number"
                      value={formData.hourly_rate}
                      onChange={(e) => setFormData({...formData, hourly_rate: Number(e.target.value)})}
                      min="0"
                      step="1000"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className={getTypographyClass('base', isLargeFont)}>
                      연장 시급 (원/시간) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="number"
                      value={formData.overtime_rate}
                      onChange={(e) => setFormData({...formData, overtime_rate: Number(e.target.value)})}
                      min="0"
                      step="1000"
                      required
                    />
                  </div>
                </div>

                {/* Certification */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.certified}
                      onCheckedChange={(checked) => setFormData({...formData, certified: checked})}
                    />
                    <Label className={getTypographyClass('base', isLargeFont)}>
                      인증 보유
                    </Label>
                  </div>

                  {formData.certified && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                      <div className="space-y-2">
                        <Label className={getTypographyClass('base', isLargeFont)}>
                          인증 취득일
                        </Label>
                        <Input
                          type="date"
                          value={formData.certification_date}
                          onChange={(e) => setFormData({...formData, certification_date: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className={getTypographyClass('base', isLargeFont)}>
                          인증 만료일
                        </Label>
                        <Input
                          type="date"
                          value={formData.certification_expiry}
                          onChange={(e) => setFormData({...formData, certification_expiry: e.target.value})}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    size={getButtonSize()}
                    onClick={handleCancel}
                    disabled={isSubmitting}
                  >
                    취소
                  </Button>
                  <Button
                    type="submit"
                    size={getButtonSize()}
                    disabled={isSubmitting || !formData.skill_id}
                    className="gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Settings className="h-4 w-4 animate-spin" />
                        저장 중...
                      </>
                    ) : (
                      <>
                        <Settings className="h-4 w-4" />
                        {editingSkill === 'new' ? '기술 추가' : '수정 완료'}
                      </>
                    )}
                  </Button>
                </div>
              </form>
              </div>
            )}

            {availableSkills.length === 0 && !editingSkill && (
              <div className="text-center py-4">
                <p className={`${getTypographyClass('base', isLargeFont)} text-gray-500`}>
                  모든 기술이 이미 할당되었습니다.
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}