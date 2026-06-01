import { useState, useEffect } from 'react';
import { useAuth } from '../utils/AuthContext';
import { api } from '../utils/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Users, Home, TrendingUp, Flag, CheckCircle, Clock, XCircle, Search } from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardStats {
  totalStudents: number; totalLandlords: number;
  totalListings: number; totalBookings: number;
}

interface Landlord {
  id: number; firstName: string; lastName: string;
  email: string; phoneNumber?: string; status?: number;
}

interface Student {
  id: number; firstName: string; lastName: string;
  email: string; phoneNumber?: string;
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

const statusLabel = (s: number) => {
  if (s === 1) return { label: 'Pending', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: <Clock className="w-3 h-3" /> };
  if (s === 2) return { label: 'Resolved', color: 'bg-green-100 text-green-700 border-green-200', icon: <CheckCircle className="w-3 h-3" /> };
  if (s === 3) return { label: 'Dismissed', color: 'bg-gray-100 text-gray-500 border-gray-200', icon: <XCircle className="w-3 h-3" /> };
  return { label: 'Unknown', color: 'bg-gray-100 text-gray-500', icon: null };
};

// ─── Component ────────────────────────────────────────────────────────────────

export const Admin = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'landlords' | 'students' | 'reports'>('overview');

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [landlords, setLandlords] = useState<Landlord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Reports state
  const [reports, setReports] = useState<Report[]>([]);
  const [reportCount, setReportCount] = useState(0);
  const [reportStatus, setReportStatus] = useState<string>('all');
  const [reportsLoading, setReportsLoading] = useState(false);
  const [updatingReport, setUpdatingReport] = useState<string | null>(null);

  // Reports by listing
  const [listingIdInput, setListingIdInput] = useState('');
  const [listingReports, setListingReports] = useState<Report[]>([]);
  const [listingReportsLoading, setListingReportsLoading] = useState(false);
  const [searchedListingId, setSearchedListingId] = useState<string | null>(null);

  // ── Auth guard ──────────────────────────────────────────────────────────────
  if (!user || user.type !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[#717182]">Access denied. Admins only.</p>
      </div>
    );
  }

