import { useState } from "react";
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

export interface QMSFilterOptions {
  search: string;
  status: string[];
  type: string[];
  severity: string[];
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
  department?: string;
  priority?: string[];
  assignedTo?: string;
  [key: string]: any;
}

interface QMSFiltersProps {
  title: string;
  description: string;
  options: {
    statuses: Array<{ value: string; label: string }>;
    types: Array<{ value: string; label: string }>;
    severities: Array<{ value: string; label: string }>;
    priorities?: Array<{ value: string; label: string }>;
    departments?: Array<{ value: string; label: string }>;
  };
  activeFilters: QMSFilterOptions;
  onFilterChange: (filters: QMSFilterOptions) => void;
  onClearFilters: () => void;
  itemCount: number;
  filteredCount: number;
}

export function QMSFilters({
  title,
  description,
  options,
  activeFilters,
  onFilterChange,
  onClearFilters,
  itemCount,
  filteredCount,
}: QMSFiltersProps) {
  const [expanded, setExpanded] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...activeFilters, search: e.target.value });
  };

  const handleStatusChange = (status: string) => {
    const newStatuses = activeFilters.status.includes(status)
      ? activeFilters.status.filter(s => s !== status)
      : [...activeFilters.status, status];
    
    onFilterChange({ ...activeFilters, status: newStatuses });
  };

  const handleTypeChange = (type: string) => {
    const newTypes = activeFilters.type.includes(type)
      ? activeFilters.type.filter(t => t !== type)
      : [...activeFilters.type, type];
    
    onFilterChange({ ...activeFilters, type: newTypes });
  };

  const handleSeverityChange = (severity: string) => {
    const newSeverities = activeFilters.severity.includes(severity)
      ? activeFilters.severity.filter(s => s !== severity)
      : [...activeFilters.severity, severity];
    
    onFilterChange({ ...activeFilters, severity: newSeverities });
  };

  const handlePriorityChange = (priority: string) => {
    const newPriorities = activeFilters.priority?.includes(priority)
      ? activeFilters.priority.filter(p => p !== priority)
      : [...(activeFilters.priority || []), priority];
    
    onFilterChange({ ...activeFilters, priority: newPriorities });
  };

  const handleDateChange = (range: { from: Date | undefined; to: Date | undefined }) => {
    onFilterChange({ ...activeFilters, dateRange: range });
  };

  const formatDateRange = () => {
    const { from, to } = activeFilters.dateRange;
    if (!from && !to) return "All time";
    if (from && !to) return `Since ${from.toLocaleDateString()}`;
    if (!from && to) return `Until ${to.toLocaleDateString()}`;
    return `${from.toLocaleDateString()} - ${to.toLocaleDateString()}`;
  };

  const activeFilterCount = 
    (activeFilters.search ? 1 : 0) +
    activeFilters.status.length +
    activeFilters.type.length +
    activeFilters.severity.length +
    (activeFilters.priority?.length || 0) +
    (activeFilters.dateRange.from || activeFilters.dateRange.to ? 1 : 0) +
    (activeFilters.department ? 1 : 0) +
    (activeFilters.assignedTo ? 1 : 0);

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="px-2 py-1">
              {filteredCount} of {itemCount} items
            </Badge>
            {activeFilterCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClearFilters}
                className="h-8"
              >
                <FontAwesomeIcon icon="xmark" className="mr-1 h-3 w-3" />
                Clear Filters
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setExpanded(!expanded)}
              className="h-8"
            >
              <FontAwesomeIcon 
                icon={expanded ? "chevron-up" : "chevron-down"} 
                className="mr-1 h-3 w-3" 
              />
              {expanded ? "Hide Filters" : "Show Filters"}
              {activeFilterCount > 0 && (
                <Badge className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <Input
                  id="search"
                  placeholder="Search by title, ID, description..."
                  value={activeFilters.search}
                  onChange={handleSearchChange}
                />
              </div>

              <div className="space-y-2">
                <Label>Date Range</Label>
                <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <FontAwesomeIcon icon="calendar" className="mr-2 h-4 w-4" />
                      {formatDateRange()}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      selected={{
                        from: activeFilters.dateRange.from,
                        to: activeFilters.dateRange.to,
                      }}
                      onSelect={(range) => {
                        handleDateChange(range || { from: undefined, to: undefined });
                        if (range?.to) setDatePickerOpen(false);
                      }}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {options.departments && (
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select
                    value={activeFilters.department || ""}
                    onValueChange={(value) => onFilterChange({ ...activeFilters, department: value || undefined })}
                  >
                    <SelectTrigger id="department">
                      <SelectValue placeholder="All departments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All departments</SelectItem>
                      {options.departments.map((dept) => (
                        <SelectItem key={dept.value} value={dept.value}>
                          {dept.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>Status Filters</AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {options.statuses.map((status) => (
                      <div key={status.value} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`status-${status.value}`}
                          checked={activeFilters.status.includes(status.value)}
                          onCheckedChange={() => handleStatusChange(status.value)}
                        />
                        <label
                          htmlFor={`status-${status.value}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {status.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2">
                <AccordionTrigger>Type Filters</AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {options.types.map((type) => (
                      <div key={type.value} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`type-${type.value}`}
                          checked={activeFilters.type.includes(type.value)}
                          onCheckedChange={() => handleTypeChange(type.value)}
                        />
                        <label
                          htmlFor={`type-${type.value}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {type.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3">
                <AccordionTrigger>Severity & Priority</AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="mb-2 block">Severity</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {options.severities.map((severity) => (
                          <div key={severity.value} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`severity-${severity.value}`}
                              checked={activeFilters.severity.includes(severity.value)}
                              onCheckedChange={() => handleSeverityChange(severity.value)}
                            />
                            <label
                              htmlFor={`severity-${severity.value}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {severity.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {options.priorities && (
                      <div>
                        <Label className="mb-2 block">Priority</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {options.priorities.map((priority) => (
                            <div key={priority.value} className="flex items-center space-x-2">
                              <Checkbox 
                                id={`priority-${priority.value}`}
                                checked={activeFilters.priority?.includes(priority.value) || false}
                                onCheckedChange={() => handlePriorityChange(priority.value)}
                              />
                              <label
                                htmlFor={`priority-${priority.value}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {priority.label}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </CardContent>
      )}
    </Card>
  );
}