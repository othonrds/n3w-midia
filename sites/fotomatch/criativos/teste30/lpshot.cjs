const {chromium}=require('playwright');const ids=[...'ABCDEF'].flatMap(t=>[1,2,3,4,5].map(i=>t+i));
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
await p.route('**/functions/v1/**',r=>r.fulfill({status:200,body:'{}'}));await p.route('**/connect.facebook.net/**',r=>r.abort());
for(const id of ids){await p.goto('http://localhost:8777/t/?demo&c='+id);await p.addStyleTag({content:'.sticky{position:static}'});await p.waitForTimeout(300);await p.screenshot({path:'criativos/teste30/out2/lp-'+id+'.jpg',type:'jpeg',quality:70,fullPage:true});}
await b.close();})();
