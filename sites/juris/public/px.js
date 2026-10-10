// Pixel Meta próprio (só liga quando META_PIXEL_ID existir na Vercel) + captura de UTM.
(function(){
  var q=new URLSearchParams(location.search),u={};
  ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','fbclid'].forEach(function(k){if(q.get(k))u[k]=q.get(k)});
  try{ if(Object.keys(u).length) sessionStorage.setItem('utm',JSON.stringify(u)); }catch(e){}
  window.utm=function(){try{return JSON.parse(sessionStorage.getItem('utm')||'null')}catch(e){return Object.keys(u).length?u:null}};
  var fila=[];window.ev=function(n,p,id){fila.push([n,p,id]);if(window.fbq)flush()};
  function flush(){while(fila.length){var e=fila.shift();window.fbq('track',e[0],e[1]||{},e[2]?{eventID:e[2]}:undefined)}}
  fetch((location.hostname.endsWith('jurispaginas.com')?'/':'./')+'api/config').then(function(r){return r.json()}).then(function(c){
    if(!c.pixel)return;
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    fbq('init',c.pixel);fbq('track','PageView');flush();
  }).catch(function(){});
})();
