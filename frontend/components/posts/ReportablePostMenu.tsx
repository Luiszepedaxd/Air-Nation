'use client'

import { useState } from 'react'
import { PostMenu } from './PostInteractions'
import { ReportModal } from '@/components/ReportModal'
import type { ReportTargetType } from '@/lib/report-content'

export function ReportablePostMenu({
  canDelete,
  onDelete,
  canPin = false,
  isPinned = false,
  onPin,
  reporterId,
  targetType,
  targetId,
  targetLabel,
}: {
  canDelete: boolean
  onDelete: () => void
  canPin?: boolean
  isPinned?: boolean
  onPin?: () => void
  reporterId: string | null
  targetType: ReportTargetType
  targetId: string
  targetLabel: string
}) {
  const [reportOpen, setReportOpen] = useState(false)

  // Solo permitir reportar si hay reporter logueado y NO es contenido propio
  const canReport = !!reporterId

  return (
    <>
      <PostMenu
        canDelete={canDelete}
        onDelete={onDelete}
        canPin={canPin}
        isPinned={isPinned}
        onPin={onPin}
        canReport={canReport}
        onReport={() => setReportOpen(true)}
      />
      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        reporterId={reporterId}
        targetType={targetType}
        targetId={targetId}
        targetLabel={targetLabel}
      />
    </>
  )
}
