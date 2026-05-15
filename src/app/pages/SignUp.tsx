import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAuth } from '../utils/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { toast } from 'sonner';

export const SignUp = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Student fields
  const [studentData, setStudentData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    gender: '',
    nationalId: '',
    dateOfBirth: '',
    address: '',
    faculty: '',
    lookingForRoommate: false,
  });

  // Landlord fields
  const [landlordData, setLandlordData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    nationalId: '',
    address: '',
    phoneNumber: '',
  });

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Backend expects: displayName, email, phoneNumber, password, role
       await signup({
         displayName: `${studentData.firstName} ${studentData.lastName}`,
         email: studentData.email,
       phoneNumber: studentData.phone,
       password: studentData.password,
       role: 'Student',
       gender: studentData.gender,
       nationalId: studentData.nationalId,
       dateOfBirth: studentData.dateOfBirth,
       address: studentData.address,
       faculty: studentData.faculty,
       lookingForRoommate: studentData.lookingForRoommate,
});
      navigate('/matching');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Signup failed. Please try again.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleLandlordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signup({
  displayName: `${landlordData.firstName} ${landlordData.lastName}`,
  email: landlordData.email,
  phoneNumber: landlorData.phoneNumber,
  password: landlordData.password,
  role: 'LandLord',
  nationalId: landlordData.nationalId,
  address: landlordData.address,
});
      navigate('/');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Signup failed. Please try again.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#B19CD9]/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-lg my-8">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-[#00A5A7] rounded-lg flex items-center justify-center">
              <span className="text-white" style={{ fontSize: '32px', fontWeight: '700' }}>U</span>
            </div>
          </div>
          <CardTitle className="text-[#34495E]">Create Your Account</CardTitle>
          <CardDescription>Join Unimate today</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="student" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="student" className="data-[state=active]:bg-[#00A5A7] data-[state=active]:text-white">
                Student
              </TabsTrigger>
              <TabsTrigger value="landlord" className="data-[state=active]:bg-[#00A5A7] data-[state=active]:text-white">
                Landlord
              </TabsTrigger>
            </TabsList>

            {/* Student Form */}
            <TabsContent value="student">
              <form onSubmit={handleStudentSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="student-firstName">First Name</Label>
                    <Input
                      id="student-firstName"
                      value={studentData.firstName}
                      onChange={(e) => setStudentData({ ...studentData, firstName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="student-lastName">Last Name</Label>
                    <Input
                      id="student-lastName"
                      value={studentData.lastName}
                      onChange={(e) => setStudentData({ ...studentData, lastName: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="student-email">Email</Label>
                  <Input
                    id="student-email"
                    type="email"
                    value={studentData.email}
                    onChange={(e) => setStudentData({ ...studentData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
  <Label htmlFor="landlord-phone">Phone Number</Label>
  <Input
    id="landlord-phone"
    value={landlordData.phoneNumber}
    onChange={(e) => setLandlordData({ ...landlordData, phoneNumber: e.target.value })}
    required
  />
</div>

<div className="space-y-2">
  <Label htmlFor="landlord-password">Password</Label>

                <div className="space-y-2">
                  <Label htmlFor="student-password">Password</Label>
                  <Input
                    id="student-password"
                    type="password"
                    placeholder="Min 8 chars, include uppercase & number"
                    value={studentData.password}
                    onChange={(e) => setStudentData({ ...studentData, password: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="student-phone">Phone Number</Label>
                    <Input
                      id="student-phone"
                      value={studentData.phone}
                      onChange={(e) => setStudentData({ ...studentData, phone: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="student-gender">Gender</Label>
                    <Select
                      value={studentData.gender}
                      onValueChange={(value) => setStudentData({ ...studentData, gender: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="student-nationalId">National ID</Label>
                    <Input
                      id="student-nationalId"
                      value={studentData.nationalId}
                      onChange={(e) => setStudentData({ ...studentData, nationalId: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="student-dateOfBirth">Date of Birth</Label>
                    <Input
                      id="student-dateOfBirth"
                      type="date"
                      value={studentData.dateOfBirth}
                      onChange={(e) => setStudentData({ ...studentData, dateOfBirth: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="student-address">Address</Label>
                  <Input
                    id="student-address"
                    value={studentData.address}
                    onChange={(e) => setStudentData({ ...studentData, address: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="student-faculty">Faculty</Label>
                  <Input
                    id="student-faculty"
                    value={studentData.faculty}
                    onChange={(e) => setStudentData({ ...studentData, faculty: e.target.value })}
                    required
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="lookingForRoommate"
                    checked={studentData.lookingForRoommate}
                    onCheckedChange={(checked) =>
                      setStudentData({ ...studentData, lookingForRoommate: checked === true })
                    }
                  />
                  <Label htmlFor="lookingForRoommate" className="cursor-pointer">
                    I'm looking for a roommate
                  </Label>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#FF6F61] hover:bg-[#FF6F61]/90 text-white"
                >
                  {loading ? 'Creating account...' : 'Sign Up as Student'}
                </Button>
              </form>
            </TabsContent>

            {/* Landlord Form */}
            <TabsContent value="landlord">
              <form onSubmit={handleLandlordSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="landlord-firstName">First Name</Label>
                    <Input
                      id="landlord-firstName"
                      value={landlordData.firstName}
                      onChange={(e) => setLandlordData({ ...landlordData, firstName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="landlord-lastName">Last Name</Label>
                    <Input
                      id="landlord-lastName"
                      value={landlordData.lastName}
                      onChange={(e) => setLandlordData({ ...landlordData, lastName: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="landlord-email">Email</Label>
                  <Input
                    id="landlord-email"
                    type="email"
                    value={landlordData.email}
                    onChange={(e) => setLandlordData({ ...landlordData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="landlord-password">Password</Label>
                  <Input
                    id="landlord-password"
                    type="password"
                    placeholder="Min 8 chars, include uppercase & number"
                    value={landlordData.password}
                    onChange={(e) => setLandlordData({ ...landlordData, password: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="landlord-nationalId">National ID</Label>
                  <Input
                    id="landlord-nationalId"
                    value={landlordData.nationalId}
                    onChange={(e) => setLandlordData({ ...landlordData, nationalId: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="landlord-address">Address</Label>
                  <Input
                    id="landlord-address"
                    value={landlordData.address}
                    onChange={(e) => setLandlordData({ ...landlordData, address: e.target.value })}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#FF6F61] hover:bg-[#FF6F61]/90 text-white"
                >
                  {loading ? 'Creating account...' : 'Sign Up as Landlord'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="text-center mt-4">
            <p className="text-[#717182]">
              Already have an account?{' '}
              <Link to="/login" className="text-[#00A5A7] hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
