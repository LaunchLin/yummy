'use server'

import { revalidatePath } from 'next/cache'

import type { CreateRecipePayload } from '@/lib/create-recipe-payload'
import { addDaysLocalDateString, localDateString } from '@/lib/date-utils'
import { createClient } from '@/utils/supabase/server'

const MAX_DATA_URL_COVER_LEN = 500_000

export async function createRecipe(input: CreateRecipePayload) {
  const supabase = await createClient()
  const name = input.name.trim()
  if (!name) return { ok: false as const, error: '请输入菜谱名称' }

  let cover_url = input.cover_url?.trim() || null
  if (
    cover_url &&
    cover_url.startsWith('data:') &&
    cover_url.length > MAX_DATA_URL_COVER_LEN
  ) {
    cover_url = null
  }

  const { data, error } = await supabase
    .from('recipes')
    .insert({
      name,
      cover_url,
      tags: input.tags,
      main_ingredients: input.main_ingredients,
      aux_ingredients: input.aux_ingredients,
      sauces: input.sauces,
      prep: input.prep,
      steps: input.steps,
      notes: null,
    })
    .select('id')
    .single()

  if (error) return { ok: false as const, error: error.message }

  revalidatePath('/')
  return { ok: true as const, id: data.id }
}

export async function updateRecipe(id: string, input: CreateRecipePayload) {
  const supabase = await createClient()
  const name = input.name.trim()
  if (!name) return { ok: false as const, error: '请输入菜谱名称' }

  let cover_url = input.cover_url?.trim() || null
  if (
    cover_url &&
    cover_url.startsWith('data:') &&
    cover_url.length > MAX_DATA_URL_COVER_LEN
  ) {
    cover_url = null
  }

  const { error } = await supabase
    .from('recipes')
    .update({
      name,
      cover_url,
      tags: input.tags,
      main_ingredients: input.main_ingredients,
      aux_ingredients: input.aux_ingredients,
      sauces: input.sauces,
      prep: input.prep,
      steps: input.steps,
    })
    .eq('id', id)

  if (error) return { ok: false as const, error: error.message }

  revalidatePath('/')
  return { ok: true as const }
}

const PLAN_RESOLVERS = {
  'today-lunch': () => ({
    plan_date: localDateString(new Date()),
    meal_type: '午餐',
  }),
  'today-dinner': () => ({
    plan_date: localDateString(new Date()),
    meal_type: '晚餐',
  }),
  'tomorrow-lunch': () => ({
    plan_date: addDaysLocalDateString(new Date(), 1),
    meal_type: '午餐',
  }),
  'tomorrow-dinner': () => ({
    plan_date: addDaysLocalDateString(new Date(), 1),
    meal_type: '晚餐',
  }),
} as const

export type MealPlanPickValue = keyof typeof PLAN_RESOLVERS

export async function addRecipeToMealPlan(
  recipeId: string,
  pick: MealPlanPickValue,
) {
  const supabase = await createClient()
  const { plan_date, meal_type } = PLAN_RESOLVERS[pick]()

  const { data: existing, error: readErr } = await supabase
    .from('meal_plans')
    .select('id, recipe_ids')
    .eq('plan_date', plan_date)
    .eq('meal_type', meal_type)
    .maybeSingle()

  if (readErr) {
    return { ok: false as const, error: readErr.message }
  }

  if (existing) {
    const cur = (existing.recipe_ids as string[]) ?? []
    if (cur.includes(recipeId)) {
      revalidatePath('/')
      return { ok: true as const, duplicate: true as const }
    }
    const { error } = await supabase
      .from('meal_plans')
      .update({ recipe_ids: [...cur, recipeId] })
      .eq('id', existing.id)
    if (error) return { ok: false as const, error: error.message }
  } else {
    const { error } = await supabase.from('meal_plans').insert({
      plan_date,
      meal_type,
      recipe_ids: [recipeId],
    })
    if (error) return { ok: false as const, error: error.message }
  }

  revalidatePath('/')
  return { ok: true as const, duplicate: false as const }
}

export async function deleteRecipe(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('recipes').delete().eq('id', id)
  if (error) return { ok: false as const, error: error.message }
  revalidatePath('/')
  return { ok: true as const }
}
