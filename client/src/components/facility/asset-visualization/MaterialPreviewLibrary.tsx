import { useState, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Sphere, Box } from "@react-three/drei";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import * as THREE from "three";

interface MaterialPreviewProps {
  onSelect?: (material: MaterialPreset) => void;
}

export interface MaterialPreset {
  id: string;
  name: string;
  type: 'metal' | 'wood' | 'glass' | 'concrete' | 'brick';
  properties: {
    color: string;
    metalness: number;
    roughness: number;
    opacity: number;
    transparent: boolean;
    envMapIntensity?: number;
    clearcoat?: number;
    clearcoatRoughness?: number;
  };
}

const materialPresets: MaterialPreset[] = [
  {
    id: 'polished-metal',
    name: 'Polished Metal',
    type: 'metal',
    properties: {
      color: '#ffffff',
      metalness: 0.9,
      roughness: 0.1,
      opacity: 1,
      transparent: false,
      envMapIntensity: 1,
      clearcoat: 1,
      clearcoatRoughness: 0.1
    }
  },
  {
    id: 'brushed-metal',
    name: 'Brushed Metal',
    type: 'metal',
    properties: {
      color: '#b0b0b0',
      metalness: 0.8,
      roughness: 0.5,
      opacity: 1,
      transparent: false,
      envMapIntensity: 0.8
    }
  },
  {
    id: 'tinted-glass',
    name: 'Tinted Glass',
    type: 'glass',
    properties: {
      color: '#88ccff',
      metalness: 0.1,
      roughness: 0,
      opacity: 0.5,
      transparent: true,
      envMapIntensity: 1,
      clearcoat: 1
    }
  },
  {
    id: 'oak-wood',
    name: 'Oak Wood',
    type: 'wood',
    properties: {
      color: '#8b4513',
      metalness: 0,
      roughness: 0.8,
      opacity: 1,
      transparent: false
    }
  },
  {
    id: 'polished-concrete',
    name: 'Polished Concrete',
    type: 'concrete',
    properties: {
      color: '#808080',
      metalness: 0.1,
      roughness: 0.7,
      opacity: 1,
      transparent: false
    }
  },
  {
    id: 'red-brick',
    name: 'Red Brick',
    type: 'brick',
    properties: {
      color: '#8b0000',
      metalness: 0,
      roughness: 0.9,
      opacity: 1,
      transparent: false
    }
  }
];

function MaterialPreviewScene({ material }: { material: MaterialPreset }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  return (
    <Canvas shadows camera={{ position: [0, 0, 4] }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} castShadow />
      <Sphere
        ref={meshRef}
        args={[1, 32, 32]}
        rotation={[0, Math.PI * 0.25, 0]}
      >
        <meshPhysicalMaterial {...material.properties} />
      </Sphere>
      <OrbitControls 
        enableZoom={false}
        autoRotate
        autoRotateSpeed={2}
      />
    </Canvas>
  );
}

export default function MaterialPreviewLibrary({ onSelect }: MaterialPreviewProps) {
  const [selectedType, setSelectedType] = useState<MaterialPreset['type'] | 'all'>('all');
  const [hoveredMaterial, setHoveredMaterial] = useState<string | null>(null);

  const filteredMaterials = selectedType === 'all' 
    ? materialPresets
    : materialPresets.filter(m => m.type === selectedType);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Material Library</span>
          <div className="flex gap-2">
            {(['all', 'metal', 'wood', 'glass', 'concrete', 'brick'] as const).map((type) => (
              <Button
                key={type}
                variant={selectedType === type ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType(type)}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Button>
            ))}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          {filteredMaterials.map((material) => (
            <Card
              key={material.id}
              className={`cursor-pointer transition-all duration-200 ${
                hoveredMaterial === material.id ? 'ring-2 ring-primary' : ''
              }`}
              onMouseEnter={() => setHoveredMaterial(material.id)}
              onMouseLeave={() => setHoveredMaterial(null)}
              onClick={() => onSelect?.(material)}
            >
              <div className="h-32 relative">
                <MaterialPreviewScene material={material} />
              </div>
              <div className="p-2">
                <h3 className="text-sm font-medium">{material.name}</h3>
                <Badge variant="outline" className="mt-1">
                  {material.type}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
