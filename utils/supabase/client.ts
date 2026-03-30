import { createBrowserClient } from '@supabase/ssr'

import { getSupabaseCredentials } from '@/utils/supabase/env'

/**
 * 浏览器端 Supabase 客户端（Client Components、事件处理里使用）
 */
export function createClient() {
  const { url, anonKey } = getSupabaseCredentials()
  return createBrowserClient(url, anonKey)
}
