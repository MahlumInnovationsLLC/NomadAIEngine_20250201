import { Suspense, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Environment, Box, Text } from "@react-three/drei";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Equipment } from "@db/schema";

interface AssetViewerProps {
  equipment?: Equipment;
  modelUrl?: string;
}

function PlaceholderModel() {
  const [hovered, setHovered] = useState(false);

  return (
    <group>
      <Box 
        args={[1, 1, 1]} 
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <meshStandardMaterial 
          color={hovered ? "#666" : "#888"} 
          wireframe={true}
        />
      </Box>
      <Text
        position={[0, 1.5, 0]}
        fontSize={0.2}
        color="#666"
        anchorX="center"
        anchorY="middle"
      >
        No 3D model available
      </Text>
    </group>
  );
}

function LoadingFallback() {
  return (
    <div className="w-full h-[400px] flex items-center justify-center">
      <Skeleton className="h-12 w-12 rounded-full" />
    </div>
  );
}

export default function AssetViewer3D({ equipment }: AssetViewerProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>3D Asset Viewer</span>
          <div className="flex gap-2">
            <Badge variant="outline" className="bg-blue-500/10 text-blue-500">
              {equipment?.equipmentTypeId || "Generic Equipment"}
            </Badge>
            <Button variant="outline" size="sm">
              Reset View
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full h-[400px] relative rounded-lg overflow-hidden border">
          <Suspense fallback={<LoadingFallback />}>
            <Canvas>
              <PerspectiveCamera makeDefault position={[0, 2, 5]} />
              <OrbitControls enablePan enableZoom enableRotate />
              <ambientLight intensity={0.5} />
              <directionalLight position={[10, 10, 5]} intensity={1} />
              <PlaceholderModel />
              <Environment preset="warehouse" />
            </Canvas>
          </Suspense>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium mb-1">Equipment Details</h4>
            <p className="text-sm text-muted-foreground">
              {equipment?.name || "No equipment selected"}
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium mb-1">Maintenance Status</h4>
            <p className="text-sm text-muted-foreground">
              Last maintained: {equipment?.lastMaintenance 
                ? new Date(equipment.lastMaintenance).toLocaleDateString()
                : "Never"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}