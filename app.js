import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { Sequelize, DataTypes } from 'sequelize';
import dotenv from 'dotenv';
import cors from 'cors';

// Cargar variables de entorno
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(cors());

// Configuración de la base de datos
const sequelize = new Sequelize(
  process.env.DB_NAME || 'mapa_ambiental',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: false,
    pool: { max: 5, min: 0, acquire: 30000, idle: 10000 }
  }
);

// Definir el modelo Report
const Report = sequelize.define('Report', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  title: { type: DataTypes.STRING(100), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  latitude: { type: DataTypes.FLOAT, allowNull: false },
  longitude: { type: DataTypes.FLOAT, allowNull: false },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  status: { type: DataTypes.STRING(20), defaultValue: 'pendiente' },
  category: { type: DataTypes.STRING(50) },
  user_email: { type: DataTypes.STRING(120) }
}, {
  tableName: 'reports',
  timestamps: false
});

// Sincronizar el modelo con la base de datos
sequelize.sync();

// Servir index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'index.html'));
});

// Ruta para enviar un reporte
app.post('/submit_report', async (req, res) => {
  try {
    const data = req.body;
    const newReport = await Report.create({
      title: data.title,
      description: data.description,
      latitude: data.latitude,
      longitude: data.longitude,
      category: data.category || 'general',
      user_email: data.user_email
    });
    res.json({ message: 'Reporte enviado exitosamente', id: newReport.id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Ruta para obtener reportes
app.get('/get_reports', async (req, res) => {
  try {
    const reports = await Report.findAll({ order: [['created_at', 'DESC']] });
    res.json(reports.map(r => ({
      id: r.id,
      title: r.title,
      description: r.description,
      latitude: r.latitude,
      longitude: r.longitude,
      created_at: r.created_at,
      status: r.status,
      category: r.category
    })));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Ruta para actualizar un reporte
app.put('/update_report/:report_id', async (req, res) => {
  try {
    const report = await Report.findByPk(req.params.report_id);
    if (!report) return res.status(404).json({ error: 'Reporte no encontrado' });
    const data = req.body;
    if (data.status) report.status = data.status;
    if (data.category) report.category = data.category;
    await report.save();
    res.json({ message: 'Reporte actualizado exitosamente' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
}); 