  // ── Fetch overview data ─────────────────────────────────────────────────────

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [statsData, landlordsData, studentsData] = await Promise.allSettled([
          api.get<DashboardStats>('/admin/dashboard'),
          api.get<Landlord[]>('/LandLord'),
          api.get<Student[]>('/Student'),
        ]);
        if (statsData.status === 'fulfilled') setStats(statsData.value);
        if (landlordsData.status === 'fulfilled') setLandlords(landlordsData.value || []);
        if (studentsData.status === 'fulfilled') setStudents(studentsData.value || []);
      } catch { /* silently fail */ }
      finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  // ── Fetch all reports when tab/filter changes ───────────────────────────────

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (activeTab !== 'reports') return;
    fetchReports();
  }, [activeTab, reportStatus]);

  const fetchReports = async () => {
    setReportsLoading(true);
    try {
      const params = new URLSearchParams();
      if (reportStatus !== 'all') params.append('Status', reportStatus);
      params.append('SortingOption', '2'); // newest first
      params.append('PageIndex', '1');
      params.append('PageSize', '50');
      const data = await api.get<PaginatedReports>(`/Report/GetAllReports?${params}`);
      setReports(data.data || []);
      setReportCount(data.count || 0);
    } catch { /* silently fail */ }
    finally { setReportsLoading(false); }
  };

  const handleUpdateReport = async (reporterId: string, reportedId: string, newStatus: number) => {
    const key = `${reporterId}-${reportedId}`;
    setUpdatingReport(key);
    try {
      // Use reportedId as the id param (string GUID) — adjust if backend uses integer id
      await api.put(`/Report/UpdateReport/${reportedId}`, { status: newStatus });
      toast.success('Report status updated.');
      await fetchReports();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update report.');
    } finally {
      setUpdatingReport(null);
    }
  };

  const handleSearchByListing = async () => {
    if (!listingIdInput.trim()) return;
    setListingReportsLoading(true);
    setSearchedListingId(listingIdInput.trim());
    try {
      const data = await api.get<PaginatedReports>(
        `/Report/GetReportsBylisting?listingId=${listingIdInput.trim()}&SortingOption=2&PageIndex=1&PageSize=50`
      );
      setListingReports(data.data || []);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to fetch reports for this listing.');
      setListingReports([]);
    } finally {
      setListingReportsLoading(false);
    }
  };

  const handleDeleteLandlord = async (id: number) => {
    try {
      await api.delete(`/LandLord/${id}`);
      setLandlords(landlords.filter(l => l.id !== id));
      toast.success('Landlord removed.');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove landlord.');
    }
  };

  // ── Tabs config ─────────────────────────────────────────────────────────────

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'landlords', label: `Landlords (${landlords.length})`, icon: Home },
    { id: 'students', label: `Students (${students.length})`, icon: Users },
    { id: 'reports', label: `Reports${reportCount > 0 ? ` (${reportCount})` : ''}`, icon: Flag },
  ] as const;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#B19CD9]/5">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-[#34495E] mb-2">Admin Dashboard</h1>
        <p className="text-[#717182] mb-8">Manage users, listings, and reports</p>

        {/* Tabs */}
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

        {/* ── Overview ── */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {loading ? (
              [1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse" />)
            ) : (
              <>
                {[
                  { label: 'Total Students', value: stats?.totalStudents ?? students.length, icon: <Users className="w-5 h-5 text-[#00A5A7]" /> },
                  { label: 'Total Landlords', value: stats?.totalLandlords ?? landlords.length, icon: <Home className="w-5 h-5 text-[#B8E986]" /> },
                  { label: 'Total Listings', value: stats?.totalListings ?? '—', icon: <TrendingUp className="w-5 h-5 text-[#FFC759]" /> },
                  { label: 'Pending Reports', value: reportCount, icon: <Flag className="w-5 h-5 text-[#FF6F61]" /> },
                ].map(({ label, value, icon }) => (
                  <Card key={label}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-[#717182] text-sm">{label}</CardTitle>
                      {icon}
                    </CardHeader>
                    <CardContent>
                      <div className="text-[#34495E] text-3xl font-bold">{value}</div>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
          </div>
        )}

        {/* ── Landlords ── */}
        {activeTab === 'landlords' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-[#34495E]">All Landlords</CardTitle>
              <CardDescription>Manage registered landlords</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />)}</div>
              ) : landlords.length === 0 ? (
                <p className="text-[#717182] text-center py-8">No landlords found.</p>
              ) : (
                <div className="space-y-3">
                  {landlords.map(l => (
                    <div key={l.id} className="flex items-center justify-between p-4 border rounded-lg hover:border-[#00A5A7] transition-colors">
                      <div>
                        <p className="font-medium text-[#34495E]">{l.firstName} {l.lastName}</p>
                        <p className="text-sm text-[#717182]">{l.email}</p>
                        {l.phoneNumber && <p className="text-sm text-[#717182]">{l.phoneNumber}</p>}
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleDeleteLandlord(l.id)}
                        className="border-[#FF6F61] text-[#FF6F61] hover:bg-[#FF6F61] hover:text-white">
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Students ── */}
        {activeTab === 'students' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-[#34495E]">All Students</CardTitle>
              <CardDescription>Registered students on the platform</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />)}</div>
              ) : students.length === 0 ? (
                <p className="text-[#717182] text-center py-8">No students found.</p>
              ) : (
                <div className="space-y-3">
                  {students.map(s => (
                    <div key={s.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium text-[#34495E]">{s.firstName} {s.lastName}</p>
                        <p className="text-sm text-[#717182]">{s.email}</p>
                      </div>
                      <Badge variant="outline" className="text-[#00A5A7] border-[#00A5A7]">Student</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Reports ── */}
        {activeTab === 'reports' && (
          <div className="space-y-6">

            {/* All Reports */}
            <Card>
              <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle className="text-[#34495E]">All Reports</CardTitle>
                  <CardDescription>Review and manage user reports</CardDescription>
                </div>
                <Select value={reportStatus} onValueChange={setReportStatus}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Reports</SelectItem>
                    <SelectItem value="1">Pending</SelectItem>
                    <SelectItem value="2">Resolved</SelectItem>
                    <SelectItem value="3">Dismissed</SelectItem>
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
                      const { label, color } = statusLabel(report.status);
                      const key = `${report.reporterId}-${report.reportedId}-${index}`;
                      const isUpdating = updatingReport === `${report.reporterId}-${report.reportedId}`;
                      return (
                        <div key={key} className="p-4 border rounded-lg space-y-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge className={`${color} border text-xs`}>{label}</Badge>
                                <span className="text-xs text-[#717182]">
                                  {new Date(report.createdAt).toLocaleDateString('en-GB', {
                                    day: '2-digit', month: 'short', year: 'numeric',
                                  })}
                                </span>
                                <span className="text-xs text-[#717182]">
                                  {report.type === 1 ? '📋 Listing Report' : '👤 User Report'}
                                </span>
                              </div>
                              <p className="text-sm text-[#34495E]">{report.reason}</p>
                              <p className="text-xs text-[#717182]">
                                Reporter: <span className="font-mono">{report.reporterId?.slice(0, 8)}…</span>
                                {' · '}
                                Reported: <span className="font-mono">{report.reportedId?.slice(0, 8)}…</span>
                              </p>
                            </div>

                            {report.status === 1 && (
                              <div className="flex gap-2 flex-shrink-0">
                                <Button size="sm" disabled={isUpdating}
                                  onClick={() => handleUpdateReport(report.reporterId, report.reportedId, 2)}
                                  className="bg-green-600 hover:bg-green-700 text-white">
                                  <CheckCircle className="w-4 h-4 mr-1" />Resolve
                                </Button>
                                <Button size="sm" variant="outline" disabled={isUpdating}
                                  onClick={() => handleUpdateReport(report.reporterId, report.reportedId, 3)}
                                  className="border-gray-300 text-gray-500 hover:bg-gray-100">
                                  <XCircle className="w-4 h-4 mr-1" />Dismiss
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
                                <XCircle className="w-4 h-4" />Dismissed
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

            {/* Reports by Listing */}
            <Card>
              <CardHeader>
                <CardTitle className="text-[#34495E]">Reports by Listing</CardTitle>
                <CardDescription>Look up all reports filed against a specific listing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <Input
                    placeholder="Enter Listing ID (e.g. 6)"
                    value={listingIdInput}
                    onChange={(e) => setListingIdInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchByListing()}
                    className="max-w-xs"
                  />
                  <Button onClick={handleSearchByListing} disabled={listingReportsLoading}
                    className="bg-[#00A5A7] hover:bg-[#00A5A7]/90 text-white">
                    <Search className="w-4 h-4 mr-2" />Search
                  </Button>
                </div>

                {listingReportsLoading ? (
                  <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />)}</div>
                ) : searchedListingId && listingReports.length === 0 ? (
                  <p className="text-[#717182] text-sm">No reports found for Listing #{searchedListingId}.</p>
                ) : listingReports.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-sm text-[#717182]">
                      {listingReports.length} report{listingReports.length !== 1 ? 's' : ''} for Listing #{searchedListingId}
                    </p>
                    {listingReports.map((report, index) => {
                      const { label, color } = statusLabel(report.status);
                      return (
                        <div key={index} className="p-3 border rounded-lg space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={`${color} border text-xs`}>{label}</Badge>
                            <span className="text-xs text-[#717182]">
                              {new Date(report.createdAt).toLocaleDateString('en-GB', {
                                day: '2-digit', month: 'short', year: 'numeric',
                              })}
                            </span>
                          </div>
                          <p className="text-sm text-[#34495E]">{report.reason}</p>
                          <p className="text-xs text-[#717182]">
                            Reporter: <span className="font-mono">{report.reporterId?.slice(0, 8)}…</span>
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
