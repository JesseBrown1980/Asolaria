#!/data/data/com.termux/files/usr/bin/python3
# BEHCS MicroAgent ≤35LOC | 256-sym | D1(8)+D44(7189057)+D39(4657463)
# Old: paho.mqtt 100LOC → New: HTTP BEHCS bus 35LOC | symbols=code
import json,time,os,urllib.request as ur
B='http://127.0.0.1:4948/behcs/send' # adb-reverse→acer:4947
N=os.environ.get('BEHCS_NAME','aether-core')
D=os.environ.get('BEHCS_DEVICE','aether')
def tx(v,p):
 d=json.dumps({'from':D,'to':'asolaria','mode':'real','type':v,
  'id':f'{N}-{int(time.time())}','ts':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),
  'payload':p}).encode()
 try:
  r=ur.urlopen(ur.Request(B,d,{'Content-Type':'application/json'}),timeout=5)
  return json.loads(r.read())
 except:return{'ok':False}
def hw():
 c=len([l for l in open('/proc/cpuinfo') if 'processor' in l])
 m=[l.split(':')[1].strip() for l in open('/proc/meminfo') if 'MemTotal' in l or 'MemFree' in l]
 return{'cores':c,'ram':m,'name':N,'device':D}
tx('boot',{'verb':'behcs.node_boot','hw':hw(),'agent':N,'law':'LAW-008+010'})
print(f'[{N}]BOOT→{B}')
while True:
 tx('heartbeat',{'verb':'behcs.pulse','hw':hw()})
 time.sleep(30)
