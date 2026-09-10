'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

export default function NotFoundSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      className="mx-auto mt-8 flex w-full max-w-md items-center rounded-full border border-muted-200 bg-white p-1.5 shadow-sm focus-within:border-primary"
    >
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search products..."
        aria-label="Search products"
        className="flex-1 bg-transparent px-4 py-2 text-sm text-secondary placeholder:text-muted-400 focus:outline-none"
      />
      <button
        type="submit"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white transition-colors hover:bg-primary-500"
        aria-label="Search"
      >
        <Search className="h-4 w-4" />
      </button>
    </form>
  );
}