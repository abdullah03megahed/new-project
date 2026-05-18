import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { api } from '../utils/api';
import { HouseCard } from '../components/HouseCard';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Slider } from '../components/ui/slider';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Search, SlidersHorizontal } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../components/ui/sheet';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Bed { id: number; isBooked: boolean; }
interface Room {
  id: number; name: string; bedCount: number;
  pricePerBed: number; roomImages: string[]; beds: Bed[];
}
export interface Listing {
  id: number; title: string; description: string;
  address: string; street: string; city: string;
  furnished: boolean; wifiAvailable: boolean;
  numberOfRooms: number; genderPreference: number;
  status: number; publishedAt: string;
  landlordId: number; landlordName: string;
  listingImages: string[]; rooms: Room[];
  canViewContact: boolean;
  landlordPhoneNumber: string | null;
  exactAddress: string | null;
}
interface PaginatedListings {
  pageIndex: number; pageSize: number;
  count: number; data: Listing[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export const Houses = () => {
  const [searchParams] = useSearchParams();
  const [city, setCity] = useState(searchParams.get('search') || '');
  const [genderPreference, setGenderPreference] = useState('0');
  const [sortingOption, setSortingOption] = useState('3');
  const [priceRange, setPriceRange] = useState([
    parseInt(searchParams.get('minPrice') || '0'),
    parseInt(searchParams.get('maxPrice') || '10000'),
  ]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pageIndex, setPageIndex] = useState(1);
  const [loading, setLoading] = useState(true);
  const pageSize = 12;

  const fetchListings = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (city) params.append('City', city);
      if (genderPreference !== '0') params.append('GenderPreference', genderPreference);
      params.append('SortingOption', sortingOption);
      params.append('PageIndex', String(page));
      params.append('PageSize', String(pageSize));

      const data = await api.get<PaginatedListings>(`/Listing?${params.toString()}`);
      setListings(data.data || []);
      setTotalCount(data.count || 0);
      setPageIndex(page);
    } catch (err) {
      console.error('Failed to fetch listings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings(1);
  }, [genderPreference, sortingOption]);

  const handleSearch = () => fetchListings(1);

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="min-h-screen bg-[#B19CD9]/5">
      <div className="container mx-auto px-4 py-8">
        {/* Search & Filter Bar */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-8">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search by city (e.g., Cairo, Giza)"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="h-12"
              />
            </div>

            {/* Gender Preference Filter */}
            <Select value={genderPreference} onValueChange={setGenderPreference}>
              <SelectTrigger className="h-12 w-40">
                <SelectValue placeholder="Gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Any Gender</SelectItem>
                <SelectItem value="1">Male Only</SelectItem>
                <SelectItem value="2">Female Only</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortingOption} onValueChange={setSortingOption}>
              <SelectTrigger className="h-12 w-44">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">Latest</SelectItem>
                <SelectItem value="1">Price: Low to High</SelectItem>
                <SelectItem value="2">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={handleSearch}
              className="bg-[#00A5A7] hover:bg-[#00A5A7]/90 text-white h-12 px-6"
            >
              <Search className="w-5 h-5 mr-2" />
              Search
            </Button>

            {/* Mobile Filters */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="h-12 md:hidden">
                  <SlidersHorizontal className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                  <SheetDescription>Adjust your search preferences</SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  <div className="space-y-2">
                    <Label>
                      Price Range: EGP {priceRange[0].toLocaleString()} - EGP {priceRange[1].toLocaleString()}
                    </Label>
                    <Slider
                      min={0} max={10000} step={100}
                      value={priceRange}
                      onValueChange={setPriceRange}
                      className="w-full"
                    />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-[#717182]">
            Found <span className="text-[#00A5A7]">{totalCount}</span> properties
          </p>
        </div>

        {/* Listings Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg h-64 animate-pulse" />
            ))}
          </div>
        ) : listings.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {listings.map((listing) => (
                <HouseCard key={listing.id} listing={listing} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  disabled={pageIndex === 1}
                  onClick={() => fetchListings(pageIndex - 1)}
                >
                  Previous
                </Button>
                <span className="flex items-center px-4 text-[#717182]">
                  Page {pageIndex} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={pageIndex === totalPages}
                  onClick={() => fetchListings(pageIndex + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <p className="text-[#717182]" style={{ fontSize: '18px' }}>
              No properties found matching your criteria
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
