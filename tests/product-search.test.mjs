import test from 'node:test';
import assert from 'node:assert/strict';
import { products } from '../src/lib/fasttrack-data.ts';
import { createEquipmentSearch } from '../src/lib/product-search.mjs';
const search = createEquipmentSearch(products);

test('customer equipment names and small spelling mistakes find the same family', () => {
  for (const term of ['fridge', 'fridges', 'chiller', 'refridgerator', 'frigde']) assert.ok(search(term).some(product => product.id === 'refrigerator'), term);
  assert.ok(search('prep bench').some(product => product.id === 'worktable'));
  assert.ok(search('washbasin').some(product => product.id === 'sink'));
  assert.ok(search('wall shelf').some(product => product.id === 'shelves'));
});

test('search keeps multi-word requirements and unsupported equipment distinct', () => {
  assert.ok(search('stainless-steel prep table').some(product => product.id === 'worktable'));
  assert.deepEqual(search('dishwasher'), []);
  assert.deepEqual(search('fridge washing'), []);
  assert.equal(search(' ').length, products.length);
});
