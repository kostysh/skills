import { notFound } from 'next/navigation';
import DeskView from './DeskView';

export const dynamic = 'force-dynamic';
const documentKeys = {reed: 'LOCAL-01', cedar: 'PROBE-DRAFT', amber: 'PROBE-WEST'};

export default async function Dossier({params}) {
  const {key} = await params;
  const sourceKey = Object.hasOwn(documentKeys,key) ? documentKeys[key] : null;
  if (!sourceKey) notFound();
  const response = await fetch(new URL('/records/' + sourceKey,process.env.DESK_READER_URL), {cache:'no-store'});
  if (response.status === 404) notFound();
  if (!response.ok) throw new Error('Unable to read the local desk');
  const record = await response.json();
  return <><h1 data-cms-key={record.sourceKey} data-cms-id={record.id}>{record.title}</h1>
    <p>Service desk 18</p><DeskView caseKey={key}/></>;
}
