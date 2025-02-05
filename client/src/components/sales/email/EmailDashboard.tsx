import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faEye, faPaperPlane, faCheck, faClock } from "@fortawesome/free-solid-svg-icons";

const mockEmailTemplates = [
  {
    id: 1,
    name: "Initial Contact",
    subject: "Discussing Manufacturing Solutions for [Company]",
    body: "Dear [Name],\n\nI hope this email finds you well...",
    usageCount: 45,
    openRate: "68%"
  },
  {
    id: 2,
    name: "Follow-up Meeting",
    subject: "Next Steps - [Company] Manufacturing Project",
    body: "Hi [Name],\n\nThank you for your time yesterday...",
    usageCount: 32,
    openRate: "75%"
  }
];

const mockEmailActivity = [
  {
    id: 1,
    recipient: "Michael Chen",
    company: "TechCorp Industries",
    subject: "Manufacturing Solutions Proposal",
    sentAt: "2025-02-04T10:30:00",
    status: "opened",
    openCount: 3
  },
  {
    id: 2,
    recipient: "Lisa Rodriguez",
    company: "Global Manufacturing Co",
    subject: "Follow-up: Assembly System Discussion",
    sentAt: "2025-02-04T14:15:00",
    status: "sent",
    openCount: 0
  }
];

export function EmailDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Email Communications</h2>
          <p className="text-muted-foreground">Manage and track your sales emails</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <FontAwesomeIcon icon={faPaperPlane} className="mr-2" />
              New Email
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[625px]">
            <DialogHeader>
              <DialogTitle>Compose Email</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="recipient">To</Label>
                <Input id="recipient" placeholder="Enter recipient email" />
              </div>
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" placeholder="Enter email subject" />
              </div>
              <div>
                <Label htmlFor="template">Template</Label>
                <select className="w-full px-3 py-2 border rounded-md">
                  <option value="">Select a template</option>
                  {mockEmailTemplates.map(template => (
                    <option key={template.id} value={template.id}>{template.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" rows={6} />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Email Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Template Name</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Open Rate</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockEmailTemplates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell>{template.name}</TableCell>
                    <TableCell>{template.usageCount} times</TableCell>
                    <TableCell>{template.openRate}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Email Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockEmailActivity.map((email) => (
                  <TableRow key={email.id}>
                    <TableCell>
                      <div>
                        <div>{email.recipient}</div>
                        <div className="text-sm text-muted-foreground">{email.company}</div>
                      </div>
                    </TableCell>
                    <TableCell>{email.subject}</TableCell>
                    <TableCell>
                      <Badge variant={email.status === 'opened' ? 'default' : 'secondary'}>
                        <FontAwesomeIcon 
                          icon={email.status === 'opened' ? faEye : faClock} 
                          className="mr-1" 
                        />
                        {email.status === 'opened' ? `Opened (${email.openCount}x)` : 'Sent'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(email.sentAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
