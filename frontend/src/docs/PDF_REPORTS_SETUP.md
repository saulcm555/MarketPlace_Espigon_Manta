# Instrucciones para Habilitar Reportes PDF

## 📦 Instalación de Dependencias

Para que la funcionalidad de reportes PDF funcione correctamente, necesitas instalar las siguientes librerías:

```bash
cd frontend
npm install jspdf jspdf-autotable
npm install --save-dev @types/jspdf-autotable
```

## ✅ Funcionalidades Implementadas

### 1. **Reporte de Ventas por Categoría (PDF)**
- **Ubicación:** Panel Admin → Reportes → Tab "Ventas por Categoría"
- **Botón:** "Ver PDF" (esquina superior derecha)
- **Contenido del PDF:**
  - Header con logo y título
  - Período de análisis
  - Resumen general (Total ventas, órdenes, productos, promedio)
  - Tabla detallada por categoría con:
    - Número de categoría
    - Nombre de la categoría
    - Ventas totales
    - Número de órdenes
    - Productos activos
    - Promedio por orden
  - Footer con numeración de páginas

### 2. **Reporte de Inventario (PDF)**
- **Ubicación:** Panel Admin → Reportes → Tab "Inventario"
- **Botón:** "Ver PDF" (esquina superior derecha)
- **Contenido del PDF:**
  - Header con logo y título
  - Resumen visual con colores:
    - Total Productos (verde)
    - Sin Stock (rojo)
    - Stock Bajo (amarillo)
  - Tabla de productos críticos (si existen):
    - Nombre del producto
    - Vendedor
    - Stock actual
    - Stock mínimo
    - Estado (Crítico/Advertencia/OK)
  - Footer con numeración de páginas

## 🎨 Características de los PDFs

✅ **Se abren en nueva pestaña del navegador** (sin descargar automáticamente)
✅ **Diseño profesional** con colores corporativos
✅ **Tablas formateadas** con alternancia de colores
✅ **Headers y footers** en todas las páginas
✅ **Fecha de generación** automática
✅ **Responsive** - se adapta al contenido

## 🔧 Uso

1. Ve al panel de administrador
2. Navega a "Reportes y Análisis"
3. Selecciona el tab deseado (Ventas o Inventario)
4. Haz clic en el botón "Ver PDF"
5. El PDF se abrirá en una nueva pestaña del navegador
6. Desde ahí puedes:
   - Ver el PDF directamente
   - Imprimirlo
   - Descargarlo si lo deseas

## 📊 Vista Previa

### PDF de Ventas:
```
┌────────────────────────────────────────────┐
│  Reporte de Ventas por Categoría          │
│  Período: 2025-01-01 - 2025-01-31         │
│  Fecha: 13 de noviembre de 2025           │
├────────────────────────────────────────────┤
│  Resumen General:                          │
│  Total Ventas: $12,450.50                 │
│  Total Órdenes: 156                        │
│  Productos Activos: 48                     │
│  Promedio por Orden: $79.81               │
├────────────────────────────────────────────┤
│  [Tabla con todas las categorías]         │
│  # │ Categoría │ Ventas │ Órdenes │ ...   │
│  1 │ Electrón. │ $5,200 │   45    │ ...   │
│  2 │ Ropa      │ $3,800 │   67    │ ...   │
│  ...                                       │
└────────────────────────────────────────────┘
```

### PDF de Inventario:
```
┌────────────────────────────────────────────┐
│  Reporte de Inventario                     │
│  Fecha: 13 de noviembre de 2025           │
├────────────────────────────────────────────┤
│  ┌──────┐  ┌──────┐  ┌──────┐            │
│  │  150 │  │   5  │  │  12  │            │
│  │Total │  │ Sin  │  │Stock │            │
│  │Prods.│  │Stock │  │ Bajo │            │
│  └──────┘  └──────┘  └──────┘            │
├────────────────────────────────────────────┤
│  ⚠ Productos Críticos                     │
│  [Tabla con productos de stock bajo]      │
│  # │ Producto │ Vendedor │ Stock │ ...   │
│  1 │ Laptop X │ Juan Péz.│   3   │ ...   │
│  ...                                       │
└────────────────────────────────────────────┘
```

## 🎯 Ventajas

1. **No requiere descarga:** El PDF se visualiza directamente en el navegador
2. **Fácil de compartir:** Puedes copiar el link de la pestaña
3. **Impresión directa:** Botón de imprimir del navegador
4. **Formato profesional:** Listo para presentaciones
5. **Datos actualizados:** Se generan con los datos actuales de GraphQL

## 🔄 Flujo de Trabajo

```
Usuario → Click "Ver PDF" 
    ↓
Fetch datos de GraphQL
    ↓
Generar PDF con jsPDF
    ↓
Crear Blob URL
    ↓
Abrir en nueva pestaña (window.open)
    ↓
Usuario ve/imprime/descarga PDF
```

## 🐛 Troubleshooting

Si el botón "Ver PDF" no funciona:
1. Verifica que las dependencias estén instaladas: `npm list jspdf jspdf-autotable`
2. Reinicia el servidor de desarrollo: `npm run dev`
3. Limpia la caché del navegador
4. Verifica que tu navegador permita pop-ups

## 📝 Notas

- Los PDFs se generan del lado del cliente (frontend)
- No se almacenan en el servidor
- Los datos son temporales y se generan en tiempo real
- El botón se deshabilita si no hay datos disponibles
