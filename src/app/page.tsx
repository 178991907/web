
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
    <div className="container mx-auto p-4">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <Image
            src="/logo.png"
            alt="KT Erin Logo"
            width={100}
            height={100}
            className="rounded-lg"
          />
        </div>
        <h1 className="text-3xl font-bold mb-2">全科启蒙</h1>
        <p className="text-lg text-muted-foreground">0-12岁</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => {
          const categoryLinks = links.filter(
            (link) => link.category_name === category.name
          );

          return (
            <Card key={category.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>{category.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {categoryLinks.map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-2 rounded hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      {link.name}
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
