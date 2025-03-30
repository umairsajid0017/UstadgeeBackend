import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Copy, Check, Users } from 'lucide-react';

export default function ReferralInfo() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  
  // Only Ustad (service provider) users have referral codes
  const isServiceProvider = user?.userTypeId === 2;
  const referralCode = user?.referralCode;
  
  // Function to copy referral code to clipboard
  const copyToClipboard = () => {
    if (referralCode) {
      navigator.clipboard.writeText(referralCode);
      setCopied(true);
      
      toast({
        title: 'Referral code copied!',
        description: 'The referral code has been copied to your clipboard.',
      });
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  // Show different content based on user type
  const renderContent = () => {
    if (isServiceProvider) {
      return (
        <>
          <CardDescription className="mb-4">
            Share your referral code with Karigar (workers) to build your team. They'll be linked to your account when they register.
          </CardDescription>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Your Referral Code</label>
              <div className="flex mt-1.5">
                <Input
                  value={referralCode || ''}
                  readOnly
                  className="rounded-r-none bg-muted/50 font-mono text-base"
                />
                <Button
                  variant="default"
                  size="icon"
                  className="rounded-l-none"
                  onClick={copyToClipboard}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Your Team (Referrals)</label>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                  View All
                </Button>
              </div>
              
              <div className="bg-muted/30 rounded-lg p-4 text-center">
                <p className="text-muted-foreground text-sm">
                  Coming soon! You'll be able to see your team members here.
                </p>
              </div>
            </div>
          </div>
        </>
      );
    } else {
      // For Karigar (worker) users
      return (
        <>
          <CardDescription className="mb-4">
            {user?.referralCode 
              ? "You're linked to an Ustad with the referral code below."
              : "You're not currently linked to any Ustad through a referral code."}
          </CardDescription>
          
          <div className="space-y-4">
            {user?.referralCode ? (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Linked with Referral Code</label>
                <Input
                  value={user.referralCode}
                  readOnly
                  className="mt-1.5 bg-muted/50 font-mono"
                />
              </div>
            ) : (
              <div className="bg-muted/30 rounded-lg p-4 text-center">
                <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground text-sm">
                  You can link to an Ustad by entering their referral code during registration.
                </p>
              </div>
            )}
          </div>
        </>
      );
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Referral Program
        </CardTitle>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
}