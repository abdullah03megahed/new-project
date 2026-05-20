import { useState } from 'react';
import { useNavigate } from 'react-router';
import { api } from '../utils/api';
import { useAuth } from '../utils/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';

const egyptianGovernorates = [
  'Cairo', 'Giza', 'Alexandria', 'Fayoum', 'Aswan', 'Luxor',
  'Assiut', 'Sohag', 'Minya', 'Beni Suef', 'Qalyubia', 'Sharqia',
  'Gharbia', 'Dakahlia', 'Damietta', 'Port Said', 'Ismailia', 'Suez',
  'Kafr El Sheikh', 'Monufia', 'Beheira', 'Red Sea', 'North Sinai',
  'South Sinai', 'Matruh', 'New Valley',
];

export const CompleteProfile = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    birthDate: '',
    homeTown: '',
    nationalId: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/LandLord/CompleteProfile', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        birthDate: formData.birthDate,
        homeTown: formData.homeTown,
        nationalId: formData.nationalId,
      });

      updateUser({
        firstName: formData.firstName,
        lastName: formData.lastName,
        displayName: `${formData.firstName} ${formData.lastName}`,
        dateOfBirth: formData.birthDate,
        homeTown: formData.homeTown,
        nationalId: formData.nationalId,
      });

      toast.success('Profile completed successfully!');
      navigate('/');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to complete profile.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#B19CD9]/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-lg my-8">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-[#00A5A7] rounded-lg flex items-center justify-center">
              <span className="text-white" style={{ fontSize: '32px', fontWeight: '700' }}>U</span>
            </div>
          </div>
          <CardTitle className="text-[#34495E]">Complete Your Profile</CardTitle>
          <CardDescription>
            A few more details to set up your landlord account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                  className="border-[#00A5A7]/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                  className="border-[#00A5A7]/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nationalId">National ID</Label>
              <Input
                id="nationalId"
                placeholder="Enter your national ID number"
                value={formData.nationalId}
                onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                required
                className="border-[#00A5A7]/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthDate">Date of Birth</Label>
              <Input
                id="birthDate"
                type="date"
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                required
                max={new Date().toISOString().split('T')[0]}
                className="border-[#00A5A7]/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="homeTown">Home Town</Label>
              <Select
                value={formData.homeTown}
                onValueChange={(v) => setFormData({ ...formData, homeTown: v })}
                required
              >
                <SelectTrigger className="border-[#00A5A7]/20">
                  <SelectValue placeholder="Select your governorate" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {egyptianGovernorates.map((gov) => (
                    <SelectItem key={gov} value={gov}>{gov}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FF6F61] hover:bg-[#FF6F61]/90 text-white"
            >
              {loading ? 'Saving...' : 'Complete Profile'}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="text-[#717182] text-sm hover:underline"
              >
                Skip for now
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
