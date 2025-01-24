import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faUser,
  faChartLine,
  faCalendar,
  faCrown,
} from "@fortawesome/free-solid-svg-icons";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface Member {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  membershipType: string;
  membershipStatus: 'active' | 'inactive' | 'pending' | 'cancelled';
  joinDate: string;
  lastVisit: string;
  totalVisits: number;
  aiInsightCount: number;
}

interface MemberSearchProps {
  onSelect?: (member: Member) => void;
}

export function MemberSearch({ onSelect }: MemberSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [membershipFilter, setMembershipFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: members = [], isLoading } = useQuery<Member[]>({
    queryKey: ['/api/members', searchTerm, membershipFilter, statusFilter],
  });

  const filteredMembers = members.filter((member) => {
    const matchesSearch = !searchTerm || 
      `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesMembership = membershipFilter === "all" || member.membershipType === membershipFilter;
    const matchesStatus = statusFilter === "all" || member.membershipStatus === statusFilter;

    return matchesSearch && matchesMembership && matchesStatus;
  });

  const getStatusColor = (status: Member['membershipStatus']) => {
    const colors = {
      active: "bg-green-100 text-green-800",
      inactive: "bg-gray-100 text-gray-800",
      pending: "bg-yellow-100 text-yellow-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status];
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <FontAwesomeIcon
            icon={faSearch}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Search members by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={membershipFilter} onValueChange={setMembershipFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Membership Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="basic">Basic</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <ScrollArea className="h-[600px]">
        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
                  <div className="h-4 bg-gray-200 rounded w-1/4" />
                </CardContent>
              </Card>
            ))
          ) : (
            filteredMembers.map((member) => (
              <Card 
                key={member.id} 
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => onSelect?.(member)}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FontAwesomeIcon icon={faUser} className="h-4 w-4 text-blue-500" />
                        <h3 className="font-medium">{member.firstName} {member.lastName}</h3>
                        <span className="text-sm text-muted-foreground">{member.email}</span>
                        <Badge className={getStatusColor(member.membershipStatus)}>
                          {member.membershipStatus}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faCrown} className="h-3 w-3 text-yellow-500" />
                          <span>{member.membershipType}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faCalendar} className="h-3 w-3 text-gray-400" />
                          <span className="text-muted-foreground">
                            Joined: {format(new Date(member.joinDate), 'MMM d, yyyy')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faUser} className="h-3 w-3 text-gray-400" />
                          <span>Visits: {member.totalVisits}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faChartLine} className="h-3 w-3 text-purple-500" />
                          <span>{member.aiInsightCount} AI Insights</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" className="w-full md:w-auto">
                        View Profile
                      </Button>
                      <Button variant="outline" className="w-full md:w-auto">
                        View Insights
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}