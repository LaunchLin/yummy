'use client'

// 图标历史版本列表
// 访问路径: /icon-history

const iconVersions = [
  {
    id: 1,
    name: '第一版 - 奶油色背景小锅',
    description: '奶油米色背景，手绘风格小锅，有日文和英文文字',
    url: '/icon-v1.jpg',
    note: '被否决：有多余的文字'
  },
  {
    id: 2,
    name: '第二版 - 橘色背景可爱小锅（用户喜欢）',
    description: '暖橘色圆角背景，奶油色可爱小锅带萌萌表情，蓬松蒸汽云，木勺子',
    url: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-NDg4n7EFtVie2d3vK03RfjzqoE6QgQ.png',
    note: '用户喜欢这个版本的小锅样式和橘色背景'
  },
  {
    id: 3,
    name: '第三版 - 橘色背景大锅',
    description: '纯橘色背景，去掉嵌套边框，小锅更大更突出',
    url: '/icon-v3.jpg',
    note: '被否决：小锅样式不对'
  },
  {
    id: 4,
    name: '第四版 - 重新生成',
    description: '尝试还原第二版风格',
    url: '/icon-v4.png',
    note: '被否决：不够清晰，有白色边框'
  },
  {
    id: 5,
    name: '参考图 - 用户提供的理想效果',
    description: '暖橘色圆角背景，奶油色可爱小锅，两点眼睛+U形微笑，蓬松云朵蒸汽，木勺斜插',
    url: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-3eynB4akdkR6Ti9wxXQH53Q14dMaDL.png',
    note: '这是用户想要的最终效果'
  },
]

export default function IconHistoryPage() {
  return (
    <div className="min-h-screen bg-[#E8E4DC] p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-[#3E3A39] mb-2">吃啥 App 图标历史版本</h1>
        <p className="text-sm text-[#6B6560] mb-6">点击图片可查看大图</p>
        
        <div className="space-y-6">
          {iconVersions.map((icon) => (
            <div 
              key={icon.id}
              className="bg-white rounded-2xl p-4 shadow-md"
            >
              <div className="flex gap-4">
                {/* 图标预览 */}
                <a 
                  href={icon.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-shrink-0"
                >
                  <img 
                    src={icon.url} 
                    alt={icon.name}
                    className="w-24 h-24 rounded-2xl object-cover border border-[#E8E4DC] hover:scale-105 transition-transform"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect fill="%23E8E4DC" width="96" height="96"/><text x="48" y="52" text-anchor="middle" fill="%239A9590" font-size="12">未保存</text></svg>'
                    }}
                  />
                </a>
                
                {/* 图标信息 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#D97757] text-white text-xs font-bold">
                      {icon.id}
                    </span>
                    <h2 className="font-semibold text-[#3E3A39] truncate">{icon.name}</h2>
                  </div>
                  <p className="text-sm text-[#6B6560] mb-2">{icon.description}</p>
                  <p className="text-xs text-[#9A9590] italic">{icon.note}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* 总结 */}
        <div className="mt-8 p-4 bg-[#D97757]/10 rounded-2xl border border-[#D97757]/20">
          <h3 className="font-semibold text-[#D97757] mb-2">总结</h3>
          <p className="text-sm text-[#3E3A39]">
            用户喜欢 <strong>第2版</strong> 的小锅样式和橘色背景。
            <strong>第5版（参考图）</strong> 是用户想要的最终理想效果。
          </p>
        </div>
      </div>
    </div>
  )
}
