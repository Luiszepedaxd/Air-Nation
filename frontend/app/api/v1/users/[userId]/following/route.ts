import { NextRequest, NextResponse } from 'next/server'
import { createPublicSupabaseClient } from '@/app/u/supabase-public'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params

  const supabase = createPublicSupabaseClient()

  const { data, error } = await supabase
    .from('user_follows')
    .select('following:users!user_follows_following_id_fkey(id, alias, nombre, avatar_url)')
    .eq('follower_id', userId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const users = (data ?? [])
    .map((row: any) => row.following)
    .filter(Boolean)

  return NextResponse.json(users)
}
