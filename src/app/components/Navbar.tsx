import { Link, useNavigate } from 'react-router';
import { Home, Building2, User, LogOut, LayoutDashboard, Shield, Menu, UserCircle } from 'lucide-react';
import { useAuth } from '../utils/AuthContext';
import { Button } from './ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './ui/sheet';
import logo from '../../assets/34b124f7c55f8bcf796aec586ebfac7e091313ba.png';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="Unimate Logo" className="h-20 w-auto" />
            <span className="text-[#00A5A7]" style={{ fontSize: '20px', fontWeight: '600' }}>
              UniMate
            </span>
          </Link>

          {/* Desktop Navigation Links - Always Show Home & Houses */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className="flex items-center gap-2 text-[#34495E] hover:text-[#00A5A7] transition-colors"
            >
              <Home className="w-5 h-5" />
              <span>Home</span>
            </Link>
            <Link
              to="/houses"
              className="flex items-center gap-2 text-[#34495E] hover:text-[#00A5A7] transition-colors"
            >
              <Building2 className="w-5 h-5" />
              <span>Houses</span>
            </Link>
            
            {/* Show user-specific links only when logged in */}
            {user && (
              <>
                {user.type === 'landlord' && (
                  <Link
                    to="/dashboard"
                    className="flex items-center gap-2 text-[#34495E] hover:text-[#00A5A7] transition-colors"
                  >
                    <LayoutDashboard className="w-5 h-5" />
                    <span>Dashboard</span>
                  </Link>
                )}
                {user.type === 'admin' && (
                  <Link
                    to="/admin"
                    className="flex items-center gap-2 text-[#34495E] hover:text-[#00A5A7] transition-colors"
                  >
                    <Shield className="w-5 h-5" />
                    <span>Admin</span>
                  </Link>
                )}
                <Link
                  to="/profile"
                  className="flex items-center gap-2 text-[#34495E] hover:text-[#00A5A7] transition-colors"
                >
                  <UserCircle className="w-5 h-5" />
                  <span>Profile</span>
                </Link>
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  className="flex items-center gap-2 text-[#34495E] hover:text-[#FF6F61]"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </Button>
              </>
            )}

            {/* Show Login/Signup when not logged in */}
            {!user && (
              <>
                <Link to="/login">
                  <Button variant="ghost" className="text-[#34495E]">
                    Login
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button className="bg-[#FF6F61] hover:bg-[#FF6F61]/90 text-white">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger Menu - Always Show */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6 text-[#34495E]" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 mt-6">
                <Link
                  to="/"
                  className="flex items-center gap-3 text-[#34495E] hover:text-[#00A5A7] transition-colors py-2"
                >
                  <Home className="w-5 h-5" />
                  <span>Home</span>
                </Link>
                <Link
                  to="/houses"
                  className="flex items-center gap-3 text-[#34495E] hover:text-[#00A5A7] transition-colors py-2"
                >
                  <Building2 className="w-5 h-5" />
                  <span>Houses</span>
                </Link>
                
                {user && (
                  <>
                    {user.type === 'landlord' && (
                      <Link
                        to="/dashboard"
                        className="flex items-center gap-3 text-[#34495E] hover:text-[#00A5A7] transition-colors py-2"
                      >
                        <LayoutDashboard className="w-5 h-5" />
                        <span>Dashboard</span>
                      </Link>
                    )}
                    {user.type === 'admin' && (
                      <Link
                        to="/admin"
                        className="flex items-center gap-3 text-[#34495E] hover:text-[#00A5A7] transition-colors py-2"
                      >
                        <Shield className="w-5 h-5" />
                        <span>Admin</span>
                      </Link>
                    )}
                    <Link
                      to="/profile"
                      className="flex items-center gap-3 text-[#34495E] hover:text-[#00A5A7] transition-colors py-2"
                    >
                      <UserCircle className="w-5 h-5" />
                      <span>Profile</span>
                    </Link>
                    <Button
                      onClick={handleLogout}
                      variant="ghost"
                      className="flex items-center gap-3 text-[#34495E] hover:text-[#FF6F61] justify-start px-0"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>Logout</span>
                    </Button>
                  </>
                )}

                {!user && (
                  <div className="flex flex-col gap-3 mt-4">
                    <Link to="/login">
                      <Button variant="ghost" className="w-full text-[#34495E]">
                        Login
                      </Button>
                    </Link>
                    <Link to="/signup">
                      <Button className="w-full bg-[#FF6F61] hover:bg-[#FF6F61]/90 text-white">
                        Sign Up
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

