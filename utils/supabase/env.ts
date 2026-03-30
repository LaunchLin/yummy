/**
 * 读取并校验 Supabase 环境变量（避免空格、缺协议等传入 SDK 触发难懂的报错）
 */
export function getSupabaseCredentials(): { url: string; anonKey: string } {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim()

  if (!url || !anonKey) {
    throw new Error(
      '缺少 NEXT_PUBLIC_SUPABASE_URL 或 NEXT_PUBLIC_SUPABASE_ANON_KEY。请在【项目根目录 吃啥Yummy】下的 .env.local 中填写，并重启 dev（不要只写在父目录）。',
    )
  }

  if (!/^https:\/\//i.test(url)) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL 必须是完整地址，且以 https:// 开头（示例：https://xxxx.supabase.co）。请检查 .env.local 是否多写了引号、少了协议，或误用了「Project ID」而不是 URL。',
    )
  }

  try {
    new URL(url)
  } catch {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL 不是合法 URL，请对照 Supabase 控制台 Project Settings → API 中的 Project URL。')
  }

  return { url, anonKey }
}
