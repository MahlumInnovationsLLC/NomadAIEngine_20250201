import React, { useState, useMemo } from 'react';
import { InspectionTemplate } from '@/types/manufacturing/templates';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Edit, 
  Copy, 
  Archive, 
  MoreVertical, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Download,
  Trash
} from 'lucide-react';

export interface TemplateListProps {
  templates: InspectionTemplate[];
  onSelectTemplate: (template: InspectionTemplate) => void;
  onEditTemplate: (template: InspectionTemplate) => void;
  onDuplicateTemplate: (template: InspectionTemplate) => void;
  onToggleArchive: (template: InspectionTemplate) => void;
  filter: string;
  onFilterChange: (filter: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function TemplateList({
  templates,
  onSelectTemplate,
  onEditTemplate,
  onDuplicateTemplate,
  onToggleArchive,
  filter,
  onFilterChange,
  searchQuery,
  onSearchChange
}: TemplateListProps) {
  // Local state for table sorting
  const [sortField, setSortField] = useState<keyof InspectionTemplate>('updatedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Handle sort click
  const handleSort = (field: keyof InspectionTemplate) => {
    if (field === sortField) {
      // If already sorting by this field, toggle direction
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New sort field
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Apply filters and search
  const filteredTemplates = useMemo(() => {
    let result = [...templates];
    
    // Apply active/archived filter
    if (filter === 'active') {
      result = result.filter(template => template.isActive && !template.isArchived);
    } else if (filter === 'archived') {
      result = result.filter(template => template.isArchived);
    } else if (filter === 'inactive') {
      result = result.filter(template => !template.isActive && !template.isArchived);
    }
    
    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(template => 
        template.name.toLowerCase().includes(query) ||
        template.category.toLowerCase().includes(query) ||
        template.description?.toLowerCase().includes(query) ||
        template.standard?.toLowerCase().includes(query)
      );
    }
    
    // Apply sorting
    return result.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      // Special case for string comparisons
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      }
      
      // Handle dates
      if (sortField === 'createdAt' || sortField === 'updatedAt') {
        const aDate = new Date(a[sortField] as string).getTime();
        const bDate = new Date(b[sortField] as string).getTime();
        return sortDirection === 'asc' ? aDate - bDate : bDate - aDate;
      }
      
      // Generic comparison
      if (aValue === bValue) return 0;
      if (aValue === undefined) return sortDirection === 'asc' ? -1 : 1;
      if (bValue === undefined) return sortDirection === 'asc' ? 1 : -1;
      
      return sortDirection === 'asc'
        ? (aValue < bValue ? -1 : 1)
        : (aValue < bValue ? 1 : -1);
    });
  }, [templates, filter, searchQuery, sortField, sortDirection]);
  
  // Get unique categories for filters
  const categories = useMemo(() => {
    const uniqueCategories = new Set<string>();
    templates.forEach(template => uniqueCategories.add(template.category));
    return Array.from(uniqueCategories).sort();
  }, [templates]);
  
  // Get sorted sections count
  const getSectionCount = (template: InspectionTemplate): number => {
    return template.sections.length;
  };
  
  // Get total fields count
  const getFieldCount = (template: InspectionTemplate): number => {
    return template.sections.reduce(
      (total, section) => total + section.fields.length, 
      0
    );
  };
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex-1 flex items-center relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder="Search templates by name, category, or description"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={onFilterChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter Templates" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">All Templates</SelectItem>
                <SelectItem value="active">Active Templates</SelectItem>
                <SelectItem value="inactive">Inactive Templates</SelectItem>
                <SelectItem value="archived">Archived Templates</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-10 border rounded-md">
          <FileText className="h-16 w-16 mx-auto text-muted-foreground opacity-20" />
          <h3 className="mt-4 font-medium">No Templates Found</h3>
          {searchQuery ? (
            <p className="text-sm text-muted-foreground mt-1">
              No templates match your search criteria
            </p>
          ) : filter !== 'all' ? (
            <p className="text-sm text-muted-foreground mt-1">
              No {filter} templates available
            </p>
          ) : (
            <p className="text-sm text-muted-foreground mt-1">
              Start by creating your first inspection template
            </p>
          )}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="w-[300px] cursor-pointer"
                  onClick={() => handleSort('name')}
                >
                  Name
                  {sortField === 'name' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort('category')}
                >
                  Category
                  {sortField === 'category' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </TableHead>
                <TableHead className="text-center">Sections</TableHead>
                <TableHead className="text-center">Fields</TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort('updatedAt')}
                >
                  Last Updated
                  {sortField === 'updatedAt' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTemplates.map((template) => (
                <TableRow 
                  key={template.id} 
                  className={`cursor-pointer ${template.isArchived ? 'opacity-60' : ''}`}
                  onClick={() => onSelectTemplate(template)}
                >
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{template.name}</span>
                      {template.standard && (
                        <span className="text-xs text-muted-foreground mt-1">
                          Standard: {template.standard}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{template.category}</Badge>
                  </TableCell>
                  <TableCell className="text-center">{getSectionCount(template)}</TableCell>
                  <TableCell className="text-center">{getFieldCount(template)}</TableCell>
                  <TableCell>{formatDate(template.updatedAt)}</TableCell>
                  <TableCell className="text-center">
                    {template.isArchived ? (
                      <Badge variant="outline" className="bg-amber-100 text-amber-800">
                        <Archive className="mr-1 h-3 w-3" />
                        Archived
                      </Badge>
                    ) : template.isActive ? (
                      <Badge variant="outline" className="bg-green-100 text-green-800">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-gray-100 text-gray-800">
                        <XCircle className="mr-1 h-3 w-3" />
                        Inactive
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onSelectTemplate(template)}>
                            <FileText className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEditTemplate(template)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Template
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onDuplicateTemplate(template)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onToggleArchive(template)}>
                            {template.isArchived ? (
                              <>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Restore Template
                              </>
                            ) : (
                              <>
                                <Archive className="mr-2 h-4 w-4" />
                                Archive Template
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      
      <div className="flex justify-between items-center text-sm text-muted-foreground pt-2">
        <div>
          Showing {filteredTemplates.length} of {templates.length} templates
        </div>
        
        {filter === 'all' && searchQuery === '' && (
          <div>
            {templates.filter(t => t.isActive && !t.isArchived).length} active, 
            {' '}{templates.filter(t => !t.isActive && !t.isArchived).length} inactive, 
            {' '}{templates.filter(t => t.isArchived).length} archived
          </div>
        )}
      </div>
    </div>
  );
}