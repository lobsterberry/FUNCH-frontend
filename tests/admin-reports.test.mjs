import test from 'node:test';
import assert from 'node:assert/strict';
import { presetRange, reportGrowth } from '../src/lib/admin-reports.ts';

test('report presets use calendar boundaries across years and leap months', () => {
  assert.deepEqual(presetRange('7d', '2026-01-03'), { start: '2025-12-28', end: '2026-01-03' });
  assert.deepEqual(presetRange('30d', '2026-11-17'), { start: '2026-10-19', end: '2026-11-17' });
  assert.deepEqual(presetRange('lastMonth', '2024-03-12'), { start: '2024-02-01', end: '2024-02-29' });
  assert.deepEqual(presetRange('lastMonth', '2026-01-05'), { start: '2025-12-01', end: '2025-12-31' });
  assert.deepEqual(presetRange('quarter', '2026-11-17'), { start: '2026-10-01', end: '2026-11-17' });
  assert.deepEqual(presetRange('year', '2026-11-17'), { start: '2026-01-01', end: '2026-11-17' });
});

test('growth handles empty periods without manufacturing a percentage', () => {
  assert.equal(reportGrowth(5, 0), 'ไม่มีฐานเปรียบเทียบ');
  assert.equal(reportGrowth(0, 0), '0%');
  assert.equal(reportGrowth(0, undefined), null);
  assert.equal(reportGrowth(15, 10), '+50%');
  assert.equal(reportGrowth(0, 10), '-100%');
});
