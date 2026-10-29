/* La partita a scacchi della home di orizonadv.it (29/10/2026). Antonio: «vinciamola noi la partita… è la strategia
   nostra che ci fa vincere, sono le varie funzioni… e si vince in utile». La partita è vera: il finale dell'«Opera
   Game», Morphy contro il duca di Brunswick e il conte Isouard, Parigi 1858, dalla posizione dopo 12...Td8. Noi siamo
   il Bianco: ogni mossa bianca è un servizio, la donna sacrificata sono le campagne (il budget dove rende), l'ultima
   mossa, i conti, dà scacco matto e il re nero si abbatte.
   Uso: var s = OrizonScacchi(contenitore); s.set(p) con p da 0 a 1 (lo scorrimento) → {mossa, fine}; s.mosse.
   Vuole THREE (three.js r128) e THREE.RoomEnvironment già caricati. */
(function () {
  "use strict";
  var MOSSE = [  // mezze mosse in ordine; quelle bianche portano il servizio
    {da: "d1", a: "d7", servizio: "Feed per Google e Meta", nota: "13. T×d7", frase: "Il prodotto giusto davanti a chi lo cerca."},
    {da: "d8", a: "d7"},
    {da: "h1", a: "d1", servizio: "Tracciamento", nota: "14. Td1", frase: "Ogni ordine contato, sul canale giusto."},
    {da: "e7", a: "e6"},
    {da: "b5", a: "d7", servizio: "Schede SEO e GEO", nota: "15. A×d7+", frase: "Trovati su Google e dalle AI."},
    {da: "f6", a: "d7"},
    {da: "b3", a: "b8", servizio: "Campagne", nota: "16. Db8+!!", frase: "Il budget va dove rende. Anche la regina."},
    {da: "d7", a: "b8"},
    {da: "d1", a: "d8", servizio: "I conti", nota: "17. Td8#", frase: "Scacco matto. Si vince in utile."}
  ];
  var BIANCHI = {c1: "k", b3: "q", d1: "r", h1: "r", b5: "b", g5: "b", a2: "p", b2: "p", c2: "p", e4: "p", f2: "p", g2: "p", h2: "p"};
  var NERI = {e8: "k", e7: "q", d8: "r", h8: "r", f8: "b", d7: "n", f6: "n", a7: "p", e5: "p", f7: "p", g7: "p", h7: "p"};
  var PASSO = .085, INIZIO = .06, MATTO = .84;

  var c01 = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
  var liscio = function (t) { return t * t * (3 - 2 * t); };
  var uscita = function (t) { return 1 - Math.pow(1 - t, 3); };
  var finestra = function (p, k) { return c01((p - INIZIO - k * PASSO) / (PASSO * .92)); };

  window.OrizonScacchi = function (el) {
    var T = window.THREE, ridotto = matchMedia("(prefers-reduced-motion: reduce)").matches;
    var piccolo = Math.min(screen.width, screen.height) < 700;
    var casa = function (s) { return new T.Vector3(s.charCodeAt(0) - 97 - 3.5, .03, 3.5 - (+s[1] - 1)); };

    var renderer;
    try { renderer = new T.WebGLRenderer({antialias: true, alpha: true, powerPreference: "high-performance"}); }
    catch (e) { return null; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, piccolo ? 1.75 : 2));
    renderer.outputEncoding = T.sRGBEncoding;
    renderer.toneMapping = T.NoToneMapping;  // ACES vira il blu Orizon verso il viola
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.domElement.className = "sc-tela";
    el.appendChild(renderer.domElement);

    var scena = new T.Scene(), cam = new T.PerspectiveCamera(30, 1, .1, 120);
    var pmrem = new T.PMREMGenerator(renderer);
    scena.environment = pmrem.fromScene(new T.RoomEnvironment(), .04).texture;

    // luci: una chiave morbida da sinistra, un filo blu da dietro che disegna i bordi
    scena.add(new T.HemisphereLight(0xffffff, 0x7c8ae8, .35));
    var chiave = new T.DirectionalLight(0xffffff, 1.15); chiave.position.set(-7, 13, 9); chiave.castShadow = true;
    chiave.shadow.mapSize.set(piccolo ? 1024 : 2048, piccolo ? 1024 : 2048); chiave.shadow.bias = -.0004; chiave.shadow.normalBias = .02;
    var sc = chiave.shadow.camera; sc.left = sc.bottom = -8; sc.right = sc.top = 8; sc.near = 1; sc.far = 40; scena.add(chiave);
    var contro = new T.DirectionalLight(0x8191ff, 1.1); contro.position.set(6, 5, -9); scena.add(contro);
    var luceVerde = new T.PointLight(0x60e787, 0, 5, 2); scena.add(luceVerde);

    var tavola = new T.Group(); scena.add(tavola);
    var terra = new T.Mesh(new T.PlaneGeometry(60, 60), new T.ShadowMaterial({opacity: .18}));
    terra.rotation.x = -Math.PI / 2; terra.position.y = -.62; terra.receiveShadow = true; tavola.add(terra);

    // la tavola: una lastra scura con gli spigoli smussati, le case lucide bianche e blu Orizon, le coordinate incise
    var forma = new T.Shape(), L = 4.75, R = .32;
    forma.moveTo(-L + R, -L); forma.lineTo(L - R, -L); forma.quadraticCurveTo(L, -L, L, -L + R); forma.lineTo(L, L - R);
    forma.quadraticCurveTo(L, L, L - R, L); forma.lineTo(-L + R, L); forma.quadraticCurveTo(-L, L, -L, L - R); forma.lineTo(-L, -L + R);
    forma.quadraticCurveTo(-L, -L, -L + R, -L);
    var lastra = new T.Mesh(new T.ExtrudeGeometry(forma, {depth: .42, bevelEnabled: true, bevelThickness: .06, bevelSize: .06, bevelSegments: 4, curveSegments: 10}),
      new T.MeshPhysicalMaterial({color: 0x0c1713, roughness: .35, metalness: .1, clearcoat: .8, clearcoatRoughness: .2}));
    lastra.rotation.x = -Math.PI / 2; lastra.position.y = -.5; lastra.castShadow = lastra.receiveShadow = true; tavola.add(lastra);
    var matChiara = new T.MeshPhysicalMaterial({color: 0xf1f3fd, roughness: .32, clearcoat: .6, clearcoatRoughness: .15});
    var matBlu = new T.MeshPhysicalMaterial({color: 0x3750f7, roughness: .28, clearcoat: .9, clearcoatRoughness: .1});
    var geoCasa = new T.BoxGeometry(.985, .06, .985);
    for (var f = 0; f < 8; f++) for (var r = 0; r < 8; r++) {
      var q = new T.Mesh(geoCasa, (f + r) % 2 ? matChiara : matBlu); q.position.set(f - 3.5, 0, 3.5 - r); q.receiveShadow = true; tavola.add(q);
    }
    function scritta(testo, w, h, disegna) {
      var cv = document.createElement("canvas"), k = 4; cv.width = w * k; cv.height = h * k;
      var g = cv.getContext("2d"); g.scale(k, k); disegna(g, testo, w, h);
      var tx = new T.CanvasTexture(cv); tx.encoding = T.sRGBEncoding; tx.anisotropy = 4; return tx;
    }
    var font = "IBM Plex Sans, system-ui, sans-serif";
    function coord(g, t, w, h) { g.fillStyle = "#8f9ae8"; g.font = "600 34px " + font; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(t, w / 2, h / 2 + 2); }
    "abcdefgh".split("").forEach(function (l, i) {
      [4.4, -4.4].forEach(function (z) {
        var m = new T.Mesh(new T.PlaneGeometry(.38, .38), new T.MeshBasicMaterial({map: scritta(l, 48, 48, coord), transparent: true, toneMapped: false}));
        m.rotation.x = -Math.PI / 2; m.position.set(i - 3.5, -.019, z); tavola.add(m);
      });
      [4.4, -4.4].forEach(function (x) {
        var m = new T.Mesh(new T.PlaneGeometry(.38, .38), new T.MeshBasicMaterial({map: scritta(String(i + 1), 48, 48, coord), transparent: true, toneMapped: false}));
        m.rotation.x = -Math.PI / 2; m.position.set(x, -.019, 3.5 - i); tavola.add(m);
      });
    });

    // i pezzi, girati al tornio come quelli veri (il cavallo è una sagoma estrusa)
    var BASE = [[0, 0], [.35, 0], [.36, .03], [.35, .07], [.31, .09], [.3, .13], [.25, .15], [.22, .19]];
    var PROF = {
      p: [[.2, .21], [.15, .26], [.12, .36], [.11, .42], [.2, .45], [.2, .48], [.11, .5], [0, .5]],
      r: [[.24, .22], [.22, .3], [.2, .58], [.27, .61], [.27, .66], [.25, .68], [.25, .8], [.17, .8], [.17, .74], [0, .74]],
      b: [[.18, .22], [.13, .32], [.11, .62], [.21, .65], [.21, .68], [.12, .71], [0, .71]],
      q: [[.22, .22], [.16, .32], [.12, .78], [.25, .82], [.25, .85], [.15, .88], [.17, .94], [.26, 1.04], [.12, 1.03], [0, 1.0]],
      k: [[.23, .22], [.17, .32], [.13, .86], [.26, .9], [.26, .93], [.16, .96], [.19, 1.02], [.23, 1.1], [0, 1.1]],
      n: [[.22, .22], [.2, .3], [0, .3]]
    };
    var CAVALLO = [[-.2, 0], [.2, 0], [.19, .1], [.13, .22], [.17, .3], [.3, .37], [.36, .44], [.35, .5], [.29, .55], [.17, .6], [.12, .69],
      [.07, .8], [.02, .7], [-.07, .69], [-.15, .58], [-.21, .44], [-.23, .26], [-.22, .1]];
    function pezzo(tipo, mat) {
      var g = new T.Group(), pts = BASE.concat(PROF[tipo]).map(function (q) { return new T.Vector2(q[0], q[1]); });
      g.add(new T.Mesh(new T.LatheGeometry(pts, 56), mat));
      var add = function (geo, x, y, z) { var m = new T.Mesh(geo, mat); m.position.set(x || 0, y, z || 0); g.add(m); return m; };
      if (tipo === "p") add(new T.SphereGeometry(.15, 32, 20), 0, .6);
      if (tipo === "b") { add(new T.SphereGeometry(.15, 32, 20), 0, .86).scale.set(1, 1.45, 1); add(new T.SphereGeometry(.05, 16, 10), 0, 1.09); }
      if (tipo === "r") for (var k = 0; k < 6; k++) { var a = k / 6 * Math.PI * 2, m = add(new T.BoxGeometry(.12, .1, .09), Math.cos(a) * .21, .85, Math.sin(a) * .21); m.rotation.y = -a; }
      if (tipo === "q") { for (var j = 0; j < 8; j++) { var b = j / 8 * Math.PI * 2; add(new T.SphereGeometry(.035, 12, 8), Math.cos(b) * .22, 1.06, Math.sin(b) * .22); } add(new T.SphereGeometry(.07, 20, 14), 0, 1.1); }
      if (tipo === "k") { add(new T.BoxGeometry(.06, .26, .06), 0, 1.23); add(new T.BoxGeometry(.2, .06, .06), 0, 1.26); }
      if (tipo === "n") {
        var s = new T.Shape(CAVALLO.map(function (q) { return new T.Vector2(q[0], q[1]); }));
        var testa = add(new T.ExtrudeGeometry(s, {depth: .2, bevelEnabled: true, bevelThickness: .04, bevelSize: .035, bevelSegments: 4, curveSegments: 8}), 0, .28, -.1);
        testa.rotation.y = -Math.PI / 2;
      }
      g.traverse(function (o) { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
      return g;
    }
    var matB = new T.MeshPhysicalMaterial({color: 0xf6f6f2, roughness: .22, clearcoat: 1, clearcoatRoughness: .06});
    var matN = new T.MeshPhysicalMaterial({color: 0x0d1120, roughness: .2, metalness: .15, clearcoat: 1, clearcoatRoughness: .05});
    var matMatto = matB.clone();  // la torre di h1, che dà il matto, diventa verde
    var pezzi = [];
    function metti(s, tipo, bianco) {
      var g = pezzo(tipo, bianco ? (s === "h1" ? matMatto : matB) : matN);
      if (tipo === "n") g.rotation.y = bianco ? Math.PI / 2 : -Math.PI / 2; else if (!bianco) g.rotation.y = Math.PI;
      g.userData = {casa: casa(s), bianco: bianco, ry: g.rotation.y}; g.position.copy(g.userData.casa); tavola.add(g); pezzi.push(g); return g;
    }
    var su = {};
    Object.keys(BIANCHI).forEach(function (s) { su[s] = metti(s, BIANCHI[s], true); });
    Object.keys(NERI).forEach(function (s) { su[s] = metti(s, NERI[s], false); });
    var reNero = su.e8;
    // chi muove e chi viene preso a ogni mezza mossa; i pezzi presi si mettono in fila fuori dalla tavola, dal lato di chi li ha presi
    var presiB = 0, presiN = 0;
    MOSSE.forEach(function (m, k) {
      m.k = k; m.chi = su[m.da]; m.preso = su[m.a] || null;
      if (m.preso) m.fila = m.preso.userData.bianco ? new T.Vector3(-5.75, -.62, -2.6 + 1.5 * presiB++) : new T.Vector3(5.75, -.62, 2.6 - 1.5 * presiN++);
      su[m.a] = m.chi; delete su[m.da];
    });
    var bianche = MOSSE.filter(function (m) { return m.servizio; });

    // i cartellini: pillole disegnate, sempre rivolte a chi guarda
    function pillola(testo, fondo, inchiostro) {
      var w = Math.round(Math.max(200, testo.length * 16.5 + 64)), h = 76;
      var tx = scritta(testo, w, h, function (g, t, w, h) {
        g.fillStyle = fondo; var r = h / 2; g.beginPath(); g.moveTo(r, 4); g.arcTo(w - 4, 4, w - 4, h - 4, r - 4); g.arcTo(w - 4, h - 4, 4, h - 4, r - 4);
        g.arcTo(4, h - 4, 4, 4, r - 4); g.arcTo(4, 4, w - 4, 4, r - 4); g.closePath(); g.fill();
        g.fillStyle = inchiostro; g.font = "600 30px " + font; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(t, w / 2, h / 2 + 1);
      });
      var sp = new T.Sprite(new T.SpriteMaterial({map: tx, transparent: true, depthTest: false, toneMapped: false}));
      sp.userData.r = w / h; sp.renderOrder = 10; sp.material.opacity = 0; tavola.add(sp); return sp;
    }
    bianche.forEach(function (m) { m.cartello = pillola(m.servizio, m === bianche[bianche.length - 1] ? "#60e787" : "#3750f7", m === bianche[bianche.length - 1] ? "#0c1713" : "#ffffff"); });
    var finale = pillola("Scacco matto · si vince in utile", "#60e787", "#0c1713");

    // le schegge delle prese: poche, blu e bianche, legate al punto dello scorrimento (si riavvolgono)
    MOSSE.forEach(function (m, i) {
      if (!m.preso) return;
      var mat = new T.MeshBasicMaterial({color: i % 2 ? 0x8191ff : 0xffffff, transparent: true, opacity: 0, toneMapped: false}), out = [];
      for (var k = 0; k < 14; k++) {
        var o = new T.Mesh(new T.OctahedronGeometry(.045 + (k % 3) * .015), mat), a = k / 14 * Math.PI * 2 + i;
        o.userData.dir = new T.Vector3(Math.cos(a), .9 + (k % 4) * .35, Math.sin(a)).multiplyScalar(.9 + (k % 5) * .18); tavola.add(o); out.push(o);
      }
      m.schegge = {mat: mat, pezzi: out};
    });

    // l'anello verde sotto la torre del matto
    var anello = new T.Mesh(new T.TorusGeometry(.46, .022, 12, 64), new T.MeshBasicMaterial({color: 0x60e787, transparent: true, opacity: 0, toneMapped: false}));
    anello.rotation.x = -Math.PI / 2; anello.position.copy(casa("d8")); anello.position.y = .045; tavola.add(anello);

    // i colori scritti in esadecimale sono sRGB: senza conversione, con l'uscita sRGB, tutto viene slavato
    var visti = [];
    scena.traverse(function (o) {
      [].concat(o.material || []).forEach(function (m) { if (visti.indexOf(m) >= 0) return; visti.push(m);
        if (m.color && !m.map) m.color.convertSRGBToLinear();
        if (m.envMapIntensity !== undefined) m.envMapIntensity = .55; });
    });

    // girarla col dito (solo di lato: in verticale la pagina scorre)
    var trascina = null, extra = 0;
    renderer.domElement.style.touchAction = "pan-y";
    renderer.domElement.addEventListener("pointerdown", function (e) { trascina = e.clientX; try { renderer.domElement.setPointerCapture(e.pointerId); } catch (x) {} });
    renderer.domElement.addEventListener("pointermove", function (e) { if (trascina !== null) { extra = Math.max(-1.2, Math.min(1.2, extra + (e.clientX - trascina) * .006)); trascina = e.clientX; } });
    ["pointerup", "pointercancel"].forEach(function (k) { renderer.domElement.addEventListener(k, function () { trascina = null; }); });

    var p = 0, verde = new T.Color(0x60e787).convertSRGBToLinear(), bianco = new T.Color(0xf6f6f2).convertSRGBToLinear(), emVerde = new T.Color(0x1d9a52).convertSRGBToLinear(), nero = new T.Color(0);
    var mira = new T.Vector3(), v = new T.Vector3(), t0 = performance.now(), esito = {mossa: -1, fine: false};

    function calcola() {
      pezzi.forEach(function (g) { g.position.copy(g.userData.casa); g.rotation.set(0, g.userData.ry, 0); g.visible = true; });
      var fuoco = null, forza = 0, scossa = 0, mossa = -1;
      MOSSE.forEach(function (m) {
        var t = finestra(p, m.k), chi = m.chi;
        if (m.schegge) { m.schegge.mat.opacity = 0; m.schegge.pezzi.forEach(function (o) { o.visible = false; }); }
        if (m.cartello) m.cartello.material.opacity = 0;
        if (t <= 0) return;
        var da = casa(m.da), a = casa(m.a), salta = chi === su.b8 || (m.da === "f6");
        // chi muove: scivola con un piccolo inchino (il cavallo salta); il pezzo si solleva un poco mentre va
        var corsa = liscio(c01(t / .55));
        chi.position.lerpVectors(da, a, corsa);
        chi.position.y = .03 + Math.sin(Math.PI * corsa) * (salta ? 1.2 : .45);
        chi.rotation.x = Math.sin(Math.PI * corsa) * (salta ? 0 : (chi.userData.bianco ? .12 : -.12));
        if (m.preso) {  // la presa: il pezzo vola via ruotando e atterra in piedi nella fila
          var via = c01((t - .45) / .5), u = uscita(via), x = m.preso;
          x.position.lerpVectors(a, m.fila, u); x.position.y += Math.sin(Math.PI * via) * 1.8;
          x.rotation.x = Math.sin(Math.PI * via) * 2.4 * (m.k % 2 ? -1 : 1);
          var imp = c01((t - .48) / .4);
          if (imp > 0 && imp < 1) {
            m.schegge.mat.opacity = 1 - imp;
            m.schegge.pezzi.forEach(function (o) { o.visible = true; o.position.copy(a).addScaledVector(o.userData.dir, uscita(imp) * 1.1); o.position.y += .3 - imp * imp * .9; o.rotation.set(imp * 6, imp * 4, 0); });
            scossa = Math.max(scossa, 1 - imp);
          }
        }
        if (m.servizio) {  // il cartellino del servizio sopra la casa d'arrivo, finché risponde il Nero
          mossa = bianche.indexOf(m);
          var dopo = finestra(p, m.k + 1), ultima = m === bianche[bianche.length - 1];
          m.cartello.material.opacity = liscio(c01((t - .35) / .3)) * (ultima ? 1 - liscio(c01((p - MATTO) / .05)) : 1 - liscio(c01((dopo - .6) / .4)));
          m.cartello.position.copy(a); m.cartello.position.y += 2.3;
        }
        var fz = Math.sin(Math.PI * c01(t)) * (m.servizio ? 1 : .6);
        if (fz > forza) { forza = fz; fuoco = a; }
      });
      // il matto: il re nero si abbatte, la torre diventa verde con l'anello di luce
      var fine = liscio(c01((p - MATTO) / .1)), ora = (performance.now() - t0) / 1000;
      reNero.rotation.z = fine * 1.42; reNero.rotation.x = fine * .25; reNero.position.x += fine * .32; reNero.position.y = .03 + Math.sin(Math.PI * fine) * .25;
      matMatto.color.copy(bianco).lerp(verde, fine); matMatto.emissive.copy(nero).lerp(emVerde, fine * .8);
      anello.material.opacity = fine * (.75 + .25 * Math.sin(ora * 2.4));
      var sca = 1 + fine * (.25 + .08 * Math.sin(ora * 2.4)); anello.scale.set(sca, sca, sca);
      luceVerde.intensity = fine * 1.4; luceVerde.position.copy(casa("d8")); luceVerde.position.y = 2.4;
      finale.material.opacity = liscio(c01((p - .9) / .06)); finale.position.copy(casa("d8")); finale.position.y = 2.6;
      if (fine > 0) scossa = Math.max(scossa, Math.sin(Math.PI * c01(fine * 1.6)) * .8);

      // la camera: dal lato del Bianco, gira piano, si avvicina a ogni mossa, alla fine va sul matto
      var asp = cam.aspect || 1, lontano = asp < 1 ? Math.pow(1 / asp, .75) : 1;
      var az = .28 + p * .4 + extra + (ridotto ? 0 : Math.sin(ora * .32) * .025), el = .8 - fine * .18, rg = (22 - forza * 2.2) * lontano * (1 - fine * .24);
      mira.set(.3, -.8, .2);
      if (fuoco) mira.lerp(v.copy(fuoco), forza * .32);
      mira.lerp(v.copy(casa("d8")).setY(.3), fine * .6);
      cam.position.set(mira.x + Math.sin(az) * Math.cos(el) * rg, mira.y + Math.sin(el) * rg, mira.z + Math.cos(az) * Math.cos(el) * rg);
      if (!ridotto && scossa > 0) { cam.position.x += Math.sin(ora * 60) * scossa * .05; cam.position.y += Math.cos(ora * 53) * scossa * .05; }
      cam.lookAt(mira);
      esito.mossa = mossa; esito.fine = p >= .9;
    }

    var vivo = false, sporco = true;
    function misura() {
      var w = el.clientWidth, h = el.clientHeight; if (!w || !h) return;
      renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); sporco = true;
      var k = w < 520 ? 1.3 : 1;  // sul telefono i cartellini un po' più grandi
      bianche.concat([{cartello: finale}]).forEach(function (m) { var c = m.cartello, hh = c === finale ? .82 : .7 * k; /* la scritta finale è lunga: sul telefono resta com'è */ c.scale.set(hh * c.userData.r, hh, 1); });
    }
    if (window.ResizeObserver) new ResizeObserver(misura).observe(el); else window.addEventListener("resize", misura);
    misura();
    new IntersectionObserver(function (e) { vivo = e[0].isIntersecting; }, {rootMargin: "100px"}).observe(el);
    (function giro() {
      if (vivo && (sporco || !ridotto)) { calcola(); renderer.render(scena, cam); sporco = false; }
      requestAnimationFrame(giro);
    })();
    var pronto = function () { el.classList.add("sc-pronto"); };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(pronto); else pronto();

    return {
      set: function (v) { p = c01(v); sporco = true; calcola(); return esito; },
      mosse: bianche.map(function (m) { return {servizio: m.servizio, nota: m.nota, frase: m.frase}; })
    };
  };
})();
