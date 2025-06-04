
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Image from 'next/image';

interface Category {
  id: number;
  name: string;
}

interface Link {
  id: number;
  name: string;
  url: string;
  category_name: string;
}

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [categoriesRes, linksRes] = await Promise.all([
        fetch('/api/storage?key=categories'),
        fetch('/api/storage?key=links')
      ]);

      if (!categoriesRes.ok || !linksRes.ok) {
        throw new Error('获取数据失败');
      }

      const categoriesData = await categoriesRes.json();
      const linksData = await linksRes.json();

      setCategories(categoriesData.data || []);
      setLinks(linksData.data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('获取数据错误:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // 设置定时器，每30秒更新一次数据
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="container mx-auto p-4">加载中...</div>;
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 text-red-500">
        错误: {error}
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 min-h-screen flex flex-col items-center">
      <div className="text-center mb-8 mt-12">
        <div className="flex justify-center mb-4">
          <Image
            src="/logo.png"
            alt="KT Erin Logo"
            width={120}
            height={120}
            className="rounded-lg shadow-lg"
          />
        </div>
        <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent animated-text-gradient-zh">全科启蒙</h1>
        <p className="text-xl text-muted-foreground mb-6">0-12岁</p>
        <div className="w-full max-w-xl mx-auto mb-8">
          <Input
            type="search"
            placeholder="搜索链接..."
            className="w-full h-12 px-4 rounded-lg shadow-sm transition-all duration-200 focus:shadow-lg"
          />
        </div>
      </div>
      
      <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => {
          const categoryLinks = links.filter(
            (link) => link.category_name === category.name
          );

          return (
            <Card key={category.id} className="shadow-lg">
              <CardHeader>
                <CardTitle>{category.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {categoryLinks.map((link) => (
                    <li key={link.id}>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-700 hover:underline"
                      >
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
                {categoryLinks.length === 0 && (
                  <p className="text-gray-500">暂无链接</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {categories.length === 0 && (
        <p className="text-center text-gray-500 mt-8">
          暂无分类，请在管理页面添加分类和链接
        </p>
      )}
    </div>
  );
}
