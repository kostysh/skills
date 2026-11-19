const { createHash } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const http = require('node:http');
const { chromium } = require(process.env.PLAYWRIGHT_CORE || 'playwright-core');

const [project, receipt, task, mode] = process.argv.slice(2);
const names = () => fs.readdirSync(project).filter(n => /\.(html|js|css)$/.test(n)).sort();
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const revision = () => sha(names().map(n => n + ':' + sha(fs.readFileSync(path.join(project, n)))).join('\n'));
const cssInfo = node => {
  const st = getComputedStyle(node), b = node.getBoundingClientRect();
  return {
    id:node.id, tag:node.localName, text:node.innerText || '', value:node.value,
    visual:{bg:st.backgroundColor, color:st.color, border:st.borderTopColor, outline:st.outline, shadow:st.boxShadow, weight:st.fontWeight, radius:st.borderRadius},
    bounds:[b.x,b.y,b.width,b.height], focused:node === document.activeElement, visible:node.matches(':focus-visible')
  };
};

async function main() {
  const server = http.createServer((req,res) => {
    const wanted = new URL(req.url,'http://localhost').pathname;
    const name = wanted === '/' ? 'index.html' : wanted.slice(1);
    if (!names().includes(name)) {res.writeHead(404).end(); return;}
    res.setHeader('Cache-Control','no-store');
    res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'none'; form-action 'self'; object-src 'none'; base-uri 'none'");
    res.setHeader('Content-Type',({'html':'text/html','css':'text/css','js':'text/javascript'})[name.split('.').pop()]);
    res.end(fs.readFileSync(path.join(project,name)));
  });
  await new Promise(ok => server.listen(0,'127.0.0.1',ok));
  const origin = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({executablePath:process.env.CHROME_PATH || '/usr/bin/google-chrome',
    chromiumSandbox:true,headless:true,args:['--disable-dev-shm-usage','--disable-background-networking']});
  const context = await browser.newContext({viewport:{width:1080,height:760},serviceWorkers:'block'});
  await context.route('**/*', r => new URL(r.request().url()).origin === origin ? r.continue() : r.abort());
  const page = await context.newPage();
  page.setDefaultTimeout(3000);
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(String(e.message)));
  let loaded;
  async function open(width,height) {
    if (width) await page.setViewportSize({width:Number(width),height:Number(height || 760)});
    await page.goto(origin,{waitUntil:'load'});
    loaded = revision();
  }
  const active = () => page.locator(':focus').count().then(n => n ? page.locator(':focus').evaluate(cssInfo) : null);
  const state = () => page.locator('[role=status]').innerText();
  async function command(args) {
    const [op, arg, val] = args;
    let result;
    if (op==='open') { await open(arg,val); result={title:await page.title(),viewport:page.viewportSize()}; }
    else if (op==='view') result={text:await page.locator('body').innerText(), controls:await page.locator('input,select,button').evaluateAll(ns=>ns.map(n=>[n.id,n.localName,n.value || n.innerText]))};
    else if (op==='inspect') result=await page.locator(arg).first().evaluate(cssInfo);
    else if (op==='click') await page.locator(arg).first().click();
    else if (op==='fill') await page.locator(arg).first().fill(val);
    else if (op==='select') await page.locator(arg).first().selectOption({label:val});
    else if (op==='press') await page.keyboard.press(arg);
    else if (op==='screenshot' && /^[A-Za-z0-9_-]+\.png$/.test(arg)) {await page.screenshot({path:path.join(project,arg),fullPage:true});result={file:arg};}
    else throw Error('Unknown command or invalid argument; see README.md.');
    return {result:result || 'ok',active:await active(),status:await state()};
  }
  await open();
  if (mode==='observe') {
    const shop=task==='holdout';
    const sel=shop ? ['#shelf','#reserve','#cancel','#part','#rack'] : ['#office','#send','#clear','#vessel','#slot'];
    const [peer,primary,secondary,input,choice]=sel;
    const read=selector=>page.locator(selector).first().evaluate(cssInfo);
    const results=[];
    for(const [width,height] of [[1080,760],[390,760]]) {
      await open(width,height);
      const info={width, base:{peer:await read(peer),primary:await read(primary),secondary:await read(secondary)}};
      for(const phase of ['initial','error']) {
        if (phase==='error') await page.locator(primary).click();
        // A pointer on the form's editable field sets a reproducible starting point for the key path.
        await page.locator(input).click();
        const traversed=[];
        for(let i=0;i<12;i++) {
          await page.keyboard.press('Tab');
          const node=await active(); traversed.push(node?.id || null);
          if(node?.id===primary.slice(1))break;
        }
        info[phase]={status:await state(),traversed,primary:await read(primary),overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)};
        const filename=width+'-'+phase+'.png';
        await page.screenshot({path:path.join(receipt,filename),fullPage:true});
      }
      await page.locator(input).fill(shop?'MK-014':'Lumen');
      await page.locator(choice).selectOption({label:shop?'West yard':'Afternoon'});
      await page.locator(primary).click();
      info.persisted=await page.evaluate(k=>localStorage.getItem(k),shop?'part-hold':'arrival');
      info.success=await state();
      await page.locator(secondary).click(); info.reset={value:await page.locator(input).inputValue(),notice:await state()};
      results.push(info);
    }
    fs.writeFileSync(path.join(receipt,'observer.json'),JSON.stringify({revision:revision(),browser:browser.version(),pageErrors,results},null,2)+'\n');
    await browser.close();server.close(); return;
  }
  const socket=net.createServer(connection=>{
    let buffer='';
    connection.on('data',async chunk=>{
      buffer+=chunk; if(!buffer.includes('\n'))return;
      const utc=new Date().toISOString(), args=JSON.parse(buffer.split('\n')[0]); let response;
      try {response=await command(args);} catch(e) {response={error:String(e.message).split('\n')[0]};}
      fs.appendFileSync(path.join(receipt,'browser.jsonl'),JSON.stringify({utc,command:args,loaded,disk:revision(),...response})+'\n');
      connection.end(JSON.stringify(response)+'\n');
    });
  });
  const endpoint=path.join(project,'.window');
  if(fs.existsSync(endpoint)) fs.unlinkSync(endpoint);
  await new Promise(ok=>socket.listen(endpoint,ok));
  process.on('SIGTERM',async()=>{await browser.close();socket.close();server.close();});
}
main().catch(e=>{console.error(e);process.exitCode=1;process.exit(1);});
