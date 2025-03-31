# RAW2JPG Converter

Este proyecto es una aplicación web creada con **Node.js + Express** que permite a usuarios autenticados subir imágenes RAW o estándar y convertirlas automáticamente a formato JPG. La conversión se realiza usando `sharp` para imágenes comunes y `dcraw` para archivos RAW.

## 🚀 Características
- 🖼️ Soporte para archivos RAW y formatos comunes (.jpg, .png)
- ⚙️ Conversión rápida a JPEG con sharp para imágenes comunes y dcraw para RAW
- 🛡️ Autenticación con sesiones para proteger las operaciones
- 📥 Subida y descarga de imágenes desde el navegador
- 📈 Registro de actividades (subidas, descargas, login, logout)
- 🧱 Protección contra abusos con limitación de tasa (rate-limit)
- 🧠 Configuración flexible mediante archivo .env
- 🌐 Compatibilidad con dispositivos móviles y adaptable como PWA
- 🔐 Seguridad mejorada con cabeceras proporcionadas por helmet



## ✅ Requisitos
- Node.js >= 18
- Linux/macOS para usar dcraw (en Windows, necesitarás un entorno compatible o WSL)
- `dcraw` instalado en el sistema (`apt install dcraw`)
- Navegador moderno



## 📦 Instalación
1. Clona el repositorio:
```bash
git clone https://github.com/tuusuario/raw2jpg.git
```

2. Entra al directorio del proyecto:
```bash
cd raw2jpg
```

3. Instala las dependencias:
```bash
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


