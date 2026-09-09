import React,{useEffect,useRef,useState,useId,forwardRef} from 'react';
const h=React.createElement;
export const Tooltip=forwardRef(function Tooltip({label,children},externalRef){
 const [open,setOpen]=useState(false);
 const id=useId();
 useEffect(()=>{const close=()=>setOpen(false);window.addEventListener('resize',close);return()=>window.removeEventListener('resize',close);},[]);
 return h('span',{className:'tooltip-wrap'},h('button',{ref:externalRef,'aria-describedby':open?id:undefined,onFocus:()=>setOpen(true),onBlur:()=>setOpen(false),onMouseEnter:()=>setOpen(true),onMouseLeave:()=>setOpen(false)},children),open&&h('span',{role:'tooltip',id},label));
});
export function ComponentDemo(){const [mounted,setMounted]=useState(true);const ref=useRef(null);
 return h('main',null,h('h1',null,'Component laboratory'),h('button',{onClick:()=>setMounted(x=>!x)},mounted?'Unmount tooltips':'Mount tooltips'),h('button',{onClick:()=>ref.current?.focus()},'Focus first'),mounted&&h('section',null,h(Tooltip,{label:'First tip',ref},'First'),h(Tooltip,{label:'Second tip'},'Second')));
}
