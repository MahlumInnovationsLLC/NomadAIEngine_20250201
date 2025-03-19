import React, { useState, useEffect } from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { format } from "date-fns";
import type { CombinedProject } from './ProductionLinePanel';

export interface ProjectFilter {
  productionLine: string;
  location: string;
  sortBy: 'none' | 'ntcDate' | 'qcDate' | 'shipDate';
  sortDirection: 'asc' | 'desc';
  sortMode: 'standard' | 'proximity'; // 'proximity' sorts by distance from current date
}

interface ProjectFiltersRowProps {
  projects: CombinedProject[];
  onFilterChange: (filters: ProjectFilter) => void;
  availableProductionLines: Array<{ id: string; name: string }>;
}

export function ProjectFiltersRow({ 
  projects, 
  onFilterChange,
  availableProductionLines
}: ProjectFiltersRowProps) {
  // Get unique locations from projects with standardized names
  const locationMap = new Map<string, string>();
  
  // Helper function to standardize location names
  const standardizeLocation = (location: string): string => {
    if (!location) return '';
    
    // Standardize CFalls/Cfalls to Columbia Falls
    if (location.toLowerCase() === 'cfalls') {
      return 'Columbia Falls';
    }
    
    return location;
  };
  
  // Add all non-null locations to the map with standardized display names
  projects.forEach(p => {
    if (p.location) {
      const standardizedName = standardizeLocation(p.location);
      locationMap.set(p.location, standardizedName);
    }
  });
  
  // Convert to array of objects with original and display values
  const uniqueLocations = Array.from(locationMap.entries()).map(([original, display]) => ({
    original,
    display
  }));
  
  // Initialize filter state
  const [filters, setFilters] = useState<ProjectFilter>({
    productionLine: 'all',
    location: 'all',
    sortBy: 'none',
    sortDirection: 'asc',
    sortMode: 'standard',
  });

  // Update parent component when filters change
  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  // Handle filter changes
  const handleFilterChange = (name: keyof ProjectFilter, value: any) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle filter reset
  const handleResetFilters = () => {
    setFilters({
      productionLine: 'all',
      location: 'all',
      sortBy: 'none',
      sortDirection: 'asc',
      sortMode: 'standard',
    });
  };

  return (
    <div className="bg-background/60 backdrop-blur-sm border-b p-2 mb-4 sticky top-0 z-10">
      <div className="flex flex-wrap gap-2 items-center">
        {/* Production Line Filter */}
        <div className="w-48">
          <Select 
            value={filters.productionLine} 
            onValueChange={(value) => handleFilterChange('productionLine', value)}
          >
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Production Line" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Production Lines</SelectItem>
              {availableProductionLines.map(line => (
                <SelectItem key={line.id} value={line.id}>
                  {line.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sort By NTC Date */}
        <div className="flex items-center gap-1">
          <Button 
            variant={filters.sortBy === 'ntcDate' ? 'default' : 'outline'}
            className={`h-8 px-3 ${filters.sortBy === 'ntcDate' ? 'bg-primary text-primary-foreground' : ''}`}
            size="sm"
            onClick={() => {
              if (filters.sortBy === 'ntcDate') {
                // Toggle direction if already selected
                handleFilterChange('sortDirection', filters.sortDirection === 'asc' ? 'desc' : 'asc');
              } else {
                // Set as active sort field with default direction
                handleFilterChange('sortBy', 'ntcDate');
                handleFilterChange('sortDirection', 'asc');
              }
            }}
          >
            <FontAwesomeIcon icon="calendar" className="mr-2 h-3 w-3" />
            NTC Date
            {filters.sortBy === 'ntcDate' && (
              <FontAwesomeIcon 
                icon={filters.sortDirection === 'asc' ? 'arrow-up' : 'arrow-down'} 
                className="ml-2 h-3 w-3" 
              />
            )}
          </Button>
        </div>

        {/* Sort By QC Date */}
        <div className="flex items-center gap-1">
          <Button 
            variant={filters.sortBy === 'qcDate' ? 'default' : 'outline'}
            className={`h-8 px-3 ${filters.sortBy === 'qcDate' ? 'bg-primary text-primary-foreground' : ''}`}
            size="sm"
            onClick={() => {
              if (filters.sortBy === 'qcDate') {
                // Toggle direction if already selected
                handleFilterChange('sortDirection', filters.sortDirection === 'asc' ? 'desc' : 'asc');
              } else {
                // Set as active sort field with default direction
                handleFilterChange('sortBy', 'qcDate');
                handleFilterChange('sortDirection', 'asc');
              }
            }}
          >
            <FontAwesomeIcon icon="clipboard-check" className="mr-2 h-3 w-3" />
            QC Date
            {filters.sortBy === 'qcDate' && (
              <FontAwesomeIcon 
                icon={filters.sortDirection === 'asc' ? 'arrow-up' : 'arrow-down'} 
                className="ml-2 h-3 w-3" 
              />
            )}
          </Button>
        </div>

        {/* Sort By Ship Date */}
        <div className="flex items-center gap-1">
          <Button 
            variant={filters.sortBy === 'shipDate' ? 'default' : 'outline'}
            className={`h-8 px-3 ${filters.sortBy === 'shipDate' ? 'bg-primary text-primary-foreground' : ''}`}
            size="sm"
            onClick={() => {
              if (filters.sortBy === 'shipDate') {
                // Toggle direction if already selected
                handleFilterChange('sortDirection', filters.sortDirection === 'asc' ? 'desc' : 'asc');
              } else {
                // Set as active sort field with default direction
                handleFilterChange('sortBy', 'shipDate');
                handleFilterChange('sortDirection', 'asc');
              }
            }}
          >
            <FontAwesomeIcon icon="ship" className="mr-2 h-3 w-3" />
            Ship Date
            {filters.sortBy === 'shipDate' && (
              <FontAwesomeIcon 
                icon={filters.sortDirection === 'asc' ? 'arrow-up' : 'arrow-down'} 
                className="ml-2 h-3 w-3" 
              />
            )}
          </Button>
        </div>

        {/* Sort Mode Toggle (Standard vs Proximity) */}
        {filters.sortBy !== 'none' && (
          <div className="flex items-center gap-1">
            <Button 
              variant="outline"
              className={`h-8 px-3 ${filters.sortMode === 'proximity' ? 'bg-secondary text-secondary-foreground' : ''}`}
              size="sm"
              onClick={() => {
                // Toggle between standard and proximity sort modes
                handleFilterChange('sortMode', filters.sortMode === 'standard' ? 'proximity' : 'standard');
              }}
            >
              <FontAwesomeIcon 
                icon={filters.sortMode === 'proximity' ? 'calendar-day' : 'sort-alpha-down'} 
                className="mr-2 h-3 w-3" 
              />
              {filters.sortMode === 'proximity' ? 'By Proximity' : 'Standard'}
            </Button>
          </div>
        )}

        {/* Location Filter */}
        <div className="w-40">
          <Select 
            value={filters.location} 
            onValueChange={(value) => handleFilterChange('location', value)}
          >
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {uniqueLocations.map(loc => (
                <SelectItem key={loc.original} value={loc.original}>
                  {loc.display}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Clear Filters Button */}
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 ml-auto"
          onClick={handleResetFilters}
        >
          <FontAwesomeIcon icon="times" className="mr-2 h-3 w-3" />
          Clear Filters
        </Button>
      </div>
    </div>
  );
}