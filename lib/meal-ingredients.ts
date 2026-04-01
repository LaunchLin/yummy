import type { Ingredient } from '@/lib/mock-data'
import type { RecipeRow } from '@/lib/types/database'

export type MainIngredientItem = { name: string; amount?: string | null }

export function parseRecipeMainItems(raw: unknown): MainIngredientItem[] {
  if (!Array.isArray(raw)) return []
  const out: MainIngredientItem[] = []
  for (const item of raw) {
    if (item && typeof item === 'object' && 'name' in item) {
      const name = String((item as MainIngredientItem).name).trim()
      if (!name) continue
      const amount = 'amount' in item ? (item as MainIngredientItem).amount : null
      out.push({
        name,
        amount: amount != null && String(amount).trim() !== '' ? String(amount) : null,
      })
    }
  }
  return out
}

function mergeKey(category: Ingredient['category'], name: string) {
  return `${category}\n${name}`
}

/** 将当日涉及的多道菜谱合并为备菜用 Ingredient 列表 */
export function recipesToIngredients(recipes: RecipeRow[]): Ingredient[] {
  const map = new Map<
    string,
    { name: string; category: Ingredient['category']; quantity: string }
  >()

  const bump = (name: string, quantity: string, category: Ingredient['category']) => {
    const k = mergeKey(category, name)
    const q = quantity.trim()
    const prev = map.get(k)
    if (!prev) {
      map.set(k, { name, category, quantity: q })
      return
    }
    if (prev.quantity === q || prev.quantity === '') {
      map.set(k, { ...prev, quantity: q })
    } else {
      map.set(k, { ...prev, quantity: q ? `${prev.quantity}；${q}` : prev.quantity })
    }
  }

  for (const r of recipes) {
    for (const m of parseRecipeMainItems(r.main_ingredients)) {
      bump(m.name, m.amount ?? '', 'main')
    }
    for (const x of r.aux_ingredients ?? []) {
      bump(String(x).trim(), '', 'auxiliary')
    }
    for (const s of r.sauces ?? []) {
      bump(String(s).trim(), '', 'sauce')
    }
  }

  return Array.from(map.values()).map((v, i) => ({
    id: `${i}-${v.category}-${v.name}`,
    name: v.name,
    quantity: v.quantity,
    category: v.category,
  }))
}

/** 菜谱多行字段按行拆开（空行忽略） */
export function splitRecipeLines(raw: string | null | undefined): string[] {
  if (raw == null || !String(raw).trim()) return []
  return String(raw)
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
}

export function recipeToDetailParts(r: RecipeRow): {
  id: string
  name: string
  ingredients: string[]
  prepLines: string[]
  stepLines: string[]
  tipsLines: string[]
  coverUrl: string | null
} {
  const ingredients: string[] = []
  for (const m of parseRecipeMainItems(r.main_ingredients)) {
    ingredients.push(m.amount ? `${m.name} · ${m.amount}` : m.name)
  }
  for (const x of r.aux_ingredients ?? []) {
    ingredients.push(String(x))
  }
  for (const s of r.sauces ?? []) {
    ingredients.push(String(s))
  }
  return {
    id: r.id,
    name: r.name,
    ingredients,
    prepLines: splitRecipeLines(r.prep ?? null),
    stepLines: splitRecipeLines(r.steps),
    tipsLines: splitRecipeLines(r.notes),
    coverUrl: r.cover_url,
  }
}

export function hueFromUuid(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0
  }
  return h % 360
}
