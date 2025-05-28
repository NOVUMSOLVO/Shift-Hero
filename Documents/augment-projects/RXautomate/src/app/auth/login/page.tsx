'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, User } from 'lucide-react';
import LoginForm from '@/components/auth/LoginForm';
import SmartcardLogin from '@/components/auth/SmartcardLogin';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const [activeTab, setActiveTab] = useState<string>('credentials');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-nhs-blue">Sign in to RXautomate</h1>
          <p className="text-gray-600 mt-2">
            Choose your sign-in method
          </p>
        </div>

        <Tabs defaultValue="credentials" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="credentials" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>Email</span>
            </TabsTrigger>
            <TabsTrigger value="smartcard" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              <span>NHS Smartcard</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="credentials">
            <LoginForm callbackUrl={callbackUrl} />
          </TabsContent>

          <TabsContent value="smartcard">
            <SmartcardLogin callbackUrl={callbackUrl} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
