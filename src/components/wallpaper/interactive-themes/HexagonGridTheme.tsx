import React, { useEffect, useRef } from "react";

const HexagonGridTheme: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    let mouse = { x: -100, y: -100 };
    let hexagons: Hexagon[] = [];
    const hexRadius = 30; // Size of hexagons
    const hexHeight = Math.sqrt(3) * hexRadius;
    const hexWidth = 2 * hexRadius;

    // Spacing
    const xSpacing = hexWidth * 0.75;
    const ySpacing = hexHeight;

    class Hexagon {
      x: number;
      y: number;
      color: string;
      baseColor: string;
      activeColor: string;
      intensity: number;

      constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.baseColor = "#1a1a1a";
        this.activeColor = "#00f7ff"; // Cyan glow
        this.color = this.baseColor;
        this.intensity = 0;
      }

      draw() {
        if (!ctx) return;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i;
          const xPos = this.x + hexRadius * Math.cos(angle);
          const yPos = this.y + hexRadius * Math.sin(angle);
          if (i === 0) ctx.moveTo(xPos, yPos);
          else ctx.lineTo(xPos, yPos);
        }
        ctx.closePath();

        // Color interpolation
        // Standard geometric/techy look: Fill dark, stroke light
        // We will fill based on intensity

        // More subtle background
        const fillStyle = `rgb(${Math.round(20 + 20 * this.intensity)}, ${Math.round(20 + 40 * this.intensity)}, ${Math.round(20 + 50 * this.intensity)})`;

        ctx.fillStyle = fillStyle;
        ctx.strokeStyle = `rgba(50, 50, 50, ${1 - this.intensity * 0.5})`; // Visible grid lines
        if (this.intensity > 0.1) {
          ctx.strokeStyle = `rgba(0, 247, 255, ${this.intensity})`; // Glowing stroke
        }

        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();
      }

      update() {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 150) {
          this.intensity += 0.1;
        } else {
          this.intensity -= 0.05;
        }

        if (this.intensity > 1) this.intensity = 1;
        if (this.intensity < 0) this.intensity = 0;

        this.draw();
      }
    }

    const init = () => {
      hexagons = [];
      let rows = Math.ceil(height / ySpacing) + 2;
      let cols = Math.ceil(width / xSpacing) + 2;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          let xOffset = c * xSpacing;
          let yOffset = r * ySpacing;

          if (c % 2 === 1) {
            yOffset += ySpacing / 2;
          }

          hexagons.push(new Hexagon(xOffset, yOffset));
        }
      }
    };

    let animationId: number;
    const animate = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      // Background
      ctx.fillStyle = "#0d0d0d";
      ctx.fillRect(0, 0, width, height);

      hexagons.forEach((hex) => hex.update());
      animationId = requestAnimationFrame(animate);
    };

    // Event listeners
    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      init();
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.x;
      mouse.y = e.y;
    };

    const handleMouseLeave = () => {
      mouse.x = -100;
      mouse.y = -100;
    };

    init();
    animate();

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseout", handleMouseLeave);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseout", handleMouseLeave);
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

export default HexagonGridTheme;
