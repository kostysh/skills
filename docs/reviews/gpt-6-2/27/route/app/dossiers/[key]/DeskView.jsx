'use client';
import {useEffect, useState} from 'react';
import {Tooltip} from './Tooltip';
export default function DeskView({caseKey}) {
  const [count,setCount]=useState(0);
  const [ready,setReady]=useState(false);
  useEffect(()=>{setReady(true)},[]);
  return <section data-ready={ready ? 'yes' : 'no'}><p role="status">Selections: {count}</p>
    <button type="button" onClick={()=>{if(caseKey !== 'cedar')setCount(value=>value+1)}}>Mark inspected</button>
    <Tooltip label="Use the approved desk entry">Entry help</Tooltip>
    <Tooltip label="See the owner of this docket">Owner help</Tooltip></section>;
}
