"""Offline assembly and cache gates; speech/encoder providers are never called."""
import copy,json,sys,unittest,wave
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'scripts'))
sys.path.insert(0,str(Path(__file__).resolve().parent))
import audio_compilation_test as fixtures
from audio_reading_parts import package_reading
from audio_pipeline import digest,wav_info,plan_source
from audio_compilation import json_hash
from narration_config import profile_digest

class ReadingPartsTests(unittest.TestCase):
    write = fixtures.CompilationTests.write
    def setUp(self):
        fixtures.CompilationTests.setUp(self)
        checkpoint=json.loads((self.folder/'checkpoint.json').read_text())
        for i,item in enumerate(self.plan):
            path=self.folder/f'{i:03}.wav'
            with wave.open(str(path),'wb') as w:
                w.setnchannels(1);w.setsampwidth(2);w.setframerate(24000);w.writeframes(bytes([i+1,0])*24000)
            checkpoint['chunks'][str(i)]={**item,**wav_info(path,self.profile)}
        self.write('checkpoint.json',checkpoint)
        frame=(self.folder/'sn1.1.mp3').read_bytes()[:480]
        data=frame*114;(self.folder/'sn1.1.mp3').write_bytes(data)
        self.manifest.update(duration_seconds=2.7,sha256=digest(data),bytes=len(data))
        self.write('manifest.json',self.manifest)
    def fake_encode(self,chunks,target,profile):
        data=bytes([chunks[0]['chunk_index']+1])*100
        target.write_bytes(data)
        return {'sha256':digest(data),'bytes':len(data),'duration_seconds':1.416,'frames':59}
    def test_parts_reuse_every_wav_once_and_checksum_is_assembly(self):
        with patch('audio_reading_parts.encode_part',side_effect=self.fake_encode) as encoder:
            manifest,assets=package_reading(self.folder,self.source,self.profile,2)
        self.assertEqual(encoder.call_count,2)
        self.assertEqual([(p['first_chunk'],p['last_chunk']) for p in manifest['parts']],[(0,0),(1,1)])
        self.assertEqual(manifest['source_mp3']['sha256'],self.manifest['sha256'])
        self.assertEqual(manifest['sha256'],digest(''.join(p['sha256']+'\n' for p in assets).encode()))
        self.assertEqual(manifest['bytes'],200)
        self.assertAlmostEqual(manifest['duration_seconds'],2.832)
        self.assertEqual(manifest['pcm_duration_seconds'],2.7)
        self.assertNotIn('path',manifest['parts'][0])
        self.assertEqual(json.loads((self.folder/'manifest.json').read_text()),self.manifest)
    def test_stale_source_and_corrupt_wav_fail_before_encode(self):
        with patch('audio_reading_parts.encode_part') as encoder:
            changed=copy.deepcopy(self.source);changed['title']='changed'
            with self.assertRaises(ValueError):package_reading(self.folder,changed,self.profile,2)
            (self.folder/'000.wav').write_bytes(b'corrupt')
            with self.assertRaises(ValueError):package_reading(self.folder,self.source,self.profile,2)
            encoder.assert_not_called()
    def test_summary_to_scripture_pause_is_preserved_for_legacy_readings(self):
        self.source.update(uid='mn1',collection='mn',summary='Tóm tắt.')
        self.source.pop('policy')
        plan=plan_source(self.source,self.profile)
        fingerprint=json_hash([self.source['source_sha256'],profile_digest(self.profile),plan])
        old=self.folder;self.folder=old.parent/fingerprint[:16];old.rename(self.folder)
        checkpoint=json.loads((self.folder/'checkpoint.json').read_text())
        for i,item in enumerate(plan):checkpoint['chunks'][str(i)]={**item,**wav_info(self.folder/f'{i:03}.wav',self.profile)}
        checkpoint['fingerprint']=fingerprint
        data=(self.folder/'sn1.1.mp3').read_bytes()[:480]*166
        (self.folder/'mn1.mp3').write_bytes(data)
        self.manifest.update(uid='mn1',collection='mn',summary_chunk_count=1,chunk_plan_sha256=json_hash(plan),duration_seconds=3.95,sha256=digest(data),bytes=len(data))
        for name,value in [('checkpoint.json',checkpoint),('plan.json',plan),('source.json',self.source),('manifest.json',self.manifest)]:self.write(name,value)
        def encode(chunks,target,profile):
            info=self.fake_encode(chunks,target,profile)
            info['duration_seconds']=sum(c['speech_frames']+c['pause_frames'] for c in chunks)/24000+.05
            return info
        with patch('audio_reading_parts.encode_part',side_effect=encode):
            result,_=package_reading(self.folder,self.source,self.profile,3.5)
        self.assertEqual([p['pcm_duration_seconds'] for p in result['parts']],[2.6,1.35])
        self.assertEqual(result['source_mp3']['duration_seconds'],3.95)
    def test_short_reading_keeps_original_object(self):
        manifest,assets=package_reading(self.folder,self.source,self.profile)
        self.assertEqual(manifest,self.manifest);self.assertEqual(len(assets),1)

if __name__=='__main__':unittest.main()
