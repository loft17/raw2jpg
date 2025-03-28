Instalación
Clona el repositorio:

bash
Copiar
git clone https://github.com/tu_usuario/tu_repositorio.git
cd tu_repositorio
Instala las dependencias:

bash
Copiar
npm install
Crea la carpeta para archivos temporales:

bash
Copiar
mkdir uploads
Configuración
Tamaño máximo de imagen:
Puedes cambiar el tamaño máximo modificando la variable de entorno MAX_DIMENSION. Por defecto es 2048:

bash
Copiar
export MAX_DIMENSION=2048
Archivo de Log:
Las solicitudes se registran en el fichero access.log, ubicado en el mismo directorio del proyecto.

Ejecución
Inicia el servidor con:

bash
Copiar
node app.js
La aplicación se ejecutará en el puerto 3000. Puedes acceder a ella en http://localhost:3000 o mediante tu dominio/IP configurado con Nginx.

Uso
Accede a la aplicación desde tu navegador.

Sube una imagen arrastrándola al área de drop o haciendo clic para seleccionar un archivo.

Se mostrará una barra de progreso durante la subida.

Una vez procesada, la imagen convertida a JPEG se mostrará en pantalla.

Configuración de Nginx
Para usar Nginx como proxy inverso, crea un fichero de configuración (por ejemplo, /etc/nginx/sites-available/mi_proyecto) con el siguiente contenido:

nginx
Copiar
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
Activa la configuración creando un enlace simbólico en /etc/nginx/sites-enabled/:

bash
Copiar
sudo ln -s /etc/nginx/sites-available/mi_proyecto /etc/nginx/sites-enabled/
Verifica la configuración con:

bash
Copiar
sudo nginx -t
Y recarga Nginx:

bash
Copiar
sudo systemctl reload nginx
Registro (Logging)
Cada solicitud se registra en access.log con la siguiente información:

Fecha y hora (ISO).

IP del cliente (considerando cabeceras como x-forwarded-for).

User-Agent (como aproximación al dispositivo).

Contribuciones
Las contribuciones son bienvenidas. Si tienes alguna mejora o encuentras errores, por favor abre un issue o envía un pull request.

Licencia
Este proyecto se distribuye bajo la Licencia MIT.
