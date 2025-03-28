# Conversor de Imágenes RAW y JPEG

Este proyecto es una aplicación web en Node.js que permite subir imágenes en formato RAW (.arw) o JPEG (.jpg/.jpeg) y procesarlas para convertirlas a JPEG con un tamaño máximo configurable (por defecto 2048px). Para imágenes RAW, se utiliza `dcraw` para convertir el archivo a TIFF, que luego se procesa con [Sharp](https://github.com/lovell/sharp) para redimensionar y convertir a JPEG. Además, la aplicación registra en un fichero de log (access.log) cada evento de subida/procesado/descarga, incluyendo fecha, hora, IP y el user-agent del dispositivo.


## Características

- **Conversión de imágenes RAW (.arw):** Utiliza `dcraw` para generar un TIFF y luego [Sharp](https://github.com/lovell/sharp) para convertir y redimensionar.
- **Reducción de imágenes JPEG:** Redimensiona imágenes JPEG a un tamaño máximo configurable.
- **Interfaz web moderna y minimalista:** Optimizada para dispositivos móviles, con área de arrastre (drag & drop) y barra de progreso.
- **Registro de eventos:** Se genera un fichero `access.log` con fecha, hora, IP y user-agent de cada petición.
- **Integración con Nginx:** Se incluye un ejemplo de configuración para usar Nginx como proxy inverso.


## Prerrequisitos

- **Node.js** (recomendado >= 14.x)
- **NPM** (incluido con Node.js)
- **dcraw:**  
    En sistemas basados en Debian/Ubuntu:
```bash
sudo apt-get install dcraw
```
- **Nginx** (opcional, para proxy inverso)


## Instalación

1. Clona el repositorio:
```bash
git clone https://github.com/loft17/raw2jpg.git
cd raw2jpg
```

2. Instala las dependencias:
```bash
npm install
```

3. Crea la carpeta para archivos temporales:
```bash
mkdir uploads
```



## Configuración
-  **Tamaño máximo de imagen:**  
    Puedes cambiar el tamaño máximo modificando la variable de entorno `MAX_DIMENSION`. Por defecto es 2048:
```bash
export MAX_DIMENSION=2048
```

- **Archivo de Log:**  
    Las solicitudes se registran en el fichero `access.log`, ubicado en el mismo directorio del proyecto.



## Ejecución
Inicia el servidor con:
```bash
node app.js
```
La aplicación se ejecutará en el puerto `3000`. Puedes acceder a ella en `http://localhost:3000` o mediante tu dominio/IP configurado con Nginx.


## Uso
1. Accede a la aplicación desde tu navegador.
2. Sube una imagen arrastrándola al área de drop o haciendo clic para seleccionar un archivo.
3. Se mostrará una barra de progreso durante la subida.
4. Una vez procesada, la imagen convertida a JPEG se mostrará en pantalla.


## Configuración de Nginx

Para usar Nginx como proxy inverso, crea un fichero de configuración (por ejemplo, `/etc/nginx/sites-available/mi_proyecto`) con el siguiente contenido:
```nginx
server {
    listen 80;
    server_name ejemplo.com;  # Reemplaza con tu dominio o IP

    access_log /var/log/nginx/mi_proyecto_access.log;
    error_log /var/log/nginx/mi_proyecto_error.log;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Activa la configuración creando un enlace simbólico en `/etc/nginx/sites-enabled/`:
```bash
sudo ln -s /etc/nginx/sites-available/mi_proyecto /etc/nginx/sites-enabled/
```

Verifica la configuración con:
```bash
sudo nginx -t
```

Y recarga Nginx:
```bash
sudo systemctl reload nginx
```



## Registro (Logging)

Cada solicitud se registra en `access.log` con la siguiente información:
- Fecha y hora (ISO).
- IP del cliente (considerando cabeceras como `x-forwarded-for`).
- User-Agent (como aproximación al dispositivo).

## Contribuciones

Las contribuciones son bienvenidas. Si tienes alguna mejora o encuentras errores, por favor abre un _issue_ o envía un _pull request_.

## Licencia

Este proyecto se distribuye bajo la Licencia MIT.
