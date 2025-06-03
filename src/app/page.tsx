
'use client'; 

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';
import { LogoDisplay } from '@/components/dashboard/LogoDisplay';
import { HeaderNav } from '@/components/dashboard/HeaderNav';
import { ToolCard, type Tool } from '@/components/dashboard/ToolCard';
import type { Category } from '@/app/admin/categories/page';
import type { LinkItem } from '@/app/admin/links/new/page';

const siteSettings = {
  siteName: '英语全科启蒙', 
  logoUrl: 'https://pic1.imgdb.cn/item/6817c79a58cb8da5c8dc723f.png',
  welcomeMessageEn: 'Welcome to All-Subject English Enlightenment',
  welcomeMessageZh: '系统 (平台) 由 Erin 英语全科启蒙团队独立开发完成',
  footerText: '© 2025 All-Subject English Enlightenment. All rights reserved. 由 Terry 开发和维护',
};

export default function DashboardPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // 并行获取数据以提高加载速度
        const [categoriesResponse, linksResponse] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/links')
        ]);

        if (!categoriesResponse.ok) {
          throw new Error(`Failed to fetch categories: ${categoriesResponse.statusText}`);
        }
        if (!linksResponse.ok) {
          throw new Error(`Failed to fetch links: ${linksResponse.statusText}`);
        }

        const [loadedCategories, loadedLinks] = await Promise.all([
          categoriesResponse.json(),
          linksResponse.json()
        ]);

        setCategories(loadedCategories);

        // 优化链接数据处理
        const processedLinks = loadedLinks.map((link: LinkItem) => ({
          ...link,
          categoryName: loadedCategories.find((cat: Category) => cat.id === link.categoryId)?.name || link.categoryName || 'Unknown Category',
        }));
        setLinks(processedLinks);

      } catch (error) {
        console.error('Error fetching data:', error);
        setError('数据加载失败，请稍后重试');
        setCategories([]);
        setLinks([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredLinks = links.filter(link =>
    link.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    link.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    link.categoryName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background flex-col gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">加载中，请稍候...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <HeaderNav />

      <main className="flex-grow container mx-auto px-4 py-12 sm:py-16 md:py-20 text-center">
        <div className="mb-12">
          <LogoDisplay logoUrl={siteSettings.logoUrl} siteName={siteSettings.siteName} />
        </div>

        <p className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3 bg-clip-text text-transparent animated-text-gradient-en">
          {siteSettings.welcomeMessageEn}
        </p>
        <p className="text-lg sm:text-xl lg:text-2xl font-semibold mb-12 bg-clip-text text-transparent animated-text-gradient-zh">
          {siteSettings.welcomeMessageZh}
        </p>

        <div className="max-w-xl mx-auto mb-16">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="pl-10 py-3 text-base h-12 rounded-lg shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLinks.map((link) => (
            <ToolCard
              key={link.id}
              title={link.title}
              description={link.description || ''}
              category={link.categoryName || 'Uncategorized'}
              url={link.url}
              imageUrl={link.imageUrl}
            />
          ))}
        </div>
      </main>

      <footer className="py-6 text-center text-sm text-muted-foreground">
        {siteSettings.footerText}
      </footer>
    </div>
  );
}
