/** 库表仅有 notes(text)，雷品用尾部隐藏片段序列化，避免改表结构 */

const BAD_MARK = '\n\n<!--yummy-bad:'
const BAD_END = '-->'

export function encodeRestaurantNotes(note: string, badDishes: string[]): string {
  const n = note.trimEnd()
  const payload = badDishes.length ? `${BAD_MARK}${JSON.stringify(badDishes)}${BAD_END}` : ''
  return n + payload
}

export function decodeRestaurantNotes(raw: string): { note: string; badDishes: string[] } {
  const idx = raw.indexOf(BAD_MARK)
  if (idx === -1) return { note: raw, badDishes: [] }
  const note = raw.slice(0, idx).trimEnd()
  const rest = raw.slice(idx + BAD_MARK.length)
  const end = rest.lastIndexOf(BAD_END)
  if (end === -1) return { note: raw, badDishes: [] }
  try {
    const bad = JSON.parse(rest.slice(0, end)) as unknown
    return { note, badDishes: Array.isArray(bad) ? (bad as string[]) : [] }
  } catch {
    return { note: raw, badDishes: [] }
  }
}
