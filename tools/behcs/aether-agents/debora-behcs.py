#!/data/data/com.termux/files/usr/bin/python3
# DEBORA-BEHCS ≤35LOC | D22(493039)+D34(2685619) | comms agent
# Old: 70LOC socket+reverse_tcp → New: 30LOC BEHCS-bus | LAW-008
import json,subprocess as sp,time,urllib.request as ur
B='http://127.0.0.1:4948/behcs/send'
A='http://192.168.15.189:4947/behcs/send' # fallback direct
def r(c):
 try:return sp.check_output(c,shell=True,stderr=sp.STDOUT,timeout=10).decode().strip()
 except:return''
def tx(p,bus=B):
 d=json.dumps({'from':'aether.debora','to':'triad','mode':'mirror','type':'comms',
  'id':f'deb-{int(time.time())}','ts':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),
  'payload':p}).encode()
 try:ur.urlopen(ur.Request(bus,d,{'Content-Type':'application/json'}),timeout=5);return True
 except:return False
rpt={'agent':'debora','verb':'behcs.comms_check','device':'aether',
 'wifi':r("ip addr show wlan0|grep 'inet '|awk '{print $2}'"),
 'gateway':r("ip route|grep default|awk '{print $3}'"),
 'dns':r('getprop net.dns1'),
 'battery':r('dumpsys battery|grep level|head -1').strip(),
 'channels':{'adb_tunnel':False,'lan_direct':False,'mqtt':'192.168.15.170:1883'},
 'dim':'D22+D34','law':'LAW-008+010'}
rpt['channels']['adb_tunnel']=tx(rpt,B)
if not rpt['channels']['adb_tunnel']:rpt['channels']['lan_direct']=tx(rpt,A)
print(json.dumps(rpt,indent=1))
