import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MapPin, 
  User, 
  Phone, 
  Lock, 
  Image as ImageIcon, 
  LogOut, 
  Loader2,
  Save
} from 'lucide-react';

type UserProfileData = {
  id: number;
  fullName: string;
  phoneNumber: string;
  userTypeId: number;
  profileImage?: string;
  longitude?: number;
  latitude?: number;
  address?: string;
  city?: string;
  country?: string;
};

export function UserProfile() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [password, setPassword] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  // Fetch user profile data
  useEffect(() => {
    if (user?.id) {
      const fetchProfileData = async () => {
        try {
          setLoading(true);
          const response = await apiRequest('GET', '/api/profile');
          const data = await response.json();
          
          if (data.success && data.user) {
            setProfileData(data.user);
          }
        } catch (error) {
          console.error('Error fetching profile data:', error);
          toast({
            title: 'Error',
            description: 'Failed to load profile data',
            variant: 'destructive',
          });
        } finally {
          setLoading(false);
        }
      };
      
      fetchProfileData();
    }
  }, [user?.id, toast]);

  // Handle input changes for profile fields
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (profileData) {
      setProfileData({ ...profileData, [name]: value });
    }
  };

  // Handle password input changes
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPassword({ ...password, [name]: value });
  };

  // Handle profile image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle profile update
  const handleUpdateProfile = async () => {
    if (!profileData) return;
    
    try {
      setSaving(true);
      
      // Create form data for multipart request
      const formData = new FormData();
      formData.append('fullName', profileData.fullName);
      
      if (profileData.address) {
        formData.append('address', profileData.address);
      }
      
      if (profileData.city) {
        formData.append('city', profileData.city);
      }
      
      if (profileData.country) {
        formData.append('country', profileData.country);
      }
      
      // Add profile image if changed
      if (imageFile) {
        formData.append('profileImage', imageFile);
      }
      
      const response = await fetch('/api/profile', {
        method: 'PUT',
        body: formData,
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Profile updated',
          description: 'Your profile has been successfully updated',
        });
        
        // Update user in auth context
        queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      } else {
        throw new Error(data.message || 'Update failed');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Update failed',
        description: error instanceof Error ? error.message : 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle password update
  const handleUpdatePassword = async () => {
    // Validate password inputs
    if (password.new !== password.confirm) {
      toast({
        title: 'Password mismatch',
        description: 'New password and confirmation do not match',
        variant: 'destructive',
      });
      return;
    }
    
    if (password.new.length < 6) {
      toast({
        title: 'Password too short',
        description: 'New password must be at least 6 characters',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setSaving(true);
      
      const response = await apiRequest('PUT', '/api/profile/password', {
        currentPassword: password.current,
        newPassword: password.new,
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Password updated',
          description: 'Your password has been successfully updated',
        });
        
        // Clear password fields
        setPassword({
          current: '',
          new: '',
          confirm: ''
        });
      } else {
        throw new Error(data.message || 'Password update failed');
      }
    } catch (error) {
      console.error('Error updating password:', error);
      toast({
        title: 'Update failed',
        description: error instanceof Error ? error.message : 'Failed to update password',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle location update
  const handleUpdateLocation = async () => {
    if (!profileData) return;
    
    // Use browser geolocation API
    if (navigator.geolocation) {
      try {
        setSaving(true);
        
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            
            try {
              const response = await apiRequest('PUT', '/api/location', {
                latitude,
                longitude,
              });
              
              const data = await response.json();
              
              if (data.success) {
                // Update local state with new coordinates
                setProfileData(prev => 
                  prev ? { ...prev, latitude, longitude } : null
                );
                
                toast({
                  title: 'Location updated',
                  description: 'Your location has been successfully updated',
                });
              } else {
                throw new Error(data.message || 'Location update failed');
              }
            } catch (error) {
              console.error('Error saving location:', error);
              toast({
                title: 'Update failed',
                description: error instanceof Error ? error.message : 'Failed to update location',
                variant: 'destructive',
              });
            } finally {
              setSaving(false);
            }
          },
          (error) => {
            console.error('Geolocation error:', error);
            toast({
              title: 'Location error',
              description: 'Unable to get your current location. Please check your browser permissions.',
              variant: 'destructive',
            });
            setSaving(false);
          }
        );
      } catch (error) {
        console.error('Geolocation error:', error);
        toast({
          title: 'Location error',
          description: 'An error occurred while trying to get your location',
          variant: 'destructive',
        });
        setSaving(false);
      }
    } else {
      toast({
        title: 'Geolocation not supported',
        description: 'Your browser does not support geolocation',
        variant: 'destructive',
      });
    }
  };

  // Handle logout
  const handleLogout = () => {
    logoutMutation.mutate();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Profile Settings</CardTitle>
        <CardDescription>
          Manage your account settings and preferences
        </CardDescription>
      </CardHeader>
      
      <Tabs defaultValue="general">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="location">Location</TabsTrigger>
        </TabsList>
        
        {/* General Tab */}
        <TabsContent value="general">
          <CardContent className="space-y-6 pt-6">
            {/* Profile Image */}
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-24 w-24">
                {imagePreview ? (
                  <AvatarImage src={imagePreview} alt="Preview" />
                ) : profileData?.profileImage ? (
                  <AvatarImage 
                    src={`/uploads/profiles/${profileData.profileImage}`} 
                    alt={profileData.fullName} 
                  />
                ) : (
                  <AvatarFallback className="text-lg">
                    {profileData?.fullName.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
              
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="profileImage">Profile Image</Label>
                <div className="flex gap-2">
                  <Input
                    id="profileImage"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
            
            {/* User Details */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Full Name
                  </Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    value={profileData?.fullName || ''}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone Number
                  </Label>
                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    value={profileData?.phoneNumber || ''}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    name="address"
                    value={profileData?.address || ''}
                    onChange={handleInputChange}
                    placeholder="Your address"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    name="city"
                    value={profileData?.city || ''}
                    onChange={handleInputChange}
                    placeholder="Your city"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    name="country"
                    value={profileData?.country || ''}
                    onChange={handleInputChange}
                    placeholder="Your country"
                  />
                </div>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
            
            <Button onClick={handleUpdateProfile} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </CardFooter>
        </TabsContent>
        
        {/* Security Tab */}
        <TabsContent value="security">
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label htmlFor="current" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Current Password
              </Label>
              <Input
                id="current"
                name="current"
                type="password"
                value={password.current}
                onChange={handlePasswordChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="new">New Password</Label>
              <Input
                id="new"
                name="new"
                type="password"
                value={password.new}
                onChange={handlePasswordChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm New Password</Label>
              <Input
                id="confirm"
                name="confirm"
                type="password"
                value={password.confirm}
                onChange={handlePasswordChange}
              />
            </div>
          </CardContent>
          
          <CardFooter>
            <Button 
              className="ml-auto" 
              onClick={handleUpdatePassword}
              disabled={saving || !password.current || !password.new || !password.confirm}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Update Password
                </>
              )}
            </Button>
          </CardFooter>
        </TabsContent>
        
        {/* Location Tab */}
        <TabsContent value="location">
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-center justify-center">
              <MapPin className="h-16 w-16 text-primary opacity-80" />
            </div>
            
            <div className="text-center space-y-2">
              <h3 className="text-lg font-medium">Current Location</h3>
              {profileData?.latitude && profileData?.longitude ? (
                <div className="text-sm text-muted-foreground">
                  <p>Latitude: {profileData.latitude.toFixed(6)}</p>
                  <p>Longitude: {profileData.longitude.toFixed(6)}</p>
                  {profileData.address && (
                    <p className="mt-2">{profileData.address}</p>
                  )}
                  {(profileData.city || profileData.country) && (
                    <p>
                      {profileData.city && profileData.city}
                      {profileData.city && profileData.country && ', '}
                      {profileData.country && profileData.country}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No location data available. Update your location to improve service matching.
                </p>
              )}
            </div>
          </CardContent>
          
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={handleUpdateLocation}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <MapPin className="h-4 w-4 mr-2" />
                  Update My Location
                </>
              )}
            </Button>
          </CardFooter>
        </TabsContent>
      </Tabs>
    </Card>
  );
}