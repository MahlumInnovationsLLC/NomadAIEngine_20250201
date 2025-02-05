import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faCheckCircle, 
  faClock, 
  faExclamationCircle,
  faUser,
  faCalendarAlt,
  faBuilding,
  faPlus
} from "@fortawesome/free-solid-svg-icons";

const mockTasks = [
  {
    id: 1,
    title: "Follow up with TechCorp Industries",
    type: "Call",
    priority: "High",
    dueDate: "2025-02-06",
    assignee: "John Smith",
    relatedTo: {
      type: "Deal",
      name: "Custom Automation Line Project"
    },
    status: "pending"
  },
  {
    id: 2,
    title: "Send proposal to Global Manufacturing",
    type: "Email",
    priority: "Medium",
    dueDate: "2025-02-07",
    assignee: "Sarah Johnson",
    relatedTo: {
      type: "Company",
      name: "Global Manufacturing Co"
    },
    status: "completed"
  }
];

export function TaskManager() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Tasks</h2>
          <p className="text-muted-foreground">Manage your sales activities and follow-ups</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <FontAwesomeIcon icon={faPlus} className="mr-2" />
              New Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Task Title</Label>
                <Input id="title" placeholder="Enter task title" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Type</Label>
                  <select className="w-full px-3 py-2 border rounded-md">
                    <option value="call">Call</option>
                    <option value="email">Email</option>
                    <option value="meeting">Meeting</option>
                    <option value="todo">To-do</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <select className="w-full px-3 py-2 border rounded-md">
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
              <div>
                <Label htmlFor="dueDate">Due Date</Label>
                <Input id="dueDate" type="date" />
              </div>
              <div>
                <Label htmlFor="assignee">Assignee</Label>
                <Input id="assignee" placeholder="Select assignee" />
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" placeholder="Add any additional notes" />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead>Related To</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockTasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>{task.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{task.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      task.priority === 'High' ? 'destructive' : 
                      task.priority === 'Medium' ? 'default' : 
                      'secondary'
                    }>
                      {task.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faCalendarAlt} className="text-muted-foreground" />
                      {new Date(task.dueDate).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faUser} className="text-muted-foreground" />
                      {task.assignee}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon 
                        icon={task.relatedTo.type === 'Deal' ? faHandshake : faBuilding} 
                        className="text-muted-foreground" 
                      />
                      {task.relatedTo.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={task.status === 'completed' ? 'default' : 'secondary'}>
                      <FontAwesomeIcon 
                        icon={task.status === 'completed' ? faCheckCircle : faClock} 
                        className="mr-1" 
                      />
                      {task.status === 'completed' ? 'Completed' : 'Pending'}
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
