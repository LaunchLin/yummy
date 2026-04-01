export type HasRecipeTags = { tags?: string[] | null }

/** 与新增菜谱页标签 id / 展示 label 对齐（含旧版文案兼容） */
export const RECIPE_CATEGORY_ORDER: { id: string; label: string }[] = [
  { id: 'staple', label: '🍛主食' },
  { id: 'meat', label: '🥩荤的' },
  { id: 'seafood', label: '🦐海鲜' },
  { id: 'vegetable', label: '🥬素的' },
  { id: 'soup', label: '🍲汤' },
]

const TAG_ALIAS: Record<string, string[]> = {
  staple: [
    '🍛主食',
    '主食',
    '主食面点',
    'staple',
    '面点',
    '🍛',
  ],
  meat: ['🥩荤的', '荤', '荤的', '地上跑的', 'meat', '地上', '肉', '🥩'],
  seafood: ['🦐海鲜', '海鲜', '水里游的', 'seafood', '鱼', '虾', '🦐'],
  vegetable: ['🥬素的', '素', '素的', '田间蔬香', 'vegetable', '蔬', '🥬'],
  soup: ['🍲汤', '汤', '汤汤水水', 'soup', '🍲'],
}

function tagsMatchCategory(tags: string[], catId: string): boolean {
  const aliases = TAG_ALIAS[catId]
  if (!aliases) return false
  return tags.some((tag) => {
    const t = tag.trim().toLowerCase()
    return aliases.some(
      (a) => tag === a || t === a.toLowerCase() || tag.includes(a) || a.includes(tag),
    )
  })
}

function pickCategoryIds(tags: string[]): string[] {
  const out: string[] = []
  for (const { id } of RECIPE_CATEGORY_ORDER) {
    if (tagsMatchCategory(tags, id)) out.push(id)
  }
  return out.length ? out : ['other']
}

/** 抽签、筛选：菜谱 tags 是否属于某分类 id */
export function recipeTagsMatchCategoryId(tags: string[], catId: string): boolean {
  return tagsMatchCategory(tags, catId)
}

export type CookCategorySection<T> = {
  id: string
  label: string
  recipes: T[]
}

export function groupRecipesForCookView<T extends HasRecipeTags>(recipes: T[]): CookCategorySection<T>[] {
  const bucket = new Map<string, T[]>()
  for (const { id } of RECIPE_CATEGORY_ORDER) bucket.set(id, [])
  bucket.set('other', [])

  for (const r of recipes) {
    const cids = pickCategoryIds(r.tags ?? [])
    for (const cid of cids) bucket.get(cid)!.push(r)
  }

  const out: CookCategorySection<T>[] = []
  for (const { id, label } of RECIPE_CATEGORY_ORDER) {
    const list = bucket.get(id) ?? []
    if (list.length) out.push({ id, label, recipes: list })
  }
  const other = bucket.get('other') ?? []
  if (other.length) {
    out.push({ id: 'other', label: '我的手帐菜谱', recipes: other })
  }
  return out
}
