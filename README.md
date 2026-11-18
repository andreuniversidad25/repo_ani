# Rendia · Panel de rendimientos

Aplicación interactiva en español para liquidar los intereses diarios de consignaciones en pesos colombianos. Incluye los archivos originales **Giros.csv** y **Tasas.csv**; no requiere una cuenta, un servicio externo ni una base de datos.

## Ejecutar

Con Node.js 22.13 o superior:

```sh
npm ci
npm run dev
```

La dirección de desarrollo aparece en la terminal. Para preparar una versión estática de producción:

```sh
npm run build
npm run preview
```

`dist/` se puede publicar en un alojamiento estático. Las fuentes y demás recursos se sirven con la aplicación.

## Publicar en GitHub Pages

1. En [Settings → Pages](https://github.com/andreuniversidad25/repo_ani/settings/pages), selecciona **Build and deployment → Source → GitHub Actions**.
2. Fusiona el PR en `main`. El flujo **Test and deploy Rendia to Pages** instala las dependencias, ejecuta las pruebas, compila el sitio y publica `dist/`. En los PR solo ejecuta las verificaciones: no publica el sitio.
3. Cuando termine el despliegue en **Actions**, abre **https://andreuniversidad25.github.io/repo_ani/**. Para volver a publicarlo sin cambiar el código, selecciona **Run workflow** sobre `main`.

No necesitas configurar secretos, mantener una rama `gh-pages` ni subir `node_modules/` o `dist/`. Los recursos usan rutas relativas y la navegación usa fragmentos (`#/reportes`, por ejemplo), por lo que se pueden recargar las vistas bajo `/repo_ani/`.

**Datos publicados:** los dos CSV originales forman parte del repositorio público y del sitio compilado. Los giros añadidos en el navegador no se envían a GitHub ni se comparten entre visitantes.

## Uso

1. Selecciona la **fecha de salida** en el calendario o escríbela directamente. El límite es el **31 de diciembre de 2026** y es el corte inicial del panel.
2. Consulta el capital ingresado, los intereses acumulados y el saldo total. Explora el gráfico acumulado o diario con el puntero o las flechas del teclado. El anillo distribuye los intereses por trimestre **de ingreso del giro**, no por trimestre de causación.
3. Selecciona un giro para consultar los valores con centavos, su curva de rendimiento y el historial diario de tasas y saldos. La tabla permite ordenar columnas y paginar; en **Consignaciones** también puedes buscar, filtrar y registrar giros adicionales. Desde el detalle se pueden editar o eliminar, con confirmación, los giros añadidos manualmente.
4. En **Tasas de interés**, consulta los intervalos correspondientes a la cuenta o el historial original completo.
5. En **Reportes**, explora el resumen gráfico o el consolidado diario. **Exportar reporte** permite descargar:
   - CSV del resumen por consignación, con totales.
   - CSV del detalle diario por giro, con la tasa aplicada y los intereses del día y acumulados.
   - **HTML interactivo sin conexión** con tabla ordenable, selección de giros y exploración diaria del gráfico. Fija el corte y el método del momento de exportación.
   - Informe con tablas y gráficos mediante la impresión del navegador, incluyendo «Guardar como PDF».

Los CSV usan UTF-8 con BOM, punto y coma como separador y coma decimal. La fecha de salida, el método y los giros añadidos se conservan en el almacenamiento local del navegador. **Los archivos originales no se modifican**; se pueden consultar y descargar desde «Fuentes de datos».

## Criterios financieros

- `Giros.csv` contiene **10 consignaciones** con mes y año. Por ejemplo, `ene-26` se interpreta como **2026-01-01**. Los giros introducidos manualmente usan el día exacto ingresado.
- `Tasas.csv` contiene **27 intervalos**. Se utiliza el porcentaje de la columna **Tasa nominal** directamente como tasa diaria. La tasa E.A. es informativa y no se divide entre 365.
- El cálculo incluye la fecha de consignación **y** la fecha de salida, así como sábados, domingos y festivos. Los límites de cada intervalo de tasa son inclusivos.
- Por defecto, **interés simple diario**: `interés del día = capital original × tasa nominal diaria (%) / 100`.
- En **Guía de cálculo** se puede activar el **interés compuesto diario**: `interés del día = (capital original + interés acumulado anterior) × tasa nominal diaria (%) / 100`.
- Los intereses se suman sin redondear entre días. El panel principal redondea a pesos enteros; los detalles y exportaciones monetarias presentan dos decimales.
- Los giros posteriores al corte no contribuyen a los totales. Un corte anterior al primer ingreso produce cero capital, cero intereses y cero saldo.
- No se extrapolan ni se inventan tasas. Para añadir un giro se verifica cobertura continua desde su fecha hasta el máximo seleccionable. El hueco del **7 de febrero de 2022** en el archivo original no afecta a los giros de 2026.
- Las fechas se manejan como días de calendario en UTC, sin desplazamientos por huso horario. El acceso rápido «Hoy» usa la fecha de Bogotá.

### Control de cierre con los archivos originales

Al **31/12/2026**, con interés simple e inclusión de ambos extremos:

| Concepto  |               COP |
| --------- | ----------------: |
| Capital   | 24.696.186.274,28 |
| Intereses |  1.575.905.918,96 |
| Saldo     | 26.272.092.193,24 |

## Implementación y pruebas

React, TypeScript y Vite; gráficos SVG interactivos sin servicios de visualización externos.

- `src/lib/finance.ts`: lectura del formato colombiano, validación de fechas, cruce de vigencias y liquidación diaria.
- `src/lib/format.ts`, `src/lib/interactiveReport.ts`: presentación y exportaciones.
- `src/components/`: panel, calendario, gráficos, tablas, diálogos y reporte imprimible.
- `src/reports/interactive.html`: plantilla autocontenida para reportes HTML portables.
- `src/data/`: archivos de origen, incluidos sin alteraciones.

```sh
npm test
npm run build
```

Las pruebas contrastan los resultados diarios con una suma independiente por intervalos, comprueban los cambios de tasa, los cortes antes del ingreso, la capitalización, los huecos de cobertura y el límite de fecha.
