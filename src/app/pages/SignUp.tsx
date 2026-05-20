import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAuth } from '../utils/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';

export const SignUp = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [studentData, setStudentData] = useState({
    firstName: '', lastName: '', email: '', password: '', phoneNumber: '',
  });

  const [landlordData, setLandlordData] = useState({
    firstName: '', lastName: '', email: '', password: '', phoneNumber: '',
  });

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signup({
        displayName: `${studentData.firstName} ${studentData.lastName}`,
        email: studentData.email,
        phoneNumber: studentData.phoneNumber,
        password: studentData.password,
        role: 'Student',
      });
      // Small delay so AuthContext finishes setting user state before the next
      // page reads it
      await new Promise(res => setTimeout(res, 100));
      navigate('/matching');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Signup failed.');
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
        phoneNumber: landlordData.phoneNumber,
        password: landlordData.password,
        role: 'LandLord',
      });
      // Small delay so AuthContext finishes setting user state before the next
      // page reads it
      await new Promise(res => setTimeout(res, 100));
      navigate('/complete-profile');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Signup failed.');
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

            {/* ── Student Form ── */}
            <TabsContent value="student">
              <form onSubmit={handleStudentSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="s-firstName">First Name</Label>
                    <Input id="s-firstName" value={studentData.firstName}
                      onChange={(e) => setStudentData({ ...studentData, firstName: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="s-lastName">Last Name</Label>
                    <Input id="s-lastName" value={studentData.lastName}
                      onChange={(e) => setStudentData({ ...studentData, lastName: e.target.value })} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="s-email">Email</Label>
                  <Input id="s-email" type="email" value={studentData.email}
                    onChange={(e) => setStudentData({ ...studentData, email: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="s-phone">Phone Number</Label>
                  <Input id="s-phone" value={studentData.phoneNumber}
                    onChange={(e) => setStudentData({ ...studentData, phoneNumber: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="s-password">Password</Label>
                  <Input id="s-password" type="password"
                    placeholder="Min 8 chars, include uppercase & number"
                    value={studentData.password}
                    onChange={(e) => setStudentData({ ...studentData, password: e.target.value })} required />
                </div>
                <Button type="submit" disabled={loading}
                  className="w-full bg-[#FF6F61] hover:bg-[#FF6F61]/90 text-white">
                  {loading ? 'Creating account...' : 'Sign Up as Student'}
                </Button>
              </form>
            </TabsContent>

            {/* ── Landlord Form ── */}
            <TabsContent value="landlord">
              <form onSubmit={handleLandlordSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="l-firstName">First Name</Label>
                    <Input id="l-firstName" value={landlordData.firstName}
                      onChange={(e) => setLandlordData({ ...landlordData, firstName: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="l-lastName">Last Name</Label>
                    <Input id="l-lastName" value={landlordData.lastName}
                      onChange={(e) => setLandlordData({ ...landlordData, lastName: e.target.value })} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="l-email">Email</Label>
                  <Input id="l-email" type="email" value={landlordData.email}
                    onChange={(e) => setLandlordData({ ...landlordData, email: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="l-phone">Phone Number</Label>
                  <Input id="l-phone" value={landlordData.phoneNumber}
                    onChange={(e) => setLandlordData({ ...landlordData, phoneNumber: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="l-password">Password</Label>
                  <Input id="l-password" type="password"
                    placeholder="Min 8 chars, include uppercase & number"
                    value={landlordData.password}
                    onChange={(e) => setLandlordData({ ...landlordData, password: e.target.value })} required />
                </div>
                <Button type="submit" disabled={loading}
                  className="w-full bg-[#FF6F61] hover:bg-[#FF6F61]/90 text-white">
                  {loading ? 'Creating account...' : 'Sign Up as Landlord'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="text-center mt-4">
            <p className="text-[#717182]">
              Already have an account?{' '}
              <Link to="/login" className="text-[#00A5A7] hover:underline">Sign in</Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
