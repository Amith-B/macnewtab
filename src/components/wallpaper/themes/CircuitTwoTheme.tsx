import React, { useEffect, useRef } from "react";

const CircuitTwoTheme: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    // New animation logic from the instruction
    const signals: any[] = [];
    const gridSize = 20;
    const pathSpeed = 2;

    const drawGrid = () => {
      if (!ctx) return;
      ctx.strokeStyle = "rgba(0, 50, 100, 0.2)";
      ctx.lineWidth = 0.5;

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

    const createSignal = () => {
      const startX = Math.floor(Math.random() * (w / gridSize)) * gridSize;
      const startY = Math.floor(Math.random() * (h / gridSize)) * gridSize;
      const direction = Math.random() > 0.5 ? 0 : 1; // 0 for horizontal, 1 for vertical

      signals.push({
        x: startX,
        y: startY,
        dx: direction === 0 ? pathSpeed : 0,
        dy: direction === 1 ? pathSpeed : 0,
        life: Math.random() * 100 + 50,
      });
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
      className="circuit-two-canvas"
      style={{ display: "block", background: "#0f172a" }}
    />
  );
};

export default CircuitTwoTheme;
