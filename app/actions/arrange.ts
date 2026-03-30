'use server'

import { revalidatePath } from 'next/cache'

import { recipeTagsMatchCategoryId } from '@/lib/recipe-grouping'
import { createClient } from '@/utils/supabase/server'
import type { RecipeRow, RestaurantRow } from '@/lib/types/database'

function recipeMatchesDrawTag(recipe: RecipeRow, tagId: string | null): boolean {
  if (!tagId) return true
  return recipeTagsMatchCategoryId(recipe.tags ?? [], tagId)
}

export async function removeRecipeFromPlan(planId: string, recipeId: string) {
  const supabase = await createClient()
  const { data: plan, error: readErr } = await supabase
    .from('meal_plans')
    .select('recipe_ids')
    .eq('id', planId)
    .single()

  if (readErr || !plan) {
    return { ok: false as const, error: readErr?.message ?? '计划不存在' }
  }

  const next = ((plan.recipe_ids ?? []) as string[]).filter((id) => id !== recipeId)

  if (next.length === 0) {
    const { error } = await supabase.from('meal_plans').delete().eq('id', planId)
    if (error) return { ok: false as const, error: error.message }
    revalidatePath('/')
    return { ok: true as const, removed_plan: true as const }
  }

  const { error } = await supabase.from('meal_plans').update({ recipe_ids: next }).eq('id', planId)

  if (error) {
    return { ok: false as const, error: error.message }
  }

  revalidatePath('/')
  return { ok: true as const, removed_plan: false as const }
}

export async function drawRandomRecipe(tagId: string | null) {
  const supabase = await createClient()
  const { data: recipes, error } = await supabase.from('recipes').select('*')

  if (error) {
    return { recipe: null as RecipeRow | null, error: error.message }
  }

  const list = (recipes ?? []) as RecipeRow[]
  if (!list.length) {
    return {
      recipe: null as RecipeRow | null,
      error: '暂无菜谱，请先到「下厨」添加',
    }
  }

  const pool = tagId ? list.filter((r) => recipeMatchesDrawTag(r, tagId)) : list
  const use = pool.length ? pool : list
  const recipe = use[Math.floor(Math.random() * use.length)]
  return { recipe, error: null as string | null }
}

export async function drawRandomRestaurant() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('restaurants').select('*')

  if (error) {
    return { restaurant: null as RestaurantRow | null, error: error.message }
  }

  const list = (data ?? []) as RestaurantRow[]
  if (!list.length) {
    return {
      restaurant: null as RestaurantRow | null,
      error: '暂无餐厅记录，请先到「餐厅」添加',
    }
  }

  const restaurant = list[Math.floor(Math.random() * list.length)]
  return { restaurant, error: null as string | null }
}
