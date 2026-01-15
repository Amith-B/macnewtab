import React, { useEffect, useRef } from "react";

const GlobeTheme: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);
    let rotation = 0;

    const animate = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#0c0c0c";
      ctx.fillRect(0, 0, w, h);

      const R = Math.min(w, h) / 3;
      const cx = w / 2;
      const cy = h / 2;

      ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      ctx.lineWidth = 1;

      // Simple Wireframe Globe
      // Longitude
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI; // 0 to 180
        // Rotate this ellipse
        ctx.beginPath();
        ctx.ellipse(
          cx,
          cy,
          R * Math.abs(Math.cos(rotation + angle)),
          R,
          0,
          0,
          Math.PI * 2
        );
        ctx.stroke();
      }
      // Latitude
      for (let i = 1; i < 8; i++) {
        const y = cy + (i / 9 - 0.5) * 2 * R;
        const rAtY = Math.sqrt(R * R - (y - cy) * (y - cy));
        ctx.beginPath();
        // pseudo-3d effect, just draw horizontal for now (quick globe)
        // Proper: draw line
        ctx.ellipse(cx, y, rAtY, 10, 0, 0, Math.PI * 2);
        // Wait that draws discs. Just simple lines.
        // ctx.moveTo(cx - rAtY, y);
        // ctx.lineTo(cx + rAtY, y);
        // Let's use ellipses but compressed
        ctx.ellipse(cx, y, rAtY, rAtY * 0.1, 0, 0, Math.PI * 2);

        ctx.stroke();
      }

      rotation += 0.005;
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
      className="globe-canvas"
      style={{ display: "block" }}
    />
  );
};

export default GlobeTheme;
