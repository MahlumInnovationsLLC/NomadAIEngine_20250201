import { useState, useRef } from "react";
import { Canvas, useThree, Vector3 } from "@react-three/fiber";
import { 
  OrbitControls, 
  PerspectiveCamera, 
  Grid, 
  TransformControls,
  Box,
  useHelper,
  Line,
  Text 
} from "@react-three/drei";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import * as THREE from "three";

interface BuildingEditorProps {
  onSave?: (buildingData: any) => void;
}

interface WallProps {
  position: [number, number, number];
  size: [number, number, number];
  rotation: [number, number, number];
  onSelect?: () => void;
  selected?: boolean;
}

function EditorGrid({ size = 20, divisions = 20 }) {
  return (
    <Grid
      args={[size, size, divisions, divisions]}
      cellSize={1}
      sectionSize={3}
      sectionColor="#444"
      sectionThickness={1}
      fadeDistance={30}
      fadeStrength={1}
      infiniteGrid
    />
  );
}

function MeasurementLabel({ start, end, text }: { start: Vector3; end: Vector3; text: string }) {
  const center = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  return (
    <group position={center.toArray()}>
      <Text
        position={[0, 0.1, 0]}
        fontSize={0.2}
        color="#666"
        anchorX="center"
        anchorY="middle"
        rotation={[-Math.PI / 2, 0, 0]}
      >
        {text}
      </Text>
    </group>
  );
}

function Wall({ position, size, rotation, onSelect, selected }: WallProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <group 
      position={position} 
      rotation={rotation}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.();
      }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <Box args={size}>
        <meshStandardMaterial 
          color={selected ? "#3b82f6" : hovered ? "#666" : "#888"}
          transparent
          opacity={0.8}
        />
      </Box>

      {(selected || hovered) && (
        <>
          <MeasurementLabel 
            start={new THREE.Vector3(-size[0]/2, 0, 0)} 
            end={new THREE.Vector3(size[0]/2, 0, 0)} 
            text={`${size[0].toFixed(2)}m`}
          />
          <MeasurementLabel 
            start={new THREE.Vector3(0, 0, -size[2]/2)} 
            end={new THREE.Vector3(0, 0, size[2]/2)} 
            text={`${size[2].toFixed(2)}m`}
          />
        </>
      )}
    </group>
  );
}

function BuildingControls({ 
  mode,
  onModeChange,
  onAddWall,
  onUndo,
  gridSnap,
  onGridSnapChange,
}: {
  mode: 'wall' | 'door' | 'window' | 'select';
  onModeChange: (mode: 'wall' | 'door' | 'window' | 'select') => void;
  onAddWall: () => void;
  onUndo: () => void;
  gridSnap: number;
  onGridSnapChange: (snap: number) => void;
}) {
  return (
    <div className="absolute top-4 left-4 space-y-2">
      <div className="flex gap-2">
        <Button 
          variant={mode === 'wall' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => onModeChange('wall')}
        >
          <FontAwesomeIcon icon={['fas', 'square']} className="h-4 w-4 mr-2" />
          Wall
        </Button>
        <Button 
          variant={mode === 'door' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onModeChange('door')}
        >
          <FontAwesomeIcon icon={['fas', 'door-open']} className="h-4 w-4 mr-2" />
          Door
        </Button>
        <Button 
          variant={mode === 'window' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onModeChange('window')}
        >
          <FontAwesomeIcon icon={['fas', 'window']} className="h-4 w-4 mr-2" />
          Window
        </Button>
        <Button 
          variant={mode === 'select' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onModeChange('select')}
        >
          <FontAwesomeIcon icon={['fas', 'mouse-pointer']} className="h-4 w-4 mr-2" />
          Select
        </Button>
      </div>

      <div className="flex gap-2">
        <Button 
          variant="outline"
          size="sm"
          onClick={() => onGridSnapChange(gridSnap === 1 ? 0.5 : gridSnap === 0.5 ? 0.25 : 1)}
        >
          <FontAwesomeIcon icon={['fas', 'grid']} className="h-4 w-4 mr-2" />
          Grid: {gridSnap}m
        </Button>
        <Button 
          variant="outline"
          size="sm"
          onClick={onUndo}
        >
          <FontAwesomeIcon icon={['fas', 'undo']} className="h-4 w-4 mr-2" />
          Undo
        </Button>
      </div>
    </div>
  );
}

export default function Building3DEditor({ onSave }: BuildingEditorProps) {
  const [editorMode, setEditorMode] = useState<'wall' | 'door' | 'window' | 'select'>('select');
  const [walls, setWalls] = useState<any[]>([]);
  const [selectedWallId, setSelectedWallId] = useState<number | null>(null);
  const [gridSnap, setGridSnap] = useState(1); // 1 meter grid snap
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<THREE.Vector3 | null>(null);

  const handleAddWall = () => {
    const newWall = {
      id: Date.now(),
      position: [0, 1.5, 0],
      size: [0.2, 3, 4],
      rotation: [0, 0, 0]
    };
    setWalls([...walls, newWall]);
  };

  const handleUndo = () => {
    setWalls(walls.slice(0, -1));
    setSelectedWallId(null);
  };

  const handleWallSelect = (id: number) => {
    setSelectedWallId(id === selectedWallId ? null : id);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Building Editor</span>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onSave?.(walls)}
            >
              <FontAwesomeIcon icon={['fas', 'save']} className="h-4 w-4 mr-2" />
              Save Building
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full h-[600px] relative rounded-lg overflow-hidden border">
          <BuildingControls
            mode={editorMode}
            onModeChange={setEditorMode}
            onAddWall={handleAddWall}
            onUndo={handleUndo}
            gridSnap={gridSnap}
            onGridSnapChange={setGridSnap}
          />

          <Canvas shadows>
            <PerspectiveCamera makeDefault position={[10, 10, 10]} />
            <OrbitControls 
              enablePan 
              enableZoom 
              enableRotate
              minDistance={5}
              maxDistance={20}
            />
            <ambientLight intensity={0.5} />
            <directionalLight 
              position={[10, 10, 5]} 
              intensity={1}
              castShadow
            />
            <EditorGrid />
            {walls.map((wall) => (
              <Wall 
                key={wall.id} 
                {...wall}
                selected={wall.id === selectedWallId}
                onSelect={() => handleWallSelect(wall.id)}
              />
            ))}
          </Canvas>
        </div>
      </CardContent>
    </Card>
  );
}