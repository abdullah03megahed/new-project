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
  User, Calendar, ShieldAlert, GraduationCap, Eye,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardStats {
  totalStudents: number; totalLandlords: number; totalListings: number;
  totalBookings: number; availableBeds: number; occupiedBeds: number;
  pendingListings: number; totalBans: number; totalReports: number;
  recentListings: RecentListing[];
  recentBookings: RecentBooking[];
}
interface RecentListing {
  id: number; title: string; city: string; landlordName: string;
  address: string; status: number; listingImages: string[]; publishedAt: string;
}
interface RecentBooking {
  id: number; startDate: string; endDate: string; listingId: number; bedId: number;
}
interface Landlord {
  id: number; firstName: string; lastName: string;
  email: string; phoneNumber?: string; nationalId?: string;
  homeTown?: string; accountId: string; isBanned?: boolean;
}
interface Student {
  id: number; firstName: string; lastName: string;
  email: string; phoneNumber?: string; gender?: number;
  facultyField?: string; homeTown?: string; accountId: string; isBanned?: boolean;
}
// GetAllReports: reporterId is always an account GUID.
// reportedId is an account GUID for user reports, but a numeric
// listing ID (as a string) for listing reports.
// We detect which it is by checking if reportedId is purely numeric.
interface Report {
  id?: number;
  reporterId: string;
  reportedId: string;
  reason: string;
  status: number;
  type: number;
  createdAt: string;
}
interface PaginatedReports {
  pageIndex: number; pageSize: number; count: number; data: Report[];
}
interface BookingDto {
  id: number; studentId?: number; studentName?: string;
  landlordId?: number; landlordName?: string;
  listingId: number; listingTitle?: string;
  bedId: number; startDate: string; endDate: string;
  status: number; amount?: number; durationInMonths?: number;
}
interface BanRecord { userId: string; isActive: boolean; }
interface PaginatedBans { pageIndex: number; pageSize: number; count: number; data: BanRecord[]; }

// Result of looking up a user by accountId
interface UserLookup {
  kind: 'student' | 'landlord';
  name: string;
  email: string;
  phoneNumber?: string;
  homeTown?: string;
  facultyField?: string;
  gender?: number;
  nationalId?: string;
  id: number;
  accountId: string;
}

// Result of looking up a listing by id
interface ListingLookup {
  id: number;
  title: string;
  address?: string;
  city?: string;
  pricePerMonth?: number;
  landlordName?: string;
  status: number;
  listingImages: string[];
}

// A banned account, enriched with profile info if we could resolve it
interface BannedEntry {
  accountId: string;
  name: string;
  email: string;
  kind?: 'student' | 'landlord';
  id?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const IMAGE_BASE = 'https://unimate.runasp.net/';
const prefixImage = (img: string) => {
  if (!img) return '';
  if (img.startsWith('http://') || img.startsWith('https://')) return img;
  return `${IMAGE_BASE}${img.startsWith('/') ? img.slice(1) : img}`;
};

// Returns true if the string is purely digits — meaning it's a listing ID, not a GUID.
// GUIDs always contain hyphens; listing IDs are plain integers.
const isNumericId = (val: string) => /^\d+$/.test((val ?? '').trim());

const statusInfo = (s: number) => {
  if (s === 1) return { label: 'Pending',  color: 'bg-yellow-100 text-yellow-700 border-yellow-200' };
  if (s === 2) return { label: 'Resolved', color: 'bg-green-100 text-green-700 border-green-200' };
  if (s === 3) return { label: 'Rejected', color: 'bg-gray-100 text-gray-500 border-gray-200' };
  return { label: 'Unknown', color: 'bg-gray-100 text-gray-500' };
};

// Maps BookingStatusDto: Pending=1, Cancelled=2, Completed=3, Ended=4, PendingTransfer=5
// Accepts both number and string since APIs sometimes serialize enums as strings.
// Also handles 0-based variants (0=Pending … 4=PendingTransfer) just in case.
const bookingStatusInfo = (raw: number | string) => {
  // Normalise to number
  const s = typeof raw === 'string' ? parseInt(raw, 10) : raw;

  // 1-based (standard)
  if (s === 1) return { label: 'Pending',          color: 'bg-yellow-100 text-yellow-700 border-yellow-200' };
  if (s === 2) return { label: 'Cancelled',        color: 'bg-gray-100 text-gray-500 border-gray-200' };
  if (s === 3) return { label: 'Completed',        color: 'bg-blue-100 text-blue-700 border-blue-200' };
  if (s === 4) return { label: 'Ended',            color: 'bg-purple-100 text-purple-700 border-purple-200' };
  if (s === 5) return { label: 'Pending Transfer', color: 'bg-orange-100 text-orange-700 border-orange-200' };

  // 0-based fallback
  if (s === 0) return { label: 'Pending',          color: 'bg-yellow-100 text-yellow-700 border-yellow-200' };

  // Show the raw value so it's visible in the UI during debugging
  return { label: `Status ${isNaN(s) ? raw : s}`, color: 'bg-gray-100 text-gray-400' };
};

const formatDate = (d: string) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const genderLabel = (g?: number) => (g === 1 ? 'Male' : g === 2 ? 'Female' : '—');

// ─── Lookup user by accountId ─────────────────────────────────────────────────
async function lookupUserByAccountId(accountId: string): Promise<UserLookup | null> {
  try {
    const s = await api.get<any>(`/Student/Account/${accountId}`).catch(() => null);
    if (s?.id) {
      return {
        kind: 'student',
        name: `${s.firstName ?? ''} ${s.lastName ?? ''}`.trim(),
        email: s.email,
        phoneNumber: s.phoneNumber,
        homeTown: s.homeTown,
        facultyField: s.facultyField,
        gender: s.gender,
        id: s.id,
        accountId,
      };
    }
  } catch { /* fall through */ }

  try {
    const l = await api.get<any>(`/LandLord/Account/${accountId}`).catch(() => null);
    if (l?.id) {
      return {
        kind: 'landlord',
        name: `${l.firstName ?? ''} ${l.lastName ?? ''}`.trim(),
        email: l.email,
        phoneNumber: l.phoneNumber,
        homeTown: l.homeTown,
        nationalId: l.nationalId,
        id: l.id,
        accountId,
      };
    }
  } catch { /* not found */ }

  return null;
}

// ─── Lookup listing by id ──────────────────────────────────────────────────────
async function lookupListingById(listingId: string | number): Promise<ListingLookup | null> {
  try {
    const data = await api.get<any>(`/Listing/${listingId}`);
    if (data?.id != null) {
      return {
        id: data.id,
        title: data.title,
        address: data.address,
        city: data.city,
        pricePerMonth: data.pricePerMonth,
        landlordName: data.landlordName,
        status: data.status,
        listingImages: data.listingImages || [],
      };
    }
  } catch { /* not found */ }
  return null;
}

// ─── Unban API helper ───────────────────────────────────────────────────────────
async function unbanUser(accountId: string): Promise<void> {
  try {
    await api.put(`/Ban/UnBanUser/${accountId}`, {});
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('Unexpected end of JSON input')) {
      return;
    }
    throw err;
  }
}

