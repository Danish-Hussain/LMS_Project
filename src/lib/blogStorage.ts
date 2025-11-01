import { promises as fs } from 'fs'
import path from 'path'

export type Blog = {
  id: string
  title: string
  topic?: string
  coverImage?: string
  excerpt?: string
  content?: any
  isPublished?: boolean
  createdAt?: string
}

const DATA_PATH = path.join(process.cwd(), 'data', 'blogs.json')

async function readBlogs(): Promise<Blog[]> {
  try {
    const raw = await fs.readFile(DATA_PATH, 'utf-8')
    return JSON.parse(raw) as Blog[]
  } catch (err: any) {
    if (err.code === 'ENOENT') return []
    throw err
  }
}

async function writeBlogs(blogs: Blog[]) {
  await fs.mkdir(path.dirname(DATA_PATH), { recursive: true })
  await fs.writeFile(DATA_PATH, JSON.stringify(blogs, null, 2), 'utf-8')
}

export async function getBlogById(id: string): Promise<Blog | null> {
  const blogs = await readBlogs()
  return blogs.find(b => b.id === id) ?? null
}

export async function createBlog(blog: Blog) {
  const blogs = await readBlogs()
  blogs.unshift(blog)
  await writeBlogs(blogs)
  return blog
}

export async function updateBlog(id: string, patch: Partial<Blog>) {
  const blogs = await readBlogs()
  const idx = blogs.findIndex(b => b.id === id)
  if (idx === -1) return null
  const updated = { ...blogs[idx], ...patch }
  blogs[idx] = updated
  await writeBlogs(blogs)
  return updated
}

export async function listBlogs() {
  return await readBlogs()
}
