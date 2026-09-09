from ab import ab,D
ab('set','viewport','375','812');ab('open','http://127.0.0.1:43803/');ab('wait','--text','Delete Alpha');ab('network','har','start');ab('snapshot','-i')
ab('click','button[type="submit"]' if False else 'form button');ab('wait','--text','Name is required');ab('screenshot',str(D/'create-required-mobile.png'))
ab('eval','JSON.stringify({invalid:document.querySelector("input[required]").getAttribute("aria-invalid"),description:document.querySelector("input[required]").getAttribute("aria-describedby")})')
ab('click','a[href="/items/1"]');ab('wait','--text','Request 1');ab('snapshot','-i');ab('fill','input','Changed');ab('click','button');ab('wait','--text','Try again');ab('snapshot','-i');ab('get','value','input');ab('screenshot',str(D/'correction-error-mobile.png'))
ab('fill','input','Corrected');ab('click','button');ab('wait','--text','Saved');ab('snapshot','-i');ab('get','value','input');ab('screenshot',str(D/'correction-success-mobile.png'))
ab('click','a');ab('wait','--text','Delete Corrected');ab('snapshot','-i');ab('click','a[href="/items/1"]');ab('wait','--text','Request 1');ab('get','value','input');ab('reload');ab('wait','--text','Request 1');ab('get','value','input');ab('snapshot','-i');ab('network','har','stop',str(D/'correction.har'))
