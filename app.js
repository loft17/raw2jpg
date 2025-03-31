require('dotenv').config();
const express = require('express');
const session = require('express-session');
const multer = require('multer');
const sharp = require('sharp');
const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const port = 3000;
const DEBUG_MODE = process.argv.includes('-d') || process.argv.includes('--debug');

// ========= Configuración desde .env ==========
const MAX_DIMENSION = parseInt(process.env.MAX_DIMENSION);
const MAX_LOGIN_ATTEMPTS = parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5');
const parseList = str => str.split(',').map(s => s.trim().toLowerCase());
const ALLOWED_RAW_FORMATS = parseList(process.env.ALLOWED_RAW_FORMATS || '');
const ALLOWED_IMAGE_FORMATS = parseList(process.env.ALLOWED_IMAGE_FORMATS || '');
const LOG_LEVEL = (process.env.LOG_LEVEL || 'none').toLowerCase();
const credentials = { user: process.env.USERNAME, pass: process.env.PASSWORD };

// ========= trust proxy ==========
const trustProxy = process.env.TRUST_PROXY;
if (trustProxy === 'true') {
  app.set('trust proxy', true);
} else if (!isNaN(parseInt(trustProxy))) {
  app.set('trust proxy', parseInt(trustProxy));
}

// ========= Seguridad ==========
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      objectSrc: ["'none'"]
    }
  }
}));

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
}));

const levels = { none: 0, error: 1, info: 2, debug: 3 };
const logLevel = levels[LOG_LEVEL] ?? 0;

let logStream;
if (logLevel > 0) {
  const logDir = path.join(__dirname, 'logs');
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);
  logStream = fs.createWriteStream(path.join(logDir, 'app.log'), { flags: 'a' });
}

function log(level, message) {
  const currentLevel = levels[level];
  if (currentLevel <= logLevel) {
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    if (logStream) logStream.write(line + '\n');
    if (DEBUG_MODE || logLevel === 3) console.log(line);
  }
}

const getClientIP = (req) => req.headers['x-forwarded-for'] || req.connection.remoteAddress;

// ========= Middleware ==========
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 30 * 60 * 1000 }
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const requireLogin = (req, res, next) => {
  if (req.session.loggedIn) return next();
  return res.redirect('/login');
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }
});

// ========= Límite para intentos de login ==========
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: MAX_LOGIN_ATTEMPTS,
  message: 'Demasiados intentos de inicio de sesión. Intenta de nuevo más tarde.',
  keyGenerator: (req) => getClientIP(req)
});

// ========= Rutas ==========
app.get('/login', (req, res) => {
  const ip = getClientIP(req);
  log('info', `Acceso a /login desde IP=${ip}`);
  res.sendFile(path.join(__dirname, 'views/login.html'));
});

app.post('/login', loginLimiter, (req, res) => {
  const ip = getClientIP(req);
  const { username, password } = req.body;

  if (username === credentials.user && password === credentials.pass) {
    req.session.loggedIn = true;
    log('info', `Login exitoso: user=${username} IP=${ip}`);
    res.redirect('/');
  } else {
    log('error', `Login fallido: user=${username} IP=${ip}`);
    res.send('<h2>Credenciales inválidas. <a href="/login">Volver</a></h2>');
  }
});

app.get('/logout', (req, res) => {
  const ip = getClientIP(req);
  log('info', `Logout: IP=${ip}`);
  req.session.destroy(() => res.redirect('/login'));
});

app.get('/', requireLogin, (req, res) => {
  const ip = getClientIP(req);
  log('info', `Acceso a / (inicio) IP=${ip}`);
  res.sendFile(path.join(__dirname, 'views/index.html'));
});

app.post('/upload', requireLogin, upload.single('image'), async (req, res) => {
  const ip = getClientIP(req);
  if (!req.file) {
    log('error', `Subida fallida (sin archivo) IP=${ip}`);
    return res.status(400).send('No se ha subido ningún archivo.');
  }

  const ext = path.extname(req.file.originalname).toLowerCase();
  const originalName = path.basename(req.file.originalname);
  const now = new Date();
  const filename = `joseromera_${now.toISOString().slice(0, 10)}_${now.getHours().toString().padStart(2, '0')}-${now.getMinutes().toString().padStart(2, '0')}.jpg`;

  res.set('Content-Disposition', `attachment; filename="${filename}"`);

  log('info', `Archivo subido: ${originalName} IP=${ip}`);

  const processAndSend = async (inputBuffer) => {
    try {
      const data = await sharp(inputBuffer)
        .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: 'inside' })
        .jpeg()
        .toBuffer();

      res.set('Content-Type', 'image/jpeg');
      res.send(data);
      log('info', `Imagen descargada correctamente: ${filename} IP=${ip}`);
    } catch (err) {
      log('error', `Error al convertir ${originalName}: ${err.message}`);
      res.status(500).send('Error al convertir la imagen.');
    }
  };

  if (ALLOWED_RAW_FORMATS.includes(ext)) {
    const tempPath = `./uploads/${Date.now()}-${originalName}`;
    const tiffPath = tempPath.replace(/\.[^.]+$/, '.tiff');

    try {
      fs.writeFileSync(tempPath, req.file.buffer);
      await new Promise((resolve, reject) => {
        // execFile('dcraw', ['-T', tempPath], (err) => {
          execFile('dcraw', ['-T', '-b', '1.5', '-H', '1', tempPath], (err) => {

          if (err) reject(err);
          else resolve();
        });
      });

      const tiffBuffer = fs.readFileSync(tiffPath);
      await processAndSend(tiffBuffer);
    } catch (err) {
      log('error', `Error al procesar RAW ${originalName}: ${err.message}`);
      res.status(500).send('Error al procesar la imagen RAW.');
    } finally {
      [tempPath, tiffPath].forEach(file => {
        if (fs.existsSync(file)) fs.unlinkSync(file);
      });
    }

  } else if (ALLOWED_IMAGE_FORMATS.includes(ext)) {
    await processAndSend(req.file.buffer);
  } else {
    log('error', `Formato no soportado: ${originalName} IP=${ip}`);
    return res.status(400).send('Tipo de archivo no soportado.');
  }
});

// ========= Iniciar servidor ==========
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

