import { Suspense, useState, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Environment, Box, Text, useHelper } from "@react-three/drei";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import * as THREE from "three";
import type { Equipment } from "@db/schema";

interface AssetViewerProps {
  equipment?: Equipment;
  modelUrl?: string;
}

function Lights() {
  const directionalLightRef = useRef<THREE.DirectionalLight>(null);
  useHelper(directionalLightRef, THREE.DirectionalLightHelper, 1, 'red');

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight 
        ref={directionalLightRef}
        position={[10, 10, 5]} 
        intensity={1}
        castShadow
      />
      <hemisphereLight intensity={0.3} groundColor="#666" />
    </>
  );
}

function PlaceholderModel({ wireframe }: { wireframe: boolean }) {
  const [hovered, setHovered] = useState(false);

  return (
    <group>
      <Box 
        args={[1, 1, 1]} 
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial 
          color={hovered ? "#666" : "#888"} 
          wireframe={wireframe}
          roughness={0.7}
          metalness={0.3}
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

function CameraControls({ onReset }: { onReset: () => void }) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);

  const handleReset = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
      onReset();
    }
  };

  return (
    <OrbitControls 
      ref={controlsRef}
      enablePan 
      enableZoom 
      enableRotate
      minDistance={2}
      maxDistance={10}
    />
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
  const [wireframe, setWireframe] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);

  const handleResetCamera = () => {
    // Camera reset logic here
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>3D Asset Viewer</span>
          <div className="flex gap-2">
            <Badge variant="outline" className="bg-blue-500/10 text-blue-500">
              {equipment?.equipmentTypeId || "Generic Equipment"}
            </Badge>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setWireframe(!wireframe)}
            >
              <FontAwesomeIcon 
                icon={['fal', 'cube']} 
                className="h-4 w-4 mr-2"
              />
              {wireframe ? 'Solid' : 'Wireframe'}
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setAutoRotate(!autoRotate)}
            >
              <FontAwesomeIcon 
                icon={['fal', 'sync']} 
                className={`h-4 w-4 mr-2 ${autoRotate ? 'animate-spin' : ''}`}
              />
              {autoRotate ? 'Stop' : 'Rotate'}
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleResetCamera}
            >
              <FontAwesomeIcon icon={['fal', 'camera-rotate']} className="h-4 w-4 mr-2" />
              Reset View
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full h-[400px] relative rounded-lg overflow-hidden border">
          <Suspense fallback={<LoadingFallback />}>
            <Canvas shadows>
              <PerspectiveCamera makeDefault position={[0, 2, 5]} />
              <CameraControls onReset={handleResetCamera} />
              <Lights />
              <PlaceholderModel wireframe={wireframe} />
              <Environment preset="warehouse" />
            </Canvas>
          </Suspense>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium mb-1">Equipment Details</h4>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Name: {equipment?.name || "No equipment selected"}
              </p>
              <p className="text-sm text-muted-foreground">
                Type: {equipment?.equipmentTypeId || "N/A"}
              </p>
              <p className="text-sm text-muted-foreground">
                Serial Number: {equipment?.serialNumber || "N/A"}
              </p>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium mb-1">Maintenance Status</h4>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Last Maintenance: {equipment?.lastMaintenance 
                  ? new Date(equipment.lastMaintenance).toLocaleDateString()
                  : "Never"}
              </p>
              <p className="text-sm text-muted-foreground">
                Model Year: {equipment?.modelYear || "N/A"}
              </p>
              <p className="text-sm text-muted-foreground">
                Model Number: {equipment?.modelNumber || "N/A"}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}