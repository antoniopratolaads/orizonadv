# Orizon ADV - Sito Web

## Struttura
```
orizon-site/
├── index.html          ← Home
├── servizi.html        ← Servizi  
├── work.html           ← Work / Case Studies
├── contatti.html       ← Contatti (form multi-step)
├── case-study/
│   └── vg-informatica.html  ← Case Study VG Informatica
├── images/
│   └── logo-orizon.png
├── 404.html            ← Pagina errore
├── vercel.json         ← Config Vercel (clean URLs)
├── robots.txt
└── sitemap.xml
```

## Deploy su Vercel

### Primo deploy
1. Vai su [vercel.com](https://vercel.com) e crea un account (gratis con GitHub)
2. Scarica e estrai lo zip
3. Trascina la cartella `orizon-site` su vercel.com/new (oppure usa Vercel CLI)
4. Vercel ti darà un URL tipo `orizon-site.vercel.app`

### Collegare il dominio orizonadv.it
1. Su Vercel → Settings → Domains → Aggiungi `orizonadv.it`
2. Vercel ti dirà quali record DNS aggiungere
3. Vai sul pannello del tuo registrar (Aruba, GoDaddy, ecc.)
4. Modifica i DNS:
   - Record A: `76.76.21.21`
   - Record CNAME (www): `cname.vercel-dns.com`
5. Aspetta propagazione DNS (5min - 48h)
6. HTTPS automatico via Vercel

### Aggiornare il sito
- Sostituisci i file e ri-deploya
- Oppure collega un repo GitHub per deploy automatici

## Note tecniche
- Babel standalone RIMOSSO (JSX pre-compilato)
- React 18.2 CDN (production build)
- Zero dipendenze server-side
- Peso totale: ~265KB (senza immagini)
- Tutte le pagine: navigazione e footer collegati
