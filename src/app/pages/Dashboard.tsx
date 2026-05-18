import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../utils/AuthContext';
import { api } from '../utils/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Plus, Edit, Trash2, MapPin, DollarSign, Home, Bed } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '../components/ui/alert-dialog';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BedDto { id: number; isBooked: boolean; }
interface Room { id: number; name: string; bedCount: number; pricePerBed: number; beds: BedDto[]; }
interface Listing {
  id: number; title: string; address: string; street: string; city: string;
  furnished: boolean; wifiAvailable: boolean; numberOfRooms: number;
  genderPreference: number; status: number; publishedAt: string;
  landlordId: number; landlordName: string;
  listingImages: string[]; rooms: Room[];
  canViewContact: boolean; landlordPhoneNumber: string | null; exactAddress: string | null;
}

const IMAGE_BASE = 'https://unimate.runasp.net/';

// ─── Component ────────────────────────────────────────────────────────────────

export const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const data = await api.get<Listing[]>('/Listing/listingsByLandLord');
        setListings(data || []);
      } catch (err) {
        toast.error('Failed to load your listings.');
      } finally {
        setLoading(false);
      }
    };
    if (user?.type === 'landlord') fetchListings();
  }, [user]);

  if (!user || user.type !== 'landlord') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[#717182]">Access denied. Landlords only.</p>
      </div>
    );
  }

  const handleDelete = async (listingId: number) => {
    try {
      await api.delete(`/Listing/${listingId}`);
      setListings(listings.filter(l => l.id !== listingId));
      toast.success('Property deleted successfully');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete listing.';
      toast.error(message);
    }
  };

  const totalAvailableBeds = listings.reduce((sum, l) =>
    sum + l.rooms.flatMap(r => r.beds).filter(b => !b.isBooked).length, 0
  );
  const totalBookedBeds = listings.reduce((sum, l) =>
    sum + l.rooms.flatMap(r => r.beds).filter(b => b.isBooked).length, 0
  );
  const lowestPrice = listings.length > 0
    ? Math.min(...listings.flatMap(l => l.rooms.map(r => r.pricePerBed)).filter(p => p > 0))
    : 0;

  return (
    <div className="min-h-screen bg-[#B19CD9]/5">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-[#34495E] mb-2">Landlord Dashboard</h1>
            <p className="text-[#717182]">Manage your property listings</p>
          </div>
          <Button
            onClick={() => navigate('/add-house')}
            className="bg-[#FF6F61] hover:bg-[#FF6F61]/90 text-white"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add New Property
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-[#717182]">Total Listings</CardTitle>
              <Home className="w-5 h-5 text-[#00A5A7]" />
            </CardHeader>
            <CardContent>
              <div className="text-[#34495E]" style={{ fontSize: '32px', fontWeight: '700' }}>
                {listings.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-[#717182]">Available Beds</CardTitle>
              <Bed className="w-5 h-5 text-[#B8E986]" />
            </CardHeader>
            <CardContent>
              <div className="text-[#34495E]" style={{ fontSize: '32px', fontWeight: '700' }}>
                {totalAvailableBeds}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-[#717182]">Booked Beds</CardTitle>
              <Bed className="w-5 h-5 text-[#FF6F61]" />
            </CardHeader>
            <CardContent>
              <div className="text-[#34495E]" style={{ fontSize: '32px', fontWeight: '700' }}>
                {totalBookedBeds}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-[#717182]">Starting From</CardTitle>
              <DollarSign className="w-5 h-5 text-[#FFC759]" />
            </CardHeader>
            <CardContent>
              <div className="text-[#34495E]" style={{ fontSize: '24px', fontWeight: '700' }}>
                {lowestPrice > 0 ? `EGP ${lowestPrice.toLocaleString()}` : '—'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Properties List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-[#34495E]">Your Properties</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : listings.length === 0 ? (
              <div className="text-center py-12">
                <Home className="w-16 h-16 text-[#717182] mx-auto mb-4" />
                <p className="text-[#717182] mb-4">No properties listed yet</p>
                <Button
                  onClick={() => navigate('/add-house')}
                  className="bg-[#00A5A7] hover:bg-[#00A5A7]/90 text-white"
                >
                  Add Your First Property
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {listings.map((listing) => {
                  const availBeds = listing.rooms.flatMap(r => r.beds).filter(b => !b.isBooked).length;
                  const totalBeds = listing.rooms.flatMap(r => r.beds).length;
                  const coverImage = listing.listingImages[0]
                    ? `${IMAGE_BASE}${listing.listingImages[0]}`
                    : null;

                  return (
                    <div
                      key={listing.id}
                      className="flex flex-col md:flex-row gap-4 p-4 border rounded-lg hover:border-[#00A5A7] transition-colors"
                    >
                      {coverImage ? (
                        <img
                          src={coverImage}
                          alt={listing.title}
                          className="w-full md:w-48 h-32 object-cover rounded-lg"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : (
                        <div className="w-full md:w-48 h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Home className="w-8 h-8 text-gray-300" />
                        </div>
                      )}

                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-[#34495E] mb-1">{listing.title}</h3>
                            <div className="flex items-center gap-2 text-[#717182]">
                              <MapPin className="w-4 h-4" />
                              <span>{listing.address}, {listing.city}</span>
                            </div>
                          </div>
                          <Badge
                            className={listing.status === 1
                              ? 'bg-[#B8E986] text-[#34495E] border-0'
                              : 'bg-gray-100 text-gray-500 border-0'}
                          >
                            {listing.status === 1 ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-4 mb-3 flex-wrap">
                          <span className="text-[#717182] text-sm">
                            {availBeds}/{totalBeds} beds available
                          </span>
                          {listing.furnished && (
                            <Badge variant="outline" className="text-xs">Furnished</Badge>
                          )}
                          {listing.wifiAvailable && (
                            <Badge variant="outline" className="text-xs">WiFi</Badge>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={() => navigate(`/add-house?edit=${listing.id}`)}
                            variant="outline"
                            size="sm"
                            className="border-[#00A5A7] text-[#00A5A7]"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-[#FF6F61] text-[#FF6F61] hover:bg-[#FF6F61] hover:text-white"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete this listing and cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(listing.id)}
                                  className="bg-[#FF6F61] hover:bg-[#FF6F61]/90"
                                >
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
      </div>
    </div>
  );
};
