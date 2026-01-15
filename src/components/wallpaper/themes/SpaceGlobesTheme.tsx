import React, { useEffect, useRef } from "react";

const SpaceGlobesTheme: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const globes: any[] = [];
    const numGlobes = 800;
    const speed = 0.002;
    let angleX = 0;
    let angleY = 0;

    class Globe {
      x: number;
      y: number;
      z: number;
      radius: number;
      color: string;

      constructor() {
        this.x = (Math.random() - 0.5) * w;
        this.y = (Math.random() - 0.5) * h;
        this.z = Math.random() * w; // Depth
        this.radius = Math.random() * 2;
        const r = Math.floor(Math.random() * 100 + 155);
        const g = Math.floor(Math.random() * 100 + 155);
        const b = 255;
        this.color = `rgb(${r},${g},${b})`;
      }

      draw() {
        if (!ctx) return;

        // 3D Rotation
        const cosX = Math.cos(angleX);
        const sinX = Math.sin(angleX);
        const cosY = Math.cos(angleY);
        const sinY = Math.sin(angleY);

        let x1 = this.x * cosY - this.z * sinY;
        let z1 = this.z * cosY + this.x * sinY;

        let y1 = this.y * cosX - z1 * sinX;
        let z2 = z1 * cosX + this.y * sinX;

        // Perspective projection
        const perspective = 300 / (300 + z2);
        const x2 = x1 * perspective + w / 2;
        const y2 = y1 * perspective + h / 2;
        const scale = perspective;

        if (scale > 0) {
          ctx.beginPath();
          ctx.arc(x2, y2, this.radius * scale * 2, 0, Math.PI * 2);
          ctx.fillStyle = this.color;
          ctx.fill();
        }
      }
    }

    for (let i = 0; i < numGlobes; i++) {
      globes.push(new Globe());
    }

    let mouseX = 0;
    let mouseY = 0;

    let animationId: number;

    const animate = () => {
      if (!ctx) return;
      ctx.fillStyle = "rgba(0, 0, 0, 0.2)"; // Trailing effect
      ctx.fillRect(0, 0, w, h);

      angleY += (mouseX - w / 2) * 0.0001;
      angleX += (mouseY - h / 2) * 0.0001;

      // Auto rotation if mouse is center
      angleY += speed;

      globes.forEach((globe) => globe.draw());

      animationId = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const handleResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("resize", handleResize);
    animate();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return <canvas ref={canvasRef} className="space-globes-canvas" />;
};

export default SpaceGlobesTheme;
