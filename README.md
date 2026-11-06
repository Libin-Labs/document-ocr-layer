# @lp-labs/document-ocr-layer

Supplied OCR word ordering, confidence filtering, searchable text offsets and geometric hit testing.

Original, independent MIT implementation. Zero runtime, peer or sibling dependencies. Requires Node.js 18+; strict TypeScript declarations support both ESM and CommonJS.

## Install

```sh
npm install @lp-labs/document-ocr-layer
```

## Quickstart

```js
import { createOcrLayer } from '@lp-labs/document-ocr-layer';
const layer = createOcrLayer(
  [
    { id: 'b', text: 'world', x: 50, y: 10, width: 30, height: 10, confidence: 0.9 },
    { id: 'a', text: 'Hello', x: 10, y: 10, width: 30, height: 10, confidence: 1 },
  ],
  { width: 100, height: 100 },
);
if (
  layer.text !== 'Hello world' ||
  layer.search('world')[0].start !== 6 ||
  layer.hitTest(11, 11).id !== 'a'
)
  throw new Error('Layer mismatch');
```

## API and types

`createOcrLayer(input: readonly RecognizedWord[], options): OcrLayer` requires page width/height, optional minConfidence (0 default) and lineTolerance (0.5 default). A `RecognizedWord` supplies unique id, text, x/y/width/height and confidence in 0..1. Words are sorted top-to-bottom, grouped by the first word y within min-height*tolerance, then left-to-right. `OcrLayer.text` separates words with spaces and lines with newlines; frozen `OcrWord` records add UTF-16 start/end and zero-based line. `search(query): SearchHit[]` finds case-sensitive, nonoverlapping literal hits with intersecting word records. `hitTest(x,y)` uses half-open rectangles and chooses highest confidence, then smallest area.

## Customize

Supply recognized word boxes from your own licensed recognizer. Increase minConfidence to exclude uncertain words and set lineTolerance for your page scale.

## Errors and bounds

10,000 words, 1024 code units per word, 1,000,000 total text units, 10,000 search hits; page sides at most 1e7. Sorting O(n log n), construction O(n + text), hit testing O(n log n) worst case and search scans text plus intersected word records. No bundled model, OCR inference, language segmentation or PDF embedding. Reading order is a deterministic single-flow heuristic, not multi-column inference.

Invalid runtime inputs throw TypeError/RangeError or the documented typed error. Adapter errors propagate unchanged unless specifically noted; asynchronous methods reject. Inputs must be ordinary typed data, not hostile proxies or accessors. No I/O happens at import time. All runtime exports are documented above and the example executes without optional packages.

## Development

```sh
npm ci --offline --ignore-scripts --no-audit --no-fund
npm run build
npm run typecheck
npm test
npm run format:check
```

Build emits dist/esm and dist/cjs with matching declarations. Tests use Node's test runner; consumer.mts and consumer.cts validate meaningful bare-package imports and expected type errors. Only TypeScript ^5.9.3 and Prettier ^3.6.2 are development dependencies.

## Support

If this library is useful to you, consider supporting its maintenance with a [donation via PayPal](https://www.paypal.me/LibinPrasanth).

## Author

Created by [Libin Prasanth](https://www.linkedin.com/in/libinprasanth/). Connect on LinkedIn for updates and discussion.
