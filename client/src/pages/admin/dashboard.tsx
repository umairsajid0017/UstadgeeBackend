import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Users, Activity, FileText, CreditCard, ChevronUp } from "lucide-react";

export default function AdminDashboard() {
  const { user } = useAuth();
  
  // Dashboard stats
  const stats = [
    {
      title: "Total Users",
      value: "254",
      change: "+12%",
      icon: <Users className="h-5 w-5" />
    },
    {
      title: "Active Services",
      value: "125",
      change: "+5%",
      icon: <Activity className="h-5 w-5" />
    },
    {
      title: "Pending Tasks",
      value: "38",
      change: "-2%",
      icon: <FileText className="h-5 w-5" />
    },
    {
      title: "Total Revenue",
      value: "$15,245",
      change: "+18%",
      icon: <CreditCard className="h-5 w-5" />
    },
  ];
  
  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 text-transparent bg-clip-text glow-text">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.fullName || 'Admin'}
          </p>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Card key={index} className="card-futuristic grid-item-highlight">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
                </div>
                <div className="rounded-full p-2 bg-primary/10 text-primary">
                  {stat.icon}
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <div className={`flex items-center ${stat.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                  <ChevronUp className={`h-3 w-3 ${stat.change.startsWith('-') ? 'rotate-180' : ''}`} />
                  <span>{stat.change}</span>
                </div>
                <span className="text-muted-foreground ml-1">from last month</span>
              </div>
            </Card>
          ))}
        </div>
        
        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Recent Tasks */}
          <Card className="card-futuristic lg:col-span-2">
            <h2 className="section-title">Recent Tasks</h2>
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="bg-black/20 border border-border/10 rounded-md p-4 hover:bg-primary/5 transition-colors">
                  <div className="flex justify-between">
                    <h3 className="font-medium">Plumbing Service Request #{index + 1}</h3>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">Pending</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Customer requested plumbing services for bathroom renovation.
                  </p>
                  <div className="flex justify-between items-center mt-4">
                    <span className="text-xs text-muted-foreground">Assigned to: John Doe</span>
                    <span className="text-xs text-muted-foreground">3 hours ago</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          
          {/* Activity Feed */}
          <Card className="card-futuristic">
            <h2 className="section-title">Activity Feed</h2>
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="flex gap-3">
                  <div className="relative mt-1">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    {index !== 5 && <div className="absolute top-2 bottom-0 left-1/2 w-0.5 bg-primary/20 -translate-x-1/2"></div>}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-medium text-primary">User{index + 101}</span> {' '}
                      {index % 3 === 0 ? 'registered a new account' : 
                       index % 3 === 1 ? 'submitted a new service request' : 
                                         'completed a task'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {index * 10 + 5} minutes ago
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}