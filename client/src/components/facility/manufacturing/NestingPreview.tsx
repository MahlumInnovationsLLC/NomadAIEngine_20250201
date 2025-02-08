import { useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";

interface NestingPreviewProps {
  nestingPattern: {
    width: number;
    height: number;
    placements: Array<{
      x: number;
      y: number;
      partId: string;
      rotation: number;
    }>;
  };
  scale?: number;
}

export default function NestingPreview({ nestingPattern, scale = 1 }: NestingPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw sheet outline
    ctx.strokeStyle = '#666';
    ctx.strokeRect(0, 0, nestingPattern.width * scale, nestingPattern.height * scale);

    // Draw placed parts
    nestingPattern.placements.forEach((placement, index) => {
      ctx.save();
      
      // Translate to part position
      ctx.translate(placement.x * scale, placement.y * scale);
      
      // Apply rotation if any
      if (placement.rotation) {
        ctx.rotate(placement.rotation * Math.PI / 180);
      }

      // Draw part rectangle with different colors for each part
      ctx.fillStyle = `hsl(${(index * 137.5) % 360}, 70%, 75%)`;
      ctx.strokeStyle = `hsl(${(index * 137.5) % 360}, 70%, 60%)`;
      ctx.lineWidth = 2;
      
      // Draw the part
      ctx.fillRect(0, 0, 50 * scale, 30 * scale); // Example dimensions
      ctx.strokeRect(0, 0, 50 * scale, 30 * scale);

      // Add part ID label
      ctx.fillStyle = '#000';
      ctx.font = `${12 * scale}px sans-serif`;
      ctx.fillText(placement.partId, 5 * scale, 20 * scale);

      ctx.restore();
    });
  }, [nestingPattern, scale]);

  return (
    <Card className="p-4">
      <canvas
        ref={canvasRef}
        width={nestingPattern.width * scale}
        height={nestingPattern.height * scale}
        className="border rounded-lg"
        style={{
          width: nestingPattern.width * scale,
          height: nestingPattern.height * scale,
        }}
      />
    </Card>
  );
}
