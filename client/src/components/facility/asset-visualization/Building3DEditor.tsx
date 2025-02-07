import { useState, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { 
  OrbitControls, 
  PerspectiveCamera, 
  Grid, 
  TransformControls,
  Box,
  useHelper 
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

function EditorGrid() {
  return (
    <Grid
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

function Wall({ position, size, rotation }: any) {
  return (
    <Box 
      position={position} 
      args={size} 
      rotation={rotation}
    >
      <meshStandardMaterial color="#666" />
    </Box>
  );
}

function BuildingControls({ 
  mode,
  onModeChange,
  onAddWall,
  onUndo,
}: {
  mode: 'wall' | 'door' | 'window' | 'select';
  onModeChange: (mode: 'wall' | 'door' | 'window' | 'select') => void;
  onAddWall: () => void;
  onUndo: () => void;
}) {
  return (
    <div className="absolute top-4 left-4 space-x-2">
      <Button 
        variant={mode === 'wall' ? 'default' : 'outline'} 
        size="sm"
        onClick={() => onModeChange('wall')}
      >
        <FontAwesomeIcon icon={['fal', 'wall']} className="h-4 w-4 mr-2" />
        Wall
      </Button>
      <Button 
        variant={mode === 'door' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onModeChange('door')}
      >
        <FontAwesomeIcon icon={['fal', 'door-open']} className="h-4 w-4 mr-2" />
        Door
      </Button>
      <Button 
        variant={mode === 'window' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onModeChange('window')}
      >
        <FontAwesomeIcon icon={['fal', 'window']} className="h-4 w-4 mr-2" />
        Window
      </Button>
      <Button 
        variant={mode === 'select' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onModeChange('select')}
      >
        <FontAwesomeIcon icon={['fal', 'mouse-pointer']} className="h-4 w-4 mr-2" />
        Select
      </Button>
      <Button 
        variant="outline"
        size="sm"
        onClick={onUndo}
      >
        <FontAwesomeIcon icon={['fal', 'undo']} className="h-4 w-4 mr-2" />
        Undo
      </Button>
    </div>
  );
}

export default function Building3DEditor({ onSave }: BuildingEditorProps) {
  const [editorMode, setEditorMode] = useState<'wall' | 'door' | 'window' | 'select'>('select');
  const [walls, setWalls] = useState<any[]>([]);
  
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
              <FontAwesomeIcon icon={['fal', 'save']} className="h-4 w-4 mr-2" />
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
              <Wall key={wall.id} {...wall} />
            ))}
          </Canvas>
        </div>
      </CardContent>
    </Card>
  );
}
