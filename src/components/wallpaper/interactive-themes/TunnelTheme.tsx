import React, { useEffect, useRef } from "react";

const TunnelTheme: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let cx = width / 2;
    let cy = height / 2;

    let speed = 2; // Wall speed
    let rings: number[] = []; // Stores radius of rings
    const numRings = 30;
    const maxRadius = Math.sqrt(width * width + height * height);

    // Init rings
    for (let i = 0; i < numRings; i++) {
      rings.push((maxRadius / numRings) * i);
    }

    let mouse = { x: cx, y: cy };

    let animationId: number;

    const animate = () => {
      if (!ctx) return;

      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, width, height);

      // Move center creates parallax look
      cx += (mouse.x - cx) * 0.1;
      cy += (mouse.y - cy) * 0.1;

      ctx.strokeStyle = "#00ff00"; // Retro green
      ctx.lineWidth = 2;

      for (let i = 0; i < rings.length; i++) {
        rings[i] += speed + rings[i] * 0.05; // Accelerate as it gets closer/larger

        if (rings[i] > maxRadius) {
          rings[i] = 0; // reset to center
        }

        ctx.beginPath();
        ctx.arc(cx, cy, rings[i], 0, Math.PI * 2);
        // Color fade based on distance
        const alpha = rings[i] / (maxRadius * 0.5);
        ctx.strokeStyle = `rgba(0, 255, 128, ${Math.min(1, alpha)})`;
        ctx.stroke();
      }

      // Add radial lines
      const numLines = 16;
      for (let i = 0; i < numLines; i++) {
        const angle = ((Math.PI * 2) / numLines) * i;
        ctx.beginPath();
        // Start a bit out from center
        ctx.moveTo(cx + Math.cos(angle) * 10, cy + Math.sin(angle) * 10);
        ctx.lineTo(
          cx + Math.cos(angle) * maxRadius,
          cy + Math.sin(angle) * maxRadius,
        );
        ctx.strokeStyle = "rgba(0, 255, 128, 0.2)";
        ctx.stroke();
      }

      animationId = requestAnimationFrame(animate);
    };

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
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
        backgroundColor: "black",
      }}
    />
  );
};

export default TunnelTheme;
