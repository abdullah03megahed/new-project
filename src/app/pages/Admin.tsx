import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../utils/AuthContext';
import { api } from '../utils/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '../components/ui/dialog';
import {
  Users, Home, TrendingUp, Flag, CheckCircle, XCircle,
  Search, Ban, ShieldOff, MapPin, BookOpen, Bed,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardStats {
  totalStudents: number; totalLandlords: number;
  totalListings: number; totalBookings: number;
  availableBeds: number; occupiedBeds: number; pendingListings: number;
  recentListings: RecentListing[];
  recentBookings: RecentBooking[];
}
interface RecentListing {
  id: number; title: string; city: string; landlordName: string;
  address: string; status: number; listingImages: string[]; publishedAt: string;
  pricePerMonth?: number;
}
interface RecentBooking {
  id: number; startDate: string; endDate: string; listingId: number; bedId: number;
}
interface Landlord {
  id: number; firstName: string; lastName: string;
  email: string; phoneNumber?: string; nationalId?: string;
  homeTown?: string; birthDate?: string; accountId: string; isBanned?: boolean;
}
interface Student {
  id: number; firstName: string; lastName: string;
  email: string; phoneNumber?: string; gender?: number;
  facultyField?: string; homeTown?: string; accountId: string; isBanned?: boolean;
}
interface Report {
  id?: number;
  reporterId: string; reportedId: string; reason: string;
  status: number; type: number; createdAt: string;
}
interface PaginatedReports {
  pageIndex: number; pageSize: number; count: number; data: Report[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const IMAGE_BASE = 'https://unimate.runasp.net/';
const prefixImage = (img: string) => {
  if (!img) return '';
  if (img.startsWith('http://') || img.startsWith('https://')) return img;
  return `${IMAGE_BASE}${img.startsWith('/') ? img.slice(1) : img}`;
};

const statusInfo = (s: number) => {
  if (s === 1) return { label: 'Pending',   color: 'bg-yellow-100 text-yellow-700 border-yellow-200' };
  if (s === 2) return { label: 'Resolved',  color: 'bg-green-100 text-green-700 border-green-200' };
  if (s === 3) return { label: 'rejected', color: 'bg-gray-100 text-gray-500 border-gray-200' };
  return { label: 'Unknown', color: 'bg-gray-100 text-gray-500' };
};

// ─── Ban Dialog ───────────────────────────────────────────────────────────────

interface BanDialogProps {
  userId: string;
  userName: string;
  onBanned: () => void;
}

const BanDialog = ({ userId, userName, onBanned }: BanDialogProps) => {
  const [open, setOpen] = useState(false);
  const [banType, setBanType] = useState<'1' | '2'>('1');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split('T')[0];

  const handleBan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (banType === '1' && !endDate) {
      toast.error('Please select an end date for a temporary ban.');
      return;
    }
    setLoading(true);
    try {
      const payload: any = { userId, type: Number(banType), reason };
      if (banType === '1') payload.endDate = endDate;
      await api.post('/Ban/BanUser', payload);
      toast.success(
        banType === '2'
          ? `${userName} has been permanently banned.`
          : `${userName} has been banned until ${endDate}.`
      );
      setOpen(false);
      setEndDate('');
      setReason('');
      setBanType('1');
      onBanned();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to ban user.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"
          className="border-orange-400 text-orange-500 hover:bg-orange-50">
          <Ban className="w-4 h-4 mr-1" />Ban
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#34495E]">Ban {userName}</DialogTitle>
          <DialogDescription>Choose the type of ban to apply to this account.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleBan} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Ban Type</Label>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setBanType('1')}
                className={`p-3 rounded-lg border-2 text-left transition-colors ${
                  banType === '1' ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-orange-200'
                }`}>
                <p className="font-medium text-sm text-[#34495E]">⏱ Temporary</p>
                <p className="text-xs text-[#717182] mt-1">Ban until a specific date</p>
              </button>
              <button type="button" onClick={() => setBanType('2')}
                className={`p-3 rounded-lg border-2 text-left transition-colors ${
                  banType === '2' ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-red-200'
                }`}>
                <p className="font-medium text-sm text-[#34495E]">🚫 Permanent</p>
                <p className="text-xs text-[#717182] mt-1">Block email forever</p>
              </button>
            </div>
          </div>

          {banType === '1' && (
            <div className="space-y-2">
              <Label>Ban Until</Label>
              <Input type="date" value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={minDateStr} required />
            </div>
          )}

          {banType === '2' && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              ⚠ This will permanently block this email from ever registering again.
            </div>
          )}

          <div className="space-y-2">
            <Label>Reason</Label>
            <Input placeholder="Reason for ban..." value={reason}
              onChange={(e) => setReason(e.target.value)} required />
          </div>

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit"
              disabled={loading || !reason || (banType === '1' && !endDate)}
              className={banType === '2'
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-orange-500 hover:bg-orange-600 text-white'}>
              {loading ? 'Banning...' : banType === '2' ? 'Permanently Ban' : 'Ban Until Date'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ─── User Card ────────────────────────────────────────────────────────────────

interface UserCardProps {
  name: string;
  email: string;
  extra?: React.ReactNode;
  accountId?: string;
  numericId: number;
  onRemove: () => void;
  onUnban?: () => void;
  isBanned?: boolean;
  onBanned?: () => void;
}

const UserCard = ({ name, email, extra, accountId, onRemove, onUnban, isBanned, onBanned }: UserCardProps) => (
  <div className="flex items-start justify-between p-4 border rounded-lg hover:border-[#00A5A7] transition-colors gap-4">
    <div className="space-y-1 flex-1 min-w-0">
      <div className="flex items-center gap-2 flex-wrap">
        <p className="font-medium text-[#34495E]">{name}</p>
        {isBanned && <Badge className="bg-orange-100 text-orange-600 border-orange-200 border text-xs">Banned</Badge>}
      </div>
      <p className="text-sm text-[#717182]">{email}</p>
      {extra}
    </div>
    <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
      {accountId && !isBanned && (
        <BanDialog userId={accountId} userName={name} onBanned={onBanned ?? (() => {})} />
      )}
      {isBanned && accountId && onUnban && (
        <Button variant="outline" size="sm" onClick={onUnban}
          className="border-green-500 text-green-600 hover:bg-green-50">
          <ShieldOff className="w-4 h-4 mr-1" />Unban
        </Button>
      )}
      <Button variant="outline" size="sm" onClick={onRemove}
        className="border-[#FF6F61] text-[#FF6F61] hover:bg-[#FF6F61] hover:text-white">
        Remove
      </Button>
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export const Admin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'landlords' | 'students' | 'reports'>('overview');

  const [stats, setStats]         = useState<DashboardStats | null>(null);
  const [landlords, setLandlords] = useState<Landlord[]>([]);
  const [students, setStudents]   = useState<Student[]>([]);
  const [loading, setLoading]     = useState(true);

  const [landlordEmailInput, setLandlordEmailInput] = useState('');
  const [foundLandlord, setFoundLandlord]           = useState<Landlord | null>(null);
  const [landlordSearching, setLandlordSearching]   = useState(false);
  const [landlordNotFound, setLandlordNotFound]     = useState(false);

  const [studentEmailInput, setStudentEmailInput] = useState('');
  const [foundStudent, setFoundStudent]           = useState<Student | null>(null);
  const [studentSearching, setStudentSearching]   = useState(false);
  const [studentNotFound, setStudentNotFound]     = useState(false);

  const [reports, setReports]               = useState<Report[]>([]);
  const [reportCount, setReportCount]       = useState(0);
  const [reportStatus, setReportStatus]     = useState<string>('all');
  const [reportsLoading, setReportsLoading] = useState(false);
  const [updatingReportIdx, setUpdatingReportIdx] = useState<number | null>(null);

  const [listingIdInput, setListingIdInput]               = useState('');
  const [listingReports, setListingReports]               = useState<Report[]>([]);
  const [listingReportsLoading, setListingReportsLoading] = useState(false);
  const [searchedListingId, setSearchedListingId]         = useState<string | null>(null);

  if (!user || user.type !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[#717182]">Access denied. Admins only.</p>
      </div>
    );
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [statsRes, landlordsRes, studentsRes] = await Promise.allSettled([
          api.get<DashboardStats>('/admin/dashboard'),
          api.get<Landlord[]>('/LandLord'),
          api.get<Student[]>('/Student'),
        ]);
        if (statsRes.status     === 'fulfilled') setStats(statsRes.value);
        if (landlordsRes.status === 'fulfilled') setLandlords(landlordsRes.value || []);
        if (studentsRes.status  === 'fulfilled') setStudents(studentsRes.value  || []);
      } catch { /* silently fail */ }
      finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (activeTab !== 'reports') return;
    fetchReports();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, reportStatus]);

  const fetchReports = async () => {
    setReportsLoading(true);
    try {
      const params = new URLSearchParams();
      if (reportStatus !== 'all') params.append('Status', reportStatus);
      params.append('SortingOption', '2');
      params.append('PageIndex', '1');
      params.append('PageSize', '50');
      const data = await api.get<PaginatedReports>(`/Report/GetAllReports?${params}`);
      setReports(data.data || []);
      setReportCount(data.count || 0);
    } catch { /* silently fail */ }
    finally { setReportsLoading(false); }
  };

  const handleLandlordSearch = async () => {
    if (!landlordEmailInput.trim()) return;
    setLandlordSearching(true); setFoundLandlord(null); setLandlordNotFound(false);
    try {
      const data = await api.get<Landlord>(`/LandLord/Email?email=${encodeURIComponent(landlordEmailInput.trim())}`);
      data?.id ? setFoundLandlord(data) : setLandlordNotFound(true);
    } catch { setLandlordNotFound(true); }
    finally   { setLandlordSearching(false); }
  };

  const handleStudentSearch = async () => {
    if (!studentEmailInput.trim()) return;
    setStudentSearching(true); setFoundStudent(null); setStudentNotFound(false);
    try {
      const data = await api.get<Student>(`/Student/Email?email=${encodeURIComponent(studentEmailInput.trim())}`);
      data?.id ? setFoundStudent(data) : setStudentNotFound(true);
    } catch { setStudentNotFound(true); }
    finally   { setStudentSearching(false); }
  };

  const handleDeleteLandlord = async (id: number) => {
    if (!confirm('Remove this landlord? This cannot be undone.')) return;
    try {
      await api.delete(`/LandLord/${id}`);
      setLandlords(prev => prev.filter(l => l.id !== id));
      if (foundLandlord?.id === id) setFoundLandlord(null);
      toast.success('Landlord removed.');
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Failed.'); }
  };

  const handleDeleteStudent = async (id: number) => {
    if (!confirm('Remove this student? This cannot be undone.')) return;
    try {
      await api.delete(`/Student/${id}`);
      setStudents(prev => prev.filter(s => s.id !== id));
      if (foundStudent?.id === id) setFoundStudent(null);
      toast.success('Student removed.');
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Failed.'); }
  };

  // ─── Unban — updates state so UI reflects change immediately ───────────────
  const handleUnban = async (
    accountId: string,
    name: string,
    type: 'landlord' | 'student',
    id: number
  ) => {
    try {
      await api.put(`/Ban/UnBanUser/${accountId}`, {});
      toast.success(`${name} has been unbanned.`);

      if (type === 'landlord') {
        setLandlords(prev => prev.map(l => l.id === id ? { ...l, isBanned: false } : l));
        setFoundLandlord(prev => prev?.id === id ? { ...prev, isBanned: false } : prev);
      } else {
        setStudents(prev => prev.map(s => s.id === id ? { ...s, isBanned: false } : s));
        setFoundStudent(prev => prev?.id === id ? { ...prev, isBanned: false } : prev);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to unban.');
    }
  };

  // ─── Ban callback — updates state so Ban button flips to Unban immediately ─
  const handleBanned = (type: 'landlord' | 'student', id: number) => {
    if (type === 'landlord') {
      setLandlords(prev => prev.map(l => l.id === id ? { ...l, isBanned: true } : l));
      setFoundLandlord(prev => prev?.id === id ? { ...prev, isBanned: true } : prev);
    } else {
      setStudents(prev => prev.map(s => s.id === id ? { ...s, isBanned: true } : s));
      setFoundStudent(prev => prev?.id === id ? { ...prev, isBanned: true } : prev);
    }
  };

  const handleUpdateReport = async (report: Report, index: number, newStatus: number) => {
    if (!report.id) {
      toast.error(
        'Cannot update: the backend does not return report IDs in GetAllReports. ' +
        'Ask the backend team to add "id" to the GetAllReports response schema.'
      );
      return;
    }
    setUpdatingReportIdx(index);
    try {
      await api.put(`/Report/UpdateReport/${report.id}`, { status: newStatus });
      toast.success(newStatus === 2 ? 'Report resolved.' : 'Report rejected.');
      await fetchReports();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update report.');
    } finally {
      setUpdatingReportIdx(null);
    }
  };

  const handleSearchByListing = async () => {
    if (!listingIdInput.trim()) return;
    setListingReportsLoading(true);
    setSearchedListingId(listingIdInput.trim());
    setListingReports([]);
    try {
      const data = await api.get<PaginatedReports>(
        `/Report/GetReportsBylisting?listingId=${listingIdInput.trim()}&SortingOption=2&PageIndex=1&PageSize=50`
      );
      setListingReports(data.data || []);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to fetch reports.');
    } finally { setListingReportsLoading(false); }
  };

  const tabs = [
    { id: 'overview',  label: 'Overview',                                              icon: TrendingUp },
    { id: 'landlords', label: `Landlords (${landlords.length})`,                       icon: Home },
    { id: 'students',  label: `Students (${students.length})`,                         icon: Users },
    { id: 'reports',   label: `Reports${reportCount > 0 ? ` (${reportCount})` : ''}`, icon: Flag },
  ] as const;

  return (
    <div className="min-h-screen bg-[#B19CD9]/5">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-[#34495E] mb-2">Admin Dashboard</h1>
        <p className="text-[#717182] mb-8">Manage users, listings, and reports</p>

        <div className="flex gap-1 mb-8 border-b border-gray-200 overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-[#00A5A7] text-[#00A5A7]'
                    : 'border-transparent text-[#717182] hover:text-[#34495E]'
                }`}>
                <Icon className="w-4 h-4" />{tab.label}
              </button>
            );
          })}
        </div>

        {/* ════════ OVERVIEW ════════ */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {loading
                ? [1,2,3,4,5,6,7].map(i => <div key={i} className="h-28 bg-gray-100 rounded-lg animate-pulse" />)
                : [
                    { label: 'Total Students',   value: stats?.totalStudents   ?? students.length,  icon: <Users      className="w-5 h-5 text-[#00A5A7]" /> },
                    { label: 'Total Landlords',  value: stats?.totalLandlords  ?? landlords.length, icon: <Home       className="w-5 h-5 text-[#B8E986]" /> },
                    { label: 'Total Listings',   value: stats?.totalListings   ?? '—',              icon: <TrendingUp className="w-5 h-5 text-[#FFC759]" /> },
                    { label: 'Total Bookings',   value: stats?.totalBookings   ?? '—',              icon: <BookOpen   className="w-5 h-5 text-[#B19CD9]" /> },
                    { label: 'Available Beds',   value: stats?.availableBeds   ?? '—',              icon: <Bed        className="w-5 h-5 text-[#B8E986]" /> },
                    { label: 'Occupied Beds',    value: stats?.occupiedBeds    ?? '—',              icon: <Bed        className="w-5 h-5 text-[#FF6F61]" /> },
                    { label: 'Pending Listings', value: stats?.pendingListings ?? '—',              icon: <Flag       className="w-5 h-5 text-orange-400" /> },
                  ].map(({ label, value, icon }) => (
                    <Card key={label}>
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-[#717182] text-xs">{label}</CardTitle>
                        {icon}
                      </CardHeader>
                      <CardContent>
                        <div className="text-[#34495E] text-2xl font-bold">{value}</div>
                      </CardContent>
                    </Card>
                  ))
              }
            </div>

            {stats?.recentListings && stats.recentListings.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-[#34495E]">Recent Listings</CardTitle>
                  <CardDescription>Latest properties added to the platform</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats.recentListings.map(listing => (
                      <div key={listing.id}
                        className="flex flex-col sm:flex-row gap-4 p-4 border rounded-lg hover:border-[#00A5A7] transition-colors cursor-pointer"
                        onClick={() => navigate(`/house/${listing.id}`)}>
                        {listing.listingImages?.[0] ? (
                          <img src={prefixImage(listing.listingImages[0])} alt={listing.title}
                            className="w-full sm:w-40 h-28 object-cover rounded-lg flex-shrink-0"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        ) : (
                          <div className="w-full sm:w-40 h-28 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Home className="w-8 h-8 text-gray-300" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1 flex-wrap">
                            <p className="text-[#34495E] font-medium hover:text-[#00A5A7] line-clamp-1">{listing.title}</p>
                            <Badge className={`text-xs flex-shrink-0 border-0 ${
                              listing.status === 1 ? 'bg-[#B8E986] text-[#34495E]' : 'bg-gray-100 text-gray-500'
                            }`}>
                              {listing.status === 1 ? 'Active' : 'Pending'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1 text-[#717182] text-sm mb-1">
                            <MapPin className="w-3 h-3" />
                            <span>{listing.address ? `${listing.address}, ` : ''}{listing.city}</span>
                          </div>
                          <p className="text-[#717182] text-sm">By <span className="text-[#00A5A7]">{listing.landlordName}</span></p>
                          <p className="text-[#717182] text-xs mt-1">
                            {new Date(listing.publishedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {stats?.recentBookings && stats.recentBookings.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-[#34495E]">Recent Bookings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats.recentBookings.map(booking => (
                      <div key={booking.id} className="flex justify-between items-center p-3 border rounded-lg">
                        <div>
                          <p className="text-[#34495E] text-sm font-medium">Booking #{booking.id}</p>
                          <p className="text-[#717182] text-xs">Listing #{booking.listingId} · Bed #{booking.bedId}</p>
                        </div>
                        <div className="text-right text-xs text-[#717182]">
                          <p>{booking.startDate}</p>
                          <p>→ {booking.endDate}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ════════ LANDLORDS ════════ */}
        {activeTab === 'landlords' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-[#34495E]">Search Landlord by Email</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3 flex-wrap">
                  <Input placeholder="landlord@example.com" value={landlordEmailInput}
                    onChange={(e) => { setLandlordEmailInput(e.target.value); setLandlordNotFound(false); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleLandlordSearch()}
                    className="max-w-sm" />
                  <Button onClick={handleLandlordSearch} disabled={landlordSearching}
                    className="bg-[#00A5A7] hover:bg-[#00A5A7]/90 text-white">
                    <Search className="w-4 h-4 mr-2" />{landlordSearching ? 'Searching...' : 'Search'}
                  </Button>
                  {foundLandlord && (
                    <Button variant="ghost" onClick={() => { setFoundLandlord(null); setLandlordEmailInput(''); }}
                      className="text-[#717182]">Clear</Button>
                  )}
                </div>
                {landlordNotFound && <p className="text-sm text-[#FF6F61]">No landlord found with that email.</p>}
                {foundLandlord && (
                  <div className="p-4 border border-[#00A5A7]/30 rounded-lg bg-[#00A5A7]/5">
                    <UserCard
                      name={`${foundLandlord.firstName} ${foundLandlord.lastName}`}
                      email={foundLandlord.email}
                      accountId={foundLandlord.accountId}
                      numericId={foundLandlord.id}
                      isBanned={foundLandlord.isBanned}
                      onBanned={() => handleBanned('landlord', foundLandlord.id)}
                      extra={
                        <div className="space-y-0.5">
                          {foundLandlord.phoneNumber && <p className="text-sm text-[#717182]">{foundLandlord.phoneNumber}</p>}
                          {foundLandlord.homeTown    && <p className="text-sm text-[#717182]">📍 {foundLandlord.homeTown}</p>}
                          {foundLandlord.nationalId  && <p className="text-sm text-[#717182]">ID: {foundLandlord.nationalId}</p>}
                        </div>
                      }
                      onRemove={() => handleDeleteLandlord(foundLandlord.id)}
                      onUnban={foundLandlord.accountId
                        ? () => handleUnban(foundLandlord.accountId, `${foundLandlord.firstName} ${foundLandlord.lastName}`, 'landlord', foundLandlord.id)
                        : undefined}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-[#34495E]">All Landlords</CardTitle>
                <CardDescription>All registered landlords on the platform</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />)}</div>
                ) : landlords.length === 0 ? (
                  <p className="text-[#717182] text-center py-8">No landlords found.</p>
                ) : (
                  <div className="space-y-3">
                    {landlords.map(l => (
                      <UserCard key={l.id}
                        name={`${l.firstName} ${l.lastName}`}
                        email={l.email}
                        accountId={l.accountId}
                        numericId={l.id}
                        isBanned={l.isBanned}
                        extra={l.phoneNumber ? <p className="text-sm text-[#717182]">{l.phoneNumber}</p> : undefined}
                        onRemove={() => handleDeleteLandlord(l.id)}
                        onBanned={() => handleBanned('landlord', l.id)}
                        onUnban={l.accountId
                          ? () => handleUnban(l.accountId, `${l.firstName} ${l.lastName}`, 'landlord', l.id)
                          : undefined}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ════════ STUDENTS ════════ */}
        {activeTab === 'students' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-[#34495E]">Search Student by Email</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3 flex-wrap">
                  <Input placeholder="student@example.com" value={studentEmailInput}
                    onChange={(e) => { setStudentEmailInput(e.target.value); setStudentNotFound(false); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleStudentSearch()}
                    className="max-w-sm" />
                  <Button onClick={handleStudentSearch} disabled={studentSearching}
                    className="bg-[#00A5A7] hover:bg-[#00A5A7]/90 text-white">
                    <Search className="w-4 h-4 mr-2" />{studentSearching ? 'Searching...' : 'Search'}
                  </Button>
                  {foundStudent && (
                    <Button variant="ghost" onClick={() => { setFoundStudent(null); setStudentEmailInput(''); }}
                      className="text-[#717182]">Clear</Button>
                  )}
                </div>
                {studentNotFound && <p className="text-sm text-[#FF6F61]">No student found with that email.</p>}
                {foundStudent && (
                  <div className="p-4 border border-[#00A5A7]/30 rounded-lg bg-[#00A5A7]/5">
                    <UserCard
                      name={`${foundStudent.firstName} ${foundStudent.lastName}`}
                      email={foundStudent.email}
                      accountId={foundStudent.accountId}
                      numericId={foundStudent.id}
                      isBanned={foundStudent.isBanned}
                      onBanned={() => handleBanned('student', foundStudent.id)}
                      extra={
                        <div className="space-y-0.5">
                          {foundStudent.phoneNumber  && <p className="text-sm text-[#717182]">{foundStudent.phoneNumber}</p>}
                          {foundStudent.facultyField && <p className="text-sm text-[#717182]">🎓 {foundStudent.facultyField}</p>}
                          {foundStudent.homeTown     && <p className="text-sm text-[#717182]">📍 {foundStudent.homeTown}</p>}
                        </div>
                      }
                      onRemove={() => handleDeleteStudent(foundStudent.id)}
                      onUnban={foundStudent.accountId
                        ? () => handleUnban(foundStudent.accountId, `${foundStudent.firstName} ${foundStudent.lastName}`, 'student', foundStudent.id)
                        : undefined}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-[#34495E]">All Students</CardTitle>
                <CardDescription>All registered students on the platform</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />)}</div>
                ) : students.length === 0 ? (
                  <p className="text-[#717182] text-center py-8">No students found.</p>
                ) : (
                  <div className="space-y-3">
                    {students.map(s => (
                      <UserCard key={s.id}
                        name={`${s.firstName} ${s.lastName}`}
                        email={s.email}
                        accountId={s.accountId}
                        numericId={s.id}
                        isBanned={s.isBanned}
                        extra={s.facultyField ? <p className="text-sm text-[#717182]">{s.facultyField}</p> : undefined}
                        onRemove={() => handleDeleteStudent(s.id)}
                        onBanned={() => handleBanned('student', s.id)}
                        onUnban={s.accountId
                          ? () => handleUnban(s.accountId, `${s.firstName} ${s.lastName}`, 'student', s.id)
                          : undefined}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ════════ REPORTS ════════ */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-[#34495E]">Search Reports by Listing</CardTitle>
                <CardDescription>Look up all reports for a specific listing ID</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3 flex-wrap">
                  <Input placeholder="Listing ID (e.g. 6)" value={listingIdInput}
                    onChange={(e) => setListingIdInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchByListing()}
                    className="max-w-xs" />
                  <Button onClick={handleSearchByListing} disabled={listingReportsLoading}
                    className="bg-[#00A5A7] hover:bg-[#00A5A7]/90 text-white">
                    <Search className="w-4 h-4 mr-2" />{listingReportsLoading ? 'Searching...' : 'Search'}
                  </Button>
                  {searchedListingId && (
                    <Button variant="ghost" onClick={() => { setSearchedListingId(null); setListingReports([]); setListingIdInput(''); }}
                      className="text-[#717182]">Clear</Button>
                  )}
                </div>
                {listingReportsLoading ? (
                  <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />)}</div>
                ) : searchedListingId && listingReports.length === 0 ? (
                  <p className="text-sm text-[#717182]">No reports for Listing #{searchedListingId}.</p>
                ) : listingReports.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-sm text-[#717182] font-medium">
                      {listingReports.length} report{listingReports.length !== 1 ? 's' : ''} for Listing #{searchedListingId}
                    </p>
                    {listingReports.map((r, i) => {
                      const { label, color } = statusInfo(r.status);
                      return (
                        <div key={i} className="p-3 border rounded-lg space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={`${color} border text-xs`}>{label}</Badge>
                            <span className="text-xs text-[#717182]">
                              {new Date(r.createdAt).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })}
                            </span>
                          </div>
                          <p className="text-sm text-[#34495E]">{r.reason}</p>
                          <p className="text-xs text-[#717182]">Reporter: <span className="font-mono">{r.reporterId?.slice(0,8)}…</span></p>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle className="text-[#34495E]">All Reports</CardTitle>
                  <CardDescription>
                    Review and manage user reports.
                    {reports.length > 0 && !reports[0]?.id && (
                      <span className="text-amber-600 ml-2 text-xs">
                        ⚠ Backend must include "id" in GetAllReports response to enable Resolve/Reject.
                      </span>
                    )}
                  </CardDescription>
                </div>
                <Select value={reportStatus} onValueChange={setReportStatus}>
                  <SelectTrigger className="w-40"><SelectValue placeholder="Filter" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Reports</SelectItem>
                    <SelectItem value="1">Pending</SelectItem>
                    <SelectItem value="2">Resolved</SelectItem>
                    <SelectItem value="3">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent>
                {reportsLoading ? (
                  <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded animate-pulse" />)}</div>
                ) : reports.length === 0 ? (
                  <div className="text-center py-12">
                    <Flag className="w-12 h-12 text-[#717182] mx-auto mb-3" />
                    <p className="text-[#717182]">No reports found.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reports.map((report, index) => {
                      const { label, color } = statusInfo(report.status);
                      const isUpdating = updatingReportIdx === index;
                      return (
                        <div key={index} className="p-4 border rounded-lg space-y-3">
                          <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div className="space-y-1 flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge className={`${color} border text-xs`}>{label}</Badge>
                                <span className="text-xs text-[#717182]">
                                  {new Date(report.createdAt).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })}
                                </span>
                                <span className="text-xs text-[#717182]">
                                  {report.type === 1 ? '📋 Listing' : '👤 User'}
                                </span>
                                {report.id && <span className="text-xs text-[#717182]">ID: #{report.id}</span>}
                              </div>
                              <p className="text-sm text-[#34495E]">{report.reason}</p>
                              <p className="text-xs text-[#717182]">
                                Reporter: <span className="font-mono">{report.reporterId?.slice(0,8)}…</span>
                                {' · '}
                                Reported: <span className="font-mono">{report.reportedId?.slice(0,8)}…</span>
                              </p>
                            </div>

                            {report.status === 1 && (
                              <div className="flex gap-2 flex-shrink-0">
                                <Button size="sm" disabled={isUpdating}
                                  onClick={() => handleUpdateReport(report, index, 2)}
                                  className="bg-green-600 hover:bg-green-700 text-white">
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  {isUpdating ? '…' : 'Resolve'}
                                </Button>
                                <Button size="sm" variant="outline" disabled={isUpdating}
                                  onClick={() => handleUpdateReport(report, index, 3)}
                                  className="border-gray-300 text-gray-500 hover:bg-gray-100">
                                  <XCircle className="w-4 h-4 mr-1" />
                                  {isUpdating ? '…' : 'Reject'}
                                </Button>
                              </div>
                            )}
                            {report.status === 2 && (
                              <span className="flex items-center gap-1 text-green-600 text-sm flex-shrink-0">
                                <CheckCircle className="w-4 h-4" />Resolved
                              </span>
                            )}
                            {report.status === 3 && (
                              <span className="flex items-center gap-1 text-gray-400 text-sm flex-shrink-0">
                                <XCircle className="w-4 h-4" />Rejected
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
