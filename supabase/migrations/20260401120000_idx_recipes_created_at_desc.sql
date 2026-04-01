-- 下厨菜谱列表：.order('created_at', { ascending: false })
-- 在 Supabase：SQL Editor → 粘贴执行（或 supabase db push / 本地 CLI 迁移）
CREATE INDEX IF NOT EXISTS idx_recipes_created_at_desc
  ON public.recipes (created_at DESC NULLS LAST);
