/**
 * Project Cache Module
 * 
 * This module provides a centralized caching mechanism for project data
 * to improve reliability and performance across the application.
 */

import type { Project } from "../../client/src/types/manufacturing";

// Cache configuration
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
const MAX_ITEMS = 1000; // Maximum number of items to store in each cache
const STALE_ACCEPTABLE_TIME = 30 * 60 * 1000; // 30 minutes - How long stale data is acceptable as fallback

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  lastAccessed: number;
  hitCount: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  oldestEntryAge: number;
  newestEntryAge: number;
  averageAge: number;
}

class ProjectCache {
  private static instance: ProjectCache;

  // All projects cache
  private allProjects: CacheEntry<Project[]> | null = null;
  
  // Individual project cache (by ID)
  private projectsById: Map<string, CacheEntry<Project>> = new Map();
  
  // Cache statistics
  private stats = {
    hits: 0,
    misses: 0,
    refreshes: 0,
    fallbacks: 0
  };

  private constructor() {}

  /**
   * Get the singleton instance of the ProjectCache
   */
  public static getInstance(): ProjectCache {
    if (!ProjectCache.instance) {
      ProjectCache.instance = new ProjectCache();
    }
    return ProjectCache.instance;
  }

  /**
   * Get all projects from cache if available and not expired
   * @param maxAge Maximum age of cache in milliseconds before considered expired
   * @returns Projects array or null if cache is expired/empty
   */
  public getAllProjects(maxAge: number = DEFAULT_TTL): Project[] | null {
    // Check if cache exists and is valid
    if (this.allProjects) {
      const age = Date.now() - this.allProjects.timestamp;
      
      // Update access stats
      this.allProjects.lastAccessed = Date.now();
      this.allProjects.hitCount++;
      this.stats.hits++;
      
      // Return if cache is fresh
      if (age < maxAge) {
        console.log(`Project cache hit: returning ${this.allProjects.data.length} projects (age: ${Math.round(age/1000)}s)`);
        return this.allProjects.data;
      } else {
        // Cache is stale, but record in stats that it was accessed
        console.log(`Project cache stale: ${Math.round(age/1000)}s old (TTL: ${Math.round(maxAge/1000)}s)`);
      }
    } else {
      this.stats.misses++;
      console.log('Project cache miss: no cached projects available');
    }
    
    return null;
  }

  /**
   * Get all projects even if the cache is stale (used for fallback)
   * @returns Projects array or null if cache is empty
   */
  public getAllProjectsFallback(): Project[] | null {
    if (this.allProjects) {
      const age = Date.now() - this.allProjects.timestamp;
      this.stats.fallbacks++;
      console.log(`Project cache fallback: returning ${this.allProjects.data.length} projects (age: ${Math.round(age/1000)}s)`);
      return this.allProjects.data;
    }
    return null;
  }

  /**
   * Update the projects cache with fresh data
   * @param projects Projects array to cache
   */
  public setAllProjects(projects: Project[]): void {
    if (!projects || !Array.isArray(projects)) {
      console.warn('Attempted to cache invalid projects data:', projects);
      return;
    }

    this.stats.refreshes++;
    
    this.allProjects = {
      data: projects,
      timestamp: Date.now(),
      lastAccessed: Date.now(),
      hitCount: 0
    };
    
    // Also populate individual project cache
    projects.forEach(project => {
      if (project && project.id) {
        this.projectsById.set(project.id, {
          data: project,
          timestamp: Date.now(),
          lastAccessed: Date.now(),
          hitCount: 0
        });
      }
    });
    
    console.log(`Project cache updated with ${projects.length} projects`);
  }

