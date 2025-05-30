
'use client'; 

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
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

const LOCAL_STORAGE_CATEGORIES_KEY = 'linkHubCategories';
const LOCAL_STORAGE_LINKS_KEY = 'linkHubLinks';

const initialMockCategories: Category[] = [
  { id: '1', name: '常用工具', slug: 'common-tools', createdDate: 'May 16, 2024', icon: 'tool' },
  { id: '2', name: '儿童游戏', slug: 'kids-games', createdDate: 'May 16, 2024', icon: 'gamepad-2' },
];

const initialMockLinks: LinkItem[] = [
  { id: 'L1', title: '搜索 (Baidu)', url: 'https://www.baidu.com', categoryId: '1', categoryName: '常用工具', createdDate: 'May 16, 2024', imageUrl: 'https://placehold.co/120x80.png', aiHint: 'search baidu', description: 'Leading Chinese Search Engine', faviconUrl: '' },
  { id: 'L3', title: 'guge (Google)', url: 'https://www.google.com', categoryId: '1', categoryName: '常用工具', createdDate: 'May 16, 2024', imageUrl: 'https://placehold.co/120x80.png', aiHint: 'search google', description: 'Global Search Engine', faviconUrl: '' },
  { id: 'g1', title: '字母游戏', url: '#game-alphabet', categoryId: '2', categoryName: '儿童游戏', createdDate: 'May 17, 2024', imageUrl: 'https://placehold.co/100x100.png', aiHint: 'alphabet game', description: '学习英文字母', faviconUrl: '' },
  { id: 'L4', title: '谷歌', url: 'https://www.google.com', categoryId: '1', categoryName: '常用工具', createdDate: 'May 16, 2024', imageUrl: '', aiHint: 'search example', description: '1111', faviconUrl: '' },
];


export default function DashboardPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    let loadedCategories: Category[] = initialMockCategories;
    const storedCategories = localStorage.getItem(LOCAL_STORAGE_CATEGORIES_KEY);
    if (storedCategories) {
      try {
        loadedCategories = JSON.parse(storedCategories);
      } catch (e) {
        console.error("Failed to parse categories from localStorage on homepage:", e);
        localStorage.setItem(LOCAL_STORAGE_CATEGORIES_KEY, JSON.stringify(initialMockCategories));
      }
    } else {
        localStorage.setItem(LOCAL_STORAGE_CATEGORIES_KEY, JSON.stringify(initialMockCategories));
    }
    setCategories(loadedCategories);

    let loadedLinks: LinkItem[] = initialMockLinks;
    const storedLinks = localStorage.getItem(LOCAL_STORAGE_LINKS_KEY);
    if (storedLinks) {
      try {
        const parsedLinks: LinkItem[] = JSON.parse(storedLinks);
        loadedLinks = parsedLinks.map((link: LinkItem) => ({
          ...link,
          categoryName: loadedCategories.find((cat: Category) => cat.id === link.categoryId)?.name || link.categoryName || 'Unknown Category',
        }));
      } catch (e) {
        console.error("Failed to parse links from localStorage on homepage:", e);
        // Fallback and reset if parsing fails
        loadedLinks = initialMockLinks.map((link: LinkItem) => ({
          ...link,
          categoryName: loadedCategories.find((cat: Category) => cat.id === link.categoryId)?.name || link.categoryName || 'Unknown Category',
        }));
        localStorage.setItem(LOCAL_STORAGE_LINKS_KEY, JSON.stringify(loadedLinks));
      }
    } else {
        loadedLinks = initialMockLinks.map((link: LinkItem) => ({
          ...link,
          categoryName: loadedCategories.find((cat: Category) => cat.id === link.categoryId)?.name || link.categoryName || 'Unknown Category',
        }));
        localStorage.setItem(LOCAL_STORAGE_LINKS_KEY, JSON.stringify(loadedLinks));
    }
    setLinks(loadedLinks);

    setIsLoading(false);
  }, []);

  const filteredLinks = links.filter(link =>
    link.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    link.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    link.categoryName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-background"><p>Loading dashboard...</p></div>;
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

        {categories.map(category => {
          const itemsForCategory = filteredLinks.filter(item => item.categoryId === category.id);
          if (itemsForCategory.length === 0 && searchTerm) return null;

          return (
            <section key={category.id} className="mb-16">
              <h2 className="text-3xl font-semibold text-primary mb-8">{category.name}</h2>
              {itemsForCategory.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {itemsForCategory.map((item) => {
                    const toolItem: Tool = {
                      id: item.id,
                      title: item.title,
                      description: item.description,
                      link: item.url,
                      imageUrl: item.imageUrl || '',
                      aiHint: item.aiHint || 'icon',
                    };
                    return <ToolCard key={item.id} tool={toolItem} />;
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  {searchTerm ? `No items match your search in "${category.name}".` : `No items in this category yet.`}
                </p>
              )}
            </section>
          );
        })}
         {categories.length === 0 && (
           <p className="text-muted-foreground text-xl">No categories have been set up yet.</p>
         )}
         {categories.length > 0 && filteredLinks.length === 0 && searchTerm && (
            <p className="text-muted-foreground text-xl mt-8">No links match your search term &quot;{searchTerm}&quot;.</p>
         )}

      </main>

      <footer className="py-6 text-center text-sm text-muted-foreground border-t">
        <p>
          {siteSettings.footerText}
        </p>
      </footer>
    </div>
  );
}
