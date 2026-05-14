import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router';
import { api } from '../utils/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

export const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // The reset link from the email should be:
  // https://yourapp.com/reset-password?email=user@example.com&token=xxxxx
  const emailFromUrl = searchParams.get('email') || '';
  const tokenFromUrl = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Guard: if no token in URL, show an error immediately
  const isMissingParams = !emailFromUrl || !tokenFromUrl;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/Authentication/Reset-password', {
        email: emailFromUrl,
        token: tokenFromUrl,
        newPassword,
      });
      // Redirect to login with a success flag
      navigate('/login?reset=success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to reset password. The link may have expired.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#B19CD9]/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-[#00A5A7] rounded-lg flex items-center justify-center">
              <span className="text-white" style={{ fontSize: '32px', fontWeight: '700' }}>U</span>
            </div>
          </div>
          <CardTitle className="text-[#34495E]">Reset Password</CardTitle>
          <CardDescription>Enter your new password below</CardDescription>
        </CardHeader>
        <CardContent>
          {isMissingParams ? (
            // ── Invalid / missing token ────────────────────────────────────
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-[#34495E] font-medium">Invalid reset link</p>
              <p className="text-[#717182] text-sm">
                This link is invalid or has expired. Please request a new one.
              </p>
              <Link to="/forgot-password">
                <Button className="w-full bg-[#FF6F61] hover:bg-[#FF6F61]/90 text-white">
                  Request New Link
                </Button>
              </Link>
            </div>
          ) : (
            // ── Reset form ─────────────────────────────────────────────────
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Min 8 chars, include uppercase & number"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="border-[#00A5A7]/20 focus:border-[#00A5A7]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Repeat your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="border-[#00A5A7]/20 focus:border-[#00A5A7]"
                />
              </div>

              {error && (
                <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-md px-3 py-2">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#FF6F61] hover:bg-[#FF6F61]/90 text-white"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </Button>

              <div className="text-center">
                <Link to="/login" className="text-[#00A5A7] hover:underline text-sm">
                  Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
