import json
import tempfile
import threading
import urllib.request
import urllib.error
from pathlib import Path
from dev_server import StudyHTTPServer
from auth_backend import AccountError

with tempfile.TemporaryDirectory() as temporary:
    server=StudyHTTPServer(('127.0.0.1',0),Path(temporary)/'accounts.sqlite3')
    thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
    base=f'http://127.0.0.1:{server.server_port}'
    def request(path,data=None,cookie='',account='',method=None):
        headers={'Content-Type':'application/json'}
        if cookie:headers['Cookie']='study_session='+cookie
        if account:headers['X-Study-Account']=account
        req=urllib.request.Request(base+path,json.dumps(data).encode() if data is not None else None,headers,method=method)
        try:
            response=urllib.request.urlopen(req,timeout=40)
            return response.status,json.load(response),response.headers
        except urllib.error.HTTPError as error:
            return error.code,json.load(error),error.headers
    a,cookie=server.accounts.register({'email':'isolated@example.test','password':'testpass123','name':'Temporary QA'})
    status,result,_=request('/api/progress',{'data':{'xp':10,'reviewEvents':[]},'baseRevision':0},cookie,a['id'],'PUT')
    assert status==200 and result['revision']==1
    status,result,_=request('/api/progress',{'data':{'xp':20},'baseRevision':0},cookie,a['id'],'PUT')
    assert status==409 and result['code']=='PROGRESS_CONFLICT'
    assert server.accounts.get_progress(a['id'])['xp']==10
    status,result,_=request('/api/progress',None,cookie,'wrong-user')
    assert status==409 and result['code']=='ACCOUNT_MISMATCH'
    code=server.accounts.create_recovery_code(a['id'])
    account,new_cookie=server.accounts.recover({'email':a['email'],'password':'newtestpass123','recoveryCode':code})
    assert account['id']==a['id'] and server.accounts.account_for_session(cookie) is None
    assert server.accounts.account_for_session(new_cookie)['id']==a['id']
    try:
        server.accounts.recover({'email':a['email'],'password':'testpass123','recoveryCode':code})
        raise AssertionError('Recovery code reused')
    except AccountError as error:assert error.status==401
    audio=[]
    for voice in ('en-US-AriaNeural','en-US-GuyNeural','en-GB-SoniaNeural','en-GB-RyanNeural'):
        status,data,_=request('/api/tts',{'text':'Learning a little every day makes a difference.','voice':voice,'rate':.85})
        assert status==200 and len(data['timings'])==8,(voice,data)
        with urllib.request.urlopen(base+data['url']) as response:
            assert response.headers['Content-Type']=='audio/mpeg' and len(response.read())>1000
        audio.append(voice)
    server.shutdown();server.server_close()
    print(json.dumps({'accountTests':'passed','concurrencyRevision':'passed','accountIsolation':'passed','oneUseRecoveryCode':'passed','onlineVoices':audio},indent=2))
