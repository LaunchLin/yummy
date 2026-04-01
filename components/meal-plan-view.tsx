'use client'

import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Check, ArrowLeft, Eye, Trash2, MoreVertical, Edit2 } from 'lucide-react'

import { removeRecipeFromPlan } from '@/app/actions/arrange'
import { getCategoryLabel, type Ingredient } from '@/lib/mock-data'
import { hueFromUuid, recipeToDetailParts } from '@/lib/meal-ingredients'
import type { MealScheduleItem, RecipeRow } from '@/lib/types/database'
import { deleteRecipe } from '@/app/actions/cook'
import { CreateRecipePage } from './create-recipe-page'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// 复古购物篮图标
function BasketIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 8H17L15.5 17H4.5L3 8Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M6 8V6C6 3.79 7.79 2 10 2C12.21 2 14 3.79 14 6V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="7" cy="12" r="1" fill="currentColor" />
      <circle cx="13" cy="12" r="1" fill="currentColor" />
    </svg>
  )
}

// 手绘小锅装饰
function PotDecoration({ className }: { className?: string }) {
  return (
    <svg className={className} width="36" height="32" viewBox="0 0 36 32" fill="none">
      <ellipse cx="18" cy="24" rx="14" ry="6" fill="currentColor" opacity="0.15" />
      <path d="M6 14C6 10 10 6 18 6C26 6 30 10 30 14V22C30 26 26 28 18 28C10 28 6 26 6 22V14Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M6 14C6 17 10 19 18 19C26 19 30 17 30 14" stroke="currentColor" strokeWidth="1" opacity="0.5" />
      <path d="M4 14H6M30 14H32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 2C16 2 17 4 18 4C19 4 20 2 20 2" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
    </svg>
  )
}

// 手绘爱心装饰
function HeartDecoration({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="18" viewBox="0 0 20 18" fill="currentColor">
      <path d="M10 17C10 17 1 11 1 5.5C1 2.5 3.5 0 6.5 0C8.04 0 9.54 0.99 10 2C10.46 0.99 11.96 0 13.5 0C16.5 0 19 2.5 19 5.5C19 11 10 17 10 17Z" opacity="0.2" />
    </svg>
  )
}

// 菜品操作弹窗
function DishActionPopover({
  open,
  onClose,
  dishName,
  position,
  onViewRecipe,
  onDelete,
}: {
  open: boolean
  onClose: () => void
  dishName: string
  position: { x: number; y: number }
  onViewRecipe: () => void
  onDelete: () => void
}) {
  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-40 animate-fade-in" onClick={onClose} />
      <div
        className="fixed z-50 bg-[#F5F1E8] rounded-xl shadow-lg border border-[#C9C5BD] py-2 min-w-[120px] animate-popover-in"
        style={{
          left: Math.min(position.x, window.innerWidth - 140),
          top: position.y,
        }}
      >
        <button
          onClick={() => {
            onViewRecipe()
            onClose()
          }}
          className="w-full px-4 py-2.5 text-left text-sm text-[#3E3A39] hover:bg-[#E8E4DC] transition-colors flex items-center gap-2"
        >
          <Eye className="w-4 h-4" />
          查看菜谱
        </button>
        <button
          onClick={() => {
            onDelete()
            onClose()
          }}
          className="w-full px-4 py-2.5 text-left text-sm text-[#D97757] hover:bg-[#E8E4DC] transition-colors flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          删除
        </button>
      </div>
    </>
  )
}

type RecipeDetailModel = ReturnType<typeof recipeToDetailParts>

