import { NextRequest, NextResponse } from 'next/server';
import { getStorage } from '@/lib/storage';
import { randomUUID } from 'crypto';

// 配置静态导出
export const dynamic = 'force-static';
export const revalidate = 3600; // 每小时重新验证一次

// Define the LinkItem type, similar to frontend and AI Rules
export interface LinkItem {
  id: string;
  title: string; // Corresponds to 'name' in some database schemas
  url: string;
  categoryId: string; // Foreign key to Category
  categoryName?: string; // Denormalized for convenience, can be populated on fetch
  createdDate: string; // ISO date string
  imageUrl?: string;
  aiHint?: string;
  description?: string;
  faviconUrl?: string;
}

const STORAGE_KEY_LINKS = 'app_links'; // Using a distinct key for API-managed links
const STORAGE_KEY_CATEGORIES = 'app_categories'; // To validate categoryId

interface Category {
  id: string;
  name: string;
  slug: string;
  createdDate: string;
  icon?: string;
}

// GET /api/links - Fetches all links
export async function GET(request: NextRequest) {
  try {
    const storage = await getStorage();
    const links = await storage.getData(STORAGE_KEY_LINKS) as LinkItem[] | null;
    return NextResponse.json(links || []);
  } catch (error: any) {
    console.error('Error fetching links:', error);
    return NextResponse.json({ error: 'Failed to fetch links', details: error.message }, { status: 500 });
  }
}

// POST /api/links - Adds a new link
export async function POST(request: NextRequest) {
  try {
    const newLinkData = await request.json() as Omit<LinkItem, 'id' | 'createdDate' | 'categoryName'> & { title: string; url: string; categoryId: string };

    if (!newLinkData.title || typeof newLinkData.title !== 'string') {
      return NextResponse.json({ error: 'Link title is required and must be a string' }, { status: 400 });
    }
    if (!newLinkData.url || typeof newLinkData.url !== 'string') {
      return NextResponse.json({ error: 'Link URL is required and must be a string' }, { status: 400 });
    }
    if (!newLinkData.categoryId || typeof newLinkData.categoryId !== 'string') {
      return NextResponse.json({ error: 'Link categoryId is required and must be a string' }, { status: 400 });
    }

    const storage = await getStorage();
    
    // Validate categoryId exists
    const categories = await storage.getData(STORAGE_KEY_CATEGORIES) as Category[] | null;
    const categoryExists = categories?.some(cat => cat.id === newLinkData.categoryId);
    if (!categoryExists) {
      return NextResponse.json({ error: `Category with id "${newLinkData.categoryId}" does not exist.` }, { status: 404 });
    }

    let links = await storage.getData(STORAGE_KEY_LINKS) as LinkItem[] | null;
    if (!links) {
      links = [];
    }

    const newLink: LinkItem = {
      ...newLinkData,
      id: randomUUID(),
      createdDate: new Date().toISOString(),
      // categoryName can be populated if needed, or derived on the client
    };

    links.push(newLink);
    await storage.saveData(STORAGE_KEY_LINKS, links);

    return NextResponse.json(newLink, { status: 201 });
  } catch (error: any) {
    console.error('Error creating link:', error);
    if (error instanceof SyntaxError) { // Handle JSON parsing errors
        return NextResponse.json({ error: 'Invalid JSON payload', details: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create link', details: error.message }, { status: 500 });
  }
}