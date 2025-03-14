import { useState } from "react";
import { Task } from "@/types/manufacturing/ncr";
import { UserSelect } from "@/components/ui/UserSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { v4 as uuidv4 } from "uuid";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface TasksPanelProps {
  tasks: Task[];
  onAddTask: (task: Task) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onDeleteTask: (taskId: string) => void;
  readonly?: boolean;
}

export function TasksPanel({
  tasks,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  readonly = false,
}: TasksPanelProps) {
  const [showAddTask, setShowAddTask] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: "",
    description: "",
    assignedTo: "",
    priority: "medium",
    status: "pending",
    dueDate: new Date(Date.now() + 86400000 * 5).toISOString(), // Default: 5 days from now
  });

  const resetForm = () => {
    setNewTask({
      title: "",
      description: "",
      assignedTo: "",
      priority: "medium",
      status: "pending",
      dueDate: new Date(Date.now() + 86400000 * 5).toISOString(),
    });
    setEditingTask(null);
  };

  const handleSubmit = () => {
    if (editingTask) {
      onUpdateTask(editingTask.id, newTask);
    } else {
      const createdTask: Task = {
        id: uuidv4(),
        title: newTask.title || "",
        description: newTask.description || "",
        assignedTo: newTask.assignedTo || "",
        assignedBy: "current-user", // In a real app, this would be the current user's ID
        priority: newTask.priority as Task["priority"] || "medium",
        status: newTask.status as Task["status"] || "pending",
        dueDate: newTask.dueDate,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      onAddTask(createdTask);
    }
    resetForm();
    setIsDialogOpen(false);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setNewTask({
      title: task.title,
      description: task.description,
      assignedTo: task.assignedTo,
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate,
    });
    setIsDialogOpen(true);
  };

  const handleStatusChange = (taskId: string, status: Task["status"]) => {
    const updates: Partial<Task> = { 
      status, 
      updatedAt: new Date().toISOString()
    };
    
    if (status === "completed") {
      updates.completedAt = new Date().toISOString();
      updates.completedBy = "current-user"; // In a real app, this would be the current user's ID
    }
    
    onUpdateTask(taskId, updates);
  };

  const getPriorityColor = (priority: Task["priority"]) => {
    switch (priority) {
      case "low": return "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20";
      case "medium": return "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20";
      case "high": return "bg-orange-500/10 text-orange-500 hover:bg-orange-500/20";
      case "urgent": return "bg-red-500/10 text-red-500 hover:bg-red-500/20";
      default: return "";
    }
  };

  const getStatusColor = (status: Task["status"]) => {
    switch (status) {
      case "pending": return "bg-gray-100 text-gray-500";
      case "in_progress": return "bg-blue-100 text-blue-600";
      case "completed": return "bg-green-100 text-green-600";
      case "cancelled": return "bg-red-100 text-red-600";
      default: return "";
    }
  };

  const getStatusIcon = (status: Task["status"]) => {
    switch (status) {
      case "pending": return "clock";
      case "in_progress": return "spinner";
      case "completed": return "check-circle";
      case "cancelled": return "times-circle";
      default: return "question-circle";
    }
  };

  const getDaysUntilDue = (dueDate?: string) => {
    if (!dueDate) return null;
    
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  const getDueDateDisplay = (dueDate?: string) => {
    if (!dueDate) return null;
    
    const days = getDaysUntilDue(dueDate);
    if (days === null) return null;
    
    if (days < 0) {
      return <span className="text-red-500">Overdue by {Math.abs(days)} days</span>;
    } else if (days === 0) {
      return <span className="text-red-500">Due today</span>;
    } else if (days === 1) {
      return <span className="text-orange-500">Due tomorrow</span>;
    } else if (days <= 3) {
      return <span className="text-orange-500">Due in {days} days</span>;
    } else {
      return <span>Due in {days} days</span>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Tasks and Assignments</h3>
        {!readonly && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                onClick={() => {
                  resetForm();
                  setEditingTask(null);
                }}
              >
                <FontAwesomeIcon icon="plus" className="mr-2 h-4 w-4" />
                Add Task
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editingTask ? "Edit Task" : "Add New Task"}</DialogTitle>
                <DialogDescription>
                  {editingTask
                    ? "Update the task details below"
                    : "Create a new task and assign it to a team member"}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="Task title"
                    value={newTask.title}
                    onChange={(e) =>
                      setNewTask({ ...newTask, title: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    placeholder="Task description"
                    value={newTask.description}
                    onChange={(e) =>
                      setNewTask({ ...newTask, description: e.target.value })
                    }
                    rows={3}
                  />
                </div>

                <UserSelect
                  label="Assigned To"
                  value={newTask.assignedTo || ""}
                  onValueChange={(value) =>
                    setNewTask({ ...newTask, assignedTo: value })
                  }
                  required
                />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Priority</label>
                    <Select
                      value={newTask.priority}
                      onValueChange={(value: Task["priority"]) =>
                        setNewTask({ ...newTask, priority: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Due Date</label>
                    <Input
                      type="date"
                      value={newTask.dueDate ? new Date(newTask.dueDate).toISOString().split('T')[0] : ''}
                      onChange={(e) => {
                        if (e.target.value) {
                          const date = new Date(e.target.value);
                          setNewTask({
                            ...newTask,
                            dueDate: date.toISOString(),
                          });
                        } else {
                          setNewTask({
                            ...newTask,
                            dueDate: undefined,
                          });
                        }
                      }}
                    />
                  </div>
                </div>

                {editingTask && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <Select
                      value={newTask.status}
                      onValueChange={(value: Task["status"]) =>
                        setNewTask({ ...newTask, status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    resetForm();
                    setIsDialogOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!newTask.title || !newTask.assignedTo}
                >
                  {editingTask ? "Update Task" : "Add Task"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {tasks.length === 0 ? (
        <div className="border rounded-md p-8 text-center text-muted-foreground">
          <FontAwesomeIcon icon="tasks" className="h-10 w-10 mb-2 opacity-50" />
          <p>No tasks have been created yet</p>
          {!readonly && (
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setIsDialogOpen(true)}
            >
              Create your first task
            </Button>
          )}
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Task</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <div className="font-medium hover:text-primary cursor-pointer truncate max-w-xs">
                          {task.title}
                        </div>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80">
                        <div className="space-y-2">
                          <h4 className="font-medium">{task.title}</h4>
                          <p className="text-sm text-muted-foreground">{task.description}</p>
                          
                          <div className="text-xs text-muted-foreground space-y-1">
                            <div className="flex justify-between">
                              <span>Created:</span>
                              <span>{format(new Date(task.createdAt), 'PPp')}</span>
                            </div>
                            {task.completedAt && (
                              <div className="flex justify-between">
                                <span>Completed:</span>
                                <span>{format(new Date(task.completedAt), 'PPp')}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  </TableCell>
                  
                  <TableCell>
                    {!readonly ? (
                      <Select
                        value={task.status}
                        onValueChange={(value: Task["status"]) => 
                          handleStatusChange(task.id, value)
                        }
                      >
                        <SelectTrigger className="h-8 w-[130px]">
                          <SelectValue>
                            <div className="flex items-center gap-2">
                              <FontAwesomeIcon 
                                icon={getStatusIcon(task.status)} 
                                className={`h-3.5 w-3.5 ${task.status === 'in_progress' ? 'animate-spin-slow' : ''}`}
                              />
                              <span className="capitalize">
                                {task.status.replace('_', ' ')}
                              </span>
                            </div>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">
                            <div className="flex items-center gap-2">
                              <FontAwesomeIcon icon="clock" className="h-3.5 w-3.5" />
                              <span>Pending</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="in_progress">
                            <div className="flex items-center gap-2">
                              <FontAwesomeIcon icon="spinner" className="h-3.5 w-3.5 animate-spin-slow" />
                              <span>In Progress</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="completed">
                            <div className="flex items-center gap-2">
                              <FontAwesomeIcon icon="check-circle" className="h-3.5 w-3.5" />
                              <span>Completed</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="cancelled">
                            <div className="flex items-center gap-2">
                              <FontAwesomeIcon icon="times-circle" className="h-3.5 w-3.5" />
                              <span>Cancelled</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="outline" className={getStatusColor(task.status)}>
                        <FontAwesomeIcon 
                          icon={getStatusIcon(task.status)} 
                          className={`mr-1 h-3 w-3 ${task.status === 'in_progress' ? 'animate-spin-slow' : ''}`} 
                        />
                        <span className="capitalize">
                          {task.status.replace('_', ' ')}
                        </span>
                      </Badge>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    {task.dueDate ? (
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <span className="text-sm cursor-help">
                            {getDueDateDisplay(task.dueDate)}
                          </span>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-52">
                          <div className="text-xs text-muted-foreground">
                            Due on: {format(new Date(task.dueDate), 'PPP')}
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    ) : (
                      <span className="text-muted-foreground">No due date</span>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <Badge className={getPriorityColor(task.priority)}>
                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                    </Badge>
                  </TableCell>
                  
                  <TableCell className="text-right">
                    {!readonly && (
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditTask(task)}
                        >
                          <FontAwesomeIcon icon="edit" className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => onDeleteTask(task.id)}
                        >
                          <FontAwesomeIcon icon="trash" className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}