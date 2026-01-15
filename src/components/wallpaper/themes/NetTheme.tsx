import React, { useEffect, useRef } from "react";

const NetTheme: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    let t = 0;

    const animate = () => {
      if (!ctx) return;
      ctx.fillStyle = "#101010";
      ctx.fillRect(0, 0, w, h);

      const gridSize = 50;
      const waveH = 20;

      ctx.strokeStyle = "rgba(100, 100, 255, 0.5)";

      for (let y = 0; y <= h; y += gridSize) {
        ctx.beginPath();
        for (let x = 0; x <= w; x += 10) {
          const yOffset = Math.sin(x * 0.01 + t + y * 0.005) * waveH;
          ctx.lineTo(x, y + yOffset);
        }
        ctx.stroke();
      }

      for (let x = 0; x <= w; x += gridSize) {
        ctx.beginPath();
        for (let y = 0; y <= h; y += 10) {
          const xOffset = Math.cos(y * 0.01 + t + x * 0.005) * waveH;
          ctx.lineTo(x + xOffset, y);
        }
        ctx.stroke();
      }

      t += 0.02;
      requestAnimationFrame(animate);
    };

    const handleResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);
    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="net-canvas"
      style={{ display: "block" }}
    />
  );
};

export default NetTheme;
