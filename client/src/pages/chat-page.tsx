import { ChatInterface } from '@/components/chat/ChatInterface';
import AdminLayout from '@/components/layout/AdminLayout';

export default function ChatPage() {
  return (
    <AdminLayout title="Chat" description="Communicate with service providers and clients">
      <div className="p-4">
        <ChatInterface />
      </div>
    </AdminLayout>
  );
}