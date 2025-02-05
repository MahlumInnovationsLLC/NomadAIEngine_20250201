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

interface ProjectTableViewProps {
  projects: Project[];
}

type SortConfig = {
  key: keyof Project;
  direction: 'asc' | 'desc';
};

export function ProjectTableView({ projects }: ProjectTableViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig>({ 
    key: 'projectNumber', 
    direction: 'asc' 
  });

  // Sort and filter projects
  const sortedProjects = useMemo(() => {
    const filtered = projects.filter(project => 
      project.projectNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.location?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return [...filtered].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (!aValue || !bValue) return 0;

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

      return 0;
    });
  }, [projects, searchQuery, sortConfig]);

  const handleSort = (key: keyof Project) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const renderSortIcon = (key: keyof Project) => {
    if (sortConfig.key !== key) {
      return <FontAwesomeIcon icon="sort" className="ml-2 h-4 w-4 text-muted-foreground" />;
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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Input
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        <Button>
          <FontAwesomeIcon icon="download" className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort('projectNumber')}
              >
                Project Number {renderSortIcon('projectNumber')}
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort('status')}
              >
                Status {renderSortIcon('status')}
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort('location')}
              >
                Location {renderSortIcon('location')}
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort('team')}
              >
                Team {renderSortIcon('team')}
              </TableHead>
              <TableHead>
                Contract Date
              </TableHead>
              <TableHead>
                NTC Testing
              </TableHead>
              <TableHead>
                QC Start
              </TableHead>
              <TableHead>
                Ship Date
              </TableHead>
              <TableHead>
                Delivery Date
              </TableHead>
              <TableHead>
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedProjects.map((project) => (
              <TableRow key={project.id}>
                <TableCell className="font-medium">
                  {project.projectNumber}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(project.status)}`} />
                    {project.status}
                  </div>
                </TableCell>
                <TableCell>{project.location || '-'}</TableCell>
                <TableCell>{project.team || '-'}</TableCell>
                <TableCell>{formatDate(project.contractDate)}</TableCell>
                <TableCell>{formatDate(project.ntcTesting)}</TableCell>
                <TableCell>{formatDate(project.qcStart)}</TableCell>
                <TableCell>{formatDate(project.ship)}</TableCell>
                <TableCell>{formatDate(project.delivery)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <FontAwesomeIcon icon="edit" className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <FontAwesomeIcon icon="eye" className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}