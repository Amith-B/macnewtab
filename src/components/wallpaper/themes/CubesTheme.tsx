import React, { useEffect, useRef } from "react";

const CubesTheme: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    // Simple 3D Cubes wireframe
    const cubes: any[] = [];

    class Cube {
      x: number;
      y: number;
      z: number;
      size: number;

      constructor() {
        this.x = (Math.random() - 0.5) * w;
        this.y = (Math.random() - 0.5) * h;
        this.z = Math.random() * w;
        this.size = 50;
      }

      project(x: number, y: number, z: number) {
        const scale = 400 / (400 + z);
        return {
          x: x * scale + w / 2,
          y: y * scale + h / 2,
          scale,
        };
      }

      draw() {
        if (!ctx || this.z <= -300) return;

        const vertices = [
          [-1, -1, -1],
          [1, -1, -1],
          [1, 1, -1],
          [-1, 1, -1],
          [-1, -1, 1],
          [1, -1, 1],
          [1, 1, 1],
          [-1, 1, 1],
        ];

        const points = vertices.map((v) =>
          this.project(
            this.x + v[0] * this.size,
            this.y + v[1] * this.size,
            this.z + v[2] * this.size
          )
        );

        ctx.strokeStyle = `rgba(0, 255, 128, ${0.5 * points[0].scale})`;
        ctx.beginPath();

        // Front
        ctx.moveTo(points[0].x, points[0].y);
        ctx.lineTo(points[1].x, points[1].y);
        ctx.lineTo(points[2].x, points[2].y);
        ctx.lineTo(points[3].x, points[3].y);
        ctx.closePath();

        // Back
        ctx.moveTo(points[4].x, points[4].y);
        ctx.lineTo(points[5].x, points[5].y);
        ctx.lineTo(points[6].x, points[6].y);
        ctx.lineTo(points[7].x, points[7].y);
        ctx.closePath();

        // Connect lines
        for (let i = 0; i < 4; i++) {
          ctx.moveTo(points[i].x, points[i].y);
          ctx.lineTo(points[i + 4].x, points[i + 4].y);
        }
        ctx.stroke();
      }

      update() {
        this.z -= 2;
        if (this.z < -300) {
          this.z = w;
          this.x = (Math.random() - 0.5) * w;
          this.y = (Math.random() - 0.5) * h;
        }
        this.draw();
      }
    }

    for (let i = 0; i < 30; i++) cubes.push(new Cube());

    const animate = () => {
      if (!ctx) return;
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, w, h);
      cubes.forEach((c) => c.update());
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
      className="cubes-canvas"
      style={{ display: "block" }}
    />
  );
};

export default CubesTheme;
