// Il tracciamento delle lead di orizonadv.it (4/11/2026, Antonio: «solo Meta», «solo le qualificate»).
// Il pixel Meta «Pixel di orizonadv.it» si carica SOLO col consenso marketing: finché non c'è il banner dei cookie non
// parte niente. Il banner, quando c'è, chiama orizonConsensoMarketing(true). Per provare: ?pixel=prova nell'indirizzo.
// Ogni modulo inviato manda «Lead»; chi spende almeno 5.000 €/mese manda anche «LeadQualificata» (è quella che ottimizza).
(function(){
  var PIXEL = '553082170215681';
  var QUALIFICATE = ['Da 5 a 15 mila €', 'Da 15 a 50 mila €', 'Più di 50 mila €'];
  var acceso = false;

  function carica(){
    if (acceso) return; acceso = true;
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;
    s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', PIXEL); fbq('track', 'PageView');
  }
  // senza consenso l'evento non parte e non si tiene da parte
  function manda(){ if (acceso) fbq.apply(null, arguments); }

  window.orizonConsensoMarketing = function(si){ if (si) carica(); };

  // dati = i campi del modulo; nome, email e telefono non vanno a Meta (solo le risposte alle domande)
  window.orizonLead = function(dati){
    var id = 'lead-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
    var info = {content_name: dati._modulo || 'Parliamone', budget: dati.budget || '', piattaforma: dati.piattaforma || '',
      catalogo: dati.catalogo || '', gestione: dati.gestione || ''};
    manda('track', 'Lead', info, {eventID: id});
    if (QUALIFICATE.indexOf(dati.budget) >= 0) manda('trackCustom', 'LeadQualificata', info, {eventID: id + '-q'});
  };

  try { if (new URLSearchParams(location.search).get('pixel') === 'prova') carica(); } catch (e) {}
})();
