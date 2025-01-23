import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faCalendar, faCrown, faClock, faChartLine } from "@fortawesome/free-solid-svg-icons";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface Member {
  id: string;
  name: string;
  email: string;
  joinDate: string;
  membershipType: string;
  lastVisit: string;
  visitsThisMonth: number;
  metrics: {
    attendanceRate: number;
    engagementScore: number;
    lifetimeValue: number;
  };
}

interface MemberListDialogProps {
  open: boolean;
  onClose: () => void;
  segmentId: number | null;
  segmentName: string;
}

export function MemberListDialog({ open, onClose, segmentId, segmentName }: MemberListDialogProps) {
  const { data, isLoading } = useQuery({
    queryKey: [`/api/marketing/segments/${segmentId}/members`],
    enabled: open && segmentId !== null,
  });

  const members = data?.members || [];
  const pagination = data?.pagination;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-xl">Members in Segment: {segmentName}</DialogTitle>
          {pagination && (
            <p className="text-sm text-muted-foreground">
              Showing {members.length} of {pagination.total} members
            </p>
          )}
        </DialogHeader>

        <ScrollArea className="flex-1 px-1">
          <div className="space-y-4 py-4">
            {isLoading ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, i) => (
                <Card key={i} className="p-4 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/4 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                </Card>
              ))
            ) : (
              members.map((member: Member) => (
                <Card key={member.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FontAwesomeIcon icon={faUser} className="h-4 w-4 text-blue-500" />
                        <h3 className="font-medium">{member.name}</h3>
                        <span className="text-sm text-muted-foreground">{member.email}</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faCalendar} className="h-3 w-3 text-gray-400" />
                          <span className="text-muted-foreground">Joined: {format(new Date(member.joinDate), 'MMM d, yyyy')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faCrown} className="h-3 w-3 text-gray-400" />
                          <span>{member.membershipType}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faClock} className="h-3 w-3 text-gray-400" />
                          <span>Last visit: {format(new Date(member.lastVisit), 'MMM d, yyyy')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4 items-center">
                      <div className="text-center px-4 py-2 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-semibold">{member.visitsThisMonth}</div>
                        <div className="text-xs text-muted-foreground">Visits this month</div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: "Attendance", value: member.metrics.attendanceRate, color: "text-green-500" },
                          { label: "Engagement", value: member.metrics.engagementScore, color: "text-blue-500" },
                          { label: "LTV", value: `$${member.metrics.lifetimeValue}`, color: "text-purple-500" }
                        ].map((metric, i) => (
                          <div key={i} className="text-center px-2">
                            <FontAwesomeIcon icon={faChartLine} className={cn("h-3 w-3 mb-1", metric.color)} />
                            <div className="font-medium">{metric.value}</div>
                            <div className="text-xs text-muted-foreground">{metric.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}