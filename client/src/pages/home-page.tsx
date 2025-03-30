import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { 
  Loader2, Search, MapPin, Star, Clock, Users, BarChart3, 
  Briefcase, TrendingUp, CreditCard, Calendar, PieChart, BadgeCheck 
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart as RechartsPieChart,
  Pie, Cell
} from "recharts";

export default function HomePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  
  // Fetch available services
  const { data: servicesData, isLoading: isLoadingServices } = useQuery<{ success: boolean; data: any[] }>({
    queryKey: ["/api/services"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user,
  });
  
  // Fetch categories
  const { data: categoriesData, isLoading: isLoadingCategories } = useQuery<{ success: boolean; data: any[] }>({
    queryKey: ["/api/categories"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user,
  });
  
  const isLoading = isLoadingServices || isLoadingCategories;
  
  const services = servicesData?.data || [];
  const categories = categoriesData?.data || [];
  
  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Please enter a search term",
        variant: "destructive",
      });
      return;
    }
    
    setIsSearching(true);
    
    try {
      const response = await fetch('/api/searchUstadgee', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          search_string: searchQuery,
          user_id: user?.id.toString(),
          lat: "33.520626", // Example coordinates, replace with actual user location
          long: "73.088369",
        }),
      });
      
      if (!response.ok) {
        throw new Error('Search failed');
      }
      
      const data = await response.json();
      setSearchResults(data.data || []);
    } catch (error) {
      toast({
        title: "Search failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Demo chart data
  const monthlyBookingsData = [
    { name: 'Jan', bookings: 65 },
    { name: 'Feb', bookings: 59 },
    { name: 'Mar', bookings: 80 },
    { name: 'Apr', bookings: 81 },
    { name: 'May', bookings: 56 },
    { name: 'Jun', bookings: 55 },
    { name: 'Jul', bookings: 40 },
    { name: 'Aug', bookings: 70 },
    { name: 'Sep', bookings: 90 },
    { name: 'Oct', bookings: 65 },
    { name: 'Nov', bookings: 85 },
    { name: 'Dec', bookings: 120 }
  ];

  const userTypeData = [
    { name: 'Regular Users', value: 540, color: '#10b981' },
    { name: 'Ustadgee', value: 320, color: '#3b82f6' },
    { name: 'Karigar', value: 210, color: '#8b5cf6' }
  ];

  const popularCategoriesData = [
    { name: 'Plumbing', tasks: 120 },
    { name: 'Electrical', tasks: 90 },
    { name: 'Carpentry', tasks: 80 },
    { name: 'Painting', tasks: 65 },
    { name: 'Masonry', tasks: 45 }
  ];

  const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];

  const recentBookings = [
    { id: 1, service: 'Plumbing Repair', provider: 'Ahmad Khan', status: 'Completed', date: '2 hours ago' },
    { id: 2, service: 'Electrical Wiring', provider: 'Muhammad Ali', status: 'In Progress', date: '5 hours ago' },
    { id: 3, service: 'House Painting', provider: 'Usman Ahmed', status: 'Pending', date: '1 day ago' },
    { id: 4, service: 'Furniture Assembly', provider: 'Bilal Hassan', status: 'Cancelled', date: '1 day ago' },
    { id: 5, service: 'AC Repair', provider: 'Sohail Malik', status: 'Completed', date: '2 days ago' }
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1">
        <Header title="Dashboard" />
        
        <main className="p-6">
          {/* Stats Cards */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="bg-card/50 backdrop-blur-sm border-primary/20 shadow-lg">
              <CardContent className="p-6 flex items-center space-x-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                  <h3 className="text-2xl font-bold">1,070</h3>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center">
                    <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
                    <span className="text-green-500">+12%</span> from last month
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-card/50 backdrop-blur-sm border-primary/20 shadow-lg">
              <CardContent className="p-6 flex items-center space-x-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Bookings</p>
                  <h3 className="text-2xl font-bold">842</h3>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center">
                    <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
                    <span className="text-green-500">+8%</span> from last month
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-card/50 backdrop-blur-sm border-primary/20 shadow-lg">
              <CardContent className="p-6 flex items-center space-x-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Services</p>
                  <h3 className="text-2xl font-bold">386</h3>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center">
                    <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
                    <span className="text-green-500">+15%</span> from last month
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-card/50 backdrop-blur-sm border-primary/20 shadow-lg">
              <CardContent className="p-6 flex items-center space-x-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <CreditCard className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                  <h3 className="text-2xl font-bold">₹95,400</h3>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center">
                    <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
                    <span className="text-green-500">+22%</span> from last month
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>
          
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Line Chart */}
            <Card className="bg-card/50 backdrop-blur-sm border-primary/20 shadow-lg">
              <CardHeader>
                <CardTitle>Monthly Bookings</CardTitle>
                <CardDescription>Number of bookings per month in the current year</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={monthlyBookingsData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="name" stroke="hsl(210 40% 96.1%)" />
                      <YAxis stroke="hsl(210 40% 96.1%)" />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(224 71% 4%)',
                          borderColor: 'hsl(215 27.9% 16.9%)',
                          color: 'hsl(210 40% 98%)'
                        }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="bookings" 
                        stroke="hsl(150 100% 50%)" 
                        strokeWidth={2}
                        dot={{ r: 4, strokeWidth: 0, fill: "hsl(150 100% 50%)" }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Bar Chart */}
            <Card className="bg-card/50 backdrop-blur-sm border-primary/20 shadow-lg">
              <CardHeader>
                <CardTitle>Popular Service Categories</CardTitle>
                <CardDescription>Most requested service categories by task count</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={popularCategoriesData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="name" stroke="hsl(210 40% 96.1%)" />
                      <YAxis stroke="hsl(210 40% 96.1%)" />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(224 71% 4%)',
                          borderColor: 'hsl(215 27.9% 16.9%)',
                          color: 'hsl(210 40% 98%)'
                        }}
                      />
                      <Legend />
                      <Bar dataKey="tasks" fill="hsl(150 100% 50%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pie Chart and Recent Bookings */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Pie Chart */}
            <Card className="lg:col-span-1 bg-card/50 backdrop-blur-sm border-primary/20 shadow-lg">
              <CardHeader>
                <CardTitle>User Distribution</CardTitle>
                <CardDescription>Distribution of users by type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={userTypeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {userTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(224 71% 4%)',
                          borderColor: 'hsl(215 27.9% 16.9%)',
                          color: 'hsl(210 40% 98%)'
                        }}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Recent Bookings */}
            <Card className="lg:col-span-2 bg-card/50 backdrop-blur-sm border-primary/20 shadow-lg">
              <CardHeader>
                <CardTitle>Recent Bookings</CardTitle>
                <CardDescription>Latest service requests from customers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentBookings.map((booking) => (
                    <div key={booking.id} className="flex items-start p-3 rounded-lg border border-border/50 bg-card/50">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{booking.service}</p>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            booking.status === 'Completed' ? 'bg-green-500/20 text-green-500' :
                            booking.status === 'In Progress' ? 'bg-blue-500/20 text-blue-500' :
                            booking.status === 'Pending' ? 'bg-yellow-500/20 text-yellow-500' :
                            'bg-red-500/20 text-red-500'
                          }`}>
                            {booking.status}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">Provider: {booking.provider}</p>
                        <p className="text-xs text-muted-foreground">{booking.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Search Section */}
          <section className="mb-8">
            <Card className="overflow-hidden bg-primary text-white shadow-xl shadow-primary/20 border-none">
              <CardContent className="p-6 md:p-8">
                <h2 className="text-2xl md:text-3xl font-bold mb-2 bg-gradient-to-r from-white to-green-300 bg-clip-text text-transparent">Find Skilled Professionals</h2>
                <p className="mb-6 opacity-90">Search for Ustadgee or Karigar in your area</p>
                
                <div className="flex flex-col md:flex-row gap-3 items-center">
                  <div className="relative w-full md:w-2/3">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Search for an Ustadgee..."
                      className="pl-10 bg-card/20 backdrop-blur-sm border-white/20 text-white w-full py-6 focus:bg-card/30"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                  </div>
                  <Button
                    className="w-full md:w-auto bg-white text-primary hover:bg-gray-100"
                    onClick={handleSearch}
                    disabled={isSearching}
                  >
                    {isSearching ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      "Search"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
          
          {/* Search Results */}
          {searchResults.length > 0 && (
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Search Results</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.map((provider) => (
                  <Card key={provider.id} className="overflow-hidden bg-card/50 backdrop-blur-sm border-primary/20 shadow-lg hover:shadow-primary/10 transition-all duration-300">
                    <CardContent className="p-5">
                      <div className="flex items-center mb-4">
                        <div className="h-14 w-14 rounded-full overflow-hidden bg-primary/10 mr-3 border border-primary/20">
                          {provider.profileImage ? (
                            <img 
                              src={`/uploads/profiles/${provider.profileImage}`} 
                              alt={provider.fullName} 
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center bg-primary/10">
                              <span className="text-primary font-bold">{provider.fullName?.charAt(0)}</span>
                            </div>
                          )}
                        </div>
                        
                        <div>
                          <h3 className="font-semibold">{provider.fullName}</h3>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <span className="bg-primary/20 text-primary text-xs font-medium px-2 py-0.5 rounded-full">
                              {provider.userTypeId === 2 ? "Ustadgee" : "Karigar"}
                            </span>
                            {provider.distance && (
                              <span className="flex items-center ml-2">
                                <MapPin className="h-3 w-3 mr-1" /> 
                                {provider.distance.toFixed(1)} km
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-500 mr-1" />
                          <span className="text-sm font-medium">4.8</span>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>{provider.servicesCount || 0} services</span>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <Button className="w-full bg-primary/90 hover:bg-primary shadow-lg shadow-primary/20" size="sm">View Profile</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}
          
          {/* Categories Section */}
          {!isLoading && categories.length > 0 && (
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Service Categories</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {categories.map((category: any) => (
                  <Link key={category.id} href={`/services?category=${category.id}`}>
                    <div className="bg-card/50 backdrop-blur-sm border border-primary/20 rounded-lg p-4 text-center hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 cursor-pointer group">
                      <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                        <span className="text-primary font-bold text-lg">{category.name.charAt(0)}</span>
                      </div>
                      <h3 className="font-medium">{category.name}</h3>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
          
          {/* Popular Services Section */}
          {!isLoading && services.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Popular Services</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.slice(0, 6).map((service: any) => (
                  <Card key={service.id} className="overflow-hidden bg-card/50 backdrop-blur-sm border-primary/20 shadow-lg hover:shadow-primary/10 transition-all duration-300">
                    <CardContent className="p-0">
                      <div className="h-40 bg-primary/5 relative group">
                        {service.images && service.images.length > 0 ? (
                          <img 
                            src={`/uploads/services/${service.images[0].imageName}`} 
                            alt={service.title}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-primary/10">
                            <span className="text-primary font-bold text-3xl">{service.title.charAt(0)}</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                      
                      <div className="p-5">
                        <h3 className="font-semibold text-lg mb-1 truncate">{service.title}</h3>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{service.description}</p>
                        
                        <div className="flex items-center justify-between">
                          <div className="font-semibold text-primary">
                            ₹{service.charges}
                          </div>
                          <Link href={`/services/${service.id}`}>
                            <Button size="sm" className="bg-primary/90 hover:bg-primary shadow-md shadow-primary/20">View Details</Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {services.length > 6 && (
                <div className="text-center mt-8">
                  <Link href="/services">
                    <Button variant="outline" className="border-primary/50 text-primary hover:bg-primary/10">View All Services</Button>
                  </Link>
                </div>
              )}
            </section>
          )}
          
          {isLoading && (
            <div className="flex justify-center my-12">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
