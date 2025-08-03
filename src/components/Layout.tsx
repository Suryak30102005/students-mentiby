import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LogOut, User, Settings, BarChart3, BookmarkCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { user, signOut } = useAuth();
  const [userRole, setUserRole] = useState<string>('student');

  useEffect(() => {
    const fetchUserRole = async () => {
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .single();
        
        if (data) {
          setUserRole(data.role);
        }
      }
    };

    fetchUserRole();
  }, [user]);

  // Check if user is admin
  const isAdmin = userRole === 'admin';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <header className="fixed top-0 left-0 right-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="cursor-pointer">
            <h1 className="text-2xl font-bold text-foreground hover:text-primary transition-colors">Mentiby Coding Tracker</h1>
            <p className="text-sm text-muted-foreground">Track your coding progress</p>
          </Link>
          {user ? (
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Button asChild variant="outline" size="sm">
                <Link to="/revision">
                  <BookmarkCheck className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Revision</span>
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link to="/analytics">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Analytics</span>
                </Link>
              </Button>
              {isAdmin && (
                <Button asChild variant="outline" size="sm">
                  <Link to="/admin">
                    <Settings className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Admin</span>
                  </Link>
                </Button>
              )}
              <div className="flex items-center space-x-2 text-sm hidden sm:flex">
                <User className="h-4 w-4" />
                <span>{user.email}</span>
              </div>
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Button asChild>
                <Link to="/auth">Sign In</Link>
              </Button>
            </div>
          )}
        </div>
      </header>
      <main className="pt-20">
        {children}
      </main>
    </div>
  );
};

export default Layout;