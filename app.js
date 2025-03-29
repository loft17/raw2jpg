const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const auth = require('basic-auth');

const authConfigPath = path.resolve(__dirname, '../config/auth.json');
let authData = { user: 'admin', pass: '1234' };
if (fs.existsSync(authConfigPath)) {
  try {
    authData = JSON.parse(fs.readFileSync(authConfigPath));
  } catch (e) {
    console.error('Error leyendo auth.json:', e);
  }
}

const requireAuth = (req, res, next) => {
  const user = auth(req);
  if (!user || user.name !== authData.user || user.pass !== authData.pass) {
    res.set('WWW-Authenticate', 'Basic realm="Imagen RAW"');
    return res.status(401).send('Autenticación requerida.');
  }
  next();
};

const app = express();
const port = 3000;
const MAX_DIMENSION = process.env.MAX_DIMENSION || 2048;
const DEBUG_MODE = process.argv.includes('-d') || process.argv.includes('--debug');

const ALLOWED_RAW_FORMATS = ['.arw', '.nef', '.dng', '.cr2'];
const ALLOWED_IMAGE_FORMATS = ['.jpg', '.jpeg', '.png'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB
});

function logRequest(req, action) {
  const now = new Date().toISOString();
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
  const userAgent = req.headers['user-agent'] || 'Unknown';
  const logLine = `[${now}] [${action}] IP: ${ip} - User Agent: ${userAgent}\n`;

  if (DEBUG_MODE) console.log(logLine.trim());

  fs.appendFile('access.log', logLine, (err) => {
    if (err && DEBUG_MODE) {
      console.error('Error al escribir el log:', err);
    }
  });
}

app.use(requireAuth);

app.get('/', (req, res) => {
  if (DEBUG_MODE) console.log('GET / recibido');
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    logRequest(req, 'No file provided');
    return res.status(400).send('No se ha subido ningún archivo.');
  }

  const ext = path.extname(req.file.originalname).toLowerCase();
  if (DEBUG_MODE) console.log(`Archivo recibido: ${req.file.originalname} (${ext})`);

  const now = new Date();
  const formattedName = `joseromera_${now.toISOString().slice(0,10)}_${now.getHours().toString().padStart(2, '0')}-${now.getMinutes().toString().padStart(2, '0')}.jpg`;
  res.set('Content-Disposition', `attachment; filename="${formattedName}"`);

  if (ALLOWED_RAW_FORMATS.includes(ext)) {
    const tempFilePath = `./uploads/${Date.now()}-${req.file.originalname}`;
    fs.writeFileSync(tempFilePath, req.file.buffer);
    const tiffFilePath = tempFilePath.replace(/\.[^.]+$/, '.tiff');

    if (DEBUG_MODE) console.log(`Procesando RAW con dcraw: ${tempFilePath}`);

    execFile('dcraw', ['-T', tempFilePath], (err) => {
      if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);

      if (err) {
        if (fs.existsSync(tiffFilePath)) fs.unlinkSync(tiffFilePath);
        logRequest(req, 'Error procesando RAW');
        if (DEBUG_MODE) console.error('dcraw error:', err);
        return res.status(500).send('Error al procesar la imagen RAW.');
      }

      fs.readFile(tiffFilePath, (err, data) => {
        if (fs.existsSync(tiffFilePath)) fs.unlinkSync(tiffFilePath);

        if (err) {
          logRequest(req, 'Error leyendo TIFF');
          if (DEBUG_MODE) console.error('Error leyendo TIFF:', err);
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
            if (DEBUG_MODE) console.error('Error al convertir imagen:', err);
            res.status(500).send('Error al convertir la imagen.');
          });
      });
    });

  } else if (ALLOWED_IMAGE_FORMATS.includes(ext)) {
    if (DEBUG_MODE) console.log('Procesando imagen JPEG/PNG...');
    sharp(req.file.buffer)
      .resize({
        width: parseInt(MAX_DIMENSION),
        height: parseInt(MAX_DIMENSION),
        fit: 'inside'
      })
      .jpeg()
      .toBuffer()
      .then(data => {
        logRequest(req, 'Imagen procesada y descargada');
        res.set('Content-Type', 'image/jpeg');
        res.send(data);
      })
      .catch(err => {
        logRequest(req, 'Error procesando imagen');
        if (DEBUG_MODE) console.error('Error procesando imagen:', err);
        res.status(500).send('Error al procesar la imagen.');
      });
  } else {
    logRequest(req, 'Tipo de archivo no soportado');
    if (DEBUG_MODE) console.log(`Extensión no soportada: ${ext}`);
    res.status(400).send('Tipo de archivo no soportado.');
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor corriendo en http://0.0.0.0:${port}`);
  if (DEBUG_MODE) {
    const interfaces = os.networkInterfaces();
    console.log('Direcciones IP disponibles en la red local:');
    Object.values(interfaces).flat().forEach((iface) => {
      if (iface.family === 'IPv4' && !iface.internal) {
        console.log(`→ http://${iface.address}:${port}`);
      }
    });
  }
});
