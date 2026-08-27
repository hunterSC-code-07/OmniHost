import { useState, useEffect, useRef } from 'react';

export function useDayzModSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<number>(9);
  const [results, setResults] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const loadMoreRef = useRef(null);

  const handleSearch = async (queryOverride?: string, categoryOverride?: number, pageOverride: number = 1, tagsOverride?: string[]) => {
    const queryToUse = queryOverride !== undefined ? queryOverride : searchQuery;
    const categoryToUse = categoryOverride !== undefined ? categoryOverride : activeCategory;
    const tagsToUse = tagsOverride !== undefined ? tagsOverride : selectedTags;

    if (pageOverride === 1) {
      setResults([]);
      setHasMore(true);
    }

    setLoading(true);
    const res = await window.api.steam.searchWorkshop(queryToUse, categoryToUse, pageOverride, tagsToUse);

    if (res && res.length > 0) {
      if (pageOverride === 1) {
        setResults(res);
      } else {
        setResults(prev => [...prev, ...res]);
      }
      setPage(pageOverride);
    } else {
      setHasMore(false);
    }
    setLoading(false);
  };

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !loading && hasMore && results.length > 0) {
        handleSearch(undefined, undefined, page + 1, undefined);
      }
    }, { threshold: 0.1 });

    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [loading, hasMore, page, results.length]);

  const handleCategoryChange = (categoryId: number) => {
    setActiveCategory(categoryId);
    handleSearch(undefined, categoryId, 1, undefined);
  };

  const stripBBCode = (text: string) => {
    if (!text) return '';
    return text
      .replace(/\[\/?(b|i|u|s|url|img|quote|code|list|list=1|\*|h1|h2|h3)\]/g, '')
      .replace(/\[url=[^\]]+\]/g, '')
      .replace(/\[img\][^\[]+\[\/img\]/g, '')
      .trim();
  };

  return {
    searchQuery,
    setSearchQuery,
    activeCategory,
    setActiveCategory,
    results,
    setResults,
    page,
    setPage,
    hasMore,
    setHasMore,
    selectedTags,
    setSelectedTags,
    loading,
    setLoading,
    loadMoreRef,
    handleSearch,
    handleCategoryChange,
    stripBBCode
  };
}
