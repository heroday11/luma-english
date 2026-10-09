import json
import sys
import tempfile
import threading
import unittest
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen

sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from dev_server import StudyHTTPServer


class HttpTests(unittest.TestCase):
    def test_auth_private_files_and_conversation(self):
        with tempfile.TemporaryDirectory() as folder:
            server=StudyHTTPServer(('127.0.0.1',0),Path(folder)/'accounts.sqlite3')
            server.tutor.runner=lambda context,path:{'text':'Test reply'}
            thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
            account,cookie=server.accounts.register({'email':'tutor@example.test','password':'test123456','name':'Test'})
            base=f'http://127.0.0.1:{server.server_port}'
            def request(path,data=None,auth=True,origin=None):
                headers={'Content-Type':'application/json'}
                if auth: headers.update({'Cookie':'study_session='+cookie,'X-Study-Account':account['id']})
                if origin: headers['Origin']=origin
                req=Request(base+path,None if data is None else json.dumps(data).encode(),headers)
                try:
                    with urlopen(req) as res:return res.status,res.read()
                except HTTPError as res:return res.code,res.read()
            try:
                self.assertEqual(request('/api/tutor/sessions',auth=False)[0],401)
                for path in ['/integrations/dsh/challenges.json','/tutor_backend.py','/node_modules/@deepseek-ai/dsh/package.json','/.study-data/accounts.sqlite3','/.archive/']:
                    self.assertEqual(request(path)[0],403,path)
                self.assertEqual(request('/tutor.js')[0],200)
                self.assertEqual(request('/')[0],200)
                self.assertEqual(request('/api/tutor/sessions',{},origin='https://example.org')[0],403)
                code,raw=request('/api/tutor/sessions',{'mode':'reading'})
                self.assertEqual(code,200)
                sid=json.loads(raw)['id']
                code,raw=request('/api/tutor/message',{'sessionId':sid,'requestId':'request-1234567890','text':'my answer'})
                self.assertEqual(code,200)
                self.assertEqual(json.loads(raw)['turns'][-1]['text'],'Test reply')
            finally:
                server.shutdown();server.server_close();thread.join()


if __name__=='__main__':unittest.main()
