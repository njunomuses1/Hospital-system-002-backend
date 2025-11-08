import { Sequelize, DataTypes } from 'sequelize'
import dotenv from 'dotenv'

// Ensure .env is loaded when this module initializes. server.js also calls
// dotenv.config(), but ES module imports are hoisted which can cause this
// module to run before server.js executes dotenv. Loading here guarantees
// environment variables are available for DB selection logic.
// Load .env and override any existing env vars so the local `.env` values
// always take precedence during development. This ensures the DATABASE_URL
// from `backend/.env` is used even if the shell has earlier exports.
dotenv.config({ override: true })
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Allow using DATABASE_URL (e.g. mysql://user:pass@host:port/db) or explicit
// DB env vars for MySQL (for local MySQL / Workbench) or default to SQLite.
const defaultSqlite = `sqlite:${path.join(__dirname, '..', '..', 'data', 'database.sqlite')}`

let sequelize

// Debug: print key envs to help diagnose which DB config is used at runtime
console.log('[models] DATABASE_URL=', process.env.DATABASE_URL)
console.log('[models] DB_CLIENT=', process.env.DB_CLIENT, 'DB_HOST=', process.env.DB_HOST)

if (process.env.DATABASE_URL) {
  // Let Sequelize parse DATABASE_URL automatically for supported dialects
  console.log('[models] Using DATABASE_URL for connection')
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    logging: process.env.NODE_ENV === 'production' ? false : console.log
  })
} else if (process.env.DB_CLIENT === 'mysql' || process.env.DB_HOST) {
  // Prefer explicit MySQL connection via env vars when provided
  console.log('[models] Using explicit DB_* env vars for MySQL')
  const dbName = process.env.DB_NAME || 'hospital_system_002'
  const dbUser = process.env.DB_USER || 'root'
  const dbPass = process.env.DB_PASS || ''
  const dbHost = process.env.DB_HOST || '127.0.0.1'
  const dbPort = process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306
  console.log('[models] mysql config', { dbName, dbUser, dbHost, dbPort })
  sequelize = new Sequelize(dbName, dbUser, dbPass, {
    host: dbHost,
    port: dbPort,
    dialect: 'mysql',
    dialectOptions: {
      // allow win32 / local default handling
    },
    logging: process.env.NODE_ENV === 'production' ? false : console.log
  })
} else {
  console.log('[models] Falling back to SQLite at', defaultSqlite)
  // default to SQLite file
  sequelize = new Sequelize(defaultSqlite, {
    logging: process.env.NODE_ENV === 'production' ? false : console.log
  })
}

const User = sequelize.define('User', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  passwordHash: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.STRING, allowNull: false, defaultValue: 'admin' }
})

const Patient = sequelize.define('Patient', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  age: { type: DataTypes.INTEGER, allowNull: false },
  gender: { type: DataTypes.ENUM('male', 'female', 'other'), allowNull: false },
  diagnosis: { type: DataTypes.TEXT, allowNull: true }
})

const Doctor = sequelize.define('Doctor', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  specialty: { type: DataTypes.STRING, allowNull: false },
  availability: { type: DataTypes.TEXT, allowNull: true } // JSON string
})

const Appointment = sequelize.define('Appointment', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  datetime: { type: DataTypes.DATE, allowNull: false },
  reason: { type: DataTypes.TEXT, allowNull: true }
})

const Record = sequelize.define('Record', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  type: { type: DataTypes.ENUM('prescription', 'note'), allowNull: false, defaultValue: 'prescription' },
  medication: { type: DataTypes.STRING, allowNull: true },
  notes: { type: DataTypes.TEXT, allowNull: true },
  date: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
})

// Associations
Patient.hasMany(Appointment, { foreignKey: 'patientId', onDelete: 'CASCADE' })
Appointment.belongsTo(Patient, { foreignKey: 'patientId' })

Doctor.hasMany(Appointment, { foreignKey: 'doctorId', onDelete: 'SET NULL' })
Appointment.belongsTo(Doctor, { foreignKey: 'doctorId' })

// Records associations
Patient.hasMany(Record, { foreignKey: 'patientId', onDelete: 'CASCADE' })
Record.belongsTo(Patient, { foreignKey: 'patientId' })

Doctor.hasMany(Record, { foreignKey: 'doctorId', onDelete: 'SET NULL' })
Record.belongsTo(Doctor, { foreignKey: 'doctorId' })

export const models = { User, Patient, Doctor, Appointment, Record }

export async function syncDatabase(options = { alter: true }) {
  await sequelize.authenticate()
  await sequelize.sync(options)
}

export default { sequelize, models, syncDatabase }
