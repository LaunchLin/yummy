'use client'

import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { X, Star, Plus, Search, ThumbsDown, Edit2, Trash2, Sparkles } from 'lucide-react'

import {
  createRestaurant,
  deleteRestaurant,
  updateRestaurant,
} from '@/app/actions/restaurant'
import {
  addRestaurantWishlistItem,
  listRestaurantWishlist,
  removeRestaurantWishlistItem,
} from '@/app/actions/restaurant-wishlist'
import { decodeRestaurantNotes } from '@/lib/restaurant-notes'
import type { RestaurantRow } from '@/lib/types/database'
import { createClient } from '@/utils/supabase/client'
import { CreateRestaurantPage } from './create-restaurant-page'

export type RestaurantListItem = {
  id: string
  name: string
  rating: number
  dishes: string[]
  badDishes: string[]
  note: string
}

type WishlistItem = { id: string; name: string; addedAt: number }

const WISHLIST_KEY = 'yummy.restaurant_wishlist.v1'
const WISHLIST_CLIENT_KEY = 'yummy.restaurant_wishlist.client_id.v1'

function safeGetClientId(): string {
  if (typeof window === 'undefined') return ''
  try {
    const existing = window.localStorage.getItem(WISHLIST_CLIENT_KEY)
    if (existing && existing.trim()) return existing.trim()
    const id = `c-${Date.now()}-${Math.random().toString(16).slice(2)}`
    window.localStorage.setItem(WISHLIST_CLIENT_KEY, id)
    return id
  } catch {
    return ''
  }
}

function safeLoadWishlist(): WishlistItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(WISHLIST_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .map((x) => ({
        id: String(x?.id ?? '').trim(),
        name: String(x?.name ?? '').trim(),
        addedAt: Number(x?.addedAt ?? Date.now()),
      }))
      .filter((x) => x.id && x.name)
  } catch {
    return []
  }
}

function safeSaveWishlist(list: WishlistItem[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(WISHLIST_KEY, JSON.stringify(list))
  } catch {
    // ignore
  }
}

function rowToListItem(r: RestaurantRow): RestaurantListItem {
  const { note, badDishes } = decodeRestaurantNotes(r.notes ?? '')
  return {
    id: r.id,
    name: r.name,
    rating: r.rating,
    dishes: r.signature_dishes ?? [],
    badDishes,
    note,
  }
}

// 复古五星评分组件
function StarRating({ rating, onRatingChange }: { rating: number; onRatingChange?: (rating: number) => void }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => onRatingChange?.(star)}
          disabled={!onRatingChange}
          className={onRatingChange ? 'cursor-pointer' : 'cursor-default'}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            className={star <= rating ? 'text-[#E8B86D]' : 'text-[#C9C5BD]'}
          >
            <path
              d="M7 1L8.5 5H13L9.5 8L10.5 12.5L7 10L3.5 12.5L4.5 8L1 5H5.5L7 1Z"
              fill="currentColor"
              stroke="currentColor"
              strokeWidth="0.5"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      ))}
    </div>
  )
}

