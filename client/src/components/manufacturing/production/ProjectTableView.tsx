import { useState, useMemo } from "react";
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
    key: 'projectNumber', 
    direction: 'asc' 
  });
  const [customColumns, setCustomColumns] = useState<CustomColumn[]>([]);
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [customValues, setCustomValues] = useState<Record<string, Record<string, string>>>({});
  const [isSyncing, setIsSyncing] = useState(false);

  const queryClient = useQueryClient();

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

  // Sort and filter projects
  const sortedProjects = useMemo(() => {
    const filtered = projects.filter(project => 
      Object.values(project).some(value => 
        value && value.toString().toLowerCase().includes(searchQuery.toLowerCase())
      )
    );

    return [...filtered].sort((a, b) => {
      if (sortConfig.key.startsWith('custom_')) {
        const aValue = customValues[a.id]?.[sortConfig.key] || '';
        const bValue = customValues[b.id]?.[sortConfig.key] || '';
        return sortConfig.direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

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

      if (aValue instanceof Date && bValue instanceof Date) {
        return sortConfig.direction === 'asc'
          ? aValue.getTime() - bValue.getTime()
          : bValue.getTime() - aValue.getTime();
      }

      return 0;
    });
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

  const formatPercentage = (value: number | undefined | null) => {
    if (value === undefined || value === null) return '-';
    return `${value}%`;
  };

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
                <TableCell className="whitespace-nowrap">{project.dpasRating || '-'}</TableCell>
                <TableCell className="whitespace-nowrap">{formatDate(project.chassisEta)}</TableCell>
                <TableCell className="whitespace-nowrap">{formatDate(project.contractDate)}</TableCell>
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