import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { useQuery } from "@tanstack/react-query";
import { format, startOfWeek, endOfWeek, getWeek, getYear } from "date-fns";
import { DailyPerformanceTracker } from "./analytics/DailyPerformanceTracker";
import { WeeklyTrendAnalysis } from "./analytics/WeeklyTrendAnalysis";
import { MonthlyOEEDashboard } from "./analytics/MonthlyOEEDashboard";
import { 
  fetchDailyAnalytics, 
  fetchWeeklyAnalytics, 
  fetchMonthlyAnalytics 
} from "../../../lib/api/manufacturing-analytics";
import { 
  DailyAnalyticsData, 
  WeeklyAnalyticsData, 
  MonthlyAnalyticsData 
} from "../../../types/manufacturing/analytics";

type TimeframeType = "daily" | "weekly" | "monthly";

export function ProductionAnalyticsDashboard() {
  const [timeframe, setTimeframe] = useState<TimeframeType>("daily");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // Format date according to timeframe needs
  const formattedDailyDate = format(selectedDate, 'yyyy-MM-dd');
  const weekStartDate = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const formattedWeekly = `${getYear(selectedDate)}-${getWeek(selectedDate, { weekStartsOn: 1 }).toString().padStart(2, '0')}`;
  const formattedMonthly = format(selectedDate, 'yyyy-MM');
  
  // Fetch daily analytics data
  const { 
    data: dailyData, 
    isLoading: isDailyLoading, 
    error: dailyError 
  } = useQuery<DailyAnalyticsData>({
    queryKey: ['/api/manufacturing/analytics/daily', formattedDailyDate],
    queryFn: () => fetchDailyAnalytics(formattedDailyDate),
    enabled: timeframe === 'daily',
    refetchInterval: timeframe === 'daily' ? 60000 : false, // Refresh every minute if active
  });
  
  // Fetch weekly analytics data
  const { 
    data: weeklyData, 
    isLoading: isWeeklyLoading, 
    error: weeklyError 
  } = useQuery<WeeklyAnalyticsData>({
    queryKey: ['/api/manufacturing/analytics/weekly', formattedWeekly],
    queryFn: () => fetchWeeklyAnalytics(formattedWeekly),
    enabled: timeframe === 'weekly',
    refetchInterval: timeframe === 'weekly' ? 60000 : false, // Refresh every minute if active
  });
  
  // Fetch monthly analytics data
  const { 
    data: monthlyData, 
    isLoading: isMonthlyLoading, 
    error: monthlyError 
  } = useQuery<MonthlyAnalyticsData>({
    queryKey: ['/api/manufacturing/analytics/monthly', formattedMonthly],
    queryFn: () => fetchMonthlyAnalytics(formattedMonthly),
    enabled: timeframe === 'monthly',
    refetchInterval: timeframe === 'monthly' ? 60000 : false, // Refresh every minute if active
  });
  
  // Determine current loading and error state based on selected timeframe
  const isLoading = 
    (timeframe === 'daily' && isDailyLoading) || 
    (timeframe === 'weekly' && isWeeklyLoading) || 
    (timeframe === 'monthly' && isMonthlyLoading);
    
  const error = 
    (timeframe === 'daily' && dailyError) || 
    (timeframe === 'weekly' && weeklyError) || 
    (timeframe === 'monthly' && monthlyError);

  const handlePreviousPeriod = () => {
    const newDate = new Date(selectedDate);
    if (timeframe === "daily") {
      newDate.setDate(newDate.getDate() - 1);
    } else if (timeframe === "weekly") {
      newDate.setDate(newDate.getDate() - 7);
    } else if (timeframe === "monthly") {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setSelectedDate(newDate);
  };

  const handleNextPeriod = () => {
    const newDate = new Date(selectedDate);
    if (timeframe === "daily") {
      newDate.setDate(newDate.getDate() + 1);
    } else if (timeframe === "weekly") {
      newDate.setDate(newDate.getDate() + 7);
    } else if (timeframe === "monthly") {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setSelectedDate(newDate);
  };

  const handleExport = () => {
    // Placeholder for exporting data
    alert('Export functionality to be implemented');
  };

  const handlePrint = () => {
    window.print();
  };

  const renderTimeframeTitle = () => {
    if (timeframe === "daily") {
      return format(selectedDate, "EEEE, MMMM d, yyyy");
    } else if (timeframe === "weekly") {
      const startOfWeek = new Date(selectedDate);
      startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay() + 1);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return `Week of ${format(startOfWeek, "MMM d")} - ${format(endOfWeek, "MMM d, yyyy")}`;
    } else {
      return format(selectedDate, "MMMM yyyy");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Production Analytics</h2>
          <p className="text-muted-foreground">
            Comprehensive performance metrics and KPIs for production operations
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <FontAwesomeIcon icon="file-export" className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <FontAwesomeIcon icon="print" className="mr-2 h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>{renderTimeframeTitle()}</CardTitle>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handlePreviousPeriod}
                >
                  <FontAwesomeIcon icon="chevron-left" className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleNextPeriod}
                >
                  <FontAwesomeIcon icon="chevron-right" className="h-4 w-4" />
                </Button>
              </div>
              <Tabs
                defaultValue={timeframe}
                value={timeframe}
                onValueChange={(value) => setTimeframe(value as TimeframeType)}
                className="w-[400px]"
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="daily">
                    <FontAwesomeIcon icon="calendar-day" className="mr-2 h-4 w-4" />
                    Daily
                  </TabsTrigger>
                  <TabsTrigger value="weekly">
                    <FontAwesomeIcon icon="calendar-week" className="mr-2 h-4 w-4" />
                    Weekly
                  </TabsTrigger>
                  <TabsTrigger value="monthly">
                    <FontAwesomeIcon icon="calendar-alt" className="mr-2 h-4 w-4" />
                    Monthly
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-96">
              <FontAwesomeIcon icon="spinner" className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex justify-center items-center h-96">
              <div className="text-center">
                <FontAwesomeIcon icon="exclamation-triangle" className="h-12 w-12 text-yellow-500 mb-4" />
                <p className="text-lg font-medium">Failed to load analytics data</p>
                <p className="text-muted-foreground">Please try again later or contact support.</p>
              </div>
            </div>
          ) : (
            <div className="mt-4">
              {timeframe === "daily" && dailyData && <DailyPerformanceTracker data={dailyData} />}
              {timeframe === "weekly" && weeklyData && <WeeklyTrendAnalysis data={weeklyData} />}
              {timeframe === "monthly" && monthlyData && <MonthlyOEEDashboard data={monthlyData} />}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}