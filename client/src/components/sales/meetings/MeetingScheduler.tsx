import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faCalendar,
  faVideo,
  faPhone,
  faLocationDot,
  faPlus,
  faUserGroup,
  faClock
} from "@fortawesome/free-solid-svg-icons";

const mockMeetings = [
  {
    id: 1,
    title: "Product Demo - TechCorp",
    type: "video",
    date: "2025-02-06T14:00:00",
    duration: 60,
    attendees: ["Michael Chen", "Sarah Johnson"],
    status: "scheduled"
  },
  {
    id: 2,
    title: "Follow-up Call - Global Manufacturing",
    type: "phone",
    date: "2025-02-07T10:30:00",
    duration: 30,
    attendees: ["Lisa Rodriguez"],
    status: "pending"
  }
];

export function MeetingScheduler() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Meeting Scheduler</h2>
          <p className="text-muted-foreground">Schedule and manage your sales meetings</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <FontAwesomeIcon icon={faPlus} className="mr-2" />
              Schedule Meeting
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[625px]">
            <DialogHeader>
              <DialogTitle>Schedule New Meeting</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Meeting Title</Label>
                <Input id="title" placeholder="Enter meeting title" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Date & Time</Label>
                  <Input id="date" type="datetime-local" />
                </div>
                <div>
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input id="duration" type="number" defaultValue={30} />
                </div>
              </div>
              <div>
                <Label htmlFor="type">Meeting Type</Label>
                <select className="w-full px-3 py-2 border rounded-md">
                  <option value="video">Video Call</option>
                  <option value="phone">Phone Call</option>
                  <option value="in-person">In Person</option>
                </select>
              </div>
              <div>
                <Label htmlFor="attendees">Attendees</Label>
                <Input id="attendees" placeholder="Add attendees" />
              </div>
              <div>
                <Label htmlFor="notes">Meeting Notes</Label>
                <textarea 
                  id="notes" 
                  className="w-full px-3 py-2 border rounded-md" 
                  rows={3}
                  placeholder="Add any meeting notes or agenda items"
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Meetings</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Meeting</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Attendees</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockMeetings.map((meeting) => (
                <TableRow key={meeting.id}>
                  <TableCell>{meeting.title}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon 
                        icon={meeting.type === 'video' ? faVideo : meeting.type === 'phone' ? faPhone : faLocationDot} 
                        className="text-muted-foreground"
                      />
                      {meeting.type.charAt(0).toUpperCase() + meeting.type.slice(1)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faCalendar} className="text-muted-foreground" />
                      {new Date(meeting.date).toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faClock} className="text-muted-foreground" />
                      {meeting.duration} min
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faUserGroup} className="text-muted-foreground" />
                      {meeting.attendees.join(", ")}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={meeting.status === 'scheduled' ? 'default' : 'secondary'}>
                      {meeting.status.charAt(0).toUpperCase() + meeting.status.slice(1)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
