import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { api } from '../utils/api';
import { HouseCard } from '../components/HouseCard';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Search, Sparkles, LogIn, UserPlus } from 'lucide-react';

interface Bed { id: number; isBooked: boolean; }
interface Room {
  id: number; name: string; bedCount: number;
  pricePerBed: number; roomImages: string[]; beds: Bed[];
  isFullyRented: boolean; canBookEntireRoom: boolean; canBookSingleBed: boolean;
}
export interface Listing {
  id: number; title: string; description: string;
  pricePerMonth: number;
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

export interface MatchedListing extends Listing {
  isFullyRented: boolean;
  overallScore: number;
  compatibilityLabel: string;
  pricePerBed: number;
}

// ─── Helper: decode role from JWT stored in localStorage ──────────────────────
function getUserRole(): string | null {
  // 1. Check explicit role key first (most reliable)
  const explicitRole = localStorage.getItem('role');
  if (explicitRole) return explicitRole;

  // 2. Fallback: decode JWT payload
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return (
      payload['role'] ||
      payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
      payload['Role'] ||
      null
    );
  } catch {
    return null;
  }
}

// ─── Guest Banner (same style as Home page) ───────────────────────────────────
const GuestBanner = () => {
  const navigate = useNavigate();
  return (
    <div className="mb-8">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-xl border border-[#FFC759]/40 p-6 md:p-8 text-center">
        <h3 className="text-[#34495E] mb-2" style={{ fontSize: '22px', fontWeight: '700' }}>
          🎓 Your Perfect Student Home Might Be Just a Click Away!
        </h3>
        <p className="text-[#717182] mb-1">
          Unlock full property details, room photos, pricing and availability by creating your free account.
        </p>
        <p className="text-[#34495E] mb-5 font-medium">
          Start your housing journey today — it's completely free.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <Button variant="outline" onClick={() => navigate('/login')} className="h-11 px-6">
            <LogIn className="w-4 h-4 mr-2" /> Log In
          </Button>
          <Button
            onClick={() => navigate('/signup')}
            className="bg-[#00A5A7] hover:bg-[#00A5A7]/90 text-white h-11 px-6"
          >
            <UserPlus className="w-4 h-4 mr-2" /> Sign Up Free
          </Button>
        </div>
      </div>
    </div>
  );
};

// ─── Houses Page ──────────────────────────────────────────────────────────────
export const Houses = () => {
  const [searchParams] = useSearchParams();
  const [city, setCity] = useState(searchParams.get('search') || '');
  const [genderPreference, setGenderPreference] = useState('all');
  const [sortingOption, setSortingOption] = useState('1');
  const [listings, setListings] = useState<Listing[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);

  // Auth / role state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showFindMatch, setShowFindMatch] = useState(false);

  // Roommate matching state
  const [matchMode, setMatchMode] = useState(false);
  const [matchedListings, setMatchedListings] = useState<MatchedListing[]>([]);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchError, setMatchError] = useState(false);

  // ── Determine auth state and role on mount ────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('token');
    const loggedIn = !!token;
    setIsLoggedIn(loggedIn);

    if (loggedIn) {
      const role = getUserRole();
      // "Find A Match" is ONLY for students — any other role (Admin, Landlord,
      // unknown) will NOT see the button.
      const isStudent = role?.toLowerCase() === 'student';
      setShowFindMatch(isStudent);
    } else {
      setShowFindMatch(false);
    }
  }, []);

  const fetchListings = async (
    page = 1,
    overrideCity?: string,
    overrideGender?: string,
    overrideSort?: string,
    overridePageSize?: number,
  ) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      const c = overrideCity !== undefined ? overrideCity : city;
      const g = overrideGender !== undefined ? overrideGender : genderPreference;
      const s = overrideSort !== undefined ? overrideSort : sortingOption;
      const ps = overridePageSize !== undefined ? overridePageSize : pageSize;

      if (c.trim()) params.append('City', c.trim());
      if (g === '1' || g === '2') params.append('GenderPreference', g);
      params.append('SortingOption', s);
      params.append('PageIndex', String(page));
      params.append('PageSize', String(ps));

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

  useEffect(() => {
    fetchListings(1);
  }, [genderPreference, sortingOption, pageSize]);

  const exitMatchMode = () => {
    if (matchMode) setMatchMode(false);
  };

  const handleSearch = () => {
    exitMatchMode();
    fetchListings(1);
  };

  const handleReset = () => {
    exitMatchMode();
    setCity('');
    setGenderPreference('all');
    setSortingOption('1');
    setPageSize(10);
    fetchListings(1, '', 'all', '1', 10);
  };

  const handlePageSizeChange = (val: string) => {
    exitMatchMode();
    const ps = parseInt(val);
    setPageSize(ps);
    setPageIndex(1);
  };

  const handleGenderChange = (val: string) => {
    exitMatchMode();
    setGenderPreference(val);
  };

  const handleSortChange = (val: string) => {
    exitMatchMode();
    setSortingOption(val);
  };

  const handleFindMatch = async () => {
    if (matchMode) {
      setMatchMode(false);
      return;
    }

    setMatchMode(true);
    setMatchLoading(true);
    setMatchError(false);
    try {
      const matchParams = new URLSearchParams();
      if (city.trim()) matchParams.append('city',city.trim);
      const query = matchParams.toString();
      const data = await api.get<MatchedListing[]>('/Matching/roommate${query ? `?${query}` : ''} ');
      setMatchedListings(data || []);
    } catch (err) {
      console.error('Failed to fetch roommate matches', err);
      setMatchedListings([]);
      setMatchError(true);
    } finally {
      setMatchLoading(false);
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);
  const hasFilters = city.trim() !== '' || genderPreference !== 'all' || sortingOption !== '1';

  return (
    <div className="min-h-screen bg-[#B19CD9]/5">
      <div className="container mx-auto px-4 py-8">

        {/* ── Search & Filter Bar ─────────────────────────────────────────── */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-8">
          <div className="flex gap-3 flex-wrap items-end">

            {/* City */}
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

            {/* Gender Preference */}
            <div className="space-y-1">
              <Label className="text-xs text-[#717182]">Gender Preference</Label>
              <Select value={genderPreference} onValueChange={handleGenderChange}>
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

            {/* Sort */}
            <div className="space-y-1">
              <Label className="text-xs text-[#717182]">Sort By</Label>
              <Select value={sortingOption} onValueChange={handleSortChange}>
                <SelectTrigger className="h-11 w-44">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Price: Low to High</SelectItem>
                  <SelectItem value="2">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Per page */}
            <div className="space-y-1">
              <Label className="text-xs text-[#717182]">Per Page</Label>
              <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
                <SelectTrigger className="h-11 w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="15">15</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleSearch}
              className="bg-[#00A5A7] hover:bg-[#00A5A7]/90 text-white h-11 px-6"
            >
              <Search className="w-4 h-4 mr-2" />Search
            </Button>

            {/* Only shown for students */}
            {showFindMatch && (
              <Button
                onClick={handleFindMatch}
                className="bg-[#00A5A7] hover:bg-[#00A5A7]/90 text-white h-11 px-6"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {matchMode ? 'Back to Search' : 'Find A Match'}
              </Button>
            )}

            {hasFilters && (
              <Button
                variant="ghost"
                onClick={handleReset}
                className="h-11 text-[#717182] hover:text-[#34495E]"
              >
                Reset
              </Button>
            )}
          </div>

          {/* Active filter tags */}
          {(city.trim() || genderPreference !== 'all') && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {city.trim() && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#00A5A7]/10 text-[#00A5A7] rounded-full text-sm">
                  City: {city}
                  <button
                    onClick={() => {
                      exitMatchMode();
                      setCity('');
                      fetchListings(1, '', genderPreference, sortingOption);
                    }}
                    className="ml-1 hover:text-[#FF6F61]"
                  >×</button>
                </span>
              )}
              {genderPreference !== 'all' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#B19CD9]/20 text-[#34495E] rounded-full text-sm">
                  {genderPreference === '1' ? 'Male Only' : 'Female Only'}
                  <button
                    onClick={() => {
                      exitMatchMode();
                      setGenderPreference('all');
                    }}
                    className="ml-1 hover:text-[#FF6F61]"
                  >×</button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── Guest Banner — non-logged-in visitors only ──────────────────── */}
        {!isLoggedIn && <GuestBanner />}

        {/* ── Results count ───────────────────────────────────────────────── */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-[#717182]">
            {matchMode ? (
              matchLoading
                ? 'Finding your best matches...'
                : (
                  <>
                    Found{' '}
                    <span className="text-[#00A5A7] font-medium">{matchedListings.length}</span>{' '}
                    {matchedListings.length === 1 ? 'compatible roommate' : 'compatible roommates'}
                  </>
                )
            ) : (
              loading
                ? 'Searching...'
                : (
                  <>
                    Found{' '}
                    <span className="text-[#00A5A7] font-medium">{totalCount}</span>{' '}
                    {totalCount === 1 ? 'property' : 'properties'}
                  </>
                )
            )}
          </p>
          {!matchMode && totalPages > 1 && (
            <p className="text-[#717182] text-sm">Page {pageIndex} of {totalPages}</p>
          )}
        </div>

        {/* ── Listings Grid ───────────────────────────────────────────────── */}
        {matchMode ? (
          matchLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-lg h-64 animate-pulse" />
              ))}
            </div>
          ) : matchError ? (
            <div className="text-center py-16 space-y-3">
              <p className="text-[#717182] text-lg">Something went wrong while finding your matches</p>
              <Button
                variant="outline"
                onClick={handleFindMatch}
                className="border-[#00A5A7] text-[#00A5A7]"
              >
                Try again
              </Button>
            </div>
          ) : matchedListings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {matchedListings.map((listing) => (
                <div key={listing.id} className="relative">
                  <HouseCard listing={listing} />

                  {/* Compatibility badge */}
                  <div className="absolute top-3 right-3 z-10 bg-[#00A5A7] text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-md">
                    {listing.overallScore}% · {listing.compatibilityLabel}
                  </div>

                  {/* Price overlay */}
                  <div className="absolute bottom-3 left-3 z-10 flex flex-col gap-1">
                    {listing.pricePerMonth > 0 && (
                      <span className="bg-white/90 backdrop-blur-sm text-[#34495E] text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm border border-gray-100">
                        {listing.pricePerMonth.toLocaleString()} EGP / month
                      </span>
                    )}
                    {listing.pricePerBed > 0 && (
                      <span className="bg-white/90 backdrop-blur-sm text-[#717182] text-xs px-2.5 py-1 rounded-full shadow-sm border border-gray-100">
                        {listing.pricePerBed.toLocaleString()} EGP / bed
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 space-y-3">
              <p className="text-[#717182] text-lg">No roommate matches found yet</p>
              <p className="text-[#717182] text-sm">
                Try completing your roommate preferences to get matches
              </p>
            </div>
          )
        ) : loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: pageSize }).map((_, i) => (
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
            {hasFilters && (
              <Button
                variant="outline"
                onClick={handleReset}
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
