import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseDuration, elapsedMinutes, durationText, normalizeTime } from './duration.ts';

test('duration input accepts decimal hours and strict hours/minutes', () => {
  assert.equal(parseDuration('2:30'), 2.5);
  assert.equal(parseDuration('0:15'), 0.25);
  assert.equal(parseDuration('2,5'), 2.5);
  assert.equal(parseDuration('2.5'), 2.5);
  assert.equal(parseDuration('8'), 8);
  assert.equal(parseDuration('24:00'), 24);
  for (const input of ['', '2:60', '2:5', 'abc', '-1', '2,3,4']) assert.ok(Number.isNaN(parseDuration(input)));
});
test('time ranges calculate minutes, including overnight', () => {
  assert.equal(elapsedMinutes('13:32','14:32'),60);
  assert.equal(elapsedMinutes('09:15','11:45'),150);
  assert.equal(elapsedMinutes('23:30','01:00'),90);
  assert.equal(elapsedMinutes('09:00','09:00'),0);
  assert.equal(elapsedMinutes('','12:00'),null);
  assert.equal(elapsedMinutes('25:00','12:00'),null);
  assert.equal(durationText(150),'2:30');
});

test("whole hours normalize and calculate",()=>{ assert.equal(normalizeTime("19"),"19:00"); assert.equal(normalizeTime("9"),"09:00"); assert.equal(normalizeTime("24"),null); assert.equal(elapsedMinutes("9","11:30"),150); });
