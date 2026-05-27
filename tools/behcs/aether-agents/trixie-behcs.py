#!/data/data/com.termux/files/usr/bin/python3
# TRIXIE-BEHCS ≤35LOC | D15(103823)+D27(1092727) | activation agent
# Old: 60LOC setprop+settings → New: 28LOC BEHCS-cubed | LAW-008
import json,subprocess as sp,time,urllib.request as ur
B='http://127.0.0.1:4948/behcs/send'
def r(c):
 try:return sp.check_output(c,shell=True,stderr=sp.STDOUT,timeout=10).decode().strip()
 except:return''
def tx(p):
 d=json.dumps({'from':'aether.trixie','to':'asolaria','mode':'stealth','type':'activation',
  'id':f'trix-{int(time.time())}','ts':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),
  'payload':p}).encode()
 try:ur.urlopen(ur.Request(B,d,{'Content-Type':'application/json'}),timeout=5)
 except:pass
rpt={'agent':'trixie','verb':'behcs.activate','device':'aether',
 'model':r('getprop ro.product.model'),'android':r('getprop ro.build.version.release'),
 'serial':r('getprop ro.serialno'),'cores':r('nproc'),
 'wifi':r("ip addr show wlan0|grep 'inet '|awk '{print $2}'"),
 'battery':r('dumpsys battery|grep level|head -1').strip(),
 'storage':[f for f in __import__('os').listdir('/sdcard') if 'behcs' in f.lower() or 'asolaria' in f.lower() or 'claude' in f.lower()],
 'usb':[],
 'law':'LAW-008+010','dim':'D15+D27'}
try:rpt['usb']=__import__('os').listdir('/mnt/media_rw/')
except:rpt['usb']=['no-access']
tx(rpt);print(json.dumps(rpt,indent=1))
