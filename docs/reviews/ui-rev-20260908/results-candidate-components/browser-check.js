(async()=>{
 const checks=[];
 const assert=(ok,name)=>{checks.push({name,ok});if(!ok)throw Error(name);};
 const settle=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
 const button=text=>[...document.querySelectorAll('button')].find(x=>x.textContent===text);
 const tips=()=>[...document.querySelectorAll('[role=tooltip]')];
 await settle();
 assert(window.fixtureEvidence.recoverable.length===0,'actual hydration: no recoverable errors');
 assert(window.fixtureEvidence.resizeListeners===2,'two mounted instance listeners');
 button('Focus first').click();await settle();
 assert(document.activeElement===button('First'),'caller ref focuses first');
 assert(tips().length===1&&tips()[0].textContent==='First tip','first focus opens correct tooltip');
 button('Second').dispatchEvent(new MouseEvent('mouseover',{bubbles:true}));await settle();
 assert(tips().length===2,'instances open independently together');
 assert(new Set(tips().map(x=>x.id)).size===2,'unique tooltip ids');
 for(const name of ['First','Second'])assert(document.getElementById(button(name).getAttribute('aria-describedby'))?.textContent===name+' tip',name+' description resolves');
 window.dispatchEvent(new Event('resize'));await settle();assert(tips().length===0,'resize closes both');
 for(let i=0;i<5;i++){
  button('First').blur();button('First').focus();await settle();assert(tips().some(x=>x.textContent==='First tip'),'open cycle '+i);
  button('First').blur();await settle();assert(tips().length===0,'close cycle '+i);
  button('Unmount tooltips').click();await settle();
  assert(window.fixtureEvidence.resizeListeners===0&&tips().length===0&&document.querySelectorAll('.tooltip-wrap').length===0,'unmount cleanup '+i);
  button('Mount tooltips').click();await settle();assert(window.fixtureEvidence.resizeListeners===2,'StrictMode remount balanced '+i);
 }
 button('First').focus();await settle();assert(tips().length===1,'open before final unmount');
 button('Unmount tooltips').click();await settle();
 assert(window.fixtureEvidence.resizeListeners===0&&tips().length===0&&document.querySelectorAll('.tooltip-wrap').length===0,'open unmount cleans all component nodes and resize handlers');
 assert(window.fixtureEvidence.recoverable.length===0,'no hydration errors throughout');
 return {checks,evidence:window.fixtureEvidence,url:location.href};
})()
