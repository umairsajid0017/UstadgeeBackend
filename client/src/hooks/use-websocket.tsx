import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

type WebSocketStatus = 'connecting' | 'connected' | 'disconnected';
type MessageHandler = (data: any) => void;

export function useWebSocket() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState<WebSocketStatus>('disconnected');
  const socket = useRef<WebSocket | null>(null);
  const messageHandlers = useRef<Record<string, MessageHandler[]>>({});
  const reconnectTimeoutRef = useRef<number | null>(null);
  const maxReconnectAttempts = 5;
  const reconnectAttempts = useRef(0);

  // Initialize WebSocket connection
  const connect = useCallback(() => {
    if (!user?.id) return;
    
    // Close existing connection if any
    if (socket.current && socket.current.readyState === WebSocket.OPEN) {
      socket.current.close();
    }
    
    try {
      // Determine correct WebSocket protocol (ws or wss)
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      const ws = new WebSocket(wsUrl);
      socket.current = ws;
      
      setStatus('connecting');
      
      ws.onopen = () => {
        setStatus('connected');
        reconnectAttempts.current = 0;
        
        // Authenticate with the WebSocket server
        sendMessage({
          type: 'auth',
          userId: user.id.toString()
        });
        
        console.log('WebSocket connection established');
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Handle authentication success
          if (data.type === 'auth_success') {
            console.log('WebSocket authentication successful');
          }
          
          // Dispatch message to all registered handlers for this type
          const handlers = messageHandlers.current[data.type] || [];
          handlers.forEach(handler => handler(data));
          
          // Special handling for notifications
          if (data.type === 'notification' && data.title) {
            // Show notification using the toast system
            toast({
              title: data.title,
              description: data.message,
              variant: data.variant || "default"
            });
            
            // Also show browser notification if permission granted
            if (Notification && Notification.permission === 'granted') {
              new Notification(data.title, {
                body: data.message,
                icon: '/favicon.ico' // Use app icon
              });
            }
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      };
      
      ws.onclose = () => {
        setStatus('disconnected');
        
        // Try to reconnect unless we've reached max attempts
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * (2 ** reconnectAttempts.current), 30000);
          reconnectTimeoutRef.current = window.setTimeout(() => {
            reconnectAttempts.current += 1;
            connect();
          }, delay);
        } else {
          toast({
            title: "Connection lost",
            description: "Unable to connect to the server. Please refresh the page.",
            variant: "destructive"
          });
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        // The onclose handler will be called after this
      };
    } catch (error) {
      console.error('Failed to establish WebSocket connection:', error);
      setStatus('disconnected');
    }
  }, [user, toast]);
  
  // Disconnect WebSocket
  const disconnect = useCallback(() => {
    if (socket.current) {
      socket.current.close();
      socket.current = null;
    }
    
    // Clear any reconnection timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    setStatus('disconnected');
  }, []);
  
  // Send message through WebSocket
  const sendMessage = useCallback((data: any) => {
    if (socket.current && socket.current.readyState === WebSocket.OPEN) {
      socket.current.send(JSON.stringify(data));
      return true;
    }
    return false;
  }, []);
  
  // Register a message handler for a specific message type
  const onMessage = useCallback((type: string, handler: MessageHandler) => {
    if (!messageHandlers.current[type]) {
      messageHandlers.current[type] = [];
    }
    messageHandlers.current[type].push(handler);
    
    // Return function to unregister this handler
    return () => {
      messageHandlers.current[type] = messageHandlers.current[type].filter(h => h !== handler);
    };
  }, []);
  
  // Request notification permissions from the browser
  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      toast({
        title: "Notifications not supported",
        description: "Your browser doesn't support notifications",
        variant: "destructive"
      });
      return false;
    }
    
    if (Notification.permission === 'granted') {
      // Tell the server we have permission
      sendMessage({
        type: 'notification_permission',
        status: 'granted'
      });
      return true;
    }
    
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      
      // Tell the server about our permission status
      sendMessage({
        type: 'notification_permission',
        status: permission
      });
      
      return permission === 'granted';
    }
    
    return false;
  }, [toast, sendMessage]);
  
  // Connect WebSocket when user is authenticated
  useEffect(() => {
    if (user?.id) {
      connect();
    } else {
      disconnect();
    }
    
    return () => {
      disconnect();
    };
  }, [user, connect, disconnect]);
  
  return {
    status,
    connected: status === 'connected',
    sendMessage,
    onMessage,
    requestNotificationPermission,
  };
}