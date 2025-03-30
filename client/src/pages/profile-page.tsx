import { UserProfile } from '@/components/profile/UserProfile';
import ReferralInfo from '@/components/profile/ReferralInfo';
import AdminLayout from '@/components/layout/AdminLayout';
import NotificationPermissions from '@/components/notifications/NotificationPermissions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, BellRing, Settings, Users } from 'lucide-react';

export default function ProfilePage() {
  return (
    <AdminLayout title="My Profile" description="View and update your profile information">
      <div className="p-4">
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full md:w-auto md:inline-flex grid-cols-4 h-auto p-1">
            <TabsTrigger value="profile" className="flex items-center gap-2 py-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="referrals" className="flex items-center gap-2 py-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Referrals</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2 py-2">
              <BellRing className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2 py-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="mt-4">
            <UserProfile />
          </TabsContent>
          
          <TabsContent value="referrals" className="mt-4">
            <ReferralInfo />
          </TabsContent>
          
          <TabsContent value="notifications" className="mt-4">
            <NotificationPermissions />
          </TabsContent>
          
          <TabsContent value="settings" className="mt-4">
            <div className="grid gap-4">
              {/* Settings will be implemented in the future */}
              <div className="flex justify-center items-center p-8 h-48 text-center text-muted-foreground">
                Account settings will be available soon. Check back later!
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}