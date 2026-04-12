import React, { useEffect, useRef } from "react";

const PlasmaTheme: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);
    let animationId: number;
    let resizeTimer: ReturnType<typeof setTimeout>;

    let t = 0;

    // Create the offscreen canvas ONCE and reuse it
    let wScaled = Math.floor(w / 4);
    let hScaled = Math.floor(h / 4);
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = wScaled;
    tempCanvas.height = hScaled;
    const tempCtx = tempCanvas.getContext("2d");

    const animate = () => {
      if (!ctx || !tempCtx) return;

      const imageData = tempCtx.createImageData(wScaled, hScaled);
      const data = imageData.data;

      for (let x = 0; x < wScaled; x++) {
        for (let y = 0; y < hScaled; y++) {
          const value =
            Math.sin(x / 16.0) +
            Math.sin(y / 8.0) +
            Math.sin((x + y + t) / 16.0) +
            Math.sin(Math.sqrt(x * x + y * y) / 8.0);
          const index = (x + y * wScaled) * 4;
          // Map -4..4 to 0..255 colors (purple/pink/blue)
          const r = Math.floor(128 + 64 * Math.sin(value * Math.PI));
          const g = Math.floor(64 + 64 * Math.sin(value * Math.PI + 2));
          const b = Math.floor(128 + 64 * Math.sin(value * Math.PI + 4));

          data[index] = r;
          data[index + 1] = g;
          data[index + 2] = b;
          data[index + 3] = 255;
        }
      }

      // Draw to reused offscreen canvas, then scale up
      tempCtx.putImageData(imageData, 0, 0);

      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(tempCanvas, 0, 0, w, h);

      t += 1; // Speed
      animationId = requestAnimationFrame(animate);
    };

    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
        wScaled = Math.floor(w / 4);
        hScaled = Math.floor(h / 4);
        tempCanvas.width = wScaled;
        tempCanvas.height = hScaled;
      }, 200);
    };

    window.addEventListener("resize", handleResize);
    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationId);
      clearTimeout(resizeTimer);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="plasma-canvas"
      style={{ display: "block" }}
    />
  );
};

export default PlasmaTheme;
