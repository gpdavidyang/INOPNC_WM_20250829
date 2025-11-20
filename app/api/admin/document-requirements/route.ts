import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function redirectToUnifiedEndpoint(request: NextRequest) {
  const target = new URL('/api/admin/required-document-types', request.url)
  return NextResponse.redirect(target, 308)
}

export async function GET(request: NextRequest) {
  return redirectToUnifiedEndpoint(request)
}

export async function POST(request: NextRequest) {
  return redirectToUnifiedEndpoint(request)
}

export async function PUT(request: NextRequest) {
  return redirectToUnifiedEndpoint(request)
}

export async function DELETE(request: NextRequest) {
  return redirectToUnifiedEndpoint(request)
}