// ─── User Info Dialog ─────────────────────────────────────────────────────────

interface UserInfoDialogProps {
  accountId: string;
  label: string;
}

const UserInfoDialog = ({ accountId, label }: UserInfoDialogProps) => {
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState<UserLookup | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [fetched, setFetched]   = useState(false);

  const handleOpenChange = async (next: boolean) => {
    setOpen(next);
    if (!next || fetched) return;
    setLoading(true);
    setNotFound(false);
    const found = await lookupUserByAccountId(accountId);
    if (found) {
      setResult(found);
      setFetched(true);
    } else {
      setNotFound(true);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button className="font-medium text-[#00A5A7] hover:underline text-xs font-mono">
          {label}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#34495E]">User Details</DialogTitle>
          <DialogDescription className="font-mono text-xs break-all">{accountId}</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-3 py-2">
            {[1,2,3].map(i => <div key={i} className="h-5 bg-gray-100 rounded animate-pulse" />)}
          </div>
        ) : notFound ? (
          <p className="text-sm text-[#717182] py-2">No account found for this ID.</p>
        ) : result ? (
          <div className="space-y-3 py-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={`border text-xs ${
                result.kind === 'student'
                  ? 'bg-[#00A5A7]/10 text-[#00A5A7] border-[#00A5A7]/30'
                  : 'bg-[#B8E986]/20 text-[#34495E] border-[#B8E986]/40'
              }`}>
                {result.kind === 'student' ? 'Student' : 'Landlord'}
              </Badge>
            </div>
            <div className="space-y-1.5 text-sm">
              <p className="text-[#34495E] font-medium">{result.name || '—'}</p>
              <p className="text-[#717182]">✉ {result.email}</p>
              {result.phoneNumber && <p className="text-[#717182]">📞 {result.phoneNumber}</p>}
              {result.homeTown && (
                <p className="text-[#717182] flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />{result.homeTown}
                </p>
              )}
              {result.kind === 'student' && result.facultyField && (
                <p className="text-[#717182] flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5" />{result.facultyField}
                </p>
              )}
              {result.kind === 'student' && result.gender != null && (
                <p className="text-[#717182]">Gender: {genderLabel(result.gender)}</p>
              )}
              {result.kind === 'landlord' && result.nationalId && (
                <p className="text-[#717182]">National ID: {result.nationalId}</p>
              )}
              <p className="text-[#717182] text-xs">Numeric ID: #{result.id}</p>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

// ─── Listing Info Dialog ──────────────────────────────────────────────────────

interface ListingInfoDialogProps {
  listingId: string;
  label: string;
}

const ListingInfoDialog = ({ listingId, label }: ListingInfoDialogProps) => {
  const navigate = useNavigate();
  const [open, setOpen]         = useState(false);
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState<ListingLookup | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [fetched, setFetched]   = useState(false);

  const handleOpenChange = async (next: boolean) => {
    setOpen(next);
    if (!next || fetched) return;
    setLoading(true);
    setNotFound(false);
    const found = await lookupListingById(listingId);
    if (found) {
      setResult(found);
      setFetched(true);
    } else {
      setNotFound(true);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button className="font-medium text-[#00A5A7] hover:underline text-xs font-mono">
          {label}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#34495E]">Listing Details</DialogTitle>
          <DialogDescription className="font-mono text-xs">Listing #{listingId}</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-3 py-2">
            {[1,2,3].map(i => <div key={i} className="h-5 bg-gray-100 rounded animate-pulse" />)}
          </div>
        ) : notFound ? (
          <p className="text-sm text-[#717182] py-2">No listing found with this ID.</p>
        ) : result ? (
          <div className="space-y-3 py-2">
            {result.listingImages?.[0] ? (
              <img src={prefixImage(result.listingImages[0])} alt={result.title}
                className="w-full h-32 object-cover rounded-lg"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            ) : (
              <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                <Home className="w-8 h-8 text-gray-300" />
              </div>
            )}
            <div className="space-y-1.5 text-sm">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <p className="text-[#34495E] font-medium">{result.title || '—'}</p>
                <Badge className={`text-xs border-0 ${
                  result.status === 1 ? 'bg-[#B8E986] text-[#34495E]' : 'bg-gray-100 text-gray-500'
                }`}>
                  {result.status === 1 ? 'Active' : 'Pending'}
                </Badge>
              </div>
              {(result.address || result.city) && (
                <p className="text-[#717182] flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {result.address ? `${result.address}, ` : ''}{result.city}
                </p>
              )}
              {result.pricePerMonth != null && (
                <p className="text-[#717182]">EGP {result.pricePerMonth.toLocaleString()} / month</p>
              )}
              {result.landlordName && (
                <p className="text-[#717182]">By <span className="text-[#00A5A7]">{result.landlordName}</span></p>
              )}
              <p className="text-[#717182] text-xs">Listing ID: #{result.id}</p>
            </div>
            <Button size="sm" onClick={() => navigate(`/house/${result.id}`)}
              className="bg-[#00A5A7] hover:bg-[#00A5A7]/90 text-white w-full">
              View Listing
            </Button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

// ─── Reported Entity Dialog ───────────────────────────────────────────────────
// Detection strategy: if reportedId is purely numeric digits → listing ID.
// If it contains hyphens (GUID format) → user accountId.
// This is more reliable than trusting report.type from the backend.

interface ReportedEntityDialogProps {
  report: Report;
  compact?: boolean;
}

const ReportedEntityDialog = ({ report, compact = true }: ReportedEntityDialogProps) => {
  if (isNumericId(report.reportedId)) {
    return (
      <ListingInfoDialog
        listingId={report.reportedId}
        label={compact ? `Listing #${report.reportedId}` : 'View listing details →'}
      />
    );
  }
  return (
    <UserInfoDialog
      accountId={report.reportedId}
      label={compact ? report.reportedId.slice(0, 8) + '…' : 'View reported profile →'}
    />
  );
};

