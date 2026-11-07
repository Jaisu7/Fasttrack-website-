import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeConfiguration, configurationSummary } from '../src/lib/product-configuration.mjs';
test('configuration rejects unsupported products and bounds invalid dimensions and quantities',()=>{assert.equal(normalizeConfiguration('refrigerator'),null);const c=normalizeConfiguration('worktable',{width:Infinity,depth:-10,height:9999,shelves:6,quantity:0});assert.equal(c.width,1500);assert.equal(c.depth,400);assert.equal(c.height,2200);assert.equal(c.shelves,1);assert.equal(c.quantity,1)});
test('rack shelf choices and requested values survive into the enquiry summary',()=>{const c=normalizeConfiguration('rack',{width:1800,depth:650,height:2000,shelves:6,finish:1,quantity:3});const text=configurationSummary('Freestanding storage racks',c);for(const value of ['1800 × 650 × 2000 mm','Shelf levels: 6','Satin steel','Quantity: 3'])assert.ok(text.includes(value));});
