'use client'

import { useState, useRef } from 'react'
import { toast } from 'sonner'
import { Plus, X, Edit2, Trash2 } from 'lucide-react'

interface PantryModalProps {
  open: boolean
  onClose: () => void
}

// Mock 库存数据
const initialPantryData: Record<string, { name: string; quantity: string }[]> = {
  '干货杂粮': [
    { name: '大米', quantity: '5kg' },
    { name: '面粉', quantity: '2kg' },
    { name: '红豆', quantity: '500g' },
    { name: '绿豆', quantity: '300g' },
    { name: '花生米', quantity: '' },
  ],
  '调味料': [
    { name: '生抽', quantity: '1瓶' },
    { name: '老抽', quantity: '' },
    { name: '蚝油', quantity: '1瓶' },
    { name: '料酒', quantity: '' },
    { name: '白糖', quantity: '1袋' },
    { name: '盐', quantity: '2袋' },
    { name: '醋', quantity: '1瓶' },
  ],
  '未分类': [],
}

// 关闭图标
function CloseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
      <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

// 库存项组件 - 支持左滑操作
function PantryItem({ 
  item, 
  onEdit,
  onDelete 
}: { 
  item: { name: string; quantity: string }
  onEdit: () => void
  onDelete: () => void
}) {
  const [swipeX, setSwipeX] = useState(0)
  const [startX, setStartX] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)
  const itemRef = useRef<HTMLDivElement>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX)
    setIsSwiping(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return
    const currentX = e.touches[0].clientX
    const diff = startX - currentX
    if (diff > 0) {
      setSwipeX(Math.min(diff, 120))
    } else {
      setSwipeX(0)
    }
  }

  const handleTouchEnd = () => {
    setIsSwiping(false)
    if (swipeX > 60) {
      setSwipeX(120)
    } else {
      setSwipeX(0)
    }
  }

  const resetSwipe = () => {
    setSwipeX(0)
  }

  return (
    <div className="relative overflow-hidden">
      {/* 操作按钮 */}
      <div className="absolute right-0 top-0 bottom-0 flex items-center">
        <button
          onClick={() => { onEdit(); resetSwipe(); }}
          className="h-full px-4 bg-[#E8B86D] text-white flex items-center"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => { onDelete(); resetSwipe(); }}
          className="h-full px-4 bg-[#D97757] text-white flex items-center"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      
      {/* 内容 */}
      <div 
        ref={itemRef}
        className="relative bg-[#F5F1E8] flex items-center justify-between py-2.5 border-b border-dashed border-[#C9C5BD] transition-transform"
        style={{ transform: `translateX(-${swipeX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#8FBC8F]" />
          <span className="text-sm text-[#3E3A39]">{item.name}</span>
        </div>
        {item.quantity && (
          <span className="text-xs text-[#9A9590]">{item.quantity}</span>
        )}
      </div>
    </div>
  )
}

// 添加物品弹窗
function AddItemModal({
  open,
  onClose,
  onAdd,
  editItem
}: {
  open: boolean
  onClose: () => void
  onAdd: (name: string, quantity: string) => void
  editItem?: { name: string; quantity: string } | null
}) {
  const [name, setName] = useState(editItem?.name || '')
  const [quantity, setQuantity] = useState(editItem?.quantity || '')

  const handleAdd = () => {
    if (!name.trim()) {
      toast.error('请输入物品名称')
      return
    }
    onAdd(name.trim(), quantity.trim())
    setName('')
    setQuantity('')
    onClose()
  }

  if (!open) return null

  return (
    <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-10">
      <div className="bg-[#F5F1E8] rounded-2xl p-5 w-64 shadow-lg">
        <h4 className="text-sm font-bold text-[#3E3A39] mb-4">
          {editItem ? '编辑物品' : '添加库存'}
        </h4>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="物品名称"
          className="w-full px-3 py-2 mb-3 text-sm rounded-lg bg-[#E8E4DC] border border-[#C9C5BD] text-[#3E3A39] focus:outline-none focus:border-[#D97757]"
        />
        <input
          type="text"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="数量（可选，如：500g）"
          className="w-full px-3 py-2 mb-4 text-sm rounded-lg bg-[#E8E4DC] border border-[#C9C5BD] text-[#3E3A39] focus:outline-none focus:border-[#D97757]"
        />
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 text-sm rounded-lg bg-[#E8E4DC] text-[#6B6560] hover:bg-[#D4CCC0]"
          >
            取消
          </button>
          <button
            onClick={handleAdd}
            className="flex-1 py-2 text-sm rounded-lg bg-[#D97757] text-white hover:bg-[#C45A36]"
          >
            {editItem ? '保存' : '添加'}
          </button>
        </div>
      </div>
    </div>
  )
}

// 编辑分类弹窗
function EditCategoryModal({
  open,
  onClose,
  onSave,
  onDelete,
  categoryName
}: {
  open: boolean
  onClose: () => void
  onSave: (newName: string) => void
  onDelete: () => void
  categoryName: string
}) {
  const [name, setName] = useState(categoryName)

  const handleSave = () => {
    if (!name.trim()) {
      toast.error('请输入分类名称')
      return
    }
    onSave(name.trim())
    onClose()
  }

  if (!open) return null

  return (
    <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-10">
      <div className="bg-[#F5F1E8] rounded-2xl p-5 w-64 shadow-lg">
        <h4 className="text-sm font-bold text-[#3E3A39] mb-4">编辑分类</h4>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="分类名称"
          className="w-full px-3 py-2 mb-4 text-sm rounded-lg bg-[#E8E4DC] border border-[#C9C5BD] text-[#3E3A39] focus:outline-none focus:border-[#D97757]"
        />
        <div className="flex gap-2 mb-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 text-sm rounded-lg bg-[#E8E4DC] text-[#6B6560] hover:bg-[#D4CCC0]"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2 text-sm rounded-lg bg-[#D97757] text-white hover:bg-[#C45A36]"
          >
            保存
          </button>
        </div>
        <button
          onClick={onDelete}
          className="w-full py-2 text-sm rounded-lg border border-[#D97757] text-[#D97757] hover:bg-[#D97757]/10"
        >
          删除分类
        </button>
      </div>
    </div>
  )
}

// 添加分类弹窗
function AddCategoryModal({
  open,
  onClose,
  onAdd
}: {
  open: boolean
  onClose: () => void
  onAdd: (name: string) => void
}) {
  const [name, setName] = useState('')

  const handleAdd = () => {
    if (!name.trim()) {
      toast.error('请输入分类名称')
      return
    }
    onAdd(name.trim())
    setName('')
    onClose()
  }

  if (!open) return null

  return (
    <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-10">
      <div className="bg-[#F5F1E8] rounded-2xl p-5 w-64 shadow-lg">
        <h4 className="text-sm font-bold text-[#3E3A39] mb-4">添加分类</h4>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="分类名称"
          className="w-full px-3 py-2 mb-4 text-sm rounded-lg bg-[#E8E4DC] border border-[#C9C5BD] text-[#3E3A39] focus:outline-none focus:border-[#D97757]"
        />
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 text-sm rounded-lg bg-[#E8E4DC] text-[#6B6560] hover:bg-[#D4CCC0]"
          >
            取消
          </button>
          <button
            onClick={handleAdd}
            className="flex-1 py-2 text-sm rounded-lg bg-[#D97757] text-white hover:bg-[#C45A36]"
          >
            添加
          </button>
        </div>
      </div>
    </div>
  )
}

export function PantryModal({ open, onClose }: PantryModalProps) {
  // 如果没有打开，直接返回 null
  if (!open) return null
  
  const [pantryData, setPantryData] = useState(initialPantryData)
  const [activeCategory, setActiveCategory] = useState(Object.keys(initialPantryData)[0])
  const [showAddItem, setShowAddItem] = useState(false)
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<{ name: string; quantity: string } | null>(null)
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null)

  const categories = Object.keys(pantryData)

  const handleCategoryLongPress = (category: string) => {
    if (category === '未分类') return // 未分类不能编辑
    setEditingCategory(category)
  }

  const handleCategoryTouchStart = (category: string) => {
    const timer = setTimeout(() => {
      handleCategoryLongPress(category)
    }, 600)
    setLongPressTimer(timer)
  }

  const handleCategoryTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
  }

  const handleAddItem = (name: string, quantity: string) => {
    if (editingItem) {
      // 编辑模式
      setPantryData(prev => ({
        ...prev,
        [activeCategory]: prev[activeCategory].map(item => 
          item.name === editingItem.name ? { name, quantity } : item
        )
      }))
      toast.success(`已更新「${name}」`)
      setEditingItem(null)
    } else {
      // 添加模式
      setPantryData(prev => ({
        ...prev,
        [activeCategory]: [...prev[activeCategory], { name, quantity }]
      }))
      toast.success(`已添加「${name}」到${activeCategory}`)
    }
  }

  const handleDeleteItem = (itemName: string) => {
    setPantryData(prev => ({
      ...prev,
      [activeCategory]: prev[activeCategory].filter(item => item.name !== itemName)
    }))
    toast.success(`已删除「${itemName}」`)
  }

  const handleEditItem = (item: { name: string; quantity: string }) => {
    setEditingItem(item)
    setShowAddItem(true)
  }

  const handleAddCategory = (name: string) => {
    if (pantryData[name]) {
      toast.error('该分类已存在')
      return
    }
    setPantryData(prev => ({
      ...prev,
      [name]: []
    }))
    setActiveCategory(name)
    toast.success(`已添加分类「${name}」`)
  }

  const handleEditCategory = (oldName: string, newName: string) => {
    if (oldName === newName) return
    if (pantryData[newName]) {
      toast.error('该分类已存在')
      return
    }
    setPantryData(prev => {
      const newData: Record<string, { name: string; quantity: string }[]> = {}
      for (const key of Object.keys(prev)) {
        if (key === oldName) {
          newData[newName] = prev[key]
        } else {
          newData[key] = prev[key]
        }
      }
      return newData
    })
    setActiveCategory(newName)
    toast.success(`已将分类「${oldName}」重命名为「${newName}」`)
  }

  const handleDeleteCategory = (categoryName: string) => {
    if (categories.length <= 1) {
      toast.error('至少保留一个分类')
      return
    }
    const itemsToMove = pantryData[categoryName]
    setPantryData(prev => {
      const newData = { ...prev }
      delete newData[categoryName]
      // 将该分类下的物品移到未分类
      if (newData['未分类']) {
        newData['未分类'] = [...newData['未分类'], ...itemsToMove]
      } else {
        newData['未分类'] = itemsToMove
      }
      return newData
    })
    setActiveCategory(Object.keys(pantryData).filter(c => c !== categoryName)[0])
    setEditingCategory(null)
    toast.success(`已删除分类「${categoryName}」，物品已移至未分类`)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-sm bg-[#F5F1E8] rounded-t-3xl sm:rounded-3xl overflow-hidden paper-bg animate-slide-up">
        {/* 头部 */}
        <div className="bg-[#A67B5B] px-5 py-4 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.1) 10px, rgba(0,0,0,0.1) 11px)'
            }} />
          </div>
          
          <div className="flex items-center justify-between relative z-10">
            <h2 className="text-lg font-bold text-[#F5EFE6] tracking-wide">库存</h2>
            <button
              onClick={onClose}
              className="text-[#F5EFE6]/80 hover:text-[#F5EFE6] transition-colors"
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        {/* 标签切换 */}
        <div className="flex items-center border-b border-[#C9C5BD] overflow-x-auto scrollbar-hide">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              onTouchStart={() => handleCategoryTouchStart(category)}
              onTouchEnd={handleCategoryTouchEnd}
              onMouseDown={() => handleCategoryTouchStart(category)}
              onMouseUp={handleCategoryTouchEnd}
              onMouseLeave={handleCategoryTouchEnd}
              className={`flex-shrink-0 px-4 py-3 text-sm font-medium transition-colors ${
                activeCategory === category
                  ? 'text-[#D97757] border-b-2 border-[#D97757]'
                  : 'text-[#9A9590]'
              }`}
            >
              {category}
            </button>
          ))}
          <button
            onClick={() => setShowAddCategory(true)}
            className="flex-shrink-0 px-3 py-3 text-[#9A9590] hover:text-[#D97757]"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* 库存列表 */}
        <div className="p-5 max-h-[50vh] overflow-y-auto relative">
          <div className="note-card hand-drawn p-4">
            {pantryData[activeCategory]?.length > 0 ? (
              pantryData[activeCategory].map((item, index) => (
                <PantryItem 
                  key={index} 
                  item={item} 
                  onEdit={() => handleEditItem(item)}
                  onDelete={() => handleDeleteItem(item.name)}
                />
              ))
            ) : (
              <p className="text-center text-sm text-[#9A9590] py-4">啥也没有</p>
            )}
          </div>
          
          {/* 添加按钮 */}
          <button
            onClick={() => {
              setEditingItem(null)
              setShowAddItem(true)
            }}
            className="w-full mt-4 py-2.5 rounded-xl border-2 border-dashed border-[#C9C5BD] text-[#6B6560] text-sm font-medium hover:border-[#D97757] hover:text-[#D97757] transition-colors flex items-center justify-center gap-1"
          >
            <Plus className="w-4 h-4" />
            添加库存
          </button>

          {/* 添加/编辑物品弹窗 */}
          <AddItemModal
            open={showAddItem}
            onClose={() => {
              setShowAddItem(false)
              setEditingItem(null)
            }}
            onAdd={handleAddItem}
            editItem={editingItem}
          />

          {/* 添加分类弹窗 */}
          <AddCategoryModal
            open={showAddCategory}
            onClose={() => setShowAddCategory(false)}
            onAdd={handleAddCategory}
          />

          {/* 编辑分类弹窗 */}
          {editingCategory && (
            <EditCategoryModal
              open={!!editingCategory}
              onClose={() => setEditingCategory(null)}
              onSave={(newName) => handleEditCategory(editingCategory, newName)}
              onDelete={() => handleDeleteCategory(editingCategory)}
              categoryName={editingCategory}
            />
          )}
        </div>
      </div>
    </div>
  )
}
