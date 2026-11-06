import assert from 'node:assert/strict';
import test from 'node:test';
import { createOcrLayer } from '../dist/esm/index.js';

const word = (id, text, x, y, confidence = 1) => ({
  id,
  text,
  x,
  y,
  width: 10,
  height: 10,
  confidence,
});
const options = { width: 100, height: 100 };
test('reading order, line breaks, offsets and cross-word literal search', () => {
  const layer = createOcrLayer(
    [word('c', 'Next', 0, 40), word('b', 'world', 30, 10), word('a', '😀', 0, 10)],
    options,
  );
  assert.equal(layer.text, '😀 world\nNext');
  assert.deepEqual(
    layer.words.map((w) => [w.id, w.start, w.end, w.line]),
    [
      ['a', 0, 2, 0],
      ['b', 3, 8, 0],
      ['c', 9, 13, 1],
    ],
  );
  const hits = layer.search('world\nNext');
  assert.deepEqual(
    hits.map((h) => [h.start, h.end, h.words.map((w) => w.id)]),
    [[3, 13, ['b', 'c']]],
  );
});
test('confidence threshold and hit-test priority', () => {
  const layer = createOcrLayer([word('a', 'low', 0, 0, 0.2), word('b', 'high', 0, 0, 0.9)], {
    ...options,
    minConfidence: 0.5,
  });
  assert.equal(layer.text, 'high');
  assert.equal(layer.hitTest(5, 5).id, 'b');
  assert.equal(layer.hitTest(10, 5), undefined);
  assert.equal(layer.hitTest(5, 10), undefined);
});
test('input and exposed word records cannot mutate layer', () => {
  const input = [word('a', 'one', 0, 0)],
    layer = createOcrLayer(input, options);
  input[0].text = 'changed';
  assert.equal(layer.text, 'one');
  assert.throws(() => {
    layer.words[0].text = 'bad';
  });
  assert.throws(() => layer.words.push(word('b', 'x', 0, 0)));
});
test('invalid recognized geometry, duplicate IDs and confidence fail', () => {
  for (const patch of [
    { x: -1 },
    { confidence: 1.1 },
    { width: 0 },
    { text: 'two\nlines' },
    { y: NaN },
  ])
    assert.throws(() => createOcrLayer([{ ...word('a', 'x', 0, 0), ...patch }], options));
  assert.throws(() => createOcrLayer([word('a', 'x', 0, 0), word('a', 'y', 20, 0)], options));
  assert.throws(() => createOcrLayer([], { ...options, lineTolerance: -1 }));
});
test('empty layer and literal queries have explicit behavior', () => {
  const layer = createOcrLayer([], options);
  assert.equal(layer.text, '');
  assert.deepEqual(layer.search('x'), []);
  assert.equal(layer.hitTest(0, 0), undefined);
  assert.throws(() => layer.search(''));
  assert.throws(() => layer.hitTest(NaN, 0));
});
test('word capacity fails before processing', () => {
  assert.throws(() => createOcrLayer(new Array(10001), options));
});
