import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// 删除模板
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const { error } = await supabase
      .from("product_templates")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("删除模板失败:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("删除模板异常:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// 更新模板
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    const body = await request.json()

    const { data, error } = await supabase
      .from("product_templates")
      .update({ name: body.name, data: body.data })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("更新模板失败:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("更新模板异常:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
