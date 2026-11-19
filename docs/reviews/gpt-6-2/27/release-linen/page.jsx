'use client';
import { useEffect, useState } from 'react';

export default function Linen() {
  const [ready, setReady] = useState(false);
  const [selections, setSelections] = useState(0);
  useEffect(() => setReady(true), []);
  return <>
    <h1>{ready ? 'Linen docket' : 'Dispatch queue'}</h1>
    <section data-ready={ready ? 'yes' : 'no'}>
      <p role="status">Selections: {selections}</p>
      <button type="button" onClick={() => setSelections(value => value + 1)}>Mark inspected</button>
    </section>
  </>;
}
