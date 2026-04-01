'use client'

import dynamic from 'next/dynamic'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { MoreVertical, Edit2, Trash2, ArrowLeft, Plus, Search, X } from 'lucide-react'

import type { MealPlanPickValue } from '@/app/actions/cook'
import { addRecipeToMealPlan, deleteRecipe } from '@/app/actions/cook'
import type { RecipeListSummary } from '@/lib/data/recipe-list'
import { groupRecipesForCookView } from '@/lib/recipe-grouping'
import { parseRecipeMainItems, splitRecipeLines } from '@/lib/meal-ingredients'
import type { RecipeRow } from '@/lib/types/database'
import { createClient } from '@/utils/supabase/client'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const CreateRecipePageLazy = dynamic(
  () => import('./create-recipe-page').then((m) => ({ default: m.CreateRecipePage })),
  {
    loading: () => (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#F5F1E8]/95 text-sm text-[#9A9590]">
        加载编辑器…
      </div>
    ),
  },
)

const PantryPageLazy = dynamic(
  () => import('./pantry-page').then((m) => ({ default: m.PantryPage })),
  {
    loading: () => (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#F5F1E8]/95 text-sm text-[#9A9590]">
        加载中…
      </div>
    ),
  },
)

/** 全页生命周期内只避免「SSR 已有列表 + 首进下厨」的重复请求；Tab 反复切换仍会静默刷新 */
let cookListSsrPrimedSession = false

const PLAN_LABELS: Record<MealPlanPickValue, string> = {
  'today-lunch': '今天午餐',
  'today-dinner': '今天晚餐',
  'tomorrow-lunch': '明天午餐',
  'tomorrow-dinner': '明天晚餐',
}

type RecipeListRow = RecipeListSummary

function cardFromRow(r: RecipeListRow): { id: string; name: string; cover: string } {
  return {
    id: r.id,
    name: r.name,
    cover: r.cover_url?.trim() ?? '',
  }
}

function idColorIndex(id: string, colorsLen: number) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return h % colorsLen
}

// 库存柜子图标
function PantryIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect x="3" y="2" width="16" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 8H19" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 14H19" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="14" cy="5" r="1" fill="currentColor" />
      <circle cx="14" cy="11" r="1" fill="currentColor" />
      <circle cx="14" cy="17" r="1" fill="currentColor" />
    </svg>
  )
}

function AddToPlanPopover({
  open,
  onClose,
  recipeName,
  position,
  onPick,
}: {
  open: boolean
  onClose: () => void
  recipeName: string
  position: { x: number; y: number }
  onPick: (value: MealPlanPickValue) => void
}) {
  const options: { label: string; value: MealPlanPickValue }[] = [
    { label: '今天午餐', value: 'today-lunch' },
    { label: '今天晚餐', value: 'today-dinner' },
    { label: '明天午餐', value: 'tomorrow-lunch' },
    { label: '明天晚餐', value: 'tomorrow-dinner' },
  ]

  const handleSelect = (option: (typeof options)[0]) => {
    onPick(option.value)
    onClose()
  }

  if (!open) return null

  // 挂到 body：与 RecipeDetailPage 相同，避免 HomeClient 的 animate-page-enter（transform）
  // 使 fixed 相对错误祖先，导致浮层跑到页面顶部/错位。
  const ui = (
    <>
      <div className="fixed inset-0 z-40 animate-fade-in" onClick={onClose} />
      <div
        className="fixed z-50 w-max max-w-[calc(100vw-24px)] bg-[#F5F1E8] rounded-xl shadow-lg border border-[#C9C5BD] py-1.5 animate-popover-in"
        style={{
          left: Math.max(12, Math.min(position.x, window.innerWidth - 12)),
          top: position.y,
          transform: 'translateX(-50%)',
        }}
      >
        {options.map((option, index) => (
          <button
            key={option.value}
            type="button"
            onClick={() => handleSelect(option)}
            className="block w-full whitespace-nowrap px-3 py-2 text-left text-sm text-[#3E3A39] hover:bg-[#E8E4DC] transition-colors stagger-item"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {option.label}
          </button>
        ))}
      </div>
    </>
  )

  return typeof document !== 'undefined' ? createPortal(ui, document.body) : null
}

