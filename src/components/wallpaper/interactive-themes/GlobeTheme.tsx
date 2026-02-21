import React, { useEffect, useRef } from "react";

const GlobeTheme: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const globeRadius = Math.min(width, height) * 0.35;
    // Fibonacci sphere for even distribution
    const numPoints = 800;
    const phi = Math.PI * (3 - Math.sqrt(5)); // golden angle

    // Let's stick to 3D point storage
    let points: { x: number; y: number; z: number }[] = [];
    for (let i = 0; i < numPoints; i++) {
      const y = 1 - (i / (numPoints - 1)) * 2;
      const radius = Math.sqrt(1 - y * y);
      const theta = phi * i;
      const x = Math.cos(theta) * radius;
      const z = Math.sin(theta) * radius;
      points.push({
        x: x * globeRadius,
        y: y * globeRadius,
        z: z * globeRadius,
      });
    }

    let rotation = { x: 0, y: 0 };
    let targetRotation = { x: 0.001, y: 0.001 };

    let animationId: number;

    const animate = () => {
      if (!ctx) return;
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, width, height);

      // Auto rotate
      rotation.x += targetRotation.x;
      rotation.y += targetRotation.y;

      // Draw points
      ctx.fillStyle = "#4a90e2";

      points.forEach((p) => {
        // Rotate Y
        let x1 = p.x * Math.cos(rotation.y) - p.z * Math.sin(rotation.y);
        let z1 = p.z * Math.cos(rotation.y) + p.x * Math.sin(rotation.y);

        // Rotate X
        let y1 = p.y * Math.cos(rotation.x) - z1 * Math.sin(rotation.x);
        let z2 = z1 * Math.cos(rotation.x) + p.y * Math.sin(rotation.x);

        // Project
        // We barely use scale for position to keep it orthogonal-ish or just simple
        // Actually let's use standard projection

        // To keep it centered:
        // We assume camera is at z = -infinity? or center
        // Simple orthographic for now usually looks cleaner unless we zoom
        // Let's adds slight perspective
        // Simplified:
        const projX = x1 + width / 2;
        const projY = y1 + height / 2;

        // Depth based alpha
        const alpha = (z2 + globeRadius) / (2 * globeRadius);

        if (z2 > 0) {
          // Front dots
          ctx.fillStyle = `rgba(74, 144, 226, ${0.4 + alpha * 0.6})`;
          ctx.beginPath();
          ctx.arc(projX, projY, 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Back dots - fainter
          ctx.fillStyle = `rgba(74, 144, 226, ${0.1 + alpha * 0.3})`;
          ctx.beginPath();
          ctx.arc(projX, projY, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      animationId = requestAnimationFrame(animate);
    };

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      // Map mouse position to rotation speed
      const nx = (e.clientX - width / 2) / width; // -0.5 to 0.5
      const ny = (e.clientY - height / 2) / height;

      targetRotation.y = nx * 0.05;
      targetRotation.x = ny * 0.05;
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

export default GlobeTheme;
