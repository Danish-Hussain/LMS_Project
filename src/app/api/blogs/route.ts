import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

type Blog = {
  id: string;
  title: string;
  topic?: string;
  coverImage?: string;
  content?: any;
  published?: boolean;
  createdAt?: string;
};

const DATA_PATH = path.join(process.cwd(), "data", "blogs.json");

async function readBlogs(): Promise<Blog[]> {
  try {
    const raw = await fs.readFile(DATA_PATH, "utf-8");
    return JSON.parse(raw) as Blog[];
  } catch (err: any) {
    if (err.code === "ENOENT") {
      // file missing -> return empty array
      return [];
    }
    throw err;
  }
}

async function writeBlogs(blogs: Blog[]) {
  await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
  await fs.writeFile(DATA_PATH, JSON.stringify(blogs, null, 2), "utf-8");
}

export async function GET() {
  const blogs = await readBlogs();
  return NextResponse.json(blogs);
}

export async function POST(req: Request) {
  const body = await req.json();
  if (!body || !body.title) {
    return NextResponse.json({ error: "Missing title" }, { status: 400 });
  }
  const blogs = await readBlogs();
  const newBlog: Blog = {
    id: Date.now().toString(),
    title: String(body.title),
    topic: body.topic ?? "",
    coverImage: body.coverImage ?? "",
    content: body.content ?? null,
    published: !!body.published,
    createdAt: new Date().toISOString(),
  };
  blogs.unshift(newBlog);
  await writeBlogs(blogs);
  return NextResponse.json(newBlog, { status: 201 });
}
