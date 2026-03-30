'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import { X, Plus, Camera, ArrowLeft } from 'lucide-react'

import { createRecipe, updateRecipe } from '@/app/actions/cook'
import { buildCreateRecipePayload } from '@/lib/create-recipe-payload'
import { parseRecipeMainItems } from '@/lib/meal-ingredients'
import type { RecipeRow } from '@/lib/types/database'

interface CreateRecipePageProps {
  onBack: () => void
  initialRecipe?: RecipeRow | null
  onSaved?: () => void
}

// 预设标签（存入菜谱时写入 label 文案，与下厨分组一致）
const defaultTags = [
  { id: 'staple', label: '🍛主食', emoji: '' },
  { id: 'meat', label: '🥩荤的', emoji: '' },
  { id: 'seafood', label: '🦐海鲜', emoji: '' },
  { id: 'vegetable', label: '🥬素的', emoji: '' },
  { id: 'soup', label: '🍲汤', emoji: '' },
]

// 默认辅料
const defaultAuxiliaries = ['葱', '姜', '蒜', '八角', '桂皮', '香叶', '干辣椒', '小米辣', '豆豉']

// 默认酱料
const defaultSauces = ['豆瓣酱', '红油']

const QUICK_AUX_KEY = 'yummy.quick_auxiliaries.v1'
const QUICK_SAUCE_KEY = 'yummy.quick_sauces.v1'

function safeLoadStringList(key: string): string[] | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return null
    return parsed.map((x) => String(x).trim()).filter(Boolean)
  } catch {
    return null
  }
}

