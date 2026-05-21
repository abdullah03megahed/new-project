import { useState, useEffect } from 'react';
import { useAuth } from '../utils/AuthContext';
import { api } from '../utils/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { useNavigate } from 'react-router';
import { Users, Home, BookOpen, Bed, MapPin, Trash2, Flag, Search } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '../components/ui/alert-dialog';

interface DashboardStats {
  totalStudents: number; totalLandlords: number; totalListings: number;
  totalBookings: number; availableBeds: number; occupiedBeds: number; pendingListings: number;
  recentListings: { id: number; title: string; city: string; landlordName: string; status: number; listingImages: string[]; }[];
  recentBookings: { id: number; startDate: string; endDate: string; listingId: number; bedId: number; }[];
}
interface LandlordItem { id: number; firstName: string; lastName: string; email: string; phoneNumber: string; nationalId: string; status: number; }
interface StudentItem { id: number; firstName: string; lastName: string; email: string; phoneNumber: string; lookingForRoommate: boolean; }
interface ReportItem { reporterId: string; reportedId: string; reason: string; status: number; type: number; createdAt: string; }
interface PaginatedReports { pageIndex: number; pageSize: number; count: number; data: ReportItem[]; }

interface LandlordSearchResult {
  id: number; firstName: string; lastName: string;
  birthDate: string; nationalId: string; homeTown: string;
  email: string; phoneNumber: string;
}
interface StudentSearchResult {
  id: number; firstName: string; lastName: string;
  birthDate: string; age: number; homeTown: string;
  gender: number; bio: string; facultyField: string;
  lookingForRoommate: boolean; sleepingHabits: number;
  minBudget: number; maxBudget: number;
  nationalCard: string; universityCard: string;
  email: string; phoneNumber: string;
}

const IMAGE_BASE = 'https://unimate.runasp.net/';

