import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Search, TrendingUp, Award, SlidersHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../utils/api';
import { HouseCard, Listing } from '../components/HouseCard';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Slider } from '../components/ui/slider';
import { Label } from '../components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../components/ui/popover';

import heroImage from '../../assets/cd6dd4e08337e596d3243a6d5cdac5811e60fa10.png';

interface PaginatedListings {
  pageIndex: number; pageSize: number;
  count: number; data: Listing[];
}

// ─── Carousel Component ────────────────────────────────────────────────────────
interface CarouselProps {
  listings: Listing[];
  loading: boolean;
}

const ListingCarousel = ({ listings, loading }: CarouselProps) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const CARD_WIDTH = 300; // px – must match the card's min-w below
  const GAP = 24;         // gap-6 = 24px

  const scroll = (direction: 'left' | 'right') => {
    if (!trackRef.current) return;
    const amount = (CARD_WIDTH + GAP) * 2;
    trackRef.current.scrollBy({ left: direction === 'right' ? amount : -amount, behavior: 'smooth' });
  };

  // Auto-advance every 3 s
  useEffect(() => {
    if (loading || listings.length === 0) return;
    autoPlayRef.current = setInterval(() => {
      if (!trackRef.current) return;
      const { scrollLeft, scrollWidth, clientWidth } = trackRef.current;
      // Loop back to start when we reach the end
      if (scrollLeft + clientWidth >= scrollWidth - 10) {
        trackRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        trackRef.current.scrollBy({ left: CARD_WIDTH + GAP, behavior: 'smooth' });
      }
    }, 3000);
    return () => { if (autoPlayRef.current) clearInterval(autoPlayRef.current); };
  }, [loading, listings]);

  if (loading) {
    return (
      <div className="flex gap-6 overflow-hidden">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-72 bg-gray-100 rounded-xl animate-pulse flex-shrink-0" style={{ minWidth: CARD_WIDTH }} />
        ))}
      </div>
    );
  }

  if (listings.length === 0) {
    return <p className="text-[#717182]">No listings available yet.</p>;
  }

  return (
    <div className="relative group">
      {/* Left arrow */}
      <button
        onClick={() => scroll('left')}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10
                   w-10 h-10 rounded-full bg-white shadow-lg border border-gray-200
                   flex items-center justify-center
                   opacity-0 group-hover:opacity-100 transition-opacity duration-200
                   hover:bg-gray-50"
        aria-label="Scroll left"
      >
        <ChevronLeft className="w-5 h-5 text-[#34495E]" />
      </button>

      {/* Scrollable track */}
      <div
        ref={trackRef}
        className="flex gap-6 overflow-x-auto scroll-smooth pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        onMouseEnter={() => { if (autoPlayRef.current) clearInterval(autoPlayRef.current); }}
        onMouseLeave={() => {
          // resume on mouse-leave
          autoPlayRef.current = setInterval(() => {
            if (!trackRef.current) return;
            const { scrollLeft, scrollWidth, clientWidth } = trackRef.current;
            if (scrollLeft + clientWidth >= scrollWidth - 10) {
              trackRef.current.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
              trackRef.current.scrollBy({ left: CARD_WIDTH + GAP, behavior: 'smooth' });
            }
          }, 3000);
        }}
      >
        {listings.map((listing) => (
          <div key={listing.id} className="flex-shrink-0" style={{ minWidth: CARD_WIDTH }}>
            <HouseCard listing={listing} />
          </div>
        ))}
      </div>

      {/* Right arrow */}
      <button
        onClick={() => scroll('right')}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10
                   w-10 h-10 rounded-full bg-white shadow-lg border border-gray-200
                   flex items-center justify-center
                   opacity-0 group-hover:opacity-100 transition-opacity duration-200
                   hover:bg-gray-50"
        aria-label="Scroll right"
      >
        <ChevronRight className="w-5 h-5 text-[#34495E]" />
      </button>

      {/* Hide native scrollbar in WebKit */}
      <style>{`.flex::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
};

// ─── Home Page ─────────────────────────────────────────────────────────────────
export const Home = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState([1000, 5000]);
  const [featuredListings, setFeaturedListings] = useState<Listing[]>([]);
  const [latestListings, setLatestListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchListings = async () => {
      try {
        // FIX: Use a public/unauthenticated endpoint if available, or catch 401
        // and still display whatever data we got. Opening a listing redirects to login.
        const latest = await api.get<PaginatedListings>(
          '/Listing?SortingOption=1&PageSize=8&PageIndex=1',
          // Pass { skipAuth: true } if your api util supports it, OR rely on the
          // try/catch below to capture partial data before any auth redirect fires.
        );
        const data = latest.data || [];
        setLatestListings(data);
        setFeaturedListings(data.slice(0, 6));
      } catch (err: unknown) {
        // Even on 401, if the API returned listings in the response body before
        // throwing, we still want to show them. This ensures the home page is
        // never blank for guests.
        console.warn('Could not fetch listings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchListings();
  }, []);

  const handleSearch = () => {
    navigate(`/houses?search=${searchQuery}&minPrice=${priceRange[0]}&maxPrice=${priceRange[1]}`);
  };

  // Wrap navigate so guests get redirected to login only when they click a card,
  // not when the page loads. HouseCard should call onCardClick instead of
  // navigating directly — if you control HouseCard, pass this down.
  const handleCardClick = (id: string) => {
    navigate(`/houses/${id}`); // router guard will redirect to /login if needed
  };

  return (
    <div className="min-h-screen bg-white">
      {/* ── Hero ── */}
      <div className="relative min-h-[700px] flex items-center overflow-hidden">
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${heroImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.85,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#00A5A7]/70 to-[#34495E]/60 z-[1]" />
        <div className="container mx-auto px-4 relative z-10 w-full pt-24 pb-16">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <h1 className="text-white" style={{ fontSize: '48px', fontWeight: '700', marginBottom: '16px', textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
              Find Your Perfect Student Home
            </h1>
            <p className="text-white" style={{ fontSize: '18px', textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}>
              Discover the best housing options near your university
            </p>
          </div>

          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-2xl p-6 md:p-8">
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search by city (e.g., Cairo, Giza, Alexandria)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="h-12"
                  />
                </div>
                <div className="hidden md:block">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="h-12 px-6 whitespace-nowrap">
                        <SlidersHorizontal className="w-5 h-5 mr-2" />
                        EGP {priceRange[0].toLocaleString()} - {priceRange[1].toLocaleString()}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <div className="space-y-2">
                        <Label className="text-[#34495E]">
                          Price Range: EGP {priceRange[0].toLocaleString()} - EGP {priceRange[1].toLocaleString()}
                        </Label>
                        <Slider min={0} max={10000} step={100} value={priceRange} onValueChange={setPriceRange} className="w-full" />
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="md:hidden">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full h-12">
                      <SlidersHorizontal className="w-5 h-5 mr-2" />
                      EGP {priceRange[0].toLocaleString()} - {priceRange[1].toLocaleString()}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-2">
                      <Label className="text-[#34495E]">
                        Price Range: EGP {priceRange[0].toLocaleString()} - EGP {priceRange[1].toLocaleString()}
                      </Label>
                      <Slider min={0} max={10000} step={100} value={priceRange} onValueChange={setPriceRange} className="w-full" />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <Button onClick={handleSearch} className="bg-[#FF6F61] hover:bg-[#FF6F61]/90 text-white h-12 w-full">
                <Search className="w-5 h-5 mr-2" />
                Search
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Featured Listings Carousel ── */}
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Award className="w-8 h-8 text-[#FFC759]" />
            <h2 className="text-[#34495E]">Featured Listings</h2>
          </div>
          <button
            onClick={() => navigate('/houses')}
            className="text-sm font-medium text-[#00A5A7] hover:underline flex items-center gap-1"
          >
            View All <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <ListingCarousel listings={featuredListings} loading={loading} />
      </div>

      {/* ── Latest Listings Carousel ── */}
      <div className="bg-[#B19CD9]/5 py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-[#00A5A7]" />
              <h2 className="text-[#34495E]">Latest Listings</h2>
            </div>
            <button
              onClick={() => navigate('/houses')}
              className="text-sm font-medium text-[#00A5A7] hover:underline flex items-center gap-1"
            >
              View All <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <ListingCarousel listings={latestListings} loading={loading} />
        </div>
      </div>

      {/* ── CTA ── */}
      <div className="bg-gradient-to-r from-[#00A5A7] to-[#00A5A7]/80 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4">Ready to Find Your Perfect Home?</h2>
          <p className="mb-6" style={{ fontSize: '18px' }}>Browse through verified listings</p>
          <Button onClick={() => navigate('/houses')} className="bg-[#FFC759] hover:bg-[#FFC759]/90 text-[#34495E] px-8 h-12">
            View All Listings
          </Button>
        </div>
      </div>
    </div>
  );
};
