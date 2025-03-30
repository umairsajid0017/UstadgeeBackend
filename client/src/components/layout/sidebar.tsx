import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Home,
  Briefcase,
  Settings,
  LogOut,
  Menu,
  X,
  MessageSquare,
  Bell,
  User
} from "lucide-react";

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  className?: string;
}

export default function Sidebar({ className }: SidebarNavProps) {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location]);
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  // Define navigation items with conditions based on user type
  const navItems = [
    {
      name: "Home",
      href: "/",
      icon: Home,
    },
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Services",
      href: "/services",
      icon: Settings,
    },
    {
      name: "Tasks",
      href: "/tasks",
      icon: Briefcase,
    },
    {
      name: "Messages",
      href: "/messages",
      icon: MessageSquare,
    },
    {
      name: "Notifications",
      href: "/notifications",
      icon: Bell,
    },
    {
      name: "Profile",
      href: "/profile",
      icon: User,
    }
  ];
  
  return (
    <>
      {/* Mobile Menu Toggle */}
      <div className="fixed top-4 left-4 z-50 md:hidden">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
        >
          {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>
      
      {/* Sidebar */}
      <nav
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex-col bg-white border-r w-64 p-4 transition-transform duration-300 md:translate-x-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
          className
        )}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="flex items-center h-16 px-3">
            <Link href="/" className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              <span className="ml-2 text-xl font-semibold">UstadGee</span>
            </Link>
          </div>
          
          {/* User Info */}
          {user && (
            <div className="px-3 py-4">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-100 mr-3">
                  {user.profileImage ? (
                    <img 
                      src={`/uploads/profiles/${user.profileImage}`} 
                      alt={user.fullName} 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-primary/10">
                      <span className="text-primary font-bold">{user.fullName.charAt(0)}</span>
                    </div>
                  )}
                </div>
                
                <div>
                  <p className="font-medium">{user.fullName}</p>
                  <p className="text-xs text-muted-foreground">
                    {user.userTypeId === 1 ? "User" : user.userTypeId === 2 ? "Ustadgee" : "Karigar"}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Navigation Links */}
          <div className="mt-4 space-y-1 flex-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-primary/10 hover:text-primary transition-colors",
                    location === item.href
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </div>
              </Link>
            ))}
          </div>
          
          {/* Logout Button */}
          <div className="border-t pt-4 mt-auto">
            <Button 
              variant="ghost" 
              className="w-full justify-start text-muted-foreground hover:text-red-500"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5 mr-2" />
              Log out
            </Button>
          </div>
        </div>
      </nav>
      
      {/* Backdrop for mobile */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
}
