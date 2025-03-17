import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle } from 'lucide-react';
import { FontAwesomeIcon } from '@/components/ui/font-awesome-icon';
import { useQuery } from '@tanstack/react-query';

import DailyProductionPlan from './planning/DailyProductionPlan';
import WeeklyProductionPlan from './planning/WeeklyProductionPlan';

import { 
  getDailyAnalytics, 
  getWeeklyAnalytics, 
  getMonthlyAnalytics 
} from '@/lib/api/manufacturing-analytics';

interface ProductionAnalyticsDashboardProps {
  initialTab?: 'daily' | 'weekly' | 'monthly';
}

export function ProductionAnalyticsDashboard({ initialTab = 'daily' }: ProductionAnalyticsDashboardProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'monthly'>(initialTab);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedWeek, setSelectedWeek] = useState(getWeekString(new Date()));
  const [selectedMonth, setSelectedMonth] = useState(getMonthString(new Date()));

  // Function to get week string in YYYY-WW format
  function getWeekString(date: Date): string {
    const year = date.getFullYear();
    const weekNum = getWeekNumber(date);
    return `${year}-${weekNum.toString().padStart(2, '0')}`;
  }

  // Function to get month string in YYYY-MM format
  function getMonthString(date: Date): string {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    return `${year}-${month.toString().padStart(2, '0')}`;
  }

  // Function to get week number
  function getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  // Queries for the different time periods
  const dailyQuery = useQuery({
    queryKey: ['manufacturing', 'analytics', 'daily', selectedDate.toISOString().split('T')[0]],
    queryFn: () => getDailyAnalytics(selectedDate.toISOString().split('T')[0]),
    enabled: activeTab === 'daily',
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const weeklyQuery = useQuery({
    queryKey: ['manufacturing', 'analytics', 'weekly', selectedWeek],
    queryFn: () => getWeeklyAnalytics(selectedWeek),
    enabled: activeTab === 'weekly',
    staleTime: 15 * 60 * 1000, // 15 minutes
  });

  const monthlyQuery = useQuery({
    queryKey: ['manufacturing', 'analytics', 'monthly', selectedMonth],
    queryFn: () => getMonthlyAnalytics(selectedMonth),
    enabled: activeTab === 'monthly',
    staleTime: 60 * 60 * 1000, // 1 hour
  });

  // Error notification handling
  useEffect(() => {
    if (dailyQuery.error && activeTab === 'daily') {
      toast({
        title: 'Error Loading Analytics',
        description: 'Failed to load daily production analytics. Please try again later.',
        variant: 'destructive',
      });
    }

    if (weeklyQuery.error && activeTab === 'weekly') {
      toast({
        title: 'Error Loading Analytics',
        description: 'Failed to load weekly production analytics. Please try again later.',
        variant: 'destructive',
      });
    }

    if (monthlyQuery.error && activeTab === 'monthly') {
      toast({
        title: 'Error Loading Analytics',
        description: 'Failed to load monthly production analytics. Please try again later.',
        variant: 'destructive',
      });
    }
  }, [dailyQuery.error, weeklyQuery.error, monthlyQuery.error, activeTab, toast]);

  // Handle date change for daily view
  const handleDailyDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  // Handle week change for weekly view
  const handleWeekChange = (weekString: string) => {
    setSelectedWeek(weekString);
  };

  // Handle month change for monthly view
  const handleMonthChange = (monthString: string) => {
    setSelectedMonth(monthString);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Production Analytics</h2>
          <p className="text-muted-foreground">
            View and manage production metrics across different time periods
          </p>
        </div>
      </div>

      <Tabs defaultValue={activeTab} value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="daily" className="px-4">
              <FontAwesomeIcon icon="calendar-day" className="mr-2 h-4 w-4" />
              Daily
            </TabsTrigger>
            <TabsTrigger value="weekly" className="px-4">
              <FontAwesomeIcon icon="calendar-week" className="mr-2 h-4 w-4" />
              Weekly
            </TabsTrigger>
            <TabsTrigger value="monthly" className="px-4">
              <FontAwesomeIcon icon="calendar-alt" className="mr-2 h-4 w-4" />
              Monthly
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="daily" className="pt-4 space-y-4">
          {dailyQuery.isLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center space-y-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Loading daily production data...</p>
                </div>
              </CardContent>
            </Card>
          ) : dailyQuery.error ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                Failed to load daily production data. Please try again later.
              </AlertDescription>
            </Alert>
          ) : (
            <DailyProductionPlan 
              date={selectedDate} 
              analyticsData={dailyQuery.data}
              onDateChange={handleDailyDateChange}
              isLoading={dailyQuery.isLoading}
            />
          )}
        </TabsContent>

        <TabsContent value="weekly" className="pt-4 space-y-4">
          {weeklyQuery.isLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center space-y-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Loading weekly production data...</p>
                </div>
              </CardContent>
            </Card>
          ) : weeklyQuery.error ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                Failed to load weekly production data. Please try again later.
              </AlertDescription>
            </Alert>
          ) : (
            <WeeklyProductionPlan 
              weekString={selectedWeek} 
              analyticsData={weeklyQuery.data}
              onWeekChange={handleWeekChange}
              isLoading={weeklyQuery.isLoading}
            />
          )}
        </TabsContent>

        <TabsContent value="monthly" className="pt-4 space-y-4">
          {monthlyQuery.isLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center space-y-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Loading monthly production data...</p>
                </div>
              </CardContent>
            </Card>
          ) : monthlyQuery.error ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                Failed to load monthly production data. Please try again later.
              </AlertDescription>
            </Alert>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Monthly OEE Analytics</CardTitle>
                <CardDescription>
                  Overall Equipment Effectiveness for {new Date(selectedMonth.split('-')[0], parseInt(selectedMonth.split('-')[1]) - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center p-12">
                  <p className="text-muted-foreground">Monthly analytics visualization will be implemented here</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ProductionAnalyticsDashboard;