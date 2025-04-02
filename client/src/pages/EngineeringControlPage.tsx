import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";

// Engineering discipline panels
import ElectricalEngineeringPanel from "@/components/engineering/ElectricalEngineeringPanel";
import MechanicalEngineeringPanel from "@/components/engineering/MechanicalEngineeringPanel";
import ITEngineeringPanel from "@/components/engineering/ITEngineeringPanel";
import NTCEngineeringPanel from "@/components/engineering/NTCEngineeringPanel";
import RedlineModule from "@/components/engineering/RedlineModule";

export default function EngineeringControlPage() {
  const [currentTab, setCurrentTab] = useState("electrical");

  return (
    <div className="space-y-6 pt-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Engineering Control</h1>
          <p className="text-muted-foreground mt-1">
            Manage engineering activities, equipment, and resources across departments
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <FontAwesomeIcon icon="project-diagram" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">
              Across all engineering departments
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Equipment Utilization</CardTitle>
            <FontAwesomeIcon icon="chart-line" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">78%</div>
            <p className="text-xs text-muted-foreground">
              +3% from previous month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engineers On-call</CardTitle>
            <FontAwesomeIcon icon="user-hard-hat" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              Available for emergency response
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Training Compliance</CardTitle>
            <FontAwesomeIcon icon="graduation-cap" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94%</div>
            <p className="text-xs text-muted-foreground">
              Required certifications up-to-date
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Redlines</CardTitle>
            <FontAwesomeIcon icon="pencil-ruler" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              Drawing changes awaiting review
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs 
        defaultValue="electrical" 
        value={currentTab}
        onValueChange={setCurrentTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="electrical">
            <FontAwesomeIcon icon="bolt" className="mr-2 h-4 w-4" />
            Electrical
          </TabsTrigger>
          <TabsTrigger value="mechanical">
            <FontAwesomeIcon icon="cogs" className="mr-2 h-4 w-4" />
            Mechanical
          </TabsTrigger>
          <TabsTrigger value="it">
            <FontAwesomeIcon icon="network-wired" className="mr-2 h-4 w-4" />
            IT
          </TabsTrigger>
          <TabsTrigger value="ntc">
            <FontAwesomeIcon icon="flask" className="mr-2 h-4 w-4" />
            NTC
          </TabsTrigger>
          <TabsTrigger value="redline">
            <FontAwesomeIcon icon="pencil-ruler" className="mr-2 h-4 w-4" />
            Redlines
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="electrical" className="space-y-4">
          <ElectricalEngineeringPanel />
        </TabsContent>
        
        <TabsContent value="mechanical" className="space-y-4">
          <MechanicalEngineeringPanel />
        </TabsContent>
        
        <TabsContent value="it" className="space-y-4">
          <ITEngineeringPanel />
        </TabsContent>
        
        <TabsContent value="ntc" className="space-y-4">
          <NTCEngineeringPanel />
        </TabsContent>

        <TabsContent value="redline" className="space-y-4">
          <RedlineModule />
        </TabsContent>
      </Tabs>
    </div>
  );
}