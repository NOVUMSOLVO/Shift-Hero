'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CreditCard, Loader2 } from 'lucide-react';
import SmartcardService from '@/services/SmartcardService';

interface SmartcardLoginProps {
  callbackUrl?: string;
}

export default function SmartcardLogin({ callbackUrl = '/' }: SmartcardLoginProps) {
  const [pin, setPin] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSmartcardPresent, setIsSmartcardPresent] = useState<boolean>(false);
  const [isServiceInitialized, setIsServiceInitialized] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    // Initialize smartcard service
    const initializeService = async () => {
      const initialized = await SmartcardService.initialize();
      setIsServiceInitialized(initialized);
      
      if (initialized) {
        // Check if a smartcard is present
        const present = await SmartcardService.isSmartcardPresent();
        setIsSmartcardPresent(present);
        
        // Set up interval to check for smartcard presence
        const interval = setInterval(async () => {
          const present = await SmartcardService.isSmartcardPresent();
          setIsSmartcardPresent(present);
        }, 2000);
        
        return () => clearInterval(interval);
      }
    };
    
    initializeService();
  }, []);

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits
    const value = e.target.value.replace(/[^0-9]/g, '');
    setPin(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isSmartcardPresent) {
      setError('No smartcard detected. Please insert your NHS smartcard.');
      return;
    }
    
    if (pin.length < 4) {
      setError('Please enter a valid PIN.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Authenticate with smartcard
      const session = await SmartcardService.authenticate(pin);
      
      if (!session) {
        throw new Error('Authentication failed. Please check your PIN and try again.');
      }
      
      // Sign in with NextAuth
      const result = await signIn('credentials', {
        redirect: false,
        smartcardUserId: session.userId,
        smartcardRoleId: session.roleId,
        smartcardOrganizationId: session.organizationId,
        callbackUrl,
      });
      
      if (result?.error) {
        throw new Error(result.error);
      }
      
      // Redirect to callback URL
      router.push(callbackUrl);
    } catch (error) {
      console.error('Smartcard authentication error:', error);
      setError(error instanceof Error ? error.message : 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">NHS Smartcard Login</CardTitle>
        <CardDescription className="text-center">
          Please insert your NHS smartcard and enter your PIN
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isServiceInitialized && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Smartcard service not initialized. Please refresh the page or contact support.
            </AlertDescription>
          </Alert>
        )}
        
        {isServiceInitialized && !isSmartcardPresent && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Smartcard Required</AlertTitle>
            <AlertDescription>
              Please insert your NHS smartcard to continue.
            </AlertDescription>
          </Alert>
        )}
        
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="flex items-center justify-center mb-6">
            <CreditCard className="h-16 w-16 text-nhs-blue" />
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pin">Smartcard PIN</Label>
              <Input
                id="pin"
                type="password"
                placeholder="Enter your PIN"
                value={pin}
                onChange={handlePinChange}
                maxLength={8}
                disabled={!isSmartcardPresent || isLoading}
                className="text-center text-lg tracking-widest"
              />
            </div>
            
            <Button
              type="submit"
              className="w-full bg-nhs-blue hover:bg-nhs-dark-blue"
              disabled={!isSmartcardPresent || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                'Login with Smartcard'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <div className="text-xs text-gray-500 text-center">
          <p>Your NHS smartcard provides secure access to NHS systems.</p>
          <p>If you have issues with your smartcard, please contact your local Registration Authority.</p>
        </div>
      </CardFooter>
    </Card>
  );
}
