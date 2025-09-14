
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    
    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const siteId = searchParams.get('site_id')
    const includeStats = searchParams.get('include_stats') === 'true'

    // 카테고리 매핑 정보 조회
    const { data: categories, error: categoriesError } = await supabase
      .from('document_category_mapping')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')

    if (categoriesError) {
      console.error('Categories error:', categoriesError)
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
    }

    let categoryStats: Record<string, { total: number; active: number }> = {}
    
    if (includeStats) {
      // 카테고리별 문서 통계 조회
      let statsQuery = supabase
        .from('unified_document_system')
        .select('category_type, status')
        .eq('status', 'active')

      if (siteId) {
        statsQuery = statsQuery.eq('site_id', siteId)
      }

      const { data: statsData, error: statsError } = await statsQuery

      if (!statsError && statsData) {
        categoryStats = statsData.reduce((acc: Record<string, { total: number; active: number }>, doc: unknown) => {
          if (!acc[doc.category_type]) {
            acc[doc.category_type] = {
              total: 0,
              active: 0
            }
          }
          acc[doc.category_type].total += 1
          if (doc.status === 'active') {
            acc[doc.category_type].active += 1
          }
          return acc
        }, {})
      }
    }

    // 카테고리와 통계 결합
    const categoriesWithStats = categories?.map((category: unknown) => ({
      ...category,
      stats: categoryStats[category.category_type] || { total: 0, active: 0 }
    }))

    return NextResponse.json({
      success: true,
      data: categoriesWithStats,
      meta: {
        total_categories: categories?.length || 0,
        site_id: siteId,
        include_stats: includeStats
      }
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()

    // 인증 및 관리자 권한 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const {
      category_type,
      display_name_ko,
      display_name_en,
      description,
      icon,
      color,
      sort_order
    } = body

    if (!category_type || !display_name_ko) {
      return NextResponse.json({ 
        error: 'category_type and display_name_ko are required' 
      }, { status: 400 })
    }

    // 새 카테고리 생성
    const { data: newCategory, error: insertError } = await supabase
      .from('document_category_mapping')
      .insert([
        {
          category_type,
          display_name_ko,
          display_name_en,
          description,
          icon,
          color,
          sort_order: sort_order || 999
        }
      ])
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: newCategory
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}