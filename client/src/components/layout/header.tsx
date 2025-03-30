import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, User, Bell } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "wouter";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";

interface HeaderProps {
  title: string;
  description?: string;
}

export default function Header({ title, description }: HeaderProps) {
  const { user, logoutMutation } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Implement search functionality
      console.log("Searching for:", searchQuery);
    }
  };
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center bg-card/50 backdrop-blur-sm border-b border-primary/20 px-4 md:px-6 shadow-sm">
      <div className="flex flex-1 items-center justify-between">
        <div className="md:hidden w-8"></div>
        
        {/* Title and Description */}
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">{title}</h1>
          {description && (
            <p className="text-xs text-muted-foreground mt-1 hidden md:block">{description}</p>
          )}
        </div>
        
        <div className="ml-auto flex items-center gap-2">
          {/* Search (hidden on mobile) */}
          <form 
            onSubmit={handleSearch}
            className="hidden md:flex items-center relative mr-2"
          >
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary/60 h-4 w-4" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 pl-9 bg-card/50 border-primary/20 focus:border-primary/50 transition-colors duration-300"
            />
          </form>
          
          {/* Notification Center */}
          <NotificationCenter />
          
          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="hover:bg-primary/10 transition-colors">
                <div className="h-9 w-9 rounded-full overflow-hidden border border-primary/30">
                  {user?.profileImage ? (
                    <img 
                      src={`/uploads/profiles/${user.profileImage}`} 
                      alt={user.fullName} 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-primary/10">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                  )}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card/90 backdrop-blur-md border-primary/20">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="font-semibold">{user?.fullName}</span>
                  <span className="text-xs text-primary/80">{user?.phoneNumber}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-primary/20" />
              <DropdownMenuItem asChild className="focus:bg-primary/10 focus:text-primary cursor-pointer">
                <Link href="/profile" className="w-full">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="focus:bg-primary/10 focus:text-primary cursor-pointer">
                <Link href="/settings" className="w-full">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-primary/20" />
              <DropdownMenuItem 
                onClick={handleLogout}
                className="text-red-500 hover:text-red-500 focus:text-red-500 focus:bg-red-500/10 cursor-pointer"
              >
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
