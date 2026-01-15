import React, { useEffect, useRef } from "react";

const TunnelTheme: React.FC = () => {
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
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = "cyan";
      ctx.lineWidth = 2;

      const centerX = w / 2;
      const centerY = h / 2;

      for (let i = 0; i < 15; i++) {
        let size = ((t + i * 20) % 300) * (Math.max(w, h) / 300);
        if (size < 0) size = 0;
        const alpha = 1 - (size / Math.max(w, h)) * 1.5;

        ctx.strokeStyle = `rgba(0, 255, 255, ${Math.max(0, alpha)})`;
        ctx.strokeRect(centerX - size / 2, centerY - size / 2, size, size);
      }

      t += 1;
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
      className="tunnel-canvas"
      style={{ display: "block" }}
    />
  );
};

export default TunnelTheme;
