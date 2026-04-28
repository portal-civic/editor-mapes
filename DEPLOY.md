# Publicar a GitHub Pages

## Prerequisits

- Compte de GitHub
- Git instal·lat localment

## Passos

### 1. Crear el repositori a GitHub

1. Ves a <https://github.com/new>
2. Nom del repositori: **`editor-mapes`** (ha de coincidir amb el valor de `REPO_NAME` a `app/vite.config.js`)
3. Visibilitat: Públic (necessari per a Pages gratuïtes)
4. No inicialitzis amb README ni .gitignore

### 2. Pujar el codi

```bash
git remote add origin https://github.com/USUARI/editor-mapes.git
git push -u origin main
```

Substitueix `USUARI` pel teu nom d'usuari de GitHub.

### 3. Activar GitHub Pages

1. Ves a **Settings → Pages** del repositori
2. A **Source**, selecciona **GitHub Actions**
3. Desa

### 4. Fer el primer deploy

El workflow s'activa automàticament en cada push a `main`.
Si ja has pujat el codi al pas 2, ves a **Actions** i comprova que el workflow hagi acabat correctament.

Per forçar un deploy manualment:
- **Actions → Deploy to GitHub Pages → Run workflow**

### 5. URL final

```
https://USUARI.github.io/editor-mapes/
```

---

## Canviar el nom del repositori

Si el repositori té un nom diferent a `editor-mapes`, edita la primera línia de `app/vite.config.js`:

```js
const REPO_NAME = 'el-nou-nom'
```

Fes commit i push; el workflow reconstruirà amb la ruta correcta.

---

## Funcionament local

El deploy no afecta el desenvolupament local. Continua usant:

```bash
cd app
npm run dev      # servidor de desenvolupament (http://localhost:5173)
npm run build    # build de producció → app/dist/
npm run preview  # previsualització del build (http://localhost:4173/editor-mapes/)
```

> **Nota sobre `npm run preview`:** en local el preview ja inclou el prefix `/editor-mapes/`
> perquè el build és de producció. Accedeix a `http://localhost:4173/editor-mapes/`.
