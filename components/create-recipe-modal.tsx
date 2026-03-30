'use client'

import { useState, useRef } from 'react'
import { toast } from 'sonner'
import { X, Plus, Camera } from 'lucide-react'

import { createRecipe } from '@/app/actions/cook'
import { buildCreateRecipePayload } from '@/lib/create-recipe-payload'

interface CreateRecipeModalProps {
  open: boolean
  onClose: () => void
}

// 预设标签（与 create-recipe-page / 下厨分组一致）
const defaultTags = [
  { id: 'staple', label: '🍛主食', emoji: '' },
  { id: 'meat', label: '🥩荤的', emoji: '' },
  { id: 'seafood', label: '🦐海鲜', emoji: '' },
  { id: 'vegetable', label: '🥬素的', emoji: '' },
  { id: 'soup', label: '🍲汤', emoji: '' },
]

// 默认辅料
const defaultAuxiliaries = ['葱', '姜', '蒜', '辣椒', '花椒', '八角', '香叶', '桂皮', '料酒']

// 默认酱料
const defaultSauces = ['生抽', '老抽', '盐', '糖', '醋', '蚝油', '豆瓣酱', '番茄酱', '芝麻油']

// 关闭图标
function CloseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
      <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

// 复古 Chip 标签
function TagChip({ 
  label, 
  selected, 
  onClick,
}: { 
  label: string
  selected: boolean
  onClick: () => void 
}) {
  return (
    <button
      onClick={onClick}
      className={`
        px-3 py-1.5 rounded-full text-sm font-medium transition-all
        border-2 border-dashed
        ${selected 
          ? 'bg-[#D97757] text-white border-[#D97757] border-solid' 
          : 'bg-transparent text-[#6B6560] border-[#C9C5BD] hover:border-[#D97757] hover:text-[#D97757]'
        }
      `}
    >
      {label}
    </button>
  )
}

// 信纸横线输入框
function PaperLineInput({
  value,
  onChange,
  placeholder,
  multiline = false,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  multiline?: boolean
}) {
  const baseClass = `
    w-full bg-transparent border-0 border-b-2 border-dashed border-[#C9C5BD]
    focus:border-[#D97757] focus:outline-none
    text-[#3E3A39] placeholder-[#B8B4AC]
    py-2 px-1 font-serif text-base
    transition-colors
  `
  
  if (multiline) {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        className={`${baseClass} resize-none`}
        style={{
          backgroundImage: 'repeating-linear-gradient(transparent, transparent 31px, #C9C5BD 31px, #C9C5BD 32px)',
          lineHeight: '32px',
        }}
      />
    )
  }
  
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={baseClass}
    />
  )
}

