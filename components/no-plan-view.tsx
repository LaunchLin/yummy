'use client'

import { createPortal } from 'react-dom'
import { useState } from 'react'
import { ChefHat } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import {
  drawRandomRecipe,
  drawRandomRestaurant,
} from '@/app/actions/arrange'
import {
  addRecipeToMealPlan,
  type MealPlanPickValue,
} from '@/app/actions/cook'

type ResultType = 'dish' | 'restaurant' | null

/** 抽签结果（与 UI 展示字段对齐） */
export interface DrawDishResult {
  id: string
  name: string
}

export interface DrawRestaurantResult {
  id: string
  name: string
  dishes: string[]
}

interface RandomResult {
  type: ResultType
  data: DrawDishResult | DrawRestaurantResult | null
  selectedTags?: string[]
}

interface NoPlanViewProps {
  onGoToCook?: () => void
}

// 菜谱分类标签
const recipeCategories = [
  { id: 'staple', label: '🍛主食' },
  { id: 'meat', label: '🥩荤的' },
  { id: 'seafood', label: '🦐海鲜' },
  { id: 'vegetable', label: '🥬素的' },
  { id: 'soup', label: '🍲汤' },
]

// 手绘风格骰子图标
function DiceIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="24" height="24" rx="4" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="10" cy="10" r="2" fill="currentColor" />
      <circle cx="22" cy="10" r="2" fill="currentColor" />
      <circle cx="16" cy="16" r="2" fill="currentColor" />
      <circle cx="10" cy="22" r="2" fill="currentColor" />
      <circle cx="22" cy="22" r="2" fill="currentColor" />
    </svg>
  )
}

// 锅铲图标
function CookingIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="24" cy="32" rx="14" ry="8" stroke="#3E3A39" strokeWidth="2.5" fill="#E8B86D" />
      <path d="M10 32V26C10 19 16 13 24 13C32 13 38 19 38 26V32" stroke="#3E3A39" strokeWidth="2.5" />
      <path d="M20 8C20 8 21 4 24 4C27 4 28 8 28 8" stroke="#3E3A39" strokeWidth="2" strokeLinecap="round" />
      <path d="M24 8V13" stroke="#3E3A39" strokeWidth="2" strokeLinecap="round" />
      <path d="M18 10C18 10 17 7 18 5" stroke="#9A9590" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M30 10C30 10 31 7 30 5" stroke="#9A9590" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

// 餐厅图标
function DiningIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="28" r="14" stroke="#3E3A39" strokeWidth="2.5" fill="#F5B5A3" />
      <path d="M14 6V38" stroke="#3E3A39" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M14 6C14 6 10 9 10 15C10 20 14 22 14 22" stroke="#3E3A39" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M14 6C14 6 18 9 18 15C18 20 14 22 14 22" stroke="#3E3A39" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M34 10V18C34 21 36 22 36 22V38" stroke="#3E3A39" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M38 10V18C38 21 36 22 36 22" stroke="#3E3A39" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

function pickTodayMealSlot(): MealPlanPickValue {
  const h = new Date().getHours()
  return h < 15 ? 'today-lunch' : 'today-dinner'
}

function DishResult({ dish }: { dish: DrawDishResult }) {
  return (
    <div className="result-card hand-drawn p-6">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <CookingIcon />
        </div>
        <div className="flex-1 pt-2">
          <h3 className="text-2xl font-bold text-[#3E3A39]">{dish.name}</h3>
        </div>
      </div>
    </div>
  )
}

