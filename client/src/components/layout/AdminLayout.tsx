import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { 
  ChevronLeft, 
  ChevronRight, 
  LayoutDashboard, 
  Users, 
  Settings, 
  LogOut, 
  FileText, 
  MessageSquare, 
  Bell,
  Wrench,
  Star
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

export function AdminLayout({ children }: AdminLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  
  // Auto-collapse on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setCollapsed(true);
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  const navItems: NavItem[] = [
    { label: 'Dashboard', href: '/', icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: 'Services', href: '/services', icon: <Wrench className="h-4 w-4" /> },
    { label: 'Tasks', href: '/tasks', icon: <FileText className="h-4 w-4" /> },
    { label: 'Users', href: '/users', icon: <Users className="h-4 w-4" /> },
    { label: 'Reviews', href: '/reviews', icon: <Star className="h-4 w-4" /> },
    { label: 'Messages', href: '/messages', icon: <MessageSquare className="h-4 w-4" /> },
    { label: 'Notifications', href: '/notifications', icon: <Bell className="h-4 w-4" /> },
    { label: 'Settings', href: '/settings', icon: <Settings className="h-4 w-4" /> },
  ];
  
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside 
        className={cn(
          "bg-zinc-950 border-r border-border/30 flex flex-col h-full transition-all duration-300 ease-in-out shadow-lg", 
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo and Toggle */}
        <div className={cn(
          "flex items-center h-14 border-b border-border/30 px-4",
          collapsed ? "justify-center" : "justify-between"
        )}>
          {!collapsed && (
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 text-transparent bg-clip-text">
              UstadGee
            </h1>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setCollapsed(!collapsed)}
            className="text-muted-foreground hover:text-primary"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto scrollbar-hide">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center py-2 px-3 rounded-md transition-all duration-200 group relative overflow-hidden cursor-pointer",
                  location === item.href 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-primary/5 hover:text-primary",
                  collapsed ? "justify-center" : ""
                )}
              >
                {/* Background hover effect */}
                <div className={cn(
                  "absolute inset-0 bg-primary/10 transform transition-transform duration-300 origin-left",
                  location === item.href ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                )} />
                
                {/* Icon */}
                <div className="relative z-10 flex items-center">
                  <div className={cn(
                    "flex items-center justify-center transition-all",
                    location === item.href ? "text-primary" : "text-muted-foreground group-hover:text-primary",
                    collapsed ? "w-6 h-6" : "w-5 h-5 mr-3"
                  )}>
                    {item.icon}
                  </div>
                  
                  {/* Label */}
                  {!collapsed && (
                    <span className="relative z-10">{item.label}</span>
                  )}
                </div>
                
                {/* Tooltip for collapsed state */}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-black/80 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    {item.label}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </nav>
        
        {/* User profile */}
        <div className={cn(
          "border-t border-border/30 p-4 flex items-center",
          collapsed ? "justify-center" : "justify-between"
        )}>
          {!collapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                {user?.profileImage ? (
                  <img 
                    src={`/uploads/profile_images/${user.profileImage}`} 
                    alt={user?.fullName || 'User'} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-primary text-sm font-medium">
                    {user?.fullName?.charAt(0) || 'U'}
                  </span>
                )}
              </div>
              
              <div className="flex flex-col">
                <span className="text-sm font-medium truncate max-w-[120px]">
                  {user?.fullName || 'User'}
                </span>
                <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                  {user?.phoneNumber || ''}
                </span>
              </div>
            </div>
          )}
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleLogout}
            className="text-muted-foreground hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            {collapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-black/80 text-white text-xs rounded-md whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity pointer-events-none z-50">
                Logout
              </div>
            )}
          </Button>
        </div>
      </aside>
      
      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-zinc-900 p-6 bg-grid">
        <div className="bg-zinc-950/90 border border-border/10 rounded-lg p-6 min-h-[calc(100vh-3rem)] shadow-lg">
          {children}
        </div>
      </main>
    </div>
  );
}