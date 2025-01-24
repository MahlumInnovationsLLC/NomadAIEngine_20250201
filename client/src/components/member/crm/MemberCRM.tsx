import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faUserPlus, 
  faEnvelope, 
  faBell, 
  faChartPie, 
  faMagnifyingGlass,
  faBrain 
} from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";

interface Member {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  membershipType: string;
  membershipStatus: 'active' | 'inactive' | 'pending' | 'cancelled';
  joinDate: string;
  lastVisit: string;
  totalVisits: number;
  aiInsightCount: number;
  metrics: {
    attendanceRate: number;
    engagementScore: number;
    lifetimeValue: number;
  };
}

export function MemberCRM() {
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch members from Azure Blob Storage
  const { data: members = [], isLoading } = useQuery<Member[]>({
    queryKey: ['/api/members'],
  });

  const filteredMembers = members.filter(member => 
    `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Member CRM</h2>
          <p className="text-muted-foreground">
            Manage member communications and engagement
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <FontAwesomeIcon icon={faEnvelope} className="h-4 w-4" />
            Bulk Message
          </Button>
          <Button className="gap-2">
            <FontAwesomeIcon icon={faUserPlus} className="h-4 w-4" />
            Add Member
          </Button>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4"
            />
            <Input
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <Card>
            <CardContent className="pt-6">
              <div className="animate-pulse flex space-x-4">
                <div className="flex-1 space-y-4 py-1">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded"></div>
                    <div className="h-4 bg-muted rounded w-5/6"></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : filteredMembers.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-4">
                <p className="text-muted-foreground">No members found</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredMembers.map((member) => (
            <Card key={member.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">
                        {member.firstName} {member.lastName}
                      </h3>
                      <Badge 
                        variant={
                          member.membershipStatus === "active" ? "default" :
                          member.membershipStatus === "pending" ? "secondary" :
                          "destructive"
                        }
                      >
                        {member.membershipStatus}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                    <p className="text-sm">
                      {member.membershipType} • Last visit: {new Date(member.lastVisit).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon">
                      <FontAwesomeIcon icon={faEnvelope} className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <FontAwesomeIcon icon={faBell} className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm font-medium mb-2">
                    <FontAwesomeIcon icon={faBrain} className="h-4 w-4 text-purple-500" />
                    Member Metrics
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Attendance Rate:</span>
                      <br />
                      {member.metrics.attendanceRate}%
                    </div>
                    <div>
                      <span className="text-muted-foreground">Engagement Score:</span>
                      <br />
                      {member.metrics.engagementScore}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Lifetime Value:</span>
                      <br />
                      ${member.metrics.lifetimeValue}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}