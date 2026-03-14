// ─────────────────────────────────────────────
//  SHARED UTILS — Canvas Chart
// ─────────────────────────────────────────────

export function drawLineChart(
  canvasId: string,
  labels: string[],
  data: number[],
  color = '#b5ff2d'
): void {
  const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
  if (!canvas || data.length < 2) return;

  const W = canvas.offsetWidth || 300;
  const H = 170;
  canvas.width  = W;
  canvas.height = H;

  const pad = { t: 18, r: 18, b: 36, l: 46 };
  const cw = W - pad.l - pad.r;
  const ch = H - pad.t - pad.b;
  const min = Math.min(...data) * 0.95;
  const max = Math.max(...data) * 1.05;
  const range = max - min || 1;

  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, W, H);

  // Grid lines
  ctx.strokeStyle = '#2a2a2a';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad.t + ch * (1 - i / 4);
    ctx.beginPath();
    ctx.moveTo(pad.l, y);
    ctx.lineTo(pad.l + cw, y);
    ctx.stroke();
    ctx.fillStyle = '#555';
    ctx.font = '10px JetBrains Mono,monospace';
    ctx.textAlign = 'right';
    ctx.fillText((min + range * (i / 4)).toFixed(1), pad.l - 4, y + 3);
  }

  // Data points
  const pts = data.map((v, i) => ({
    x: pad.l + i * (cw / (data.length - 1 || 1)),
    y: pad.t + ch * (1 - (v - min) / range),
  }));

  // Fill area
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pad.t + ch);
  pts.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.lineTo(pts[pts.length - 1].x, pad.t + ch);
  ctx.closePath();
  const grad = ctx.createLinearGradient(0, pad.t, 0, pad.t + ch);
  grad.addColorStop(0, color + '44');
  grad.addColorStop(1, color + '00');
  ctx.fillStyle = grad;
  ctx.fill();

  // Line
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.stroke();

  // Dots
  pts.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.fillStyle = '#0a0a0a';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
    ctx.fill();
  });

  // X-axis labels
  const step = Math.ceil(labels.length / 6);
  ctx.fillStyle = '#555';
  ctx.font = '10px Noto Sans Thai,sans-serif';
  ctx.textAlign = 'center';
  labels.forEach((l, i) => {
    if (i % step === 0 || i === labels.length - 1) {
      ctx.fillText(l, pts[i].x, H - pad.b + 13);
    }
  });
}
