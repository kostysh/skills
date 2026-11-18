import DeskView from './DeskView';
export default async function Dossier({params}) {
  const {key} = await params;
  const labels = {amber: 'Amber docket', cedar: 'Cedar docket', reed: 'Reed docket'};
  return <><h1>{labels[key] ?? 'Unknown docket'}</h1><p>Service desk 18</p><DeskView caseKey={key}/></>;
}
