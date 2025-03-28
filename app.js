const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuración del servidor
const app = express();
const port = 3000;

// Variable para el tamaño máximo de la imagen (puedes modificarla o asignarla mediante una variable de entorno)
const MAX_DIMENSION = process.env.MAX_DIMENSION || 2048;

// Definir los formatos permitidos
const ALLOWED_RAW_FORMATS = ['.arw']; // Puedes añadir otros formatos RAW, ej: '.cr2', '.nef', '.dng'
const ALLOWED_JPEG_FORMATS = ['.jpg', '.jpeg'];

// Configuramos Multer para trabajar con archivos en memoria
const upload = multer({ storage: multer.memoryStorage() });

// Función para registrar eventos en un fichero de log
function logRequest(req, action) {
  const now = new Date().toISOString();
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
  const userAgent = req.headers['user-agent'] || 'Unknown';
  const logLine = `[${now}] [${action}] IP: ${ip} - User Agent: ${userAgent}\n`;
  fs.appendFile('access.log', logLine, (err) => {
    if (err) {
      console.error('Error al escribir el log:', err);
    }
  });
}

// Ruta GET para la página principal (envía el archivo index.html)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Ruta POST para subir y procesar la imagen
app.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    logRequest(req, 'No file provided');
    return res.status(400).send('No se ha subido ningún archivo.');
  }

  // Determinar la extensión del archivo
  const ext = path.extname(req.file.originalname).toLowerCase();

  if (ALLOWED_RAW_FORMATS.includes(ext)) {
    // Procesamiento de archivos RAW usando dcraw -T para generar un TIFF
    const tempFilePath = `./uploads/${Date.now()}-${req.file.originalname}`;
    fs.writeFileSync(tempFilePath, req.file.buffer);

    // Generamos el nombre del archivo TIFF que dcraw creará (mismo nombre, extensión .tiff)
    const tiffFilePath = tempFilePath.replace(/\.[^.]+$/, '.tiff');

    // Ejecutamos dcraw con la opción -T para generar un TIFF
    execFile('dcraw', ['-T', tempFilePath], (err, stdout, stderr) => {
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }

      if (err) {
        if (fs.existsSync(tiffFilePath)) {
          fs.unlinkSync(tiffFilePath);
        }
        logRequest(req, 'Error procesando RAW');
        console.error('Error al procesar la imagen RAW:', err);
        return res.status(500).send('Error al procesar la imagen RAW.');
      }

      fs.readFile(tiffFilePath, (err, data) => {
        if (fs.existsSync(tiffFilePath)) {
          fs.unlinkSync(tiffFilePath);
        }

        if (err) {
          logRequest(req, 'Error leyendo TIFF');
          console.error('Error al leer la imagen TIFF:', err);
          return res.status(500).send('Error al leer la imagen TIFF.');
        }

        sharp(data)
          .resize({
            width: parseInt(MAX_DIMENSION),
            height: parseInt(MAX_DIMENSION),
            fit: 'inside'
          })
          .jpeg()
          .toBuffer()
          .then(data => {
            logRequest(req, 'Imagen RAW procesada y descargada');
            res.set('Content-Type', 'image/jpeg');
            res.send(data);
          })
          .catch(err => {
            logRequest(req, 'Error convirtiendo imagen RAW');
            console.error('Error al convertir la imagen:', err);
            res.status(500).send('Error al convertir la imagen.');
          });
      });
    });
  } else if (ALLOWED_JPEG_FORMATS.includes(ext)) {
    // Procesamiento de archivos JPEG
    sharp(req.file.buffer)
      .resize({
        width: parseInt(MAX_DIMENSION),
        height: parseInt(MAX_DIMENSION),
        fit: 'inside'
      })
      .jpeg()
      .toBuffer()
      .then(data => {
        logRequest(req, 'Imagen JPEG procesada y descargada');
        res.set('Content-Type', 'image/jpeg');
        res.send(data);
      })
      .catch(err => {
        logRequest(req, 'Error procesando JPEG');
        console.error('Error al procesar la imagen JPEG:', err);
        res.status(500).send('Error al procesar la imagen JPEG.');
      });
  } else {
    logRequest(req, 'Tipo de archivo no soportado');
    res.status(400).send('Tipo de archivo no soportado.');
  }
});

app.listen(port, () => {
  console.log(`Servidor corriendo en el puerto ${port}`);
});
