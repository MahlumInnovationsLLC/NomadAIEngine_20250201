import { useState } from 'react';
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { InspectionTemplate } from '@/types/manufacturing/templates';
import { MoreHorizontal, FileEdit, Copy, Trash2 } from 'lucide-react';

interface TemplateListProps {
  templates: InspectionTemplate[];
  onSelectTemplate: (template: InspectionTemplate) => void;
  onEditTemplate?: (template: InspectionTemplate) => void;
  onDuplicateTemplate?: (template: InspectionTemplate) => void;
  onDeleteTemplate?: (templateId: string) => void;
}

export function TemplateList({
  templates,
  onSelectTemplate,
  onEditTemplate,
  onDuplicateTemplate,
  onDeleteTemplate
}: TemplateListProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSelectTemplate = (template: InspectionTemplate) => {
    setSelectedId(template.id);
    onSelectTemplate(template);
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Sections</TableHead>
            <TableHead>Version</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {templates.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-4">
                No templates found
              </TableCell>
            </TableRow>
          ) : (
            templates.map((template) => (
              <TableRow 
                key={template.id} 
                className={`cursor-pointer ${selectedId === template.id ? 'bg-accent' : ''}`}
                onClick={() => handleSelectTemplate(template)}
              >
                <TableCell className="font-medium">{template.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">{template.category}</Badge>
                </TableCell>
                <TableCell>{template.sections.length}</TableCell>
                <TableCell>v{template.version}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {onEditTemplate && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditTemplate(template);
                          }}
                        >
                          <FileEdit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                      )}
                      {onDuplicateTemplate && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onDuplicateTemplate(template);
                          }}
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicate
                        </DropdownMenuItem>
                      )}
                      {onDeleteTemplate && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            if (template.id) {
                              onDeleteTemplate(template.id);
                            }
                          }}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}