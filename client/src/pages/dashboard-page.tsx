import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import DashboardStats from "@/components/layout/dashboard-stats";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Settings, Users, Briefcase, CheckCircle } from "lucide-react";
import { getQueryFn } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function DashboardPage() {
  const { user } = useAuth();
  
  const { data: servicesData, isLoading: isLoadingServices } = useQuery({
    queryKey: ["/api/services"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user,
  });
  
  const { data: tasksData, isLoading: isLoadingTasks } = useQuery({
    queryKey: [user?.userTypeId === 1 ? "/api/getUserRequests" : "/api/getUstadRequests"],
    queryFn: async ({ queryKey }) => {
      const res = await fetch(queryKey[0] as string, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          user_id: user?.id.toString(),
          worker_id: user?.id.toString(),
        }),
        credentials: "include",
      });
      
      if (!res.ok) {
        throw new Error("Failed to fetch tasks");
      }
      
      return res.json();
    },
    enabled: !!user,
  });
  
  const { data: completedTasksData, isLoading: isLoadingCompletedTasks } = useQuery({
    queryKey: ["/api/getUserRequestsCompleted"],
    queryFn: async ({ queryKey }) => {
      const res = await fetch(queryKey[0] as string, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          user_id: user?.id.toString(),
        }),
        credentials: "include",
      });
      
      if (!res.ok) {
        throw new Error("Failed to fetch completed tasks");
      }
      
      return res.json();
    },
    enabled: !!user && user.userTypeId === 1, // Only for regular users
  });

  const isLoading = isLoadingServices || isLoadingTasks || isLoadingCompletedTasks;
  
  const services = servicesData?.data || [];
  const tasks = tasksData?.data || [];
  const completedTasks = completedTasksData?.data || [];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1">
        <Header title="Dashboard" />
        
        <main className="p-6">
          <DashboardStats 
            services={services.length}
            activeTasks={tasks.length}
            completedTasks={completedTasks.length}
          />
          
          {isLoading ? (
            <div className="flex justify-center my-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="mt-8 space-y-6">
              {/* Recent Activity Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Your latest services and tasks</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="tasks">
                    <TabsList className="mb-4">
                      <TabsTrigger value="tasks">Active Tasks</TabsTrigger>
                      <TabsTrigger value="completed">Completed Tasks</TabsTrigger>
                      <TabsTrigger value="services">Services</TabsTrigger>
                    </TabsList>
                    
                    {/* Active Tasks Tab */}
                    <TabsContent value="tasks">
                      {tasks.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          No active tasks found
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {tasks.slice(0, 5).map((task: any) => (
                            <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
                              <div className="flex items-center">
                                <Briefcase className="h-8 w-8 text-primary mr-3" />
                                <div>
                                  <h3 className="font-medium">{task.service?.title || "Unnamed Task"}</h3>
                                  <p className="text-sm text-muted-foreground truncate max-w-md">
                                    {task.description}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center">
                                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium mr-2">
                                  {task.status}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  {new Date(task.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          ))}
                          
                          {tasks.length > 5 && (
                            <div className="text-center mt-4">
                              <Button variant="outline" size="sm">View All Tasks</Button>
                            </div>
                          )}
                        </div>
                      )}
                    </TabsContent>
                    
                    {/* Completed Tasks Tab */}
                    <TabsContent value="completed">
                      {completedTasks.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          No completed tasks found
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {completedTasks.slice(0, 5).map((task: any) => (
                            <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
                              <div className="flex items-center">
                                <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
                                <div>
                                  <h3 className="font-medium">{task.service?.title || "Unnamed Task"}</h3>
                                  <p className="text-sm text-muted-foreground truncate max-w-md">
                                    {task.description}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center">
                                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium mr-2">
                                  {task.status}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  {new Date(task.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          ))}
                          
                          {completedTasks.length > 5 && (
                            <div className="text-center mt-4">
                              <Button variant="outline" size="sm">View All Completed Tasks</Button>
                            </div>
                          )}
                        </div>
                      )}
                    </TabsContent>
                    
                    {/* Services Tab */}
                    <TabsContent value="services">
                      {services.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          No services found
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {services.slice(0, 5).map((service: any) => (
                            <div key={service.id} className="flex items-center justify-between p-4 border rounded-lg">
                              <div className="flex items-center">
                                <Settings className="h-8 w-8 text-primary mr-3" />
                                <div>
                                  <h3 className="font-medium">{service.title}</h3>
                                  <p className="text-sm text-muted-foreground truncate max-w-md">
                                    {service.description}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center">
                                <span className="font-semibold text-lg mr-1">₹</span>
                                <span className="mr-3">{service.charges}</span>
                                <Button variant="outline" size="sm">View</Button>
                              </div>
                            </div>
                          ))}
                          
                          {services.length > 5 && (
                            <div className="text-center mt-4">
                              <Button variant="outline" size="sm">View All Services</Button>
                            </div>
                          )}
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
              
              {/* User Info Section (For service providers) */}
              {user?.userTypeId !== 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Service Provider Info</CardTitle>
                    <CardDescription>Your profile information visible to users</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col md:flex-row items-start gap-6">
                      <div className="flex-shrink-0">
                        <div className="h-32 w-32 rounded-lg overflow-hidden bg-gray-100">
                          {user?.profileImage ? (
                            <img 
                              src={`/uploads/profiles/${user.profileImage}`} 
                              alt={user.fullName} 
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center bg-primary/10">
                              <Users className="h-12 w-12 text-primary" />
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex-1 space-y-4">
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Full Name</h3>
                          <p className="font-medium">{user?.fullName}</p>
                        </div>
                        
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Phone Number</h3>
                          <p className="font-medium">{user?.phoneNumber}</p>
                        </div>
                        
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Account Type</h3>
                          <p className="font-medium">
                            {user?.userTypeId === 2 ? "Ustadgee" : "Karigar"}
                          </p>
                        </div>
                        
                        <div className="pt-2">
                          <Button>Update Profile</Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
