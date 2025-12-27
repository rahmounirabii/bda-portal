import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AuthDebug() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      console.log('Logout successful');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Authentication Debug</h1>

      <Card>
        <CardHeader>
          <CardTitle>Auth State</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p><strong>Is Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</p>
          <p><strong>Is Loading:</strong> {isLoading ? 'Yes' : 'No'}</p>
          <p><strong>User ID:</strong> {user?.id || 'N/A'}</p>
          <p><strong>Email:</strong> {user?.email || 'N/A'}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>User Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p><strong>First Name:</strong> {user?.profile?.first_name || 'N/A'}</p>
          <p><strong>Last Name:</strong> {user?.profile?.last_name || 'N/A'}</p>
          <p><strong>Role:</strong> {user?.profile?.role || 'N/A'}</p>
          <p><strong>Country:</strong> {user?.profile?.country_code || 'N/A'}</p>
          <p><strong>Profile Completed:</strong> {user?.profile?.profile_completed ? 'Yes' : 'No'}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={handleLogout} variant="destructive">
            Test Logout
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Raw User Object</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
            {JSON.stringify(user, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}