// 招牌菜 Chip
function DishChip({ name, onRemove, isBad }: { name: string; onRemove?: () => void; isBad?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-md border ${
      isBad 
        ? 'bg-[#6B6560]/10 text-[#6B6560] border-[#6B6560]/20 line-through' 
        : 'bg-[#D97757]/12 text-[#D97757] border-[#D97757]/20'
    }`}>
      {isBad && <ThumbsDown className="w-3 h-3" />}
      {name}
      {onRemove && (
        <button onClick={onRemove} className={isBad ? 'hover:text-[#3E3A39]' : 'hover:text-[#C45A36]'}>
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  )
}

// 长按操作弹窗
function LongPressActionSheet({
  open,
  onClose,
  restaurantName,
  onEdit,
  onDelete
}: {
  open: boolean
  onClose: () => void
  restaurantName: string
  onEdit: () => void
  onDelete: () => void
}) {
  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[60]">
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-black/30 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-label="关闭"
      />
      <div className="absolute bottom-0 left-0 right-0 z-10 flex justify-center px-0 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:right-auto sm:-translate-x-1/2 sm:-translate-y-1/2 sm:p-4">
        <div className="w-full max-w-md overflow-hidden rounded-t-2xl bg-[#F5F1E8] paper-bg shadow-2xl animate-slide-up sm:rounded-2xl">
          <div className="px-5 py-4 border-b border-[#C9C5BD]">
            <h3 className="text-base font-bold text-[#3E3A39] text-center">{restaurantName}</h3>
          </div>
          <div className="p-2">
            <button
              type="button"
              onClick={() => {
                onEdit()
                onClose()
              }}
              className="w-full px-4 py-3 text-left text-base text-[#3E3A39] hover:bg-[#E8E4DC] rounded-xl transition-colors flex items-center gap-3"
            >
              <Edit2 className="w-5 h-5 text-[#6B6560]" />
              编辑餐厅
            </button>
            <button
              type="button"
              onClick={() => {
                onDelete()
                onClose()
              }}
              className="w-full px-4 py-3 text-left text-base text-[#D97757] hover:bg-[#E8E4DC] rounded-xl transition-colors flex items-center gap-3"
            >
              <Trash2 className="w-5 h-5" />
              删除餐厅
            </button>
          </div>
          <div className="p-2 pt-0">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 text-base text-[#6B6560] bg-[#E8E4DC] rounded-xl hover:bg-[#D4CCC0] transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

// 添加/编辑餐厅弹窗
function RestaurantFormModal({
  open,
  onClose,
  onSave,
  initialData
}: {
  open: boolean
  onClose: () => void
  onSave: (data: { name: string; rating: number; dishes: string[]; badDishes: string[]; note: string }) => void
  initialData?: { name: string; rating: number; dishes: string[]; badDishes: string[]; note: string }
}) {
  const [name, setName] = useState(initialData?.name || '')
  const [rating, setRating] = useState(initialData?.rating ?? 0)
  const [dishes, setDishes] = useState<string[]>(initialData?.dishes || [])
  const [badDishes, setBadDishes] = useState<string[]>(initialData?.badDishes || [])
  const [newDish, setNewDish] = useState('')
  const [newBadDish, setNewBadDish] = useState('')
  const [note, setNote] = useState(initialData?.note || '')

  const handleAddDish = () => {
    if (!newDish.trim()) return
    setDishes(prev => [...prev, newDish.trim()])
    setNewDish('')
  }

  const handleRemoveDish = (index: number) => {
    setDishes(prev => prev.filter((_, i) => i !== index))
  }

  const handleAddBadDish = () => {
    if (!newBadDish.trim()) return
    setBadDishes(prev => [...prev, newBadDish.trim()])
    setNewBadDish('')
  }

  const handleRemoveBadDish = (index: number) => {
    setBadDishes(prev => prev.filter((_, i) => i !== index))
  }

  const handleSave = () => {
    if (!name.trim()) {
      toast.error('请输入餐厅名称')
      return
    }
    onSave({
      name: name.trim(),
      rating,
      dishes,
      badDishes,
      note: note.trim(),
    })
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-[#F5F1E8] rounded-2xl overflow-hidden paper-bg max-h-[80vh] overflow-y-auto animate-scale-in">
        <div className="sticky top-0 bg-[#F5F1E8]/95 backdrop-blur-sm border-b border-[#C9C5BD] px-5 py-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-[#3E3A39]">
            {initialData ? '编辑餐厅' : '记录新餐厅'}
          </h3>
          <button onClick={onClose} className="text-[#6B6560] hover:text-[#3E3A39]">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs text-[#9A9590] mb-2">餐厅名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="叫什么名字..."
              className="w-full px-3 py-2 rounded-xl bg-[#E8E4DC] border border-[#C9C5BD] text-[#3E3A39] text-sm focus:outline-none focus:border-[#D97757]"
            />
          </div>
          
          <div>
            <label className="block text-xs text-[#9A9590] mb-2">美味指数</label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1"
                >
                  <Star
                    className={`w-6 h-6 ${star <= rating ? 'text-[#E8B86D] fill-[#E8B86D]' : 'text-[#C9C5BD]'}`}
                  />
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-xs text-[#9A9590] mb-2">招牌菜</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {dishes.map((dish, i) => (
                <DishChip key={i} name={dish} onRemove={() => handleRemoveDish(i)} />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newDish}
                onChange={(e) => setNewDish(e.target.value)}
                placeholder="添加招牌菜..."
                className="flex-1 px-3 py-2 rounded-xl bg-[#E8E4DC] border border-[#C9C5BD] text-[#3E3A39] text-sm focus:outline-none focus:border-[#D97757]"
                onKeyDown={(e) => e.key === 'Enter' && handleAddDish()}
              />
              <button
                onClick={handleAddDish}
                className="p-2 rounded-xl bg-[#E8E4DC] text-[#6B6560] hover:bg-[#D4CCC0] hover:text-[#D97757]"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs text-[#9A9590] mb-2">雷品</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {badDishes.map((dish, i) => (
                <DishChip key={i} name={dish} onRemove={() => handleRemoveBadDish(i)} isBad />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newBadDish}
                onChange={(e) => setNewBadDish(e.target.value)}
                placeholder="添加踩雷菜品..."
                className="flex-1 px-3 py-2 rounded-xl bg-[#E8E4DC] border border-[#C9C5BD] text-[#3E3A39] text-sm focus:outline-none focus:border-[#D97757]"
                onKeyDown={(e) => e.key === 'Enter' && handleAddBadDish()}
              />
              <button
                onClick={handleAddBadDish}
                className="p-2 rounded-xl bg-[#E8E4DC] text-[#6B6560] hover:bg-[#D4CCC0] hover:text-[#6B6560]"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-xs text-[#9A9590] mb-2">备注</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder=""
              rows={3}
              className="w-full px-3 py-2 rounded-xl bg-[#E8E4DC] border border-[#C9C5BD] text-[#3E3A39] text-sm focus:outline-none focus:border-[#D97757] resize-none"
            />
          </div>
        </div>
        
        <div className="sticky bottom-0 bg-[#F5F1E8]/95 backdrop-blur-sm border-t border-[#C9C5BD] px-5 py-4">
          <button
            onClick={handleSave}
            className="w-full vintage-btn text-white py-2.5 rounded-xl text-sm font-medium"
          >
            {initialData ? '保存修改' : '添加餐厅'}
          </button>
        </div>
      </div>
    </div>
  )
}

// 餐厅条目组件 - 支持长按
function RestaurantItem({
  restaurant,
  onEdit,
  onDelete,
  index,
}: {
  restaurant: RestaurantListItem
  onEdit: () => void
  onDelete: () => void
  index: number
}) {
  const [showActionSheet, setShowActionSheet] = useState(false)
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  const isLongPress = useRef(false)

  const handleTouchStart = useCallback(() => {
    isLongPress.current = false
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true
      setShowActionSheet(true)
    }, 500)
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }, [])

  const handleTouchMove = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }, [])

  return (
    <>
      <div 
        className="relative p-4 note-card hand-drawn mb-4 stagger-item card-hover select-none"
        style={{ animationDelay: `${index * 60}ms` }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        onMouseDown={handleTouchStart}
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
        onContextMenu={(e) => {
          e.preventDefault()
          setShowActionSheet(true)
        }}
      >
        {/* 内容区 */}
        <div className="pr-6">
          {/* 餐厅名和评分 */}
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-base font-bold text-[#3E3A39] tracking-wide">{restaurant.name}</h3>
            <StarRating rating={restaurant.rating} />
          </div>
          
          {/* 招牌菜 */}
          {restaurant.dishes.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {restaurant.dishes.map((dish, i) => (
                <DishChip key={i} name={dish} />
              ))}
            </div>
          )}

          {/* 雷品 */}
          {restaurant.badDishes && restaurant.badDishes.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {restaurant.badDishes.map((dish, i) => (
                <DishChip key={i} name={dish} isBad />
              ))}
            </div>
          )}
          
          {/* 备注 */}
          {restaurant.note && (
            <p className="text-xs text-[#6B6560] italic leading-relaxed border-l-2 border-[#E8B86D]/50 pl-2">
              {restaurant.note}
            </p>
          )}
        </div>
        
        {/* 装饰元素 - 打孔效果 */}
        <div className="absolute right-3 top-3 w-3 h-3 rounded-full border-2 border-[#C9C5BD] bg-[#E8E4DC]" />
      </div>

      {/* 长按操作弹窗 */}
      <LongPressActionSheet
        open={showActionSheet}
        onClose={() => setShowActionSheet(false)}
        restaurantName={restaurant.name}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </>
  )
}

function WishlistModal({
  open,
  onClose,
  items,
  onRemove,
  onAdd,
}: {
  open: boolean
  onClose: () => void
  items: WishlistItem[]
  onRemove: (id: string) => void
  onAdd: (name: string) => void
}) {
  if (!open) return null
  const [name, setName] = useState('')
  const sorted = [...items].sort((a, b) => b.addedAt - a.addedAt)
  return createPortal(
    <div className="fixed inset-0 z-[60]">
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-black/30 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-label="关闭"
      />
      <div className="absolute bottom-0 left-0 right-0 z-10 flex justify-center px-0 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:right-auto sm:-translate-x-1/2 sm:-translate-y-1/2 sm:p-4">
        <div className="w-full max-w-md overflow-hidden rounded-t-2xl bg-[#F5F1E8] paper-bg shadow-2xl animate-slide-up sm:rounded-2xl">
          <div className="px-5 py-4 border-b border-[#C9C5BD] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#D97757]" />
              <h3 className="text-base font-bold text-[#3E3A39]">心愿单</h3>
            </div>
            <button type="button" onClick={onClose} className="text-[#6B6560] hover:text-[#3E3A39] btn-press">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-4 border-b border-[#C9C5BD]">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="想去的餐厅…"
                className="flex-1 px-3 py-2 rounded-xl bg-[#E8E4DC] border border-[#C9C5BD] text-[#3E3A39] text-sm focus:outline-none focus:border-[#D97757]"
                onKeyDown={(e) => {
                  if (e.key !== 'Enter') return
                  const v = name.trim()
                  if (!v) return
                  onAdd(v)
                  setName('')
                }}
              />
              <button
                type="button"
                onClick={() => {
                  const v = name.trim()
                  if (!v) return
                  onAdd(v)
                  setName('')
                }}
                className="w-9 h-9 flex items-center justify-center vintage-btn text-white rounded-xl btn-press"
                aria-label="添加"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-2 max-h-[52vh] overflow-y-auto">
            {sorted.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-[#9A9590]">
                还没有想去的餐厅
              </div>
            ) : (
              sorted.map((it) => (
                <div
                  key={it.id}
                  className="px-4 py-3 rounded-xl hover:bg-[#E8E4DC] transition-colors flex items-center justify-between"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-[#3E3A39] truncate">{it.name}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemove(it.id)}
                    className="p-2 rounded-xl text-[#D97757] hover:bg-[#D97757]/10 btn-press"
                    aria-label="移除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
          <div className="p-2 pt-0">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 text-base text-[#6B6560] bg-[#E8E4DC] rounded-xl hover:bg-[#D4CCC0] transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export function RestaurantView() {
  const router = useRouter()
  const [restaurants, setRestaurants] = useState<RestaurantListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingRestaurant, setEditingRestaurant] = useState<RestaurantListItem | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [showWishlist, setShowWishlist] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  const [wishlist, setWishlist] = useState<WishlistItem[]>(() => safeLoadWishlist())
  const clientIdRef = useRef<string>('')

  const mergeAndSaveWishlist = useCallback((next: WishlistItem[]) => {
    const deduped: WishlistItem[] = []
    const seen = new Set<string>()
    for (const it of next) {
      const n = it.name.trim()
      if (!n) continue
      const key = n.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      deduped.push({ ...it, name: n })
    }
    const finalList = deduped
      .sort((a, b) => b.addedAt - a.addedAt)
      .slice(0, 200)
    safeSaveWishlist(finalList)
    return finalList
  }, [])

  const addToWishlist = useCallback(
    (name: string) => {
      const cid = clientIdRef.current
      const trimmed = name.trim()
      if (!trimmed) return
      const tempId = `tmp-${Date.now()}-${Math.random().toString(16).slice(2)}`

      setWishlist((prev) => {
        if (prev.some((x) => x.name.trim().toLowerCase() === trimmed.toLowerCase())) return prev
        return mergeAndSaveWishlist([{ id: tempId, name: trimmed, addedAt: Date.now() }, ...prev])
      })
      toast.success(`已加入心愿单「${trimmed}」`)

      if (!cid) return
      void (async () => {
        const res = await addRestaurantWishlistItem(cid, trimmed)
        if (!res.ok) {
          toast.error(res.error)
          return
        }
        setWishlist((prev) => {
          const replaced = prev.map((x) =>
            x.id === tempId ? { id: res.row.id, name: res.row.name, addedAt: Date.parse(res.row.created_at) || x.addedAt } : x,
          )
          return mergeAndSaveWishlist(replaced)
        })
      })()
    },
    [mergeAndSaveWishlist],
  )

  const removeFromWishlist = useCallback((id: string) => {
    const cid = clientIdRef.current
    setWishlist((prev) => mergeAndSaveWishlist(prev.filter((x) => x.id !== id)))
    toast.success('已从心愿单移除')
    if (!cid) return
    void (async () => {
      const res = await removeRestaurantWishlistItem(cid, id)
      if (!res.ok) toast.error(res.error)
    })()
  }, [])

  const loadRestaurants = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) {
        toast.error(error.message)
        setRestaurants([])
      } else {
        setRestaurants(((data ?? []) as RestaurantRow[]).map(rowToListItem))
      }
    } catch {
      toast.error('加载餐厅失败')
      setRestaurants([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadRestaurants()
  }, [loadRestaurants])

  useEffect(() => {
    // 初始化 clientId + 从云端拉取心愿单（本地秒开，云端覆盖/合并）
    clientIdRef.current = safeGetClientId()
    const local = safeLoadWishlist()
    if (local.length) setWishlist(local)

    const cid = clientIdRef.current
    if (!cid) return
    void (async () => {
      const res = await listRestaurantWishlist(cid)
      if (!res.ok) return
      const cloud: WishlistItem[] = res.rows.map((r) => ({
        id: r.id,
        name: r.name,
        addedAt: Date.parse(r.created_at) || Date.now(),
      }))
      setWishlist((prev) => mergeAndSaveWishlist([...cloud, ...prev]))
    })()
  }, [])

  // 点击页面其他地方关闭搜索框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isSearching && searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearching(false)
        setSearchQuery('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isSearching])

  // 搜索结果
  const filteredRestaurants = useMemo(() => {
    if (!searchQuery.trim()) return restaurants
    const query = searchQuery.toLowerCase()
    return restaurants.filter(r => 
      r.name.toLowerCase().includes(query) ||
      r.dishes.some(d => d.toLowerCase().includes(query)) ||
      (r.badDishes && r.badDishes.some(d => d.toLowerCase().includes(query))) ||
      (r.note && r.note.toLowerCase().includes(query))
    )
  }, [searchQuery, restaurants])

  const handleAddRestaurant = (data: {
    name: string
    rating: number
    dishes: string[]
    badDishes: string[]
    note: string
  }) => {
    void (async () => {
      const res = await createRestaurant(data)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success(`已添加「${data.name}」`)
      await loadRestaurants()
      router.refresh()
    })()
  }

  const handleEditRestaurant = (data: {
    name: string
    rating: number
    dishes: string[]
    badDishes: string[]
    note: string
  }) => {
    if (!editingRestaurant) return
    void (async () => {
      const res = await updateRestaurant(editingRestaurant.id, data)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success(`已更新「${data.name}」`)
      setEditingRestaurant(null)
      await loadRestaurants()
      router.refresh()
    })()
  }

  const handleDeleteRestaurant = (id: string) => {
    const restaurant = restaurants.find((r) => r.id === id)
    void (async () => {
      const res = await deleteRestaurant(id)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success(`已删除「${restaurant?.name ?? ''}」`)
      await loadRestaurants()
      router.refresh()
    })()
  }

  return (
    <div>
      {/* 头部 */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-[#3E3A39] tracking-wide">红榜餐厅</h2>
        
        <div className="flex items-center gap-2">
          {/* 搜索按钮 */}
          <button
            onClick={() => setIsSearching(!isSearching)}
            className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all btn-press ${
              isSearching ? 'bg-[#D97757] text-white' : 'bg-[#E8E4DC] text-[#6B6560] hover:bg-[#D4CCC0]'
            }`}
          >
            <Search className="w-4 h-4" />
          </button>

          {/* 心愿单入口 */}
          <button
            type="button"
            onClick={() => setShowWishlist(true)}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#E8E4DC] text-[#6B6560] hover:bg-[#D4CCC0] transition-colors btn-press"
            aria-label="心愿单"
          >
            <Sparkles className="w-4 h-4" />
          </button>
          
          {/* 新增餐厅按钮 */}
          <button 
            onClick={() => setShowForm(true)}
            className="w-9 h-9 flex items-center justify-center vintage-btn text-white rounded-xl btn-press"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 搜索栏 - 可折叠 */}
      {isSearching && (
        <div ref={searchRef} className="relative mb-4 animate-slide-down">
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#E8E4DC] border border-[#C9C5BD]">
            <Search className="w-4 h-4 text-[#9A9590]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索餐厅或菜品..."
              autoFocus
              className="flex-1 bg-transparent text-sm text-[#3E3A39] placeholder-[#9A9590] focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-[#9A9590] hover:text-[#3E3A39]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 装饰性标题 */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-[#3E3A39]" />
        <span className="text-xs text-[#6B6560] tracking-[0.3em] font-medium">RESTAURANT NOTES</span>
        <div className="flex-1 h-px bg-[#3E3A39]" />
      </div>

      {/* 餐厅列表 */}
      <div className="space-y-0">
        {loading ? (
          <div className="text-center py-12 text-sm text-[#9A9590]">觅食中</div>
        ) : filteredRestaurants.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[#9A9590]">
              {searchQuery.trim() ? '没找到相关餐厅' : '还没发现好吃的餐厅，还不快出门逛逛'}
            </p>
          </div>
        ) : (
          filteredRestaurants.map((restaurant, index) => (
            <RestaurantItem 
              key={restaurant.id} 
              restaurant={restaurant}
              index={index}
              onEdit={() => {
                setEditingRestaurant(restaurant)
                setShowForm(true)
              }}
              onDelete={() => handleDeleteRestaurant(restaurant.id)}
            />
          ))
        )}
      </div>

      {/* 底部装饰（有内容时才显示） */}
      {filteredRestaurants.length > 0 && (
        <div className="text-center py-6">
          <div className="inline-flex items-center gap-2 text-xs text-[#9A9590]">
            <span className="w-8 h-px bg-[#C9C5BD]" />
            <span>世界上咋那么多好吃的</span>
            <span className="w-8 h-px bg-[#C9C5BD]" />
          </div>
        </div>
      )}

      {/* 添加/编辑餐厅页面 */}
      {showForm && (
        <CreateRestaurantPage
          onBack={() => {
            setShowForm(false)
            setEditingRestaurant(null)
          }}
          onSave={editingRestaurant ? handleEditRestaurant : handleAddRestaurant}
          initialData={editingRestaurant || undefined}
        />
      )}

      <WishlistModal
        open={showWishlist}
        onClose={() => setShowWishlist(false)}
        items={wishlist}
        onRemove={removeFromWishlist}
        onAdd={addToWishlist}
      />
    </div>
  )
}