// 食材输入项（带用量）
function IngredientInput({
  value,
  quantity,
  onChangeValue,
  onChangeQuantity,
  onRemove,
  placeholder,
}: {
  value: string
  quantity: string
  onChangeValue: (value: string) => void
  onChangeQuantity: (value: string) => void
  onRemove: () => void
  placeholder: string
}) {
  return (
    <div className="flex items-center gap-2 group min-w-0">
      <span className="w-1.5 h-1.5 rounded-full bg-[#9A9590] flex-shrink-0" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChangeValue(e.target.value)}
        placeholder={placeholder}
        className="flex-1 min-w-0 bg-transparent border-0 border-b border-dashed border-[#C9C5BD] focus:border-[#D97757] focus:outline-none text-[#3E3A39] placeholder-[#B8B4AC] py-1.5 text-sm transition-colors"
      />
      <input
        type="text"
        value={quantity}
        onChange={(e) => onChangeQuantity(e.target.value)}
        placeholder="用量"
        className="w-14 flex-shrink-0 bg-transparent border-0 border-b border-dashed border-[#C9C5BD] focus:border-[#D97757] focus:outline-none text-[#9A9590] placeholder-[#B8B4AC] py-1.5 text-xs transition-colors text-right"
      />
      <button
        onClick={onRemove}
        className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-[#9A9590] hover:text-[#D97757] transition-all"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

// 快捷选择 Chip
function QuickChip({
  label,
  selected,
  onClick,
}: {
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`
        px-2.5 py-1 rounded-lg text-xs font-medium transition-all
        ${selected
          ? 'bg-[#E8B86D] text-white'
          : 'bg-[#E8E4DC] text-[#6B6560] hover:bg-[#D4CCC0]'
        }
      `}
    >
      {label}
    </button>
  )
}

export function CreateRecipeModal({ open, onClose }: CreateRecipeModalProps) {
  const [recipeName, setRecipeName] = useState('')
  const [recipeImage, setRecipeImage] = useState<string | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [customTags, setCustomTags] = useState<{ id: string; label: string }[]>([])
  const [showAddTag, setShowAddTag] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [mainIngredients, setMainIngredients] = useState<{ value: string; quantity: string }[]>([{ value: '', quantity: '' }])
  const [auxiliaryIngredients, setAuxiliaryIngredients] = useState<{ value: string; quantity: string }[]>([{ value: '', quantity: '' }])
  const [sauceIngredients, setSauceIngredients] = useState<{ value: string; quantity: string }[]>([{ value: '', quantity: '' }])
  const [prep, setPrep] = useState('')
  const [steps, setSteps] = useState('')
  const [saving, setSaving] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const allTags = [...defaultTags, ...customTags]

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(t => t !== tagId)
        : [...prev, tagId]
    )
  }

  const addCustomTag = () => {
    if (!newTagName.trim()) return
    const newTag = {
      id: `custom-${Date.now()}`,
      label: newTagName.trim(),
    }
    setCustomTags(prev => [...prev, newTag])
    setSelectedTags(prev => [...prev, newTag.id])
    setNewTagName('')
    setShowAddTag(false)
    toast.success(`已添加标签「${newTagName}」`)
  }

  // 快捷选择辅料
  const handleQuickAuxiliary = (item: string) => {
    // 找到第一个空的输入框，或者添加新行
    const emptyIndex = auxiliaryIngredients.findIndex(i => !i.value.trim())
    if (emptyIndex !== -1) {
      setAuxiliaryIngredients(prev => {
        const newArr = [...prev]
        newArr[emptyIndex] = { value: item, quantity: '' }
        return newArr
      })
    } else {
      setAuxiliaryIngredients(prev => [...prev, { value: item, quantity: '' }])
    }
  }

  // 快捷选择酱料
  const handleQuickSauce = (item: string) => {
    const emptyIndex = sauceIngredients.findIndex(i => !i.value.trim())
    if (emptyIndex !== -1) {
      setSauceIngredients(prev => {
        const newArr = [...prev]
        newArr[emptyIndex] = { value: item, quantity: '' }
        return newArr
      })
    } else {
      setSauceIngredients(prev => [...prev, { value: item, quantity: '' }])
    }
  }

  const addMainIngredient = () => {
    setMainIngredients(prev => [...prev, { value: '', quantity: '' }])
  }

  const updateMainIngredient = (index: number, field: 'value' | 'quantity', val: string) => {
    setMainIngredients(prev => {
      const newArr = [...prev]
      newArr[index] = { ...newArr[index], [field]: val }
      return newArr
    })
  }

  const removeMainIngredient = (index: number) => {
    if (mainIngredients.length > 1) {
      setMainIngredients(prev => prev.filter((_, i) => i !== index))
    }
  }

  const addAuxiliaryIngredient = () => {
    setAuxiliaryIngredients(prev => [...prev, { value: '', quantity: '' }])
  }

  const updateAuxiliaryIngredient = (index: number, field: 'value' | 'quantity', val: string) => {
    setAuxiliaryIngredients(prev => {
      const newArr = [...prev]
      newArr[index] = { ...newArr[index], [field]: val }
      return newArr
    })
  }

  const removeAuxiliaryIngredient = (index: number) => {
    if (auxiliaryIngredients.length > 1) {
      setAuxiliaryIngredients(prev => prev.filter((_, i) => i !== index))
    }
  }

  const addSauceIngredient = () => {
    setSauceIngredients(prev => [...prev, { value: '', quantity: '' }])
  }

  const updateSauceIngredient = (index: number, field: 'value' | 'quantity', val: string) => {
    setSauceIngredients(prev => {
      const newArr = [...prev]
      newArr[index] = { ...newArr[index], [field]: val }
      return newArr
    })
  }

  const removeSauceIngredient = (index: number) => {
    if (sauceIngredients.length > 1) {
      setSauceIngredients(prev => prev.filter((_, i) => i !== index))
    }
  }

  const handleImageUpload = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setRecipeImage(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = () => {
    if (!recipeName.trim()) {
      toast.error('请输入菜谱名称')
      return
    }
    if (saving) return

    void (async () => {
      setSaving(true)
      const payload = buildCreateRecipePayload({
        recipeName,
        recipeImage,
        selectedTags,
        allTags,
        mainIngredients,
        auxiliaryIngredients,
        sauceIngredients,
        prep,
        steps,
      })
      const res = await createRecipe(payload)
      setSaving(false)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success(`已保存「${recipeName}」`)
      setRecipeName('')
      setRecipeImage(null)
      setSelectedTags([])
      setCustomTags([])
      setMainIngredients([{ value: '', quantity: '' }])
      setAuxiliaryIngredients([{ value: '', quantity: '' }])
      setSauceIngredients([{ value: '', quantity: '' }])
      setPrep('')
      setSteps('')
      onClose()
    })()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-md max-h-[90vh] bg-[#F5F1E8] rounded-t-3xl sm:rounded-3xl overflow-hidden paper-bg animate-slide-up">
        {/* 头部 */}
        <div className="sticky top-0 z-10 bg-[#F5F1E8]/95 backdrop-blur-sm border-b border-[#C9C5BD] px-5 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#3E3A39] tracking-wide">记录新菜谱</h2>
            <button
              onClick={onClose}
              className="text-[#6B6560] hover:text-[#3E3A39] transition-colors"
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        {/* 表单内容 */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-5 space-y-6">
          {/* 菜谱图片 */}
          <div>
            <label className="block text-sm font-medium text-[#6B6560] mb-2 tracking-wide">菜谱图片</label>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange}
              accept="image/*"
              className="hidden" 
            />
            <button
              onClick={handleImageUpload}
              className={`w-full h-32 rounded-xl border-2 border-dashed border-[#C9C5BD] flex flex-col items-center justify-center gap-2 hover:border-[#D97757] transition-colors overflow-hidden ${recipeImage ? 'p-0' : ''}`}
            >
              {recipeImage ? (
                <img src={recipeImage} alt="菜谱图片" className="w-full h-full object-cover" />
              ) : (
                <>
                  <Camera className="w-8 h-8 text-[#9A9590]" />
                  <span className="text-sm text-[#9A9590]">点击添加图片</span>
                </>
              )}
            </button>
          </div>

          {/* 菜谱名称 */}
          <div>
            <label className="block text-sm font-medium text-[#6B6560] mb-2 tracking-wide">菜名</label>
            <PaperLineInput
              value={recipeName}
              onChange={setRecipeName}
              placeholder="这道菜叫什么..."
            />
          </div>

          {/* 标签选择 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-[#6B6560] tracking-wide">分类标签</label>
              <button
                onClick={() => setShowAddTag(!showAddTag)}
                className="w-6 h-6 rounded-full border border-[#C9C5BD] text-[#9A9590] hover:border-[#D97757] hover:text-[#D97757] flex items-center justify-center transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {allTags.map(tag => (
                <TagChip
                  key={tag.id}
                  label={tag.label}
                  selected={selectedTags.includes(tag.id)}
                  onClick={() => toggleTag(tag.id)}
                />
              ))}
            </div>
            {/* 新增标签输入 */}
            {showAddTag && (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="新标签名称..."
                  className="flex-1 px-3 py-1.5 text-sm rounded-lg bg-[#E8E4DC] border border-[#C9C5BD] text-[#3E3A39] focus:outline-none focus:border-[#D97757]"
                  onKeyDown={(e) => e.key === 'Enter' && addCustomTag()}
                />
                <button
                  onClick={addCustomTag}
                  className="px-3 py-1.5 text-sm rounded-lg bg-[#D97757] text-white hover:bg-[#C45A36]"
                >
                  添加
                </button>
              </div>
            )}
          </div>

          {/* 食材（主料） */}
          <div className="note-card hand-drawn p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D97757]" />
                <span className="text-sm font-semibold text-[#3E3A39]">食材</span>
              </div>
              <button
                onClick={addMainIngredient}
                className="text-xs text-[#D97757] hover:underline"
              >
                + 添加
              </button>
            </div>
            <div className="space-y-2">
              {mainIngredients.map((ingredient, index) => (
                <IngredientInput
                  key={index}
                  value={ingredient.value}
                  quantity={ingredient.quantity}
                  onChangeValue={(v) => updateMainIngredient(index, 'value', v)}
                  onChangeQuantity={(v) => updateMainIngredient(index, 'quantity', v)}
                  onRemove={() => removeMainIngredient(index)}
                  placeholder={index === 0 ? "如：五花肉" : "继续添加..."}
                />
              ))}
            </div>
          </div>

          {/* 辅料 */}
          <div className="note-card hand-drawn p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E8B86D]" />
                <span className="text-sm font-semibold text-[#3E3A39]">辅料</span>
              </div>
              <button
                onClick={addAuxiliaryIngredient}
                className="text-xs text-[#D97757] hover:underline"
              >
                + 添加
              </button>
            </div>
            {/* 快捷选择 */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {defaultAuxiliaries.map(item => (
                <QuickChip
                  key={item}
                  label={item}
                  selected={auxiliaryIngredients.some(a => a.value === item)}
                  onClick={() => handleQuickAuxiliary(item)}
                />
              ))}
            </div>
            {/* 输入列表 */}
            <div className="space-y-2">
              {auxiliaryIngredients.map((ingredient, index) => (
                <IngredientInput
                  key={index}
                  value={ingredient.value}
                  quantity={ingredient.quantity}
                  onChangeValue={(v) => updateAuxiliaryIngredient(index, 'value', v)}
                  onChangeQuantity={(v) => updateAuxiliaryIngredient(index, 'quantity', v)}
                  onRemove={() => removeAuxiliaryIngredient(index)}
                  placeholder="添加辅料..."
                />
              ))}
            </div>
          </div>

          {/* 酱料 */}
          <div className="note-card hand-drawn p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#8FBC8F]" />
                <span className="text-sm font-semibold text-[#3E3A39]">酱料</span>
              </div>
              <button
                onClick={addSauceIngredient}
                className="text-xs text-[#D97757] hover:underline"
              >
                + 添加
              </button>
            </div>
            {/* 快捷选择 */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {defaultSauces.map(item => (
                <QuickChip
                  key={item}
                  label={item}
                  selected={sauceIngredients.some(s => s.value === item)}
                  onClick={() => handleQuickSauce(item)}
                />
              ))}
            </div>
            {/* 输入列表 */}
            <div className="space-y-2">
              {sauceIngredients.map((ingredient, index) => (
                <IngredientInput
                  key={index}
                  value={ingredient.value}
                  quantity={ingredient.quantity}
                  onChangeValue={(v) => updateSauceIngredient(index, 'value', v)}
                  onChangeQuantity={(v) => updateSauceIngredient(index, 'quantity', v)}
                  onRemove={() => removeSauceIngredient(index)}
                  placeholder="添加酱料..."
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#6B6560] mb-2 tracking-wide">备菜</label>
            <PaperLineInput
              value={prep}
              onChange={setPrep}
              placeholder="切配、腌制等，一空行一步…"
              multiline
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#6B6560] mb-2 tracking-wide">步骤</label>
            <PaperLineInput
              value={steps}
              onChange={setSteps}
              placeholder="下锅烹饪顺序，一空行一步…"
              multiline
            />
          </div>
        </div>

        {/* 底部保存按钮 */}
        <div className="sticky bottom-0 bg-[#F5F1E8]/95 backdrop-blur-sm border-t border-[#C9C5BD] px-5 py-4">
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="w-full vintage-btn text-white py-3 rounded-xl text-base font-medium disabled:opacity-60"
          >
            {saving ? '保存中…' : '保存菜谱'}
          </button>
        </div>
      </div>
    </div>
  )
}
