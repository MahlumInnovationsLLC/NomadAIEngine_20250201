import { LogisticsRoute, ShipmentStatus } from "@/types/material";

interface OptimizationResult {
  route: LogisticsRoute;
  estimatedTime: number;
  trafficDelay: number;
  weatherImpact: number;
  alternativeRoutes?: LogisticsRoute[];
}

export class RouteOptimizationService {
  private static instance: RouteOptimizationService;

  private constructor() {}

  public static getInstance(): RouteOptimizationService {
    if (!RouteOptimizationService.instance) {
      RouteOptimizationService.instance = new RouteOptimizationService();
    }
    return RouteOptimizationService.instance;
  }

  public async optimizeRoute(shipment: ShipmentStatus): Promise<OptimizationResult> {
    try {
      // Calculate the optimal route based on current location and destination
      const route = await this.calculateOptimalRoute(shipment);
      
      // Get traffic and weather impact
      const trafficDelay = await this.calculateTrafficDelay(route);
      const weatherImpact = await this.calculateWeatherImpact(route);

      // If significant delays, calculate alternative routes
      let alternativeRoutes: LogisticsRoute[] | undefined;
      if (trafficDelay > 30 || weatherImpact > 20) {
        alternativeRoutes = await this.findAlternativeRoutes(shipment);
      }

      const estimatedTime = this.calculateEstimatedTime(route, trafficDelay, weatherImpact);

      return {
        route,
        estimatedTime,
        trafficDelay,
        weatherImpact,
        alternativeRoutes
      };
    } catch (error) {
      console.error('Error optimizing route:', error);
      throw error;
    }
  }

  private async calculateOptimalRoute(shipment: ShipmentStatus): Promise<LogisticsRoute> {
    // For now, return a mock route
    return {
      id: crypto.randomUUID(),
      shipmentId: shipment.id,
      waypoints: [
        {
          location: shipment.origin.name,
          coordinates: shipment.origin.coordinates,
          status: 'departed',
          departureTime: new Date().toISOString()
        },
        {
          location: 'Checkpoint 1',
          coordinates: [
            (shipment.origin.coordinates[0] + shipment.destination.coordinates[0]) / 2,
            (shipment.origin.coordinates[1] + shipment.destination.coordinates[1]) / 2
          ],
          status: 'pending'
        },
        {
          location: shipment.destination.name,
          coordinates: shipment.destination.coordinates,
          status: 'pending'
        }
      ],
      distance: 500, // Mock distance in km
      duration: 18000, // Mock duration in seconds
      trafficDelay: 0,
      optimizationScore: 0.95
    };
  }

  private async calculateTrafficDelay(route: LogisticsRoute): Promise<number> {
    // Mock traffic delay calculation (in minutes)
    return Math.floor(Math.random() * 45);
  }

  private async calculateWeatherImpact(route: LogisticsRoute): Promise<number> {
    // Mock weather impact calculation (in minutes)
    return Math.floor(Math.random() * 30);
  }

  private async findAlternativeRoutes(shipment: ShipmentStatus): Promise<LogisticsRoute[]> {
    // Mock alternative routes calculation
    const baseRoute = await this.calculateOptimalRoute(shipment);
    return [
      {
        ...baseRoute,
        id: crypto.randomUUID(),
        waypoints: baseRoute.waypoints.map(wp => ({
          ...wp,
          coordinates: [
            wp.coordinates[0] + (Math.random() - 0.5) * 0.1,
            wp.coordinates[1] + (Math.random() - 0.5) * 0.1
          ]
        })),
        distance: baseRoute.distance * 1.1,
        duration: baseRoute.duration * 1.15,
        optimizationScore: 0.85
      }
    ];
  }

  private calculateEstimatedTime(
    route: LogisticsRoute,
    trafficDelay: number,
    weatherImpact: number
  ): number {
    return route.duration + (trafficDelay + weatherImpact) * 60;
  }
}

export const routeOptimizationService = RouteOptimizationService.getInstance();
