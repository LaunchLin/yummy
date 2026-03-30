import 'server-only'

import { createClient } from '@/utils/supabase/server'
import { localDateString } from '@/lib/date-utils'
import { recipesToIngredients } from '@/lib/meal-ingredients'
import type { MealPlanRow, MealScheduleItem, RecipeRow } from '@/lib/types/database'
import type { Ingredient } from '@/lib/mock-data'

function inferMealKey(mealType: string): MealScheduleItem['mealKey'] {
  if (mealType.includes('午')) return 'lunch'
  if (mealType.includes('晚')) return 'dinner'
  return 'other'
}

function sortMealPlans(plans: MealPlanRow[]): MealPlanRow[] {
  const rank = (t: string) => {
    if (t.includes('早')) return 0
    if (t.includes('午')) return 1
    if (t.includes('晚')) return 2
    return 9
  }
  return [...plans].sort((a, b) => rank(a.meal_type) - rank(b.meal_type))
}

export type TodayArrangeResult =
  | {
      hasPlan: false
    }
  | {
      hasPlan: true
      meals: MealScheduleItem[]
      recipes: RecipeRow[]
      ingredients: Ingredient[]
    }

export async function getTodayArrange(): Promise<TodayArrangeResult> {
  const supabase = await createClient()
  const today = localDateString(new Date())

  const { data: plans, error: planError } = await supabase
    .from('meal_plans')
    .select('*')
    .eq('plan_date', today)

  if (planError) {
    console.error(planError)
    throw new Error(planError.message)
  }

  if (!plans?.length) {
    return { hasPlan: false }
  }

  const sorted = sortMealPlans(plans as MealPlanRow[])
  const ids = [
    ...new Set(sorted.flatMap((p) => (p.recipe_ids ?? []) as string[])),
  ].filter(Boolean)

  let recipes: RecipeRow[] = []
  if (ids.length) {
    const { data: recipeRows, error: rErr } = await supabase
      .from('recipes')
      .select('*')
      .in('id', ids)

    if (rErr) {
      console.error(rErr)
      throw new Error(rErr.message)
    }
    recipes = (recipeRows ?? []) as RecipeRow[]
  }

  const recipeById = new Map(recipes.map((r) => [r.id, r]))

  const meals: MealScheduleItem[] = sorted.map((plan) => {
    const dishes = (plan.recipe_ids ?? [])
      .map((rid) => {
        const row = recipeById.get(rid)
        return row ? { recipeId: row.id, name: row.name } : null
      })
      .filter(Boolean) as { recipeId: string; name: string }[]

    return {
      planId: plan.id,
      mealKey: inferMealKey(plan.meal_type),
      label: plan.meal_type,
      dishes,
    }
  })

  const ingredients = recipesToIngredients(recipes)

  return {
    hasPlan: true,
    meals,
    recipes,
    ingredients,
  }
}
