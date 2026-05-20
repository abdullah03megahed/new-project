import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { api } from '../utils/api';
import { HouseCard } from '../components/HouseCard';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Search } from 'lucide-react';

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

  // ── Filter state — matches backend params exactly ──────────────────────────
  const [city, setCity] = useState(searchParams.get('search') || '');
  // '' = no filter, '1' = Male, '2' = Female
  const [genderPreference, setGenderPreference] = useState('all');
  // '1' = PriceAsc, '2' = PriceDesc, '3' = Latest (PublishedAt)
  const [sortingOption, setSortingOption] = useState('1');

  const [listings, setListings] = useState<Listing[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pageIndex, setPageIndex] = useState(1);
  const [loading, setLoading] = useState(true);
  const pageSize = 12;

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchListings = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      // City — exact match filter
      if (city.trim()) params.append('City', city.trim());

      // GenderPreference — only send if a specific gender is selected
      // Backend accepts: 1 (Male), 2 (Female). Don't send 0 or empty.
      if (genderPreference === '1' || genderPreference === '2') {
        params.append('GenderPreference', genderPreference);
      }

      // SortingOption — 1=PriceAsc, 2=PriceDesc, 3=Latest
      params.append('SortingOption', sortingOption);

      // Pagination
      params.append('PageIndex', String(page));
      params.append('PageSize', String(pageSize));

      const data = await api.get<PaginatedListings>(`/Listing?${params.toString()}`);
      setListings(data.data || []);
      setTotalCount(data.count || 0);
      setPageIndex(page);
    } catch (err) {
      console.error('Failed to fetch listings', err);
      setListings([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch when dropdowns change (city uses the Search button)
  useEffect(() => {
    fetchListings(1);
  }, [genderPreference, sortingOption]);

  const handleSearch = () => fetchListings(1);

  const totalPages = Math.ceil(totalCount / pageSize);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#B19CD9]/5">
      <div className="container mx-auto px-4 py-8">

        {/* ── Search & Filter Bar ── */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-8">
          <div className="flex gap-3 flex-wrap items-end">

            {/* City search */}
            <div className="flex-1 min-w-[200px] space-y-1">
              <Label className="text-xs text-[#717182]">City</Label>
              <Input
                placeholder="e.g., Cairo, Giza, Alexandria"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="h-11"
              />
            </div>

            {/* Gender Preference — matches backend enum: 1=Male, 2=Female */}
            <div className="space-y-1">
              <Label className="text-xs text-[#717182]">Gender Preference</Label>
              <Select value={genderPreference} onValueChange={setGenderPreference}>
                <SelectTrigger className="h-11 w-40">
                  <SelectValue placeholder="Any gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any</SelectItem>
                  <SelectItem value="1">Male Only</SelectItem>
                  <SelectItem value="2">Female Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort — matches backend SortingOptions enum */}
            <div className="space-y-1">
              <Label className="text-xs text-[#717182]">Sort By</Label>
              <Select value={sortingOption} onValueChange={setSortingOption}>
                <SelectTrigger className="h-11 w-44">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">Latest</SelectItem>
                  <SelectItem value="1">Price: Low to High</SelectItem>
                  <SelectItem value="2">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Search button */}
            <Button
              onClick={handleSearch}
              className="bg-[#00A5A7] hover:bg-[#00A5A7]/90 text-white h-11 px-6"
            >
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>

            {/* Reset filters */}
            {(city || genderPreference || sortingOption !== '3') && (
              <Button
                variant="ghost"
                onClick={() => {
                  setCity('');
                  setGenderPreference('');
                  setSortingOption('3');
                }}
                className="h-11 text-[#717182] hover:text-[#34495E]"
              >
                Reset
              </Button>
            )}
          </div>

          {/* Active filter tags */}
          {(city || genderPreference) && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {city && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#00A5A7]/10 text-[#00A5A7] rounded-full text-sm">
                  City: {city}
                  <button onClick={() => { setCity(''); fetchListings(1); }} className="ml-1 hover:text-[#FF6F61]">×</button>
                </span>
              )}
              {genderPreference && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#B19CD9]/20 text-[#34495E] rounded-full text-sm">
                  {genderPreference === '1' ? 'Male Only' : 'Female Only'}
                  <button onClick={() => setGenderPreference('')} className="ml-1 hover:text-[#FF6F61]">×</button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Results count */}
        <div className="mb-6">
          <p className="text-[#717182]">
            {loading ? 'Searching...' : (
              <>Found <span className="text-[#00A5A7] font-medium">{totalCount}</span> {totalCount === 1 ? 'property' : 'properties'}</>
            )}
          </p>
        </div>

        {/* ── Listings Grid ── */}
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
              <div className="flex justify-center items-center gap-2 mt-10">
                <Button
                  variant="outline"
                  disabled={pageIndex === 1}
                  onClick={() => fetchListings(pageIndex - 1)}
                >
                  Previous
                </Button>
                <span className="px-4 text-[#717182] text-sm">
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
          <div className="text-center py-16 space-y-3">
            <p className="text-[#717182] text-lg">No properties found matching your criteria</p>
            {(city || genderPreference) && (
              <Button
                variant="outline"
                onClick={() => { setCity(''); setGenderPreference(''); setSortingOption('3'); }}
                className="border-[#00A5A7] text-[#00A5A7]"
              >
                Clear filters
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
