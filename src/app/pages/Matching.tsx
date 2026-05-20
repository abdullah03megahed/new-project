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
import { Textarea } from '../components/ui/textarea';
import { Home, Users, Moon } from 'lucide-react';
import { toast } from 'sonner';

const egyptianGovernorates = [
  'Cairo', 'Giza', 'Alexandria', 'Fayoum', 'Aswan', 'Luxor',
  'Assiut', 'Sohag', 'Minya', 'Beni Suef', 'Qalyubia', 'Sharqia',
  'Gharbia', 'Dakahlia', 'Damietta', 'Port Said', 'Ismailia', 'Suez',
  'Kafr El Sheikh', 'Monufia', 'Beheira', 'Red Sea', 'North Sinai',
  'South Sinai', 'Matruh', 'New Valley',
];

// Backend enum values — must match GenderDto and SleepingHabitsDto
const GENDER_MAP: Record<string, number> = { male: 1, female: 2 };
const SLEEP_MAP: Record<string, number> = { 'Early Bird': 1, 'Night Owl': 2, 'Flexible': 3 };

export const Matching = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    birthDate: '',
    gender: '',
    homeTown: '',
    facultyField: user?.faculty || '',
    lookingForRoommate: true,
    sleepingHabits: '',
    minBudget: '',
    maxBudget: '',
    nationalCard: '',
    universityCard: '',
    bio: '',
  });

  if (!user || user.type !== 'student') {
    navigate('/');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // POST /api/Student/CompleteProfile
      await api.post('/Student/CompleteProfile', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        birthDate: new Date(formData.birthDate).toISOString(),
        gender: GENDER_MAP[formData.gender] || 1,
        homeTown: formData.homeTown,
        facultyField: formData.facultyField,
        lookingForRoommate: formData.lookingForRoommate,
        sleepingHabits: SLEEP_MAP[formData.sleepingHabits] || 1,
        minBudget: Number(formData.minBudget) || 0,
        maxBudget: Number(formData.maxBudget) || 0,
        nationalCard: formData.nationalCard,
        universityCard: formData.universityCard,
        bio: formData.bio,
      });

      // Update local user state
      updateUser({
        firstName: formData.firstName,
        lastName: formData.lastName,
        displayName: `${formData.firstName} ${formData.lastName}`,
        dateOfBirth: formData.birthDate,
        gender: formData.gender as 'male' | 'female',
        homeTown: formData.homeTown,
        faculty: formData.facultyField,
        lookingForRoommate: formData.lookingForRoommate,
        sleepCode: formData.sleepingHabits as 'Early Bird' | 'Night Owl' | 'Flexible',
        minBudget: Number(formData.minBudget) || 0,
        maxBudget: Number(formData.maxBudget) || 0,
        bio: formData.bio,
        nationalId: formData.nationalCard,
      });

      toast.success('Profile completed!');
      navigate('/profile');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to complete profile.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#B19CD9]/10 via-white to-[#00A5A7]/5 py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <Card className="shadow-xl border-0 bg-white/95">
          <CardHeader className="text-center space-y-4 pb-8">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-gradient-to-br from-[#00A5A7] to-[#00A5A7]/80 rounded-2xl flex items-center justify-center shadow-lg">
                <Users className="w-10 h-10 text-white" />
              </div>
            </div>
            <CardTitle className="text-[#34495E]" style={{ fontSize: '32px' }}>Complete Your Profile</CardTitle>
            <CardDescription className="text-[#717182]" style={{ fontSize: '16px' }}>
              Help us find your perfect roommate match
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} required className="h-12 border-[#00A5A7]/20" />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} required className="h-12 border-[#00A5A7]/20" />
                </div>
              </div>

              {/* Gender */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-[#34495E]">
                  <Users className="w-4 h-4 text-[#00A5A7]" />Gender
                </Label>
                <Select value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v })} required>
                  <SelectTrigger className="h-12 border-[#00A5A7]/20"><SelectValue placeholder="Select your gender" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date of Birth */}
              <div className="space-y-2">
                <Label>Date of Birth</Label>
                <Input type="date" value={formData.birthDate} onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })} required className="h-12 border-[#00A5A7]/20" max={new Date().toISOString().split('T')[0]} />
              </div>

              {/* Hometown */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-[#34495E]">
                  <Home className="w-4 h-4 text-[#00A5A7]" />Hometown
                </Label>
                <Select value={formData.homeTown} onValueChange={(v) => setFormData({ ...formData, homeTown: v })} required>
                  <SelectTrigger className="h-12 border-[#00A5A7]/20"><SelectValue placeholder="Select your governorate" /></SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {egyptianGovernorates.map((gov) => (
                      <SelectItem key={gov} value={gov}>{gov}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Faculty */}
              <div className="space-y-2">
                <Label>Faculty / Study Field</Label>
                <Input placeholder="e.g., Engineering, Medicine, Business" value={formData.facultyField} onChange={(e) => setFormData({ ...formData, facultyField: e.target.value })} required className="h-12 border-[#00A5A7]/20" />
              </div>

              {/* National Card */}
              <div className="space-y-2">
                <Label>National ID Number</Label>
                <Input placeholder="Enter your national ID" value={formData.nationalCard} onChange={(e) => setFormData({ ...formData, nationalCard: e.target.value })} required className="h-12 border-[#00A5A7]/20" />
              </div>

              {/* University Card */}
              <div className="space-y-2">
                <Label>University Card Number <span className="text-[#717182] text-sm">(Optional)</span></Label>
                <Input placeholder="Enter your university card number" value={formData.universityCard} onChange={(e) => setFormData({ ...formData, universityCard: e.target.value })} className="h-12 border-[#00A5A7]/20" />
              </div>

              {/* Budget */}
              <div className="space-y-2">
                <Label>Budget Range (EGP/month)</Label>
                <div className="grid grid-cols-2 gap-4">
                  <Input type="number" placeholder="Min budget" value={formData.minBudget} onChange={(e) => setFormData({ ...formData, minBudget: e.target.value })} required className="h-12 border-[#00A5A7]/20" />
                  <Input type="number" placeholder="Max budget" value={formData.maxBudget} onChange={(e) => setFormData({ ...formData, maxBudget: e.target.value })} required className="h-12 border-[#00A5A7]/20" />
                </div>
              </div>

              {/* Looking for Roommate */}
              <div className="space-y-2">
                <Label>Do you want a roommate?</Label>
                <RadioGroup value={formData.lookingForRoommate ? 'yes' : 'no'} onValueChange={(v) => setFormData({ ...formData, lookingForRoommate: v === 'yes' })} className="flex gap-6">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="yes" className="border-[#00A5A7] text-[#00A5A7]" />
                    <Label htmlFor="yes" className="cursor-pointer">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="no" className="border-[#00A5A7] text-[#00A5A7]" />
                    <Label htmlFor="no" className="cursor-pointer">No</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Sleep Habits */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-[#34495E]">
                  <Moon className="w-4 h-4 text-[#00A5A7]" />Sleep Habits
                </Label>
                <Select value={formData.sleepingHabits} onValueChange={(v) => setFormData({ ...formData, sleepingHabits: v })} required>
                  <SelectTrigger className="h-12 border-[#00A5A7]/20"><SelectValue placeholder="Select your sleep preference" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Early Bird">🌅 Early Bird</SelectItem>
                    <SelectItem value="Night Owl">🌙 Night Owl</SelectItem>
                    <SelectItem value="Flexible">⚡ Flexible</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label>Bio <span className="text-[#717182] text-sm">(Optional)</span></Label>
                <Textarea placeholder="Tell potential roommates about yourself..." value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} rows={3} className="border-[#00A5A7]/20" />
              </div>

              <div className="pt-4 space-y-3">
                <Button type="submit" disabled={loading} className="w-full h-12 bg-gradient-to-r from-[#00A5A7] to-[#00A5A7]/90 text-white shadow-lg" style={{ fontSize: '16px', fontWeight: '600' }}>
                  {loading ? 'Saving...' : 'Complete Profile & Find Matches'}
                </Button>
                <button type="button" onClick={() => navigate('/')} className="w-full text-center text-[#717182] text-sm hover:underline">
                  Skip for now
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
