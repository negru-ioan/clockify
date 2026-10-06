import { test } from 'node:test';
import assert from 'node:assert/strict';
import { suggestTasks, applyTaskSuggestion } from './taskSuggestions.ts';
import type { Entry, ActivityValues } from '../types.ts';
const entry:Entry = {id:1,description:'OM-9235 - OCM 2222: Light endorsements',client:'REVO',project:3,projectName:'OVERX Vendite',tag:'Basket',user:'Ioan Negru',date:'2026-10-05',hours:2.5,startTime:'09:00',endTime:'11:30'};
test('description matches case-insensitive parts, removes duplicates and excludes edited task',()=>{
 assert.deepEqual(suggestTasks('LIGHT 9235',[entry]).map(e=>e.id),[1]);
 assert.equal(suggestTasks('',[entry]).length,0);
 assert.equal(suggestTasks('unrelated',[entry]).length,0);
 assert.deepEqual(suggestTasks('light',[entry,{...entry,id:2,date:'2026-10-06'}]).map(e=>e.id),[2]);
 assert.equal(suggestTasks('light',[entry],1).length,0);
});
test('reusing a task preserves identity, date, duration and optional times',()=>{
 const values:ActivityValues={id:7,description:'light',client:'INTERNO',project:'5',tag:'Other',user:'User',date:'2026-10-06',hours:'1:15',startTime:'13:00',endTime:'14:15'};
 assert.deepEqual(applyTaskSuggestion(values,entry),{...values,description:entry.description,client:entry.client,project:'3',tag:entry.tag,user:entry.user});
});
