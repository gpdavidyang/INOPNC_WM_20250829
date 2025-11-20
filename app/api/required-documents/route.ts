import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const supabase = await createClient()

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', authResult.userId)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 403 })
    }

    const role = profile.role || authResult.role || ''

    // Get required documents for user's role
    const { data: requirements, error } = await supabase
      .from('required_document_types')
      .select(
        `
        id,
        code,
        name_ko,
        description,
        instructions,
        file_types,
        max_file_size,
        valid_duration_days,
        sort_order,
        role_mappings:required_documents_by_role(role_type,is_required)
      `
      )
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error fetching required documents:', error)
      // Fallback to hardcoded list if table doesn't exist
      const fallbackRequirements = [
        {
          id: 'pre-work-medical',
          requirement_name: '배치전 검진 서류',
          document_type: 'medical',
          description: '작업 배치 전 건강검진 결과서',
          is_mandatory: true,
          file_format_allowed: ['application/pdf', 'image/jpeg', 'image/png'],
          max_file_size_mb: 5,
          instructions: '최근 6개월 이내 건강검진 결과서를 제출하세요.',
        },
        {
          id: 'safety-education',
          requirement_name: '기초안전보건교육이수',
          document_type: 'certificate',
          description: '건설업 기초안전보건교육 이수증',
          is_mandatory: true,
          file_format_allowed: ['application/pdf', 'image/jpeg', 'image/png'],
          max_file_size_mb: 5,
          instructions: '최근 2년 이내 이수증만 유효합니다.',
        },
        {
          id: 'vehicle-insurance',
          requirement_name: '차량보험증',
          document_type: 'vehicle',
          description: '개인 차량 보험증명서',
          is_mandatory: true,
          file_format_allowed: ['application/pdf', 'image/jpeg', 'image/png'],
          max_file_size_mb: 5,
          instructions: '현재 유효한 보험증을 제출하세요.',
        },
        {
          id: 'vehicle-registration',
          requirement_name: '차량등록증',
          document_type: 'vehicle',
          description: '차량 등록증 사본',
          is_mandatory: true,
          file_format_allowed: ['application/pdf', 'image/jpeg', 'image/png'],
          max_file_size_mb: 5,
          instructions: '차량등록증 사본을 명확히 스캔하여 제출하세요.',
        },
        {
          id: 'bank-account',
          requirement_name: '통장사본',
          document_type: 'financial',
          description: '급여 입금용 통장 사본',
          is_mandatory: true,
          file_format_allowed: ['application/pdf', 'image/jpeg', 'image/png'],
          max_file_size_mb: 5,
          instructions: '본인 명의 통장 사본을 제출하세요.',
        },
        {
          id: 'id-card',
          requirement_name: '신분증',
          document_type: 'personal',
          description: '주민등록증 또는 운전면허증',
          is_mandatory: true,
          file_format_allowed: ['image/jpeg', 'image/png'],
          max_file_size_mb: 5,
          instructions: '신분증 앞뒤면을 모두 스캔하여 제출하세요.',
        },
      ]

      return NextResponse.json({
        success: true,
        data: fallbackRequirements,
        source: 'fallback',
      })
    }

    // Transform database data to match expected format
    const transformedData =
      requirements
        ?.filter((req: any) => {
          if (!req?.role_mappings || !Array.isArray(req.role_mappings)) return true
          return req.role_mappings.some(
            (mapping: any) => mapping.role_type === role && mapping.is_required
          )
        })
        .map((req: any) => ({
          id: req.id,
          requirement_name: req.name_ko || req.code,
          document_type: req.code,
          description: req.description,
          is_mandatory: true,
          file_format_allowed: req.file_types || ['application/pdf', 'image/jpeg', 'image/png'],
          max_file_size_mb: Math.round((req.max_file_size || 5 * 1024 * 1024) / 1024 / 1024),
          instructions: req.instructions,
          expiry_days: req.valid_duration_days,
        })) || []

    return NextResponse.json({
      success: true,
      data: transformedData,
      source: 'database',
    })
  } catch (error) {
    console.error('Error in required documents API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
