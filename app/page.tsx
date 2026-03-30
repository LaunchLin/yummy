import { HomeClient } from '@/components/home-client'
import { getTodayArrange } from '@/lib/data/arrange'

/** 安排页依赖当日 meal_plans 与 Supabase，构建阶段不预渲染（避免 CI 无 .env 失败） */
export const dynamic = 'force-dynamic'

export default async function Home() {
  const arrange = await getTodayArrange()

  const payload = arrange.hasPlan
    ? {
        hasPlan: true as const,
        meals: arrange.meals,
        recipes: arrange.recipes,
        ingredients: arrange.ingredients,
      }
    : { hasPlan: false as const }

  return <HomeClient arrange={payload} />
}
