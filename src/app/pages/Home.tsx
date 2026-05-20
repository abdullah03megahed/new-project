import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Search, TrendingUp, Award, SlidersHorizontal } from 'lucide-react';
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
        // Fetch latest listings (sorted by publishedAt = option 3)
        const latest = await api.get<PaginatedListings>('/Listing?SortingOption=1&PageSize=8&PageIndex=1');
        setLatestListings(latest.data || []);

        // Fetch first page as "featured" (no featured flag in API, use first 6)
        setFeaturedListings((latest.data || []).slice(0, 6));
      } catch {
        // silently fail — home page still loads
      } finally {
        setLoading(false);
      }
    };
    fetchListings();
  }, []);

  const handleSearch = () => {
    navigate(`/houses?search=${searchQuery}&minPrice=${priceRange[0]}&maxPrice=${priceRange[1]}`);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
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

      {/* Featured Listings */}
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-6">
          <Award className="w-8 h-8 text-[#FFC759]" />
          <h2 className="text-[#34495E]">Featured Listings</h2>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : featuredListings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredListings.map((listing) => (
              <HouseCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <p className="text-[#717182]">No listings available yet.</p>
        )}
      </div>

      {/* Latest Listings */}
      <div className="bg-[#B19CD9]/5 py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-8 h-8 text-[#00A5A7]" />
            <h2 className="text-[#34495E]">Latest Listings</h2>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-64 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : latestListings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {latestListings.map((listing) => (
                <HouseCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <p className="text-[#717182]">No listings available yet.</p>
          )}
        </div>
      </div>

      {/* CTA */}
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
