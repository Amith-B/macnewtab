import React, { useEffect, useRef } from "react";

const StarZoomTheme: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const stars: any[] = [];
    const maxStars = 800;

    class Star {
      x: number;
      y: number;
      z: number;

      constructor() {
        this.x = (Math.random() - 0.5) * w;
        this.y = (Math.random() - 0.5) * h;
        this.z = Math.random() * w; // Depth
      }

      draw() {
        if (!ctx) return;

        // Perspective
        const scale = w / this.z;
        const x2d = this.x * scale + w / 2;
        const y2d = this.y * scale + h / 2;
        const radius = Math.max(0, 1.5 * scale); // Avoid negative radius

        if (x2d >= 0 && x2d <= w && y2d >= 0 && y2d <= h) {
          ctx.beginPath();
          ctx.arc(x2d, y2d, radius, 0, Math.PI * 2);
          ctx.fillStyle = "white";
          ctx.fill();
        }
      }

      update(speed: number) {
        this.z -= speed;
        if (this.z < 1) {
          this.z = w;
          this.x = (Math.random() - 0.5) * w;
          this.y = (Math.random() - 0.5) * h;
        }
        this.draw();
      }
    }

    const init = () => {
      stars.length = 0;
      for (let i = 0; i < maxStars; i++) {
        stars.push(new Star());
      }
    };

    let speed = 10;
    const animate = () => {
      if (!ctx) return;
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, w, h);
      stars.forEach((star) => star.update(speed));
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
      className="star-zoom-canvas"
      style={{ display: "block" }}
    />
  );
};

export default StarZoomTheme;
