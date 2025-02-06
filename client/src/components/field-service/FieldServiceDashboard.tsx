import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnimateTransition } from "@/components/ui/AnimateTransition";
import { useQuery } from "@tanstack/react-query";
import { TicketManagement } from "./tickets/TicketManagement";
import { TechnicianManagement } from "./technicians/TechnicianManagement";
import { CustomerFeedback } from "./feedback/CustomerFeedback";
import { WarrantyClaims } from "./warranty/WarrantyClaims";
import type { ServiceStats } from "@/types/field-service";

export default function FieldServiceDashboard() {
  const { data: serviceStats } = useQuery<ServiceStats>({
    queryKey: ['/api/field-service/stats'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  return (
    <AnimateTransition variant="fade">
      <div className="container mx-auto">
        <div className="text-center py-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <h1 className="text-3xl font-bold mb-4">Field Service & Warranty</h1>
          <p className="text-muted-foreground mb-4">
            Comprehensive field service management and warranty claims processing system
          </p>

          {/* Quick Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Open Tickets</p>
                    <h3 className="text-2xl font-bold">{serviceStats?.openTickets || 0}</h3>
                  </div>
                  <FontAwesomeIcon icon="ticket" className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Technicians</p>
                    <h3 className="text-2xl font-bold">{serviceStats?.activeTechnicians || 0}</h3>
                  </div>
                  <FontAwesomeIcon icon="users-gear" className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pending Claims</p>
                    <h3 className="text-2xl font-bold">{serviceStats?.pendingClaims || 0}</h3>
                  </div>
                  <FontAwesomeIcon icon="file-contract" className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Customer Satisfaction</p>
                    <h3 className="text-2xl font-bold">{serviceStats?.satisfactionScore || 0}%</h3>
                  </div>
                  <FontAwesomeIcon icon="face-smile" className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Tabs defaultValue="tickets" className="mt-8">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="tickets">
              <FontAwesomeIcon icon="ticket" className="mr-2" />
              Ticket Management
            </TabsTrigger>
            <TabsTrigger value="technicians">
              <FontAwesomeIcon icon="users-gear" className="mr-2" />
              Field Technicians
            </TabsTrigger>
            <TabsTrigger value="feedback">
              <FontAwesomeIcon icon="comments" className="mr-2" />
              Customer Feedback
            </TabsTrigger>
            <TabsTrigger value="warranty">
              <FontAwesomeIcon icon="file-contract" className="mr-2" />
              Warranty Claims
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tickets" className="space-y-6">
            <TicketManagement />
          </TabsContent>

          <TabsContent value="technicians" className="space-y-6">
            <TechnicianManagement />
          </TabsContent>

          <TabsContent value="feedback" className="space-y-6">
            <CustomerFeedback />
          </TabsContent>

          <TabsContent value="warranty" className="space-y-6">
            <WarrantyClaims />
          </TabsContent>
        </Tabs>
      </div>
    </AnimateTransition>
  );
}
