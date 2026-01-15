import React, { useEffect, useRef } from "react";

const HexagonsTheme: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const a = (2 * Math.PI) / 6;
    const r = 30;

    const drawHexagon = (x: number, y: number, r: number, color: string) => {
      if (!ctx) return;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        ctx.lineTo(x + r * Math.cos(a * i), y + r * Math.sin(a * i));
      }
      ctx.closePath();
      ctx.strokeStyle = color;
      ctx.stroke();
    };

    const hexes: any[] = [];
    const rows = Math.ceil(h / (r * 1.5)) + 1;
    const cols = Math.ceil(w / (r * Math.sqrt(3))) + 1;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * r * Math.sqrt(3) + ((row % 2) * r * Math.sqrt(3)) / 2;
        const y = row * r * 1.5;
        hexes.push({ x, y, pulse: Math.random() * Math.PI });
      }
    }

    const animate = () => {
      if (!ctx) return;
      ctx.fillStyle = "#111";
      ctx.fillRect(0, 0, w, h);

      hexes.forEach((hex) => {
        hex.pulse += 0.05;
        const intensity = Math.sin(hex.pulse);
        const color = `rgba(0, 255, 255, ${Math.abs(intensity) * 0.5 + 0.1})`;
        drawHexagon(hex.x, hex.y, r, color);
      });

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
      className="hexagons-canvas"
      style={{ display: "block" }}
    />
  );
};

export default HexagonsTheme;
