import React, { useState, useEffect, useRef } from 'react';
import { useWebSocketContext } from '@/contexts/WebSocketContext';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Send, BellRing } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

type ChatMessage = {
  id?: number;
  senderId: number;
  recipientId: number;
  message: string;
  timestamp: string;
  isRead?: boolean;
};

type ChatPartner = {
  id: number;
  fullName: string;
  profileImage?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
};

export function ChatInterface() {
  const { user } = useAuth();
  const { status, sendMessage, onMessage, requestNotificationPermission } = useWebSocketContext();
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatPartners, setChatPartners] = useState<ChatPartner[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<ChatPartner | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);

  // Fetch chat partners
  useEffect(() => {
    if (user?.id) {
      const fetchChatPartners = async () => {
        try {
          setLoading(true);
          const response = await apiRequest('GET', '/api/chats');
          const data = await response.json();
          
          if (data.success && Array.isArray(data.chats)) {
            setChatPartners(data.chats);
            // Select first partner by default if available
            if (data.chats.length > 0 && !selectedPartner) {
              setSelectedPartner(data.chats[0]);
            }
          }
        } catch (error) {
          console.error('Error fetching chat partners:', error);
          toast({
            title: 'Error',
            description: 'Failed to load chat partners',
            variant: 'destructive',
          });
        } finally {
          setLoading(false);
        }
      };
      
      fetchChatPartners();
    }
  }, [user?.id]);

  // Fetch chat history when partner is selected
  useEffect(() => {
    if (selectedPartner?.id && user?.id) {
      const fetchChatHistory = async () => {
        try {
          setLoading(true);
          const response = await apiRequest('GET', `/api/chats?partnerId=${selectedPartner.id}`);
          const data = await response.json();
          
          if (data.success && Array.isArray(data.messages)) {
            setMessages(data.messages);
          }
        } catch (error) {
          console.error('Error fetching chat history:', error);
        } finally {
          setLoading(false);
        }
      };
      
      fetchChatHistory();
    }
  }, [selectedPartner?.id, user?.id]);

  // Listen for incoming messages
  useEffect(() => {
    const unsubscribe = onMessage('chat', (data) => {
      if (data.senderId === selectedPartner?.id) {
        setMessages((prev) => [...prev, {
          senderId: data.senderId,
          recipientId: user?.id || 0,
          message: data.message,
          timestamp: data.timestamp,
        }]);
      } else {
        // Update unread count for the sender
        setChatPartners((prev) => 
          prev.map((partner) => 
            partner.id === data.senderId 
              ? { 
                  ...partner, 
                  lastMessage: data.message,
                  lastMessageTime: data.timestamp,
                  unreadCount: (partner.unreadCount || 0) + 1 
                }
              : partner
          )
        );
        
        // Show notification
        toast({
          title: `New message from ${chatPartners.find(p => p.id === data.senderId)?.fullName || 'Someone'}`,
          description: data.message.substring(0, 50) + (data.message.length > 50 ? '...' : ''),
        });
      }
    });
    
    return unsubscribe;
  }, [onMessage, selectedPartner?.id, user?.id, chatPartners]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!message.trim() || !selectedPartner || !user) return;
    
    // Send via WebSocket for real-time delivery
    const success = sendMessage({
      type: 'chat',
      senderId: user.id,
      recipientId: selectedPartner.id,
      message: message,
    });
    
    if (success) {
      // Add to local messages
      const newMessage: ChatMessage = {
        senderId: user.id,
        recipientId: selectedPartner.id,
        message: message,
        timestamp: new Date().toISOString(),
      };
      
      setMessages((prev) => [...prev, newMessage]);
      
      // Also store in database via API
      apiRequest('POST', '/api/startChat', {
        senderId: user.id,
        recipientId: selectedPartner.id,
        message: message,
      }).catch(error => {
        console.error('Error storing message:', error);
      });
      
      // Update the chat partner's last message
      setChatPartners(prev => 
        prev.map(partner => 
          partner.id === selectedPartner.id 
            ? { 
                ...partner, 
                lastMessage: message,
                lastMessageTime: new Date().toISOString()
              } 
            : partner
        )
      );
      
      // Clear input
      setMessage('');
    } else {
      toast({
        title: 'Connection issue',
        description: 'Message will be sent when connection is restored',
        variant: 'default',
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const handlePartnerSelect = (partner: ChatPartner) => {
    setSelectedPartner(partner);
    
    // Mark messages as read
    if (partner.unreadCount && partner.unreadCount > 0) {
      // Reset unread count
      setChatPartners(prev => 
        prev.map(p => 
          p.id === partner.id ? { ...p, unreadCount: 0 } : p
        )
      );
      
      // Call API to mark messages as read
      apiRequest('PUT', `/api/chat/${partner.id}/read`, {}).catch(error => {
        console.error('Error marking messages as read:', error);
      });
    }
  };
  
  const handleRequestNotifications = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      toast({
        title: 'Notifications enabled',
        description: 'You will now receive notifications for new messages',
      });
    } else {
      toast({
        title: 'Notifications disabled',
        description: 'Please enable notifications in your browser settings to receive alerts',
        variant: 'destructive',
      });
    }
  };

  // Format timestamp to readable time
  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="flex h-[calc(100vh-80px)] gap-4">
      {/* Chat partners list */}
      <Card className="w-80 h-full flex flex-col overflow-hidden">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Chats</span>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleRequestNotifications}
              title="Enable notifications"
            >
              <BellRing className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-grow overflow-hidden p-0">
          <ScrollArea className="h-full">
            {loading && !chatPartners.length ? (
              <div className="flex justify-center items-center h-20">
                <p className="text-muted-foreground">Loading chats...</p>
              </div>
            ) : chatPartners.length === 0 ? (
              <div className="flex justify-center items-center h-20">
                <p className="text-muted-foreground">No chats yet</p>
              </div>
            ) : (
              <div className="space-y-1">
                {chatPartners.map((partner) => (
                  <div
                    key={partner.id}
                    onClick={() => handlePartnerSelect(partner)}
                    className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-accent transition-colors ${
                      selectedPartner?.id === partner.id ? 'bg-accent' : ''
                    }`}
                  >
                    <Avatar>
                      <AvatarImage src={partner.profileImage ? `/uploads/profiles/${partner.profileImage}` : undefined} />
                      <AvatarFallback>
                        {partner.fullName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-grow min-w-0">
                      <div className="flex justify-between">
                        <p className="text-sm font-medium truncate">
                          {partner.fullName}
                        </p>
                        {partner.lastMessageTime && (
                          <span className="text-xs text-muted-foreground">
                            {formatTime(partner.lastMessageTime)}
                          </span>
                        )}
                      </div>
                      {partner.lastMessage && (
                        <p className="text-xs text-muted-foreground truncate">
                          {partner.lastMessage}
                        </p>
                      )}
                    </div>
                    {partner.unreadCount && partner.unreadCount > 0 && (
                      <div className="bg-primary text-primary-foreground rounded-full h-5 min-w-5 flex items-center justify-center text-xs">
                        {partner.unreadCount}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Chat messages */}
      <Card className="flex-grow h-full flex flex-col overflow-hidden">
        <CardHeader className="pb-3">
          {selectedPartner ? (
            <div className="flex items-center">
              <Avatar className="h-10 w-10 mr-2">
                <AvatarImage src={selectedPartner.profileImage ? `/uploads/profiles/${selectedPartner.profileImage}` : undefined} />
                <AvatarFallback>
                  {selectedPartner.fullName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <CardTitle>{selectedPartner.fullName}</CardTitle>
            </div>
          ) : (
            <CardTitle>Select a chat</CardTitle>
          )}
          <div className="text-xs text-muted-foreground">
            {status === 'connected' ? (
              <span className="text-green-500">● Connected</span>
            ) : status === 'connecting' ? (
              <span className="text-yellow-500">● Connecting...</span>
            ) : (
              <span className="text-red-500">● Disconnected</span>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="flex-grow overflow-hidden p-0">
          {!selectedPartner ? (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              Select a chat to start messaging
            </div>
          ) : loading ? (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              Loading messages...
            </div>
          ) : (
            <ScrollArea className="h-full p-4">
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <div className="flex justify-center py-8 text-muted-foreground">
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${
                        msg.senderId === user?.id ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[80%] px-4 py-2 rounded-lg ${
                          msg.senderId === user?.id
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <div className="text-sm">{msg.message}</div>
                        <div className="text-xs mt-1 opacity-70">
                          {formatTime(msg.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          )}
        </CardContent>

        {selectedPartner && (
          <CardFooter className="border-t p-3">
            <div className="flex w-full gap-2">
              <Input
                placeholder="Type a message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={status !== 'connected'}
              />
              <Button onClick={handleSendMessage} disabled={status !== 'connected'}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}