// ─── Report Detail Dialog ─────────────────────────────────────────────────────

interface ReportDetailDialogProps {
  report: Report;
}

const ReportDetailDialog = ({ report }: ReportDetailDialogProps) => {
  const { label, color } = statusInfo(report.status);
  const isListingReport = isNumericId(report.reportedId);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-[#00A5A7] text-[#00A5A7] hover:bg-[#00A5A7] hover:text-white">
          <Eye className="w-4 h-4 mr-1" />View Details
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-[#34495E]">Report Details</DialogTitle>
          <DialogDescription>
            {isListingReport ? '📋 Listing Report' : '👤 User Report'}
            {report.id && ` · ID #${report.id}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Status */}
          <div className="flex items-center gap-2">
            <Badge className={`${color} border text-xs`}>{label}</Badge>
            <span className="text-xs text-[#717182]">
              {new Date(report.createdAt).toLocaleDateString('en-GB', {
                day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
              })}
            </span>
          </div>

          {/* Reason */}
          <div className="space-y-1">
            <Label className="text-[#34495E] text-xs font-semibold">Reason</Label>
            <p className="text-sm text-[#34495E] p-3 bg-gray-50 rounded-lg border">{report.reason}</p>
          </div>

          {/* Reporter */}
          <div className="space-y-1">
            <Label className="text-[#34495E] text-xs font-semibold">Reporter</Label>
            <div className="flex items-center gap-2 p-3 bg-[#00A5A7]/5 border border-[#00A5A7]/20 rounded-lg">
              <User className="w-4 h-4 text-[#00A5A7] flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-[#717182] font-mono break-all">{report.reporterId}</p>
                <UserInfoDialog accountId={report.reporterId} label="View reporter profile →" />
              </div>
            </div>
          </div>

          {/* Reported */}
          <div className="space-y-1">
            <Label className="text-[#34495E] text-xs font-semibold">
              {isListingReport ? 'Reported Listing' : 'Reported User'}
            </Label>
            <div className="flex items-center gap-2 p-3 bg-[#FF6F61]/5 border border-[#FF6F61]/20 rounded-lg">
              <Flag className="w-4 h-4 text-[#FF6F61] flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-[#717182] font-mono break-all">
                  {isListingReport ? `Listing ID: ${report.reportedId}` : report.reportedId}
                </p>
                <ReportedEntityDialog report={report} compact={false} />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ─── Ban Dialog ───────────────────────────────────────────────────────────────

interface BanDialogProps {
  userId: string;
  userName: string;
  onBanned: () => void;
}

const BanDialog = ({ userId, userName, onBanned }: BanDialogProps) => {
  const [open, setOpen]         = useState(false);
  const [banType, setBanType]   = useState<'1' | '2'>('1');
  const [endDate, setEndDate]   = useState('');
  const [reason, setReason]     = useState('');
  const [loading, setLoading]   = useState(false);

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split('T')[0];

  const handleBan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (banType === '1' && !endDate) { toast.error('Please select an end date.'); return; }
    setLoading(true);
    try {
      const payload: any = { userId, type: Number(banType), reason };
      if (banType === '1') payload.endDate = endDate;
      await api.post('/Ban/BanUser', payload);
      toast.success(banType === '2' ? `${userName} permanently banned.` : `${userName} banned until ${endDate}.`);
      setOpen(false); setEndDate(''); setReason(''); setBanType('1');
      onBanned();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to ban user.');
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-orange-400 text-orange-500 hover:bg-orange-50">
          <Ban className="w-4 h-4 mr-1" />Ban
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#34495E]">Ban {userName}</DialogTitle>
          <DialogDescription>Choose the type of ban.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleBan} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setBanType('1')}
              className={`p-3 rounded-lg border-2 text-left transition-colors ${
                banType === '1' ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-orange-200'}`}>
              <p className="font-medium text-sm text-[#34495E]">⏱ Temporary</p>
              <p className="text-xs text-[#717182] mt-1">Ban until a specific date</p>
            </button>
            <button type="button" onClick={() => setBanType('2')}
              className={`p-3 rounded-lg border-2 text-left transition-colors ${
                banType === '2' ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-red-200'}`}>
              <p className="font-medium text-sm text-[#34495E]">🚫 Permanent</p>
              <p className="text-xs text-[#717182] mt-1">Block forever</p>
            </button>
          </div>

          {banType === '1' && (
            <div className="space-y-2">
              <Label>Ban Until</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} min={minDateStr} required />
            </div>
          )}
          {banType === '2' && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              ⚠ This will permanently block this email from registering again.
            </div>
          )}

          <div className="space-y-2">
            <Label>Reason</Label>
            <Input placeholder="Reason for ban..." value={reason} onChange={(e) => setReason(e.target.value)} required />
          </div>

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading || !reason || (banType === '1' && !endDate)}
              className={banType === '2' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-orange-500 hover:bg-orange-600 text-white'}>
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
  name: string; email: string; extra?: React.ReactNode;
  accountId?: string; numericId: number;
  onRemove: () => void; onUnban?: () => void;
  isBanned?: boolean; onBanned?: () => void;
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

// ─── Stat Card ────────────────────────────────────────────────────────────────

const StatCard = ({ label, value, icon, onClick }: {
  label: string; value: number | string; icon: React.ReactNode; onClick?: () => void;
}) => (
  <Card onClick={onClick}
    className={`transition-all ${onClick ? 'cursor-pointer hover:border-[#00A5A7] hover:shadow-md' : ''}`}>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-[#717182] text-xs">{label}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-[#34495E] text-2xl font-bold">{value}</div>
      {onClick && <p className="text-[#00A5A7] text-xs mt-1">Click to view →</p>}
    </CardContent>
  </Card>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export const Admin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'landlords' | 'students' | 'reports' | 'bookings'>('overview');

  const [stats, setStats]         = useState<DashboardStats | null>(null);
  const [landlords, setLandlords] = useState<Landlord[]>([]);
  const [students, setStudents]   = useState<Student[]>([]);
  const [loading, setLoading]     = useState(true);
  const [bannedIds, setBannedIds] = useState<Set<string>>(new Set());

  // Banned users dialog
  const [bansDialogOpen, setBansDialogOpen]         = useState(false);
  const [bannedUsersList, setBannedUsersList]       = useState<BannedEntry[]>([]);
  const [bannedUsersLoading, setBannedUsersLoading] = useState(false);
  const [unbanningId, setUnbanningId]               = useState<string | null>(null);

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

  const [bookings, setBookings]               = useState<BookingDto[]>([]);
  const [bookingCount, setBookingCount]       = useState(0);
  const [bookingStatusFilter, setBookingStatusFilter] = useState<string>('all');
  const [bookingsLoading, setBookingsLoading] = useState(false);

  if (!user || user.type !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[#717182]">Access denied. Admins only.</p>
      </div>
    );
  }

  const fetchBannedIds = async (): Promise<Set<string>> => {
    try {
      const data = await api.get<PaginatedBans>('/Ban/GetAllBans?IsActive=true&PageIndex=1&PageSize=500');
      return new Set((data?.data || []).filter(r => r.isActive).map(r => r.userId));
    } catch { return new Set(); }
  };

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [statsRes, landlordsRes, studentsRes, bansSet] = await Promise.all([
          api.get<DashboardStats>('/admin/dashboard').catch(() => null),
          api.get<Landlord[]>('/LandLord').catch(() => [] as Landlord[]),
          api.get<Student[]>('/Student').catch(() => [] as Student[]),
          fetchBannedIds(),
        ]);
        if (statsRes) setStats(statsRes);
        setBannedIds(bansSet);
        setLandlords((landlordsRes || []).map(l => ({ ...l, isBanned: bansSet.has(l.accountId) })));
        setStudents((studentsRes || []).map(s => ({ ...s, isBanned: bansSet.has(s.accountId) })));
      } catch { /* silently fail */ }
      finally { setLoading(false); }
    };
    fetchAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (activeTab !== 'reports') return;
    fetchReports();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, reportStatus]);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (activeTab !== 'bookings') return;
    fetchBookings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, bookingStatusFilter]);

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

  const fetchBookings = async () => {
    setBookingsLoading(true);
    try {
      const params = new URLSearchParams();
      if (bookingStatusFilter !== 'all') params.append('Status', bookingStatusFilter);
      params.append('PageIndex', '1');
      params.append('PageSize', '100');

      // Step 1: get the list (has id, dates, names — but no status field)
      const data = await api.get<any>(`/Booking/GetAllBookings?${params}`);
      const rawList: any[] = Array.isArray(data) ? data : (data?.data || []);
      const totalCount = data?.count ?? rawList.length;

      // Step 2: fetch full details for each booking to get status
      const detailed: BookingDto[] = await Promise.all(
        rawList.map(async (b: any) => {
          try {
            const full = await api.get<any>(`/Booking/GetBooking/${b.id}`);
            return {
              id:               full.id,
              startDate:        full.startDate,
              endDate:          full.endDate,
              status:           full.status,
              studentId:        full.studentId,
              studentName:      full.studentName  ?? b.studentName,
              landlordId:       full.landLordId,
              landlordName:     full.landlordName ?? b.landlordName,
              listingId:        full.listingId,
              listingTitle:     b.listingTitle,
              bedId:            full.bedId,
              amount:           full.amount,
              durationInMonths: b.durationInMonths,
            } as BookingDto;
          } catch {
            // If individual fetch fails, return the list item as-is
            return b as BookingDto;
          }
        })
      );

      setBookings(detailed);
      setBookingCount(totalCount);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to load bookings.');
    } finally { setBookingsLoading(false); }
  };

  // ─── Banned users dialog ────────────────────────────────────────────────────

  const fetchBannedUsersList = async () => {
    setBannedUsersLoading(true);
    try {
      const data = await api.get<PaginatedBans>('/Ban/GetAllBans?IsActive=true&PageIndex=1&PageSize=500');
      const activeBans = (data?.data || []).filter(r => r.isActive);
      const entries: BannedEntry[] = await Promise.all(activeBans.map(async (b): Promise<BannedEntry> => {
        const found = await lookupUserByAccountId(b.userId);
        if (found) {
          return { accountId: b.userId, name: found.name || '—', email: found.email, kind: found.kind, id: found.id };
        }
        return { accountId: b.userId, name: 'Unknown account', email: b.userId };
      }));
      setBannedUsersList(entries);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to load banned users.');
    } finally {
      setBannedUsersLoading(false);
    }
  };

  const handleBansDialogOpenChange = (next: boolean) => {
    setBansDialogOpen(next);
    if (next) fetchBannedUsersList();
  };

  const handleUnbanFromDialog = async (entry: BannedEntry) => {
    setUnbanningId(entry.accountId);
    try {
      await handleUnban(entry.accountId, entry.name, entry.kind, entry.id);
    } finally {
      setUnbanningId(null);
    }
  };

  const handleLandlordSearch = async () => {
    if (!landlordEmailInput.trim()) return;
    setLandlordSearching(true); setFoundLandlord(null); setLandlordNotFound(false);
    try {
      const data = await api.get<Landlord>(`/LandLord/Email?email=${encodeURIComponent(landlordEmailInput.trim())}`);
      if (data?.id) setFoundLandlord({ ...data, isBanned: bannedIds.has(data.accountId) });
      else setLandlordNotFound(true);
    } catch { setLandlordNotFound(true); }
    finally { setLandlordSearching(false); }
  };

  const handleStudentSearch = async () => {
    if (!studentEmailInput.trim()) return;
    setStudentSearching(true); setFoundStudent(null); setStudentNotFound(false);
    try {
      const data = await api.get<Student>(`/Student/Email?email=${encodeURIComponent(studentEmailInput.trim())}`);
      if (data?.id) setFoundStudent({ ...data, isBanned: bannedIds.has(data.accountId) });
      else setStudentNotFound(true);
    } catch { setStudentNotFound(true); }
    finally { setStudentSearching(false); }
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

  const handleUnban = async (
    accountId: string,
    name: string,
    type?: 'landlord' | 'student',
    id?: number,
  ) => {
    try {
      await unbanUser(accountId);
      toast.success(`${name} has been unbanned.`);
      setBannedIds(prev => { const n = new Set(prev); n.delete(accountId); return n; });
      if (type === 'landlord' && id != null) {
        setLandlords(prev => prev.map(l => l.id === id ? { ...l, isBanned: false } : l));
        setFoundLandlord(prev => prev?.id === id ? { ...prev, isBanned: false } : prev);
      } else if (type === 'student' && id != null) {
        setStudents(prev => prev.map(s => s.id === id ? { ...s, isBanned: false } : s));
        setFoundStudent(prev => prev?.id === id ? { ...prev, isBanned: false } : prev);
      }
      setBannedUsersList(prev => prev.filter(u => u.accountId !== accountId));
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Failed to unban.'); }
  };

  const handleBanned = (type: 'landlord' | 'student', id: number, accountId: string) => {
    setBannedIds(prev => new Set([...prev, accountId]));
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
      toast.error('Cannot update: backend must include "id" in GetAllReports response.');
      return;
    }
    setUpdatingReportIdx(index);
    try {
      await api.patch(`/Report/UpdateReport/${report.id}`, { status: newStatus });
      toast.success(newStatus === 2 ? 'Report resolved.' : 'Report rejected.');
      await fetchReports();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update report.');
    } finally { setUpdatingReportIdx(null); }
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
    { id: 'overview',  label: 'Overview',                                                  icon: TrendingUp },
    { id: 'landlords', label: `Landlords (${landlords.length})`,                           icon: Home },
    { id: 'students',  label: `Students (${students.length})`,                             icon: Users },
    { id: 'bookings',  label: `Bookings${bookingCount > 0 ? ` (${bookingCount})` : ''}`,  icon: BookOpen },
    { id: 'reports',   label: `Reports${reportCount > 0 ? ` (${reportCount})` : ''}`,     icon: Flag },
  ] as const;

  return (
    <div className="min-h-screen bg-[#B19CD9]/5">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-[#34495E] mb-2">Admin Dashboard</h1>
        <p className="text-[#717182] mb-8">Manage users, listings, bookings, and reports</p>

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
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1,2,3,4,5,6,7,8,9].map(i => <div key={i} className="h-28 bg-gray-100 rounded-lg animate-pulse" />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <StatCard label="Total Students"   value={stats?.totalStudents   ?? students.length}  icon={<Users      className="w-5 h-5 text-[#00A5A7]" />}   onClick={() => setActiveTab('students')} />
                <StatCard label="Total Landlords"  value={stats?.totalLandlords  ?? landlords.length} icon={<Home       className="w-5 h-5 text-[#B8E986]" />}   onClick={() => setActiveTab('landlords')} />
                <StatCard label="Total Listings"   value={stats?.totalListings   ?? '—'}              icon={<TrendingUp className="w-5 h-5 text-[#FFC759]" />}   onClick={() => navigate('/houses')} />
                <StatCard label="Total Bookings"   value={stats?.totalBookings   ?? '—'}              icon={<BookOpen   className="w-5 h-5 text-[#B19CD9]" />}   onClick={() => setActiveTab('bookings')} />
                <StatCard label="Available Beds"   value={stats?.availableBeds   ?? '—'}              icon={<Bed        className="w-5 h-5 text-[#B8E986]" />} />
                <StatCard label="Occupied Beds"    value={stats?.occupiedBeds    ?? '—'}              icon={<Bed        className="w-5 h-5 text-[#FF6F61]" />} />
                <StatCard label="Pending Listings" value={stats?.pendingListings ?? '—'}              icon={<Flag       className="w-5 h-5 text-orange-400" />} />
                <StatCard label="Total Reports"    value={stats?.totalReports    ?? reportCount}       icon={<Flag       className="w-5 h-5 text-[#FF6F61]" />}   onClick={() => setActiveTab('reports')} />
                <StatCard label="Total Bans"       value={stats?.totalBans       ?? bannedIds.size}    icon={<ShieldAlert className="w-5 h-5 text-red-500" />}  onClick={() => handleBansDialogOpenChange(true)} />
              </div>
            )}

            {/* Banned Users Dialog */}
            <Dialog open={bansDialogOpen} onOpenChange={handleBansDialogOpenChange}>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle className="text-[#34495E] flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-red-500" />Banned Users
                  </DialogTitle>
                  <DialogDescription>All users currently banned from the platform</DialogDescription>
                </DialogHeader>

                {bannedUsersLoading ? (
                  <div className="space-y-3 py-2">
                    {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />)}
                  </div>
                ) : bannedUsersList.length === 0 ? (
                  <p className="text-sm text-[#717182] text-center py-6">No banned users.</p>
                ) : (
                  <div className="space-y-3 py-2 max-h-[60vh] overflow-y-auto">
                    {bannedUsersList.map(entry => (
                      <div key={entry.accountId} className="flex items-center justify-between gap-3 p-3 border rounded-lg">
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-[#34495E] truncate">{entry.name}</p>
                            {entry.kind && (
                              <Badge className={`border text-xs ${
                                entry.kind === 'student'
                                  ? 'bg-[#00A5A7]/10 text-[#00A5A7] border-[#00A5A7]/30'
                                  : 'bg-[#B8E986]/20 text-[#34495E] border-[#B8E986]/40'
                              }`}>
                                {entry.kind === 'student' ? 'Student' : 'Landlord'}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-[#717182] truncate font-mono">{entry.email}</p>
                        </div>
                        <Button variant="outline" size="sm" disabled={unbanningId === entry.accountId}
                          onClick={() => handleUnbanFromDialog(entry)}
                          className="border-green-500 text-green-600 hover:bg-green-50 flex-shrink-0">
                          <ShieldOff className="w-4 h-4 mr-1" />{unbanningId === entry.accountId ? 'Unbanning...' : 'Unban'}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </DialogContent>
            </Dialog>

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
                          <p className="text-[#717182] text-xs mt-1">{formatDate(listing.publishedAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {stats?.recentBookings && stats.recentBookings.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-[#34495E]">Recent Bookings</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats.recentBookings.map(booking => (
                      <div key={booking.id}
                        className="flex justify-between items-center p-3 border rounded-lg hover:border-[#00A5A7] transition-colors cursor-pointer"
                        onClick={() => setActiveTab('bookings')}>
                        <div>
                          <p className="text-[#34495E] text-sm font-medium">Booking #{booking.id}</p>
                          <p className="text-[#717182] text-xs">Listing #{booking.listingId} · Bed #{booking.bedId}</p>
                        </div>
                        <div className="text-right text-xs text-[#717182]">
                          <p>{formatDate(booking.startDate)}</p>
                          <p>→ {formatDate(booking.endDate)}</p>
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
              <CardHeader><CardTitle className="text-[#34495E]">Search Landlord by Email</CardTitle></CardHeader>
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
                      onBanned={() => handleBanned('landlord', foundLandlord.id, foundLandlord.accountId)}
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
                        onBanned={() => handleBanned('landlord', l.id, l.accountId)}
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
              <CardHeader><CardTitle className="text-[#34495E]">Search Student by Email</CardTitle></CardHeader>
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
                      onBanned={() => handleBanned('student', foundStudent.id, foundStudent.accountId)}
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
                        onBanned={() => handleBanned('student', s.id, s.accountId)}
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

        {/* ════════ BOOKINGS ════════ */}
        {activeTab === 'bookings' && (
          <Card>
            <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="text-[#34495E] flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#00A5A7]" />All Bookings
                </CardTitle>
                <CardDescription>Every booking made on the platform</CardDescription>
              </div>
              <Select value={bookingStatusFilter} onValueChange={setBookingStatusFilter}>
                <SelectTrigger className="w-44"><SelectValue placeholder="Filter" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Bookings</SelectItem>
                  <SelectItem value="1">Pending</SelectItem>
                  <SelectItem value="2">Cancelled</SelectItem>
                  <SelectItem value="3">Completed</SelectItem>
                  <SelectItem value="4">Ended</SelectItem>
                  <SelectItem value="5">Pending Transfer</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              {bookingsLoading ? (
                <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />)}</div>
              ) : bookings.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="w-12 h-12 text-[#717182] mx-auto mb-3" />
                  <p className="text-[#717182]">No bookings found.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {bookings.map(booking => {
                    const { label, color } = bookingStatusInfo(booking.status);
                    return (
                      <div key={booking.id} className="p-4 border rounded-lg space-y-2 hover:border-[#00A5A7]/30 transition-colors">
                        <div className="flex items-start justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <Badge className={`${color} border text-xs flex-shrink-0`}>{label}</Badge>
                            <span className="text-sm text-[#34495E] font-medium truncate">
                              {booking.listingTitle || `Listing #${booking.listingId}`}
                            </span>
                            <span className="text-xs text-[#717182]">· #{booking.id}</span>
                          </div>
                          {booking.amount != null && (
                            <span className="text-sm text-[#FF6F61] font-semibold flex-shrink-0">
                              EGP {booking.amount.toLocaleString()}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-[#717182]">
                          {booking.studentName && <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{booking.studentName}</span>}
                          {booking.landlordName && <span className="flex items-center gap-1"><Home className="w-3.5 h-3.5" />{booking.landlordName}</span>}
                          <span className="flex items-center gap-1"><Bed className="w-3.5 h-3.5" />Bed #{booking.bedId}</span>
                          <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{formatDate(booking.startDate)} → {formatDate(booking.endDate)}</span>
                          {booking.durationInMonths != null && <span>{booking.durationInMonths}mo</span>}
                        </div>
                        <Button variant="outline" size="sm"
                          onClick={() => navigate(`/house/${booking.listingId}`)}
                          className="border-[#00A5A7] text-[#00A5A7] hover:bg-[#00A5A7] hover:text-white">
                          View Listing
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ════════ REPORTS ════════ */}
        {activeTab === 'reports' && (
          <div className="space-y-6">

            {/* Search by listing */}
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
                        <div key={i} className="p-3 border rounded-lg space-y-2">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className={`${color} border text-xs`}>{label}</Badge>
                              <span className="text-xs text-[#717182]">{formatDate(r.createdAt)}</span>
                            </div>
                            <ReportDetailDialog report={r} />
                          </div>
                          <p className="text-sm text-[#34495E]">{r.reason}</p>
                          <div className="flex gap-4 text-xs text-[#717182]">
                            <span>Reporter: <UserInfoDialog accountId={r.reporterId} label={r.reporterId.slice(0,8) + '…'} /></span>
                            <span>Reported: <ReportedEntityDialog report={r} /></span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </CardContent>
            </Card>

            {/* All reports */}
            <Card>
              <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle className="text-[#34495E]">All Reports</CardTitle>
                  <CardDescription>
                    Click an ID to view account details. Click "View Details" for the full report.
                    {reports.length > 0 && !reports[0]?.id && (
                      <span className="text-amber-600 ml-2 text-xs">
                        ⚠ Backend must include "id" in GetAllReports to enable Resolve/Reject.
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
                      const isListingReport = isNumericId(report.reportedId);
                      return (
                        <div key={index} className="p-4 border rounded-lg space-y-3">
                          <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div className="space-y-1 flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge className={`${color} border text-xs`}>{label}</Badge>
                                <span className="text-xs text-[#717182]">{formatDate(report.createdAt)}</span>
                                <span className="text-xs text-[#717182]">
                                  {isListingReport ? '📋 Listing' : '👤 User'}
                                </span>
                                {report.id && <span className="text-xs text-[#717182]">ID: #{report.id}</span>}
                              </div>

                              <p className="text-sm text-[#34495E] line-clamp-2">{report.reason}</p>

                              <div className="flex flex-wrap gap-3 text-xs text-[#717182]">
                                <span className="flex items-center gap-1">
                                  Reporter:
                                  <UserInfoDialog accountId={report.reporterId} label={report.reporterId.slice(0,8) + '…'} />
                                </span>
                                <span className="flex items-center gap-1">
                                  Reported:
                                  <ReportedEntityDialog report={report} />
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-col gap-2 flex-shrink-0">
                              <ReportDetailDialog report={report} />

                              {report.status === 1 && (
                                <div className="flex gap-2">
                                  <Button size="sm" disabled={isUpdating}
                                    onClick={() => handleUpdateReport(report, index, 2)}
                                    className="bg-green-600 hover:bg-green-700 text-white">
                                    <CheckCircle className="w-4 h-4 mr-1" />{isUpdating ? '…' : 'Resolve'}
                                  </Button>
                                  <Button size="sm" variant="outline" disabled={isUpdating}
                                    onClick={() => handleUpdateReport(report, index, 3)}
                                    className="border-gray-300 text-gray-500 hover:bg-gray-100">
                                    <XCircle className="w-4 h-4 mr-1" />{isUpdating ? '…' : 'Reject'}
                                  </Button>
                                </div>
                              )}
                              {report.status === 2 && (
                                <span className="flex items-center gap-1 text-green-600 text-sm">
                                  <CheckCircle className="w-4 h-4" />Resolved
                                </span>
                              )}
                              {report.status === 3 && (
                                <span className="flex items-center gap-1 text-gray-400 text-sm">
                                  <XCircle className="w-4 h-4" />Rejected
                                </span>
                              )}
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
        )}
      </div>
    </div>
  );
};
