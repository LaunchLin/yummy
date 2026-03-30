// Mock Data for Yummy App

export interface Ingredient {
  id: string
  name: string
  quantity: string
  category: 'main' | 'auxiliary' | 'sauce'
}

export interface MealPlan {
  id: string
  date: string
  dishes: string[]
  ingredients: Ingredient[]
}

export interface Dish {
  id: string
  name: string
  description: string
  cookTime: string
  difficulty: 'easy' | 'medium' | 'hard'
}

export interface Restaurant {
  id: string
  name: string
  cuisine: string
  rating: number
  distance: string
  priceRange: string
  dishes?: string[]
}

// 今日备餐计划
export const todayMealPlan: MealPlan = {
  id: '1',
  date: new Date().toISOString(),
  dishes: ['外婆红烧肉', '糖醋里脊', '醋溜白菜'],
  ingredients: [
    // 主菜
    { id: '1', name: '五花肉', quantity: '500g', category: 'main' },
    { id: '2', name: '猪里脊', quantity: '300g', category: 'main' },
    { id: '3', name: '大白菜', quantity: '1棵', category: 'main' },
    // 辅料
    { id: '4', name: '大葱', quantity: '2根', category: 'auxiliary' },
    { id: '5', name: '生姜', quantity: '1块', category: 'auxiliary' },
    { id: '6', name: '大蒜', quantity: '1头', category: 'auxiliary' },
    { id: '7', name: '八角', quantity: '3颗', category: 'auxiliary' },
    { id: '8', name: '桂皮', quantity: '1片', category: 'auxiliary' },
    { id: '9', name: '鸡蛋', quantity: '2个', category: 'auxiliary' },
    { id: '10', name: '淀粉', quantity: '适量', category: 'auxiliary' },
    // 酱料
    { id: '11', name: '老抽', quantity: '2勺', category: 'sauce' },
    { id: '12', name: '生抽', quantity: '3勺', category: 'sauce' },
    { id: '13', name: '料酒', quantity: '2勺', category: 'sauce' },
    { id: '14', name: '白糖', quantity: '适量', category: 'sauce' },
    { id: '15', name: '陈醋', quantity: '3勺', category: 'sauce' },
    { id: '16', name: '番茄酱', quantity: '2勺', category: 'sauce' },
  ],
}

// 随机菜品池
export const randomDishes: Dish[] = [
  { id: '1', name: '麻婆豆腐', description: '川味经典，麻辣鲜香', cookTime: '20分钟', difficulty: 'easy' },
  { id: '2', name: '宫保鸡丁', description: '花生酥脆，鸡肉嫩滑', cookTime: '25分钟', difficulty: 'medium' },
  { id: '3', name: '鱼香肉丝', description: '酸甜咸鲜，下饭神器', cookTime: '20分钟', difficulty: 'medium' },
  { id: '4', name: '红烧排骨', description: '肉质酥软，酱香浓郁', cookTime: '45分钟', difficulty: 'medium' },
  { id: '5', name: '番茄炒蛋', description: '家常味道，简单美味', cookTime: '10分钟', difficulty: 'easy' },
  { id: '6', name: '干煸四季豆', description: '焦香酥脆，咸鲜可口', cookTime: '15分钟', difficulty: 'easy' },
  { id: '7', name: '水煮牛肉', description: '麻辣滚烫，牛肉嫩滑', cookTime: '30分钟', difficulty: 'hard' },
  { id: '8', name: '清蒸鲈鱼', description: '鲜嫩清香，营养丰富', cookTime: '20分钟', difficulty: 'medium' },
]

// 随机餐厅池
export const randomRestaurants: Restaurant[] = [
  { id: '1', name: '老北京炸酱面馆', cuisine: '北京菜', rating: 4.5, distance: '500m', priceRange: '¥25-40', dishes: ['炸酱面', '卤煮火烧'] },
  { id: '2', name: '川香阁', cuisine: '川菜', rating: 4.7, distance: '800m', priceRange: '¥50-80', dishes: ['麻婆豆腐', '回锅肉'] },
  { id: '3', name: '江南小厨', cuisine: '江浙菜', rating: 4.6, distance: '1.2km', priceRange: '¥60-100', dishes: ['东坡肉', '西湖醋鱼'] },
  { id: '4', name: '潮汕牛肉火锅', cuisine: '潮汕菜', rating: 4.8, distance: '1.5km', priceRange: '¥80-120', dishes: ['鲜切牛肉', '牛肉丸'] },
  { id: '5', name: '日式居酒屋', cuisine: '日料', rating: 4.4, distance: '600m', priceRange: '¥100-150', dishes: ['刺身拼盘', '烤�的串'] },
  { id: '6', name: '意大利手工披萨', cuisine: '意大利菜', rating: 4.3, distance: '900m', priceRange: '¥60-90', dishes: ['玛格丽特披萨', '意面'] },
  { id: '7', name: '粤式早茶楼', cuisine: '粤菜', rating: 4.6, distance: '700m', priceRange: '¥40-70', dishes: ['虾饺', '叉烧包'] },
  { id: '8', name: '新疆大盘鸡', cuisine: '新疆菜', rating: 4.5, distance: '1.0km', priceRange: '¥50-80', dishes: ['大盘鸡', '馕'] },
]

export function getRandomDish(): Dish {
  return randomDishes[Math.floor(Math.random() * randomDishes.length)]
}

export function getRandomRestaurant(): Restaurant {
  return randomRestaurants[Math.floor(Math.random() * randomRestaurants.length)]
}

export function getCategoryLabel(category: 'main' | 'auxiliary' | 'sauce'): string {
  const labels = {
    main: '主菜',
    auxiliary: '辅料',
    sauce: '酱料',
  }
  return labels[category]
}
