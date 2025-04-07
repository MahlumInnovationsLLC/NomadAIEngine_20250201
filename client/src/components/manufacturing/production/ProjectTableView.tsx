import { useState, useMemo, useEffect, useRef } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import type { Project } from "@/types/manufacturing";
import { format } from "date-fns";
import { AddColumnDialog, CustomColumn } from "./AddColumnDialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface ProjectTableViewProps {
  projects: Project[];
  onEdit?: (project: Project) => void;
  onView?: (project: Project) => void;
}

type SortConfig = {
  key: keyof Project | string;
  direction: 'asc' | 'desc';
};

export function ProjectTableView({ projects, onEdit, onView }: ProjectTableViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig>({ 
    key: 'ship', // Default sort by ship date
    direction: 'asc' 
  });
  const [customColumns, setCustomColumns] = useState<CustomColumn[]>([]);
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [customValues, setCustomValues] = useState<Record<string, Record<string, string>>>({});
  const [isSyncing, setIsSyncing] = useState(false);
  const [dataState, setDataState] = useState<'loading' | 'loaded' | 'empty' | 'error'>('loading');
  const projectsRef = useRef<Project[]>([]);
  
  const queryClient = useQueryClient();
  
  // Debug and validation of project data
  useEffect(() => {
    if (!projects) {
      console.warn('ProjectTableView: projects is undefined or null');
      setDataState('error');
      return;
    }
    
    if (!Array.isArray(projects)) {
      console.error('ProjectTableView: projects is not an array:', projects);
      setDataState('error');
      return;
    }
    
    if (projects.length === 0) {
      console.log('ProjectTableView: projects array is empty');
      setDataState('empty');
      return;
    }
    
    console.log(`ProjectTableView: Received ${projects.length} projects`);
    
    // Debug: Log some sample project data
    if (projects.length > 0) {
      console.log('ProjectTableView: First project sample:', projects[0]);
    }
    
    // Store the projects in a ref for fallback if needed
    projectsRef.current = projects;
    setDataState('loaded');
  }, [projects]);

  // Save custom columns mutation
  const saveCustomColumnsMutation = useMutation({
    mutationFn: async (data: { 
      columns: CustomColumn[], 
      values: Record<string, Record<string, string>> 
    }) => {
      const response = await fetch('/api/manufacturing/projects/custom-columns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to save custom columns');
      return response.json();
    },
    onMutate: () => {
      setIsSyncing(true);
    },
    onSettled: () => {
      setTimeout(() => setIsSyncing(false), 1000);
    }
  });

  // Handle custom column value changes
  const handleCustomValueChange = (projectId: string, columnId: string, value: string) => {
    const newValues = {
      ...customValues,
      [projectId]: {
        ...(customValues[projectId] || {}),
        [columnId]: value
      }
    };
    setCustomValues(newValues);
    saveCustomColumnsMutation.mutate({ columns: customColumns, values: newValues });
  };

  // Add new custom column
  const handleAddColumn = (column: CustomColumn) => {
    const newColumns = [...customColumns, column];
    setCustomColumns(newColumns);
    saveCustomColumnsMutation.mutate({ columns: newColumns, values: customValues });
  };

  // Sort and filter projects with defensive coding
  const sortedProjects = useMemo(() => {
    // Ensure we have valid project data
    if (!projects || !Array.isArray(projects) || projects.length === 0) {
      // Return empty array or fallback to cached data if available
      return projectsRef.current.length > 0 ? projectsRef.current : [];
    }
    
    try {
      // Safely filter projects
      const filtered = projects.filter(project => {
        if (!project) return false;
        
        try {
          return Object.values(project).some(value => {
            if (value === null || value === undefined) return false;
            try {
              return value.toString().toLowerCase().includes(searchQuery.toLowerCase());
            } catch (e) {
              console.warn('Error converting value to string:', value, e);
              return false;
            }
          });
        } catch (e) {
          console.warn('Error filtering project:', project, e);
          return false;
        }
      });

      // Safely sort projects - COMPLETED projects always go to the bottom
      return [...filtered].sort((a, b) => {
        try {
          // First, always move COMPLETED projects to the bottom
          const aCompleted = a.status === "COMPLETED";
          const bCompleted = b.status === "COMPLETED";
          
          if (aCompleted && !bCompleted) return 1; // a is completed, b is not, so a goes after b
          if (!aCompleted && bCompleted) return -1; // a is not completed, b is, so a goes before b
          
          // If both are completed or both are not completed, continue with regular sorting
          
          // Custom columns
          if (sortConfig.key.startsWith('custom_')) {
            const aValue = customValues[a.id]?.[sortConfig.key] || '';
            const bValue = customValues[b.id]?.[sortConfig.key] || '';
            return sortConfig.direction === 'asc'
              ? aValue.localeCompare(bValue)
              : bValue.localeCompare(aValue);
          }

          // Handle normal columns
          const aValue = a[sortConfig.key as keyof Project];
          const bValue = b[sortConfig.key as keyof Project];

          if (!aValue && !bValue) return 0;
          if (!aValue) return sortConfig.direction === 'asc' ? 1 : -1;
          if (!bValue) return sortConfig.direction === 'asc' ? -1 : 1;

          if (typeof aValue === 'string' && typeof bValue === 'string') {
            return sortConfig.direction === 'asc' 
              ? aValue.localeCompare(bValue)
              : bValue.localeCompare(aValue);
          }

          if (typeof aValue === 'number' && typeof bValue === 'number') {
            return sortConfig.direction === 'asc'
              ? aValue - bValue
              : bValue - aValue;
          }

          // Handle date comparisons
          if (aValue && bValue) {
            try {
              // Check if value can be converted to a date
              const isDateValue = (val: any): boolean => {
                if (val instanceof Date) return true;
                if (typeof val === 'string' || typeof val === 'number') {
                  const date = new Date(val);
                  return !isNaN(date.getTime());
                }
                return false;
              };
              
              if (isDateValue(aValue) && isDateValue(bValue)) {
                // Create new Date objects regardless - we've already verified they're valid date values
                const aDate = new Date(aValue as string | number);
                const bDate = new Date(bValue as string | number);
                
                if (!isNaN(aDate.getTime()) && !isNaN(bDate.getTime())) {
                  return sortConfig.direction === 'asc'
                    ? aDate.getTime() - bDate.getTime()
                    : bDate.getTime() - aDate.getTime();
                }
              }
            } catch (e) {
              console.warn('Error comparing dates:', aValue, bValue, e);
            }
          }

          return 0;
        } catch (e) {
          console.error('Error sorting projects:', e);
          return 0;
        }
      });
    } catch (e) {
      console.error('Critical error in project sorting:', e);
      // Return original projects or cached ones as fallback
      return projectsRef.current.length > 0 ? projectsRef.current : projects;
    }
  }, [projects, searchQuery, sortConfig, customValues]);

  const handleSort = (key: keyof Project | string) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const renderSortIcon = (key: keyof Project | string) => {
    if (sortConfig.key !== key) {
      return null;
    }
    return (
      <FontAwesomeIcon 
        icon={sortConfig.direction === 'asc' ? 'sort-up' : 'sort-down'} 
        className="ml-2 h-4 w-4 text-primary"
      />
    );
  };

  const formatDate = (date: string | undefined | null) => {
    if (!date) return '-';
    return format(new Date(date), 'MMM d, yyyy');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NOT STARTED':
        return 'bg-gray-500';
      case 'IN FAB':
        return 'bg-blue-500';
      case 'IN ASSEMBLY':
        return 'bg-indigo-500';
      case 'IN WRAP':
        return 'bg-purple-500';
      case 'IN NTC TESTING':
        return 'bg-orange-500';
      case 'IN QC':
        return 'bg-yellow-500';
      case 'COMPLETED':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatPercentage = (value: string | number | undefined | null) => {
    if (value === undefined || value === null) return '-';
    return `${value}%`;
  };

  // Render loading state
  if (dataState === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-lg font-medium">Loading production projects...</p>
      </div>
    );
  }
  
  // Render error state
  if (dataState === 'error') {
    return (
      <Alert variant="destructive" className="mb-4">
        <FontAwesomeIcon icon="exclamation-circle" className="h-4 w-4 mr-2" />
        <AlertTitle>Error Loading Projects</AlertTitle>
        <AlertDescription>
          There was an error loading the production projects. The connection to the data source may be unavailable.
          <div className="mt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setDataState('loading');
                // Trigger a query client invalidation to attempt a refresh
                queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/projects'] });
              }}
            >
              <FontAwesomeIcon icon="sync" className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }
  
  // Render empty state
  if (dataState === 'empty' || sortedProjects.length === 0) {
    return (
      <div className="bg-muted/50 rounded-lg p-8 text-center">
        <FontAwesomeIcon icon="folder-open" className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-xl font-medium mb-2">No Projects Found</h3>
        <p className="text-muted-foreground mb-6">
          {searchQuery 
            ? `No projects match your search criteria "${searchQuery}".` 
            : "There are no production projects to display."}
        </p>
        {searchQuery && (
          <Button variant="outline" onClick={() => setSearchQuery('')}>
            <FontAwesomeIcon icon="times" className="mr-2 h-4 w-4" />
            Clear Search
          </Button>
        )}
        <Button 
          className="ml-2" 
          onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/projects'] })}
        >
          <FontAwesomeIcon icon="sync" className="mr-2 h-4 w-4" />
          Refresh Data
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Input
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex gap-2 items-center">
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/projects'] })}>
            <FontAwesomeIcon icon="sync" className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={() => setShowAddColumn(true)}>
            <FontAwesomeIcon icon="plus" className="mr-2 h-4 w-4" />
            Add Column
          </Button>
          {isSyncing ? (
            <FontAwesomeIcon icon="cloud-arrow-up" className="h-4 w-4 text-muted-foreground animate-pulse" />
          ) : (
            <FontAwesomeIcon icon="cloud-check" className="h-4 w-4 text-green-500" />
          )}
          <Button>
            <FontAwesomeIcon icon="download" className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer whitespace-nowrap sticky left-0 bg-background"
                onClick={() => handleSort('projectNumber')}
              >
                Project Number {renderSortIcon('projectNumber')}
              </TableHead>
              <TableHead 
                className="cursor-pointer whitespace-nowrap"
                onClick={() => handleSort('status')}
              >
                Status {renderSortIcon('status')}
              </TableHead>
              <TableHead 
                className="cursor-pointer whitespace-nowrap"
                onClick={() => handleSort('location')}
              >
                Location {renderSortIcon('location')}
              </TableHead>
              <TableHead 
                className="cursor-pointer whitespace-nowrap"
                onClick={() => handleSort('team')}
              >
                Team {renderSortIcon('team')}
              </TableHead>
              <TableHead 
                className="cursor-pointer whitespace-nowrap"
                onClick={() => handleSort('fabricationStart')}
              >
                Fabrication Start {renderSortIcon('fabricationStart')}
              </TableHead>
              <TableHead 
                className="cursor-pointer whitespace-nowrap"
                onClick={() => handleSort('assemblyStart')}
              >
                Assembly Start {renderSortIcon('assemblyStart')}
              </TableHead>
              <TableHead 
                className="cursor-pointer whitespace-nowrap"
                onClick={() => handleSort('wrapGraphics')}
              >
                Wrap Graphics {renderSortIcon('wrapGraphics')}
              </TableHead>
              <TableHead 
                className="cursor-pointer whitespace-nowrap"
                onClick={() => handleSort('ntcTesting')}
              >
                NTC Testing {renderSortIcon('ntcTesting')}
              </TableHead>
              <TableHead 
                className="cursor-pointer whitespace-nowrap"
                onClick={() => handleSort('qcStart')}
              >
                QC Start {renderSortIcon('qcStart')}
              </TableHead>
              <TableHead 
                className="cursor-pointer whitespace-nowrap"
                onClick={() => handleSort('executiveReview')}
              >
                Executive Review {renderSortIcon('executiveReview')}
              </TableHead>
              <TableHead 
                className="cursor-pointer whitespace-nowrap"
                onClick={() => handleSort('ship')}
              >
                Ship Date {renderSortIcon('ship')}
              </TableHead>
              <TableHead 
                className="cursor-pointer whitespace-nowrap"
                onClick={() => handleSort('delivery')}
              >
                Delivery Date {renderSortIcon('delivery')}
              </TableHead>
              <TableHead 
                className="cursor-pointer whitespace-nowrap"
                onClick={() => handleSort('meAssigned')}
              >
                ME Assigned {renderSortIcon('meAssigned')}
              </TableHead>
              <TableHead 
                className="cursor-pointer whitespace-nowrap"
                onClick={() => handleSort('eeAssigned')}
              >
                EE Assigned {renderSortIcon('eeAssigned')}
              </TableHead>
              <TableHead 
                className="cursor-pointer whitespace-nowrap"
                onClick={() => handleSort('meCadProgress')}
              >
                ME Progress {renderSortIcon('meCadProgress')}
              </TableHead>
              <TableHead 
                className="cursor-pointer whitespace-nowrap"
                onClick={() => handleSort('eeDesignProgress')}
              >
                EE Progress {renderSortIcon('eeDesignProgress')}
              </TableHead>
              {/* Custom Columns */}
              {customColumns.map(column => (
                <TableHead
                  key={column.id}
                  className="cursor-pointer whitespace-nowrap"
                  onClick={() => handleSort(column.id)}
                >
                  {column.title} {renderSortIcon(column.id)}
                </TableHead>
              ))}
              
              <TableHead 
                className="cursor-pointer whitespace-nowrap"
                onClick={() => handleSort('dpasRating')}
              >
                DPAS Rating {renderSortIcon('dpasRating')}
              </TableHead>
              <TableHead 
                className="cursor-pointer whitespace-nowrap"
                onClick={() => handleSort('chassisEta')}
              >
                Chassis ETA {renderSortIcon('chassisEta')}
              </TableHead>
              <TableHead 
                className="cursor-pointer whitespace-nowrap"
                onClick={() => handleSort('contractDate')}
              >
                Contract Date {renderSortIcon('contractDate')}
              </TableHead>

              <TableHead className="whitespace-nowrap sticky right-0 bg-background">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedProjects.map((project) => (
              <TableRow key={project.id}>
                <TableCell className="font-medium whitespace-nowrap sticky left-0 bg-background">
                  {project.projectNumber}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(project.status)}`} />
                    {project.status}
                  </div>
                </TableCell>
                <TableCell className="whitespace-nowrap">{project.location || '-'}</TableCell>
                <TableCell className="whitespace-nowrap">{project.team || '-'}</TableCell>
                <TableCell className="whitespace-nowrap">{formatDate(project.fabricationStart)}</TableCell>
                <TableCell className="whitespace-nowrap">{formatDate(project.assemblyStart)}</TableCell>
                <TableCell className="whitespace-nowrap">{formatDate(project.wrapGraphics)}</TableCell>
                <TableCell className="whitespace-nowrap">{formatDate(project.ntcTesting)}</TableCell>
                <TableCell className="whitespace-nowrap">{formatDate(project.qcStart)}</TableCell>
                <TableCell className="whitespace-nowrap">{formatDate(project.executiveReview)}</TableCell>
                <TableCell className="whitespace-nowrap">{formatDate(project.ship)}</TableCell>
                <TableCell className="whitespace-nowrap">{formatDate(project.delivery)}</TableCell>
                <TableCell className="whitespace-nowrap">{project.meAssigned || '-'}</TableCell>
                <TableCell className="whitespace-nowrap">{project.eeAssigned || '-'}</TableCell>
                <TableCell className="whitespace-nowrap">{formatPercentage(project.meCadProgress)}</TableCell>
                <TableCell className="whitespace-nowrap">{formatPercentage(project.eeDesignProgress)}</TableCell>
                {/* Custom Column Cells */}
                {customColumns.map(column => (
                  <TableCell key={column.id} className="whitespace-nowrap">
                    <Input
                      type={column.type === 'number' ? 'number' : 'text'}
                      value={customValues[project.id]?.[column.id] || ''}
                      onChange={(e) => handleCustomValueChange(project.id, column.id, e.target.value)}
                      className="h-8 w-full"
                    />
                  </TableCell>
                ))}
                
                <TableCell className="whitespace-nowrap">{project.dpasRating || '-'}</TableCell>
                <TableCell className="whitespace-nowrap">{formatDate(project.chassisEta)}</TableCell>
                <TableCell className="whitespace-nowrap">{formatDate(project.contractDate)}</TableCell>
                
                <TableCell className="whitespace-nowrap sticky right-0 bg-background">
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => onEdit?.(project)}
                    >
                      <FontAwesomeIcon icon="edit" className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => onView?.(project)}
                    >
                      <FontAwesomeIcon icon="eye" className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AddColumnDialog
        open={showAddColumn}
        onOpenChange={setShowAddColumn}
        onAddColumn={handleAddColumn}
      />
    </div>
  );
}