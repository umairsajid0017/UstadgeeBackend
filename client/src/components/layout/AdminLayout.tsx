import { useState, ReactNode } from "react";
import Sidebar from "./sidebar";
import Header from "./header";
import { cn } from "@/lib/utils";

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
}

export default function AdminLayout({ children, title, description }: AdminLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Listen for sidebar collapse state changes
  const handleSidebarCollapse = (collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar onCollapseChange={handleSidebarCollapse} />
      
      <div className={cn(
        "flex-1 transition-all duration-300",
        sidebarCollapsed ? "md:ml-20" : "md:ml-64"
      )}>
        <Header title={title} description={description} />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}