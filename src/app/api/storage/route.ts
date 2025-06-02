import { NextRequest, NextResponse } from 'next/server';
import { CloudDatabaseStorage } from '@/lib/storage';
import dotenv from 'dotenv';

dotenv.config();

// 初始化数据库连接
const dbUrl = process.env.NEXT_PUBLIC_DATABASE_URL || '';
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
  let parsedKey: string | undefined = undefined; // For logging in catch block
  try {
    const body = await request.json();
    const { key, data } = body;
    parsedKey = key; // Assign after successful parsing

    if (!key || data === undefined) {
      console.error('API POST Error: Key or data missing in request body.', { keyProvided: !!key, dataProvided: data !== undefined });
      return NextResponse.json({ error: 'Key and data are required' }, { status: 400 });
    }

    console.log(`API POST: Attempting to save data for key: "${key}"`);
    await storage.saveData(key, data);
    console.log(`API POST: Successfully completed storage.saveData call for key: "${key}".`);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (parsedKey) {
      console.error(`API POST: Error after parsing body, during saving data for key: "${parsedKey}". Message: ${error.message}`, error.stack);
    } else {
      console.error(`API POST: Error (possibly during body parsing or before key extraction). Message: ${error.message}`, error.stack);
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}