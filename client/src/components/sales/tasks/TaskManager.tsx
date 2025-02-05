import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faClock,
  faExclamationCircle,
  faUser,
  faCalendarAlt,
  faBuilding,
  faPlus,
  faFilter,
  faEdit,
  faTrash,
  faClipboardList as faHandshake
} from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";

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
    status: "pending",
    description: "Schedule a follow-up call to discuss technical requirements",
    notes: "Previous call covered initial scope",
    createdAt: "2025-02-01"
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
    status: "completed",
    description: "Send updated proposal with new pricing",
    notes: "Include updated terms as discussed",
    createdAt: "2025-02-02"
  }
];

interface TaskFormData {
  title: string;
  type: string;
  priority: string;
  dueDate: string;
  assignee: string;
  description: string;
  notes?: string;
  relatedTo?: {
    type: string;
    name: string;
  };
}

interface Task extends TaskFormData {
  id: number;
  status: string;
  createdAt: string;
}

export function TaskManager() {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [filterType, setFilterType] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const createForm = useForm<TaskFormData>({
    defaultValues: {
      title: "",
      type: "todo",
      priority: "medium",
      dueDate: new Date().toISOString().split('T')[0],
      assignee: "",
      description: "",
      notes: ""
    }
  });

  const editForm = useForm<TaskFormData>();

  const handleCreateTask = async (data: TaskFormData) => {
    try {
      const newTask = {
        id: tasks.length + 1,
        ...data,
        status: "pending",
        createdAt: new Date().toISOString()
      };

      setTasks([...tasks, newTask]);
      createForm.reset();

      toast({
        title: "Success",
        description: "Task created successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive",
      });
    }
  };

  const handleEditTask = async (data: TaskFormData) => {
    try {
      setIsEditing(true);
      if (!editingTask) return;

      const updatedTasks = tasks.map(task => {
        if (task.id === editingTask.id) {
          return {
            ...task,
            ...data,
          };
        }
        return task;
      });

      setTasks(updatedTasks);
      setEditingTask(null);
      setIsEditing(false);

      toast({
        title: "Success",
        description: "Task updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      });
      setIsEditing(false);
    }
  };

  const startEditingTask = (task: Task) => {
    setEditingTask(task);
    editForm.reset({
      title: task.title,
      type: task.type,
      priority: task.priority,
      dueDate: task.dueDate,
      assignee: task.assignee,
      description: task.description,
      notes: task.notes,
      relatedTo: task.relatedTo,
    });
  };

  const toggleTaskStatus = (taskId: number) => {
    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        const newStatus = task.status === "completed" ? "pending" : "completed";
        toast({
          title: "Status Updated",
          description: `Task marked as ${newStatus}`,
        });
        return {
          ...task,
          status: newStatus
        };
      }
      return task;
    }));
  };

  const deleteTask = (taskId: number) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      setTasks(tasks.filter(task => task.id !== taskId));
      toast({
        title: "Success",
        description: "Task deleted successfully",
      });
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filterType !== "all" && task.type.toLowerCase() !== filterType.toLowerCase()) return false;
    if (filterPriority !== "all" && task.priority.toLowerCase() !== filterPriority.toLowerCase()) return false;
    if (filterStatus !== "all" && task.status !== filterStatus) return false;
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

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
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>
            <form onSubmit={createForm.handleSubmit(handleCreateTask)} className="space-y-4">
              <div>
                <Label htmlFor="title">Task Title</Label>
                <Input {...createForm.register("title", { required: true })} placeholder="Enter task title" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select value={createForm.watch("type")} onValueChange={(value) => createForm.setValue("type", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="call">Call</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="todo">To-do</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={createForm.watch("priority")} onValueChange={(value) => createForm.setValue("priority", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input {...createForm.register("dueDate")} type="date" />
                </div>
                <div>
                  <Label htmlFor="assignee">Assignee</Label>
                  <Input {...createForm.register("assignee")} placeholder="Select assignee" />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea {...createForm.register("description")} placeholder="Add task description" />
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea {...createForm.register("notes")} placeholder="Add any additional notes" />
              </div>
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => createForm.reset()}>
                  Cancel
                </Button>
                <Button type="submit">Create Task</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Active Tasks</CardTitle>
            <div className="flex gap-4">
              <Input
                placeholder="Search tasks..."
                className="max-w-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="call">Call</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="todo">To-do</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
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
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>{task.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{task.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      task.priority.toLowerCase() === 'high' ? 'destructive' :
                      task.priority.toLowerCase() === 'medium' ? 'default' :
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
                        icon={task.relatedTo?.type === 'Deal' ? faHandshake : faBuilding}
                        className="text-muted-foreground"
                      />
                      {task.relatedTo?.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={task.status === 'completed' ? 'default' : 'secondary'}
                      className="cursor-pointer"
                      onClick={() => toggleTaskStatus(task.id)}
                    >
                      <FontAwesomeIcon
                        icon={task.status === 'completed' ? faCheckCircle : faClock}
                        className="mr-1"
                      />
                      {task.status === 'completed' ? 'Completed' : 'Pending'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={() => startEditingTask(task)}>
                            <FontAwesomeIcon icon={faEdit} />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Edit Task</DialogTitle>
                          </DialogHeader>
                          <form onSubmit={editForm.handleSubmit(handleEditTask)} className="space-y-4">
                            <div>
                              <Label htmlFor="edit-title">Task Title</Label>
                              <Input {...editForm.register("title", { required: true })} placeholder="Enter task title" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="edit-type">Type</Label>
                                <Select value={editForm.watch("type")} onValueChange={(value) => editForm.setValue("type", value)}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="call">Call</SelectItem>
                                    <SelectItem value="email">Email</SelectItem>
                                    <SelectItem value="meeting">Meeting</SelectItem>
                                    <SelectItem value="todo">To-do</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label htmlFor="edit-priority">Priority</Label>
                                <Select value={editForm.watch("priority")} onValueChange={(value) => editForm.setValue("priority", value)}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select priority" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="low">Low</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="edit-dueDate">Due Date</Label>
                                <Input {...editForm.register("dueDate")} type="date" />
                              </div>
                              <div>
                                <Label htmlFor="edit-assignee">Assignee</Label>
                                <Input {...editForm.register("assignee")} placeholder="Select assignee" />
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="edit-description">Description</Label>
                              <Textarea {...editForm.register("description")} placeholder="Add task description" />
                            </div>
                            <div>
                              <Label htmlFor="edit-notes">Notes</Label>
                              <Textarea {...editForm.register("notes")} placeholder="Add any additional notes" />
                            </div>
                            <DialogFooter>
                              <Button
                                variant="outline"
                                type="button"
                                onClick={() => {
                                  setEditingTask(null);
                                  editForm.reset();
                                }}
                              >
                                Cancel
                              </Button>
                              <Button type="submit" disabled={isEditing}>
                                {isEditing ? "Saving..." : "Save Changes"}
                              </Button>
                            </DialogFooter>
                          </form>
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500"
                        onClick={() => deleteTask(task.id)}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </Button>
                    </div>
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