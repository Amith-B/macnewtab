import React, { useEffect, useRef } from "react";

const BreakoutTheme: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Game state
    const paddleHeight = 10;
    const paddleWidth = 100;
    let paddleX = (width - paddleWidth) / 2;

    let x = width / 2;
    let y = height - 30;
    let dx = 4;
    let dy = -4;
    const ballRadius = 8;

    // Bricks
    const brickRowCount = 5;
    const brickColumnCount = 10;
    const brickPadding = 10;
    const brickOffsetTop = 50;
    const brickOffsetLeft = 30;
    // Calc dynamic width
    const brickWidth =
      (width - brickOffsetLeft * 2 - brickPadding * (brickColumnCount - 1)) /
      brickColumnCount;
    const brickHeight = 20;

    const bricks: { x: number; y: number; status: number }[][] = [];

    // Init bricks
    const initBricks = () => {
      for (let c = 0; c < brickColumnCount; c++) {
        bricks[c] = [];
        for (let r = 0; r < brickRowCount; r++) {
          bricks[c][r] = { x: 0, y: 0, status: 1 };
        }
      }
    };
    initBricks();

    let mouseX = 0;

    const drawBall = () => {
      if (!ctx) return;
      ctx.beginPath();
      ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
      ctx.fillStyle = "#0095DD";
      ctx.fill();
      ctx.closePath();
    };

    const drawPaddle = () => {
      if (!ctx) return;
      ctx.beginPath();
      ctx.rect(paddleX, height - paddleHeight - 10, paddleWidth, paddleHeight); // 10px from bottom
      ctx.fillStyle = "#0095DD";
      ctx.fill();
      ctx.closePath();
    };

    const drawBricks = () => {
      if (!ctx) return;
      for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
          if (bricks[c][r].status === 1) {
            const brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
            const brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
            bricks[c][r].x = brickX;
            bricks[c][r].y = brickY;
            ctx.beginPath();
            ctx.rect(brickX, brickY, brickWidth, brickHeight);
            ctx.fillStyle = `hsl(${c * 30}, 70%, 50%)`;
            ctx.fill();
            ctx.closePath();
          }
        }
      }
    };

    const collisionDetection = () => {
      for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
          const b = bricks[c][r];
          if (b.status === 1) {
            if (
              x > b.x &&
              x < b.x + brickWidth &&
              y > b.y &&
              y < b.y + brickHeight
            ) {
              dy = -dy;
              b.status = 0;
            }
          }
        }
      }
    };

    let animationId: number;

    const animate = () => {
      if (!ctx) return;
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, width, height);

      drawBricks();
      drawBall();
      drawPaddle();
      collisionDetection();

      // Wall collision
      if (x + dx > width - ballRadius || x + dx < ballRadius) {
        dx = -dx;
      }
      if (y + dy < ballRadius) {
        dy = -dy;
      } else if (y + dy > height - ballRadius - 10 - paddleHeight) {
        // Paddle hit level
        if (x > paddleX && x < paddleX + paddleWidth) {
          dy = -dy;
          // Speed up slightly
          dx = dx * 1.05;
          dy = dy * 1.05;
        }
      }

      if (y + dy > height) {
        // Game Over - Reset
        x = width / 2;
        y = height - 30;
        dx = 4;
        dy = -4;
        initBricks();
      }

      x += dx;
      y += dy;

      // Paddle update
      paddleX = mouseX - paddleWidth / 2;
      // Clamp
      if (paddleX < 0) paddleX = 0;
      if (paddleX > width - paddleWidth) paddleX = width - paddleWidth;

      animationId = requestAnimationFrame(animate);
    };

    // Re-calc brick width on resize
    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      // Reset bricks positions? Or just let them redraw
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
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

export default BreakoutTheme;