export const Admin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [landlords, setLandlords] = useState<LandlordItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'landlords' | 'students' | 'reports'>('overview');
  const [loading, setLoading] = useState(true);

  // ── Search state ─────────────────────────────────────────────────────────────
  const [studentSearch, setStudentSearch] = useState('');
  const [landlordSearch, setLandlordSearch] = useState('');
  const [studentResult, setStudentResult] = useState<StudentSearchResult | null>(null);
  const [landlordResult, setLandlordResult] = useState<LandlordSearchResult | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // ── Role guard ──────────────────────────────────────────────────────────────
  if (!user || user.type !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[#717182]">Access denied. Admins only.</p>
      </div>
    );
  }

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [statsData, landlordsData, studentsData, reportsData] = await Promise.all([
          api.get<DashboardStats>('/admin/dashboard'),
          api.get<LandlordItem[]>('/LandLord'),
          api.get<StudentItem[]>('/Student'),
          api.get<PaginatedReports>('/Report/GetAllReports?PageIndex=1&PageSize=20'),
        ]);
        setStats(statsData);
        setLandlords(landlordsData || []);
        setStudents(studentsData || []);
        setReports(reportsData?.data || []);
      } catch {
        toast.error('Failed to load admin data.');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const searchStudent = async () => {
    if (!studentSearch.trim()) return;
    setSearchLoading(true);
    setStudentResult(null);
    try {
      const data = await api.get<StudentSearchResult>(`/Student/Email?email=${encodeURIComponent(studentSearch.trim())}`);
      setStudentResult(data);
    } catch {
      toast.error('Student not found.');
    } finally {
      setSearchLoading(false);
    }
  };

  const searchLandlord = async () => {
    if (!landlordSearch.trim()) return;
    setSearchLoading(true);
    setLandlordResult(null);
    try {
      const data = await api.get<LandlordSearchResult>(`/LandLord/Email?email=${encodeURIComponent(landlordSearch.trim())}`);
      setLandlordResult(data);
    } catch {
      toast.error('Landlord not found.');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleDeleteLandlord = async (id: number) => {
    try {
      await api.delete(`/LandLord/${id}`);
      setLandlords(landlords.filter(l => l.id !== id));
      toast.success('Landlord deleted.');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete.');
    }
  };

  const handleDeleteStudent = async (id: number) => {
    try {
      await api.delete(`/Student/${id}`);
      setStudents(students.filter(s => s.id !== id));
      toast.success('Student deleted.');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete.');
    }
  };

  const handleUpdateReport = async (reportId: number, status: number) => {
    try {
      await api.put(`/Report/UpdateReport/${reportId}`, { status });
      toast.success('Report updated.');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update report.');
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

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b overflow-x-auto">
          {(['overview', 'landlords', 'students', 'reports'] as const).map(tab => (
            <button key={tab} onClick={() => {
              setActiveTab(tab);
              setStudentResult(null);
              setLandlordResult(null);
              setStudentSearch('');
              setLandlordSearch('');
            }}
              className={`px-6 py-3 capitalize font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
                activeTab === tab ? 'border-[#00A5A7] text-[#00A5A7]' : 'border-transparent text-[#717182] hover:text-[#34495E]'
              }`}>
              {tab}
            </button>
          ))}
        </div>

        {/* Overview */}
        {activeTab === 'overview' && stats && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              {[
                { label: 'Total Students', value: stats.totalStudents, color: '#00A5A7', icon: <Users className="w-6 h-6" /> },
                { label: 'Total Landlords', value: stats.totalLandlords, color: '#B19CD9', icon: <Users className="w-6 h-6" /> },
                { label: 'Total Listings', value: stats.totalListings, color: '#FFC759', icon: <Home className="w-6 h-6" /> },
                { label: 'Total Bookings', value: stats.totalBookings, color: '#FF6F61', icon: <BookOpen className="w-6 h-6" /> },
                { label: 'Available Beds', value: stats.availableBeds, color: '#B8E986', icon: <Bed className="w-6 h-6" /> },
                { label: 'Occupied Beds', value: stats.occupiedBeds, color: '#34495E', icon: <Bed className="w-6 h-6" /> },
                { label: 'Pending Listings', value: stats.pendingListings, color: '#FF6F61', icon: <Home className="w-6 h-6" /> },
              ].map(({ label, value, color, icon }) => (
                <Card key={label}>
                  <CardHeader className="pb-2">
                    <CardDescription>{label}</CardDescription>
                    <CardTitle style={{ color }} className="text-3xl">{value}</CardTitle>
                  </CardHeader>
                  <CardContent><div style={{ color: color + '40' }}>{icon}</div></CardContent>
                </Card>
              ))}
            </div>

            <div className="mb-8">
              <h2 className="text-[#34495E] mb-4">Recent Listings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.recentListings.map(listing => (
                  <Card key={listing.id} className="overflow-hidden cursor-pointer hover:border-[#00A5A7] transition-colors" onClick={() => navigate(`/house/${listing.id}`)}>
                    {listing.listingImages[0] && (
                      <img src={`${IMAGE_BASE}${listing.listingImages[0]}`} alt={listing.title} className="w-full h-36 object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    )}
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="text-[#34495E] text-sm font-medium">{listing.title}</h3>
                        <Badge className={listing.status === 1 ? 'bg-[#B8E986] text-[#34495E] border-0 text-xs' : 'bg-gray-100 text-gray-500 border-0 text-xs'}>
                          {listing.status === 1 ? 'Active' : 'Pending'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-[#717182] text-xs mb-1"><MapPin className="w-3 h-3" /><span>{listing.city}</span></div>
                      <p className="text-[#717182] text-xs">By {listing.landlordName}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-[#34495E] mb-4">Recent Bookings</h2>
              <div className="space-y-3">
                {stats.recentBookings.map(booking => (
                  <Card key={booking.id}>
                    <CardContent className="p-4 flex justify-between items-center">
                      <div>
                        <p className="text-[#34495E] text-sm font-medium">Booking #{booking.id}</p>
                        <p className="text-[#717182] text-xs">Listing #{booking.listingId} · Bed #{booking.bedId}</p>
                      </div>
                      <div className="text-right text-xs text-[#717182]">
                        <p>{booking.startDate}</p><p>→ {booking.endDate}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Landlords */}
        {activeTab === 'landlords' && (
          <div>
            <h2 className="text-[#34495E] mb-4">All Landlords ({landlords.length})</h2>

            {/* Search bar */}
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Search landlord by email..."
                value={landlordSearch}
                onChange={(e) => { setLandlordSearch(e.target.value); setLandlordResult(null); }}
                onKeyDown={(e) => e.key === 'Enter' && searchLandlord()}
                className="border-[#00A5A7]/20 focus:border-[#00A5A7]"
              />
              <Button
                onClick={searchLandlord}
                disabled={searchLoading || !landlordSearch.trim()}
                className="bg-[#00A5A7] hover:bg-[#00A5A7]/90 text-white shrink-0"
              >
                <Search className="w-4 h-4 mr-1" />
                Search
              </Button>
            </div>

            {/* Search result */}
            {landlordResult && (
              <Card className="mb-4 border-[#00A5A7]/30 bg-[#00A5A7]/5">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1 text-sm">
                      <p className="text-[#34495E] font-semibold">{landlordResult.firstName} {landlordResult.lastName}</p>
                      <p className="text-[#717182]">{landlordResult.email}</p>
                      <p className="text-[#717182]">{landlordResult.phoneNumber}</p>
                      {landlordResult.homeTown && <p className="text-[#717182]">Hometown: {landlordResult.homeTown}</p>}
                      {landlordResult.nationalId && <p className="text-[#717182]">National ID: {landlordResult.nationalId}</p>}
                      {landlordResult.birthDate && (
                        <p className="text-[#717182]">DOB: {new Date(landlordResult.birthDate).toLocaleDateString()}</p>
                      )}
                    </div>
                    <Badge className="bg-[#00A5A7] text-white border-0 text-xs">ID #{landlordResult.id}</Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-3">
              {landlords.map(landlord => (
                <Card key={landlord.id}>
                  <CardContent className="p-4 flex justify-between items-center">
                    <div>
                      <p className="text-[#34495E] font-medium">{landlord.firstName} {landlord.lastName}</p>
                      <p className="text-[#717182] text-sm">{landlord.email}</p>
                      <p className="text-[#717182] text-sm">{landlord.phoneNumber}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs">ID #{landlord.id}</Badge>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline" className="border-[#FF6F61] text-[#FF6F61] hover:bg-[#FF6F61] hover:text-white"><Trash2 className="w-4 h-4" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Landlord?</AlertDialogTitle>
                            <AlertDialogDescription>Permanently delete {landlord.firstName} {landlord.lastName}'s account.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteLandlord(landlord.id)} className="bg-[#FF6F61] hover:bg-[#FF6F61]/90">Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Students */}
        {activeTab === 'students' && (
          <div>
            <h2 className="text-[#34495E] mb-4">All Students ({students.length})</h2>

            {/* Search bar */}
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Search student by email..."
                value={studentSearch}
                onChange={(e) => { setStudentSearch(e.target.value); setStudentResult(null); }}
                onKeyDown={(e) => e.key === 'Enter' && searchStudent()}
                className="border-[#00A5A7]/20 focus:border-[#00A5A7]"
              />
              <Button
                onClick={searchStudent}
                disabled={searchLoading || !studentSearch.trim()}
                className="bg-[#00A5A7] hover:bg-[#00A5A7]/90 text-white shrink-0"
              >
                <Search className="w-4 h-4 mr-1" />
                Search
              </Button>
            </div>

            {/* Search result */}
            {studentResult && (
              <Card className="mb-4 border-[#00A5A7]/30 bg-[#00A5A7]/5">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1 text-sm">
                      <p className="text-[#34495E] font-semibold">{studentResult.firstName} {studentResult.lastName}</p>
                      <p className="text-[#717182]">{studentResult.email}</p>
                      <p className="text-[#717182]">{studentResult.phoneNumber}</p>
                      {studentResult.facultyField && <p className="text-[#717182]">Faculty: {studentResult.facultyField}</p>}
                      {studentResult.homeTown && <p className="text-[#717182]">Hometown: {studentResult.homeTown}</p>}
                      {(studentResult.minBudget > 0 || studentResult.maxBudget > 0) && (
                        <p className="text-[#717182]">Budget: EGP {studentResult.minBudget.toLocaleString()} – {studentResult.maxBudget.toLocaleString()}</p>
                      )}
                      {studentResult.bio && <p className="text-[#717182] italic">"{studentResult.bio}"</p>}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant="outline" className="text-xs">ID #{studentResult.id}</Badge>
                      {studentResult.lookingForRoommate && (
                        <Badge className="bg-[#B19CD9] text-white border-0 text-xs">Roommate</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-3">
              {students.map(student => (
                <Card key={student.id}>
                  <CardContent className="p-4 flex justify-between items-center">
                    <div>
                      <p className="text-[#34495E] font-medium">{student.firstName} {student.lastName}</p>
                      <p className="text-[#717182] text-sm">{student.email}</p>
                      <p className="text-[#717182] text-sm">{student.phoneNumber}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {student.lookingForRoommate && <Badge className="bg-[#B19CD9] text-white border-0 text-xs">Roommate</Badge>}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline" className="border-[#FF6F61] text-[#FF6F61] hover:bg-[#FF6F61] hover:text-white"><Trash2 className="w-4 h-4" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Student?</AlertDialogTitle>
                            <AlertDialogDescription>Permanently delete {student.firstName} {student.lastName}'s account.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteStudent(student.id)} className="bg-[#FF6F61] hover:bg-[#FF6F61]/90">Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Reports */}
        {activeTab === 'reports' && (
          <div>
            <h2 className="text-[#34495E] mb-4">All Reports ({reports.length})</h2>
            {reports.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-[#717182]">No reports found</CardContent></Card>
            ) : (
              <div className="space-y-3">
                {reports.map((report, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Flag className="w-4 h-4 text-[#FF6F61]" />
                            <p className="text-[#34495E] font-medium text-sm">Report</p>
                            <Badge className={
                              report.status === 1 ? 'bg-yellow-100 text-yellow-700 border-0 text-xs' :
                              report.status === 2 ? 'bg-[#B8E986] text-[#34495E] border-0 text-xs' :
                              'bg-gray-100 text-gray-500 border-0 text-xs'
                            }>
                              {report.status === 1 ? 'Pending' : report.status === 2 ? 'Resolved' : 'Dismissed'}
                            </Badge>
                          </div>
                          <p className="text-[#717182] text-sm mb-1">{report.reason}</p>
                          <p className="text-[#717182] text-xs">{new Date(report.createdAt).toLocaleDateString()}</p>
                        </div>
                        {report.status === 1 && (
                          <div className="flex gap-2 ml-4">
                            <Button size="sm" onClick={() => handleUpdateReport(i + 1, 2)} className="bg-[#B8E986] text-[#34495E] hover:bg-[#B8E986]/90 text-xs">Resolve</Button>
                            <Button size="sm" variant="outline" onClick={() => handleUpdateReport(i + 1, 3)} className="text-xs">Dismiss</Button>
                          </div>
                        )}
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
