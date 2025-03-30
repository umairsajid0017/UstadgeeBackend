import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { CheckedState } from "@radix-ui/react-checkbox";
import { Checkbox } from "@/components/ui/checkbox";

type ServiceFormProps = {
  mode: 'create' | 'edit';
  initialData?: any;
  onSuccess: () => void;
  categories: any[];
};

export default function ServiceForm({ 
  mode, 
  initialData, 
  onSuccess,
  categories
}: ServiceFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [charges, setCharges] = useState(initialData?.charges?.toString() || '0');
  const [categoryId, setCategoryId] = useState<string>(initialData?.categoryId?.toString() || '');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedSubCategories, setSelectedSubCategories] = useState<number[]>([]);
  
  // Fetch sub-categories if category is selected
  const { data: subCategoriesData, isLoading: isLoadingSubCategories } = useQuery({
    queryKey: ["/api/subCategories", categoryId],
    queryFn: async ({ queryKey }) => {
      const [base, catId] = queryKey;
      if (!catId) return { data: [] };
      
      const res = await fetch(`${base}?category_id=${catId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch sub-categories');
      }
      
      return res.json();
    },
    enabled: !!categoryId,
  });
  
  const subCategories = subCategoriesData?.data || [];
  
  // Handle file changes
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setSelectedFiles((prev) => [...prev, ...newFiles]);
    }
  };
  
  // Remove selected file
  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };
  
  // Handle sub-category checkbox change
  const handleSubCategoryChange = (checked: CheckedState, subCategoryId: number) => {
    if (checked) {
      setSelectedSubCategories((prev) => [...prev, subCategoryId]);
    } else {
      setSelectedSubCategories((prev) => prev.filter(id => id !== subCategoryId));
    }
  };
  
  // Service creation/update mutation
  const serviceMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const endpoint = mode === 'create' 
        ? '/api/addService' 
        : `/api/service/${initialData.id}`;
      
      const method = mode === 'create' ? 'POST' : 'PUT';
      
      const res = await fetch(endpoint, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Failed to save service');
      }
      
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: `Service ${mode === 'create' ? 'created' : 'updated'} successfully`,
        description: `Your service has been ${mode === 'create' ? 'created' : 'updated'}.`,
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: `Failed to ${mode === 'create' ? 'create' : 'update'} service`,
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!title.trim()) {
      toast({
        title: "Title is required",
        variant: "destructive",
      });
      return;
    }
    
    if (!description.trim()) {
      toast({
        title: "Description is required",
        variant: "destructive",
      });
      return;
    }
    
    if (!categoryId) {
      toast({
        title: "Category is required",
        variant: "destructive",
      });
      return;
    }
    
    // Create form data
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('charges', charges);
    formData.append('category_id', categoryId);
    formData.append('user_id', user?.id.toString() || '');
    
    // Add selected sub-categories
    if (selectedSubCategories.length > 0) {
      selectedSubCategories.forEach(subCatId => {
        formData.append('subCategories[]', subCatId.toString());
      });
    }
    
    // Add selected files
    selectedFiles.forEach(file => {
      formData.append('serviceImages', file);
    });
    
    // Submit form
    serviceMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Service Title</Label>
            <Input
              id="title"
              placeholder="e.g., Plumbing Services"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="category">Category</Label>
            <Select 
              value={categoryId} 
              onValueChange={(value) => setCategoryId(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="charges">Charges (₹)</Label>
            <Input
              id="charges"
              type="number"
              min="0"
              placeholder="e.g., 500"
              value={charges}
              onChange={(e) => setCharges(e.target.value)}
            />
          </div>
          
          {categoryId && !isLoadingSubCategories && subCategories.length > 0 && (
            <div>
              <Label>Subcategories</Label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {subCategories.map((subCat: any) => (
                  <div key={subCat.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`subcat-${subCat.id}`}
                      checked={selectedSubCategories.includes(subCat.id)}
                      onCheckedChange={(checked) => handleSubCategoryChange(checked, subCat.id)}
                    />
                    <label 
                      htmlFor={`subcat-${subCat.id}`}
                      className="text-sm cursor-pointer"
                    >
                      {subCat.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe your service in detail..."
              className="min-h-32"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          
          <div>
            <Label>Service Images</Label>
            <div className="mt-2 border-2 border-dashed rounded-md p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-1">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, JPEG up to 5MB (max 5 files)
              </p>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                multiple
                onChange={handleFileChange}
              />
            </div>
            
            {/* Show selected files */}
            {selectedFiles.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center p-2 bg-gray-50 rounded-md">
                    <div className="h-10 w-10 bg-gray-200 rounded flex items-center justify-center mr-2 overflow-hidden">
                      <img 
                        src={URL.createObjectURL(file)} 
                        alt={`Preview ${index}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <Button 
                      type="button"
                      variant="ghost" 
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(index);
                      }}
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex justify-end gap-3">
        <Button variant="outline" type="button" onClick={onSuccess}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={serviceMutation.isPending}
        >
          {serviceMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {mode === 'create' ? 'Creating...' : 'Updating...'}
            </>
          ) : (
            mode === 'create' ? 'Create Service' : 'Update Service'
          )}
        </Button>
      </div>
    </form>
  );
}
