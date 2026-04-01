import { HomeClient } from '@/components/home-client'
import { getTodayArrange } from '@/lib/data/arrange'
import { getRecipeSummariesForCook } from '@/lib/data/recipe-list'

/** 安排页依赖当日 meal_plans 与 Supabase，构建阶段不预渲染（避免 CI 无 .env 失败） */
export const dynamic = 'force-dynamic'

export default async function Home() {
  const [arrange, recipeSummaries] = await Promise.all([
    getTodayArrange(),
    getRecipeSummariesForCook().catch((err) => {
      console.error('getRecipeSummariesForCook', err)
      return []
    }),
  ])

  const payload = arrange.hasPlan
    ? {
        hasPlan: true as const,
        meals: arrange.meals,
        recipes: arrange.recipes,
        ingredients: arrange.ingredients,
      }
    : { hasPlan: false as const }

  return <HomeClient arrange={payload} recipeSummaries={recipeSummaries} />
}
