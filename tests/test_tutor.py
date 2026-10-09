import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from tutor_backend import TutorStore
from auth_backend import AccountError


class TutorTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.calls = []
        def runner(context, folder):
            self.calls.append(context)
            return {'text': '请先独立解释这句话。'}
        self.store = TutorStore(Path(self.tmp.name), runner)

    def tearDown(self):
        self.tmp.cleanup()

    def test_account_isolation_and_idempotent_retry(self):
        session = self.store.create('alice', {'mode':'reading','goal':'阅读','minutes':20})
        with self.assertRaises(AccountError):
            self.store.session('bob',session['id'])
        request = {'sessionId':session['id'],'requestId':'request-1234567890','text':'开始阅读练习'}
        result = self.store.message('alice',request,{'reviewEvents':[]})
        self.assertEqual(len(result['turns']),2)
        self.store.message('alice',request,{})
        self.assertEqual(len(self.calls),1)
        self.assertNotIn('owner',self.calls[0])
        with self.assertRaises(AccountError):
            self.store.message('bob',request,{})
        with self.assertRaises(AccountError):
            self.store.message('alice',{**request,'text':'different'}, {})

    def test_failure_preserves_attempt_and_can_retry(self):
        session = self.store.create('alice',{})
        request = {'sessionId':session['id'],'requestId':'request-1234567890','text':'my attempt'}
        runner=self.store.runner
        def fail(*args): raise RuntimeError('sensitive upstream body')
        self.store.runner=fail
        with self.assertRaises(AccountError) as caught:
            self.store.message('alice',request,{})
        self.assertNotIn('sensitive',str(caught.exception))
        self.assertEqual(self.store.session('alice',session['id'])['turns'][0]['status'],'failed')
        self.store.runner=runner
        self.assertEqual(len(self.store.message('alice',request,{})['turns']),2)

    def test_delayed_check_withholds_future_and_records_once(self):
        first=self.store.challenge('alice',1000)
        self.assertNotIn('answer',first['task'])
        result=self.store.answer_challenge('alice',{'id':first['task']['id'],'answer':1},1000)
        self.assertTrue(result['correct'])
        future=result['next']
        self.assertFalse(future['available'])
        self.assertNotIn('passage',future['task'])
        with self.assertRaises(AccountError):
            self.store.answer_challenge('alice',{'id':future['task']['id'],'answer':2},1001)
        self.assertTrue(self.store.challenge('alice',87400)['available'])
        result=self.store.answer_challenge('alice',{'id':future['task']['id'],'answer':2},87400)
        self.assertTrue(result['next']['done'])
        self.assertEqual(len(result['next']['history']),2)
        self.assertTrue(self.store.challenge('bob',1001)['available'])


if __name__=='__main__': unittest.main()
