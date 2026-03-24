'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, TrendingUp, Package } from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface Product {
  id: string | number;
  name: string;
  price: number;
  image_url?: string;
  category_slug?: string;
}

interface SearchBarProps {
  onProductSelect?: (product: Product) => void;
  variant?: 'default' | 'overlay';
}

export default function SearchBar({ onProductSelect, variant = 'default' }: SearchBarProps) {
  const isOverlay = variant === 'overlay';
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch suggestions
  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const fetchSuggestions = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/products?search=${encodeURIComponent(query)}&limit=5`);
        const products = response.data?.products || [];
        setSuggestions(products);
        setShowSuggestions(products.length > 0);
        setSelectedIndex(-1);
      } catch (error) {
        console.error('Search error:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleSuggestionClick = (product: Product) => {
    setQuery(product.name);
    setShowSuggestions(false);
    if (onProductSelect) {
      onProductSelect(product);
    } else {
      // Scroll to product
      router.push(`/#products`);
      setTimeout(() => {
        const element = document.getElementById(`product-${product.id}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex]);
        } else if (query.length > 0) {
          router.push(`/?search=${encodeURIComponent(query)}`);
          setShowSuggestions(false);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        inputRef.current?.blur();
        break;
    }
  };

  const clearSearch = () => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      {/* Search Input */}
      <div className="relative">
        <Search
          className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
            isOverlay ? 'text-white/90' : 'text-slate-300'
          }`}
        />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search products..."
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 2 && suggestions.length > 0 && setShowSuggestions(true)}
          className={`w-full pl-12 pr-12 py-3 rounded-full focus:outline-none focus:ring-2 transition-all duration-200 ${
            isOverlay
              ? 'bg-white/15 border border-white/30 text-white placeholder-white/70 focus:ring-white/50 focus:border-white/50'
              : 'border border-white/15 bg-white/5 text-slate-100 placeholder-slate-400 focus:ring-[#7c5cff] focus:border-[#7c5cff] shadow-[0_0_0_1px_rgba(255,255,255,0.04)]'
          }`}
        />
        {query && (
          <button
            onClick={clearSearch}
            className={`absolute right-4 top-1/2 transform -translate-y-1/2 p-1 rounded-full transition-colors ${
              isOverlay ? 'hover:bg-white/20 text-white/90' : 'hover:bg-white/10 text-slate-200'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        )}
        {loading && (
          <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#7c5cff]"></div>
          </div>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-[#05060b] rounded-2xl shadow-2xl border border-white/10 overflow-hidden animate-fade-in">
          <div className="max-h-96 overflow-y-auto">
            {/* Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-[#111827] to-[#020617] border-b border-white/10">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                <TrendingUp className="w-4 h-4" />
                <span>Suggestions ({suggestions.length})</span>
              </div>
            </div>

            {/* Suggestions List */}
            <div className="py-2">
              {suggestions.map((product, index) => (
                <button
                  key={product.id}
                  onClick={() => handleSuggestionClick(product)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full px-4 py-3 flex items-center gap-4 transition-colors ${
                    selectedIndex === index ? 'bg-white/10' : 'hover:bg-white/5'
                  }`}
                >
                  {/* Product Image */}
                  <div className="flex-shrink-0 w-12 h-12 bg-white/5 rounded-lg overflow-hidden">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-6 h-6 text-slate-400" />
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-semibold text-slate-50 truncate">{product.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[#c7d2ff] font-bold">${product.price.toFixed(2)}</span>
                      {product.category_slug && (
                        <span className="text-xs text-slate-400 capitalize">
                          {product.category_slug.replace(/-/g, ' ')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Arrow Icon */}
                  <div className="flex-shrink-0">
                    <Search className="w-4 h-4 text-slate-400" />
                  </div>
                </button>
              ))}
            </div>

            {/* Footer - View All */}
            <div className="px-4 py-3 bg-[#020617] border-t border-white/10">
              <button
                onClick={() => {
                  router.push(`/?search=${encodeURIComponent(query)}`);
                  setShowSuggestions(false);
                }}
                className="w-full text-center text-sm font-semibold text-slate-100 hover:text-white transition-colors"
              >
                View all results for &quot;{query}&quot;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* No Results */}
      {showSuggestions && !loading && query.length >= 2 && suggestions.length === 0 && (
        <div className="absolute z-50 w-full mt-2 bg-[#05060b] rounded-2xl shadow-2xl border border-white/10 p-8 animate-fade-in">
          <div className="text-center">
            <Package className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <p className="text-slate-200 font-medium">No products found</p>
            <p className="text-sm text-slate-400 mt-1">Try a different search term</p>
          </div>
        </div>
      )}
    </div>
  );
}

