"""Run the reviewed K-48 query in a temporary, isolated PostgreSQL 18.4 database."""
import hashlib
import json
import subprocess
import sys
import time
import uuid
from pathlib import Path

sql_path, result_path = map(Path, sys.argv[1:])
statement = sql_path.read_text().strip().removesuffix(';')
image = 'postgres@sha256:3a82e1f56c8f0f5616a11103ac3d47e632c3938698946a7ad26da0df1334744a'
name = 'skills62-r22-' + uuid.uuid4().hex[:12]
docker = ['docker', '--host', 'unix:///var/run/docker.sock']
def call(command, stdin=None):
    return subprocess.run(docker + command, input=stdin, text=True, capture_output=True, timeout=25)
def psql(command, user='postgres'):
    p = call(['exec', '-i', name, 'psql', '-XqAt', '-v', 'ON_ERROR_STOP=1', '-U', user, '-d', 'postgres'], command)
    if p.returncode:
        raise RuntimeError(p.stderr.strip())
    return p.stdout.strip()

expected = [
    ['K1', '5', '2'], ['K2', '-5', '-3'],
    ['K3', '9223372036854775807', '4611686018427387903'],
    ['K4', '-9223372036854775807', '-4611686018427387904'], ['K5', '19', None],
    ['X1', '-1', '-1'], ['X2', '4', '2'], ['X3', '-42', None],
]
record = {'image': image, 'submissionSha256': hashlib.sha256(sql_path.read_bytes()).hexdigest()}
try:
    launch = call(['run', '--rm', '--pull=never', '--detach', '--network', 'none', '--name', name,
                   '--label', 'skills62.r22=' + name, '--memory', '384m', '--pids-limit', '110',
                   '--tmpfs', '/var/lib/postgresql:rw,exec,mode=0750,uid=999,gid=999',
                   '--env', 'POSTGRES_HOST_AUTH_METHOD=trust', image, 'postgres', '-c', 'listen_addresses=127.0.0.1'])
    if launch.returncode:
        raise RuntimeError(launch.stderr.strip())
    for _ in range(80):
        if call(['exec', name, 'pg_isready', '-q', '-h', '127.0.0.1']).returncode == 0:
            break
        time.sleep(.25)
    else:
        raise RuntimeError('database did not become ready')
    record['server'] = psql('SELECT version()')
    psql("""CREATE TABLE batch_lines(ref text PRIMARY KEY, kind text NOT NULL, net_minor bigint NOT NULL);
      INSERT INTO batch_lines VALUES ('K1','standard',5),('K2','standard',-5),
      ('K3','standard',9223372036854775807),('K4','standard',-9223372036854775807),('K5','manual',19),
      ('X1','standard',-1),('X2','standard',4),('X3','manual',-42);
      CREATE ROLE trial_reader LOGIN;
      GRANT SELECT ON batch_lines TO trial_reader;""")
    raw = psql('BEGIN READ ONLY; WITH actual AS (' + statement + """
      ) SELECT json_build_object('reader',current_user,'ref',ref,'net',net_minor,'fee',fee_minor,
      'types',json_build_array(pg_typeof(net_minor)::text,pg_typeof(fee_minor)::text))
      FROM actual ORDER BY ref; COMMIT;""", 'trial_reader')
    rows = [json.loads(line) for line in raw.splitlines()]
    record['output'] = rows
    record['matchesFixedLiteralsAndTypes'] = [[r['ref'], r['net'], r['fee']] for r in rows] == expected and all(
        r['reader'] == 'trial_reader' and r['types'] == ['text', 'text'] for r in rows)
finally:
    label = call(['container', 'inspect', '--format', '{{index .Config.Labels "skills62.r22"}}', name])
    if label.returncode == 0 and label.stdout.strip() == name:
        call(['stop', '--timeout', '2', name])
    record['containerGone'] = call(['container', 'inspect', name]).returncode != 0
    result_path.write_text(json.dumps(record, indent=2) + '\n')
assert record['matchesFixedLiteralsAndTypes'] and record['containerGone']
print(f"{len(rows)} SQL results, exact values and text types")
