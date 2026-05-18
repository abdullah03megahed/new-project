import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Users, Home, BookOpen, Bed, MapPin, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '../components/ui/alert-dialog';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardStats {
  totalStudents: number; totalLandlords: number;
  totalListings: number; totalBookings: number;
  availableBeds: number; occupiedBeds: number; pendingListings: number;
  recentListings: RecentListing[]; recentBookings: RecentBooking[];
}
interface RecentListing {
  id: number; title: string; city: string; landlordName: string;
  publishedAt: string; status: number; listingImages: string[];
}
interface RecentBooking {
  id: number; startDate: string; endDate: string; listingId: number; bedId: number;
}
interface LandlordItem {
  id: number; firstName: string; lastName: string;
  email: string; phoneNumber: string; nationalId: string; status: number;
}
interface StudentItem {
  id: number; firstName: string; lastName: string;
  email: string; phoneNumber: string; lookingForRoommate: boolean;
}

const IMAGE_BASE = 'https://unimate.runasp.net/';

// ─── Component ────────────────────────────────────────────────────────────────

export const Admin = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [landlords, setLandlords] = useState<LandlordItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'landlords' | 'students'>('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [statsData, landlordsData, studentsData] = await Promise.all([
          api.get<DashboardStats>('/admin/dashboard'),
          api.get<LandlordItem[]>('/LandLord'),
          api.get<StudentItem[]>('/Student'),
        ]);
        setStats(statsData);
        setLandlords(landlordsData || []);
        setStudents(studentsData || []);
      } catch (err) {
        toast.error('Failed to load admin data.');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const handleDeleteLandlord = async (id: number) => {
    try {
      await api.delete(`/LandLord/${id}`);
      setLandlords(landlords.filter(l => l.id !== id));
      toast.success('Landlord deleted successfully.');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete.');
    }
  };

  const handleDeleteStudent = async (id: number) => {
    try {
      await api.delete(`/Student/${id}`);
      setStudents(students.filter(s => s.id !== id));
      toast.success('Student deleted successfully.');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00A5A7]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-[#34495E] mb-2">Admin Dashboard</h1>
          <p className="text-[#717182]">Manage users, listings, and platform activity</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 border-b">
          {(['overview', 'landlords', 'students'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 capitalize font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab
                  ? 'border-[#00A5A7] text-[#00A5A7]'
                  : 'border-transparent text-[#717182] hover:text-[#34495E]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ── Overview Tab ── */}
        {activeTab === 'overview' && stats && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total Students</CardDescription>
                  <CardTitle className="text-[#00A5A7] text-3xl">{stats.totalStudents}</CardTitle>
                </CardHeader>
                <CardContent><Users className="w-6 h-6 text-[#00A5A7]/40" /></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total Landlords</CardDescription>
                  <CardTitle className="text-[#B19CD9] text-3xl">{stats.totalLandlords}</CardTitle>
                </CardHeader>
                <CardContent><Users className="w-6 h-6 text-[#B19CD9]/40" /></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total Listings</CardDescription>
                  <CardTitle className="text-[#FFC759] text-3xl">{stats.totalListings}</CardTitle>
                </CardHeader>
                <CardContent><Home className="w-6 h-6 text-[#FFC759]/40" /></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total Bookings</CardDescription>
                  <CardTitle className="text-[#FF6F61] text-3xl">{stats.totalBookings}</CardTitle>
                </CardHeader>
                <CardContent><BookOpen className="w-6 h-6 text-[#FF6F61]/40" /></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Available Beds</CardDescription>
                  <CardTitle className="text-[#B8E986] text-3xl">{stats.availableBeds}</CardTitle>
                </CardHeader>
                <CardContent><Bed className="w-6 h-6 text-[#B8E986]/40" /></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Occupied Beds</CardDescription>
                  <CardTitle className="text-[#34495E] text-3xl">{stats.occupiedBeds}</CardTitle>
                </CardHeader>
                <CardContent><Bed className="w-6 h-6 text-[#34495E]/40" /></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Pending Listings</CardDescription>
                  <CardTitle className="text-[#FF6F61] text-3xl">{stats.pendingListings}</CardTitle>
                </CardHeader>
                <CardContent><Home className="w-6 h-6 text-[#FF6F61]/40" /></CardContent>
              </Card>
            </div>

            {/* Recent Listings */}
            <div className="mb-8">
              <h2 className="text-[#34495E] mb-4">Recent Listings</h2>
              {stats.recentListings.length === 0 ? (
                <Card><CardContent className="p-8 text-center text-[#717182]">No recent listings</CardContent></Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stats.recentListings.map(listing => (
                    <Card key={listing.id} className="overflow-hidden">
                      {listing.listingImages[0] && (
                        <img
                          src={`${IMAGE_BASE}${listing.listingImages[0]}`}
                          alt={listing.title}
                          className="w-full h-36 object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      )}
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="text-[#34495E] text-sm font-medium">{listing.title}</h3>
                          <Badge className={listing.status === 1
                            ? 'bg-[#B8E986] text-[#34495E] border-0 text-xs'
                            : 'bg-gray-100 text-gray-500 border-0 text-xs'}>
                            {listing.status === 1 ? 'Active' : 'Pending'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-[#717182] text-xs mb-1">
                          <MapPin className="w-3 h-3" /><span>{listing.city}</span>
                        </div>
                        <p className="text-[#717182] text-xs">By {listing.landlordName}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Bookings */}
            <div>
              <h2 className="text-[#34495E] mb-4">Recent Bookings</h2>
              {stats.recentBookings.length === 0 ? (
                <Card><CardContent className="p-8 text-center text-[#717182]">No recent bookings</CardContent></Card>
              ) : (
                <div className="space-y-3">
                  {stats.recentBookings.map(booking => (
                    <Card key={booking.id}>
                      <CardContent className="p-4 flex justify-between items-center">
                        <div>
                          <p className="text-[#34495E] text-sm font-medium">Booking #{booking.id}</p>
                          <p className="text-[#717182] text-xs">
                            Listing #{booking.listingId} · Bed #{booking.bedId}
                          </p>
                        </div>
                        <div className="text-right text-xs text-[#717182]">
                          <p>{booking.startDate}</p>
                          <p>→ {booking.endDate}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Landlords Tab ── */}
        {activeTab === 'landlords' && (
          <div>
            <h2 className="text-[#34495E] mb-4">All Landlords ({landlords.length})</h2>
            {landlords.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-[#717182]">No landlords found</CardContent></Card>
            ) : (
              <div className="space-y-3">
                {landlords.map(landlord => (
                  <Card key={landlord.id}>
                    <CardContent className="p-4 flex justify-between items-center">
                      <div>
                        <p className="text-[#34495E] font-medium">
                          {landlord.firstName} {landlord.lastName}
                        </p>
                        <p className="text-[#717182] text-sm">{landlord.email}</p>
                        <p className="text-[#717182] text-sm">{landlord.phoneNumber}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-xs">ID #{landlord.id}</Badge>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline"
                              className="border-[#FF6F61] text-[#FF6F61] hover:bg-[#FF6F61] hover:text-white">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Landlord?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete {landlord.firstName} {landlord.lastName}'s account.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteLandlord(landlord.id)}
                                className="bg-[#FF6F61] hover:bg-[#FF6F61]/90"
                              >Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Students Tab ── */}
        {activeTab === 'students' && (
          <div>
            <h2 className="text-[#34495E] mb-4">All Students ({students.length})</h2>
            {students.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-[#717182]">No students found</CardContent></Card>
            ) : (
              <div className="space-y-3">
                {students.map(student => (
                  <Card key={student.id}>
                    <CardContent className="p-4 flex justify-between items-center">
                      <div>
                        <p className="text-[#34495E] font-medium">
                          {student.firstName} {student.lastName}
                        </p>
                        <p className="text-[#717182] text-sm">{student.email}</p>
                        <p className="text-[#717182] text-sm">{student.phoneNumber}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {student.lookingForRoommate && (
                          <Badge className="bg-[#B19CD9] text-white border-0 text-xs">
                            Roommate
                          </Badge>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline"
                              className="border-[#FF6F61] text-[#FF6F61] hover:bg-[#FF6F61] hover:text-white">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Student?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete {student.firstName} {student.lastName}'s account.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteStudent(student.id)}
                                className="bg-[#FF6F61] hover:bg-[#FF6F61]/90"
                              >Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
