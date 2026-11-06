import {
  createOcrLayer,
  type RecognizedWord,
  type OcrLayer,
  type SearchHit,
  type OcrWord,
} from '@lp-labs/document-ocr-layer';
const word: RecognizedWord = {
  id: 'w',
  text: 'one',
  x: 0,
  y: 0,
  width: 10,
  height: 10,
  confidence: 1,
};
const layer: OcrLayer = createOcrLayer([word], { width: 100, height: 100 });
const hits: SearchHit[] = layer.search('one');
const hit: OcrWord | undefined = layer.hitTest(1, 1);
// @ts-expect-error confidence is numeric
createOcrLayer([{ ...word, confidence: 'high' }], { width: 100, height: 100 });
void [hits, hit];
