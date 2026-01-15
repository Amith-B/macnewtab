import React, { useEffect, useRef } from "react";

const SnowTheme: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const snowflakes: any[] = [];
    const maxFlakes = 200;

    class Snowflake {
      x: number;
      y: number;
      radius: number;
      speed: number;
      wind: number;

      constructor() {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.radius = Math.random() * 3 + 1;
        this.speed = Math.random() * 2 + 0.5;
        this.wind = Math.random() * 1 - 0.5;
      }

      draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
        ctx.fill();
      }

      update() {
        this.y += this.speed;
        this.x += this.wind;

        if (this.y > h) {
          this.y = -this.radius;
          this.x = Math.random() * w;
        }
        if (this.x > w) this.x = 0;
        if (this.x < 0) this.x = w;

        this.draw();
      }
    }

    const init = () => {
      snowflakes.length = 0;
      for (let i = 0; i < maxFlakes; i++) {
        snowflakes.push(new Snowflake());
      }
    };

    const animate = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);
      snowflakes.forEach((flake) => flake.update());
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
      className="snow-canvas"
      style={{ display: "block", background: "#1e293b" }}
    />
  );
};

export default SnowTheme;