function safeSaveStringList(key: string, list: string[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, JSON.stringify(list))
  } catch {
    // ignore
  }
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
  onLongPress,
}: {
  label: string
  selected: boolean
  onClick: () => void
  onLongPress?: () => void
}) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressedRef = useRef(false)

  const clear = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  return (
    <button
      type="button"
      onPointerDown={() => {
        longPressedRef.current = false
        if (!onLongPress) return
        clear()
        timerRef.current = setTimeout(() => {
          longPressedRef.current = true
          onLongPress()
        }, 480)
      }}
      onPointerUp={clear}
      onPointerCancel={clear}
      onPointerLeave={clear}
      onClick={(e) => {
        if (longPressedRef.current) {
          e.preventDefault()
          e.stopPropagation()
          return
        }
        onClick()
      }}
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

export function CreateRecipePage({ onBack, initialRecipe, onSaved }: CreateRecipePageProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [])

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

  const isEditing = Boolean(initialRecipe?.id)

  const parseAuxSauceRow = (raw: string): { value: string; quantity: string } => {
    const s = String(raw ?? '').trim()
    if (!s) return { value: '', quantity: '' }
    const idx = s.indexOf('·')
    if (idx === -1) return { value: s, quantity: '' }
    const left = s.slice(0, idx).trim()
    const right = s.slice(idx + 1).trim()
    return { value: left || s, quantity: right }
  }

  useEffect(() => {
    const initial = initialRecipe
    if (!initial) return

    setRecipeName(initial.name ?? '')
    setRecipeImage(initial.cover_url?.trim() || null)
    setPrep(initial.prep ?? '')
    setSteps(initial.steps ?? '')

    // tags：表里存的是 label 文案。默认标签匹配不到的都作为自定义标签回填
    const wanted = (initial.tags ?? []).filter(Boolean)
    const nextCustom: { id: string; label: string }[] = []
    const nextSelected: string[] = []
    for (const label of wanted) {
      const found = defaultTags.find((t) => t.label === label)
      if (found) {
        nextSelected.push(found.id)
        continue
      }
      const id = `custom-${label}`
      nextCustom.push({ id, label })
      nextSelected.push(id)
    }
    setCustomTags(nextCustom)
    setSelectedTags(nextSelected)

    const main = parseRecipeMainItems(initial.main_ingredients).map((m) => ({
      value: m.name,
      quantity: m.amount ?? '',
    }))
    setMainIngredients(main.length ? main : [{ value: '', quantity: '' }])

    const auxRows = (initial.aux_ingredients ?? []).map((x) => parseAuxSauceRow(String(x)))
    setAuxiliaryIngredients(auxRows.length ? auxRows : [{ value: '', quantity: '' }])

    const sauceRows = (initial.sauces ?? []).map((x) => parseAuxSauceRow(String(x)))
    setSauceIngredients(sauceRows.length ? sauceRows : [{ value: '', quantity: '' }])
  }, [initialRecipe])

  const [quickAuxiliaries, setQuickAuxiliaries] = useState<string[]>(() => {
    return safeLoadStringList(QUICK_AUX_KEY) ?? defaultAuxiliaries
  })
  const [quickSauces, setQuickSauces] = useState<string[]>(() => {
    return safeLoadStringList(QUICK_SAUCE_KEY) ?? defaultSauces
  })

  useEffect(() => {
    // 首次挂载后同步一次（避免热更新/多标签导致的不同步）
    const aux = safeLoadStringList(QUICK_AUX_KEY)
    const sau = safeLoadStringList(QUICK_SAUCE_KEY)
    if (aux?.length) setQuickAuxiliaries(aux)
    if (sau?.length) setQuickSauces(sau)
  }, [])

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

  const handleQuickAuxiliary = (item: string) => {
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

  const upsertQuickAux = (name: string) => {
    const v = name.trim()
    if (!v) return
    setQuickAuxiliaries((prev) => {
      if (prev.includes(v)) return prev
      const next = [v, ...prev].slice(0, 24)
      safeSaveStringList(QUICK_AUX_KEY, next)
      return next
    })
  }

  const upsertQuickSauce = (name: string) => {
    const v = name.trim()
    if (!v) return
    setQuickSauces((prev) => {
      if (prev.includes(v)) return prev
      const next = [v, ...prev].slice(0, 24)
      safeSaveStringList(QUICK_SAUCE_KEY, next)
      return next
    })
  }

  const removeQuickAux = (name: string) => {
    const ok =
      typeof window === 'undefined'
        ? false
        : window.confirm(`确定删除快捷辅料「${name}」吗？`)
    if (!ok) return
    setQuickAuxiliaries((prev) => {
      const next = prev.filter((x) => x !== name)
      safeSaveStringList(QUICK_AUX_KEY, next)
      return next
    })
  }

  const removeQuickSauce = (name: string) => {
    const ok =
      typeof window === 'undefined' ? false : window.confirm(`确定删除快捷酱料「${name}」吗？`)
    if (!ok) return
    setQuickSauces((prev) => {
      const next = prev.filter((x) => x !== name)
      safeSaveStringList(QUICK_SAUCE_KEY, next)
      return next
    })
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
    if (field === 'value') upsertQuickAux(val)
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
    if (field === 'value') upsertQuickSauce(val)
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
      const res = initialRecipe?.id
        ? await updateRecipe(initialRecipe.id, payload)
        : await createRecipe(payload)
      setSaving(false)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success(initialRecipe?.id ? `已更新「${recipeName}」` : `已保存「${recipeName}」`)
      onSaved?.()
      onBack()
    })()
  }

  const overlay = (
    <div
      className="fixed inset-0 z-[60] flex w-full max-w-none flex-col overflow-hidden bg-[#F5F1E8] paper-bg pt-[env(safe-area-inset-top)] [height:100dvh] max-h-[100dvh]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-recipe-title"
    >
      <div className="shrink-0 border-b border-[#C9C5BD] bg-[#F5F1E8]/95 px-5 py-4 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <button type="button" onClick={onBack} className="text-[#6B6560] hover:text-[#3E3A39] btn-press">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 id="create-recipe-title" className="text-lg font-bold text-[#3E3A39] tracking-wide">
            {isEditing ? '编辑菜谱' : '记录新菜谱'}
          </h2>
          <div className="w-5" />
        </div>
      </div>

      {/* 表单内容（可滚动区域） */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-5 space-y-6 pb-2">
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

        {/* 食材（主料，对应库字段 main_ingredients） */}
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
          <div className="flex flex-wrap gap-1.5 mb-3">
            {quickAuxiliaries.map(item => (
              <QuickChip
                key={item}
                label={item}
                selected={auxiliaryIngredients.some(a => a.value === item)}
                onClick={() => handleQuickAuxiliary(item)}
                onLongPress={() => removeQuickAux(item)}
              />
            ))}
          </div>
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
          <div className="flex flex-wrap gap-1.5 mb-3">
            {quickSauces.map(item => (
              <QuickChip
                key={item}
                label={item}
                selected={sauceIngredients.some(s => s.value === item)}
                onClick={() => handleQuickSauce(item)}
                onLongPress={() => removeQuickSauce(item)}
              />
            ))}
          </div>
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

        {/* 备菜 / 步骤（写入库字段 prep、steps） */}
        <div>
          <label className="block text-sm font-medium text-[#6B6560] mb-2 tracking-wide">备菜</label>
          <PaperLineInput
            value={prep}
            onChange={setPrep}
            placeholder=""
            multiline
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#6B6560] mb-2 tracking-wide">步骤</label>
          <PaperLineInput
            value={steps}
            onChange={setSteps}
            placeholder=""
            multiline
          />
        </div>
      </div>

      {/* 底部保存按钮（与滚动区分栏，永远贴在屏幕底） */}
      <div className="shrink-0 border-t border-[#C9C5BD] bg-[#F5F1E8]/95 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-sm">
        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="w-full vintage-btn py-3 text-base font-medium text-white disabled:opacity-60"
        >
          {saving ? '保存中…' : '保存菜谱'}
        </button>
      </div>
    </div>
  )

  if (!mounted) return null
  return createPortal(overlay, document.body)
}
