# Backend — Editor de Mapes (Overture Maps Places)

Backend Node/Express que consulta **Overture Maps Places** per bbox i els retorna normalitzats al frontend React.

---

## Requisits locals

- Node 20+
- Python 3.8+ amb pip
- La CLI `overturemaps` (veure baix)

### Instal·lar la CLI d'Overture Maps

```bash
pip install overturemaps
# Verificar:
overturemaps --help
```

> Si el sistema té PEP 668 activat (Debian/Ubuntu moderns), usa un virtualenv:
> ```bash
> python3 -m venv ~/.venvs/overture
> source ~/.venvs/overture/bin/activate
> pip install overturemaps
> ```
> I afig el venv al PATH del teu shell.

---

## Arrancar en local

```bash
cd backend
npm install
npm run dev
```

El servidor escoltarà per defecte al port **3000**.

### Variables d'entorn

| Variable | Descripció | Exemple |
|---|---|---|
| `PORT` | Port HTTP (opcional, default 3000) | `3001` |
| `FRONTEND_URL` | URL del frontend (afegida a CORS) | `https://editor-mapes.onrender.com` |

---

## Endpoints

### `GET /health`

Comprova que el servidor funciona.

```bash
curl http://localhost:3000/health
# → {"ok":true,"ts":"2026-05-20T10:00:00.000Z"}
```

### `GET /api/poi/overture`

Retorna els POIs d'Overture Maps per a un bbox donat.

**Paràmetres:**

| Param | Tipus | Obligatori | Descripció |
|---|---|---|---|
| `bbox` | string | ✅ | `west,south,east,north` en decimal |
| `limit` | int | ❌ | Màx resultats (default 5000, màx 10000) |
| `minConfidence` | float | ❌ | Filtre de confiança mínima (0–1) |

**Exemple:**

```bash
curl "http://localhost:3000/api/poi/overture?bbox=2.05,41.35,2.25,41.45&limit=2000&minConfidence=0.6"
```

**Resposta:**

```json
{
  "source": "overture",
  "bbox": [2.05, 41.35, 2.25, 41.45],
  "count": 1432,
  "pois": [
    {
      "id": "overture-abc123",
      "source": "overture",
      "name": "Restaurant La Mar",
      "latitude": 41.38,
      "longitude": 2.18,
      "appCategory": "restauracio",
      "overtureBasicCategory": "restaurant",
      "overturePrimaryCategory": "casual_dining",
      "overtureHierarchy": "food_and_drink › restaurant › casual_dining",
      "confidence": 0.87,
      "operatingStatus": "open",
      "address": "Carrer de la Llacuna, 162 – 08018 Barcelona",
      "websites": ["https://example.com"],
      "phones": ["+34 93 123 45 67"]
    }
  ]
}
```

**Errors:**

| Codi | Situació |
|---|---|
| 400 | bbox invàlid o falten paràmetres |
| 413 | bbox massa gran (>0.5 °²) |
| 502 | Error de la CLI d'overturemaps |

---

## Cache

El backend guarda les respostes en `backend/cache/overture/` durant **24 hores**. Si el mateix bbox+confidence es consulta de nou, respon instantàniament sense cridar la CLI.

Per esborrar la cache manualment:

```bash
rm backend/cache/overture/*.json
```

---

## Desplegar a Render

### Opció A — Build normal (sense Docker)

1. Connecta el repositori a [render.com](https://render.com).
2. Crea un **Web Service** nou.
3. Configura:

| Camp | Valor |
|---|---|
| **Root Directory** | `backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && pip install overturemaps` |
| **Start Command** | `npm start` |

4. Afig la variable d'entorn:

| Clau | Valor |
|---|---|
| `FRONTEND_URL` | URL del teu frontend desplegat (p.ex. `https://editor-mapes.onrender.com`) |

5. Despliega. Render instal·larà Python i la CLI automàticament.

> ⚠️ Si el build falla per problemes de Python/pip, usa l'Opció B (Docker).

### Opció B — Dockerfile

1. A la configuració del Web Service a Render, tria **Docker** com a entorn.
2. El `Dockerfile` ja s'encarrega d'instal·lar Node, Python i `overturemaps`.
3. Afig la variable d'entorn `FRONTEND_URL` igual que a l'Opció A.

---

## Integració frontend

### Local

Crea (o edita) `app/.env.local`:

```env
VITE_API_BASE_URL=http://localhost:3000
```

### Producció

Configura a Render (o al teu host frontend) la variable:

```env
VITE_API_BASE_URL=https://<nom-del-backend>.onrender.com
```

El frontend crida:

```
GET ${VITE_API_BASE_URL}/api/poi/overture?bbox=west,south,east,north&limit=5000&minConfidence=0.6
```

---

## Estructura de fitxers

```
backend/
├── server.js                    # Punt d'entrada Express
├── package.json
├── Dockerfile
├── .gitignore
├── routes/
│   └── overturePois.js          # GET /api/poi/overture
├── services/
│   └── overturePlacesService.js # Lògica de descàrrega + cache
├── utils/
│   ├── bbox.js                  # Validació i parsing de bbox
│   └── normalizeOverturePlace.js # Conversió al model intern
└── cache/
    └── overture/                # Cache JSON (ignorat per git)
```
