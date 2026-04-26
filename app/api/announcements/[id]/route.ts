import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .eq("id", id)
    .eq("is_active", true)
    .single()

  if (error) {
    return NextResponse.json({ error: "公告不存在" }, { status: 404 })
  }

  return NextResponse.json(data)
}
