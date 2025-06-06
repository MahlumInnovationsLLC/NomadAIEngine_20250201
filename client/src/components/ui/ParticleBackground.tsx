import { useEffect, useRef } from 'react';
import { cn } from "@/lib/utils";

interface ParticleBackgroundProps {
  className?: string;
  particleColor?: string;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
}

export function ParticleBackground({ 
  className,
  particleColor = "rgba(239, 68, 68, 0.2)"  // Default to a lighter red with 0.2 opacity
}: ParticleBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to window size
    const resizeCanvas = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();

    // Initialize particles with more dynamic properties
    const initParticles = () => {
      const particles: Particle[] = [];
      const numParticles = Math.min(150, Math.floor((window.innerWidth * window.innerHeight) / 12000));

      for (let i = 0; i < numParticles; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 5 + 3,
          speedX: (Math.random() - 0.5) * 1.2,
          speedY: (Math.random() - 0.5) * 1.2,
          opacity: Math.random() * 0.2 + 0.8,
        });
      }
      particlesRef.current = particles;
    };

    // Animation loop with enhanced visuals
    const animate = () => {
      try {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particlesRef.current.forEach((particle, index) => {
          // Update position with wave-like motion
          const time = Date.now() * 0.001;
          particle.x += particle.speedX * (1 + Math.sin(time) * 0.3);
          particle.y += particle.speedY * (1 + Math.cos(time) * 0.3);

          // Enhanced mouse interaction
          const dx = mouseRef.current.x - particle.x;
          const dy = mouseRef.current.y - particle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const interactionDistance = 180;

          if (distance < interactionDistance) {
            const force = (1 - distance / interactionDistance) * 0.8;
            particle.x -= dx * force;
            particle.y -= dy * force;
          }

          // Wrap around screen edges
          if (particle.x < 0) particle.x = canvas.width;
          if (particle.x > canvas.width) particle.x = 0;
          if (particle.y < 0) particle.y = canvas.height;
          if (particle.y > canvas.height) particle.y = 0;

          // Draw particle with specified color
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fillStyle = particleColor; // Use provided color directly
          ctx.fill();

          // Draw connections with matching color
          for (let j = index + 1; j < particlesRef.current.length; j++) {
            const otherParticle = particlesRef.current[j];
            const dx = particle.x - otherParticle.x;
            const dy = particle.y - otherParticle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 150) {
              ctx.beginPath();
              ctx.moveTo(particle.x, particle.y);
              ctx.lineTo(otherParticle.x, otherParticle.y);
              const opacity = 0.8 * (1 - distance / 150);
              const [colorBase] = particleColor.split(', '); // Extract the color base (rgba or hsla)
              ctx.strokeStyle = `${colorBase}, ${opacity * 0.2})`; // Adjust opacity for connections
              ctx.lineWidth = 1.5;
              ctx.stroke();
            }
          }
        });

        animationFrameRef.current = requestAnimationFrame(animate);
      } catch (error) {
        console.error('Animation error:', error);
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      }
    };

    // Track mouse movement with throttling
    let throttleTimeout: number;
    const handleMouseMove = (e: MouseEvent) => {
      if (!throttleTimeout) {
        throttleTimeout = window.setTimeout(() => {
          mouseRef.current = {
            x: e.clientX,
            y: e.clientY,
          };
          throttleTimeout = 0;
        }, 16);
      }
    };

    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('mousemove', handleMouseMove);

    initParticles();
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (throttleTimeout) {
        clearTimeout(throttleTimeout);
      }
    };
  }, [particleColor]);

  return (
    <canvas
      ref={canvasRef}
      className={cn("absolute inset-0 -z-10", className)}
    />
  );
}