  /**
   * Get a specific project by ID from cache
   * @param id Project ID to look up
   * @param maxAge Maximum age of cache in milliseconds
   * @returns Project or null if not found/expired
   */
  public getProjectById(id: string, maxAge: number = DEFAULT_TTL): Project | null {
    const entry = this.projectsById.get(id);
    
    if (entry) {
      const age = Date.now() - entry.timestamp;
      
      // Update access stats
      entry.lastAccessed = Date.now();
      entry.hitCount++;
      this.stats.hits++;
      
      // Return if cache is fresh
      if (age < maxAge) {
        console.log(`Project cache hit: returning project ${id} (age: ${Math.round(age/1000)}s)`);
        return entry.data;
      } else {
        console.log(`Project cache stale: project ${id} is ${Math.round(age/1000)}s old (TTL: ${Math.round(maxAge/1000)}s)`);
      }
    } else {
      this.stats.misses++;
      console.log(`Project cache miss: project ${id} not found`);
    }
    
    return null;
  }

  /**
   * Get a specific project by ID from cache even if stale (fallback)
   * @param id Project ID to look up
   * @returns Project or null if not found
   */
  public getProjectByIdFallback(id: string): Project | null {
    const entry = this.projectsById.get(id);
    
    if (entry) {
      const age = Date.now() - entry.timestamp;
      this.stats.fallbacks++;
      console.log(`Project cache fallback: returning project ${id} (age: ${Math.round(age/1000)}s)`);
      return entry.data;
    }
    
    // If project isn't in individual cache, try to find it in allProjects
    if (this.allProjects) {
      const project = this.allProjects.data.find(p => p.id === id);
      if (project) {
        this.stats.fallbacks++;
        console.log(`Project cache fallback from all projects: returning project ${id}`);
        return project;
      }
    }
    
    return null;
  }

  /**
   * Update a single project in the cache
   * @param project Project to cache
   */
  public setProject(project: Project): void {
    if (!project || !project.id) {
      console.warn('Attempted to cache invalid project:', project);
      return;
    }
    
    // Update in individual cache
    this.projectsById.set(project.id, {
      data: project,
      timestamp: Date.now(),
      lastAccessed: Date.now(),
      hitCount: 0
    });
    
    // Also update in all projects cache if it exists
    if (this.allProjects) {
      // Find and replace the project in the array
      const index = this.allProjects.data.findIndex(p => p.id === project.id);
      if (index >= 0) {
        this.allProjects.data[index] = project;
      } else {
        // Add to the array if not found
        this.allProjects.data.push(project);
      }
    }
    
    console.log(`Project cache updated for project ${project.id}`);
  }

  /**
   * Clear all cached project data
   */
  public clearCache(): void {
    this.allProjects = null;
    this.projectsById.clear();
    console.log('Project cache cleared');
  }

  /**
   * Get cache statistics
   */
  public getStats(): CacheStats {
    const now = Date.now();
    let oldestTimestamp = now;
    let newestTimestamp = 0;
    let totalAge = 0;
    let count = 0;
    
    // Process individual entries
    this.projectsById.forEach(entry => {
      const timestamp = entry.timestamp;
      if (timestamp < oldestTimestamp) oldestTimestamp = timestamp;
      if (timestamp > newestTimestamp) newestTimestamp = timestamp;
      totalAge += (now - timestamp);
      count++;
    });
    
    // Process all projects entry
    if (this.allProjects) {
      const timestamp = this.allProjects.timestamp;
      if (timestamp < oldestTimestamp) oldestTimestamp = timestamp;
      if (timestamp > newestTimestamp) newestTimestamp = timestamp;
      totalAge += (now - timestamp);
      count++;
    }
    
    const averageAge = count > 0 ? totalAge / count : 0;
    
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      size: this.projectsById.size + (this.allProjects ? 1 : 0),
      oldestEntryAge: oldestTimestamp !== now ? now - oldestTimestamp : 0,
      newestEntryAge: newestTimestamp !== 0 ? now - newestTimestamp : 0,
      averageAge
    };
  }
}

// Export the singleton instance
export const projectCache = ProjectCache.getInstance();