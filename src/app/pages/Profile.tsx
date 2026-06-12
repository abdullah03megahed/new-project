import { useState, useEffect } from 'react';
import { useAuth } from '../utils/AuthContext';
import { api } from '../utils/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import {
  Edit2, Save, X, Users, Moon, MapPin, GraduationCap, DollarSign,
  Flag, Bed, ShieldCheck, Home, Calendar, User, Building2,
} from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '../components/ui/alert-dialog';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';

// ─── Types ────────────────────────────────────────────────────────────────────

interface StudentProfile {
  id: number; firstName: string; lastName: string; birthDate: string;
  age: number; homeTown: string; gender: number; bio: string;
  facultyField: string; lookingForRoommate: boolean; sleepingHabits: number;
  minBudget: number; maxBudget: number; nationalCard: string;
  universityCard: string; email: string; phoneNumber: string; accountId: string;
}

interface LandlordProfile {
  id: number; firstName: string; lastName: string; birthDate: string;
  nationalId: string; homeTown: string; email: string;
  phoneNumber: string; accountId: string;
}

interface Report {
  id?: number; reporterId: string; reportedId: string; reason: string;
  status: number; type: number; createdAt: string;
}

interface PaginatedReports {
  pageIndex: number; pageSize: number; count: number; data: Report[];
}

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

