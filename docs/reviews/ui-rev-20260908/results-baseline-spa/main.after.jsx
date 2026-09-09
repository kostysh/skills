import React,{StrictMode,useState} from 'react';
import {createRoot,hydrateRoot} from 'react-dom/client';
import {BrowserRouter,Routes,Route,Link,useParams,useSearchParams} from 'react-router';
import {QueryClient,QueryClientProvider,useQuery,useMutation,useQueryClient} from '@tanstack/react-query';
import {useForm} from 'react-hook-form';
import {ComponentDemo} from './Tooltip.js';
import './style.css';
const client=new QueryClient({defaultOptions:{queries:{retry:false,staleTime:600000},mutations:{retry:false}}});
async function api(path,method='GET',data){const r=await fetch('/api/items'+path,{method,headers:{'content-type':'application/json'},body:data?JSON.stringify(data):undefined});const json=await r.json();if(!r.ok)throw Error(json.message);return json;}
function List(){const [params,setParams]=useSearchParams();const q=params.get('q')||'',page=Number(params.get('page')||1);const [name,setName]=useState('');const qc=useQueryClient();
 const rows=useQuery({queryKey:['items',q,page],queryFn:()=>api('?q='+encodeURIComponent(q)+'&page='+page)});
 const create=useMutation({mutationFn:()=>api('','POST',{name}),onSuccess:()=>{setName('');qc.invalidateQueries({queryKey:['items']});}});
 const remove=useMutation({mutationFn:id=>api('/'+id,'DELETE'),onSuccess:()=>qc.invalidateQueries({queryKey:['items']})});
 return <><h1>Requests</h1><label>Search <input value={q} onChange={e=>setParams({q:e.target.value,page:'1'})}/></label>
 <form onSubmit={e=>{e.preventDefault();create.mutate();}}><label>New request <input value={name} required onChange={e=>setName(e.target.value)}/></label><button disabled={create.isPending}>Create</button></form>
 {rows.isPending?<p>Loading</p>:rows.error?<p role="alert">{rows.error.message}</p>:<><table><thead><tr><th>Name</th><th>Actions</th></tr></thead><tbody>{rows.data.items.map(x=><tr key={x.id}><td><Link to={'/items/'+x.id}>{x.name}</Link></td><td><button onClick={()=>remove.mutate(x.id)}>Delete {x.name}</button></td></tr>)}</tbody></table><p>Page {page} of {rows.data.pages}; total {rows.data.total}</p><button disabled={page===1} onClick={()=>setParams({q,page:String(page-1)})}>Previous</button><button disabled={page===rows.data.pages} onClick={()=>setParams({q,page:String(page+1)})}>Next</button></>}
 {create.error&&<p role="alert">{create.error.message}</p>}</>;
}
function Editor({item}){const qc=useQueryClient();const form=useForm({defaultValues:{name:item.name}});
 const save=useMutation({mutationFn:data=>api('/'+item.id,'PATCH',data),onSuccess:async data=>{qc.setQueryData(['item',String(item.id)],data);form.reset({name:data.name});await qc.invalidateQueries({queryKey:['items']});}});
 return <><h1>Request {item.id}</h1><form onSubmit={form.handleSubmit(data=>save.mutate(data))}><label>Name <input {...form.register('name',{required:true})}/></label><button disabled={save.isPending}>Save</button></form>{save.error&&<p role="alert">{save.error.message}</p>}{save.isSuccess&&<p role="status">Saved</p>}<Link to="/">Back to requests</Link></>;
}
function Detail(){const {id}=useParams();const item=useQuery({queryKey:['item',id],queryFn:()=>api('/'+id)});return item.isPending?<p>Loading</p>:item.error?<p role="alert">{item.error.message}</p>:<Editor key={id} item={item.data}/>;}
function App(){return <QueryClientProvider client={client}><BrowserRouter><header>REQUEST DESK</header><main><Routes><Route path="/" element={<List/>}/><Route path="/items/:id" element={<Detail/>}/></Routes></main></BrowserRouter></QueryClientProvider>;}
const node=document.getElementById('root');
if(location.pathname==='/components')hydrateRoot(node,<StrictMode><ComponentDemo/></StrictMode>,{onRecoverableError:e=>window.fixtureEvidence.recoverable.push(e.message)});else createRoot(node).render(<StrictMode><App/></StrictMode>);
