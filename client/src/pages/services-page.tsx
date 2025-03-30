import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import AdminLayout from "@/components/layout/AdminLayout";
import ServiceForm from "@/components/forms/service-form";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Plus, Filter, ChevronDown, Trash } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ServicesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  
  // Fetch services
  const { data: servicesData, isLoading: isLoadingServices } = useQuery<{ success: boolean; data: any[] }>({
    queryKey: ["/api/services", user?.id, selectedCategory],
    queryFn: async ({ queryKey }) => {
      const [base, userId, categoryId] = queryKey;
      let url = base as string;
      const params = new URLSearchParams();
      
      if (userId && user?.userTypeId !== 1) {
        params.append('user_id', userId.toString());
      }
      
      if (categoryId) {
        params.append('category_id', categoryId.toString());
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch services');
      }
      
      return res.json();
    },
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
  
  // Handle opening form for create
  const handleCreateService = () => {
    setFormMode('create');
    setSelectedService(null);
    setIsFormOpen(true);
  };
  
  // Handle opening form for edit
  const handleEditService = (service: any) => {
    setFormMode('edit');
    setSelectedService(service);
    setIsFormOpen(true);
  };
  
  // Handle delete service confirmation
  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    
    try {
      await apiRequest('DELETE', `/api/service/${confirmDelete}`, undefined);
      
      toast({
        title: "Service deleted",
        description: "The service has been deleted successfully",
      });
      
      // Refresh services
      queryClient.invalidateQueries({ queryKey: ['/api/services'] });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete service",
        variant: "destructive",
      });
    } finally {
      setConfirmDelete(null);
    }
  };
  
  // Filter by category
  const handleCategoryFilter = (categoryId: number | null) => {
    setSelectedCategory(categoryId);
  };

  return (
    <AdminLayout title="Services">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          {user?.userTypeId !== 1 ? "My Services" : "Available Services"}
        </h1>
        
        <div className="flex flex-wrap gap-2">
          {/* Category Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2 bg-card/50 backdrop-blur-sm border-primary/20 hover:bg-primary/10 hover:border-primary/30">
                <Filter className="h-4 w-4 text-primary" />
                Filter by Category
                <ChevronDown className="h-4 w-4 text-primary" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-card/90 backdrop-blur-md border-primary/20">
              <DropdownMenuLabel>Categories</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-primary/20" />
              <DropdownMenuItem 
                onClick={() => handleCategoryFilter(null)}
                className="focus:bg-primary/10 focus:text-primary cursor-pointer"
              >
                All Categories
              </DropdownMenuItem>
              {categories.map((category: any) => (
                <DropdownMenuItem 
                  key={category.id}
                  onClick={() => handleCategoryFilter(category.id)}
                  className="focus:bg-primary/10 focus:text-primary cursor-pointer"
                >
                  {category.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Add Service Button (only for service providers) */}
          {user?.userTypeId !== 1 && (
            <Button onClick={handleCreateService} className="bg-primary/90 hover:bg-primary shadow-lg shadow-primary/20">
              <Plus className="h-4 w-4 mr-2" />
              Add Service
            </Button>
          )}
        </div>
      </div>
      
      {/* Service Grid */}
      {isLoading ? (
        <div className="flex justify-center my-12">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : services.length === 0 ? (
        <div className="text-center py-12 bg-card/50 backdrop-blur-sm border border-primary/20 rounded-lg shadow-lg">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 border border-primary/30">
            <Plus className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-medium mb-2">No services found</h3>
          <p className="text-muted-foreground mb-6">
            {user?.userTypeId !== 1 
              ? "Get started by adding your first service"
              : "No services are available at the moment"}
          </p>
          
          {user?.userTypeId !== 1 && (
            <Button onClick={handleCreateService} className="bg-primary/90 hover:bg-primary shadow-lg shadow-primary/20">
              <Plus className="h-4 w-4 mr-2" />
              Add Service
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service: any) => (
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
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="bg-primary/90 hover:bg-primary text-white shadow-md shadow-primary/20">
                        View Details
                      </Button>
                      
                      {/* Edit and Delete options for own services */}
                      {parseInt(service.userId) === user?.id && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditService(service)}
                            className="border-primary/30 hover:bg-primary/10 hover:border-primary/50"
                          >
                            Edit
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-red-500 hover:text-red-400 border-red-500/30 hover:bg-red-500/10 hover:border-red-500/50"
                            onClick={() => setConfirmDelete(service.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Service Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {formMode === 'create' ? 'Add New Service' : 'Edit Service'}
            </DialogTitle>
          </DialogHeader>
          <ServiceForm 
            mode={formMode}
            initialData={selectedService}
            onSuccess={() => {
              setIsFormOpen(false);
              queryClient.invalidateQueries({ queryKey: ['/api/services'] });
            }}
            categories={categories}
          />
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the service.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}