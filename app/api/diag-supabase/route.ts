export const runtime = 'nodejs'; // 서버 런타임 강제 (Edge 제약 회피)

export async function GET() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    process.env.SUPABASE_URL ??
    '';

  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
  const payload: any = {
    url,
    anonPrefix: anon ? anon.slice(0, 10) + '…' : '(empty)',
    nodeEnv: process.env.NODE_ENV,
  };

  if (!url) {
    payload.error = 'Supabase URL env not found';
    return Response.json(payload, { status: 500 });
  }

  try {
    const r = await fetch(`${url}/auth/v1/health`, { cache: 'no-store' });
    payload.healthStatus = r.status;
    payload.healthText = await r.text();
    payload.ok = r.ok;
    return Response.json(payload, { status: r.ok ? 200 : 502 });
  } catch (e: any) {
    payload.ok = false;
    payload.fetchError = String(e?.message || e);
    return Response.json(payload, { status: 500 });
  }
}