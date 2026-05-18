import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../utils/AuthContext';
import { api } from '../utils/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Home, Users, Moon } from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

interface StudentUpdatePayload {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  gender: string;
  dateOfBirth: string;
  address: string;
  faculty: string;
  lookingForRoommate: boolean;
  governorate?: string;
  hometown?: string;
  budgetRange?: string;
  wantsRoommate?: boolean;
  sleepCode?: string;
}

const egyptianGovernorates = [
  'Cairo', 'Giza', 'Alexandria', 'Fayoum', 'Aswan', 'Luxor', 'Assiut',
  'Sohag', 'Minya', 'Beni Suef', 'Qalyubia', 'Sharqia', 'Gharbia',
  'Dakahlia', 'Damietta', 'Port Said', 'Ismailia', 'Suez', 'Kafr El Sheikh',
  'Monufia', 'Beheira', 'Red Sea', 'North Sinai', 'South Sinai', 'Matruh', 'New Valley',
];

// ─── Component ────────────────────────────────────────────────────────────────

export const Matching = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    gender: (user as any)?.gender || '',
    dateOfBirth: (user as any)?.dateOfBirth || '',
    governorate: (user as any)?.governorate || '',
    hometown: (user as any)?.hometown || '',
    faculty: (user as any)?.faculty || '',
    budgetRange: (user as any)?.budgetRange || '',
    wantsRoommate: 'yes',
    sleepCode: (user as any)?.sleepCode || '',
  });

  if (!user || user.type !== 'student') {
    navigate('/');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const age = formData.dateOfBirth
      ? new Date().getFullYear() - new Date(formData.dateOfBirth).getFullYear()
      : undefined;

    // Build the full student update payload — backend needs all fields
    const payload: StudentUpdatePayload = {
      firstName: (user as any).firstName || '',
      lastName: (user as any).lastName || '',
      phoneNumber: (user as any).phone || (user as any).phoneNumber || '',
      gender: formData.gender,
      dateOfBirth: formData.dateOfBirth,
      address: (user as any).address || '',
      faculty: formData.faculty,
      lookingForRoommate: formData.wantsRoommate === 'yes',
      governorate: formData.governorate,
      hometown: formData.hometown,
      budgetRange: formData.budgetRange,
      wantsRoommate: formData.wantsRoommate === 'yes',
      sleepCode: formData.sleepCode,
    };

    try {
      // Only call if we have a student ID
      if (user.id) {
        await api.put(`/Student/${user.id}`, payload);
      }

      // Always update local context so the profile page reflects the changes
      updateUser({
        gender: formData.gender as 'male' | 'female',
        dateOfBirth: formData.dateOfBirth,
        age,
        governorate: formData.governorate,
        hometown: formData.hometown,
        faculty: formData.faculty,
        budgetRange: formData.budgetRange,
        wantsRoommate: formData.wantsRoommate === 'yes',
        sleepCode: formData.sleepCode as 'Early Bird' | 'Night Owl' | 'Flexible',
        lookingForRoommate: formData.wantsRoommate === 'yes',
      });

      toast.success('Matching preferences saved!');
      navigate('/profile');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save preferences.';
      toast.error(message);
      // Still update locally so the user doesn't lose their input
      updateUser({
        gender: formData.gender as 'male' | 'female',
        dateOfBirth: formData.dateOfBirth,
        age,
        governorate: formData.governorate,
        hometown: formData.hometown,
        faculty: formData.faculty,
        budgetRange: formData.budgetRange,
        wantsRoommate: formData.wantsRoommate === 'yes',
        sleepCode: formData.sleepCode as 'Early Bird' | 'Night Owl' | 'Flexible',
        lookingForRoommate: formData.wantsRoommate === 'yes',
      });
      navigate('/profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#B19CD9]/10 via-white to-[#00A5A7]/5 py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <Card className="shadow-xl border-0 bg-white/95 backdrop-blur">
          <CardHeader className="text-center space-y-4 pb-8">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-gradient-to-br from-[#00A5A7] to-[#00A5A7]/80 rounded-2xl flex items-center justify-center shadow-lg">
                <Users className="w-10 h-10 text-white" />
              </div>
            </div>
            <CardTitle className="text-[#34495E]" style={{ fontSize: '32px' }}>
              Complete Your Profile
            </CardTitle>
            <CardDescription className="text-[#717182]" style={{ fontSize: '16px' }}>
              Help us find your perfect roommate match
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">

              {/* Gender */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-[#34495E]" style={{ fontSize: '16px' }}>
                  <Users className="w-4 h-4 text-[#00A5A7]" />
                  Gender
                </Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => setFormData({ ...formData, gender: value })}
                  required
                >
                  <SelectTrigger className="h-12 border-[#00A5A7]/20 focus:border-[#00A5A7]">
                    <SelectValue placeholder="Select your gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date of Birth */}
              <div className="space-y-3">
                <Label className="text-[#34495E]" style={{ fontSize: '16px' }}>
                  Date of Birth
                </Label>
                <Input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  required
                  className="h-12 border-[#00A5A7]/20 focus:border-[#00A5A7]"
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Governorate */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-[#34495E]" style={{ fontSize: '16px' }}>
                  <Home className="w-4 h-4 text-[#00A5A7]" />
                  Hometown Governorate
                </Label>
                <Select
                  value={formData.governorate}
                  onValueChange={(value) => setFormData({ ...formData, governorate: value })}
                  required
                >
                  <SelectTrigger className="h-12 border-[#00A5A7]/20 focus:border-[#00A5A7]">
                    <SelectValue placeholder="Select your governorate" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {egyptianGovernorates.map((gov) => (
                      <SelectItem key={gov} value={gov}>{gov}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Hometown Address */}
              <div className="space-y-3">
                <Label className="text-[#34495E]" style={{ fontSize: '16px' }}>
                  Hometown Address <span className="text-[#717182] text-sm">(Optional)</span>
                </Label>
                <Input
                  type="text"
                  placeholder="Enter your hometown address"
                  value={formData.hometown}
                  onChange={(e) => setFormData({ ...formData, hometown: e.target.value })}
                  className="h-12 border-[#00A5A7]/20 focus:border-[#00A5A7]"
                />
              </div>

              {/* Faculty */}
              <div className="space-y-3">
                <Label className="text-[#34495E]" style={{ fontSize: '16px' }}>
                  Faculty / Study Field
                </Label>
                <Input
                  type="text"
                  placeholder="e.g., Engineering, Medicine, Business"
                  value={formData.faculty}
                  onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
                  required
                  className="h-12 border-[#00A5A7]/20 focus:border-[#00A5A7]"
                />
              </div>

              {/* Budget Range */}
              <div className="space-y-3">
                <Label className="text-[#34495E]" style={{ fontSize: '16px' }}>
                  Budget Range (EGP per month)
                </Label>
                <Input
                  type="text"
                  placeholder="e.g., 2000-3000"
                  value={formData.budgetRange}
                  onChange={(e) => setFormData({ ...formData, budgetRange: e.target.value })}
                  required
                  className="h-12 border-[#00A5A7]/20 focus:border-[#00A5A7]"
                />
              </div>

              {/* Wants Roommate */}
              <div className="space-y-3">
                <Label className="text-[#34495E]" style={{ fontSize: '16px' }}>
                  Do you want a roommate?
                </Label>
                <RadioGroup
                  value={formData.wantsRoommate}
                  onValueChange={(value) => setFormData({ ...formData, wantsRoommate: value })}
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="yes" className="border-[#00A5A7] text-[#00A5A7]" />
                    <Label htmlFor="yes" className="cursor-pointer text-[#34495E]">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="no" className="border-[#00A5A7] text-[#00A5A7]" />
                    <Label htmlFor="no" className="cursor-pointer text-[#34495E]">No</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Sleep Code */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-[#34495E]" style={{ fontSize: '16px' }}>
                  <Moon className="w-4 h-4 text-[#00A5A7]" />
                  Sleep Code
                </Label>
                <Select
                  value={formData.sleepCode}
                  onValueChange={(value) => setFormData({ ...formData, sleepCode: value })}
                  required
                >
                  <SelectTrigger className="h-12 border-[#00A5A7]/20 focus:border-[#00A5A7]">
                    <SelectValue placeholder="Select your sleep preference" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Early Bird">🌅 Early Bird</SelectItem>
                    <SelectItem value="Night Owl">🌙 Night Owl</SelectItem>
                    <SelectItem value="Flexible">⚡ Flexible</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Submit */}
              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={saving}
                  className="w-full h-12 bg-gradient-to-r from-[#00A5A7] to-[#00A5A7]/90 hover:from-[#00A5A7]/90 hover:to-[#00A5A7]/80 text-white shadow-lg"
                  style={{ fontSize: '16px', fontWeight: '600' }}
                >
                  {saving ? 'Saving...' : 'Complete Profile & Find Matches'}
                </Button>
              </div>

            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
