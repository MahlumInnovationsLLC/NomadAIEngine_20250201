import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { MemberCRM } from "./crm/MemberCRM";
import { PersonalizedExperience } from "./experience/PersonalizedExperience";
import { faUsers, faChartLine, faBrain, faDumbbell, faEnvelope, faHeartPulse } from "@fortawesome/free-solid-svg-icons";

function MemberDashboard() {
  return (
    <div className="p-6 space-y-6">
      {/* KPI Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <FontAwesomeIcon 
              icon={faUsers}
              className="h-4 w-4 text-muted-foreground" 
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,841</div>
            <p className="text-xs text-muted-foreground">+20 from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Retention Rate</CardTitle>
            <FontAwesomeIcon 
              icon={faChartLine}
              className="h-4 w-4 text-muted-foreground" 
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89.5%</div>
            <p className="text-xs text-muted-foreground">+2.1% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Insights</CardTitle>
            <FontAwesomeIcon 
              icon={faBrain}
              className="h-4 w-4 text-muted-foreground" 
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">New recommendations today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fitness Progress</CardTitle>
            <FontAwesomeIcon 
              icon={faHeartPulse}
              className="h-4 w-4 text-muted-foreground" 
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">76%</div>
            <p className="text-xs text-muted-foreground">Members meeting goals</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Content */}
      <Tabs defaultValue="crm" className="space-y-4">
        <TabsList>
          <TabsTrigger value="crm">CRM & Communications</TabsTrigger>
          <TabsTrigger value="experience">Personalized Experience</TabsTrigger>
          <TabsTrigger value="analytics">Member Analytics</TabsTrigger>
          <TabsTrigger value="engagement">Engagement Tracking</TabsTrigger>
        </TabsList>

        <TabsContent value="crm" className="space-y-4">
          <MemberCRM />
        </TabsContent>

        <TabsContent value="experience" className="space-y-4">
          <PersonalizedExperience />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Member Analytics Coming Soon</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Detailed member analytics and insights will be available here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Engagement Tracking Coming Soon</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Member engagement tracking and reporting will be available here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default MemberDashboard;