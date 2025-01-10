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
      const numParticles = Math.min(100, Math.floor((window.innerWidth * window.innerHeight) / 15000)); // More particles

      for (let i = 0; i < numParticles; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 4 + 2, // Larger particles
          speedX: (Math.random() - 0.5) * 0.8, // Faster movement
          speedY: (Math.random() - 0.5) * 0.8,
          opacity: Math.random() * 0.4 + 0.6, // Higher opacity
        });
      }
      particlesRef.current = particles;
    };

    // Animation loop with error handling
    const animate = () => {
      try {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particlesRef.current.forEach((particle, index) => {
          // Update position with slightly more dynamic movement
          particle.x += particle.speedX * (1 + Math.sin(Date.now() * 0.001) * 0.2);
          particle.y += particle.speedY * (1 + Math.cos(Date.now() * 0.001) * 0.2);

          // Mouse interaction with stronger effect
          const dx = mouseRef.current.x - particle.x;
          const dy = mouseRef.current.y - particle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const interactionDistance = 150;

          if (distance < interactionDistance) {
            const force = (1 - distance / interactionDistance) * 0.5;
            particle.x -= dx * force;
            particle.y -= dy * force;
          }

          // Wrap around screen
          if (particle.x < 0) particle.x = canvas.width;
          if (particle.x > canvas.width) particle.x = 0;
          if (particle.y < 0) particle.y = canvas.height;
          if (particle.y > canvas.height) particle.y = 0;

          // Draw particle - more visible black particles
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0, 0, 0, ${particle.opacity})`; // Darker particles
          ctx.fill();

          // Draw connections with higher contrast
          for (let j = index + 1; j < particlesRef.current.length; j++) {
            const otherParticle = particlesRef.current[j];
            const dx = particle.x - otherParticle.x;
            const dy = particle.y - otherParticle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 120) {
              ctx.beginPath();
              ctx.moveTo(particle.x, particle.y);
              ctx.lineTo(otherParticle.x, otherParticle.y);
              ctx.strokeStyle = `rgba(0, 0, 0, ${0.5 * (1 - distance / 120)})`; // More visible connections
              ctx.lineWidth = 1;
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
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 bg-transparent"
      style={{ opacity: 1 }} // Full opacity for maximum visibility
    />
  );
}