import React, { useEffect, useRef } from "react";

const RipplesTheme: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Ripple logic
    // We can store a list of ripples
    interface Ripple {
      x: number;
      y: number;
      radius: number;
      alpha: number;
      speed: number;
    }

    const ripples: Ripple[] = [];

    const addRipple = (x: number, y: number) => {
      ripples.push({
        x,
        y,
        radius: 1,
        alpha: 1,
        speed: 2,
      });
    };

    let frame = 0;
    let animationId: number;

    // Background gradient or color
    const drawBackground = () => {
      const grd = ctx.createLinearGradient(0, 0, 0, height);
      grd.addColorStop(0, "#001133");
      grd.addColorStop(1, "#003366");
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, width, height);
    };

    const animate = () => {
      if (!ctx) return;
      frame++;

      drawBackground();

      ctx.lineWidth = 2;

      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.radius += r.speed;
        r.alpha -= 0.01;

        if (r.alpha <= 0) {
          ripples.splice(i, 1);
        } else {
          ctx.beginPath();
          ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(100, 200, 255, ${r.alpha})`;
          ctx.stroke();
        }
      }

      // Random rain drops
      if (frame % 5 === 0) {
        addRipple(Math.random() * width, Math.random() * height);
      }

      animationId = requestAnimationFrame(animate);
    };

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      // Only trigger occasionally on move to avoid chaos
      if (frame % 5 === 0) {
        addRipple(e.clientX, e.clientY);
      }
    };

    const handleClick = (e: MouseEvent) => {
      addRipple(e.clientX, e.clientY);
    };

    animate();
    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mousedown", handleClick);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleClick);
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
      }}
    />
  );
};

export default RipplesTheme;
