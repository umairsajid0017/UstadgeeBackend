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
  User,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  className?: string;
  onCollapseChange?: (collapsed: boolean) => void;
}

export default function Sidebar({ className, onCollapseChange }: SidebarNavProps) {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location]);
  
  // Notify parent about collapse state changes
  useEffect(() => {
    onCollapseChange?.(isCollapsed);
  }, [isCollapsed, onCollapseChange]);
  
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
      name: "Chat",
      href: "/chat",
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
          "fixed inset-y-0 left-0 z-40 flex-col bg-card/50 backdrop-blur-sm border-r border-primary/20 p-4 transition-all duration-300 md:translate-x-0 shadow-lg shadow-black/50",
          isCollapsed ? "w-20" : "w-64",
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          className
        )}
      >
        <div className="h-full flex flex-col relative">
          {/* Toggle Collapse Button (Desktop only) */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute -right-4 top-5 h-8 w-8 rounded-full bg-card border border-primary/20 shadow-md hidden md:flex"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4 text-primary" />
            ) : (
              <ChevronLeft className="h-4 w-4 text-primary" />
            )}
          </Button>
          
          {/* Logo */}
          <div className={cn(
            "flex items-center h-16",
            isCollapsed ? "justify-center px-0" : "px-3"
          )}>
            <Link href="/" className={cn(
              "flex items-center group",
              isCollapsed ? "justify-center" : ""
            )}>
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center border border-primary/30 glow-primary group-hover:scale-110 transition-transform duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
              {!isCollapsed && (
                <span className="ml-2 text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">UstadGee</span>
              )}
            </Link>
          </div>
          
          {/* User Info */}
          {user && (
            <div className={cn(
              "py-4 border-t border-primary/10", 
              isCollapsed ? "px-0 flex justify-center" : "px-3"
            )}>
              <div className={cn(
                "flex items-center",
                isCollapsed ? "flex-col" : ""
              )}>
                <div className={cn(
                  "rounded-full overflow-hidden border border-primary/30",
                  isCollapsed ? "h-10 w-10 mb-2" : "h-10 w-10 mr-3"
                )}>
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
                
                {!isCollapsed && (
                  <div>
                    <p className="font-medium text-white">{user.fullName}</p>
                    <p className="text-xs text-primary/80">
                      {user.userTypeId === 1 ? "User" : user.userTypeId === 2 ? "Ustadgee" : "Karigar"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Navigation Links */}
          <div className={cn(
            "mt-4 space-y-1 flex-1",
            isCollapsed ? "px-0" : ""
          )}>
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex items-center rounded-md py-2.5 text-sm font-medium hover:bg-primary/10 transition-all duration-200 relative group overflow-hidden",
                    isCollapsed ? "justify-center px-0" : "px-3 gap-3",
                    location === item.href
                      ? "bg-primary/20 text-primary text-glow" + (isCollapsed ? "" : " border-l-2 border-primary")
                      : "text-muted-foreground"
                  )}
                >
                  {!isCollapsed && (
                    <div className={cn(
                      "absolute bottom-0 left-0 h-[2px] bg-primary transition-all duration-300 opacity-0",
                      location === item.href ? "opacity-100 w-full" : "w-0 group-hover:w-full group-hover:opacity-100"
                    )} />
                  )}
                  
                  <item.icon className={cn(
                    "transition-transform duration-300",
                    isCollapsed ? "h-6 w-6" : "h-5 w-5",
                    location === item.href ? "text-primary" : "text-muted-foreground group-hover:text-primary group-hover:scale-110"
                  )} />
                  
                  {!isCollapsed && (
                    <span
                      className={location === item.href ? "text-primary" : "group-hover:text-primary"}
                    >
                      {item.name}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
          
          {/* Logout Button */}
          <div className={cn(
            "border-t border-primary/10 pt-4 mt-auto",
            isCollapsed ? "px-0" : ""
          )}>
            <Button 
              variant="ghost" 
              className={cn(
                "text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors duration-300",
                isCollapsed ? "w-full justify-center px-0" : "w-full justify-start"
              )}
              onClick={handleLogout}
            >
              <LogOut className={cn(
                "text-red-400",
                isCollapsed ? "h-6 w-6" : "h-5 w-5 mr-2"
              )} />
              {!isCollapsed && "Log out"}
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
