/* La partita a scacchi della home di orizonadv.it (29/10/2026, Antonio: «una scacchiera con una partita a scacchi»).
   I bianchi sono i 100 € venduti, i neri sono i costi: ogni costo si mangia un pezzo (il più grosso, la regina, se lo
   prende il costo del prodotto), i pezzi mangiati si mettono in fila accanto alla tavola col loro cartellino, alla fine
   restano il re e due pedoni, verdi: 22 €. Valori d'esempio, gli stessi della home.
   Uso: var s = OrizonScacchi(contenitore); s.set(p) con p da 0 a 1 (lo scorrimento) → {resta, fine}.
   Vuole THREE (three.js r128) e THREE.RoomEnvironment già caricati. */
(function () {
  "use strict";
  var MOSSE = [
    {voce: "IVA",                eur: 18, chi: "c8", a: "c3"},
    {voce: "Costo del prodotto", eur: 37, chi: "d8", a: "d4"},
    {voce: "Pubblicità",         eur: 10, chi: "b7", a: "f3"},
    {voce: "Resi",               eur:  9, chi: "g3", a: "e2"},
    {voce: "Spedizioni",         eur:  4, chi: "d4", a: "f2"}   // la regina nera, che ha già mangiato in d4
  ];
  var BIANCHI = {g1: "k", d4: "q", c3: "r", f3: "n", e2: "b", f2: "p", g2: "p", h2: "p"};
  var NERI = {g8: "k", c8: "r", d8: "q", b7: "b", g3: "n", f7: "p", g7: "p", h7: "p"};
  var RESTANO = ["g1", "g2", "h2"], MARGINE = 22;

  var c01 = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
  var liscio = function (t) { return t * t * (3 - 2 * t); };
  var uscita = function (t) { return 1 - Math.pow(1 - t, 3); };
  var finestra = function (p, i) { return c01((p - .08 - i * .15) / .14); };

  window.OrizonScacchi = function (el, opz) {
    opz = opz || {};
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

    // il piano sotto: solo l'ombra, lo sfondo è quello della pagina
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
    var matB = new T.MeshPhysicalMaterial({color: 0xf6f6f2, roughness: .22, clearcoat: 1, clearcoatRoughness: .06, sheen: 0});
    var matN = new T.MeshPhysicalMaterial({color: 0x0d1120, roughness: .2, metalness: .15, clearcoat: 1, clearcoatRoughness: .05});
    var pezzi = {};
    Object.keys(BIANCHI).forEach(function (s) {
      var mat = RESTANO.indexOf(s) >= 0 ? matB.clone() : matB, g = pezzo(BIANCHI[s], mat);
      g.position.copy(casa(s)); g.userData = {mat: mat, casa: casa(s)}; if (BIANCHI[s] === "n") g.rotation.y = Math.PI / 2;
      tavola.add(g); pezzi["w" + s] = g;
    });
    Object.keys(NERI).forEach(function (s) {
      var g = pezzo(NERI[s], matN); g.position.copy(casa(s)); g.rotation.y = NERI[s] === "n" ? -Math.PI / 2 : Math.PI; tavola.add(g); pezzi["b" + s] = g;
    });
    var attori = MOSSE.map(function (m, i) { return {g: pezzi["b" + (i === 4 ? "d8" : m.chi)], da: casa(m.chi), a: casa(m.a), salta: m.chi === "g3"}; });
    // i pezzi mangiati vanno in fila sul lato della tavola rivolto a chi guarda, ognuno col suo cartellino: lo scontrino
    var vittime = MOSSE.map(function (m, i) { return {g: pezzi["w" + m.a], fila: new T.Vector3(5.75, -.62, 3.6 - i * 1.5)}; });
    var restano = RESTANO.map(function (s) { return pezzi["w" + s]; });

    // i cartellini: pillole disegnate, sempre rivolte a chi guarda
    function pillola(testo, fondo, inchiostro) {
      var w = 300, h = 76;
      var tx = scritta(testo, w, h, function (g, t, w, h) {
        g.fillStyle = fondo; var r = h / 2; g.beginPath(); g.moveTo(r, 4); g.arcTo(w - 4, 4, w - 4, h - 4, r - 4); g.arcTo(w - 4, h - 4, 4, h - 4, r - 4);
        g.arcTo(4, h - 4, 4, 4, r - 4); g.arcTo(4, 4, w - 4, 4, r - 4); g.closePath(); g.fill();
        g.fillStyle = inchiostro; g.font = "600 30px " + font; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(t, w / 2, h / 2 + 1);
      });
      var sp = new T.Sprite(new T.SpriteMaterial({map: tx, transparent: true, depthTest: false, toneMapped: false}));
      sp.scale.set(1.7, .43, 1); sp.renderOrder = 10; sp.material.opacity = 0; tavola.add(sp); return sp;
    }
    var cartellini = MOSSE.map(function (m) { return pillola(m.voce + "  −" + m.eur + " €", "#0c1713", "#ffffff"); });
    var finale = pillola("Ti restano " + MARGINE + " €", "#60e787", "#0c1713"); finale.scale.set(2.3, .58, 1);

    // le schegge dell'impatto: poche, blu e bianche, legate al punto dello scorrimento (si riavvolgono)
    var schegge = MOSSE.map(function (m, i) {
      var mat = new T.MeshBasicMaterial({color: i % 2 ? 0x8191ff : 0xffffff, transparent: true, opacity: 0, toneMapped: false}), out = [];
      for (var k = 0; k < 14; k++) {
        var o = new T.Mesh(new T.OctahedronGeometry(.045 + (k % 3) * .015), mat), a = k / 14 * Math.PI * 2 + i;
        o.userData.dir = new T.Vector3(Math.cos(a), .9 + (k % 4) * .35, Math.sin(a)).multiplyScalar(.9 + (k % 5) * .18); tavola.add(o); out.push(o);
      }
      return {mat: mat, pezzi: out};
    });

    // l'anello verde sotto il re, alla fine
    var anello = new T.Mesh(new T.TorusGeometry(.46, .022, 12, 64), new T.MeshBasicMaterial({color: 0x60e787, transparent: true, opacity: 0, toneMapped: false}));
    anello.rotation.x = -Math.PI / 2; anello.position.copy(casa("g1")); anello.position.y = .045; tavola.add(anello);

    // i colori scritti in esadecimale sono sRGB: senza conversione, con l'uscita sRGB, tutto viene slavato
    var visti = [];
    scena.traverse(function (o) {
      var ms = o.material ? [].concat(o.material) : [];
      ms.forEach(function (m) { if (visti.indexOf(m) >= 0) return; visti.push(m);
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
    var mira = new T.Vector3(), v = new T.Vector3(), t0 = performance.now(), esito = {resta: 100, fine: false};

    function calcola() {
      for (var k = attori.length - 1; k >= 0; k--) { attori[k].g.position.copy(attori[k].da); attori[k].g.rotation.x = 0; }
      var tolto = 0, fuoco = null, forza = 0, scossa = 0;
      MOSSE.forEach(function (m, i) {
        var t = finestra(p, i), a = attori[i], x = vittime[i], c = cartellini[i], sc = schegge[i];
        x.g.position.copy(x.g.userData.casa); x.g.rotation.set(0, x.g.rotation.y, 0); c.material.opacity = 0; sc.mat.opacity = 0;
        sc.pezzi.forEach(function (o) { o.visible = false; });
        if (t <= 0) return;
        // il nero arriva: scivola con un piccolo inchino, il cavallo salta
        var corsa = liscio(c01(t / .5));
        a.g.position.lerpVectors(a.da, a.a, corsa);
        a.g.position.y = .03 + Math.sin(Math.PI * corsa) * (a.salta ? 1.2 : .4);
        a.g.rotation.x = Math.sin(Math.PI * corsa) * (a.salta ? 0 : -.12);
        // l'urto: il bianco vola via ruotando e atterra in piedi nella fila
        var via = c01((t - .42) / .5), u = uscita(via);
        x.g.position.lerpVectors(x.g.userData.casa, x.fila, u);
        x.g.position.y += Math.sin(Math.PI * via) * 1.8;
        x.g.rotation.x = Math.sin(Math.PI * via) * 2.4 * (i % 2 ? -1 : 1);
        var imp = c01((t - .45) / .35);
        if (imp > 0 && imp < 1) {
          sc.mat.opacity = 1 - imp;
          sc.pezzi.forEach(function (o) { o.visible = true; o.position.copy(a.a).addScaledVector(o.userData.dir, uscita(imp) * 1.1); o.position.y += .3 - imp * imp * .9; o.rotation.set(imp * 6, imp * 4, 0); });
          scossa = Math.max(scossa, (1 - imp) * (m.eur / 37));
        }
        c.material.opacity = liscio(c01((t - .8) / .2)) * (1 - liscio(c01((p - .84) / .1)));
        c.position.copy(x.fila); c.position.y += 1.75 + (i % 2) * .5;
        tolto += m.eur * liscio(c01((t - .45) / .45));
        var f = Math.sin(Math.PI * c01(t));
        if (f > forza) { forza = f; fuoco = a.a; }
      });
      var fine = liscio(c01((p - .84) / .12));
      restano.forEach(function (g, i) {
        var mat = g.userData.mat; mat.color.copy(bianco).lerp(verde, fine); mat.emissive.copy(nero).lerp(emVerde, fine * .8);
        g.position.y = .03 + (i === 0 ? .18 : .06) * fine;
      });
      var ora = (performance.now() - t0) / 1000;
      anello.material.opacity = fine * (.75 + .25 * Math.sin(ora * 2.4));
      var sca = 1 + fine * (.25 + .08 * Math.sin(ora * 2.4)); anello.scale.set(sca, sca, sca);
      luceVerde.intensity = fine * 1.4; luceVerde.position.copy(casa("g1")); luceVerde.position.y = 2.4;
      finale.material.opacity = liscio(c01((p - .9) / .08)); finale.position.copy(casa("g1")); finale.position.y = 2.15;

      // la camera: gira piano con lo scorrimento, si avvicina a ogni presa, alla fine va sul re
      var asp = cam.aspect || 1, lontano = asp < 1 ? Math.pow(1 / asp, .75) : 1;
      var az = .62 + p * .42 + extra + (ridotto ? 0 : Math.sin(ora * .32) * .025), el = .78 - fine * .2, rg = (23 - forza * 2) * lontano * (1 - fine * .38);
      mira.set(1.5, -.9, .1);
      if (fuoco) mira.lerp(v.copy(fuoco), forza * .3);
      mira.lerp(v.copy(casa("g1")).setY(.2), fine * .6);
      cam.position.set(mira.x + Math.sin(az) * Math.cos(el) * rg, mira.y + Math.sin(el) * rg, mira.z + Math.cos(az) * Math.cos(el) * rg);
      if (!ridotto && scossa > 0) { cam.position.x += Math.sin(ora * 60) * scossa * .05; cam.position.y += Math.cos(ora * 53) * scossa * .05; }
      cam.lookAt(mira);
      esito.resta = Math.round(100 - tolto); esito.fine = p >= .9;
    }

    var vivo = false, sporco = true;
    function misura() {
      var w = el.clientWidth, h = el.clientHeight; if (!w || !h) return;
      renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); sporco = true;
      var k = w < 520 ? 1.3 : 1;  // sul telefono i cartellini un po' più grandi
      cartellini.forEach(function (c) { c.scale.set(1.7 * k, .43 * k, 1); }); finale.scale.set(2.3 * k, .58 * k, 1);
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
      mosse: MOSSE
    };
  };
})();
