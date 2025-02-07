import { useState, useRef, useCallback } from "react";
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
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import * as THREE from "three";

interface BuildingEditorProps {
  onSave?: (buildingData: any) => void;
}

type BuildingComponent = {
  id: number;
  type: 'wall' | 'door' | 'window' | 'floor' | 'ceiling';
  position: [number, number, number];
  rotation: [number, number, number];
  size: [number, number, number];
  color?: string;
};

interface ComponentLibraryItem {
  type: BuildingComponent['type'];
  name: string;
  icon: string;
  defaultSize: [number, number, number];
}

const componentLibrary: ComponentLibraryItem[] = [
  { type: 'wall', name: 'Wall', icon: 'square', defaultSize: [4, 3, 0.2] },
  { type: 'door', name: 'Door', icon: 'door-open', defaultSize: [1, 2, 0.1] },
  { type: 'window', name: 'Window', icon: 'window', defaultSize: [1, 1, 0.1] },
  { type: 'floor', name: 'Floor', icon: 'layer-group', defaultSize: [4, 0.2, 4] },
  { type: 'ceiling', name: 'Ceiling', icon: 'square', defaultSize: [4, 0.2, 4] },
];

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

function BuildingComponent({ 
  component,
  selected,
  onSelect,
  gridSnap,
}: { 
  component: BuildingComponent;
  selected: boolean;
  onSelect: () => void;
  gridSnap: number;
}) {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);

  const handlePointerOver = (e: any) => {
    e.stopPropagation();
    setHovered(true);
  };

  const handlePointerOut = (e: any) => {
    e.stopPropagation();
    setHovered(false);
  };

  const handleClick = (e: any) => {
    e.stopPropagation();
    onSelect();
  };

  const color = selected ? "#3b82f6" : hovered ? "#666" : "#888";

  return (
    <group
      position={component.position}
      rotation={component.rotation}
    >
      <Box 
        ref={meshRef}
        args={component.size}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.8}
        />
      </Box>

      {(selected || hovered) && (
        <>
          <MeasurementLabel 
            start={new THREE.Vector3(-component.size[0]/2, 0, 0)} 
            end={new THREE.Vector3(component.size[0]/2, 0, 0)} 
            text={`${component.size[0].toFixed(1)}m`}
          />
          <MeasurementLabel 
            start={new THREE.Vector3(0, 0, -component.size[2]/2)} 
            end={new THREE.Vector3(0, 0, component.size[2]/2)} 
            text={`${component.size[2].toFixed(1)}m`}
          />
        </>
      )}

      {selected && (
        <TransformControls
          object={meshRef}
          mode="translate"
          size={0.5}
          showX
          showY
          showZ
          snapMode="grid"
          translationSnap={gridSnap}
        />
      )}
    </group>
  );
}

function ComponentLibrary({
  selectedType,
  onSelectType,
  onAddComponent,
}: {
  selectedType: BuildingComponent['type'] | null;
  onSelectType: (type: BuildingComponent['type']) => void;
  onAddComponent: () => void;
}) {
  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Component Library</h3>
      <div className="grid grid-cols-2 gap-2">
        {componentLibrary.map((item) => (
          <Button
            key={item.type}
            variant={selectedType === item.type ? 'default' : 'outline'}
            className="w-full justify-start"
            onClick={() => onSelectType(item.type)}
          >
            <FontAwesomeIcon icon={['fas', item.icon]} className="h-4 w-4 mr-2" />
            {item.name}
          </Button>
        ))}
      </div>
      {selectedType && (
        <Button
          className="w-full mt-4"
          onClick={onAddComponent}
        >
          <FontAwesomeIcon icon={['fas', 'plus']} className="h-4 w-4 mr-2" />
          Add Component
        </Button>
      )}
    </Card>
  );
}

export default function Building3DEditor({ onSave }: BuildingEditorProps) {
  const [components, setComponents] = useState<BuildingComponent[]>([]);
  const [selectedComponentId, setSelectedComponentId] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<BuildingComponent['type'] | null>(null);
  const [gridSnap, setGridSnap] = useState(0.5); // 0.5 meter grid snap

  const handleAddComponent = useCallback(() => {
    if (!selectedType) return;

    const componentInfo = componentLibrary.find(c => c.type === selectedType);
    if (!componentInfo) return;

    const newComponent: BuildingComponent = {
      id: Date.now(),
      type: selectedType,
      position: [0, componentInfo.defaultSize[1] / 2, 0],
      rotation: [0, 0, 0],
      size: componentInfo.defaultSize,
    };

    setComponents(prev => [...prev, newComponent]);
    setSelectedComponentId(newComponent.id);
  }, [selectedType]);

  const handleUndo = () => {
    setComponents(prev => prev.slice(0, -1));
    setSelectedComponentId(null);
  };

  const handleComponentSelect = (id: number) => {
    setSelectedComponentId(id === selectedComponentId ? null : id);
  };

  const handleDelete = () => {
    if (selectedComponentId === null) return;
    setComponents(prev => prev.filter(c => c.id !== selectedComponentId));
    setSelectedComponentId(null);
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
              onClick={() => setGridSnap(gridSnap === 1 ? 0.5 : gridSnap === 0.5 ? 0.25 : 1)}
            >
              <FontAwesomeIcon icon={['fas', 'grid']} className="h-4 w-4 mr-2" />
              Grid: {gridSnap}m
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleUndo}
            >
              <FontAwesomeIcon icon={['fas', 'undo']} className="h-4 w-4 mr-2" />
              Undo
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleDelete}
              disabled={selectedComponentId === null}
            >
              <FontAwesomeIcon icon={['fas', 'trash']} className="h-4 w-4 mr-2" />
              Delete
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onSave?.(components)}
            >
              <FontAwesomeIcon icon={['fas', 'save']} className="h-4 w-4 mr-2" />
              Save Building
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <div className="w-full h-[600px] relative rounded-lg overflow-hidden border">
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
                {components.map((component) => (
                  <BuildingComponent
                    key={component.id}
                    component={component}
                    selected={component.id === selectedComponentId}
                    onSelect={() => handleComponentSelect(component.id)}
                    gridSnap={gridSnap}
                  />
                ))}
              </Canvas>
            </div>
          </div>
          <div>
            <ComponentLibrary
              selectedType={selectedType}
              onSelectType={setSelectedType}
              onAddComponent={handleAddComponent}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}