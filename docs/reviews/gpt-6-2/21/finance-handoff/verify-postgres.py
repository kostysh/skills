"""Replay the accepted PREVIEW-1 cases on an isolated PostgreSQL 18.4 image."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import time
import uuid

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("input_dir", type=Path)
parser.add_argument("output", type=Path)
args = parser.parse_args()
source = args.input_dir
sql_file = Path(__file__).with_name("preview-store.sql")
def sha(path):
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()
expected_sha = {
    "preview-input.json": "9c57942cd805e7917fd9bea3555f2e3db7a3ec153d0f317e8f622de313259195",
    "preview-node-output.json": "e7393975b00609375cee7a6c0e6d1cdca0e55cf80c4910b8b927234dcd0867ce",
    "preview-node.mjs": "353381656ac9f53842464a9472ebb47e7f384780ad965b9e1acd0a923bfa30ec",
}
assert {n: sha(source/n) for n in expected_sha} == expected_sha
cases = json.loads((source/"preview-input.json").read_text())
node = json.loads((source/"preview-node-output.json").read_text())
index = {r["case"]: r for r in node["results"]}
image = "postgres@sha256:3a82e1f56c8f0f5616a11103ac3d47e632c3938698946a7ad26da0df1334744a"
name = "skills62-preview-"+uuid.uuid4().hex[:10]
def call(argv, **options):
    return subprocess.run(argv, text=True, capture_output=True, timeout=options.pop("timeout",20), **options)
def database(statement, user="postgres"):
    command = ["docker","exec","-i",name,"psql","-X","-qAt","-v","ON_ERROR_STOP=1","-U",user,"-d","postgres"]
    result = call(command, input=statement)
    if result.returncode: raise RuntimeError(result.stderr.strip())
    return result.stdout.strip()
def attempt_count():
    return int(database("SELECT CASE WHEN is_called THEN last_value ELSE 0 END FROM preview_desk.insert_attempt;", "preview_reader"))
readback_sql = """
SELECT jsonb_build_object(
  'reader',current_user,'connectionPid',pg_backend_pid(),
  'rows',coalesce((SELECT jsonb_agg(jsonb_build_object('id',id,'subjectKey',subject_key,
    'netMinor',net_minor::text,'feeMinor',fee_minor::text,'expiresAt',expires_at) ORDER BY id)
    FROM preview_desk.previews),'[]'::jsonb),
  'exports',coalesce((SELECT jsonb_agg(jsonb_build_object('id',id,'subjectKey',subject_key,
    'feeMinor',fee_minor::text) ORDER BY id) FROM preview_desk.exports),'[]'::jsonb));
"""
record = {"contract":"PREVIEW-1","image":image,"inputs":expected_sha,"sql_sha256":sha(sql_file),
          "node":node["node"],"results":[],"method":"one fresh psql session per query; restricted writer and independent SELECT-only reader"}
try:
    launch = call(["docker","run","--rm","--pull=never","--detach","--name",name,"--label","skills62.preview="+name,
        "--network","none","--memory","384m","--pids-limit","110","--tmpfs","/var/lib/postgresql:rw,exec,mode=0750,uid=999,gid=999",
        "--env","POSTGRES_HOST_AUTH_METHOD=trust",image,"postgres","-c","listen_addresses=127.0.0.1"])
    if launch.returncode: raise RuntimeError(launch.stderr.strip())
    for _ in range(60):
        if call(["docker","exec",name,"pg_isready","-q","-h","127.0.0.1"]).returncode==0: break
        time.sleep(.25)
    else: raise RuntimeError("disposable database did not start")
    record["server"]=database("SELECT version();")
    database(sql_file.read_text())
    record["naive_division_control"]=json.loads(database("""
        SELECT jsonb_build_object('net','9223372036854775807',
          'floor_default_division',floor(9223372036854775807::numeric / 2)::text,
          'floor_exact_half',floor(9223372036854775807::numeric * 0.5::numeric)::text);
    """))
    for item in cases["cases"]:
        payload=json.dumps(item["request"],ensure_ascii=False).encode().hex()
        previous=attempt_count()
        result=json.loads(database("SELECT jsonb_build_object('writer', current_user,'connectionPid',pg_backend_pid(),"
            "'result',preview_desk.store(convert_from(decode('"+payload+"','hex'),'UTF8')::jsonb,"+str(int(cases["now"]))+"));","preview_writer"))
        actual=result["result"]
        following=attempt_count()
        reference={k:v for k,v in index[item["case"]].items() if k in ("row","export","error")}
        assert actual==reference==item["expected"],(item["case"],actual,reference)
        assert following-previous==(0 if "error" in actual else 2),(item["case"],following,previous)
        record["results"].append({"case":item["case"],"id":item["request"]["id"],**result,"attempts_before":previous,"attempts_after":following})
    reread=json.loads(database(readback_sql,"preview_reader"))
    assert reread["reader"]=="preview_reader" and all(x["connectionPid"]!=reread["connectionPid"] for x in record["results"])
    accepted=[item["expected"] for item in cases["cases"] if "row" in item["expected"]]
    assert reread["rows"]==[a["row"] for a in accepted] and reread["exports"]==[a["export"] for a in accepted]
    refused={item["request"]["id"] for item in cases["cases"] if "error" in item["expected"]}
    assert refused.isdisjoint(r["id"] for r in reread["rows"]+reread["exports"])
    record.update({"readback":reread,"refused_ids_absent_from_both":sorted(refused),"total_insert_attempts":attempt_count(),"matches_node_and_precommitted_literals":True})
except Exception as error:
    record["problem"]=str(error)
finally:
    owned=call(["docker","container","inspect","--format",'{{index .Config.Labels "skills62.preview"}}',name])
    if owned.returncode==0 and owned.stdout.strip()==name:
        call(["docker","stop","--timeout","2",name])
    for _ in range(30):
        if call(["docker","container","inspect",name]).returncode:break
        time.sleep(.1)
    record["container_gone"]=call(["docker","container","inspect",name]).returncode!=0
    args.output.write_text(json.dumps(record,indent=2,ensure_ascii=False)+"\n")
if "problem" in record:raise SystemExit(record["problem"])
assert record["container_gone"]
print(f'{len(accepted)} rows and exports, {len(refused)} refusals, {record["total_insert_attempts"]} physical insert attempts')
