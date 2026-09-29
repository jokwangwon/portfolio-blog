const {chromium}=require('/tmp/portfolio-browser-qa/node_modules/playwright');
const fs=require('node:fs');const assert=require('node:assert/strict');
const base=process.env.QA_BASE||'http://127.0.0.1:3105';
const out=process.env.QA_OUT||'/tmp/portfolio-editor-safety-qa';fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({headless:true,args:['--no-sandbox']});const results=[];
for(const width of [1280,390])for(const scenario of ['undo','storage-navigation','storage-back','saved']){
const context=await browser.newContext({viewport:{width,height:900}});
if(scenario.startsWith('storage'))await context.addInitScript(()=>{Storage.prototype.setItem=function(){throw new DOMException('Test quota','QuotaExceededError');};});
const page=await context.newPage();let dialogs=0;let accept=false;page.on('dialog',async d=>{dialogs++;accept?await d.accept():await d.dismiss();});
const post={id:900020,title:'검증용 글',content:'서버 본문',excerpt:'검증',tags:[],author:{id:1,username:'검증관리자'},status:'DRAFT',createdAt:'2026-09-13T00:00:00',updatedAt:'2026-09-13T00:00:00',viewCount:0,likeCount:0};
await page.route('**/api/portal/**',async r=>{const path=new URL(r.request().url()).pathname;
if(path.endsWith('/auth/refresh'))return r.fulfill({json:{accessToken:'test-only',expiresIn:900}});
if(path.endsWith('/auth/me'))return r.fulfill({json:{username:'검증관리자',authorities:['ROLE_ADMIN']}});
if(path.endsWith('/posts/900020')){if(r.request().method()==='PUT')Object.assign(post,r.request().postDataJSON());return r.fulfill({json:post});}
if(path.endsWith('/tags')||path.endsWith('/categories'))return r.fulfill({json:[]});
return r.fulfill({json:{content:[],empty:true,totalElements:0,totalPages:0,number:0}});});
await page.goto(base+'/blog/editor/900020',{waitUntil:'domcontentloaded'});
await page.getByRole('button',{name:'마크다운',exact:true}).click();
const body=page.getByRole('textbox',{name:'마크다운 본문'});
await body.fill('최신 수정 본문');await page.waitForTimeout(1700);
if(scenario==='undo'){
await body.fill(post.content);await page.waitForTimeout(50);
assert.equal(await page.evaluate(()=>localStorage.getItem('blog_draft_edit_900020')),null);
await page.reload();await page.getByRole('button',{name:'마크다운',exact:true}).click();
assert.equal(await body.inputValue(),post.content);assert.equal(await page.getByRole('button',{name:'복원',exact:true}).count(),0);
}else if(scenario==='storage-navigation'){
await page.getByRole('link',{name:'블로그',exact:true}).click();
assert.equal(dialogs,1);assert.ok(page.url().endsWith('/editor/900020'));assert.equal(await body.inputValue(),'최신 수정 본문');
accept=true;await page.getByRole('link',{name:'블로그',exact:true}).click();await page.waitForURL('**/blog');assert.equal(dialogs,2);
accept=false;const beforeReload=dialogs;
await page.reload({timeout:3000}).catch(()=>{});
assert.equal(dialogs,beforeReload+1);assert.ok(page.url().endsWith('/blog'));
accept=true;
await page.goBack();await page.getByRole('button',{name:'복원',exact:true}).click();await page.getByRole('button',{name:'마크다운',exact:true}).click();assert.equal(await body.inputValue(),'최신 수정 본문');
}else if(scenario==='storage-back'){
// First establish /blog -> editor traversal in this document using header and history.
accept=true;await page.getByRole('link',{name:'블로그',exact:true}).click();await page.waitForURL('**/blog');await page.goBack();
await page.getByRole('button',{name:'복원',exact:true}).click();await page.getByRole('button',{name:'마크다운',exact:true}).click();
await body.fill('뒤로 이동 직전 마지막 입력');
await page.goForward();await page.waitForURL('**/blog');await page.goBack();
await page.getByRole('button',{name:'복원',exact:true}).click();await page.getByRole('button',{name:'마크다운',exact:true}).click();assert.equal(await body.inputValue(),'뒤로 이동 직전 마지막 입력');
}else{
await page.getByRole('button',{name:'임시저장',exact:true}).click();await page.getByRole('status').filter({hasText:'서버에 임시저장했습니다'}).waitFor();
await page.getByRole('link',{name:'블로그',exact:true}).click();await page.waitForURL('**/blog');assert.equal(dialogs,0);
assert.equal(await page.evaluate(()=>localStorage.getItem('blog_draft_edit_900020')),null);
}
await page.screenshot({path:`${out}/${width}-${scenario}.png`,fullPage:true});results.push({width,scenario,passed:true,dialogs});await context.close();}
await browser.close();fs.writeFileSync(`${out}/results.json`,JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));})().catch(e=>{console.error(e);process.exit(1)});
