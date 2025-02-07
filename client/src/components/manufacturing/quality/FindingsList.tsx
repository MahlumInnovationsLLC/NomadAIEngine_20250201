import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { Card } from "@/components/ui/card";
import type { Finding } from "@/types/manufacturing";

interface SortConfig {
  key: keyof Finding;
  direction: 'asc' | 'desc';
}

export default function FindingsList() {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'createdAt', direction: 'desc' });
  const [departmentFilter, setDepartmentFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  const { data: findings, isLoading } = useQuery<Finding[]>({
    queryKey: ['/api/manufacturing/quality/audits/findings'],
  });

  const handleSort = (key: keyof Finding) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const filteredAndSortedFindings = findings
    ?.filter(finding => 
      (!departmentFilter || finding.department === departmentFilter) &&
      (!typeFilter || finding.type === typeFilter)
    )
    .sort((a, b) => {
      const direction = sortConfig.direction === 'asc' ? 1 : -1;
      if (a[sortConfig.key] < b[sortConfig.key]) return -1 * direction;
      if (a[sortConfig.key] > b[sortConfig.key]) return 1 * direction;
      return 0;
    }) || [];

  if (isLoading) {
    return <div>Loading findings...</div>;
  }

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <div className="space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <FontAwesomeIcon icon="filter" className="mr-2 h-4 w-4" />
                Department: {departmentFilter || 'All'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setDepartmentFilter(null)}>
                All Departments
              </DropdownMenuItem>
              {Array.from(new Set(findings?.map(f => f.department))).map(dept => (
                <DropdownMenuItem key={dept} onClick={() => setDepartmentFilter(dept)}>
                  {dept}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <FontAwesomeIcon icon="tag" className="mr-2 h-4 w-4" />
                Type: {typeFilter || 'All'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setTypeFilter(null)}>
                All Types
              </DropdownMenuItem>
              {['observation', 'minor', 'major', 'opportunity'].map(type => (
                <DropdownMenuItem key={type} onClick={() => setTypeFilter(type)}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Button variant="outline" onClick={() => window.print()}>
          <FontAwesomeIcon icon="download" className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead 
              className="cursor-pointer"
              onClick={() => handleSort('id')}
            >
              ID {sortConfig.key === 'id' && (
                <FontAwesomeIcon 
                  icon={sortConfig.direction === 'asc' ? 'arrow-up' : 'arrow-down'} 
                  className="ml-2 h-4 w-4" 
                />
              )}
            </TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => handleSort('type')}
            >
              Type {sortConfig.key === 'type' && (
                <FontAwesomeIcon 
                  icon={sortConfig.direction === 'asc' ? 'arrow-up' : 'arrow-down'} 
                  className="ml-2 h-4 w-4" 
                />
              )}
            </TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => handleSort('department')}
            >
              Department {sortConfig.key === 'department' && (
                <FontAwesomeIcon 
                  icon={sortConfig.direction === 'asc' ? 'arrow-up' : 'arrow-down'} 
                  className="ml-2 h-4 w-4" 
                />
              )}
            </TableHead>
            <TableHead>Description</TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => handleSort('status')}
            >
              Status {sortConfig.key === 'status' && (
                <FontAwesomeIcon 
                  icon={sortConfig.direction === 'asc' ? 'arrow-up' : 'arrow-down'} 
                  className="ml-2 h-4 w-4" 
                />
              )}
            </TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => handleSort('createdAt')}
            >
              Created {sortConfig.key === 'createdAt' && (
                <FontAwesomeIcon 
                  icon={sortConfig.direction === 'asc' ? 'arrow-up' : 'arrow-down'} 
                  className="ml-2 h-4 w-4" 
                />
              )}
            </TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredAndSortedFindings.map((finding) => (
            <TableRow key={finding.id}>
              <TableCell>{finding.id}</TableCell>
              <TableCell>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  finding.type === 'major' ? 'bg-red-100 text-red-800' :
                  finding.type === 'minor' ? 'bg-yellow-100 text-yellow-800' :
                  finding.type === 'observation' ? 'bg-blue-100 text-blue-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {finding.type.charAt(0).toUpperCase() + finding.type.slice(1)}
                </span>
              </TableCell>
              <TableCell>{finding.department}</TableCell>
              <TableCell className="max-w-md truncate">{finding.description}</TableCell>
              <TableCell>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  finding.status === 'open' ? 'bg-red-100 text-red-800' :
                  finding.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {finding.status.replace('_', ' ').charAt(0).toUpperCase() + finding.status.slice(1)}
                </span>
              </TableCell>
              <TableCell>{new Date(finding.createdAt).toLocaleDateString()}</TableCell>
              <TableCell>
                <Button variant="ghost" size="sm">
                  <FontAwesomeIcon icon="eye" className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
