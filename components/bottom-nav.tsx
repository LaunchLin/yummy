'use client'

import { cn } from '@/lib/utils'

interface BottomNavProps {
  activeTab: string
  onTabChange?: (tab: string) => void
}

// 手绘风格图标 - 安排/日历
function PlanIcon({ active }: { active: boolean }) {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="5" width="20" height="18" rx="3" stroke="currentColor" strokeWidth="2" fill={active ? "currentColor" : "none"} />
      <path d="M4 11H24" stroke={active ? "#E8E4DC" : "currentColor"} strokeWidth="2" />
      <path d="M9 3V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M19 3V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="10" cy="16" r="1.5" fill={active ? "#E8E4DC" : "currentColor"} />
      <circle cx="14" cy="16" r="1.5" fill={active ? "#E8E4DC" : "currentColor"} />
      <circle cx="18" cy="16" r="1.5" fill={active ? "#E8E4DC" : "currentColor"} />
    </svg>
  )
}

// 手绘风格图标 - 下厨/锅
function CookIcon({ active }: { active: boolean }) {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="14" cy="19" rx="10" ry="5" stroke="currentColor" strokeWidth="2" fill={active ? "currentColor" : "none"} />
      <path d="M4 19V16C4 11.5 8.5 8 14 8C19.5 8 24 11.5 24 16V19" stroke="currentColor" strokeWidth="2" />
      <path d="M11 5C11 5 12 3 14 3C16 3 17 5 17 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M14 5V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

// 手绘风格图标 - 餐厅/餐具
function RestaurantIcon({ active }: { active: boolean }) {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7 4V24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M7 4C7 4 4 6 4 10C4 13 7 14 7 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M7 4C7 4 10 6 10 10C10 13 7 14 7 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="20" cy="10" r="5" stroke="currentColor" strokeWidth="2" fill={active ? "currentColor" : "none"} />
      <path d="M20 15V24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

const navItems = [
  { id: 'arrange', label: '安排', Icon: PlanIcon },
  { id: 'cook', label: '下厨', Icon: CookIcon },
  { id: 'restaurant', label: '餐厅', Icon: RestaurantIcon },
]

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bottom-nav">
      <div className="mx-auto flex h-16 max-w-md items-center justify-around px-6">
        {navItems.map((item) => {
          const isActive = activeTab === item.id
          return (
            <button
              key={item.id}
              onClick={() => onTabChange?.(item.id)}
              className={cn(
                'flex flex-col items-center gap-1 px-5 py-2 rounded-2xl nav-item',
                isActive
                  ? 'text-[#3E3A39]'
                  : 'text-[#9A9590] hover:text-[#6B6560]'
              )}
            >
              <div className={cn(
                'transition-transform duration-200',
                isActive && 'scale-110'
              )}>
                <item.Icon active={isActive} />
              </div>
              <span className={cn(
                'text-xs tracking-wide transition-all duration-200',
                isActive ? 'font-semibold' : 'font-medium'
              )}>
                {item.label}
              </span>
              {isActive && (
                <div className="w-1 h-1 rounded-full bg-[#D97757] animate-scale-in" />
              )}
            </button>
          )
        })}
      </div>
      {/* Safe area for iOS */}
      <div className="h-6 bg-transparent" />
    </nav>
  )
}
