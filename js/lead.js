// Il tracciamento delle lead di orizonadv.it (4/11/2026, Antonio: «solo Meta», «solo le qualificate»).
// Il pixel Meta «Pixel di orizonadv.it» si carica SOLO col consenso alla pubblicità, dato nel banner di CookieYes
// (5/11, Antonio: «5000 visite sono sufficienti», il piano gratuito). Senza il codice di CookieYes non parte niente.
// Per provare: ?pixel=prova nell'indirizzo. Ogni modulo inviato manda «Lead»; chi spende almeno 5.000 €/mese manda
// anche «LeadQualificata» (è quella che ottimizza, conversione «Lead qualificata» su Meta).
(function(){
  var PIXEL = '553082170215681';
  // il codice del sito su CookieYes (Impostazioni › Codice di installazione: cdn-cookieyes.com/client_data/<codice>/script.js)
  var COOKIEYES = '';
  var QUALIFICATE = ['Da 5 a 15 mila €', 'Da 15 a 50 mila €', 'Più di 50 mila €'];
  var acceso = false;

  function carica(){
    if (acceso) { fbq('consent', 'grant'); return; }
    acceso = true;
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;
    s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', PIXEL); fbq('track', 'PageView');
  }
  // senza consenso l'evento non parte e non si tiene da parte
  function manda(){ if (acceso) fbq.apply(null, arguments); }

  window.orizonConsensoMarketing = function(si){ if (si) carica(); else if (acceso) fbq('consent', 'revoke'); };

  // CookieYes: il consenso già dato (visite dopo la prima) e quello che cambia nel banner
  function giaDato(){ try { var c = window.getCkyConsent && getCkyConsent(); if (c && c.categories && c.categories.advertisement) carica(); } catch (e) {} }
  document.addEventListener('cookieyes_banner_load', giaDato);
  document.addEventListener('cookieyes_consent_update', function(e){
    var si = ((e.detail && e.detail.accepted) || []).indexOf('advertisement') >= 0;
    window.orizonConsensoMarketing(si);
  });
  if (COOKIEYES) {
    var s = document.createElement('script'); s.id = 'cookieyes';
    s.src = 'https://cdn-cookieyes.com/client_data/' + COOKIEYES + '/script.js';
    document.head.appendChild(s);
  }

  // dati = i campi del modulo; nome, email e telefono non vanno a Meta (solo le risposte alle domande)
  window.orizonLead = function(dati){
    var id = 'lead-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
    var info = {content_name: dati._modulo || 'Parliamone', budget: dati.budget || '', piattaforma: dati.piattaforma || '',
      catalogo: dati.catalogo || '', gestione: dati.gestione || ''};
    manda('track', 'Lead', info, {eventID: id});
    if (QUALIFICATE.indexOf(dati.budget) >= 0) manda('trackCustom', 'LeadQualificata', info, {eventID: id + '-q'});
  };

  try { if (new URLSearchParams(location.search).get('pixel') === 'prova') carica(); } catch (e) {}
  giaDato();
})();
