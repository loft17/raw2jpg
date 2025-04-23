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
**Variables de entorno (.env)**
Copia el archivo de ejemplo y personaliza según tus necesidades:
```bash
cp .env.example .env
```
Edita .env para configurar variables como el puerto del servidor, las credenciales de la base de datos (si las usas), o claves de API, si es necesario.



## 🖥️ Uso
Inicia el servidor:
```bash
node app.js
```

Por defecto, el servidor se ejecutará en:
```bash
http://localhost:3000
```



## 🧠 Autor
José Romera
Contacto: [tuemail@ejemplo.com]
Web: convert.joseromera.net



## 📄 Licencia
MIT © 2025 - José Romera


