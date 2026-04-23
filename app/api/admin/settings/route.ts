import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("settings")
    .select("*")

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function PUT(request: Request) {
  const supabase = await createClient()
  const body = await request.json()

  // 更新每个设置项
  for (const [key, value] of Object.entries(body)) {
    await supabase
      .from("settings")
      .upsert({ 
        key, 
        value: JSON.stringify(value) 
      }, { 
        onConflict: "key" 
      })
  }

  return NextResponse.json({ success: true })
}
