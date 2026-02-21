import React, { useEffect, useRef } from "react";

const WavesInteractiveTheme: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let mouse = { x: width / 2, y: height / 2 };

    // Wave parameters
    const increment = 0.02;
    let frame = 0;

    // Setup lines
    const lineCount = 50;

    // Color palette
    // const colors = ["#00a8ff", "#9c88ff", "#fbc531", "#4cd137", "#487eb0"];

    const drawWave = (
      y: number,
      color: string,
      offset: number,
      amplitude: number,
    ) => {
      if (!ctx) return;
      ctx.beginPath();
      // ctx.moveTo(0, y);

      for (let i = 0; i < width; i += 20) {
        // Optimization: step by 20px
        // Calculate distance from mouse to this point (i, y)
        // to create local disturbance
        const dist = Math.abs(i - mouse.x);

        // Apply mouse effect vertically only if mouse is roughly at this y height?
        // Or simpler: global x-based disturbance

        // Let's make mouse Y affect frequency/amplitude globally or locally
        const distY = Math.abs(y - mouse.y);
        const distance = Math.sqrt(dist * dist + distY * distY);
        let localAmp = amplitude;
        const radius = 300;

        if (distance < radius) {
          // Close to mouse
          localAmp += 50 * (1 - distance / radius);
        }

        const finalY =
          y + Math.sin(i * 0.01 + frame * increment + offset) * localAmp;

        if (i === 0) {
          ctx.moveTo(i, finalY);
        } else {
          ctx.lineTo(i, finalY);
        }
      }

      ctx.strokeStyle = color;
      ctx.lineWidth = 2; // Thin lines
      ctx.stroke();
    };

    let animationId: number;
    const animate = () => {
      if (!ctx) return;
      // Dark trail for neon look
      ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
      ctx.fillRect(0, 0, width, height);

      frame++;

      // Draw multiple waves
      for (let i = 0; i < lineCount; i++) {
        const y = (height / lineCount) * i;
        // Gradient color based on position
        const hue = Math.abs(Math.sin(frame * 0.005 + i * 0.05)) * 360;
        const color = `hsl(${hue}, 50%, 50%)`;

        drawWave(y, color, i * 0.5, 20);
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
        backgroundColor: "#000", // pure black background
      }}
    />
  );
};

export default WavesInteractiveTheme;