function RestaurantResult({
  restaurant,
}: {
  restaurant: DrawRestaurantResult
}) {
  return (
    <div className="result-card hand-drawn p-6">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <DiningIcon />
        </div>
        <div className="flex-1 pt-2">
          <h3 className="text-2xl font-bold text-[#3E3A39] mb-2">{restaurant.name}</h3>
          {restaurant.dishes && restaurant.dishes.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {restaurant.dishes.map((dish, i) => (
                <span 
                  key={i}
                  className="px-2 py-0.5 text-xs bg-[#D97757]/12 text-[#D97757] rounded-md border border-[#D97757]/20"
                >
                  {dish}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const MEAL_SLOT_LABEL: Record<MealPlanPickValue, string> = {
  'today-lunch': '今日午餐',
  'today-dinner': '今日晚餐',
  'tomorrow-lunch': '明日午餐',
  'tomorrow-dinner': '明日晚餐',
}

export function NoPlanView({ onGoToCook }: NoPlanViewProps) {
  const router = useRouter()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [result, setResult] = useState<RandomResult>({ type: null, data: null, selectedTags: [] })
  const [isRevealing, setIsRevealing] = useState(false)
  const [showTagSelection, setShowTagSelection] = useState(false)
  const [confirmingPlan, setConfirmingPlan] = useState(false)

  const handleRandomClick = () => {
    setResult({ type: null, data: null, selectedTags: [] })
    setShowTagSelection(false)
    setIsDrawerOpen(true)
  }

  const handleChoice = (choice: 'cook' | 'eat-out') => {
    if (choice === 'cook') {
      setShowTagSelection(true)
      return
    }

    void (async () => {
      setIsRevealing(true)
      const [, { restaurant, error }] = await Promise.all([
        new Promise<void>((r) => setTimeout(r, 600)),
        drawRandomRestaurant(),
      ])
      setIsRevealing(false)
      if (error || !restaurant) {
        toast.error(error ?? '抽签失败')
        return
      }
      setResult({
        type: 'restaurant',
        data: {
          id: restaurant.id,
          name: restaurant.name,
          dishes: restaurant.signature_dishes ?? [],
        },
        selectedTags: [],
      })
    })()
  }

  const handleTagSelect = (tagId: string) => {
    void (async () => {
      setIsRevealing(true)
      setShowTagSelection(false)
      const [, { recipe, error }] = await Promise.all([
        new Promise<void>((r) => setTimeout(r, 600)),
        drawRandomRecipe(tagId),
      ])
      setIsRevealing(false)
      if (error || !recipe) {
        toast.error(error ?? '抽签失败')
        return
      }
      setResult({
        type: 'dish',
        data: { id: recipe.id, name: recipe.name },
        selectedTags: [tagId],
      })
    })()
  }

  const handleReroll = () => {
    void (async () => {
      setIsRevealing(true)
      if (result.type === 'dish') {
        const tagId = result.selectedTags?.[0] ?? null
        const [, { recipe, error }] = await Promise.all([
          new Promise<void>((r) => setTimeout(r, 600)),
          drawRandomRecipe(tagId),
        ])
        setIsRevealing(false)
        if (error || !recipe) {
          toast.error(error ?? '抽签失败')
          return
        }
        setResult((prev) => ({
          ...prev,
          data: { id: recipe.id, name: recipe.name },
        }))
      } else {
        const [, { restaurant, error }] = await Promise.all([
          new Promise<void>((r) => setTimeout(r, 600)),
          drawRandomRestaurant(),
        ])
        setIsRevealing(false)
        if (error || !restaurant) {
          toast.error(error ?? '抽签失败')
          return
        }
        setResult({
          type: 'restaurant',
          data: {
            id: restaurant.id,
            name: restaurant.name,
            dishes: restaurant.signature_dishes ?? [],
          },
          selectedTags: [],
        })
      }
    })()
  }

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false)
    setResult({ type: null, data: null, selectedTags: [] })
    setShowTagSelection(false)
    setConfirmingPlan(false)
  }

  const handleConfirmDraw = () => {
    if (result.type !== 'dish' || !result.data) {
      handleCloseDrawer()
      return
    }
    if (confirmingPlan) return

    void (async () => {
      setConfirmingPlan(true)
      const slot = pickTodayMealSlot()
      const res = await addRecipeToMealPlan((result.data as DrawDishResult).id, slot)
      setConfirmingPlan(false)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      if (res.duplicate) {
        toast.message(`「${(result.data as DrawDishResult).name}」已在${MEAL_SLOT_LABEL[slot]}`)
      } else {
        toast.success(`已加入${MEAL_SLOT_LABEL[slot]}：「${(result.data as DrawDishResult).name}」`)
      }
      handleCloseDrawer()
      router.refresh()
    })()
  }

  const godDrawer = isDrawerOpen ? (
    <div className="fixed inset-0 z-[60] flex min-h-0 items-center justify-center px-5 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-fade-in"
        onClick={handleCloseDrawer}
        aria-hidden
      />
      <div className="relative z-10 w-full max-w-sm max-h-[min(90dvh,calc(100%-1.5rem))] shrink-0 overflow-y-auto overscroll-contain rounded-2xl bg-[#F5F1E8] paper-bg shadow-xl animate-scale-in">
        {/* 标题 */}
        <div className="text-center pt-6 pb-4 px-6">
          <h2 className="text-xl font-bold text-[#3E3A39]">
            {result.type ? '食神的安排' : showTagSelection ? '想吃点什么？' : '今天怎么吃？'}
          </h2>
        </div>

        <div className="px-6 pb-6">
          {isRevealing ? (
            <div className="flex h-40 items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <DiceIcon className="w-12 h-12 text-[#D97757] animate-shake" />
                <span className="text-base font-medium text-[#6B6560] animate-pulse-soft">抽签中...</span>
              </div>
            </div>
          ) : result.type ? (
            <div className="space-y-5 animate-scale-in">
              {result.type === 'dish' && result.data && (
                <DishResult dish={result.data as DrawDishResult} />
              )}
              {result.type === 'restaurant' && result.data && (
                <RestaurantResult restaurant={result.data as DrawRestaurantResult} />
              )}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  className="flex-1 py-3 rounded-2xl border-2 border-[#C9C5BD] text-[#6B6560] font-medium hover:bg-[#D9D5CD]/50 transition-all btn-press disabled:opacity-50"
                  onClick={handleReroll}
                  disabled={confirmingPlan}
                >
                  再抽一次
                </button>
                <button
                  type="button"
                  className="flex-1 py-3 rounded-2xl bg-[#3E3A39] text-[#FDFBF7] font-medium hover:bg-[#2A2625] transition-all btn-press disabled:opacity-50"
                  onClick={result.type === 'dish' ? handleConfirmDraw : handleCloseDrawer}
                  disabled={confirmingPlan}
                >
                  {confirmingPlan ? '保存中…' : '就这个了'}
                </button>
              </div>
            </div>
          ) : showTagSelection ? (
            <div className="grid grid-cols-2 gap-3">
              {recipeCategories.map((cat, index) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleTagSelect(cat.id)}
                  className="option-card hand-drawn flex items-center justify-center gap-2 p-4 rounded-2xl stagger-item btn-press"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <span className="font-semibold text-[#3E3A39]">{cat.label}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="grid gap-4">
              <button
                type="button"
                onClick={() => handleChoice('cook')}
                className="option-card hand-drawn flex items-center gap-4 p-5 rounded-2xl stagger-item btn-press"
              >
                <CookingIcon />
                <span className="font-semibold text-[#3E3A39] text-lg">亲自下厨</span>
              </button>
              <button
                type="button"
                onClick={() => handleChoice('eat-out')}
                className="option-card hand-drawn flex items-center gap-4 p-5 rounded-2xl stagger-item btn-press"
              >
                <DiningIcon />
                <span className="font-semibold text-[#3E3A39] text-lg">下馆子</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  ) : null

  return (
    <>
    <div className="flex flex-1 flex-col items-center justify-center px-6 min-h-[70vh]">
      {/* 装饰性插画 */}
      <div className="mb-8 opacity-80">
        <svg width="120" height="80" viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="60" cy="55" rx="45" ry="18" stroke="#C9C5BD" strokeWidth="2" fill="none" />
          <ellipse cx="60" cy="55" rx="35" ry="12" stroke="#C9C5BD" strokeWidth="1.5" strokeDasharray="4 4" fill="none" />
          <text x="60" y="45" textAnchor="middle" fontSize="28" fill="#9A9590" fontFamily="serif">?</text>
          <path d="M15 35C20 30 25 32 30 28" stroke="#C9C5BD" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M90 28C95 32 100 30 105 35" stroke="#C9C5BD" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>

      {/* 主提示语 */}
      <div className="mb-10 w-full flex justify-center">
        <h2 className="text-3xl font-bold text-[#3E3A39] tracking-wide text-center">
          今天吃点啥？
        </h2>
      </div>

      {/* 按钮组 - 纵向排列 */}
      <div className="flex flex-col items-center gap-3 w-full max-w-[200px]">
        {/* 去点菜按钮 - 在上面，主要按钮 */}
        <button
          onClick={onGoToCook}
          className="w-full h-12 px-6 rounded-2xl vintage-btn text-[#FDFBF7] font-medium inline-flex items-center justify-center gap-2.5 btn-press hover:scale-[1.02] transition-transform"
        >
          <ChefHat className="w-5 h-5 flex-shrink-0" />
          <span className="leading-none">去点菜</span>
        </button>

        {/* 问问食神按钮 - 在下面，次要按钮 */}
        <button
          onClick={handleRandomClick}
          className="w-full h-12 px-6 rounded-2xl bg-[#E8E4DC] text-[#3E3A39] font-medium inline-flex items-center justify-center gap-2.5 btn-press hover:bg-[#D9D5CD] transition-all border border-[#C9C5BD]"
        >
          <DiceIcon className="w-5 h-5 flex-shrink-0" />
          <span className="leading-none">问问食神</span>
        </button>
      </div>

    </div>

    {godDrawer ? createPortal(godDrawer, document.body) : null}
    </>
  )
}
