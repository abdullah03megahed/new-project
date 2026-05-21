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
import { Edit2, Save, X, Users, Moon, MapPin, GraduationCap, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';

// ─── Types matching API exactly ───────────────────────────────────────────────

interface StudentProfile {
  id: number;
  firstName: string;
  lastName: string;
  birthDate: string;
  age: number;
  homeTown: string;
  gender: number;       // 1 = Male, 2 = Female
  bio: string;
  facultyField: string;
  lookingForRoommate: boolean;
  sleepingHabits: number;
  minBudget: number;
  maxBudget: number;
  nationalCard: string;
  universityCard: string;
  email: string;
  phoneNumber: string;
  accountId: string;
}

interface LandlordProfile {
  id: number;
  firstName: string;
  lastName: string;
  birthDate: string;
  nationalId: string;
  homeTown: string;
  email: string;
  phoneNumber: string;
  accountId: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const Profile = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Raw profile data fetched from the backend
  const [studentData, setStudentData] = useState<StudentProfile | null>(null);
  const [landlordData, setLandlordData] = useState<LandlordProfile | null>(null);

  // Editable copies
  const [studentForm, setStudentForm] = useState<StudentProfile | null>(null);
  const [landlordForm, setLandlordForm] = useState<LandlordProfile | null>(null);

  // ─── Fetch full profile on mount ──────────────────────────────────────────

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      try {
        if (user.type === 'student' && user.id) {
          const data = await api.get<StudentProfile>(`/Student/${user.id}`);
          setStudentData(data);
          setStudentForm(data);
        } else if (user.type === 'landlord' && user.id) {
          const data = await api.get<LandlordProfile>(`/LandLord/${user.id}`);
          setLandlordData(data);
          setLandlordForm(data);
        }
      } catch {
        toast.error('Failed to load profile data.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

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

  // ─── Save ──────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    setSaving(true);
    try {
      if (user.type === 'student' && studentForm && user.id) {
        const payload: StudentProfile = {
          ...studentForm,
          id: Number(user.id),
        };
        const updated = await api.put<StudentProfile>(`/Student/${user.id}`, payload);
        setStudentData(updated);
        setStudentForm(updated);
        updateUser({
          ...user,
          displayName: `${updated.firstName} ${updated.lastName}`,
        });
        toast.success('Profile updated successfully!');

      } else if (user.type === 'landlord' && landlordForm && user.id) {
        const payload: LandlordProfile = {
          ...landlordForm,
          id: Number(user.id),
        };
        const updated = await api.put<LandlordProfile>(`/LandLord/${user.id}`, payload);
        setLandlordData(updated);
        setLandlordForm(updated);
        updateUser({
          ...user,
          displayName: `${updated.firstName} ${updated.lastName}`,
        });
        toast.success('Profile updated successfully!');
      }

      setIsEditing(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setStudentForm(studentData);
    setLandlordForm(landlordData);
    setIsEditing(false);
  };

  // ─── Helpers ───────────────────────────────────────────────────────────────

  const genderLabel = (g: number) => (g === 1 ? 'Male' : g === 2 ? 'Female' : '—');
  const sleepLabel = (s: number) => {
    if (s === 1) return '🌅 Early Bird';
    if (s === 2) return '🌙 Night Owl';
    if (s === 3) return '⚡ Flexible';
    return '—';
  };

  const initials = (first?: string, last?: string) =>
    `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase() || '?';

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#B19CD9]/5 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
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
                <Button onClick={handleCancel} variant="outline" disabled={saving}>
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
                <p className="text-[#34495E] font-semibold text-lg">
                  {user.type === 'student'
                    ? `${studentData?.firstName ?? ''} ${studentData?.lastName ?? ''}`
                    : `${landlordData?.firstName ?? ''} ${landlordData?.lastName ?? ''}`}
                </p>
                <span className="inline-block mt-1 px-3 py-1 bg-[#00A5A7]/10 rounded-full text-[#00A5A7] text-sm capitalize">
                  {user.type}
                </span>
              </div>
            </div>

            {/* ══════════════ STUDENT FORM ══════════════ */}
            {user.type === 'student' && studentForm && (
              <>
                {/* Name */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>First Name</Label>
                    <Input
                      value={studentForm.firstName}
                      onChange={(e) => setStudentForm({ ...studentForm, firstName: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name</Label>
                    <Input
                      value={studentForm.lastName}
                      onChange={(e) => setStudentForm({ ...studentForm, lastName: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                {/* Email (read-only) */}
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={studentForm.email} disabled />
                </div>

                {/* Phone & Gender */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input
                      value={studentForm.phoneNumber}
                      onChange={(e) => setStudentForm({ ...studentForm, phoneNumber: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Gender</Label>
                    {isEditing ? (
                      <Select
                        value={String(studentForm.gender)}
                        onValueChange={(v) => setStudentForm({ ...studentForm, gender: Number(v) })}
                      >
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

                {/* Date of Birth & Hometown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date of Birth</Label>
                    <Input
                      type="date"
                      value={studentForm.birthDate ? studentForm.birthDate.split('T')[0] : ''}
                      onChange={(e) => setStudentForm({ ...studentForm, birthDate: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Home Town</Label>
                    <Input
                      value={studentForm.homeTown}
                      onChange={(e) => setStudentForm({ ...studentForm, homeTown: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                {/* Faculty & Bio */}
                <div className="space-y-2">
                  <Label>Faculty / Field</Label>
                  <Input
                    value={studentForm.facultyField}
                    onChange={(e) => setStudentForm({ ...studentForm, facultyField: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bio</Label>
                  <Input
                    value={studentForm.bio}
                    onChange={(e) => setStudentForm({ ...studentForm, bio: e.target.value })}
                    disabled={!isEditing}
                    placeholder="Tell others a bit about yourself..."
                  />
                </div>

                {/* Budget */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Min Budget (EGP/month)</Label>
                    <Input
                      type="number"
                      value={studentForm.minBudget}
                      onChange={(e) => setStudentForm({ ...studentForm, minBudget: Number(e.target.value) })}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Budget (EGP/month)</Label>
                    <Input
                      type="number"
                      value={studentForm.maxBudget}
                      onChange={(e) => setStudentForm({ ...studentForm, maxBudget: Number(e.target.value) })}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                {/* Sleeping Habits */}
                <div className="space-y-2">
                  <Label>Sleeping Habits</Label>
                  {isEditing ? (
                    <Select
                      value={String(studentForm.sleepingHabits)}
                      onValueChange={(v) => setStudentForm({ ...studentForm, sleepingHabits: Number(v) })}
                    >
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

                {/* National & University Card (read-only) */}
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

                {/* Looking for Roommate */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="lookingForRoommate"
                    checked={studentForm.lookingForRoommate}
                    onCheckedChange={(checked) =>
                      setStudentForm({ ...studentForm, lookingForRoommate: checked === true })
                    }
                    disabled={!isEditing}
                  />
                  <Label htmlFor="lookingForRoommate" className="cursor-pointer">
                    Looking for a roommate
                  </Label>
                </div>
              </>
            )}

            {/* ══════════════ LANDLORD FORM ══════════════ */}
            {user.type === 'landlord' && landlordForm && (
              <>
                {/* Name */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>First Name</Label>
                    <Input
                      value={landlordForm.firstName}
                      onChange={(e) => setLandlordForm({ ...landlordForm, firstName: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name</Label>
                    <Input
                      value={landlordForm.lastName}
                      onChange={(e) => setLandlordForm({ ...landlordForm, lastName: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                {/* Email (read-only) */}
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={landlordForm.email} disabled />
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input
                    value={landlordForm.phoneNumber}
                    onChange={(e) => setLandlordForm({ ...landlordForm, phoneNumber: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>

                {/* Birth Date & Hometown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date of Birth</Label>
                    <Input
                      type="date"
                      value={landlordForm.birthDate ? landlordForm.birthDate.split('T')[0] : ''}
                      onChange={(e) => setLandlordForm({ ...landlordForm, birthDate: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Home Town</Label>
                    <Input
                      value={landlordForm.homeTown}
                      onChange={(e) => setLandlordForm({ ...landlordForm, homeTown: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                {/* National ID (read-only) */}
                <div className="space-y-2">
                  <Label>National ID</Label>
                  <Input value={landlordForm.nationalId} disabled />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* ── Matching Preferences Card — Students Only ── */}
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
                  <p className="text-[#717182] mb-4">
                    Complete your matching preferences to find the perfect roommate
                  </p>
                  <Button
                    onClick={() => navigate('/matching')}
                    className="bg-[#00A5A7] hover:bg-[#00A5A7]/90 text-white"
                  >
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
                  {studentData.age > 0 && (
                    <div className="bg-[#B19CD9]/5 rounded-lg p-4 border border-[#B19CD9]/20">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-9 h-9 bg-[#00A5A7]/10 rounded-full flex items-center justify-center">
                          <Users className="w-4 h-4 text-[#00A5A7]" />
                        </div>
                        <Label className="text-[#34495E]">Age</Label>
                      </div>
                      <p className="text-[#34495E] pl-1">{studentData.age} years old</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
