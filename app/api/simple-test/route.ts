
export async function GET() {
  return NextResponse.json({ 
    message: "Simple test working",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV 
  })
}

export async function POST() {
  return NextResponse.json({ 
    message: "Simple POST test working",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV 
  })
}