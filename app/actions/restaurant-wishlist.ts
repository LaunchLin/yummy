'use server'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/utils/supabase/server'

export type WishlistRow = {
  id: string
  client_id: string
  name: string
  created_at: string
}

export async function listRestaurantWishlist(clientId: string) {
  const cid = String(clientId ?? '').trim()
  if (!cid) return { ok: false as const, error: 'clientId 缺失' }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('restaurant_wishlist')
    .select('id,client_id,name,created_at')
    .eq('client_id', cid)
    .order('created_at', { ascending: false })

  if (error) return { ok: false as const, error: error.message }
  return { ok: true as const, rows: (data ?? []) as WishlistRow[] }
}

export async function addRestaurantWishlistItem(clientId: string, name: string) {
  const cid = String(clientId ?? '').trim()
  const n = String(name ?? '').trim()
  if (!cid) return { ok: false as const, error: 'clientId 缺失' }
  if (!n) return { ok: false as const, error: '请输入餐厅名称' }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('restaurant_wishlist')
    .insert({ client_id: cid, name: n })
    .select('id,client_id,name,created_at')
    .single()

  if (error) return { ok: false as const, error: error.message }
  revalidatePath('/')
  return { ok: true as const, row: data as WishlistRow }
}

export async function removeRestaurantWishlistItem(clientId: string, id: string) {
  const cid = String(clientId ?? '').trim()
  const rid = String(id ?? '').trim()
  if (!cid) return { ok: false as const, error: 'clientId 缺失' }
  if (!rid) return { ok: false as const, error: 'id 缺失' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('restaurant_wishlist')
    .delete()
    .eq('client_id', cid)
    .eq('id', rid)

  if (error) return { ok: false as const, error: error.message }
  revalidatePath('/')
  return { ok: true as const }
}

