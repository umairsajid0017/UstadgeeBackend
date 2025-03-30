import React, { useState, useEffect } from 'react';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription,
  CardFooter,
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Bell, Check, CheckCheck, Trash } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, UseQueryResult } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { useWebSocketContext } from '@/contexts/WebSocketContext';

type Notification = {
  id: number;
  title: string;
  type: number;
  time_stamp: string;
  username: string;
  username_notifier: string;
  post_id: number;
  is_read: number;
};

export default function NotificationCenter() {
  const { user } = useAuth();
  const { onMessage } = useWebSocketContext();
  const [isOpen, setIsOpen] = useState(false);
  
  // Query to fetch notifications
  const { 
    data, 
    isLoading, 
    error 
  }: UseQueryResult<{ success: boolean; notifications: Notification[] }> = useQuery({
    queryKey: ['/api/notifications'],
    enabled: !!user,
  });
  
  // Filter unread notifications
  const unreadCount = data?.notifications?.filter(n => n.is_read === 0).length || 0;
  
  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const res = await apiRequest('PUT', `/api/notification/${notificationId}`, {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });
  
  // Mark all notifications as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('PUT', '/api/notifications/markAllRead', {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });
  
  // Listen for new notifications via WebSocket
  useEffect(() => {
    const unsubscribe = onMessage('notification', (data) => {
      // Invalidate the notifications query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    });
    
    return () => {
      unsubscribe();
    };
  }, [onMessage]);
  
  // Format timestamp to a more readable format
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };
  
  // Get notification type label
  const getNotificationType = (type: number) => {
    switch (type) {
      case 1: return 'Service';
      case 2: return 'Task';
      case 3: return 'Chat';
      case 4: return 'Review';
      default: return 'System';
    }
  };
  
  // Get notification background based on type
  const getNotificationBackground = (type: number, isRead: number) => {
    if (isRead === 1) return 'bg-muted/30';
    
    switch (type) {
      case 1: return 'bg-blue-50 dark:bg-blue-950/20';
      case 2: return 'bg-green-50 dark:bg-green-950/20';
      case 3: return 'bg-purple-50 dark:bg-purple-950/20';
      case 4: return 'bg-orange-50 dark:bg-orange-950/20';
      default: return 'bg-gray-50 dark:bg-gray-900/20';
    }
  };
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <Card className="border-0">
          <CardHeader className="py-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Notifications</CardTitle>
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 px-2 text-xs" 
                  onClick={() => markAllAsReadMutation.mutate()}
                  disabled={markAllAsReadMutation.isPending}
                >
                  <CheckCheck className="h-4 w-4 mr-1" />
                  Mark all read
                </Button>
              )}
            </div>
            <CardDescription>
              {unreadCount > 0 
                ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                : 'No new notifications'}
            </CardDescription>
          </CardHeader>
          <ScrollArea className="h-[320px]">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center h-40">
                  <p className="text-muted-foreground">Loading notifications...</p>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-40">
                  <p className="text-destructive">Failed to load notifications</p>
                </div>
              ) : data?.notifications?.length ? (
                <div className="space-y-1">
                  {data.notifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      className={`px-4 py-3 ${getNotificationBackground(notification.type, notification.is_read)}`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="px-1 py-0 h-5 text-xs">
                              {getNotificationType(notification.type)}
                            </Badge>
                            <p className="text-xs text-muted-foreground">
                              {formatTimestamp(notification.time_stamp)}
                            </p>
                          </div>
                          <h4 className="text-sm font-semibold mt-1">{notification.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            From: {notification.username_notifier}
                          </p>
                        </div>
                        {notification.is_read === 0 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => markAsReadMutation.mutate(notification.id)}
                            disabled={markAsReadMutation.isPending}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-40">
                  <p className="text-muted-foreground">No notifications yet</p>
                </div>
              )}
            </CardContent>
          </ScrollArea>
          <Separator />
          <CardFooter className="p-2 flex justify-center">
            <Button variant="ghost" size="sm" className="text-xs">
              View all notifications
            </Button>
          </CardFooter>
        </Card>
      </PopoverContent>
    </Popover>
  );
}