# RAW2JPG Converter

Este proyecto es una aplicación web creada con **Node.js + Express** que permite a usuarios autenticados subir imágenes RAW o estándar y convertirlas automáticamente a formato JPG. La conversión se realiza usando `sharp` para imágenes comunes y `dcraw` para archivos RAW.

## 🚀 Características

- 🖼️ Soporta archivos RAW y formatos comunes (.jpg, .png)
- ⚙️ Conversión rápida a JPEG con `sharp` y `dcraw`
- 🛡️ Protección por login con sesiones
- 📥 Subida y descarga de imágenes desde el navegador
- 📈 Logging de acciones (subidas, descargas, login, logout)
- 🧱 Protección contra abusos con rate-limit
- 🧠 Configuración por variables `.env`
- 🌐 Compatible con móvil, y adaptable como PWA
- 🔐 Cabeceras de seguridad con `helmet`

--

## ✅ Requisitos

- Node.js >= 18
- Linux/macOS (para `dcraw`)
- `dcraw` instalado en el sistema (`apt install dcraw`)
- Navegador moderno

## 📦 Instalación
```bash
git clone https://github.com/tuusuario/raw2jpg.git
cd raw2jpg
npm install
```

## ⚙️ Configuracion
### Variables de entorno (.env)
Copia el ejemplo y edítalo:
```bash
cp .env.example .env
```

## 🖥️ Uso
```bash
node app.js
```

Por defecto, el servidor se inicia en:
```web
http://localhost:3000
```

Para usar en otra red (ej. móvil), accede desde la IP local que aparece al arrancar.

## 🧠 Autor
José Romera
Contacto: [tuemail@ejemplo.com]
Web: convert.joseromera.net

## 📄 Licencia
MIT © 2025 - José Romera