interface BookingDetail {
  id: number;
  startDate: string;
  endDate: string;
  status: number;
  studentId: number;
  bedId: number;
  listingId: number;
  landLordId: number;
  studentName: string;
  roomId: number;
  landlordName: string;
  amount: number;
  type: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const reportStatusLabel = (s: number) => {
  if (s === 1) return { label: 'Pending',   color: 'bg-yellow-100 text-yellow-700 border-yellow-200' };
  if (s === 2) return { label: 'Resolved',  color: 'bg-green-100 text-green-700 border-green-200' };
  if (s === 3) return { label: 'Dismissed', color: 'bg-gray-100 text-gray-500 border-gray-200' };
  return { label: 'Unknown', color: 'bg-gray-100 text-gray-400' };
};

const bookingStatusLabel = (s: number) => {
  if (s === 1) return { label: 'Active',    color: 'bg-green-100 text-green-700 border-green-200' };
  if (s === 2) return { label: 'Cancelled', color: 'bg-gray-100 text-gray-500 border-gray-200' };
  if (s === 3) return { label: 'Completed', color: 'bg-blue-100 text-blue-700 border-blue-200' };
  return { label: 'Unknown', color: 'bg-gray-100 text-gray-400' };
};

const bookingTypeLabel = (t: number) => {
  if (t === 1) return 'Single Bed';
  if (t === 2) return 'Entire Room';
  return '—';
};

const genderLabel = (g: number) => (g === 1 ? 'Male' : g === 2 ? 'Female' : '—');
const sleepLabel  = (s: number) => s === 1 ? '🌅 Early Bird' : s === 2 ? '🌙 Night Owl' : s === 3 ? '⚡ Flexible' : '—';
const initials    = (first?: string, last?: string) => `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase() || '?';

const formatDate = (d: string) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

// ─── Booking Detail Dialog ────────────────────────────────────────────────────

interface BookingDetailDialogProps {
  bookingId: number;
  open: boolean;
  onClose: () => void;
  onCancel: (id: number) => Promise<void>;
  cancellingId: number | null;
}

const BookingDetailDialog = ({ bookingId, open, onClose, onCancel, cancellingId }: BookingDetailDialogProps) => {
  const navigate = useNavigate();
  const [detail, setDetail] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !bookingId) return;
    setLoading(true);
    api.get<BookingDetail>(`/Booking/GetBooking/${bookingId}`)
      .then(data => setDetail(data))
      .catch(() => toast.error('Failed to load booking details.'))
      .finally(() => setLoading(false));
  }, [open, bookingId]);

  const { label, color } = detail ? bookingStatusLabel(detail.status) : { label: '', color: '' };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#34495E]">Booking Details</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="space-y-3 py-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />)}
          </div>
        ) : detail ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge className={`${color} border text-xs`}>{label}</Badge>
              <span className="text-xs text-[#717182]">Booking #{detail.id}</span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Building2 className="w-4 h-4 text-[#00A5A7] flex-shrink-0" />
                <div>
                  <p className="text-xs text-[#717182]">Listing</p>
                  <p className="text-[#34495E] font-medium">Listing #{detail.listingId}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Bed className="w-4 h-4 text-[#00A5A7] flex-shrink-0" />
                <div>
                  <p className="text-xs text-[#717182]">Bed / Room</p>
                  <p className="text-[#34495E] font-medium">
                    Bed #{detail.bedId} · {bookingTypeLabel(detail.type)}
                  </p>
                </div>
              </div>

              {detail.landlordName && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <User className="w-4 h-4 text-[#00A5A7] flex-shrink-0" />
                  <div>
                    <p className="text-xs text-[#717182]">Landlord</p>
                    <p className="text-[#34495E] font-medium">{detail.landlordName}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Calendar className="w-4 h-4 text-[#00A5A7] flex-shrink-0" />
                <div>
                  <p className="text-xs text-[#717182]">Duration</p>
                  <p className="text-[#34495E] font-medium">
                    {formatDate(detail.startDate)} → {formatDate(detail.endDate)}
                  </p>
                </div>
              </div>

              {detail.amount > 0 && (
                <div className="flex items-center gap-3 p-3 bg-[#FF6F61]/5 rounded-lg border border-[#FF6F61]/20">
                  <DollarSign className="w-4 h-4 text-[#FF6F61] flex-shrink-0" />
                  <div>
                    <p className="text-xs text-[#717182]">Total Amount</p>
                    <p className="text-[#FF6F61] font-semibold text-base">
                      EGP {detail.amount.toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline" size="sm"
                onClick={() => { onClose(); navigate(`/house/${detail.listingId}`); }}
                className="border-[#00A5A7] text-[#00A5A7] hover:bg-[#00A5A7] hover:text-white flex-1"
              >
                View Listing
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline" size="sm"
                    disabled={cancellingId === detail.id}
                    className="border-[#FF6F61] text-[#FF6F61] hover:bg-[#FF6F61] hover:text-white flex-1"
                  >
                    {cancellingId === detail.id ? 'Cancelling...' : 'Cancel Booking'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel this booking?</AlertDialogTitle>
                    <AlertDialogDescription>
                      You're about to cancel your booking for Listing #{detail.listingId} (Bed #{detail.bedId}). This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep Booking</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={async () => { await onCancel(detail.id); onClose(); }}
                      className="bg-[#FF6F61] hover:bg-[#FF6F61]/90 text-white"
                    >
                      Yes, Cancel
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ) : (
          <p className="text-[#717182] text-sm text-center py-6">Failed to load booking details.</p>
        )}
      </DialogContent>
    </Dialog>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────

export const Profile = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'profile' | 'reports' | 'bookings'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const [studentData, setStudentData] = useState<StudentProfile | null>(null);
  const [landlordData, setLandlordData] = useState<LandlordProfile | null>(null);
  const [studentForm, setStudentForm] = useState<StudentProfile | null>(null);
  const [landlordForm, setLandlordForm] = useState<LandlordProfile | null>(null);

  const [reports, setReports]               = useState<Report[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsCount, setReportsCount]     = useState(0);

  const [bookings, setBookings]               = useState<BookingSummary[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [activeBookingsCount, setActiveBookingsCount] = useState(0);
  const [cancellingId, setCancellingId]       = useState<number | null>(null);

  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  const [detailOpen, setDetailOpen]               = useState(false);

  // ─── Fetch profile ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    if (user.type === 'admin') { setLoading(false); return; }

    const fetchProfile = async () => {
      try {
        if (user.type === 'student') {
          let data: StudentProfile;
          if (user.id) {
            data = await api.get<StudentProfile>(`/Student/${user.id}`);
          } else {
            data = await api.get<StudentProfile>(`/Student/Email?email=${encodeURIComponent(user.email)}`);
            if (data?.id) updateUser({ id: String(data.id) });
          }
          setStudentData(data);
          setStudentForm(data);
        } else if (user.type === 'landlord') {
          let data: LandlordProfile;
          if (user.id) {
            data = await api.get<LandlordProfile>(`/LandLord/${user.id}`);
          } else {
            data = await api.get<LandlordProfile>(`/LandLord/Email?email=${encodeURIComponent(user.email)}`);
            if (data?.id) updateUser({ id: String(data.id) });
          }
          setLandlordData(data);
          setLandlordForm(data);
        }
      } catch (err) {
        console.error('[Profile] Failed to load profile:', err);
        toast.error('Failed to load profile data.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user?.id, user?.email, user?.type]);

  // ─── Fetch reports ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (activeTab !== 'reports' || !user || user.type === 'admin') return;
    setReportsLoading(true);
    api.get<PaginatedReports>('/Report/GetUserReports?SortingOption=2&PageIndex=1&PageSize=20')
      .then(data => { setReports(data.data || []); setReportsCount(data.count || 0); })
      .catch(() => toast.error('Failed to load reports.'))
      .finally(() => setReportsLoading(false));
  }, [activeTab, user]);

  // ─── Fetch bookings ────────────────────────────────────────────────────────
  useEffect(() => {
    if (activeTab !== 'bookings' || !user || user.type !== 'student' || !user.id) return;
    setBookingsLoading(true);
    api.get<PaginatedBookings>(`/Booking/GetStudentBookings/${user.id}?PageIndex=1&PageSize=100`)
      .then(data => {
        const list: BookingSummary[] = data?.data || [];
        setBookings(list);
        setActiveBookingsCount(list.length);
      })
      .catch(() => toast.error('Failed to load your bookings.'))
      .finally(() => setBookingsLoading(false));
  }, [activeTab, user]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[#717182]">Please log in to view your profile.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00A5A7]" />
      </div>
    );
  }

  // ─── Admin view ────────────────────────────────────────────────────────────
  if (user.type === 'admin') {
    return (
      <div className="min-h-screen bg-[#B19CD9]/5 py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <Card>
            <CardContent className="p-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-[#00A5A7]/10 rounded-full flex items-center justify-center">
                <ShieldCheck className="w-8 h-8 text-[#00A5A7]" />
              </div>
              <div>
                <p className="text-[#34495E] font-semibold text-lg">{user.email}</p>
                <span className="inline-block mt-1 px-3 py-1 bg-[#00A5A7]/10 rounded-full text-[#00A5A7] text-sm capitalize">
                  Admin
                </span>
              </div>
              <p className="text-[#717182] text-sm">
                Admin accounts don't have an editable profile. Use the Admin Dashboard to manage
                users, listings, bookings, and reports.
              </p>
              <Button onClick={() => navigate('/admin')} className="bg-[#00A5A7] hover:bg-[#00A5A7]/90 text-white">
                Go to Admin Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ─── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      if (user.type === 'student' && studentForm) {
        const id = studentForm.id || Number(user.id);
        const updated = await api.put<StudentProfile>(`/Student/${id}`, { ...studentForm, id });
        setStudentData(updated);
        setStudentForm(updated);
        updateUser({ displayName: `${updated.firstName} ${updated.lastName}`, id: String(updated.id) });
        toast.success('Profile updated successfully!');
      } else if (user.type === 'landlord' && landlordForm) {
        const id = landlordForm.id || Number(user.id);
        const updated = await api.put<LandlordProfile>(`/LandLord/${id}`, { ...landlordForm, id });
        setLandlordData(updated);
        setLandlordForm(updated);
        updateUser({ displayName: `${updated.firstName} ${updated.lastName}`, id: String(updated.id) });
        toast.success('Profile updated successfully!');
      }
      setIsEditing(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setStudentForm(studentData);
    setLandlordForm(landlordData);
    setIsEditing(false);
  };

  // ─── Cancel booking ────────────────────────────────────────────────────────
  const handleCancelBooking = async (bookingId: number) => {
    setCancellingId(bookingId);
    try {
      await api.put(`/Booking/CancelBooking/${bookingId}`, {});
      setBookings(prev => prev.filter(b => b.id !== bookingId));
      setActiveBookingsCount(prev => Math.max(0, prev - 1));
      toast.success('Booking cancelled successfully.');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to cancel booking.');
    } finally {
      setCancellingId(null);
    }
  };

  const openDetail = (bookingId: number) => {
    setSelectedBookingId(bookingId);
    setDetailOpen(true);
  };

  const displayName = user.type === 'student'
    ? `${studentData?.firstName ?? ''} ${studentData?.lastName ?? ''}`
    : `${landlordData?.firstName ?? ''} ${landlordData?.lastName ?? ''}`;

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#B19CD9]/5 py-8">
      <div className="container mx-auto px-4 max-w-4xl">

        {selectedBookingId !== null && (
          <BookingDetailDialog
            bookingId={selectedBookingId}
            open={detailOpen}
            onClose={() => { setDetailOpen(false); setSelectedBookingId(null); }}
            onCancel={handleCancelBooking}
            cancellingId={cancellingId}
          />
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
          <button onClick={() => setActiveTab('profile')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'profile' ? 'border-[#00A5A7] text-[#00A5A7]' : 'border-transparent text-[#717182] hover:text-[#34495E]'}`}>
            My Profile
          </button>

          {user.type === 'student' && (
            <button onClick={() => setActiveTab('bookings')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'bookings' ? 'border-[#00A5A7] text-[#00A5A7]' : 'border-transparent text-[#717182] hover:text-[#34495E]'}`}>
              <Bed className="w-4 h-4" />
              My Bookings
              {activeBookingsCount > 0 && (
                <span className="bg-[#00A5A7] text-white text-xs px-1.5 py-0.5 rounded-full">{activeBookingsCount}</span>
              )}
            </button>
          )}

          <button onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'reports' ? 'border-[#00A5A7] text-[#00A5A7]' : 'border-transparent text-[#717182] hover:text-[#34495E]'}`}>
            <Flag className="w-4 h-4" />
            My Reports
            {reportsCount > 0 && (
              <span className="bg-[#FF6F61] text-white text-xs px-1.5 py-0.5 rounded-full">{reportsCount}</span>
            )}
          </button>
        </div>

        {/* ══ PROFILE TAB ══ */}
        {activeTab === 'profile' && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-[#34495E]">My Profile</CardTitle>
                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)} className="bg-[#00A5A7] hover:bg-[#00A5A7]/90 text-white">
                    <Edit2 className="w-4 h-4 mr-2" />Edit Profile
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button onClick={handleSave} disabled={saving} className="bg-[#B8E986] hover:bg-[#B8E986]/90 text-[#34495E]">
                      <Save className="w-4 h-4 mr-2" />{saving ? 'Saving...' : 'Save'}
                    </Button>
                    <Button onClick={handleCancelEdit} variant="outline" disabled={saving}>
                      <X className="w-4 h-4 mr-2" />Cancel
                    </Button>
                  </div>
                )}
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <Avatar className="w-20 h-20">
                    <AvatarFallback className="bg-[#00A5A7] text-white text-2xl">
                      {user.type === 'student'
                        ? initials(studentData?.firstName, studentData?.lastName)
                        : initials(landlordData?.firstName, landlordData?.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-[#34495E] font-semibold text-lg">{displayName.trim()}</p>
                    <span className="inline-block mt-1 px-3 py-1 bg-[#00A5A7]/10 rounded-full text-[#00A5A7] text-sm capitalize">
                      {user.type}
                    </span>
                  </div>
                </div>

                {/* ── Student Form ── */}
                {user.type === 'student' && studentForm && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>First Name</Label>
                        <Input value={studentForm.firstName}
                          onChange={(e) => setStudentForm({ ...studentForm, firstName: e.target.value })}
                          disabled={!isEditing} />
                      </div>
                      <div className="space-y-2">
                        <Label>Last Name</Label>
                        <Input value={studentForm.lastName}
                          onChange={(e) => setStudentForm({ ...studentForm, lastName: e.target.value })}
                          disabled={!isEditing} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input value={studentForm.email} disabled />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Phone Number</Label>
                        <Input value={studentForm.phoneNumber}
                          onChange={(e) => setStudentForm({ ...studentForm, phoneNumber: e.target.value })}
                          disabled={!isEditing} />
                      </div>
                      <div className="space-y-2">
                        <Label>Gender</Label>
                        {isEditing ? (
                          <Select value={String(studentForm.gender)}
                            onValueChange={(v) => setStudentForm({ ...studentForm, gender: Number(v) })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">Male</SelectItem>
                              <SelectItem value="2">Female</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input value={genderLabel(studentForm.gender)} disabled />
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Date of Birth</Label>
                        <Input type="date"
                          value={studentForm.birthDate ? studentForm.birthDate.split('T')[0] : ''}
                          onChange={(e) => setStudentForm({ ...studentForm, birthDate: e.target.value })}
                          disabled={!isEditing} />
                      </div>
                      <div className="space-y-2">
                        <Label>Home Town</Label>
                        <Input value={studentForm.homeTown}
                          onChange={(e) => setStudentForm({ ...studentForm, homeTown: e.target.value })}
                          disabled={!isEditing} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Faculty / Field</Label>
                      <Input value={studentForm.facultyField}
                        onChange={(e) => setStudentForm({ ...studentForm, facultyField: e.target.value })}
                        disabled={!isEditing} />
                    </div>
                    <div className="space-y-2">
                      <Label>Bio</Label>
                      <Input value={studentForm.bio}
                        onChange={(e) => setStudentForm({ ...studentForm, bio: e.target.value })}
                        disabled={!isEditing} placeholder="Tell others about yourself..." />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Min Budget (EGP/month)</Label>
                        <Input type="number" value={studentForm.minBudget}
                          onChange={(e) => setStudentForm({ ...studentForm, minBudget: Number(e.target.value) })}
                          disabled={!isEditing} />
                      </div>
                      <div className="space-y-2">
                        <Label>Max Budget (EGP/month)</Label>
                        <Input type="number" value={studentForm.maxBudget}
                          onChange={(e) => setStudentForm({ ...studentForm, maxBudget: Number(e.target.value) })}
                          disabled={!isEditing} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Sleeping Habits</Label>
                      {isEditing ? (
                        <Select value={String(studentForm.sleepingHabits)}
                          onValueChange={(v) => setStudentForm({ ...studentForm, sleepingHabits: Number(v) })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">🌅 Early Bird</SelectItem>
                            <SelectItem value="2">🌙 Night Owl</SelectItem>
                            <SelectItem value="3">⚡ Flexible</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input value={sleepLabel(studentForm.sleepingHabits)} disabled />
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>National Card ID</Label>
                        <Input value={studentForm.nationalCard} disabled />
                      </div>
                      <div className="space-y-2">
                        <Label>University Card ID</Label>
                        <Input value={studentForm.universityCard} disabled />
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="lookingForRoommate" checked={studentForm.lookingForRoommate}
                        onCheckedChange={(c) => setStudentForm({ ...studentForm, lookingForRoommate: c === true })}
                        disabled={!isEditing} />
                      <Label htmlFor="lookingForRoommate" className="cursor-pointer">Looking for a roommate</Label>
                    </div>
                  </>
                )}

                {/* ── Landlord Form ── */}
                {user.type === 'landlord' && landlordForm && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>First Name</Label>
                        <Input value={landlordForm.firstName}
                          onChange={(e) => setLandlordForm({ ...landlordForm, firstName: e.target.value })}
                          disabled={!isEditing} />
                      </div>
                      <div className="space-y-2">
                        <Label>Last Name</Label>
                        <Input value={landlordForm.lastName}
                          onChange={(e) => setLandlordForm({ ...landlordForm, lastName: e.target.value })}
                          disabled={!isEditing} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input value={landlordForm.email} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone Number</Label>
                      <Input value={landlordForm.phoneNumber}
                        onChange={(e) => setLandlordForm({ ...landlordForm, phoneNumber: e.target.value })}
                        disabled={!isEditing} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Date of Birth</Label>
                        <Input type="date"
                          value={landlordForm.birthDate ? landlordForm.birthDate.split('T')[0] : ''}
                          onChange={(e) => setLandlordForm({ ...landlordForm, birthDate: e.target.value })}
                          disabled={!isEditing} />
                      </div>
                      <div className="space-y-2">
                        <Label>Home Town</Label>
                        <Input value={landlordForm.homeTown}
                          onChange={(e) => setLandlordForm({ ...landlordForm, homeTown: e.target.value })}
                          disabled={!isEditing} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>National ID</Label>
                      <Input value={landlordForm.nationalId} disabled />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Matching Preferences — students only */}
            {user.type === 'student' && studentData && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-[#34495E] flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#00A5A7]" />
                    Roommate Matching Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!studentData.homeTown && !studentData.minBudget && !studentData.sleepingHabits ? (
                    <div className="text-center py-8">
                      <p className="text-[#717182] mb-4">Complete your matching preferences to find the perfect roommate</p>
                      <Button onClick={() => navigate('/matching')} className="bg-[#00A5A7] hover:bg-[#00A5A7]/90 text-white">
                        Complete Matching Form
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {studentData.homeTown && (
                        <div className="bg-[#B19CD9]/5 rounded-lg p-4 border border-[#B19CD9]/20">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-9 h-9 bg-[#00A5A7]/10 rounded-full flex items-center justify-center">
                              <MapPin className="w-4 h-4 text-[#00A5A7]" />
                            </div>
                            <Label className="text-[#34495E]">Home Town</Label>
                          </div>
                          <p className="text-[#34495E] pl-1">{studentData.homeTown}</p>
                        </div>
                      )}
                      {studentData.facultyField && (
                        <div className="bg-[#B19CD9]/5 rounded-lg p-4 border border-[#B19CD9]/20">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-9 h-9 bg-[#FFC759]/10 rounded-full flex items-center justify-center">
                              <GraduationCap className="w-4 h-4 text-[#FFC759]" />
                            </div>
                            <Label className="text-[#34495E]">Faculty</Label>
                          </div>
                          <p className="text-[#34495E] pl-1">{studentData.facultyField}</p>
                        </div>
                      )}
                      {(studentData.minBudget > 0 || studentData.maxBudget > 0) && (
                        <div className="bg-[#B19CD9]/5 rounded-lg p-4 border border-[#B19CD9]/20">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-9 h-9 bg-[#B8E986]/10 rounded-full flex items-center justify-center">
                              <DollarSign className="w-4 h-4 text-[#B8E986]" />
                            </div>
                            <Label className="text-[#34495E]">Budget Range</Label>
                          </div>
                          <p className="text-[#34495E] pl-1">
                            EGP {studentData.minBudget.toLocaleString()} – {studentData.maxBudget.toLocaleString()}/month
                          </p>
                        </div>
                      )}
                      {studentData.sleepingHabits > 0 && (
                        <div className="bg-[#B19CD9]/5 rounded-lg p-4 border border-[#B19CD9]/20">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-9 h-9 bg-[#B19CD9]/10 rounded-full flex items-center justify-center">
                              <Moon className="w-4 h-4 text-[#B19CD9]" />
                            </div>
                            <Label className="text-[#34495E]">Sleeping Habits</Label>
                          </div>
                          <p className="text-[#34495E] pl-1">{sleepLabel(studentData.sleepingHabits)}</p>
                        </div>
                      )}
                      <div className="bg-[#B19CD9]/5 rounded-lg p-4 border border-[#B19CD9]/20">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-9 h-9 bg-[#FF6F61]/10 rounded-full flex items-center justify-center">
                            <Users className="w-4 h-4 text-[#FF6F61]" />
                          </div>
                          <Label className="text-[#34495E]">Looking for Roommate</Label>
                        </div>
                        <p className="text-[#34495E] pl-1">{studentData.lookingForRoommate ? 'Yes' : 'No'}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* ══ BOOKINGS TAB ══ */}
        {activeTab === 'bookings' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
              <CardTitle className="text-[#34495E] flex items-center gap-2">
                <Bed className="w-5 h-5 text-[#00A5A7]" />
                My Bookings
                {bookings.length > 0 && (
                  <span className="text-sm text-[#717182] font-normal">({bookings.length} total)</span>
                )}
              </CardTitle>
              <Button
                onClick={() => navigate('/houses')}
                className="bg-[#FF6F61] hover:bg-[#FF6F61]/90 text-white"
                size="sm"
              >
                <Home className="w-4 h-4 mr-2" />
                Book a Room
              </Button>
            </CardHeader>
            <CardContent>
              {bookingsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />)}
                </div>
              ) : bookings.length === 0 ? (
                <div className="text-center py-12">
                  <Bed className="w-12 h-12 text-[#717182] mx-auto mb-3" />
                  <p className="text-[#717182] mb-4">You haven't booked any beds yet.</p>
                  <Button onClick={() => navigate('/houses')} className="bg-[#00A5A7] hover:bg-[#00A5A7]/90 text-white">
                    Browse Houses
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {bookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="p-4 border rounded-lg hover:border-[#00A5A7]/40 transition-colors cursor-pointer"
                      onClick={() => openDetail(booking.id)}
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-[#34495E] font-medium">
                            Booking #{booking.id}
                          </span>
                          <span className="text-xs text-[#717182]">· Listing #{booking.listingId}</span>
                        </div>
                        <span className="text-xs text-[#00A5A7] font-medium">View Details →</span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-[#717182] mt-2">
                        <span className="flex items-center gap-1">
                          <Bed className="w-3.5 h-3.5" />
                          Bed #{booking.bedId}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(booking.startDate)} → {formatDate(booking.endDate)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ══ REPORTS TAB ══ */}
        {activeTab === 'reports' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-[#34495E] flex items-center gap-2">
                <Flag className="w-5 h-5 text-[#FF6F61]" />
                My Reports
                {reportsCount > 0 && (
                  <span className="text-sm text-[#717182] font-normal">({reportsCount} total)</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reportsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />)}
                </div>
              ) : reports.length === 0 ? (
                <div className="text-center py-12">
                  <Flag className="w-12 h-12 text-[#717182] mx-auto mb-3" />
                  <p className="text-[#717182]">You haven't submitted any reports yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reports.map((report, index) => {
                    const { label, color } = reportStatusLabel(report.status);
                    return (
                      <div key={index} className="p-4 border rounded-lg space-y-2">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <Badge className={`${color} border text-xs`}>{label}</Badge>
                          <span className="text-xs text-[#717182]">
                            {new Date(report.createdAt).toLocaleDateString('en-GB', {
                              day: '2-digit', month: 'short', year: 'numeric',
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-[#34495E]">{report.reason}</p>
                        <p className="text-xs text-[#717182]">
                          Type: {report.type === 1 ? 'Listing Report' : 'User Report'}
                        </p>
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
