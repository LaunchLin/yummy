'use client'

import { useCallback, useMemo, useState } from 'react'

import { BottomNav } from '@/components/bottom-nav'
import { CookView } from '@/components/cook-view'
import { MealPlanView } from '@/components/meal-plan-view'
import { NoPlanView } from '@/components/no-plan-view'
import { RestaurantView } from '@/components/restaurant-view'
import type { Ingredient } from '@/lib/mock-data'
import type { MealScheduleItem, RecipeRow } from '@/lib/types/database'

export type ArrangePayload =
  | { hasPlan: false }
  | {
      hasPlan: true
      meals: MealScheduleItem[]
      recipes: RecipeRow[]
      ingredients: Ingredient[]
    }

export function HomeClient({ arrange }: { arrange: ArrangePayload }) {
  const [activeTab, setActiveTab] = useState('arrange')

  const goToCook = useCallback(() => {
    setActiveTab('cook')
  }, [])

  const arrangeKey = useMemo(() => {
    if (!arrange.hasPlan) return 'no-plan'
    return arrange.meals
      .map(
        (m) =>
          `${m.planId}:${m.dishes.map((d) => d.recipeId).sort().join(',')}`,
      )
      .join('|')
  }, [arrange])

  return (
    <div className="flex min-h-screen flex-col paper-bg pb-24">
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 py-5">
        <div key={activeTab} className="animate-page-enter">
          {activeTab === 'arrange' &&
            (arrange.hasPlan ? (
              <MealPlanView
                key={arrangeKey}
                meals={arrange.meals}
                recipes={arrange.recipes}
                ingredients={arrange.ingredients}
              />
            ) : (
              <NoPlanView onGoToCook={goToCook} />
            ))}

          {activeTab === 'cook' && <CookView />}

          {activeTab === 'restaurant' && <RestaurantView />}
        </div>
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}
