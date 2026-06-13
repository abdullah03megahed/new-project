import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../utils/AuthContext';
import { api } from '../utils/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import {
  Plus, Edit, Trash2, MapPin, Home, Bed, DollarSign,
  AlertCircle, Crown, BookOpen, User, Calendar, Building2,
} from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '../components/ui/alert-dialog';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BedDto { id: number; isBooked: boolean; bedNumber?: number; }
interface Room {
  id: number; name: string; bedCount: number; pricePerBed: number;
  beds: BedDto[]; roomImages: string[];
}
interface Listing {
  id: number; title: string; address: string; street: string; city: string;
  furnished: boolean; wifiAvailable: boolean; numberOfRooms: number;
  genderPreference: number; status: number; publishedAt: string;
  landlordId: number; landlordName: string;
  listingImages: string[]; rooms: Room[];
  canViewContact: boolean; landlordPhoneNumber: string | null; exactAddress: string | null;
}

interface SubscriptionDto {
  planName: string; maxListings: number; price: number;
  landlordId: number; landlordName: string;
}

// Full booking detail from GetBooking/{id}
interface BookingDetail {
  id: number;
  startDate: string;
  endDate: string;
  status: number;       // 1=Active, 2=Cancelled, 3=Completed
  studentId: number;
  bedId: number;
  listingId: number;
  landLordId: number;
  studentName: string;
  roomId: number;
  landlordName: string;
  amount: number;
  type: number;         // 1=Single Bed, 2=Entire Room
}

// Minimal summary returned by the list endpoint
interface BookingSummary {
  id: number;
  startDate: string;
  endDate: string;
  listingId: number;
  bedId: number;
}

