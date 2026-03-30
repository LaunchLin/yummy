/** 本地日历日期 YYYY-MM-DD（与 meal_plans.plan_date 对齐） */
export function localDateString(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function addDaysLocalDateString(from: Date, days: number): string {
  const d = new Date(from)
  d.setDate(d.getDate() + days)
  return localDateString(d)
}
