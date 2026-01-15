import React, { useEffect, useRef } from "react";

const DNATheme: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    let t = 0;
    let animationId: number;

    const animate = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#1a1a2e"; // deep blue bg
      ctx.fillRect(0, 0, w, h);

      const particles = 50;
      const amplitude = 100;
      const separation = 30;
      const centerX = w / 2;
      const startY = (h - particles * separation) / 2;

      for (let i = 0; i < particles; i++) {
        const y = startY + i * separation;
        // Strand 1 (Sine)
        const x1 = centerX + Math.sin(i * 0.3 + t) * amplitude;
        // Strand 2 (Cosine shift - actually just Sine offset by PI)
        const x2 = centerX + Math.sin(i * 0.3 + t + Math.PI) * amplitude;

        // Draw strands
        ctx.beginPath();
        ctx.arc(x1, y, 6, 0, Math.PI * 2);
        ctx.fillStyle = "#ff0055";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x2, y, 6, 0, Math.PI * 2);
        ctx.fillStyle = "#00ffff";
        ctx.fill();

        // Draw connector occasionally
        if (i % 3 === 0) {
          ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
          ctx.beginPath();
          ctx.moveTo(x1, y);
          ctx.lineTo(x2, y);
          ctx.stroke();
        }
      }

      t += 0.05;
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
      className="dna-canvas"
      style={{ display: "block" }}
    />
  );
};

export default DNATheme;
