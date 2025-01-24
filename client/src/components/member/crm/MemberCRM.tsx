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

interface Member {
  id: number;
  name: string;
  email: string;
  status: "active" | "at-risk" | "churned";
  lastActive: string;
  membershipType: string;
  aiInsights: string[];
}

const mockMembers: Member[] = [
  {
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    status: "active",
    lastActive: "2025-01-23",
    membershipType: "Premium",
    aiInsights: ["High engagement with group classes", "Potential for personal training upsell"],
  },
  {
    id: 2,
    name: "Jane Smith",
    email: "jane@example.com",
    status: "at-risk",
    lastActive: "2025-01-10",
    membershipType: "Basic",
    aiInsights: ["Decreasing visit frequency", "Consider reaching out with special offer"],
  },
];

export function MemberCRM() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredMembers = mockMembers.filter(member => 
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
        {filteredMembers.map((member) => (
          <Card key={member.id}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{member.name}</h3>
                    <Badge 
                      variant={
                        member.status === "active" ? "default" :
                        member.status === "at-risk" ? "destructive" :
                        "secondary"
                      }
                    >
                      {member.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{member.email}</p>
                  <p className="text-sm">
                    {member.membershipType} • Last active: {member.lastActive}
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

              {member.aiInsights.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm font-medium mb-2">
                    <FontAwesomeIcon icon={faBrain} className="h-4 w-4 text-purple-500" />
                    AI Insights
                  </div>
                  <ul className="space-y-1">
                    {member.aiInsights.map((insight, index) => (
                      <li key={index} className="text-sm text-muted-foreground">
                        • {insight}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}