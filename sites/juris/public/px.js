// Pixel Meta próprio (só liga quando META_PIXEL_ID existir na Vercel) + captura de UTM e dos identificadores da Meta.
(function(){
  var q=new URLSearchParams(location.search),u={};
  ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','fbclid'].forEach(function(k){if(q.get(k))u[k]=q.get(k)});
  try{ if(Object.keys(u).length) sessionStorage.setItem('utm',JSON.stringify(u)); }catch(e){}
  window.utm=function(){try{return JSON.parse(sessionStorage.getItem('utm')||'null')}catch(e){return Object.keys(u).length?u:null}};
  // _fbp/_fbc: o navegador interno do Instagram/Facebook e bloqueadores muitas vezes não deixam o pixel gravar os cookies,
  // e o pedido chegava ao servidor com fbp/fbc nulos. Gravamos nós mesmos (cookie primário, formato oficial da Meta);
  // o pixel reaproveita o que já existir. O fbc guarda a hora do clique (chegada com fbclid), como a Meta pede.
  function lerCk(n){try{var m=document.cookie.match(new RegExp('(?:^|; )'+n+'=([^;]*)'));return m?decodeURIComponent(m[1]):null}catch(e){return null}}
  function gravaCk(n,v){try{var d=location.hostname.endsWith('jurispaginas.com')?';domain=.jurispaginas.com':'';document.cookie=n+'='+encodeURIComponent(v)+';path=/;max-age=7776000;SameSite=Lax'+d}catch(e){}}
  var agora=Date.now();
  if(!lerCk('_fbp')) gravaCk('_fbp','fb.1.'+agora+'.'+Math.floor(Math.random()*9e9+1e9));
  if(u.fbclid){ var atual=lerCk('_fbc'); if(!atual||atual.split('.').slice(3).join('.')!==u.fbclid) gravaCk('_fbc','fb.1.'+agora+'.'+u.fbclid); }
  window.fbIds=function(){return {fbp:lerCk('_fbp'),fbc:lerCk('_fbc')}};
  // ev(nome, dados, eventID): eventos padrão vão com track; os nossos (ex.: AbriuCheckout) com trackCustom.
  var PADRAO={PageView:1,ViewContent:1,Lead:1,InitiateCheckout:1,AddPaymentInfo:1,Purchase:1};
  var fila=[];window.ev=function(n,p,id){fila.push([n,p,id]);if(window.fbq)flush()};
  function flush(){while(fila.length){var e=fila.shift();window.fbq(PADRAO[e[0]]?'track':'trackCustom',e[0],e[1]||{},e[2]?{eventID:e[2]}:undefined)}}
  fetch((location.hostname.endsWith('jurispaginas.com')?'/':'./')+'api/config').then(function(r){return r.json()}).then(function(c){
    if(!c.pixel)return;
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    fbq('init',c.pixel);fbq('track','PageView');flush();
  }).catch(function(){});
})();
