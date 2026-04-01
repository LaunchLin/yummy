-- 餐厅列表：.order('created_at', { ascending: false })
CREATE INDEX IF NOT EXISTS idx_restaurants_created_at_desc
  ON public.restaurants (created_at DESC NULLS LAST);
