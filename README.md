# Álbum Mundial 2026 (sin IA)

App web estática para llevar el álbum compartido de figuritas del Mundial 2026 con foco en UX mobile.

## Qué hace ahora

- Sin asistente IA.
- Permite **tachar/marcar** figuritas conseguidas.
- Permite registrar cuántas veces está **repetida** cada figurita (`xN`).
- Filtros: **Todas**, **Me faltan**, **Repetidas**.
- Búsqueda por sección/país.
- Persistencia local en `localStorage`.

## Estructura de secciones

- FWC - Especiales: `00, 1, 2, 3, 4`
- FWC - Balón y Países: `5, 6, 7, 8`
- FWC - Historia: `9..19`
- Luego países clasificados: cada país con figuritas `1..20`.

## Países clasificados

La app incluye 48 selecciones (hosts + clasificadas) para el Mundial 2026.

> Fuente usada para orientar el listado: página de clasificación 2026 en Wikipedia (consultada en esta iteración) y referencias enlazadas allí.

## Ejecutar

```bash
python3 -m http.server 8080
```

Abrir `http://localhost:8080`.
