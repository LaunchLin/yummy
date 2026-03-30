import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

import { getSupabaseCredentials } from '@/utils/supabase/env'

/**
 * 服务端 Supabase 客户端（Server Components、Server Actions、Route Handlers）
 */
export async function createClient() {
  const { url, anonKey } = getSupabaseCredentials()

  const cookieStore = await cookies()

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          )
        } catch {
          // 在仅读取 Cookie 的 Server Component 中调用 set 可能失败，忽略即可
        }
      },
    },
  })
}
