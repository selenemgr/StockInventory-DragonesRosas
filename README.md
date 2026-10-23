# 🐉 Dragones Rosas – Inventario

Web de inventario y registro para la banda. Todo lo que se hace queda guardado, se comparte en tiempo real entre los miembros y se puede consultar en el historial de cada sección.

**Stack:** React 18 + Vite + TypeScript, datos en [Supabase](https://supabase.com) (Postgres + realtime), desplegable en GitHub Pages.

---

## Puesta en marcha

### 1. Crear el proyecto en Supabase
1. Crea un proyecto gratis en [supabase.com](https://supabase.com).
2. Ve a **SQL Editor → New query**, pega **todo** el contenido de `supabase/schema.sql` y pulsa **Run**.
   - Crea las tablas, el acceso abierto (RLS con política `open`) y activa realtime.
   - Es **idempotente**: puedes volver a ejecutarlo entero cada vez que se actualice la web (añade las columnas y tablas nuevas sin borrar datos). Termina con `notify pgrst, 'reload schema'` para refrescar la caché de la API.
3. En **Project Settings → API** copia la *Project URL* y la *anon / publishable key*.

### 2. Ejecutar en local
Crea un archivo `.env` en la raíz del proyecto:

```
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key
```

```bash
npm install
npm run dev        # servidor de desarrollo
npm run build      # comprueba tipos (tsc) y genera dist/
npm run preview    # sirve el build localmente
```

Si falta el `.env`, la web muestra un aviso de que hay que configurar Supabase. El archivo `.env` está en `.gitignore` y no se sube al repositorio.

### 3. Desplegar en GitHub Pages
1. Sube el proyecto a un repo de GitHub (rama `main`).
2. **Settings → Secrets and variables → Actions**: crea `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
3. **Settings → Pages → Source: GitHub Actions**.
4. Cada push a `main` ejecuta `.github/workflows/deploy.yml` (instala, compila y publica `dist/`).

La web usa `HashRouter` y `base: './'`, así que funciona en cualquier subruta de GitHub Pages sin configuración extra.

### Actualizar la base de datos tras un cambio
Cuando una versión nueva añade campos o tablas, vuelve a ejecutar `supabase/schema.sql` en el SQL Editor. Si ves un error como *"Could not find the 'X' column … in the schema cache"*, es que falta ese paso (o refrescar la caché con `notify pgrst, 'reload schema';`).

---

## Cómo funciona

### Acceso (¿Quién eres?)
Pantalla de entrada con dos pestañas:
- **Seleccionar** (por defecto): lista de miembros con scroll; al pulsar uno entras como esa persona.
- **Añadir miembro**: crea un miembro nuevo y entra con él.

El "login" **no es seguridad**: solo sirve para atribuir cada acción a una persona. La sesión se recuerda en el navegador y se puede cambiar con el botón **Cambiar** de la cabecera.

### Secciones

| Sección | Qué hace |
|---|---|
| **💰 Finanzas** | Registra ingresos, retiros e inversiones (en dinero limpio o negro). Agrega automáticamente lo que generan otras secciones y calcula la caja de cada tipo de dinero. |
| **🌿 Drogas** | Tab *Drogas*: widgets de stock por droga, tabla de valores (stock, coste, precio, margen, emoji), ingreso/venta e historial. Tab *Semillas y hojas*: stock de materia prima con ingreso/consumo e historial. |
| **🔫 Armas** | Tab *Stock*: cantidad de cada arma, ingreso/retiro e historial. Tab *Fabricación*: piezas para fabricar armas, con ingreso/retiro. Tab *Ventas de armas*: valor de cada arma, compra/venta e historial. |
| **💎 Atracos** | Botín en dinero limpio, dinero negro o materiales; participantes (selector múltiple de miembros), armas usadas y nota. |
| **🏠 Casas** | Cantidad de casas robadas y botín conseguido (siempre dinero limpio). |
| **🤝 Tratos** | Tratos con otras bandas: nombre, color, nuestros beneficios y los suyos (editables). |
| **♻️ Materiales** | Ingresos y retiros de chatarra 🔩, plástico 🧴 y pólvora 💥, con stock y notas. |
| **🚔 Multas** | Multas por miembro con casilla *Pagada*. |
| **🎒 Inventario** | Objetos por miembro, con traspaso de cantidad entre miembros. |
| **📜 Logs** | Registro de la actividad de todos los usuarios. |

### Cómo se conectan las secciones con Finanzas
Finanzas no duplica datos: **calcula su historial a partir de las demás secciones**, así que borrar un registro en cualquier sitio se refleja al instante.

| Origen | Efecto en Finanzas |
|---|---|
| Ventas de droga | Suma a la caja del tipo de dinero elegido |
| Ventas de armas | Suma a la caja del tipo de dinero elegido |
| Atracos con botín en dinero | Suma a la caja limpia o negra según el tipo |
| Casas | Suma a la caja de dinero limpio |
| Multas marcadas como pagadas | **Resta** de la caja de dinero limpio |
| Ingreso | Suma | 
| Retiro / inversión | Resta |

No afectan a Finanzas: compras de armas, ingresos/retiros de stock, atracos con botín en materiales, semillas/hojas, piezas y materiales.

### Borrar un registro y sus efectos
Cada historial tiene un botón ✕ para eliminar un registro, y **revierte su efecto**:
- Borrar un ingreso de stock resta esas unidades; borrar una venta, retiro o consumo las devuelve (también el contador de "vendidas" en drogas).
- Desde el historial de Finanzas se puede borrar cualquier fila: se elimina el registro de su sección de origen y, si era una venta de droga o de arma, el stock vuelve.
- El stock de Materiales se calcula sumando los registros, así que se ajusta solo.

### Dinero limpio y dinero negro
Las ventas, los movimientos de Finanzas, las compras/ventas de armas y los atracos se marcan como 💵 limpio o 🖤 negro. Finanzas muestra una caja para cada uno.

### Logs
Cada alta, cambio, borrado, inicio y cierre de sesión se guarda con usuario, fecha, acción, sección y detalle. En la pestaña **Logs** puedes filtrar por usuario y por sección, y buscar texto. Solo se registra lo hecho desde la web.

### Otros detalles
- **Tiempo real:** los cambios de un miembro aparecen en los demás sin recargar.
- **Colores:** verde = entra / ingreso, rojo = sale / retiro, amarillo = inversión; cada fuente de ingresos tiene su propio color en Finanzas.
- **Moneda:** importes con el símbolo `$` y sin decimales (`$1,500`).
- **Notas con ⓘ:** donde hay notas opcionales, un icono **i** las muestra al pasar el mouse.

---

## Estructura del proyecto

```
src/
  App.tsx              cabecera, navegación y rutas
  main.tsx             HashRouter + SessionProvider
  context/Session.tsx  usuario actual, miembros y función de logs
  lib/
    supabase.ts        cliente de Supabase
    useTable.ts        hook genérico: carga, realtime, insert/update/remove con log
    format.ts          formato de dinero y fechas
    moneyType.ts       tipos de dinero (limpio / negro)
    sections.ts        nombres legibles de secciones para los logs
    types.ts           tipos de las tablas
  components/ui.tsx    Stat, Del, Empty, Info, MoneySelect, UserMultiSelect…
  pages/               una página por sección
supabase/schema.sql    tablas, políticas y realtime (idempotente)
.github/workflows/     despliegue a GitHub Pages
```

---

## ⚠️ Seguridad

- La *anon key* es pública por diseño y las políticas de la base de datos están **abiertas**: cualquiera con la URL de la web puede leer y escribir los datos.
- El "login" solo atribuye acciones; no restringe nada.
- **No pongas datos sensibles reales.**
