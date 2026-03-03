// modes/binary.js — Binary BCD clock with LED columns
import { TAU } from './utils.js';

export const BinaryMode = {
  id: 'binary',
  name: 'Binary',
  description: 'Binary Coded Decimal clock — for the nerds',

  render(ctx, state) {
    const { cx, cy, r, dpr, size, date } = state;
    const h = date.getHours();
    const m = date.getMinutes();
    const s = date.getSeconds();

    // BCD: each digit as separate column
    // H tens (0-2), H ones (0-9), M tens (0-5), M ones (0-9), S tens (0-5), S ones (0-9)
    const columns = [
      { value: Math.floor(h / 10), bits: 2, label: '' },
      { value: h % 10, bits: 4, label: 'H' },
      { value: Math.floor(m / 10), bits: 3, label: '' },
      { value: m % 10, bits: 4, label: 'M' },
      { value: Math.floor(s / 10), bits: 3, label: '' },
      { value: s % 10, bits: 4, label: 'S' },
    ];

    const dotR = Math.max(6, r * 0.045) * dpr;
    const colGap = r * 0.18;
    const rowGap = dotR * 3.2;
    const totalW = (columns.length - 1) * colGap;
    const startX = cx - totalW / 2;
    const maxRows = 4;
    const startY = cy - (maxRows - 1) * rowGap / 2 - r * 0.08;

    // Draw columns
    for (let col = 0; col < columns.length; col++) {
      const { value, bits } = columns[col];
      const x = startX + col * colGap;

      // Draw separator between pairs
      if (col === 2 || col === 4) {
        const sepX = x - colGap * 0.5;
        ctx.fillStyle = 'rgba(34,197,94,0.15)';
        ctx.fillRect(sepX - 0.5 * dpr, startY - dotR, 1 * dpr, maxRows * rowGap + dotR);
      }

      for (let row = 0; row < maxRows; row++) {
        const bitIdx = maxRows - 1 - row;
        const y = startY + row * rowGap;

        if (bitIdx >= bits) {
          // Not used for this column
          continue;
        }

        const isOn = (value >> bitIdx) & 1;

        ctx.beginPath();
        ctx.arc(x, y, dotR, 0, TAU);
        if (isOn) {
          ctx.fillStyle = '#22c55e';
          ctx.save();
          ctx.shadowColor = '#22c55e';
          ctx.shadowBlur = 12 * dpr;
          ctx.fill();
          ctx.restore();
        } else {
          ctx.fillStyle = 'rgba(34,197,94,0.08)';
          ctx.fill();
        }

        // Subtle ring
        ctx.beginPath();
        ctx.arc(x, y, dotR, 0, TAU);
        ctx.strokeStyle = isOn ? 'rgba(34,197,94,0.4)' : 'rgba(34,197,94,0.06)';
        ctx.lineWidth = 1 * dpr;
        ctx.stroke();
      }

      // Bit weight labels (8, 4, 2, 1)
      if (col === 0) {
        for (let row = 0; row < maxRows; row++) {
          const y = startY + row * rowGap;
          const weight = 1 << (maxRows - 1 - row);
          const fs = Math.max(7, r * 0.03) * dpr;
          ctx.font = `500 ${fs}px "JetBrains Mono", monospace`;
          ctx.fillStyle = 'rgba(34,197,94,0.2)';
          ctx.textAlign = 'right';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(weight), startX - colGap * 0.6, y);
        }
      }
    }

    // Labels below: H M S
    const labelFs = Math.max(9, r * 0.05) * dpr;
    ctx.font = `600 ${labelFs}px "Inter", system-ui, sans-serif`;
    ctx.fillStyle = 'rgba(34,197,94,0.4)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const labelY = startY + maxRows * rowGap + dotR * 2;
    ctx.fillText('H', startX + colGap * 0.5, labelY);
    ctx.fillText('M', startX + colGap * 2.5, labelY);
    ctx.fillText('S', startX + colGap * 4.5, labelY);

    // Decimal readout below
    const hStr = String(h).padStart(2, '0');
    const mStr = String(m).padStart(2, '0');
    const sStr = String(s).padStart(2, '0');
    const timeFs = Math.max(12, size / 16) * dpr;
    ctx.font = `700 ${timeFs}px "JetBrains Mono", monospace`;
    ctx.fillStyle = 'rgba(34,197,94,0.6)';
    ctx.textAlign = 'center';
    ctx.fillText(`${hStr}:${mStr}:${sStr}`, cx, labelY + rowGap * 1.2);

    return {};
  }
};
