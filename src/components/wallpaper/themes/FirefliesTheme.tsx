import React, { useEffect, useRef } from "react";

const FirefliesTheme: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const fireflies: any[] = [];
    const maxFireflies = 80;

    class Firefly {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
      fadeSpeed: number;

      constructor() {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.size = Math.random() * 3 + 2;
        this.speedX = Math.random() * 1 - 0.5;
        this.speedY = Math.random() * 1 - 0.5;
        this.opacity = Math.random();
        this.fadeSpeed = Math.random() * 0.02 + 0.005;
      }

      draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 0, ${this.opacity})`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = "yellow";
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x > w || this.x < 0) this.speedX *= -1;
        if (this.y > h || this.y < 0) this.speedY *= -1;

        this.opacity += this.fadeSpeed;
        if (this.opacity > 1 || this.opacity < 0) this.fadeSpeed *= -1;

        this.draw();
      }
    }

    const init = () => {
      fireflies.length = 0;
      for (let i = 0; i < maxFireflies; i++) {
        fireflies.push(new Firefly());
      }
    };

    const animate = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);
      fireflies.forEach((f) => f.update());
      requestAnimationFrame(animate);
    };

    const handleResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      init();
    };

    window.addEventListener("resize", handleResize);
    init();
    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fireflies-canvas"
      style={{ display: "block", background: "#051014" }}
    />
  );
};

export default FirefliesTheme;
