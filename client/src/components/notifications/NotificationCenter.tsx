import React, { useState, useEffect } from 'react';
import { useWebSocketContext } from '@/contexts/WebSocketContext';
import { useAuth } from '@/hooks/use-auth';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { BellIcon, BellOff, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';

type Notification = {
  id: number;
  userId: number;
  title: string;
  message: string;
  isRead: boolean;
  timeStamp: string;
  type: string;
  linkId?: number;
};

export function NotificationCenter() {
  const { user } = useAuth();
  const { onMessage, requestNotificationPermission } = useWebSocketContext();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  // Fetch notifications from the server
  useEffect(() => {
    if (user?.id) {
      const fetchNotifications = async () => {
        try {
          setLoading(true);
          const response = await apiRequest('GET', '/api/notifications');
          const data = await response.json();
          
          if (data.success && Array.isArray(data.notifications)) {
            setNotifications(data.notifications);
            // Count unread notifications
            setUnreadCount(data.notifications.filter((n: Notification) => !n.isRead).length);
          }
        } catch (error) {
          console.error('Error fetching notifications:', error);
        } finally {
          setLoading(false);
        }
      };
      
      fetchNotifications();
    }
  }, [user?.id]);

  // Listen for new notifications via WebSocket
  useEffect(() => {
    const unsubscribe = onMessage('notification', (data) => {
      // Add new notification to the list
      const newNotification: Notification = {
        id: data.id || Date.now(),
        userId: user?.id || 0,
        title: data.title,
        message: data.message,
        isRead: false,
        timeStamp: data.timestamp || new Date().toISOString(),
        type: data.type || 'info',
        linkId: data.linkId
      };
      
      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });
    
    return unsubscribe;
  }, [onMessage, user?.id]);

  // Mark a single notification as read
  const markAsRead = async (id: number) => {
    try {
      await apiRequest('PUT', `/api/notification/${id}`, { isRead: true });
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, isRead: true } : notif
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (unreadCount === 0) return;
    
    try {
      await apiRequest('PUT', '/api/notifications/markAllRead', {});
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, isRead: true }))
      );
      
      // Reset unread count
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Request notification permission
  const handleRequestPermission = async () => {
    await requestNotificationPermission();
  };

  // Format the timestamp
  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return format(date, 'MMM d, h:mm a');
    } catch (e) {
      return '';
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative"
          aria-label="Notifications"
        >
          <BellIcon className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex justify-between items-center p-4 border-b">
          <h4 className="font-medium">Notifications</h4>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleRequestPermission}
              className="h-7 w-7"
              title="Enable browser notifications"
            >
              <BellOff className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className="h-7 w-7"
              title="Mark all as read"
            >
              <Check className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <ScrollArea className="h-[350px]">
          {loading ? (
            <div className="flex justify-center items-center h-20">
              <p className="text-muted-foreground">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex justify-center items-center h-20">
              <p className="text-muted-foreground">No notifications</p>
            </div>
          ) : (
            <div className="space-y-1 p-1">
              {notifications.map((notification) => (
                <Card 
                  key={notification.id}
                  className={`p-3 cursor-pointer hover:bg-accent transition-colors ${
                    !notification.isRead ? 'border-l-4 border-l-primary' : ''
                  }`}
                  onClick={() => {
                    if (!notification.isRead) {
                      markAsRead(notification.id);
                    }
                    // Handle navigation based on notification type if needed
                    if (notification.linkId) {
                      setOpen(false);
                      // Would typically navigate to a specific page based on notification.type and linkId
                    }
                  }}
                >
                  <div className="space-y-1">
                    <div className="flex justify-between items-start">
                      <h5 className="font-medium text-sm">{notification.title}</h5>
                      <span className="text-xs text-muted-foreground">
                        {formatTimestamp(notification.timeStamp)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{notification.message}</p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}