interface PaginatedBookings {
  pageIndex: number; pageSize: number; count: number; data: BookingSummary[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const IMAGE_BASE = 'https://unimate.runasp.net/';

const prefixImage = (img: string) => {
  if (!img) return '';
  if (img.startsWith('http://') || img.startsWith('https://')) return img;
  return `${IMAGE_BASE}${img.startsWith('/') ? img.slice(1) : img}`;
};

const PLAN_STYLES: Record<string, { color: string; bg: string; label: string }> = {
  freemium:     { color: '#717182', bg: 'rgba(113,113,130,0.12)', label: 'Freemium' },
  basic:        { color: '#00A5A7', bg: 'rgba(0,165,167,0.12)',   label: 'Basic' },
  professional: { color: '#FFC759', bg: 'rgba(255,199,89,0.12)',  label: 'Professional' },
};

const bookingStatusInfo = (s: number) => {
  if (s === 1) return { label: 'Active',    color: 'bg-green-100 text-green-700 border-green-200' };
  if (s === 2) return { label: 'Cancelled', color: 'bg-gray-100 text-gray-500 border-gray-200' };
  if (s === 3) return { label: 'Completed', color: 'bg-blue-100 text-blue-700 border-blue-200' };
  return { label: 'Unknown', color: 'bg-gray-100 text-gray-400' };
};

const bookingTypeLabel = (t: number) =>
  t === 1 ? 'Single Bed' : t === 2 ? 'Entire Room' : '—';

const formatDate = (d: string) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

// ─── Booking Detail Dialog ────────────────────────────────────────────────────

interface BookingDetailDialogProps {
  booking: BookingDetail | null;
  open: boolean;
  onClose: () => void;
  listingTitle?: string;
}

const BookingDetailDialog = ({ booking, open, onClose, listingTitle }: BookingDetailDialogProps) => {
  const navigate = useNavigate();
  if (!booking) return null;

  const { label, color } = bookingStatusInfo(booking.status);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#34495E]">Booking Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge className={`${color} border text-xs`}>{label}</Badge>
            <span className="text-xs text-[#717182]">Booking #{booking.id}</span>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Building2 className="w-4 h-4 text-[#00A5A7] flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-[#717182]">Listing</p>
                <p className="text-[#34495E] font-medium truncate">
                  {listingTitle || `Listing #${booking.listingId}`}
                </p>
              </div>
            </div>

            {booking.studentName && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <User className="w-4 h-4 text-[#00A5A7] flex-shrink-0" />
                <div>
                  <p className="text-xs text-[#717182]">Student</p>
                  <p className="text-[#34495E] font-medium">{booking.studentName}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Bed className="w-4 h-4 text-[#00A5A7] flex-shrink-0" />
              <div>
                <p className="text-xs text-[#717182]">Bed / Type</p>
                <p className="text-[#34495E] font-medium">
                  Bed #{booking.bedId} · {bookingTypeLabel(booking.type)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Calendar className="w-4 h-4 text-[#00A5A7] flex-shrink-0" />
              <div>
                <p className="text-xs text-[#717182]">Duration</p>
                <p className="text-[#34495E] font-medium">
                  {formatDate(booking.startDate)} → {formatDate(booking.endDate)}
                </p>
              </div>
            </div>

            {booking.amount > 0 && (
              <div className="flex items-center gap-3 p-3 bg-[#FF6F61]/5 rounded-lg border border-[#FF6F61]/20">
                <DollarSign className="w-4 h-4 text-[#FF6F61] flex-shrink-0" />
                <div>
                  <p className="text-xs text-[#717182]">Total Amount</p>
                  <p className="text-[#FF6F61] font-semibold text-base">
                    EGP {booking.amount.toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </div>

          <Button
            variant="outline"
            onClick={() => { onClose(); navigate(`/house/${booking.listingId}`); }}
            className="w-full border-[#00A5A7] text-[#00A5A7] hover:bg-[#00A5A7] hover:text-white"
          >
            View Listing
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────

export const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab]       = useState<'properties' | 'bookings'>('properties');
  const [listings, setListings]         = useState<Listing[]>([]);
  const [loading, setLoading]           = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionDto | null>(null);

  // Full booking details — fetched eagerly so student names & amounts are visible in list
  const [bookings, setBookings]               = useState<BookingDetail[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsFetched, setBookingsFetched] = useState(false);

  // Detail dialog
  const [selectedBooking, setSelectedBooking] = useState<BookingDetail | null>(null);
  const [detailOpen, setDetailOpen]           = useState(false);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#00A5A7] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || user.type !== 'landlord') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[#717182]">Access denied. Landlords only.</p>
      </div>
    );
  }

  const profileIncomplete = !user.nationalId;

  // ─── Fetch listings & subscription ─────────────────────────────────────────
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [listingsData, subData] = await Promise.allSettled([
          api.get<Listing[]>('/Listing/listingsByLandLord'),
          api.get<SubscriptionDto>('/Subscription'),
        ]);
        if (listingsData.status === 'fulfilled') setListings(listingsData.value || []);
        else toast.error('Failed to load your listings.');
        if (subData.status === 'fulfilled') setSubscription(subData.value);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // ─── Fetch bookings (lazy, once) — get summaries then hydrate each with full detail ──
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (activeTab !== 'bookings' || bookingsFetched || !user?.id) return;
    setBookingsLoading(true);

    const loadBookings = async () => {
      try {
        // Step 1: get paginated summary list
        const paged = await api.get<PaginatedBookings>(
          `/Booking/GetLandLordBookings/${user.id}?PageIndex=1&PageSize=100`
        );
        const summaries: BookingSummary[] = paged?.data || [];

        if (summaries.length === 0) {
          setBookings([]);
          setBookingsFetched(true);
          return;
        }

        // Step 2: fetch full detail for each booking in parallel
        const details = await Promise.all(
          summaries.map(s =>
            api.get<BookingDetail>(`/Booking/GetBooking/${s.id}`).catch(() => null)
          )
        );

        setBookings(details.filter(Boolean) as BookingDetail[]);
        setBookingsFetched(true);
      } catch {
        toast.error('Failed to load bookings.');
      } finally {
        setBookingsLoading(false);
      }
    };

    loadBookings();
  }, [activeTab, bookingsFetched, user?.id]);

  const handleDelete = async (listingId: number) => {
    try {
      await api.delete(`/Listing/${listingId}`);
      setListings(prev => prev.filter(l => l.id !== listingId));
      toast.success('Property deleted successfully');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete listing.');
    }
  };

  const handleAddProperty = () => {
    if (profileIncomplete) {
      toast.error('Please complete your profile before adding a property.');
      navigate('/complete-profile');
      return;
    }
    navigate('/add-house');
  };

  // ─── Stats ─────────────────────────────────────────────────────────────────
  // Compute per-listing bed counts from rooms.beds (fallback to bedCount if beds array empty)
  const getBedCounts = (listing: Listing) => {
    const allBeds = listing.rooms.flatMap(r => r.beds || []);
    if (allBeds.length > 0) {
      return {
        available: allBeds.filter(b => !b.isBooked).length,
        total: allBeds.length,
      };
    }
    // Fallback: use bedCount field when beds array isn't populated
    const total = listing.rooms.reduce((sum, r) => sum + (r.bedCount || 0), 0);
    return { available: total, total };
  };

  const totalAvailableBeds = listings.reduce((sum, l) => sum + getBedCounts(l).available, 0);
  const totalBookedBeds    = listings.reduce((sum, l) => {
    const { available, total } = getBedCounts(l);
    return sum + (total - available);
  }, 0);

  const allPrices  = listings.flatMap(l => l.rooms.map(r => r.pricePerBed)).filter(p => p > 0);
  const lowestPrice = allPrices.length > 0 ? Math.min(...allPrices) : 0;

  const activeBookingsCount = bookings.filter(b => b.status === 1).length;

  const planKey    = subscription?.planName?.toLowerCase() ?? 'freemium';
  const planStyle  = PLAN_STYLES[planKey] ?? PLAN_STYLES.freemium;
  const isPaidPlan = planKey !== 'freemium';

  return (
    <div className="min-h-screen bg-[#B19CD9]/5">
      <div className="container mx-auto px-4 py-8">

        {/* Booking detail dialog — pre-loaded data, no extra fetch needed */}
        <BookingDetailDialog
          booking={selectedBooking}
          open={detailOpen}
          onClose={() => { setDetailOpen(false); setSelectedBooking(null); }}
          listingTitle={listings.find(l => l.id === selectedBooking?.listingId)?.title}
        />

        {/* Profile incomplete banner */}
        {profileIncomplete && (
          <div className="mb-6 p-4 bg-[#FFC759]/10 border border-[#FFC759]/40 rounded-lg flex flex-col sm:flex-row items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#FFC759] flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-[#34495E] font-medium">Your profile is incomplete</p>
              <p className="text-[#717182] text-sm mt-1">
                Complete your profile to start adding and managing properties.
              </p>
            </div>
            <Button onClick={() => navigate('/complete-profile')} size="sm"
              className="bg-[#FF6F61] hover:bg-[#FF6F61]/90 text-white flex-shrink-0">
              Complete Profile
            </Button>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
          <div>
            <h1 className="text-[#34495E] mb-2">Landlord Dashboard</h1>
            <p className="text-[#717182]">Manage your property listings</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium cursor-pointer transition-opacity hover:opacity-80"
              style={{ borderColor: planStyle.color, background: planStyle.bg, color: planStyle.color }}
              onClick={() => navigate('/subscription')}
            >
              <Crown className="w-4 h-4" />
              <span>{planStyle.label}</span>
              {!isPaidPlan && <span className="text-xs opacity-70 hidden sm:inline">· Upgrade</span>}
            </div>
            <Button onClick={() => navigate('/subscription')} variant="outline" size="sm"
              className="border-[#00A5A7] text-[#00A5A7] hover:bg-[#00A5A7] hover:text-white hidden sm:flex">
              <Crown className="w-4 h-4 mr-2" />{isPaidPlan ? 'Manage Plan' : 'Upgrade Plan'}
            </Button>
            <Button onClick={handleAddProperty} className="bg-[#FF6F61] hover:bg-[#FF6F61]/90 text-white">
              <Plus className="w-5 h-5 mr-2" />Add New Property
            </Button>
          </div>
        </div>

        {/* Freemium nudge */}
        {!loading && !isPaidPlan && listings.length > 0 && (
          <div
            className="mb-6 p-4 bg-[#00A5A7]/8 border border-[#00A5A7]/25 rounded-lg flex flex-col sm:flex-row items-start sm:items-center gap-3 cursor-pointer hover:border-[#00A5A7]/50 transition-colors"
            onClick={() => navigate('/subscription')}
          >
            <Crown className="w-5 h-5 text-[#00A5A7] flex-shrink-0" />
            <div className="flex-1">
              <p className="text-[#34495E] font-medium text-sm">You're on the Freemium plan — limited to 3 listings</p>
              <p className="text-[#717182] text-xs mt-0.5">Upgrade to Basic or Professional to list more properties.</p>
            </div>
            <Button size="sm" className="bg-[#00A5A7] hover:bg-[#00A5A7]/90 text-white flex-shrink-0"
              onClick={(e) => { e.stopPropagation(); navigate('/subscription'); }}>
              View Plans
            </Button>
          </div>
        )}

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-[#717182] text-sm">Total Listings</CardTitle>
              <Home className="w-5 h-5 text-[#00A5A7]" />
            </CardHeader>
            <CardContent>
              <div className="text-[#34495E] text-3xl font-bold">{listings.length}</div>
              {subscription && (
                <p className="text-[#717182] text-xs mt-1">of {subscription.maxListings.toLocaleString()} allowed</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-[#717182] text-sm">Available Beds</CardTitle>
              <Bed className="w-5 h-5 text-[#B8E986]" />
            </CardHeader>
            <CardContent>
              <div className="text-[#34495E] text-3xl font-bold">
                {loading ? <span className="text-gray-300 animate-pulse">—</span> : totalAvailableBeds}
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:border-[#00A5A7] hover:shadow-md transition-all"
            onClick={() => setActiveTab('bookings')}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-[#717182] text-sm">Booked Beds</CardTitle>
              <Bed className="w-5 h-5 text-[#FF6F61]" />
            </CardHeader>
            <CardContent>
              <div className="text-[#34495E] text-3xl font-bold">
                {loading ? <span className="text-gray-300 animate-pulse">—</span> : totalBookedBeds}
              </div>
              <p className="text-[#00A5A7] text-xs mt-1">Click to view bookings →</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-[#717182] text-sm">Starting From</CardTitle>
              <DollarSign className="w-5 h-5 text-[#FFC759]" />
            </CardHeader>
            <CardContent>
              <div className="text-[#34495E] text-2xl font-bold">
                {loading ? <span className="text-gray-300 animate-pulse">—</span>
                  : lowestPrice > 0 ? `EGP ${lowestPrice.toLocaleString()}` : '—'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 mb-6 border-b border-gray-200">
          <button onClick={() => setActiveTab('properties')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'properties'
                ? 'border-[#00A5A7] text-[#00A5A7]'
                : 'border-transparent text-[#717182] hover:text-[#34495E]'}`}>
            <Home className="w-4 h-4 inline mr-2" />Your Properties
          </button>
          <button onClick={() => setActiveTab('bookings')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'bookings'
                ? 'border-[#00A5A7] text-[#00A5A7]'
                : 'border-transparent text-[#717182] hover:text-[#34495E]'}`}>
            <BookOpen className="w-4 h-4" />
            Bookings
            {activeBookingsCount > 0 && (
              <span className="bg-[#00A5A7] text-white text-xs px-1.5 py-0.5 rounded-full">
                {activeBookingsCount}
              </span>
            )}
          </button>
        </div>

        {/* ══ PROPERTIES TAB ══ */}
        {activeTab === 'properties' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-[#34495E]">Your Properties</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse" />)}
                </div>
              ) : listings.length === 0 ? (
                <div className="text-center py-12">
                  <Home className="w-16 h-16 text-[#717182] mx-auto mb-4" />
                  <p className="text-[#717182] mb-4">No properties listed yet</p>
                  {profileIncomplete ? (
                    <Button onClick={() => navigate('/complete-profile')}
                      className="bg-[#00A5A7] hover:bg-[#00A5A7]/90 text-white">Complete Profile First</Button>
                  ) : (
                    <Button onClick={() => navigate('/add-house')}
                      className="bg-[#00A5A7] hover:bg-[#00A5A7]/90 text-white">Add Your First Property</Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {listings.map((listing) => {
                    const { available, total } = getBedCounts(listing);
                    const coverImage = listing.listingImages[0] ? prefixImage(listing.listingImages[0]) : null;

                    return (
                      <div key={listing.id}
                        className="flex flex-col md:flex-row gap-4 p-4 border rounded-lg hover:border-[#00A5A7]/40 transition-colors">
                        {coverImage ? (
                          <img src={coverImage} alt={listing.title}
                            className="w-full md:w-48 h-32 object-cover rounded-lg flex-shrink-0"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        ) : (
                          <div className="w-full md:w-48 h-32 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Home className="w-8 h-8 text-gray-300" />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2 gap-2">
                            <div className="min-w-0">
                              <h3
                                className="text-[#34495E] font-medium mb-1 hover:text-[#00A5A7] cursor-pointer truncate"
                                onClick={() => navigate(`/house/${listing.id}`)}>
                                {listing.title}
                              </h3>
                              <div className="flex items-center gap-2 text-[#717182] text-sm">
                                <MapPin className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate">{listing.address}, {listing.city}</span>
                              </div>
                            </div>
                            <Badge className={`flex-shrink-0 ${listing.status === 1
                              ? 'bg-[#B8E986] text-[#34495E] border-0'
                              : 'bg-gray-100 text-gray-500 border-0'}`}>
                              {listing.status === 1 ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-4 mb-3 flex-wrap text-sm text-[#717182]">
                            {/* Beds available — show clearly */}
                            <span className={`font-medium ${available === 0 ? 'text-[#FF6F61]' : 'text-[#00A5A7]'}`}>
                              {available}/{total} beds available
                            </span>
                            {listing.rooms.length > 0 && (
                              <span>{listing.rooms.length} room{listing.rooms.length !== 1 ? 's' : ''}</span>
                            )}
                            {listing.furnished && <Badge variant="outline" className="text-xs">Furnished</Badge>}
                            {listing.wifiAvailable && <Badge variant="outline" className="text-xs">WiFi</Badge>}
                          </div>

                          {/* Per-room bed breakdown */}
                          {listing.rooms.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                              {listing.rooms.map((room, idx) => {
                                const roomBeds = room.beds || [];
                                const roomAvail = roomBeds.length > 0
                                  ? roomBeds.filter(b => !b.isBooked).length
                                  : room.bedCount;
                                const roomTotal = roomBeds.length > 0 ? roomBeds.length : room.bedCount;
                                return (
                                  <span key={room.id}
                                    className="text-xs px-2 py-1 bg-gray-50 border rounded text-[#717182]">
                                    Room {idx + 1}: {roomAvail}/{roomTotal} free
                                    {room.pricePerBed > 0 && ` · EGP ${room.pricePerBed.toLocaleString()}`}
                                  </span>
                                );
                              })}
                            </div>
                          )}

                          <div className="flex gap-2">
                            <Button
                              onClick={(e) => { e.stopPropagation(); navigate(`/add-house?edit=${listing.id}`); }}
                              variant="outline" size="sm"
                              className="border-[#00A5A7] text-[#00A5A7] hover:bg-[#00A5A7] hover:text-white">
                              <Edit className="w-4 h-4 mr-2" />Edit
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button onClick={(e) => e.stopPropagation()} variant="outline" size="sm"
                                  className="border-[#FF6F61] text-[#FF6F61] hover:bg-[#FF6F61] hover:text-white">
                                  <Trash2 className="w-4 h-4 mr-2" />Delete
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete "{listing.title}" and cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={(e) => { e.stopPropagation(); handleDelete(listing.id); }}
                                    className="bg-[#FF6F61] hover:bg-[#FF6F61]/90">
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ══ BOOKINGS TAB ══ */}
        {activeTab === 'bookings' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-[#34495E] flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#00A5A7]" />
                Property Bookings
                {!bookingsLoading && bookings.length > 0 && (
                  <span className="text-sm text-[#717182] font-normal">
                    ({bookings.length} total · {activeBookingsCount} active)
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {bookingsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />)}
                </div>
              ) : bookings.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="w-12 h-12 text-[#717182] mx-auto mb-3" />
                  <p className="text-[#717182]">No bookings yet for your properties.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {bookings.map((booking) => {
                    const { label, color } = bookingStatusInfo(booking.status);
                    const relatedListing = listings.find(l => l.id === booking.listingId);

                    return (
                      <div key={booking.id}
                        className="p-4 border rounded-lg space-y-2 hover:border-[#00A5A7]/40 transition-colors cursor-pointer"
                        onClick={() => { setSelectedBooking(booking); setDetailOpen(true); }}>

                        <div className="flex items-start justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <Badge className={`${color} border text-xs flex-shrink-0`}>{label}</Badge>
                            <span className="text-sm text-[#34495E] font-medium truncate">
                              {relatedListing?.title || `Listing #${booking.listingId}`}
                            </span>
                            <span className="text-xs text-[#717182] flex-shrink-0">
                              #{booking.id}
                            </span>
                          </div>
                          {booking.amount > 0 && (
                            <span className="text-sm text-[#FF6F61] font-semibold flex-shrink-0">
                              EGP {booking.amount.toLocaleString()}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm text-[#717182]">
                          {booking.studentName && (
                            <span className="flex items-center gap-1 text-[#34495E]">
                              <User className="w-3.5 h-3.5 text-[#00A5A7]" />
                              {booking.studentName}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Bed className="w-3.5 h-3.5" />
                            Bed #{booking.bedId} · {bookingTypeLabel(booking.type)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(booking.startDate)} → {formatDate(booking.endDate)}
                          </span>
                        </div>

                        <p className="text-xs text-[#00A5A7]">Click to view full details →</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
};
