"""Exercise all object PUT/readbacks and failed-second-part registration gate offline."""
import importlib.util,json,os,sys,tempfile,unittest,urllib.error
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'scripts'))
import audio_compilation_test as fixtures
from audio_pipeline import digest
spec=importlib.util.spec_from_file_location('parts_uploader',Path(__file__).resolve().parents[2]/'scripts/audio-r2.py')
uploader=importlib.util.module_from_spec(spec);spec.loader.exec_module(uploader)

class Response:
    def __init__(self,data,status=200):self.data=data;self.status=status;self.headers=self
    def __enter__(self):return self
    def __exit__(self,*args):pass
    def read(self):return self.data
    def get_content_type(self):return 'audio/mpeg'

class UploadTests(unittest.TestCase):
    write=fixtures.CompilationTests.write
    def setUp(self):
        fixtures.CompilationTests.setUp(self)
        (self.root/'source').mkdir()
        (self.root/'source/audio-storage.json').write_text(json.dumps({'account_id':'test-account','bucket_name':'audio-test','public_base_url':'https://audio-test.example'}))
        self.assets=[];parts=[]
        for i in range(2):
            path=self.folder/f'part-{i}.mp3';data=(self.folder/'sn1.1.mp3').read_bytes()+bytes([i]);path.write_bytes(data)
            part={'id':f'part-{i+1:03}','sha256':digest(data),'bytes':len(data),'duration_seconds':.96}
            self.assets.append({**part,'path':str(path)});parts.append(part)
        self.assembly={**self.manifest,'asset_kind':'reading-parts-v1','parts':parts,'sha256':digest(''.join(p['sha256']+'\n' for p in parts).encode()),'bytes':sum(p['bytes'] for p in parts),'duration_seconds':1.92}
        self.puts={};self.fail_second=False
    def open(self,request,timeout=None):
        url=request.full_url
        if 'api.cloudflare.com' in url:
            if request.method=='PUT':
                if self.fail_second and len(self.puts)==1:raise urllib.error.HTTPError(url,503,'test',{},None)
                self.puts[url]=request.data
                return Response(b'')
            result={'domain':'audio-test.example','enabled':True,'bucketId':'test-bucket'} if url.endswith('/domains/managed') else {'id':'test-bucket'}
            return Response(json.dumps({'success':True,'result':result}).encode())
        self.assertTrue(url.startswith('https://audio-test.example/vi/sn/sn1.1/parts-v1/'))
        key=url.split('https://audio-test.example/',1)[1]
        data=next(v for k,v in self.puts.items() if k.endswith('/objects/'+key))
        if request.get_header('Range'):return Response(data[:1024],206)
        return Response(data)
    def run_upload(self):
        def command(args,cwd=None):
            return json.dumps({'manifest':self.assembly,'assets':self.assets} if 'uv'==args[0] else self.source).encode()
        with patch.object(uploader,'ROOT',self.root),patch.object(uploader,'load_env'),patch.object(uploader,'require_current_group_source'),patch.object(uploader,'update') as update,patch.object(uploader.subprocess,'check_output',side_effect=command),patch.object(uploader.urllib.request,'urlopen',side_effect=self.open),patch.dict(os.environ,{'CLOUDFLARE_API_TOKEN':'offline-dummy','CLOUDFLARE_ACCOUNT_ID':'test-account'},clear=True),patch.object(sys,'argv',['audio-r2.py',str(self.folder)]):
            uploader.main()
            update.assert_called_once()
        return json.loads((self.root/'content/audio/sn1.1.json').read_text())
    def test_register_only_after_all_parts_are_verified(self):
        entry=self.run_upload()
        self.assertEqual(len(self.puts),2)
        self.assertTrue(all(p['public_range_verified'] for p in entry['parts']))
        self.assertEqual(entry['url'],entry['parts'][0]['url'])
        self.assertEqual(entry['sha256'],self.assembly['sha256'])
    def test_partial_upload_never_registers_a_truncated_reading(self):
        self.fail_second=True
        with self.assertRaisesRegex(RuntimeError,'503'):self.run_upload()
        self.assertFalse((self.root/'content/audio/sn1.1.json').exists())
if __name__=='__main__':unittest.main()
