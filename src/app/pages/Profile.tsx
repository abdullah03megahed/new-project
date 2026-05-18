import { useState, useEffect } from 'react';
import { useAuth } from '../utils/AuthContext';
import { api } from '../utils/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { Edit2, Save, X, Upload, MapPin, GraduationCap, DollarSign, Users, Moon } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';

// ─── Types ────────────────────────────────────────────────────────────────────

interface StudentProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  gender: string;
  nationalId: string;
  dateOfBirth: string;
  address: string;
  faculty: string;
  lookingForRoommate: boolean;
  accountId: string;
}

interface LandlordProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  nationalId: string;
  address: string;
  homeTown: string;
  birthDate: string;
  accountId: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const Profile = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(user || {});
  const [saving, setSaving] = useState(false);

  // Keep formData in sync if user changes (e.g. after login fetch)
  useEffect(() => {
    if (user) setFormData(user);
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[#717182]">Please log in to view your profile</p>
      </div>
    );
  }

  // ─── Save ──────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    setSaving(true);
    try {
      if (user.type === 'student' && user.id) {
        const payload: Partial<StudentProfile> = {
          firstName: (formData as any).firstName,
          lastName: (formData as any).lastName,
          phoneNumber: (formData as any).phone || (formData as any).phoneNumber,
          gender: (formData as any).gender,
          dateOfBirth: (formData as any).dateOfBirth,
          address: (formData as any).address,
          faculty: (formData as any).faculty,
          lookingForRoommate: (formData as any).lookingForRoommate ?? false,
        };
        await api.put<StudentProfile>(`/Student/${user.id}`, payload);
        updateUser({
          ...formData,
          displayName: `${payload.firstName} ${payload.lastName}`,
        });
        toast.success('Profile updated successfully!');

      } else if (user.type === 'landlord' && user.id) {
        const payload: Partial<LandlordProfile> = {
          firstName: (formData as any).firstName,
          lastName: (formData as any).lastName,
          phoneNumber: (formData as any).phoneNumber || (formData as any).phone,
          address: (formData as any).address,
          homeTown: (formData as any).homeTown,
          birthDate: (formData as any).birthDate || (formData as any).dateOfBirth,
        };
        await api.put<LandlordProfile>(`/LandLord/${user.id}`, payload);
        updateUser({
          ...formData,
          displayName: `${payload.firstName} ${payload.lastName}`,
        });
        toast.success('Profile updated successfully!');
      }

      setIsEditing(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save profile.';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(user);
    setIsEditing(false);
  };

  const handlePhotoUpload = () => {
    toast.info('Photo upload — coming soon!');
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  const f = formData as any;

  return (
    <div className="min-h-screen bg-[#B19CD9]/5 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-[#34495E]">My Profile</CardTitle>
            {!isEditing ? (
              <Button
                onClick={() => setIsEditing(true)}
                className="bg-[#00A5A7] hover:bg-[#00A5A7]/90 text-white"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-[#B8E986] hover:bg-[#B8E986]/90 text-[#34495E]"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save'}
                </Button>
                <Button onClick={handleCancel} variant="outline" disabled={saving}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Profile Photo */}
            <div className="flex items-center gap-6">
              <Avatar className="w-24 h-24">
                <AvatarImage src={f.photoUrl} />
                <AvatarFallback className="bg-[#00A5A7] text-white" style={{ fontSize: '32px' }}>
                  {(f.firstName?.[0] || '?')}{(f.lastName?.[0] || '')}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <Button
                  onClick={handlePhotoUpload}
                  variant="outline"
                  className="border-[#00A5A7] text-[#00A5A7]"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Photo
                </Button>
              )}
            </div>

            {/* User Type Badge */}
            <div className="inline-block px-4 py-2 bg-[#00A5A7]/10 rounded-full">
              <span className="text-[#00A5A7]">
                {user.type === 'student' ? 'Student' : user.type === 'landlord' ? 'Landlord' : 'Admin'}
              </span>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={f.firstName || ''}
                  onChange={(e) => setFormData({ ...f, firstName: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={f.lastName || ''}
                  onChange={(e) => setFormData({ ...f, lastName: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={f.email || ''} disabled />
            </div>

            {/* ── Student Fields ── */}
            {user.type === 'student' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={f.phone || f.phoneNumber || ''}
                      onChange={(e) => setFormData({ ...f, phone: e.target.value, phoneNumber: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    {isEditing ? (
                      <Select
                        value={f.gender || ''}
                        onValueChange={(value) => setFormData({ ...f, gender: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input id="gender" value={f.gender || ''} disabled />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nationalId">National ID</Label>
                    <Input id="nationalId" value={f.nationalId || ''} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={f.dateOfBirth ? f.dateOfBirth.split('T')[0] : ''}
                      onChange={(e) => setFormData({ ...f, dateOfBirth: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="faculty">Faculty</Label>
                  <Input
                    id="faculty"
                    value={f.faculty || ''}
                    onChange={(e) => setFormData({ ...f, faculty: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={f.address || ''}
                    onChange={(e) => setFormData({ ...f, address: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="lookingForRoommate"
                    checked={f.lookingForRoommate || false}
                    onCheckedChange={(checked) =>
                      setFormData({ ...f, lookingForRoommate: checked === true })
                    }
                    disabled={!isEditing}
                  />
                  <Label htmlFor="lookingForRoommate" className="cursor-pointer">
                    Looking for a roommate
                  </Label>
                </div>
              </>
            )}

            {/* ── Landlord Fields ── */}
            {user.type === 'landlord' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      value={f.phoneNumber || f.phone || ''}
                      onChange={(e) => setFormData({ ...f, phoneNumber: e.target.value, phone: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nationalId">National ID</Label>
                    <Input id="nationalId" value={f.nationalId || ''} disabled />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="birthDate">Date of Birth</Label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={(f.birthDate || f.dateOfBirth || '').split('T')[0]}
                      onChange={(e) => setFormData({ ...f, birthDate: e.target.value, dateOfBirth: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="homeTown">Home Town</Label>
                    <Input
                      id="homeTown"
                      value={f.homeTown || ''}
                      onChange={(e) => setFormData({ ...f, homeTown: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={f.address || ''}
                    onChange={(e) => setFormData({ ...f, address: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* ── Matching Preferences — Students Only ── */}
        {user.type === 'student' && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-[#34495E] flex items-center gap-2">
                <Users className="w-5 h-5 text-[#00A5A7]" />
                Roommate Matching Preferences
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!f.governorate && !f.budgetRange && !f.sleepCode ? (
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {f.governorate && (
                    <div className="bg-[#B19CD9]/5 rounded-lg p-4 border border-[#B19CD9]/20">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-[#00A5A7]/10 rounded-full flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-[#00A5A7]" />
                        </div>
                        <Label className="text-[#34495E]">Hometown</Label>
                      </div>
                      <p className="text-[#34495E] pl-1">
                        {f.governorate}{f.hometown && `, ${f.hometown}`}
                      </p>
                    </div>
                  )}

                  {f.faculty && (
                    <div className="bg-[#B19CD9]/5 rounded-lg p-4 border border-[#B19CD9]/20">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-[#FFC759]/10 rounded-full flex items-center justify-center">
                          <GraduationCap className="w-5 h-5 text-[#FFC759]" />
                        </div>
                        <Label className="text-[#34495E]">Faculty</Label>
                      </div>
                      <p className="text-[#34495E] pl-1">{f.faculty}</p>
                    </div>
                  )}

                  {f.budgetRange && (
                    <div className="bg-[#B19CD9]/5 rounded-lg p-4 border border-[#B19CD9]/20">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-[#B8E986]/10 rounded-full flex items-center justify-center">
                          <DollarSign className="w-5 h-5 text-[#B8E986]" />
                        </div>
                        <Label className="text-[#34495E]">Budget Range</Label>
                      </div>
                      <p className="text-[#34495E] pl-1">{f.budgetRange} EGP/month</p>
                    </div>
                  )}

                  {f.sleepCode && (
                    <div className="bg-[#B19CD9]/5 rounded-lg p-4 border border-[#B19CD9]/20">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-[#B19CD9]/10 rounded-full flex items-center justify-center">
                          <Moon className="w-5 h-5 text-[#B19CD9]" />
                        </div>
                        <Label className="text-[#34495E]">Sleep Code</Label>
                      </div>
                      <p className="text-[#34495E] pl-1">
                        {f.sleepCode === 'Early Bird' && '🌅 Early Bird'}
                        {f.sleepCode === 'Night Owl' && '🌙 Night Owl'}
                        {f.sleepCode === 'Flexible' && '⚡ Flexible'}
                      </p>
                    </div>
                  )}

                  {f.wantsRoommate !== undefined && (
                    <div className="bg-[#B19CD9]/5 rounded-lg p-4 border border-[#B19CD9]/20">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-[#FF6F61]/10 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-[#FF6F61]" />
                        </div>
                        <Label className="text-[#34495E]">Looking for Roommate</Label>
                      </div>
                      <p className="text-[#34495E] pl-1">{f.wantsRoommate ? 'Yes' : 'No'}</p>
                    </div>
                  )}

                  {f.age && (
                    <div className="bg-[#B19CD9]/5 rounded-lg p-4 border border-[#B19CD9]/20">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-[#00A5A7]/10 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-[#00A5A7]" />
                        </div>
                        <Label className="text-[#34495E]">Age</Label>
                      </div>
                      <p className="text-[#34495E] pl-1">{f.age} years old</p>
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
