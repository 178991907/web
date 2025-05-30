import { NextRequest, NextResponse } from 'next/server';
import { CloudDatabaseStorage } from '@/lib/storage';
import dotenv from 'dotenv';

dotenv.config();

// 初始化数据库连接
const dbUrl = process.env.DATABASE_URL || '';
const dbType = process.env.DB_TYPE || 'postgresql';
const storage = new CloudDatabaseStorage(dbUrl, dbType);

// 获取数据
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 });
    }

    const data = await storage.getData(key);
    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Error fetching data:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 保存数据
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, data } = body;

    if (!key || data === undefined) {
      return NextResponse.json({ error: 'Key and data are required' }, { status: 400 });
    }

    await storage.saveData(key, data);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error saving data:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}