function RecipeDetailPage({
  recipe,
  onBack,
  onEdit,
  onDelete,
}: {
  recipe: RecipeRow
  onBack: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const colors = ['#E8B86D', '#D97757', '#8FBC8F', '#87CEEB', '#DDA0DD', '#F4A460']
  const bgColor = colors[idColorIndex(recipe.id, colors.length)]
  const mainItems = parseRecipeMainItems(recipe.main_ingredients)
  const aux = recipe.aux_ingredients ?? []
  const sauces = recipe.sauces ?? []
  const prepLines = splitRecipeLines(recipe.prep)
  const stepLines = splitRecipeLines(recipe.steps)
  const tipsLines = splitRecipeLines(recipe.notes)

  return (
    <div className="fixed inset-0 z-[60] bg-[#F5F1E8] paper-bg overflow-y-auto animate-detail-enter pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <div className="sticky top-0 z-10 bg-[#F5F1E8]/95 backdrop-blur-sm border-b border-[#C9C5BD]">
        <div className="flex items-center justify-between px-5 py-4">
          <button type="button" onClick={onBack} className="text-[#6B6560] hover:text-[#3E3A39] btn-press">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h3 className="text-base font-bold text-[#3E3A39]">{recipe.name}</h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="更多操作"
                className="p-2 -m-2 rounded-lg text-[#6B6560] hover:text-[#3E3A39] hover:bg-[#E8E4DC] btn-press"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#F5F1E8] border-[#C9C5BD]">
              <DropdownMenuItem onClick={onEdit} className="text-[#3E3A39]">
                <Edit2 className="w-4 h-4 mr-2" />
                编辑菜谱
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-[#D97757]">
                <Trash2 className="w-4 h-4 mr-2" />
                删除菜谱
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div
        className="w-full h-56 relative overflow-hidden"
        style={{
          background: recipe.cover_url
            ? undefined
            : `linear-gradient(145deg, ${bgColor}60, ${bgColor}30)`,
        }}
      >
        {recipe.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={recipe.cover_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-28 h-28 rounded-full opacity-40" style={{ background: bgColor }} />
            <div className="absolute inset-0 flex items-center justify-center px-6">
              <span className="text-2xl font-bold text-[#3E3A39] text-center leading-snug drop-shadow-[0_1px_0_rgba(245,241,232,0.7)]">
                {recipe.name}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="p-5 space-y-4">
        <div className="note-card hand-drawn p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D97757]" />
            <span className="text-sm font-semibold text-[#3E3A39]">主菜</span>
          </div>
          {mainItems.length === 0 ? (
            <p className="text-sm text-[#6B6560]">暂无主料信息</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {mainItems.map((m, i) => (
                <span key={i} className="px-2 py-1 text-xs bg-[#E8E4DC] text-[#6B6560] rounded-lg">
                  {m.amount ? `${m.name} · ${m.amount}` : m.name}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="note-card hand-drawn p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E8B86D]" />
            <span className="text-sm font-semibold text-[#3E3A39]">辅料</span>
          </div>
          {aux.length === 0 ? (
            <p className="text-sm text-[#6B6560]">暂无辅料信息</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {aux.map((x, i) => (
                <span key={i} className="px-2 py-1 text-xs bg-[#E8E4DC] text-[#6B6560] rounded-lg">
                  {x}
                </span>
              ))}
            </div>
          )}
        </div>

        {sauces.length > 0 && (
          <div className="note-card hand-drawn p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[#87CEEB]" />
              <span className="text-sm font-semibold text-[#3E3A39]">调味品</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {sauces.map((s, i) => (
                <span key={i} className="px-2 py-1 text-xs bg-[#E8E4DC] text-[#6B6560] rounded-lg">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="note-card hand-drawn p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#87CEEB]" />
            <span className="text-sm font-semibold text-[#3E3A39]">备菜</span>
          </div>
          {prepLines.length === 0 ? (
            <p className="text-sm text-[#6B6560] italic">暂无备菜说明</p>
          ) : (
            <div className="space-y-3">
              {prepLines.map((line, i) => (
                <div key={i} className="flex gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#87CEEB]/35 text-[#3E3A39] text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-sm text-[#6B6560] leading-relaxed">{line}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="note-card hand-drawn p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#8FBC8F]" />
            <span className="text-sm font-semibold text-[#3E3A39]">步骤</span>
          </div>
          {stepLines.length === 0 ? (
            <p className="text-sm text-[#6B6560] italic">暂无烹饪步骤</p>
          ) : (
            <div className="space-y-3">
              {stepLines.map((step, i) => (
                <div key={i} className="flex gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#E8B86D]/30 text-[#3E3A39] text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-sm text-[#6B6560] leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {tipsLines.length > 0 && (
          <div className="note-card hand-drawn p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[#DDA0DD]" />
              <span className="text-sm font-semibold text-[#3E3A39]">Tips</span>
            </div>
            <div className="space-y-3">
              {tipsLines.map((line, i) => (
                <div key={i} className="flex gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#DDA0DD]/25 text-[#3E3A39] text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-sm text-[#6B6560] leading-relaxed">{line}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const RecipeCard = memo(function RecipeCard({
  recipe,
  onImageClick,
  onAddToPlan,
}: {
  recipe: { id: string; name: string; cover: string }
  onImageClick: () => void
  onAddToPlan: (e: React.MouseEvent) => void
}) {
  const colors = ['#E8B86D', '#D97757', '#8FBC8F', '#87CEEB', '#DDA0DD', '#F4A460']
  const bgColor = colors[idColorIndex(recipe.id, colors.length)]
  const hasImage = Boolean(
    recipe.cover &&
      (recipe.cover.startsWith('http') ||
        recipe.cover.startsWith('/') ||
        recipe.cover.startsWith('data:')),
  )

  return (
    <div className="w-full">
      <div
        className="w-full aspect-square rounded-xl mb-1 relative overflow-hidden hand-drawn cursor-pointer card-hover transition-all"
        style={{
          background: hasImage ? undefined : `linear-gradient(145deg, ${bgColor}40, ${bgColor}20)`,
          border: '2px solid rgba(62, 58, 57, 0.1)',
        }}
        onClick={onImageClick}
      >
        {hasImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={recipe.cover}
            alt={recipe.name}
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
            sizes="(max-width: 448px) 33vw, 140px"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center px-3">
            <span className="text-sm font-semibold text-[#3E3A39] text-center leading-tight line-clamp-2 drop-shadow-[0_1px_0_rgba(245,241,232,0.7)]">
              {recipe.name}
            </span>
          </div>
        )}

        <button
          type="button"
          onClick={onAddToPlan}
          className="absolute bottom-1.5 right-1.5 w-5 h-5 rounded-full bg-[#3E3A39]/60 flex items-center justify-center text-white/90 hover:bg-[#D97757] transition-all hover:scale-110 btn-press"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>
      {hasImage && (
        <p className="text-xs text-[#3E3A39] text-center font-medium leading-tight line-clamp-2">
          {recipe.name}
        </p>
      )}
    </div>
  )
})

type CategoryBlock = ReturnType<typeof groupRecipesForCookView>[number]

const CategorySection = memo(function CategorySection({
  category,
  onRecipeImageClick,
  onAddToPlan,
}: {
  category: CategoryBlock
  onRecipeImageClick: (row: RecipeListRow) => void
  onAddToPlan: (row: RecipeListRow, e: React.MouseEvent) => void
}) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-base font-bold text-[#3E3A39] tracking-wide">{category.label}</h3>
        <div className="flex-1 h-px bg-gradient-to-r from-[#C9C5BD] to-transparent" />
      </div>

      <div className="grid grid-cols-3 gap-2">
        {category.recipes.map((r) => {
          const c = cardFromRow(r)
          return (
            <RecipeCard
              key={r.id}
              recipe={c}
              onImageClick={() => onRecipeImageClick(r)}
              onAddToPlan={(e) => onAddToPlan(r, e)}
            />
          )
        })}
      </div>
    </div>
  )
})

const SearchResults = memo(function SearchResults({
  results,
  onRecipeImageClick,
  onAddToPlan,
}: {
  results: RecipeListRow[]
  onRecipeImageClick: (row: RecipeListRow) => void
  onAddToPlan: (row: RecipeListRow, e: React.MouseEvent) => void
}) {
  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-[#9A9590]">没找到相关菜谱</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {results.map((r) => {
        const c = cardFromRow(r)
        return (
          <RecipeCard
            key={r.id}
            recipe={c}
            onImageClick={() => onRecipeImageClick(r)}
            onAddToPlan={(e) => onAddToPlan(r, e)}
          />
        )
      })}
    </div>
  )
})

const RECIPE_LIST_CACHE_KEY = 'yummy.recipes.list.v1'
const RECIPE_LIST_LAST_NETWORK_KEY = 'yummy.recipes.last_network_at'
const RECIPE_LIST_CACHE_TTL_MS = 5 * 60_000

function readRecipeListCache(): { at: number; rows: RecipeListRow[] } | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(RECIPE_LIST_CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { at?: number; rows?: RecipeListRow[] }
    if (!parsed || typeof parsed !== 'object') return null
    if (!Array.isArray(parsed.rows)) return null
    return { at: Number(parsed.at ?? 0), rows: parsed.rows }
  } catch {
    return null
  }
}

function writeRecipeListCache(rows: RecipeListRow[]) {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(
      RECIPE_LIST_CACHE_KEY,
      JSON.stringify({ at: Date.now(), rows }),
    )
  } catch {
    /* ignore quota */
  }
}

export function CookView({ initialSummaries }: { initialSummaries: RecipeListSummary[] }) {
  const router = useRouter()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showPantryModal, setShowPantryModal] = useState(false)
  const [allRecipes, setAllRecipes] = useState<RecipeListRow[]>(() => {
    if (typeof window === 'undefined') return initialSummaries
    const cached = readRecipeListCache()
    if (cached?.rows?.length && Date.now() - cached.at < RECIPE_LIST_CACHE_TTL_MS) {
      return cached.rows
    }
    return initialSummaries
  })
  const [loading, setLoading] = useState(() => {
    if (typeof window === 'undefined') return false
    if (initialSummaries.length > 0) return false
    return !readRecipeListCache()?.rows?.length
  })
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeRow | null>(null)
  const [editingRecipe, setEditingRecipe] = useState<RecipeRow | null>(null)
  const [addToPlanRecipe, setAddToPlanRecipe] = useState<{
    recipe: RecipeListRow
    position: { x: number; y: number }
  } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  const lastServerSigRef = useRef<string | null>(null)

  const loadRecipes = useCallback(async (opts?: { force?: boolean; silent?: boolean }) => {
    const force = Boolean(opts?.force)
    const silent = Boolean(opts?.silent)

    if (!silent && !force) {
      const cached = readRecipeListCache()
      if (cached?.rows?.length) {
        setAllRecipes(cached.rows)
        setLoading(false)
        if (Date.now() - cached.at < RECIPE_LIST_CACHE_TTL_MS) return
      }
    }

    if (!silent) setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('recipes')
        .select('id,name,cover_url,tags')
        .order('created_at', { ascending: false })
      if (error) {
        if (!silent) toast.error(error.message)
        if (!silent) setAllRecipes([])
      } else {
        const rows = (data ?? []) as RecipeListRow[]
        setAllRecipes(rows)
        writeRecipeListCache(rows)
        try {
          window.sessionStorage.setItem(RECIPE_LIST_LAST_NETWORK_KEY, String(Date.now()))
        } catch {
          /* ignore */
        }
      }
    } catch {
      if (!silent) {
        toast.error('加载菜谱失败')
        setAllRecipes([])
      }
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  const fetchRecipeById = useCallback(async (id: string) => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('recipes')
      .select(
        'id,created_at,name,cover_url,tags,main_ingredients,aux_ingredients,sauces,prep,steps,notes',
      )
      .eq('id', id)
      .single()
    if (error) throw new Error(error.message)
    return data as RecipeRow
  }, [])

  /** router.refresh 后服务端带回新的摘要列表时再同步（跳过首次，保留 session 缓存优先策略） */
  useEffect(() => {
    const sig = initialSummaries.map((r) => r.id).join('|')
    if (lastServerSigRef.current === null) {
      lastServerSigRef.current = sig
      return
    }
    if (sig !== lastServerSigRef.current) {
      lastServerSigRef.current = sig
      setAllRecipes(initialSummaries)
      writeRecipeListCache(initialSummaries)
    }
  }, [initialSummaries])

  useEffect(() => {
    if (!cookListSsrPrimedSession && initialSummaries.length > 0) {
      cookListSsrPrimedSession = true
      try {
        window.sessionStorage.setItem(RECIPE_LIST_LAST_NETWORK_KEY, String(Date.now()))
      } catch {
        /* ignore */
      }
      return
    }
    void loadRecipes({ silent: true })
  }, [loadRecipes, initialSummaries.length])

  /** 仅在「新建菜谱」由开变关时拉一次列表；切勿在 closed 状态下每轮 effect 里 refresh，否则会 router.refresh 死循环卡死机器 */
  const createModalWasOpen = useRef(false)
  useEffect(() => {
    if (showCreateModal) {
      createModalWasOpen.current = true
      return
    }
    if (createModalWasOpen.current) {
      createModalWasOpen.current = false
      void loadRecipes({ force: true })
    }
  }, [showCreateModal, loadRecipes])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isSearching && searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearching(false)
        setSearchQuery('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isSearching])

  const recipeCategories = useMemo(() => groupRecipesForCookView(allRecipes), [allRecipes])

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []
    const q = searchQuery.toLowerCase()
    return allRecipes.filter((r) => r.name.toLowerCase().includes(q))
  }, [searchQuery, allRecipes])

  const handleDeleteRecipe = () => {
    if (!selectedRecipe) return
    void (async () => {
      const res = await deleteRecipe(selectedRecipe.id)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success(`已删除「${selectedRecipe.name}」`)
      setSelectedRecipe(null)
      await loadRecipes({ force: true })
    })()
  }

  const handleAddToPlan = useCallback((recipe: RecipeListRow, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    const btn = e.currentTarget
    const rect = btn.getBoundingClientRect()
    setAddToPlanRecipe({
      recipe,
      position: {
        x: rect.left + rect.width / 2,
        y: rect.bottom + 8,
      },
    })
  }, [])

  const handleOpenRecipe = useCallback(
    (row: RecipeListRow) => {
      void (async () => {
        try {
          const full = await fetchRecipeById(row.id)
          setSelectedRecipe(full)
        } catch (err) {
          toast.error(err instanceof Error ? err.message : '加载菜谱失败')
        }
      })()
    },
    [fetchRecipeById],
  )

  const handlePlanPick = useCallback((value: MealPlanPickValue) => {
    const target = addToPlanRecipe?.recipe
    if (!target) return
    void (async () => {
      const res = await addRecipeToMealPlan(target.id, value)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      if (res.duplicate) {
        toast.message(`「${target.name}」已在${PLAN_LABELS[value]}`)
      } else {
        toast.success(`已将「${target.name}」添加到${PLAN_LABELS[value]}`)
      }
      setAddToPlanRecipe(null)
      router.refresh()
    })()
  }, [addToPlanRecipe, router])

  if (selectedRecipe) {
    // 挂到 body：外层 HomeClient 的 animate-page-enter 使用 transform，会使子树内 fixed
    // 相对错误祖先定位，导致详情在「零高度」容器里不可见
    return createPortal(
      <RecipeDetailPage
        recipe={selectedRecipe}
        onBack={() => setSelectedRecipe(null)}
        onEdit={() => {
          setEditingRecipe(selectedRecipe)
          setSelectedRecipe(null)
          setShowCreateModal(true)
        }}
        onDelete={handleDeleteRecipe}
      />,
      document.body,
    )
  }

  return (
    <div className="relative -mx-2">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-[#3E3A39] tracking-wide">我的菜谱</h2>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setIsSearching(!isSearching)}
            className={`w-9 h-9 flex items-center justify-center rounded-xl transition-colors btn-press ${
              isSearching ? 'bg-[#D97757] text-white' : 'bg-[#E8E4DC] text-[#6B6560] hover:bg-[#D4CCC0]'
            }`}
          >
            <Search className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setShowPantryModal(true)}
            className="w-9 h-9 flex items-center justify-center bg-[#E8E4DC] rounded-xl text-[#6B6560] hover:bg-[#D4CCC0] transition-colors btn-press"
          >
            <PantryIcon />
          </button>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="w-9 h-9 flex items-center justify-center vintage-btn text-white rounded-xl btn-press"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isSearching && (
        <div ref={searchRef} className="relative mb-4 animate-slide-down">
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#E8E4DC] border border-[#C9C5BD]">
            <Search className="w-4 h-4 text-[#9A9590]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索菜谱..."
              autoFocus
              className="flex-1 bg-transparent text-sm text-[#3E3A39] placeholder-[#9A9590] focus:outline-none"
            />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery('')} className="text-[#9A9590] hover:text-[#3E3A39]">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-sm text-[#9A9590]">搜罗菜谱中…</div>
      ) : isSearching && searchQuery ? (
        <SearchResults
          results={searchResults}
          onRecipeImageClick={handleOpenRecipe}
          onAddToPlan={handleAddToPlan}
        />
      ) : allRecipes.length === 0 ? (
        <div className="text-center py-12 space-y-2">
          <p className="text-[#9A9590]">还没写过菜谱，太懒了吧</p>
        </div>
      ) : (
        <div className="space-y-2">
          {recipeCategories.map((category) => (
            <CategorySection
              key={category.id}
              category={category}
              onRecipeImageClick={handleOpenRecipe}
              onAddToPlan={handleAddToPlan}
            />
          ))}
        </div>
      )}

      <AddToPlanPopover
        open={!!addToPlanRecipe}
        onClose={() => setAddToPlanRecipe(null)}
        recipeName={addToPlanRecipe?.recipe.name || ''}
        position={addToPlanRecipe?.position || { x: 0, y: 0 }}
        onPick={handlePlanPick}
      />

      {showCreateModal && (
        <CreateRecipePageLazy
          onBack={() => {
            setShowCreateModal(false)
            setEditingRecipe(null)
          }}
          initialRecipe={editingRecipe}
          onSaved={() => void loadRecipes({ force: true })}
        />
      )}

      {showPantryModal && <PantryPageLazy onBack={() => setShowPantryModal(false)} />}
    </div>
  )
}
