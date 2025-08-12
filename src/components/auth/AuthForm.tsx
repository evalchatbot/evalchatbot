
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface AuthFormProps {
  mode?: 'signin' | 'signup';
}

const AuthForm = ({ mode = 'signin' }: AuthFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>(mode);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();


  // Update auth mode when prop changes
  useEffect(() => {
    setAuthMode(mode);
  }, [mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (authMode === 'signup') {
        // Validation for signup
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters long');
        }

        console.log('Attempting sign up for:', email);
        
        const { error, data } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName.trim() || null,
            }
          }
        });
        
        if (error) {
          console.error('Sign up error:', error);
          if (error.message.includes('User already registered')) {
            throw new Error('An account with this email already exists. Please sign in instead.');
          } else {
            throw error;
          }
        }
        
        console.log('Sign up successful:', data.user?.email);
        
        toast({
          title: "Account created!",
          description: "Your account has been created successfully. You can now start using InsightsLM.",
        });

        // The AuthContext will handle the redirect automatically
        
      } else {
        // Sign in logic
        console.log('Attempting sign in for:', email);
        
        const { error, data } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) {
          console.error('Sign in error:', error);
          if (error.message.includes('Invalid login credentials')) {
            throw new Error('Invalid email or password. Please check your credentials and try again.');
          } else if (error.message.includes('Email not confirmed')) {
            throw new Error('Please check your email and click the confirmation link before signing in.');
          } else {
            throw error;
          }
        }
        
        console.log('Sign in successful:', data.user?.email);
        
        toast({
          title: "Welcome back!",
          description: "You have successfully signed in.",
        });

        // The AuthContext will handle the redirect automatically
      }
      
    } catch (error: any) {
      console.error('Auth form error:', error);
      toast({
        title: authMode === 'signup' ? "Sign Up Error" : "Sign In Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setAuthMode(authMode === 'signin' ? 'signup' : 'signin');
    // Clear form when switching modes
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFullName('');
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{authMode === 'signup' ? 'Create Account' : 'Sign In'}</CardTitle>
        <CardDescription>
          {authMode === 'signup' 
            ? 'Create a new account to get started with InsightsLM'
            : 'Enter your credentials to access your notebooks'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {authMode === 'signup' && (
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name (optional)</Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder={authMode === 'signup' ? 'Create a password (min 6 characters)' : 'Enter your password'}
              minLength={6}
            />
          </div>
          {authMode === 'signup' && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Confirm your password"
                minLength={6}
              />
            </div>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading 
              ? (authMode === 'signup' ? 'Creating Account...' : 'Signing In...')
              : (authMode === 'signup' ? 'Create Account' : 'Sign In')
            }
          </Button>
          
          <div className="text-center">
            <Button
              type="button"
              variant="link"
              onClick={toggleAuthMode}
              className="text-sm"
            >
              {authMode === 'signup' 
                ? 'Already have an account? Sign in'
                : "Don't have an account? Sign up"
              }
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default AuthForm;
