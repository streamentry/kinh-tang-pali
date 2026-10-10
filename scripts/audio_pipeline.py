"""Lossless text planning, WAV cache integrity and durable checkpoints."""
import hashlib, json, re, wave
from pathlib import Path

def digest(value):
    return hashlib.sha256(value).hexdigest()

def write_json(path, data):
    path=Path(path);path.parent.mkdir(parents=True,exist_ok=True)
    temp=path.with_suffix(path.suffix+'.tmp');temp.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n');temp.replace(path)

def split_text(text, limit):
    # Preserve all characters; prefer sentence ends, then whitespace. Never alter scripture.
    def balanced_prefixes(value):
        open_double=open_single=close_double=close_single=0
        balanced=[True]
        for char in value:
            if char=='“': open_double+=1
            elif char=='”': close_double+=1
            elif char=='‘': open_single+=1
            elif char=='’': close_single+=1
            balanced.append(open_double==close_double and open_single==close_single)
        return balanced

    parts=[]
    while len(text)>limit:
        window=text[:limit]
        balanced=balanced_prefixes(window)
        sentence_cuts=[match.end() for match in re.finditer(r'[.!?…][”’\"\']?\s+',window)]
        whitespace_cuts=[match.end() for match in re.finditer(r'\s+',window)]
        # Do not leave a quoted passage open at the end of a TTS request when an
        # earlier natural boundary can keep the whole quote in the next chunk.
        candidates=sorted(set(sentence_cuts+whitespace_cuts),reverse=True)
        cut=next((position for position in candidates if balanced[position]),0)
        if cut<=0:
            matches=sentence_cuts
            cut=matches[-1] if matches else max(text.rfind(' ',0,limit),text.rfind('\n',0,limit))+1
        if cut<=0 and text[limit].isspace(): cut=limit
        if cut<=0: raise ValueError('Unbroken token exceeds narration chunk limit')
        parts.append(text[:cut]);text=text[cut:]
    if text:parts.append(text)
    return parts

def plan_source(source, profile):
    summary=source['summary']
    planned=[]
    def append(section,text):
        for part in split_text(text,profile['chunk_max_chars']):
            planned.append({'section':section,'text':part,'text_sha256':digest(part.encode())})
    append('summary',summary)
    group=[]
    expected=[]
    for _,value in source['segments']:
        if not value.strip('… .'):
            if group:
                append('scripture','\n\n'.join(group));group=[]
            if planned and planned[-1]['section']=='scripture':
                planned[-1]['pause_after_seconds']=planned[-1].get('pause_after_seconds',profile['chunk_pause_seconds'])+profile['chunk_pause_seconds']
            continue
        group.append(value);expected.append(value)
    if group:append('scripture','\n\n'.join(group))
    # Chunk boundaries only add/remove presentation whitespace between complete segments.
    normalize=lambda text:' '.join(text.split())
    if ''.join(p['text'] for p in planned if p['section']=='summary')!=summary:raise RuntimeError('Summary accounting failed')
    if normalize(' '.join(p['text'] for p in planned if p['section']=='scripture'))!=normalize(' '.join(expected)):raise RuntimeError('Scripture accounting failed')
    return planned

def wav_info(path, profile):
    with wave.open(str(path),'rb') as wav:
        expected=(profile['sample_rate_hz'],profile['channels'],profile['sample_width_bytes'])
        if (wav.getframerate(),wav.getnchannels(),wav.getsampwidth())!=expected or wav.getnframes()<=0:raise ValueError('Invalid cached WAV format')
        data=wav.readframes(wav.getnframes())
        if len(data)!=wav.getnframes()*wav.getnchannels()*wav.getsampwidth():raise ValueError('Truncated cached WAV')
        return {'wav_sha256':digest(Path(path).read_bytes()),'frames':wav.getnframes(),'duration_seconds':wav.getnframes()/wav.getframerate()}

def cached_chunk_valid(path, record, planned, profile):
    if not record or record.get('text_sha256')!=planned['text_sha256'] or not Path(path).exists():return False
    try:return all(record.get(k)==v for k,v in wav_info(path,profile).items())
    except (ValueError,wave.Error,EOFError):return False

def mp3_info(data):
    pos=0;frames=0;seconds=0.0
    if data[:3]==b'ID3':raise ValueError('Unexpected MP3 ID3 header')
    while pos<len(data):
        h=int.from_bytes(data[pos:pos+4],'big')
        if h>>21!=0x7ff or (h>>19)&3!=2 or (h>>17)&3!=1:raise ValueError('Invalid MPEG-2 Layer III frame')
        rate_index=(h>>10)&3
        if rate_index==3:raise ValueError('Invalid MP3 rate')
        rate=[22050,24000,16000][rate_index]
        bitrate=[0,8,16,24,32,40,48,56,64,80,96,112,128,144,160,0][(h>>12)&15]
        if rate!=24000 or bitrate!=160:raise ValueError('MP3 encoding differs from profile')
        size=72*bitrate*1000//rate+((h>>9)&1)
        if size<=0 or pos+size>len(data):raise ValueError('Truncated MP3 frame')
        seconds+=576/rate;frames+=1;pos+=size
    if not frames:raise ValueError('Empty MP3')
    return {'frames':frames,'duration_seconds':seconds,'bytes':len(data),'sha256':digest(data)}
