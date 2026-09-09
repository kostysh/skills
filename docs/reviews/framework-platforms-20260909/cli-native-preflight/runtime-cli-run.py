#!/usr/bin/env python3
"""Run a task CLI with only its case, public tools, and bounded proxy socket mounted."""
import argparse
import json
import os
from pathlib import Path
import stat
import subprocess
import sys
import uuid

LAB = Path('/tmp/framework-platforms-20260909')
parser = argparse.ArgumentParser()
parser.add_argument('--cwd', required=True)
parser.add_argument('--socket-dir', required=True)
parser.add_argument('--timeout', type=int, default=600)
parser.add_argument('--log', required=True)
parser.add_argument('command', nargs=argparse.REMAINDER)
args = parser.parse_args()
case = Path(args.cwd).resolve(strict=True)
allowed = case in [LAB / 'fixtures/supabase-cli-current', LAB / 'fixtures/supabase-cli-legacy']
for phase in ['baseline', 'candidate']:
    for name in ['S-cli-current', 'S-cli-legacy']:
        allowed = allowed or case == LAB / 'trials' / phase / name / 'app'
if not allowed:
    parser.error('cwd must be an exact task Supabase CLI fixture/trial app')
socket_dir = Path(args.socket_dir).resolve(strict=True)
if not socket_dir.is_relative_to(LAB / 'infrastructure/docker-proxy/sockets'):
    parser.error('socket directory must be in the task public socket tree')
socket = socket_dir / 'docker.sock'
if not stat.S_ISSOCK(socket.stat().st_mode):
    parser.error('task proxy socket is not a Unix socket')
command = args.command[1:] if args.command[:1] == ['--'] else args.command
if not command or not 1 <= args.timeout <= 1800:
    parser.error('provide a command and timeout between 1 and 1800 seconds')
log = Path(args.log).resolve()
if not log.is_relative_to(LAB):
    parser.error('log must remain task-local')
name = 'fp20260909-cli-run-' + uuid.uuid4().hex[:8]
docker = [
    'docker', 'run', '--rm', '--init', '--name', name,
    '--user', f'{os.getuid()}:{os.getgid()}', '--network', 'host',
    '--cpus', '1.25', '--cpuset-cpus', '28-31', '--memory', '6g',
    '--memory-swap', '6g', '--pids-limit', '512',
    '--security-opt', 'no-new-privileges:true',
    '-v', f'{case}:{case}',
    '-v', f'{LAB / "tools"}:{LAB / "tools"}:ro',
    '-v', f'{socket_dir}:{socket_dir}',
    '-w', str(case),
]
for key, value in {
    'HOME': str(case / '.runtime-home'),
    'DOCKER_HOST': f'unix://{socket}',
    'PATH': f'{LAB / "tools"}:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
    'DO_NOT_TRACK': '1',
    'SUPABASE_TELEMETRY_DISABLED': '1',
}.items():
    docker += ['-e', f'{key}={value}']
docker += ['mcr.microsoft.com/playwright:v1.63.0-noble', *command]
try:
    result = subprocess.run([
        sys.executable, str(LAB / 'record.py'), '--cwd', str(case),
        '--log', str(log), '--timeout', str(args.timeout), '--', *docker,
    ])
    sys.exit(result.returncode)
finally:
    cleanup = {'container': name, 'removed': False, 'absenceConfirmed': False}
    try:
        removal = subprocess.run(
            ['docker', 'rm', '-f', name], capture_output=True, text=True, timeout=15,
        )
        cleanup['removed'] = removal.returncode == 0
        cleanup['removeExit'] = removal.returncode
        readback = subprocess.run(
            ['docker', 'ps', '-a', '--filter', f'name=^/{name}$', '--format', '{{.ID}}'],
            capture_output=True, text=True, timeout=10,
        )
        cleanup['readbackExit'] = readback.returncode
        cleanup['absenceConfirmed'] = readback.returncode == 0 and not readback.stdout.strip()
    except subprocess.TimeoutExpired:
        cleanup['error'] = 'bounded cleanup or readback timed out'
    except OSError:
        cleanup['error'] = 'cleanup or readback process could not start'
    cleanup_path = log.with_name(log.stem + '-cleanup.jsonl')
    cleanup_path.parent.mkdir(parents=True, exist_ok=True)
    with cleanup_path.open('a') as output:
        output.write(json.dumps(cleanup) + '\n')
    print(json.dumps({'cleanup': cleanup}), file=sys.stderr)
    if not cleanup['absenceConfirmed']:
        print('Task runner cleanup is retained or unknown; do not release its resource slot.', file=sys.stderr)
        sys.exit(125)
