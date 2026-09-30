# Sonilux website

Website voor Sonilux Verhuur — LED- en eventmaterialen in Limburg.

## Lokaal draaien

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## GitHub Pages (tijdelijk live zetten)

De site wordt als statische export gedeployed via GitHub Actions.

### Stap 1 — GitHub repository aanmaken

1. Ga naar [github.com/new](https://github.com/new)
2. Naam bijv. `SummaOps` (hoofdlettergevoelig voor de URL)
3. Maak de repository aan (public)

### Stap 2 — Code uploaden

In PowerShell, in de map `SummaOps`:

```powershell
git init
git add .
git commit -m "Initial commit: Sonilux website"
git branch -M main
git remote add origin https://github.com/JOUW-GEBRUIKERSNAAM/SummaOps.git
git push -u origin main
```

> Heb je nog geen Git? Installeer [Git for Windows](https://git-scm.com/download/win) en herstart Cursor.

### Stap 3 — GitHub Pages inschakelen

1. Open je repository op GitHub
2. **Settings** → **Pages**
3. Bij **Build and deployment** → **Source**: kies **GitHub Actions**
4. Push opnieuw naar `main`, of ga naar **Actions** → **Deploy to GitHub Pages** → **Run workflow**

Na ±2 minuten staat de site live op:

`https://JOUW-GEBRUIKERSNAAM.github.io/SummaOps/`

### Andere repositorynaam?

Pas in `.github/workflows/deploy.yml` staat `GITHUB_PAGES_BASE_PATH` automatisch op de repositorynaam. Lokaal testen met andere naam:

```powershell
$env:GITHUB_PAGES="true"
$env:GITHUB_PAGES_BASE_PATH="jouw-repo-naam"
npm run build
```

## Let op (tijdelijke demo)

- Offerte- en contactformulieren loggen alleen lokaal in de browser — er is geen backend op GitHub Pages.
- Voor productie: Vercel, Netlify of een eigen server met e-mail/database.
