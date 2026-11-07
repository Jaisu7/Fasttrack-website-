import test from 'node:test';
import assert from 'node:assert/strict';
import { readProject, addProjectItem, projectSummary } from '../src/lib/project-list.mjs';
const catalog=[{id:'worktable',name:'SS preparation tables'},{id:'rack',name:'Freestanding storage racks'}];
test('project storage recovers safely from corrupt, unsupported and unknown data',()=>{
 assert.deepEqual(readProject('not JSON',catalog),[]);
 assert.deepEqual(readProject('{"version":2,"items":[]}',catalog),[]);
 const raw=JSON.stringify({version:1,items:[{id:'x',productId:'missing'},{id:'t',productId:'worktable',quantity:999,configuration:{width:-10,shelves:99}}]});
 const items=readProject(raw,catalog);assert.equal(items.length,1);assert.equal(items[0].quantity,100);assert.equal(items[0].configuration.width,800);assert.equal(items[0].configuration.shelves,1);
});
test('matching configurations combine quantity while distinct sizes stay separate',()=>{
 let items=addProjectItem([],'worktable',{width:1500,quantity:2},'a');
 items=addProjectItem(items,'worktable',{width:1500,quantity:3},'b');assert.equal(items.length,1);assert.equal(items[0].quantity,5);
 items=addProjectItem(items,'worktable',{width:1800},'c');assert.equal(items.length,2);
 const text=projectSummary(items,catalog);assert.ok(text.includes('Quantity: 5'));assert.ok(text.includes('1800'));assert.equal(readProject(JSON.stringify({version:1,items}),catalog).length,2);
});
test('project list bounds configuration count and quantity',()=>{
 let items=[];for(let i=0;i<35;i++)items=addProjectItem(items,'worktable',{width:800+i},String(i));assert.equal(items.length,30);
 items=addProjectItem(items,'worktable',{width:800,quantity:100},'extra');assert.equal(items[0].quantity,100);
});
