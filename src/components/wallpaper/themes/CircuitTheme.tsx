import React, { useEffect, useRef } from "react";

const CircuitTheme: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);
    const gridSize = 40;
    const pathSpeed = 5;

    // Grid lines
    const drawGrid = () => {
      if (!ctx) return;
      ctx.strokeStyle = "rgba(0, 255, 255, 0.1)";
      ctx.lineWidth = 1;

      for (let x = 0; x <= w; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y <= h; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
    };

    interface Signal {
      x: number;
      y: number;
      dx: number;
      dy: number;
      life: number;
    }
    const signals: Signal[] = [];

    const createSignal = () => {
      // Find a random grid point
      const gx = Math.floor(Math.random() * (w / gridSize)) * gridSize;
      const gy = Math.floor(Math.random() * (h / gridSize)) * gridSize;

      const dir = Math.random() > 0.5 ? "H" : "V";
      const dx =
        dir === "H" ? (Math.random() > 0.5 ? pathSpeed : -pathSpeed) : 0;
      const dy =
        dir === "V" ? (Math.random() > 0.5 ? pathSpeed : -pathSpeed) : 0;

      signals.push({ x: gx, y: gy, dx, dy, life: 100 });
    };

    let animationId: number;

    const animate = () => {
      if (!ctx) return;
      // Fade effect
      ctx.fillStyle = "rgba(0, 10, 20, 0.1)";
      ctx.fillRect(0, 0, w, h);

      drawGrid();

      if (Math.random() < 0.1) createSignal();

      ctx.fillStyle = "#0ff";

      for (let i = signals.length - 1; i >= 0; i--) {
        const s = signals[i];
        s.x += s.dx;
        s.y += s.dy;
        s.life--;

        // Draw signal head
        ctx.beginPath();
        ctx.arc(s.x, s.y, 3, 0, Math.PI * 2);
        ctx.fill();

        // Chance to turn at intersection
        if (
          s.x % gridSize === 0 &&
          s.y % gridSize === 0 &&
          Math.random() < 0.2
        ) {
          if (s.dx !== 0) {
            s.dx = 0;
            s.dy = Math.random() > 0.5 ? pathSpeed : -pathSpeed;
          } else {
            s.dy = 0;
            s.dx = Math.random() > 0.5 ? pathSpeed : -pathSpeed;
          }
        }

        if (s.life <= 0 || s.x < 0 || s.x > w || s.y < 0 || s.y > h) {
          signals.splice(i, 1);
        }
      }

      animationId = requestAnimationFrame(animate);
    };

    const handleResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);
    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="circuit-canvas"
      style={{ display: "block", background: "#000a14" }}
    />
  );
};

export default CircuitTheme;
