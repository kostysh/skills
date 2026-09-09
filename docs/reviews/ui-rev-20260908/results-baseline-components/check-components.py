import subprocess,os,json,pathlib
out=pathlib.Path('/tmp/ui-rev-20260908/results-baseline-components')
env=dict(os.environ,XDG_RUNTIME_DIR='/tmp/ui-rev-20260908/baseline-components/.runtime')
log=[]
def run(args,stdin=None):
 cmd=['agent-browser','--session','ui-rev-base-components','--args','--no-sandbox']+args
 p=subprocess.run(cmd,input=stdin,text=True,capture_output=True,env=env)
 log.append({'command':cmd,'stdin':stdin,'stdout':p.stdout,'stderr':p.stderr,'exit':p.returncode})
 (out/'browser-commands.json').write_text(json.dumps(log,indent=2))
 print(p.stdout,p.stderr)
 if p.returncode: raise SystemExit(p.returncode)
run(['open','http://127.0.0.1:43782/components'])
run(['snapshot','-i'])
run(['find','role','button','click','--name','Focus first','--exact'])
run(['snapshot'])
run(['eval','--stdin'],'''JSON.stringify({active:document.activeElement.textContent,description:document.getElementById(document.activeElement.getAttribute('aria-describedby'))?.textContent,...window.fixtureEvidence})''')
run(['find','role','button','hover','--name','Second','--exact'])
run(['snapshot'])
run(['eval','--stdin'],'''(async()=>{
 const frame=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
 const assert=(x,m)=>{if(!x)throw Error(m)};
 const button=t=>[...document.querySelectorAll('button')].find(b=>b.textContent===t);
 const report=[];
 assert(window.fixtureEvidence.recoverable.length===0,'hydration errors');
 assert(document.activeElement===button('First'),'caller ref did not focus first');
 let tips=[...document.querySelectorAll('[role=tooltip]')];
 assert(tips.length===2,'two simultaneous tips');
 assert(new Set(tips.map(t=>t.id)).size===2,'duplicate IDs');
 for(const name of ['First','Second'])assert(document.getElementById(button(name).getAttribute('aria-describedby')).textContent===name+' tip','description ownership');
 report.push({stage:'two-open',tips:tips.map(t=>({id:t.id,text:t.textContent})),listeners:window.fixtureEvidence.resizeListeners});
 window.componentCheckReport=report;return JSON.stringify(report);
})()''')
run(['hover','h1'])
run(['eval','--stdin'],'''(async()=>{
 const frame=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
 const assert=(x,m)=>{if(!x)throw Error(m)};
 const button=t=>[...document.querySelectorAll('button')].find(b=>b.textContent===t);
 const report=window.componentCheckReport;
 window.dispatchEvent(new Event('resize'));await frame();
 assert(document.querySelectorAll('[role=tooltip]').length===0,'resize close');
 for(let i=0;i<5;i++){
   button('First').blur();button('First').focus();await frame();
   assert(document.querySelector('[role=tooltip]')?.textContent==='First tip','focus reopen');
   button('First').blur();await frame();
   assert(!document.querySelector('[role=tooltip]'),'blur cleanup: '+[...document.querySelectorAll('[role=tooltip]')].map(t=>t.textContent));
   button('Second').dispatchEvent(new MouseEvent('mouseover',{bubbles:true}));await frame();
   assert(document.querySelector('[role=tooltip]')?.textContent==='Second tip','hover reopen');
   button('Second').dispatchEvent(new MouseEvent('mouseout',{bubbles:true,relatedTarget:document.body}));await frame();
   assert(!document.querySelector('[role=tooltip]'),'mouseleave cleanup');
   button('First').focus();await frame();
   button('Unmount tooltips').click();await frame();
   assert(window.fixtureEvidence.resizeListeners===0,'unmount listener leak');
   assert(!document.querySelector('.tooltip-wrap')&&!document.querySelector('[role=tooltip]'),'unmount DOM leak');
   button('Focus first').click();await frame();
   window.dispatchEvent(new Event('resize'));await frame();
   report.push({stage:'unmount',cycle:i,listeners:window.fixtureEvidence.resizeListeners,wrappers:document.querySelectorAll('.tooltip-wrap').length,tips:document.querySelectorAll('[role=tooltip]').length});
   button('Mount tooltips').click();await frame();
   assert(window.fixtureEvidence.resizeListeners===2,'StrictMode remount listener count');
   assert(document.querySelectorAll('.tooltip-wrap').length===2,'remount instances');
   button('Focus first').click();await frame();
   assert(document.activeElement===button('First'),'ref after remount');
 }
 button('Unmount tooltips').click();await frame();
 assert(window.fixtureEvidence.resizeListeners===0,'final listener leak');
 assert(!document.querySelector('.tooltip-wrap')&&!document.querySelector('[role=tooltip]'),'final DOM leak');
 assert(!window.fixtureEvidence.recoverable.length,'late hydration errors');
 return JSON.stringify({status:'verified',report,final:{...window.fixtureEvidence,tips:document.querySelectorAll('[role=tooltip]').length,wrappers:document.querySelectorAll('.tooltip-wrap').length}});
})()''')
run(['snapshot','-i'])
run(['console'])
run(['errors'])

run(['close'])
