"""Actual installed DSH + plugins against a local fake Messages API. No paid call."""
import json
import os
import subprocess
import tempfile
import threading
import unittest
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]


class RuntimeTests(unittest.TestCase):
    def test_real_runtime_loads_skills_and_tools(self):
        requests=[]
        class FakeMessages(BaseHTTPRequestHandler):
            def log_message(self,*args): pass
            def do_POST(self):
                body=json.loads(self.rfile.read(int(self.headers['Content-Length'])))
                requests.append(body)
                step=len(requests)
                actions=[('skill',{'name':'english-reading'}),('education_context',{}),
                         ('education_lookup_word',{'word':'fetch'}),('education_plan',{'minutes':20})]
                events=[('message_start',{'type':'message_start','message':{'id':f'msg-{step}','type':'message','role':'assistant','model':'deepseek-flash','content':[],'stop_reason':None,'stop_sequence':None,'usage':{'input_tokens':50,'output_tokens':0}}})]
                if step<=len(actions):
                    name,args=actions[step-1]
                    events += [('content_block_start',{'type':'content_block_start','index':0,'content_block':{'type':'tool_use','id':f'tool-{step}','name':name,'input':{}}}),
                        ('content_block_delta',{'type':'content_block_delta','index':0,'delta':{'type':'input_json_delta','partial_json':json.dumps(args)}})]
                    reason='tool_use'
                else:
                    events += [('content_block_start',{'type':'content_block_start','index':0,'content_block':{'type':'text','text':''}}),
                        ('content_block_delta',{'type':'content_block_delta','index':0,'delta':{'type':'text_delta','text':'LOCAL TEST: independent attempt first.'}})]
                    reason='end_turn'
                events += [('content_block_stop',{'type':'content_block_stop','index':0}),
                    ('message_delta',{'type':'message_delta','delta':{'stop_reason':reason,'stop_sequence':None},'usage':{'output_tokens':20}}),
                    ('message_stop',{'type':'message_stop'})]
                payload=''.join(f'event: {name}\ndata: {json.dumps(value)}\n\n' for name,value in events).encode()
                self.send_response(200);self.send_header('Content-Type','text/event-stream');self.send_header('Content-Length',str(len(payload)));self.end_headers();self.wfile.write(payload)
        server=ThreadingHTTPServer(('127.0.0.1',0),FakeMessages)
        threading.Thread(target=server.serve_forever,daemon=True).start()
        try:
            with tempfile.TemporaryDirectory() as folder:
                context=Path(folder)/'context.json'
                context.write_text(json.dumps({'runtimeSessionId':'test-session','prompt':'Start an English reading lesson.','goal':'Read independently','evidence':{'dueCount':60},'model':'deepseek-flash'}),encoding='utf-8')
                env={**os.environ,'DEEPSEEK_API_KEY':'test-key-not-real','DEEPSEEK_BASE_URL':f'http://127.0.0.1:{server.server_port}',
                     'WORDTRAIL_DSH_HOME':str(Path(folder)/'home'),'WORDTRAIL_TEST_DIAGNOSTICS':'1'}
                completed=subprocess.run(['node',str(ROOT/'integrations/dsh/bridge.mjs'),str(context)],cwd=ROOT,env=env,capture_output=True,text=True,encoding='utf-8',timeout=125)
                self.assertEqual(completed.returncode,0,completed.stderr+'\n'+completed.stdout)
                result=json.loads(completed.stdout)
                self.assertEqual(result['text'],'LOCAL TEST: independent attempt first.')
                self.assertEqual(len(requests),5)
                names={t['name'] for t in requests[0].get('tools',[])}
                self.assertEqual(names,{'skill','education_context','education_lookup_word','education_plan'})
                serialized=json.dumps(requests[-1],ensure_ascii=False)
                self.assertIn('independent',serialized)
                self.assertIn('fetch',serialized)
                self.assertIn('Review backlog',serialized)
                self.assertNotIn('is_error": true',serialized)
        finally:
            server.shutdown();server.server_close()


if __name__=='__main__': unittest.main()
