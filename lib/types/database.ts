/** 与 Supabase public 表对齐的行类型 */

export interface RecipeRow {
  id: string
  created_at: string
  name: string
  cover_url: string | null
  tags: string[]
  main_ingredients: unknown
  aux_ingredients: string[]
  sauces: string[]
  /** 备菜：切配、腌制等（列未建妥前可能缺省） */
  prep?: string | null
  /** 步骤：正式烹饪流程，多行文本 */
  steps: string | null
  notes: string | null
}

export interface RestaurantRow {
  id: string
  created_at: string
  name: string
  rating: number
  signature_dishes: string[]
  notes: string
}

export interface MealPlanRow {
  id: string
  created_at: string
  plan_date: string
  meal_type: string
  recipe_ids: string[]
}

export interface ShoppingListRow {
  id: string
  created_at: string
  item_name: string
  amount: string
  is_bought: boolean
}

export interface InventoryRow {
  id: string
  created_at: string
  item_name: string
  category: string
  amount_note: string | null
}

export interface MealScheduleItem {
  planId: string
  mealKey: 'lunch' | 'dinner' | 'other'
  label: string
  dishes: { recipeId: string; name: string }[]
}
