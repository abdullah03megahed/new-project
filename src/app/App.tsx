import { RouterProvider } from 'react-router';
import { AuthProvider } from './utils/AuthContext';
import { router } from './utils/routes';
import { Toaster } from './components/ui/sonner';
import { useEffect } from 'react';

export default function App() {
  useEffect(() => {
    document.title = 'UniMate - Find Your Perfect Roommate';
  }, []);

  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster />
    </AuthProvider>
  );
}
