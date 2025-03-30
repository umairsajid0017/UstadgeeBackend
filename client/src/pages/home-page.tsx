import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Loader2, Search, MapPin, Star, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function HomePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  
  // Fetch available services
  const { data: servicesData, isLoading: isLoadingServices } = useQuery({
    queryKey: ["/api/services"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user,
  });
  
  // Fetch categories
  const { data: categoriesData, isLoading: isLoadingCategories } = useQuery({
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

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1">
        <Header title="Home" />
        
        <main className="p-6">
          {/* Search Section */}
          <section className="mb-8">
            <div className="bg-primary text-white rounded-lg p-6 md:p-8">
              <h2 className="text-2xl md:text-3xl font-bold mb-2">Find Skilled Professionals</h2>
              <p className="mb-6 opacity-90">Search for Ustadgee or Karigar in your area</p>
              
              <div className="flex flex-col md:flex-row gap-3 items-center">
                <div className="relative w-full md:w-2/3">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search for an Ustadgee..."
                    className="pl-10 bg-white text-gray-900 w-full py-6"
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
            </div>
          </section>
          
          {/* Search Results */}
          {searchResults.length > 0 && (
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Search Results</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.map((provider) => (
                  <Card key={provider.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="p-4">
                        <div className="flex items-center mb-4">
                          <div className="h-14 w-14 rounded-full overflow-hidden bg-gray-100 mr-3">
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
                              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded">
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
                          <Button className="w-full" size="sm">View Profile</Button>
                        </div>
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
              <h2 className="text-xl font-semibold mb-4">Service Categories</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {categories.map((category: any) => (
                  <Link key={category.id} href={`/services?category=${category.id}`}>
                    <div className="bg-white rounded-lg border p-4 text-center hover:shadow-md transition-shadow cursor-pointer">
                      <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
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
              <h2 className="text-xl font-semibold mb-4">Popular Services</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.slice(0, 6).map((service: any) => (
                  <Card key={service.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="h-40 bg-gray-100">
                        {service.images && service.images.length > 0 ? (
                          <img 
                            src={`/uploads/services/${service.images[0].imageName}`} 
                            alt={service.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-primary/10">
                            <span className="text-primary font-bold text-3xl">{service.title.charAt(0)}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="p-4">
                        <h3 className="font-semibold text-lg mb-1 truncate">{service.title}</h3>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{service.description}</p>
                        
                        <div className="flex items-center justify-between">
                          <div className="font-semibold">
                            ₹{service.charges}
                          </div>
                          <Link href={`/services/${service.id}`}>
                            <Button size="sm">View Details</Button>
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
                    <Button variant="outline">View All Services</Button>
                  </Link>
                </div>
              )}
            </section>
          )}
          
          {isLoading && (
            <div className="flex justify-center my-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
