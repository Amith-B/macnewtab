import React, { useEffect, useRef } from "react";

const LavaTheme: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const balls: any[] = [];
    const numBalls = 15;

    for (let i = 0; i < numBalls; i++) {
      balls.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        radius: Math.random() * 50 + 40,
      });
    }

    const animate = () => {
      if (!ctx) return;
      ctx.fillStyle = "#220000";
      ctx.fillRect(0, 0, w, h);

      // Metaball effect simulation using blur contrast
      // Actually standard canvas filters are slow, let's just do glowy balls
      ctx.globalCompositeOperation = "lighter";

      balls.forEach((ball) => {
        ball.x += ball.vx;
        ball.y += ball.vy;

        if (ball.x < 0 || ball.x > w) ball.vx *= -1;
        if (ball.y < 0 || ball.y > h) ball.vy *= -1;

        const gradient = ctx.createRadialGradient(
          ball.x,
          ball.y,
          0,
          ball.x,
          ball.y,
          ball.radius
        );
        gradient.addColorStop(0, "rgba(255, 100, 0, 0.8)");
        gradient.addColorStop(0.5, "rgba(255, 0, 0, 0.4)");
        gradient.addColorStop(1, "rgba(100, 0, 0, 0)");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.globalCompositeOperation = "source-over";
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
      className="lava-canvas"
      style={{ display: "block" }}
    />
  );
};

export default LavaTheme;
