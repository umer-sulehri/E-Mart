'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SearchIcon } from '@/components/icons';
import { VoiceSearch } from '@/components/common/VoiceSearch';
import { useTranslations } from '@/hooks/useTranslations';

interface Suggestion {
  type: 'product' | 'category';
  label: string;
  slug: string;
}

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const { t } = useTranslations();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const term = query.trim();
    debounceRef.current = setTimeout(async () => {
      if (term.length < 2) {
        setSuggestions([]);
        setOpen(false);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/v1/search/suggestions?q=${encodeURIComponent(term)}`);
        if (res.ok) {
          const data = (await res.json()) as { suggestions: Suggestion[] };
          setSuggestions(data.suggestions);
          setOpen(data.suggestions.length > 0);
        }
      } catch {
        // Suggestions are best-effort.
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const submitSearch = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    setOpen(false);
    router.push(`/products?search=${encodeURIComponent(trimmed)}`);
  };

  const handleVoiceResult = (transcript: string) => {
    setQuery(transcript);
    submitSearch(transcript);
  };

  return (
    <div ref={containerRef} className="relative w-full flex items-center">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submitSearch(query);
          if (e.key === 'Escape') setOpen(false);
        }}
        onFocus={() => {
          if (suggestions.length > 0) setOpen(true);
        }}
        placeholder={t('products.search')}
        aria-label={t('products.search')}
        role="combobox"
        aria-expanded={open}
        aria-controls="search-suggestions"
        aria-autocomplete="list"
        className="w-full h-[48px] pl-11 pr-12 bg-bg border border-border rounded-l-[10px] text-base text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
      />
      <SearchIcon className="absolute left-3 w-5 h-5 text-text-secondary pointer-events-none" />
      <div className="absolute right-1">
        <VoiceSearch onResult={handleVoiceResult} />
      </div>

      {open && (
        <ul
          id="search-suggestions"
          role="listbox"
          className="absolute top-[52px] left-0 right-0 z-50 bg-surface border border-border rounded-[12px] shadow-lg overflow-hidden py-1"
        >
          {loading && suggestions.length === 0 && (
            <li className="px-4 py-3 text-sm text-text-secondary">Searching…</li>
          )}
          {suggestions.map((suggestion) => (
            <li key={`${suggestion.type}-${suggestion.slug}`} role="option" aria-selected={false}>
              <button
                type="button"
                onClick={() => {
                  if (suggestion.type === 'category') {
                    router.push(`/categories/${suggestion.slug}`);
                  } else {
                    router.push(`/products/${suggestion.slug}`);
                  }
                  setOpen(false);
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-bg transition-colors flex items-center gap-2 min-h-[44px]"
              >
                <span className="text-xs uppercase tracking-wide text-text-secondary w-16 flex-shrink-0">
                  {suggestion.type}
                </span>
                <span className="text-sm text-text-primary truncate">{suggestion.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
