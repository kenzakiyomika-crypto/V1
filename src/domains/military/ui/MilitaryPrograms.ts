// ─────────────────────────────────────────────
//  MILITARY UI — Program Detail (lazy loaded)
// ─────────────────────────────────────────────

const PROGRAMS: Record<string, { title: string; weeks: { w: string; t: string; d: { l: string; i: string[] }[] }[] }> = {
  seal_prep: {
    title: 'SEAL Prep 12 สัปดาห์',
    weeks: [
      { w: '1-2', t: 'Base Building', d: [
        { l: 'จ-พ-ศ', i: ['วิ่ง 3 กม. Zone 2 (Pace ~6:30/km)', 'หัวใจ 130-150 bpm'] },
        { l: 'อ-พฤ',  i: ['ดันพื้น 5×15 · ซิทอัพ 5×20', 'พูลอัพ 5×5 · Plank 3×45 วิ'] },
        { l: 'ส',     i: ['ว่ายน้ำ 4×50ม. พัก 1 นาที', 'เป้า 200ม. ต่อเนื่อง'] },
      ]},
      { w: '3-4', t: 'Volume Increase', d: [
        { l: 'จ-พ-ศ', i: ['วิ่ง 4 กม. · Interval 8×400ม.', 'Long Run 6 กม.'] },
        { l: 'อ-พฤ',  i: ['ดันพื้น 6×20 · ซิทอัพ 6×25', 'พูลอัพ 5×7'] },
        { l: 'ส',     i: ['ว่ายน้ำ 6×50ม. + 200ม. ต่อเนื่อง'] },
      ]},
      { w: '5-8', t: 'Peak Training', d: [
        { l: 'จ-พ-ศ', i: ['Interval 10×400ม. · Tempo 4 กม.', 'Long Run 8-10 กม.'] },
        { l: 'อ-พฤ',  i: ['Max ดันพื้น×3 · Max ซิทอัพ×3', 'พูลอัพ 5×10'] },
        { l: 'ส',     i: ['ว่ายน้ำ 500ม. ต่อเนื่อง'] },
      ]},
      { w: '9-12', t: 'Race Prep + Taper', d: [
        { l: 'จ-พ-ศ', i: ['Interval 12×400ม. · Long Run 10 กม.', 'Week 12: เบา ลด Volume 50%'] },
        { l: 'อ-พฤ',  i: ['Max Set ทุกท่า', 'Week 12: Recovery เท่านั้น'] },
        { l: 'ส',     i: ['2×500ม. พัก 5 นาที', 'Week 12: ทดสอบ 200ม.+500ม.'] },
      ]},
    ],
  },
  sf_prep: {
    title: 'Special Forces 12 สัปดาห์',
    weeks: [
      { w: '1-4', t: 'Foundation', d: [
        { l: 'จ-พ-ศ', i: ['วิ่ง 5 กม. Zone 2'] },
        { l: 'อ-พฤ',  i: ['Squat 4×8 · Deadlift 3×5 · Pull-up 5×5'] },
        { l: 'ส',     i: ['Rucking 5-8 กม. เป้ 10-12 กก.'] },
      ]},
      { w: '5-8', t: 'Build Volume', d: [
        { l: 'จ-พ-ศ', i: ['วิ่ง 6 กม. · Interval 8×600ม.', 'Long Run 10-12 กม.'] },
        { l: 'อ-พฤ',  i: ['Heavy Compound + Max Calisthenics'] },
        { l: 'ส',     i: ['Rucking 10 กม. เป้ 15 กก.'] },
      ]},
      { w: '9-12', t: 'Peak + Taper', d: [
        { l: 'จ-พ-ศ', i: ['Interval + Tempo + Long Run'] },
        { l: 'อ-พฤ',  i: ['Max Set ทุกท่า'] },
        { l: 'ส',     i: ['10 กม. Ruck Full Speed'] },
      ]},
    ],
  },
  base_fit: {
    title: 'Base Fitness 8 สัปดาห์',
    weeks: [
      { w: '1-2', t: 'เริ่มต้น', d: [
        { l: 'จ-พ-ศ', i: ['วิ่ง 2 กม. · ดันพื้น 3×15 · ซิทอัพ 3×20'] },
        { l: 'อ-พฤ',  i: ['Squat 3×10 · Deadlift 3×8'] },
        { l: 'ส',     i: ['เดินเร็ว 30 นาที'] },
      ]},
      { w: '3-4', t: 'เพิ่ม Volume', d: [
        { l: 'จ-พ-ศ', i: ['วิ่ง 3 กม. · ดันพื้น 4×20 · ซิทอัพ 4×25'] },
        { l: 'อ-พฤ',  i: ['Squat 4×8 · Pull-up 4×6'] },
        { l: 'ส',     i: ['วิ่ง 5 กม. Zone 2'] },
      ]},
      { w: '5-8', t: 'Peak + Test', d: [
        { l: 'จ-พ-ศ', i: ['วิ่ง 3 กม. Full Effort (Week 7 ทดสอบ)', 'Max ดันพื้น · Max ซิทอัพ'] },
        { l: 'อ-พฤ',  i: ['Heavy Squat · Pull-up Max'] },
        { l: 'ส',     i: ['Long Run 6-8 กม.'] },
      ]},
    ],
  },
};

export function renderMilProgDetail(key: string): void {
  const prog = PROGRAMS[key];
  if (!prog) return;
  document.getElementById('milprog-content')!.innerHTML = `
    <div style="font-family:'Bebas Neue';font-size:1.3rem;letter-spacing:3px;color:var(--orange);margin-bottom:12px">${prog.title}</div>
    ${prog.weeks.map((w, wi) => `
      <div class="mil-week-card" id="mwc${wi}">
        <div class="mil-week-head" onclick="document.getElementById('mwc${wi}').classList.toggle('open')">
          <div><div class="mwh-week">สัปดาห์ ${w.w}</div><div class="mwh-theme">${w.t}</div></div>
          <span style="color:var(--t3)">▾</span>
        </div>
        <div class="mil-week-body">
          ${w.d.map(d => `
            <div class="mil-day-row">
              <div class="mil-day-label">${d.l}</div>
              ${d.i.map(i => `<div class="mil-day-item">${i}</div>`).join('')}
            </div>`).join('')}
        </div>
      </div>`).join('')}`;
}
