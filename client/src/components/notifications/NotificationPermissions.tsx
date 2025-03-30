import React, { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BellRing, BellOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWebSocketContext } from '@/contexts/WebSocketContext';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useMutation } from '@tanstack/react-query';

type NotificationSetting = 'all' | 'important' | 'none' | 'default';

export default function NotificationPermissions() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { sendMessage, connected } = useWebSocketContext();
  const [permission, setPermission] = useState<NotificationSetting>(
    user?.notificationPermission as NotificationSetting || 'default'
  );

  // Update permission when user data changes
  useEffect(() => {
    if (user?.notificationPermission) {
      setPermission(user.notificationPermission as NotificationSetting);
    }
  }, [user?.notificationPermission]);

  // Mutation to update notification permission via HTTP API
  const updatePermissionMutation = useMutation({
    mutationFn: async (newPermission: NotificationSetting) => {
      const res = await apiRequest('PUT', '/api/notification-permission', {
        permission: newPermission,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      toast({
        title: 'Notification settings updated',
        description: 'Your notification preferences have been saved.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update notification settings',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Handle toggling all notifications
  const handleToggleAll = (checked: boolean) => {
    const newPermission = checked ? 'all' : 'none';
    setPermission(newPermission);
    
    // Update via WebSocket if connected, otherwise use HTTP API
    if (connected && user) {
      sendMessage({
        type: 'notification_permission',
        permission: newPermission,
      });
    } else {
      updatePermissionMutation.mutate(newPermission);
    }
  };

  // Reset to default settings
  const handleReset = () => {
    const defaultPermission = 'default';
    setPermission(defaultPermission);
    
    if (connected && user) {
      sendMessage({
        type: 'notification_permission',
        permission: defaultPermission,
      });
    } else {
      updatePermissionMutation.mutate(defaultPermission);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BellRing className="h-5 w-5" />
          Notification Settings
        </CardTitle>
        <CardDescription>
          Manage how and when you receive notifications from UstadGee
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center space-x-2">
            {permission === 'none' ? (
              <BellOff className="h-5 w-5 text-muted-foreground" />
            ) : (
              <BellRing className="h-5 w-5 text-primary" />
            )}
            <Label htmlFor="all-notifications" className="font-medium">
              All Notifications
            </Label>
          </div>
          <Switch
            id="all-notifications"
            checked={permission !== 'none'}
            onCheckedChange={handleToggleAll}
          />
        </div>
        
        <div className="flex justify-end pt-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleReset}
            disabled={updatePermissionMutation.isPending}
          >
            Reset to Default
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}