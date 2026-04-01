import 'server-only'

import { createClient } from '@/utils/supabase/server'
import type { RecipeRow } from '@/lib/types/database'

/** 下厨列表卡片所需字段（与 CookView 中 RecipeListRow 一致） */
export type RecipeListSummary = Pick<RecipeRow, 'id' | 'name' | 'cover_url' | 'tags'>

export async function getRecipeSummariesForCook(): Promise<RecipeListSummary[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('recipes')
    .select('id,name,cover_url,tags')
    .order('created_at', { ascending: false })

  if (error) {
    console.error(error)
    throw new Error(error.message)
  }
  return (data ?? []) as RecipeListSummary[]
}
