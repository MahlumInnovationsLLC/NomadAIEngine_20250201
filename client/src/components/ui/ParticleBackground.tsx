import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
}

export function ParticleBackground() {
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

    // Initialize particles
    const initParticles = () => {
      const particles: Particle[] = [];
      const numParticles = Math.min(75, Math.floor((window.innerWidth * window.innerHeight) / 20000)); // More particles

      for (let i = 0; i < numParticles; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 3 + 2, // Larger particles
          speedX: (Math.random() - 0.5) * 0.3,
          speedY: (Math.random() - 0.5) * 0.3,
          opacity: Math.random() * 0.3 + 0.7, // Much higher opacity
        });
      }
      particlesRef.current = particles;
    };

    // Animation loop with error handling
    const animate = () => {
      try {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particlesRef.current.forEach((particle, index) => {
          // Update position
          particle.x += particle.speedX;
          particle.y += particle.speedY;

          // Mouse interaction with distance limit
          const dx = mouseRef.current.x - particle.x;
          const dy = mouseRef.current.y - particle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const interactionDistance = 100;

          if (distance < interactionDistance) {
            const force = (1 - distance / interactionDistance) * 0.2;
            particle.x -= dx * force;
            particle.y -= dy * force;
          }

          // Wrap around screen
          if (particle.x < 0) particle.x = canvas.width;
          if (particle.x > canvas.width) particle.x = 0;
          if (particle.y < 0) particle.y = canvas.height;
          if (particle.y > canvas.height) particle.y = 0;

          // Draw particle - using rgba for darker color
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0, 0, 0, ${particle.opacity * 0.4})`; // Dark particles
          ctx.fill();

          // Optimize connection drawing by only checking particles ahead
          for (let j = index + 1; j < particlesRef.current.length; j++) {
            const otherParticle = particlesRef.current[j];
            const dx = particle.x - otherParticle.x;
            const dy = particle.y - otherParticle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 100) {
              ctx.beginPath();
              ctx.moveTo(particle.x, particle.y);
              ctx.lineTo(otherParticle.x, otherParticle.y);
              ctx.strokeStyle = `rgba(0, 0, 0, ${0.3 * (1 - distance / 100)})`; // Dark connections
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
        }, 16); // approximately 60fps
      }
    };

    // Initialize and start animation
    const resizeHandler = () => {
      resizeCanvas();
      initParticles();
    };

    window.addEventListener('resize', resizeHandler);
    window.addEventListener('mousemove', handleMouseMove);

    resizeHandler();
    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeHandler);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (throttleTimeout) {
        clearTimeout(throttleTimeout);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 bg-transparent pointer-events-none"
      style={{ opacity: 0.7 }}
    />
  );
}