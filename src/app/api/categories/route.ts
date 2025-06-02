import { NextRequest, NextResponse } from 'next/server';
import { getStorage } from '@/lib/storage';
import { randomUUID } from 'crypto';

// Define the Category type, mirroring what might be used in the frontend
interface Category {
  id: string;
  name: string;
  slug: string; // Should be unique, derived from name
  createdDate: string;
  icon?: string;
}

const STORAGE_KEY_CATEGORIES = 'app_categories'; // Using a distinct key for API-managed categories

// GET /api/categories - Fetches all categories
export async function GET(request: NextRequest) {
  try {
    const storage = await getStorage();
    const categories = await storage.getData(STORAGE_KEY_CATEGORIES) as Category[] | null;
    return NextResponse.json(categories || []);
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories', details: error.message }, { status: 500 });
  }
}

// POST /api/categories - Adds a new category
export async function POST(request: NextRequest) {
  try {
    const newCategoryData = await request.json() as Omit<Category, 'id' | 'createdDate' | 'slug'> & { name: string };

    if (!newCategoryData.name || typeof newCategoryData.name !== 'string') {
      return NextResponse.json({ error: 'Category name is required and must be a string' }, { status: 400 });
    }

    const storage = await getStorage();
    let categories = await storage.getData(STORAGE_KEY_CATEGORIES) as Category[] | null;
    if (!categories) {
      categories = [];
    }

    // Check for duplicate category name (case-insensitive for slug generation)
    const slug = newCategoryData.name.toLowerCase().replace(/\s+/g, '-');
    if (categories.some(cat => cat.slug === slug)) {
      return NextResponse.json({ error: `Category with name "${newCategoryData.name}" already exists (slug: ${slug})` }, { status: 409 });
    }

    const newCategory: Category = {
      ...newCategoryData,
      id: randomUUID(),
      slug: slug,
      createdDate: new Date().toISOString(),
    };

    categories.push(newCategory);
    await storage.saveData(STORAGE_KEY_CATEGORIES, categories);

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error: any) {
    console.error('Error creating category:', error);
    if (error instanceof SyntaxError) { // Handle JSON parsing errors
        return NextResponse.json({ error: 'Invalid JSON payload', details: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create category', details: error.message }, { status: 500 });
  }
}