// 菜谱详情页面
function RecipeDetailPage({
  recipe,
  onBack,
  onEdit,
  onDelete,
}: {
  recipe: RecipeDetailModel
  onBack: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const colors = ['#E8B86D', '#D97757', '#8FBC8F', '#87CEEB', '#DDA0DD', '#F4A460']
  const hue = hueFromUuid(recipe.id)
  const hslBg = `hsl(${hue} 42% 78%)`
  const bgColor = colors[hue % colors.length]

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
        className="w-full h-48 relative overflow-hidden"
        style={{
          background: recipe.coverUrl
            ? undefined
            : `linear-gradient(145deg, ${hslBg}cc, ${bgColor}40)`,
        }}
      >
        {recipe.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={recipe.coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full opacity-40" style={{ background: bgColor }} />
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
            <span className="text-sm font-semibold text-[#3E3A39]">食材清单</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {recipe.ingredients.map((ing, i) => (
              <span key={i} className="px-2 py-1 text-xs bg-[#E8E4DC] text-[#6B6560] rounded-lg">
                {ing}
              </span>
            ))}
          </div>
        </div>

        <div className="note-card hand-drawn p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#87CEEB]" />
            <span className="text-sm font-semibold text-[#3E3A39]">备菜</span>
          </div>
          <div className="space-y-3">
            {recipe.prepLines.length === 0 ? (
              <p className="text-sm text-[#9A9590]">暂无备菜说明</p>
            ) : (
              recipe.prepLines.map((line, i) => (
                <div key={i} className="flex gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#87CEEB]/35 text-[#3E3A39] text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-sm text-[#6B6560] leading-relaxed">{line}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="note-card hand-drawn p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#8FBC8F]" />
            <span className="text-sm font-semibold text-[#3E3A39]">步骤</span>
          </div>
          <div className="space-y-3">
            {recipe.stepLines.length === 0 ? (
              <p className="text-sm text-[#9A9590]">暂无步骤，可在「下厨」里补充～</p>
            ) : (
              recipe.stepLines.map((step, i) => (
                <div key={i} className="flex gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#E8B86D]/30 text-[#3E3A39] text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-sm text-[#6B6560] leading-relaxed">{step}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {recipe.tipsLines.length > 0 && (
          <div className="note-card hand-drawn p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[#DDA0DD]" />
              <span className="text-sm font-semibold text-[#3E3A39]">Tips</span>
            </div>
            <div className="space-y-3">
              {recipe.tipsLines.map((line, i) => (
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

// 采购清单项
function ShoppingItem({
  item,
  onRemove,
}: {
  item: { name: string; quantity: string }
  onRemove: () => void
}) {
  const [checked, setChecked] = useState(false)

  const handleCheck = () => {
    setChecked(true)
    setTimeout(() => {
      onRemove()
    }, 300)
  }

  return (
    <div
      className={`flex items-center justify-between py-2 border-b border-dashed border-[#C9C5BD] last:border-0 transition-opacity ${checked ? 'opacity-50' : ''}`}
    >
      <div className="flex items-center gap-2">
        <span className={`text-[#3E3A39] text-sm ${checked ? 'line-through' : ''}`}>{item.name}</span>
        <span className="text-xs text-[#9A9590]">{item.quantity}</span>
      </div>
      <button
        type="button"
        onClick={handleCheck}
        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
          checked ? 'border-[#8FBC8F] bg-[#8FBC8F]' : 'border-[#9A9590] hover:border-[#8FBC8F]'
        }`}
      >
        {checked && <Check className="w-3 h-3 text-white" />}
      </button>
    </div>
  )
}

const IngredientItem = memo(function IngredientItem({
  ingredient,
  inShoppingList,
  onAddToShopping,
}: {
  ingredient: Ingredient
  inShoppingList: boolean
  onAddToShopping: (ingredient: Ingredient) => void
}) {
  const handleAddToCart = () => {
    if (inShoppingList) return
    onAddToShopping(ingredient)
    toast.success(`已将「${ingredient.name}」加入采购清单`)
  }

  return (
    <div className="flex items-center justify-between py-2.5 border-b border-dashed border-[#C9C5BD] last:border-0">
      <div className="flex items-center gap-3">
        <span className="w-1.5 h-1.5 rounded-full bg-[#6B6560]" />
        <span className="text-[#3E3A39] text-sm">{ingredient.name}</span>
        {ingredient.quantity ? (
          <span className="text-xs text-[#9A9590]">{ingredient.quantity}</span>
        ) : null}
      </div>
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={inShoppingList}
        title={
          inShoppingList
            ? '已在采购清单中，请先在上方移除后再加入'
            : '加入采购清单'
        }
        className={`p-2 rounded-xl transition-colors ${
          inShoppingList
            ? 'text-[#9A9590]/50 cursor-not-allowed opacity-60'
            : 'text-[#6B6560] hover:text-[#D97757] hover:bg-[#D97757]/10'
        }`}
      >
        {inShoppingList ? <Check className="w-5 h-5 text-[#8FBC8F]" strokeWidth={2.5} /> : <BasketIcon />}
      </button>
    </div>
  )
})

function IngredientCategory({
  category,
  ingredients,
  shoppingNames,
  onAddToShopping,
}: {
  category: 'main' | 'auxiliary' | 'sauce'
  ingredients: Ingredient[]
  shoppingNames: Set<string>
  onAddToShopping: (ingredient: Ingredient) => void
}) {
  const filteredIngredients = ingredients.filter((i) => i.category === category)

  if (filteredIngredients.length === 0) return null

  return (
    <div className="mb-5 last:mb-0">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-medium text-[#9A9590] tracking-widest">
          {getCategoryLabel(category)}
        </span>
        <div className="flex-1 h-px bg-gradient-to-r from-[#C9C5BD] to-transparent" />
      </div>
      <div>
        {filteredIngredients.map((ingredient) => (
          <IngredientItem
            key={ingredient.id}
            ingredient={ingredient}
            inShoppingList={shoppingNames.has(ingredient.name)}
            onAddToShopping={onAddToShopping}
          />
        ))}
      </div>
    </div>
  )
}

function defaultMealIndex(meals: MealScheduleItem[]) {
  const idx = meals.findIndex((m) => m.mealKey === 'dinner')
  return idx >= 0 ? idx : 0
}

export interface MealPlanViewProps {
  meals: MealScheduleItem[]
  recipes: RecipeRow[]
  ingredients: Ingredient[]
  onGoToCook?: () => void
}

export function MealPlanView({ meals: initialMeals, recipes, ingredients, onGoToCook }: MealPlanViewProps) {
  const router = useRouter()
  const recipeById = useMemo(() => new Map(recipes.map((r) => [r.id, r])), [recipes])

  const [mealDishes, setMealDishes] = useState(initialMeals)
  const [currentMealIndex, setCurrentMealIndex] = useState(() => defaultMealIndex(initialMeals))
  const [shoppingList, setShoppingList] = useState<{ name: string; quantity: string }[]>([])
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeDetailModel | null>(null)
  const [editingRecipe, setEditingRecipe] = useState<RecipeRow | null>(null)
  const [dishAction, setDishAction] = useState<{
    dishName: string
    recipeId: string
    position: { x: number; y: number }
  } | null>(null)

  useEffect(() => {
    setMealDishes(initialMeals)
    setCurrentMealIndex((idx) => {
      const max = Math.max(0, initialMeals.length - 1)
      return Math.min(idx, max)
    })
  }, [initialMeals])

  const currentMeal = mealDishes[currentMealIndex]
  const hasNextMeal = currentMealIndex < mealDishes.length - 1
  const hasPrevMeal = currentMealIndex > 0

  const today = new Date()
  const month = today.getMonth() + 1
  const day = today.getDate()
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const weekday = weekdays[today.getDay()]

  const menuTitle =
    currentMeal?.mealKey === 'lunch'
      ? '午间菜单'
      : currentMeal?.mealKey === 'dinner'
        ? '晚间菜单'
        : (currentMeal?.label ?? '今日菜单')

  const handleAddToShopping = useCallback((ingredient: Ingredient) => {
    setShoppingList((prev) => {
      if (prev.some((item) => item.name === ingredient.name)) {
        return prev
      }
      return [...prev, { name: ingredient.name, quantity: ingredient.quantity }]
    })
  }, [])

  const handleRemoveFromShopping = (name: string) => {
    setShoppingList((prev) => prev.filter((item) => item.name !== name))
    toast.success(`已将「${name}」标记为已采购`)
  }

  const shoppingNames = useMemo(() => new Set(shoppingList.map((item) => item.name)), [shoppingList])

  const handleSwitchMeal = (direction: 'prev' | 'next') => {
    if (direction === 'next' && hasNextMeal) {
      setCurrentMealIndex((prev) => prev + 1)
    } else if (direction === 'prev' && hasPrevMeal) {
      setCurrentMealIndex((prev) => prev - 1)
    }
  }

  const handleDishClick = (dishName: string, recipeId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    setDishAction({
      dishName,
      recipeId,
      position: {
        x: rect.right + 8,
        y: rect.top + rect.height / 2 - 40,
      },
    })
  }

  const handleViewRecipe = () => {
    if (!dishAction) return
    const row = recipeById.get(dishAction.recipeId)
    if (row) {
      setDishAction(null)
      setTimeout(() => {
        setSelectedRecipe(recipeToDetailParts(row))
      }, 50)
    } else {
      toast.error('暂无该菜谱详情')
    }
  }

  const handleDeleteDish = () => {
    if (!dishAction || !currentMeal) return
    void (async () => {
      const res = await removeRecipeFromPlan(currentMeal.planId, dishAction.recipeId)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      setMealDishes((prev) => {
        const next = prev
          .map((meal, idx) => {
            if (idx !== currentMealIndex) return meal
            return {
              ...meal,
              dishes: meal.dishes.filter((d) => d.recipeId !== dishAction.recipeId),
            }
          })
          .filter((m) => m.dishes.length > 0)

        return next
      })
      toast.success(`已删除「${dishAction.dishName}」`)
      router.refresh()
    })()
  }

  if (selectedRecipe) {
    // 与 CookView 一致：挂到 body，避免 HomeClient 的 animate-page-enter（transform）使 fixed 相对错误祖先导致空白
    return createPortal(
      <RecipeDetailPage
        recipe={selectedRecipe}
        onBack={() => setSelectedRecipe(null)}
        onEdit={() => {
          const row = recipes.find((r) => r.id === selectedRecipe.id) ?? null
          if (!row) {
            toast.error('暂无该菜谱详情')
            return
          }
          setEditingRecipe(row)
          setSelectedRecipe(null)
        }}
        onDelete={() => {
          const rid = selectedRecipe.id
          void (async () => {
            const res = await deleteRecipe(rid)
            if (!res.ok) {
              toast.error(res.error)
              return
            }
            toast.success('已删除菜谱')
            setSelectedRecipe(null)
            router.refresh()
          })()
        }}
      />,
      document.body,
    )
  }

  if (editingRecipe) {
    return createPortal(
      <CreateRecipePage
        initialRecipe={editingRecipe}
        onSaved={() => {
          onGoToCook?.()
          router.refresh()
        }}
        onBack={() => setEditingRecipe(null)}
      />,
      document.body,
    )
  }

  if (!currentMeal) {
    return (
      <div className="py-16 text-center text-sm text-[#9A9590]">
        今日尚未安排餐别，可在数据库添加 meal_plans 或使用「无计划」视图
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="relative animate-slide-up">
        <div className="relative">
          <div className="home-menu-card torn-edge p-6 relative overflow-hidden transition-transform hover:scale-[1.01] rounded-2xl">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-4 right-6 w-16 h-16 rounded-full bg-[#E8B86D]/30 blur-xl" />
              <div className="absolute bottom-8 left-4 w-20 h-20 rounded-full bg-[#D97757]/20 blur-xl" />
            </div>

            <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
              {hasPrevMeal && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSwitchMeal('prev')
                  }}
                  className="w-7 h-7 flex items-center justify-center rounded transition-colors text-[#F5EFE6]/70 hover:text-[#F5EFE6] hover:bg-[#F5EFE6]/10 active:scale-95"
                >
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                    <path d="M12 15L7 10L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              )}

              <div className="flex items-baseline gap-0.5 px-1">
                <span className="text-2xl font-bold text-[#F5EFE6]" style={{ fontFamily: 'Georgia, serif' }}>
                  {day}
                </span>
                <span className="text-xs text-[#F5EFE6]/70">/{month}月</span>
              </div>

              {hasNextMeal && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSwitchMeal('next')
                  }}
                  className="w-7 h-7 flex items-center justify-center rounded transition-colors text-[#F5EFE6]/70 hover:text-[#F5EFE6] hover:bg-[#F5EFE6]/10 active:scale-95"
                >
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                    <path d="M8 5L13 10L8 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              )}
            </div>

            <div className="mb-5 relative z-10">
              <div className="inline-flex items-center gap-2">
                <span className="text-[#F5EFE6]/40 text-sm">~</span>
                <h3 className="text-lg text-[#F5EFE6] tracking-[0.15em] font-medium">{menuTitle}</h3>
                <span className="text-[#F5EFE6]/40 text-sm">~</span>
              </div>
            </div>

            <div className="h-px bg-[#F5EFE6]/20 mb-5" />

            <div className="space-y-5 relative z-10">
              {currentMeal.dishes.length === 0 ? (
                <p className="text-[#F5EFE6]/70 text-sm">本餐暂无菜品，可删除计划或去「下厨」关联菜谱</p>
              ) : (
                currentMeal.dishes.map((dish, index) => (
                  <button
                    key={dish.recipeId}
                    type="button"
                    className="flex items-center gap-3 w-full text-left group stagger-item"
                    style={{ animationDelay: `${index * 80 + 200}ms` }}
                    onClick={(e) => handleDishClick(dish.name, dish.recipeId, e)}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-[#E8B86D]/60 flex-shrink-0 group-hover:bg-[#E8B86D] transition-colors" />
                    <span className="home-dish-name text-lg group-hover:text-[#E8B86D] transition-colors">
                      {dish.name}
                    </span>
                    {index === 0 && <HeartDecoration className="w-4 h-4 text-[#E8B86D] ml-1" />}
                  </button>
                ))
              )}
            </div>

            <PotDecoration className="absolute bottom-3 right-4 text-[#F5EFE6] opacity-10" />
          </div>
        </div>
      </div>

      {shoppingList.length > 0 && (
        <div className="relative note-card hand-drawn p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 rounded-full bg-[#8FBC8F]" />
            <h3 className="text-base font-semibold text-[#3E3A39] tracking-wide">采购清单</h3>
          </div>

          <div>
            {shoppingList.map((item) => (
              <ShoppingItem
                key={item.name}
                item={item}
                onRemove={() => handleRemoveFromShopping(item.name)}
              />
            ))}
          </div>

          <div className="absolute -top-2 left-8 w-8 h-4 bg-[#8FBC8F]/60 rounded-sm transform -rotate-2" />
        </div>
      )}

      <div className="relative note-card hand-drawn p-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-3 h-3 rounded-full bg-[#D97757]" />
          <h3 className="text-base font-semibold text-[#3E3A39] tracking-wide">备菜清单</h3>
        </div>

        <IngredientCategory
          category="main"
          ingredients={ingredients}
          shoppingNames={shoppingNames}
          onAddToShopping={handleAddToShopping}
        />
        <IngredientCategory
          category="auxiliary"
          ingredients={ingredients}
          shoppingNames={shoppingNames}
          onAddToShopping={handleAddToShopping}
        />
        <IngredientCategory
          category="sauce"
          ingredients={ingredients}
          shoppingNames={shoppingNames}
          onAddToShopping={handleAddToShopping}
        />

        <div className="absolute -top-2 left-8 w-8 h-4 bg-[#E8B86D]/60 rounded-sm transform -rotate-2" />
      </div>

      <DishActionPopover
        open={!!dishAction}
        onClose={() => setDishAction(null)}
        dishName={dishAction?.dishName ?? ''}
        position={dishAction?.position ?? { x: 0, y: 0 }}
        onViewRecipe={handleViewRecipe}
        onDelete={handleDeleteDish}
      />
    </div>
  )
}
