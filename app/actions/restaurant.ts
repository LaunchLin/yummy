'use server'

import { revalidatePath } from 'next/cache'

import { encodeRestaurantNotes } from '@/lib/restaurant-notes'
import { createClient } from '@/utils/supabase/server'

export type RestaurantFormPayload = {
  name: string
  rating: number
  dishes: string[]
  badDishes: string[]
  note: string
}

export async function createRestaurant(data: RestaurantFormPayload) {
  const supabase = await createClient()
  const notes = encodeRestaurantNotes(data.note, data.badDishes)
  const { error } = await supabase.from('restaurants').insert({
    name: data.name,
    rating: data.rating,
    signature_dishes: data.dishes,
    notes,
  })
  if (error) return { ok: false as const, error: error.message }
  revalidatePath('/')
  return { ok: true as const }
}

export async function updateRestaurant(id: string, data: RestaurantFormPayload) {
  const supabase = await createClient()
  const notes = encodeRestaurantNotes(data.note, data.badDishes)
  const { error } = await supabase
    .from('restaurants')
    .update({
      name: data.name,
      rating: data.rating,
      signature_dishes: data.dishes,
      notes,
    })
    .eq('id', id)
  if (error) return { ok: false as const, error: error.message }
  revalidatePath('/')
  return { ok: true as const }
}

export async function deleteRestaurant(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('restaurants').delete().eq('id', id)
  if (error) return { ok: false as const, error: error.message }
  revalidatePath('/')
  return { ok: true as const }
}
