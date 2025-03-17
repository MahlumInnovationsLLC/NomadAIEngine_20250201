import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api/apiProxy';
import { Loader2 } from 'lucide-react';

export function ConnectionTest() {
  const { toast } = useToast();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [apiStatus, setApiStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [testResult, setTestResult] = useState<string>('');
  const [apiTestResult, setApiTestResult] = useState<string>('');
  const [connectionInfo, setConnectionInfo] = useState<string>('');

  useEffect(() => {
    // Get connection info
    setConnectionInfo(
      `Origin: ${window.location.origin}
Host: ${window.location.host}
Protocol: ${window.location.protocol}
Current URL: ${window.location.href}
API Base URL: ${api.getBaseUrl()}`
    );

    // Initial tests
    testServerStatus();
    testApi();
  }, []);

  const testServerStatus = async () => {
    setStatus('loading');
    try {
      const response = await api.get('/api/status');
      setStatus('success');
      setTestResult(JSON.stringify(response, null, 2));
      toast({
        title: 'Server Connection Test',
        description: 'Successfully connected to the server',
        variant: 'default',
      });
    } catch (error: any) {
      setStatus('error');
      setTestResult(error.message || 'Unknown error');
      toast({
        title: 'Server Connection Test',
        description: 'Failed to connect to the server',
        variant: 'destructive',
      });
    }
  };

  const testApi = async () => {
    setApiStatus('loading');
    try {
      const response = await api.get('/api/manufacturing/analytics/daily');
      setApiStatus('success');
      setApiTestResult(JSON.stringify(response, null, 2));
      toast({
        title: 'API Test',
        description: 'Successfully connected to the manufacturing API',
        variant: 'default',
      });
    } catch (error: any) {
      setApiStatus('error');
      setApiTestResult(error.message || 'Unknown error');
      toast({
        title: 'API Test',
        description: 'Failed to connect to the manufacturing API',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto my-8 space-y-8">
      <h1 className="text-3xl font-bold">Server Connection Test</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Server Status Check</CardTitle>
          <CardDescription>Testing connection to the server's status endpoint</CardDescription>
        </CardHeader>
        <CardContent>
          {status === 'loading' ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <p>Testing connection...</p>
            </div>
          ) : status === 'success' ? (
            <Alert className="bg-green-50 border-green-200">
              <AlertTitle className="text-green-600">Connected!</AlertTitle>
              <AlertDescription>
                <pre className="mt-2 bg-slate-950 text-slate-50 p-4 rounded-md overflow-auto">
                  {testResult}
                </pre>
              </AlertDescription>
            </Alert>
          ) : status === 'error' ? (
            <Alert className="bg-red-50 border-red-200">
              <AlertTitle className="text-red-600">Connection Failed</AlertTitle>
              <AlertDescription className="text-red-700">{testResult}</AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
        <CardFooter>
          <Button onClick={testServerStatus} variant="outline" disabled={status === 'loading'}>
            {status === 'loading' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              'Test Connection'
            )}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manufacturing API Test</CardTitle>
          <CardDescription>Testing connection to the manufacturing analytics API</CardDescription>
        </CardHeader>
        <CardContent>
          {apiStatus === 'loading' ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <p>Testing API connection...</p>
            </div>
          ) : apiStatus === 'success' ? (
            <Alert className="bg-green-50 border-green-200">
              <AlertTitle className="text-green-600">API Test Successful!</AlertTitle>
              <AlertDescription>
                <pre className="mt-2 bg-slate-950 text-slate-50 p-4 rounded-md overflow-auto">
                  {apiTestResult}
                </pre>
              </AlertDescription>
            </Alert>
          ) : apiStatus === 'error' ? (
            <Alert className="bg-red-50 border-red-200">
              <AlertTitle className="text-red-600">API Test Failed</AlertTitle>
              <AlertDescription className="text-red-700">{apiTestResult}</AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
        <CardFooter>
          <Button onClick={testApi} variant="outline" disabled={apiStatus === 'loading'}>
            {apiStatus === 'loading' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing API...
              </>
            ) : (
              'Test API'
            )}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Connection Information</CardTitle>
          <CardDescription>Details about your current connection</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-slate-100 p-4 rounded-md overflow-auto">{connectionInfo}</pre>
        </CardContent>
      </Card>
    </div>
  );
}

export default ConnectionTest;