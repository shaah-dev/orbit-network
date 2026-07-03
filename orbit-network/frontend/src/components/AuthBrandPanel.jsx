import { useEffect, useRef } from "react";

export default function AuthBrandPanel() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;
    let W = canvas.width = canvas.offsetWidth;
    let H = canvas.height = canvas.offsetHeight;

    const nodes = Array.from({ length: 28 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.8 + 0.6,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18,
      opacity: Math.random() * 0.5 + 0.2,
    }));

    const MAX_DIST = 130;

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      // connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MAX_DIST) {
            const alpha = (1 - dist / MAX_DIST) * 0.18;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(159,196,255,${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      // nodes
      nodes.forEach((n) => {
        ctx.beginPath();
        const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 3);
        grad.addColorStop(0, `rgba(200,220,255,${n.opacity})`);
        grad.addColorStop(1, "rgba(159,196,255,0)");
        ctx.fillStyle = grad;
        ctx.arc(n.x, n.y, n.r * 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = `rgba(220,235,255,${n.opacity})`;
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();

        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;
      });

      animId = requestAnimationFrame(draw);
    };

    draw();

    const onResize = () => {
      W = canvas.width = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div className="auth-brand-panel">
      <canvas ref={canvasRef} className="brand-canvas" />

      <div className="brand-glow-drift" />
      <div className="brand-glow-core" />

      <div className="brand-logo-wrap">
        <svg
          className="brand-logo-svg"
          viewBox="0 0 200 200"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0d1b3e" />
              <stop offset="30%" stopColor="#2a4fa8" />
              <stop offset="65%" stopColor="#6ea4ff" />
              <stop offset="100%" stopColor="#ffffff" />
            </linearGradient>
            <linearGradient id="ringGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="40%" stopColor="#5b8fee" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#0d1b3e" stopOpacity="0.1" />
            </linearGradient>
            <filter id="glowFilter" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="strongGlow" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* outer ring — perspective ellipse giving 3D feel */}
          <ellipse
            cx="100" cy="108" rx="88" ry="28"
            fill="none"
            stroke="url(#ringGrad)"
            strokeWidth="7"
            strokeLinecap="round"
            filter="url(#glowFilter)"
            className="logo-ring-outer"
          />

          {/* inner ring — tighter, lighter, slight offset for depth */}
          <ellipse
            cx="100" cy="108" rx="62" ry="19"
            fill="none"
            stroke="url(#ringGrad2)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray="8 5"
            className="logo-ring-inner"
          />

          {/* vertical axis line — the planet pole */}
          <line
            x1="100" y1="18"
            x2="100" y2="192"
            stroke="url(#ringGrad)"
            strokeWidth="6"
            strokeLinecap="round"
            filter="url(#glowFilter)"
            className="logo-axis"
          />

          {/* bright node at top of axis — the "north star" of the network */}
          <circle
            cx="100" cy="18" r="7"
            fill="#ffffff"
            filter="url(#strongGlow)"
            className="logo-star"
          />

          {/* subtle arc crossing the axis — orbital path */}
          <path
            d="M 30 75 Q 100 50 170 75"
            fill="none"
            stroke="rgba(159,196,255,0.35)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M 30 140 Q 100 165 170 140"
            fill="none"
            stroke="rgba(159,196,255,0.2)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />

          {/* small orbit dot moving on the ring */}
          <circle
            cx="188" cy="108" r="5"
            fill="#9fc4ff"
            filter="url(#glowFilter)"
            className="logo-dot"
          />
        </svg>

        <div className="brand-wordmark">
          <span className="brand-word-orbit">ORBIT</span>
          <span className="brand-word-divider">—</span>
          <span className="brand-word-network">NETWORK</span>
        </div>
        <p className="brand-tagline">Connect. Share. Orbit.</p>
      </div>
    </div>
  );
}