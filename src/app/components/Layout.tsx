import { Outlet } from 'react-router';
import { Navbar } from './Navbar';

export const Layout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="bg-[#34495E] text-white py-8 mt-auto">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[#00A5A7] rounded-lg flex items-center justify-center">
                  <span className="text-white" style={{ fontSize: '20px', fontWeight: '700' }}>U</span>
                </div>
                <span className="text-white" style={{ fontSize: '20px', fontWeight: '700' }}>Unimate</span>
              </div>
              <p className="text-white/80">
                Connecting students with quality housing near their universities.
              </p>
            </div>
            <div>
              <h4 className="text-white mb-4">Quick Links</h4>
              <ul className="space-y-2 text-white/80">
                <li>About Us</li>
                <li>Contact</li>
                <li>Terms of Service</li>
                <li>Privacy Policy</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white mb-4">Contact</h4>
              <ul className="space-y-2 text-white/80">
                <li>Email: info@unimate.com</li>
                <li>Phone: +20 123 456 7890</li>
                <li>Address: Cairo, Egypt</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/20 text-center text-white/80">
            <p>&copy; 2025 Unimate. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

