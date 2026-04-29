# Álbum Mundial 2026 (Web App)

Prototipo de app para que un grupo comparta **un solo álbum** de figuritas, con:

- Registro unificado de figuritas.
- Detección de duplicadas (no se cargan dos veces).
- Chat con flujo listo para IA + imagen.
- Interfaz cuidada y simple.
- Sincronización compartida usando Google Sheets como backend liviano.

## Cómo se persiste hoy

- **Local**: se guarda en `localStorage` del navegador (rápido, pero sólo para ese dispositivo/usuario).
- **Compartido**: si configurás una URL de Google Apps Script, la app también guarda y lee el estado remoto para que todos vean lo mismo.

## Ejecutar

```bash
python3 -m http.server 8080
```

Después abrí `http://localhost:8080`.

## Sincronización compartida con Google Sheets (recomendado)

### 1) Crear la planilla

- Crear una Google Sheet nueva.
- Renombrar una hoja como `album_state`.
- En `A1` poner `json_state`.

### 2) Crear Apps Script

En la misma Sheet: `Extensiones > Apps Script` y pegar este código:

```javascript
const SHEET_NAME = 'album_state';

function doGet(e) {
  const action = (e.parameter.action || '').toLowerCase();
  if (action !== 'load') {
    return jsonOutput({ ok: false, error: 'invalid_action' });
  }

  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_NAME);
  const raw = sheet.getRange('A2').getValue();
  const payload = raw ? JSON.parse(raw) : { owned: [], duplicateHits: 0, albumSize: 670 };

  return jsonOutput({ ok: true, payload });
}

function doPost(e) {
  const body = JSON.parse(e.postData.contents || '{}');
  if (body.action !== 'save' || !body.payload) {
    return jsonOutput({ ok: false, error: 'invalid_body' });
  }

  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_NAME);
  sheet.getRange('A2').setValue(JSON.stringify(body.payload));

  return jsonOutput({ ok: true });
}

function jsonOutput(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
```

### 3) Publicar como Web App

- `Implementar > Nueva implementación > Aplicación web`.
- Ejecutar como: **tu usuario**.
- Quién tiene acceso: **Cualquiera con el enlace**.
- Copiar la URL y pegarla en la app (campo de sincronización).

### 4) Usar en la app

- Clic en **Conectar**.
- Clic en **Traer estado** para cargar el álbum común.
- Desde ahí, cada alta sube cambios automáticamente.

## Integración con GPT-5.5

Hoy el cliente extrae números desde texto como demo. Para producción:

1. Crear un backend (`POST /chat-image`) que reciba texto + foto.
2. Llamar a GPT-5.5 con visión.
3. Devolver JSON:

```json
{ "sticker_numbers": [12, 45, 333] }
```

4. En `app.js`, reemplazar `extractStickerNumbers(text)` dentro del submit por `fetch('/chat-image')`.

Prompt sugerido para GPT-5.5:

> Sos un asistente para álbum de figuritas del Mundial 2026. Dada una foto y/o texto, devolvé SOLO JSON válido con esta forma: {"sticker_numbers":[números enteros únicos]}. Si no detectás ninguna, devolvé lista vacía.

## Dónde podés publicar esta app

Como es una app estática, podés publicarla muy fácil en cualquiera de estas opciones:

1. **Netlify (recomendado por simpleza)**
   - Conectás el repo de GitHub.
   - Build command: *(vacío)*.
   - Publish directory: `.`
   - Te da URL HTTPS automática.

2. **Vercel**
   - Importás el repo.
   - Framework preset: `Other`.
   - Output directory: `.`

3. **GitHub Pages**
   - Push al repo.
   - Activás Pages desde `Settings > Pages`.
   - Source: branch principal / root.

4. **Cloudflare Pages**
   - Conectás repo.
   - Build command vacío.
   - Build output: `.`

### Recomendación práctica

- Para empezar hoy mismo: **Netlify** o **Vercel**.
- Si querés costo cero y mantenerlo en GitHub: **GitHub Pages**.

> Importante: la URL de Google Apps Script para sincronización funciona igual en todos estos hosts, siempre que tu Web App de Apps Script esté desplegada como "Cualquiera con el enlace".
