# ERP Frontend — Web Application (Vue 3 + Vite + Tailwind CSS)

Interfaz web moderna, reactiva y elegante para el ERP multi-empresa. Desarrollada con **Vue 3 (Composition API)**, **Vite**, **Tailwind CSS**, **Pinia** y **Vue Router**.

---

## 🚀 Inicio Rápido en GitHub Codespaces / Local

### 1. Instalar dependencias
```bash
npm install
```

### 2. Iniciar servidor de desarrollo
```bash
npm run dev
```
El frontend estará disponible en `http://localhost:5173/`.

### 3. Compilar para producción
```bash
npm run build
```

---

## 🎨 Módulos y Pantallas Incluidas

* **Punto de Venta (POS):** Venta táctil rápida, caja física/virtual, arqueos, búsqueda con atajos de teclado y emisión de comprobantes.
* **Facturación Electrónica:** Emisión al SRI de facturas y notas de crédito, consulta de RIDE en PDF y XML autorizados.
* **Buzón SRI:** Sincronización automática de facturas recibidas (gastos/compras) y emitidas (ventas) desde el portal del SRI.
* **Inventario & Bodegas:** Catálogo de productos, control de stock por sucursal, kardex y traspasos entre bodegas.
* **Contabilidad:** Plan de cuentas jerárquico, Libro Diario, Libro Mayor con auxiliares, Balance General y Estado de Resultados (P&L).
* **Ventas & Cobranzas:** Directorio de clientes, cotizador/proformas y control de cuentas por cobrar con abonos.
* **Verticales Especializadas:** Módulo para Restaurantes (mesas/comandas), Clínica y Taller/Servicio Técnico.
* **Diseño UI/UX:** Componentes con Tailwind CSS, esqueletos de carga (*Skeleton Loaders*), estados vacíos ilustrados (*Empty States*) y notificaciones Toast.

---

## 🛠️ Stack Tecnológico
* **Vue 3** (Single File Components con `<script setup>`)
* **Vite** (Compilación y Hot Reload ultrarrápido)
* **Tailwind CSS** (Diseño moderno tipo SaaS empresarial)
* **Pinia** (Gestión de estado global para auth y tenant)
* **Vue Router** (Rutas protegidas con guardias de sesión)
* **Axios & Vue-Toastification** (Consumo de API y notificaciones)
* **Chart.js** (Gráficos ejecutivos y dashboards)
