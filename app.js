const express = require('express');
const session = require('express-session');
const multer = require('multer');
const sharp = require('sharp');
const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const app = express();
const port = 3000;
const DEBUG_MODE = process.argv.includes('-d') || process.argv.includes('--debug');

// Cargar credenciales desde config/auth.json
const authPath = path.resolve(__dirname, './config/auth.json');
let credentials = { user: 'admin', pass: '1234' };
if (fs.existsSync(authPath)) {
  credentials = JSON.parse(fs.readFileSync(authPath));
}

// Configurar sesiones
app.use(session({
  secret: 'superSecretSessionKey123!',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 30 * 60 * 1000 } // 30 minutos
}));

// Middleware para leer formularios
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (CSS, imágenes, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para proteger rutas
const requireLogin = (req, res, next) => {
  if (req.session.loggedIn) return next();
  return res.redirect('/login');
};

// Configuración de formatos y subida
const ALLOWED_RAW_FORMATS = ['.arw', '.nef', '.dng', '.cr2'];
const ALLOWED_IMAGE_FORMATS = ['.jpg', '.jpeg', '.png'];
const MAX_DIMENSION = parseInt(process.env.MAX_DIMENSION || '2048');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB
});

// Página de login
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

// Procesar login
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === credentials.user && password === credentials.pass) {
    req.session.loggedIn = true;
    res.redirect('/');
  } else {
    res.send('<h2>Credenciales inválidas. <a href="/login">Volver</a></h2>');
  }
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

// Página principal protegida
app.get('/', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Subida de imagen
app.post('/upload', requireLogin, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).send('No se ha subido ningún archivo.');

  const ext = path.extname(req.file.originalname).toLowerCase();
  const now = new Date();
  const filename = `joseromera_${now.toISOString().slice(0,10)}_${now.getHours().toString().padStart(2, '0')}-${now.getMinutes().toString().padStart(2, '0')}.jpg`;

  res.set('Content-Disposition', `attachment; filename="${filename}"`);

  const processAndSend = (inputBuffer) => {
    sharp(inputBuffer)
      .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: 'inside' })
      .jpeg()
      .toBuffer()
      .then(data => {
        res.set('Content-Type', 'image/jpeg');
        res.send(data);
      })
      .catch(err => {
        if (DEBUG_MODE) console.error('Error al convertir imagen:', err);
        res.status(500).send('Error al convertir la imagen.');
      });
  };

  if (ALLOWED_RAW_FORMATS.includes(ext)) {
    const tempPath = `./uploads/${Date.now()}-${req.file.originalname}`;
    fs.writeFileSync(tempPath, req.file.buffer);
    const tiffPath = tempPath.replace(/\.[^.]+$/, '.tiff');

    if (DEBUG_MODE) console.log(`Procesando RAW con dcraw: ${tempPath}`);

    execFile('dcraw', ['-T', tempPath], (err) => {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      if (err) {
        if (fs.existsSync(tiffPath)) fs.unlinkSync(tiffPath);
        return res.status(500).send('Error al procesar la imagen RAW.');
      }

      fs.readFile(tiffPath, (err, data) => {
        if (fs.existsSync(tiffPath)) fs.unlinkSync(tiffPath);
        if (err) return res.status(500).send('Error al leer la imagen TIFF.');
        processAndSend(data);
      });
    });

  } else if (ALLOWED_IMAGE_FORMATS.includes(ext)) {
    processAndSend(req.file.buffer);
  } else {
    return res.status(400).send('Tipo de archivo no soportado.');
  }
});

// Iniciar servidor
app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor corriendo en http://0.0.0.0:${port}`);
  if (DEBUG_MODE) {
    const interfaces = os.networkInterfaces();
    Object.values(interfaces).flat().forEach(iface => {
      if (iface.family === 'IPv4' && !iface.internal) {
        console.log(`→ http://${iface.address}:${port}`);
      }
    });
  }
});
