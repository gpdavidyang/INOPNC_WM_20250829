import { WorkReportPDF } from '@/components/pdf/WorkReportPDF'
import { getUnifiedDailyReportForAdmin } from '@/lib/daily-reports/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { pdf } from '@react-pdf/renderer'
import { NextRequest, NextResponse } from 'next/server'
import { createElement } from 'react'

// Need to allow dynamic for Node.js stream handling
// Force Node.js runtime for font loading (fs/path access)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    let body
    try {
      body = await req.json()
    } catch (e) {
      console.error('Json Parse Error:', e)
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }
    const { reportId } = body
    console.log('[WorkReport] Generating for ID:', reportId)

    // 1. Fetch Unified Daily Report Data
    const report = await getUnifiedDailyReportForAdmin(reportId)

    if (!report) {
      console.error('Report not found for ID:', reportId)
      return NextResponse.json({ error: 'Daily Report not found' }, { status: 404 })
    }

    // 2. Prepare Data for PDF
    // Helper to get signed URL for storage items
    const getSignedUrl = async (url: string) => {
      if (!url) return ''
      try {
        let bucket = ''
        let path = ''

        if (url.startsWith('http')) {
          try {
            const urlObj = new URL(url)
            const parts = urlObj.pathname.split('/')
            const objIndex = parts.indexOf('object')
            if (objIndex !== -1 && parts.length > objIndex + 2) {
              bucket = parts[objIndex + 2]
              path = parts.slice(objIndex + 3).join('/')
              path = decodeURIComponent(path)
            }
          } catch (e) {
            console.error('URL parse error:', e)
          }
        }

        if (!bucket && !path && !url.startsWith('http')) {
          const parts = url.split('/')
          if (parts.length > 1) {
            bucket = parts[0]
            path = parts.slice(1).join('/')
          }
        }

        if (bucket && path) {
          const supabase = createServiceRoleClient()
          const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60)
          if (data?.signedUrl) {
            return data.signedUrl
          }
        }
        return url
      } catch (e) {
        return url
      }
    }

    const drawings = await Promise.all(
      (report.attachments?.drawings || []).map(async (d: any) => {
        try {
          return await getSignedUrl(d.url || d.file_url)
        } catch (e) {
          return d.url || d.file_url
        }
      })
    )

    // Merge standard photos and additional photos
    const allPhotos = [...(report.attachments?.photos || []), ...(report.additionalPhotos || [])]

    const photos = await Promise.all(
      allPhotos.map(async (d: any) => {
        try {
          // additionalPhotos use 'url', attachments use 'file_url' or 'url'
          return await getSignedUrl(d.url || d.file_url)
        } catch (e) {
          return d.url || d.file_url
        }
      })
    )

    console.log('[WorkReport] Signed URLs:', {
      drawingsCount: drawings.length,
      photosCount: photos.length,
    })

    const pdfData = {
      siteName: report.siteName || 'Unknown Site',
      workDate: report.workDate,
      author: report.authorName || report.author?.full_name || 'Unknown',
      location: [report.location?.block, report.location?.dong, report.location?.unit]
        .filter(Boolean)
        .join(' '),
      workProcess: report.workProcesses?.join(', ') || '',
      workType: report.workTypes?.join(', ') || '',
      manHours: report.workerStatistics?.total_hours || 0,
      workers: (report.workers || []).map((w: any) => ({
        name: w.workerName || w.name || 'Unknown',
        hours: w.hours || 0,
      })),
      materials: (report.materials || []).map((m: any) => ({
        name: m.materialName || m.name || 'Unknown',
        quantity: m.quantity || 0,
        unit: m.unit || 'EA',
      })),
      drawings,
      photos,
    }

    // 3. Render PDF to Buffer
    // Use pdf() directly to get buffer, avoiding stream complexity
    const blob = await pdf(createElement(WorkReportPDF, { data: pdfData as any })).toBlob()
    const arrayBuffer = await blob.arrayBuffer()
    const pdfBuffer = Buffer.from(arrayBuffer)

    // 4. Upload to Supabase Storage
    const fileName = `${reportId}_${Date.now()}.pdf`
    const serviceRoleSupabase = createServiceRoleClient()
    const { data: uploadData, error: uploadError } = await serviceRoleSupabase.storage
      .from('work_reports')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (uploadError) {
      console.error('Storage Upload Error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload generated PDF' }, { status: 500 })
    }

    // 5. Get Public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('work_reports').getPublicUrl(fileName)

    // 6. Save Record to Database (Bypass RLS using Service Role)
    const { data: user } = await supabase.auth.getUser()

    const { error: dbInsertError } = await serviceRoleSupabase.from('work_reports').upsert(
      {
        daily_report_id: reportId,
        file_url: publicUrl,
        created_by: user.user?.id,
        metadata: pdfData,
      },
      { onConflict: 'daily_report_id' }
    )

    if (dbInsertError) {
      console.error('Work Report DB Insert Error:', dbInsertError)
      return NextResponse.json(
        { error: 'Failed to save work report record: ' + dbInsertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, url: publicUrl })
  } catch (error) {
    console.error('Server Error generating report:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
