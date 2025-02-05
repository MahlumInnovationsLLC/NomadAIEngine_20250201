```typescript
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
import { useQuery } from "@tanstack/react-query";
import type { Project } from "@/types/manufacturing";
import { format } from "date-fns";

type SortConfig = {
  key: keyof Project;
  direction: 'asc' | 'desc';
};

export function ProjectTableView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig>({ 
    key: 'projectNumber', 
    direction: 'asc' 
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });

  // Sort and filter projects
  const sortedProjects = useMemo(() => {
    const filtered = projects.filter(project => 
      project.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
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

  const formatDate = (date: string | undefined) => {
    if (!date) return '-';
    return format(new Date(date), 'MMM d, yyyy');
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
                onClick={() => handleSort('name')}
              >
                Name {renderSortIcon('name')}
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
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort('status')}
              >
                Status {renderSortIcon('status')}
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort('progress')}
              >
                Progress {renderSortIcon('progress')}
              </TableHead>
              <TableHead>Contract Date</TableHead>
              <TableHead>Ship Date</TableHead>
              <TableHead>Delivery Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedProjects.map((project) => (
              <TableRow key={project.id}>
                <TableCell className="font-medium">
                  {project.projectNumber}
                </TableCell>
                <TableCell>{project.name}</TableCell>
                <TableCell>{project.location}</TableCell>
                <TableCell>{project.team}</TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <span className={`
                      inline-block w-2 h-2 rounded-full mr-2
                      ${project.status === 'IN FAB' ? 'bg-blue-500' :
                        project.status === 'IN ASSEMBLY' ? 'bg-yellow-500' :
                        project.status === 'IN WRAP' ? 'bg-purple-500' :
                        project.status === 'IN NTC TESTING' ? 'bg-orange-500' :
                        project.status === 'IN QC' ? 'bg-pink-500' :
                        project.status === 'COMPLETED' ? 'bg-green-500' :
                        'bg-gray-500'}
                    `} />
                    {project.status}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary rounded-full h-2"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {project.progress}%
                  </span>
                </TableCell>
                <TableCell>{formatDate(project.contractDate)}</TableCell>
                <TableCell>{formatDate(project.ship)}</TableCell>
                <TableCell>{formatDate(project.delivery)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
```
