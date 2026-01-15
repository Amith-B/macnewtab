import React, { useEffect, useRef } from "react";

const WormholeTheme: React.FC = () => {
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
      // Trail
      ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
      ctx.fillRect(0, 0, w, h);

      const centerX = w / 2;
      const centerY = h / 2;
      const maxRadius = Math.sqrt(centerX ** 2 + centerY ** 2);

      // Draw spiral arms
      for (let i = 0; i < 200; i++) {
        const angle = 0.1 * i + t;
        const radius = (i * 5) % maxRadius;

        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;

        const size = (radius / maxRadius) * 4;

        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        const hue = (i * 2 + t * 50) % 360;
        ctx.fillStyle = `hsl(${hue}, 80%, 60%)`;
        ctx.fill();
      }

      t += 0.05;
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
      className="wormhole-canvas"
      style={{ display: "block", background: "black" }}
    />
  );
};

export default WormholeTheme;
