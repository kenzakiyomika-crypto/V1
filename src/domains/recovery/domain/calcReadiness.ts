// ─────────────────────────────────────────────
//  RECOVERY DOMAIN — Readiness Score Logic
// ─────────────────────────────────────────────

export interface ReadinessInput {
  sleep:  number;   // hours 2–12
  sleepQ: number;   // quality 1–5
  energy: number;   // 1–5
  sore:   number;   // soreness 1–5 (5 = very sore)
  rhr:    number;   // resting heart rate bpm
  motiv:  number;   // motivation 1–5
  stress: number;   // stress 1–5 (5 = very stressed)
}

export interface ReadinessResult {
  score: number;       // 0–100
  label: string;
  color: string;
  recommendations: string[];
}

export function calcReadinessScore(input: ReadinessInput): ReadinessResult {
  let score = 50;

  // Sleep hours: max +25
  score += Math.min(25, ((input.sleep - 5) / 4) * 20);
  // Sleep quality: max +5
  score += ((input.sleepQ - 1) / 4) * 5;
  // Energy: max +20
  score += ((input.energy - 1) / 4) * 20;
  // Soreness: max -15
  score -= ((input.sore - 1) / 4) * 15;
  // Resting HR
  score += input.rhr < 60 ? 10 : input.rhr < 70 ? 5 : input.rhr < 80 ? 0 : -5;
  // Motivation: max +10
  score += ((input.motiv - 1) / 4) * 10;
  // Stress: max -10
  score -= ((input.stress - 1) / 4) * 10;

  score = Math.max(0, Math.min(100, Math.round(score)));

  if (score >= 80) {
    return {
      score, color: '#b5ff2d', label: 'พร้อมสูง — ซ้อมหนักได้เลย',
      recommendations: [
        '✅ วันดี — Heavy/Intensity สูงได้',
        'วิ่ง Interval หรือ Tempo Run',
        'Weight Training Heavy Sets',
        'บันทึก PR ถ้าทำได้',
      ],
    };
  }
  if (score >= 60) {
    return {
      score, color: '#ff9500', label: 'พร้อมปานกลาง — ซ้อมตามแผน',
      recommendations: [
        '⚡ ซ้อมตามแผนปกติ',
        'ไม่ต้อง Push เกินแผน',
        'พักระหว่าง Set ให้ครบ',
        'ดื่มน้ำให้เพียงพอ',
      ],
    };
  }
  if (score >= 40) {
    return {
      score, color: '#ff4444', label: 'ร่างกายเหนื่อย — ลด Volume',
      recommendations: [
        '⚠️ ลด Volume 30-40%',
        'งด Interval/Heavy — Easy Run แทน',
        'เน้น Mobility/Stretching 20-30 นาที',
        'นอนก่อน 22:00 คืนนี้',
      ],
    };
  }
  return {
    score, color: '#888', label: 'ร่างกายต้องการพัก — Rest Day',
    recommendations: [
      '🛌 Rest Day / Active Recovery',
      'เดินเบา 20-30 นาที OK',
      'Foam Rolling / Stretching',
      'กิน Protein ให้พอ + นอนให้ครบ',
    ],
  };
}
