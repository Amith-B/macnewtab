import React, { useEffect, useRef } from "react";

const NetTheme: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Elastic Grid
    const spacing = 40;
    const cols = Math.ceil(width / spacing) + 1;
    const rows = Math.ceil(height / spacing) + 1;

    interface Point {
      x: number;
      y: number;
      originX: number;
      originY: number;
      vx: number;
      vy: number;
    }

    const points: Point[][] = [];

    for (let i = 0; i < cols; i++) {
      points[i] = [];
      for (let j = 0; j < rows; j++) {
        points[i][j] = {
          x: i * spacing,
          y: j * spacing,
          originX: i * spacing,
          originY: j * spacing,
          vx: 0,
          vy: 0,
        };
      }
    }

    let mouse = { x: -1000, y: -1000 };

    let animationId: number;

    const animate = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#111";
      ctx.fillRect(0, 0, width, height);

      // Update physics
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const p = points[i][j];

          // Return to origin (spring)
          const dOx = p.originX - p.x;
          const dOy = p.originY - p.y;

          p.vx += dOx * 0.05; // spring strength
          p.vy += dOy * 0.05;

          // Mouse repulsion
          const dmx = p.x - mouse.x;
          const dmy = p.y - mouse.y;
          const dist = Math.sqrt(dmx * dmx + dmy * dmy);

          if (dist < 150) {
            const force = (150 - dist) / 150;
            p.vx += (dmx / dist) * force * 5;
            p.vy += (dmy / dist) * force * 5;
          }

          // Damping
          p.vx *= 0.9;
          p.vy *= 0.9;

          p.x += p.vx;
          p.y += p.vy;
        }
      }

      // Draw Net
      ctx.beginPath();
      ctx.strokeStyle = "rgba(0, 255, 128, 0.4)"; // Bright Greenish
      ctx.lineWidth = 1;

      // Horizontal lines
      for (let j = 0; j < rows; j++) {
        // To draw smooth curves we could use bezier.. but straight lines are faster
        // Let's use simple lines
        for (let i = 0; i < cols - 1; i++) {
          ctx.moveTo(points[i][j].x, points[i][j].y);
          ctx.lineTo(points[i + 1][j].x, points[i + 1][j].y);
        }
      }

      // Vertical lines
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows - 1; j++) {
          ctx.moveTo(points[i][j].x, points[i][j].y);
          ctx.lineTo(points[i][j + 1].x, points[i][j + 1].y);
        }
      }
      ctx.stroke();

      animationId = requestAnimationFrame(animate);
    };

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      // Re-init? or just leave breakage
      // For simplicity, just reload window usually, but here we should re-init points
      // Doing full re-init might reset animation but it's cleaner
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    animate();
    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: -1,
        backgroundColor: "#111",
      }}
    />
  );
};

export default NetTheme;
