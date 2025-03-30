import { UserProfile } from '@/components/profile/UserProfile';
import AdminLayout from '@/components/layout/AdminLayout';

export default function ProfilePage() {
  return (
    <AdminLayout title="My Profile" description="View and update your profile information">
      <div className="p-4">
        <UserProfile />
      </div>
    </AdminLayout>
  );
}