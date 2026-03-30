'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import { X, Star, Plus, ArrowLeft, ThumbsDown } from 'lucide-react'

interface CreateRestaurantPageProps {
  onBack: () => void
  onSave: (data: { name: string; rating: number; dishes: string[]; badDishes: string[]; note: string }) => void
  initialData?: { name: string; rating: number; dishes: string[]; badDishes: string[]; note: string }
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

export function CreateRestaurantPage({ onBack, onSave, initialData }: CreateRestaurantPageProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

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
    onBack()
  }

  const overlay = (
    <div className="fixed inset-0 z-[60] flex w-full max-w-none flex-col overflow-hidden bg-[#F5F1E8] paper-bg pt-[env(safe-area-inset-top)] [height:100dvh] max-h-[100dvh]">
      <div className="shrink-0 border-b border-[#C9C5BD] bg-[#F5F1E8]/95 px-5 py-4 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <button type="button" onClick={onBack} className="text-[#6B6560] hover:text-[#3E3A39] btn-press">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h3 className="text-lg font-bold text-[#3E3A39]">
            {initialData ? '编辑餐厅' : '记录新餐厅'}
          </h3>
          <div className="w-5" />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-5 space-y-5 pb-2">
        <div>
          <label className="block text-xs text-[#9A9590] mb-2">餐厅名称</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="叫什么名字..."
            className="w-full px-3 py-2.5 rounded-xl bg-[#E8E4DC] border border-[#C9C5BD] text-[#3E3A39] text-sm focus:outline-none focus:border-[#D97757]"
          />
        </div>
        
        <div>
          <label className="block text-xs text-[#9A9590] mb-2">美味指数</label>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className="p-1"
              >
                <Star
                  className={`w-7 h-7 ${star <= rating ? 'text-[#E8B86D] fill-[#E8B86D]' : 'text-[#C9C5BD]'}`}
                />
              </button>
            ))}
          </div>
        </div>
        
        <div className="note-card hand-drawn p-4">
          <label className="block text-xs text-[#9A9590] mb-3">招牌菜</label>
          <div className="flex flex-wrap gap-1.5 mb-3">
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

        <div className="note-card hand-drawn p-4">
          <label className="block text-xs text-[#9A9590] mb-3">雷品</label>
          <div className="flex flex-wrap gap-1.5 mb-3">
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
              className="p-2 rounded-xl bg-[#E8E4DC] text-[#6B6560] hover:bg-[#D4CCC0]"
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
            rows={4}
            className="w-full px-3 py-2.5 rounded-xl bg-[#E8E4DC] border border-[#C9C5BD] text-[#3E3A39] text-sm focus:outline-none focus:border-[#D97757] resize-none"
          />
        </div>
      </div>

      <div className="shrink-0 border-t border-[#C9C5BD] bg-[#F5F1E8]/95 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-sm">
        <button
          type="button"
          onClick={handleSave}
          className="w-full vintage-btn py-3 text-base font-medium text-white"
        >
          {initialData ? '保存修改' : '添加餐厅'}
        </button>
      </div>
    </div>
  )

  if (!mounted) return null
  return createPortal(overlay, document.body)
}
