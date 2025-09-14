'use client'


interface ShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onShare: (permissions: unknown) => void
  currentPermissions?: unknown
}

export function ShareDialog({ open, onOpenChange, onShare, currentPermissions }: ShareDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>도면 공유</DialogTitle>
          <DialogDescription>
            마킹 도면을 다른 사용자와 공유합니다.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-gray-500">공유 기능은 추후 구현 예정입니다.</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}