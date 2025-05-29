const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Crear o conectar a la base de datos
const dbPath = path.join(__dirname, 'videoentrevistas.db');
const db = new sqlite3.Database(dbPath);

// Crear tablas si no existen
db.serialize(() => {
  // Tabla para entrevistas
  db.run(`CREATE TABLE IF NOT EXISTS entrevistas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    candidato_nombre TEXT,
    candidato_email TEXT,
    fecha_inicio DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_completada DATETIME,
    estado TEXT DEFAULT 'en_progreso'
  )`);

  // Tabla para respuestas individuales
  db.run(`CREATE TABLE IF NOT EXISTS respuestas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entrevista_id INTEGER,
    pregunta_numero INTEGER,
    pregunta_texto TEXT,
    archivo_video TEXT,
    transcripcion TEXT,
    fecha_grabacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (entrevista_id) REFERENCES entrevistas (id)
  )`);
});

console.log('✅ Base de datos SQLite creada correctamente');

module.exports = db;