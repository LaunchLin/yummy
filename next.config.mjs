import path from 'node:path'
import { fileURLToPath } from 'node:url'

/** 本配置文件所在目录 = 项目根（修正多 lockfile 时 Turbopack 误判工作区根、导致 .env.local 未加载） */
const projectRoot = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: projectRoot,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
