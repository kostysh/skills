"""Compare real local CMS reads with the server-rendered Next page."""
import argparse
from html.parser import HTMLParser
import json
import os
from pathlib import Path
import signal
from socket import socket
import subprocess
import time
from urllib.error import HTTPError, URLError
from urllib.request import urlopen

class Heading(HTMLParser):
    def __init__(self):
        super().__init__()
        self.attrs = {}
        self.content = ''
        self.in_heading = False

    def handle_starttag(self, tag, attrs):
        if tag == 'h1' and not self.attrs:
            self.attrs = dict(attrs)
            self.in_heading = True

    def handle_endtag(self, tag):
        if tag == 'h1':
            self.in_heading = False

    def handle_data(self, data):
        if self.in_heading:
            self.content += data

def main():
    parser = argparse.ArgumentParser()
    for key in ['node', 'cms', 'next', 'store', 'output']:
        parser.add_argument(key,type=Path)
    args = parser.parse_args()
    args.store.mkdir()
    env = {**os.environ, 'PATH': str(args.node.parent) + os.pathsep + os.environ['PATH'],
           'PAYLOAD_DISABLE_TELEMETRY':'true', 'NEXT_TELEMETRY_DISABLED':'1'}
    def probe(*argv):
        return [str(args.node),'probe.mjs',str(args.store),*argv]
    def result(*argv):
        output = subprocess.check_output(probe(*argv),cwd=args.cms,env=env,text=True)
        return json.loads(next(line.removeprefix('CMS-RESULT ') for line in output.splitlines() if line.startswith('CMS-RESULT ')))
    def request(url):
        try:
            with urlopen(url,timeout=5) as response:
                return response.status,response.read().decode()
        except HTTPError as ex:
            return ex.code,ex.read().decode()
    def webpage(url):
        status,body = request(url)
        parser = Heading()
        parser.feed(body)
        return {'http':status, 'title':parser.content, 'sourceKey':parser.attrs.get('data-cms-key'),
                'id':parser.attrs.get('data-cms-id'), 'originalControls':all(label in body for label in
                ('Mark inspected','Entry help','Owner help'))}
    with socket() as sock:
        sock.bind(('127.0.0.1',0))
        next_url = 'http://127.0.0.1:' + str(sock.getsockname()[1])
    seed = result('seed')
    procs = []
    try:
        cms = subprocess.Popen(probe('serve','0'),env=env,cwd=args.cms,stdout=subprocess.PIPE,
                              stderr=subprocess.STDOUT,text=True,start_new_session=True)
        procs.append(cms)
        ready = next(line for line in cms.stdout if line.startswith('CMS-READY '))
        cms_url = 'http://127.0.0.1:' + ready.split()[1]
        with (args.store/'next-start.log').open('w') as logfile:
            procs.append(subprocess.Popen(['npm','run','start','--','--hostname','127.0.0.1','--port',next_url.rsplit(':',1)[1]],
                         cwd=args.next,env={**env,'DESK_READER_URL':cms_url},stdout=logfile,
                         stderr=subprocess.STDOUT,start_new_session=True))
        url = next_url+'/dossiers/reed'
        for _ in range(100):
            try:
                first=webpage(url)
                break
            except URLError:
                time.sleep(.1)
        else:
            raise TimeoutError('Next production server')
        initial = seed['visible'][0]
        assert first == {'http':200,'title':initial['title'],'sourceKey':initial['sourceKey'],
                         'id':str(initial['id']), 'originalControls':True}, first
        controls = {key:{'reader':request(cms_url+'/records/'+source_key)[0],
                        'page':webpage(next_url+'/dossiers/'+key)['http']} for key,source_key in
                    [('cedar','PROBE-DRAFT'),('amber','PROBE-WEST')]}
        assert all(x=={'reader':404,'page':404} for x in controls.values()), controls
        written = result('retitle','Перечитанная запись')
        reread = result('read','LOCAL-01')
        second = webpage(url)
        assert second == {**first,'title':written['title']} and second['title'] != first['title'], second
        assert reread[0]['id'] == initial['id'] == written['id'] and reread[0]['title'] == second['title'], reread
        observed = {'seed':seed,'route':'/dossiers/reed','before':first,'controls':controls,
                    'write':written,'roleReadAfter':reread,'secondRequest':second,
                    'node':subprocess.check_output([str(args.node),'--version'],text=True).strip(),
                    'versions':{name:json.loads((folder/'node_modules'/name/'package.json').read_text())['version']
                                for folder,name in [(args.cms,'payload'),(args.cms,'@payloadcms/db-sqlite'),
                                                    (args.cms,'graphql'),(args.next,'next'),(args.next,'react')]}}
        args.output.write_text(json.dumps(observed,ensure_ascii=False,indent=2)+'\n')
        print(json.dumps(observed,ensure_ascii=False))
    finally:
        for proc in reversed(procs):
            if proc.poll() is None:
                os.killpg(proc.pid,signal.SIGTERM)
                try: proc.wait(10)
                except subprocess.TimeoutExpired:
                    os.killpg(proc.pid,signal.SIGKILL)
                    proc.wait()

if __name__ == '__main__':
    main()
