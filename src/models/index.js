import { Sequelize, DataTypes } from 'sequelize'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

// Load .env only in non-production when a .env file exists. This ensures
// platform-provided environment variables (e.g. Railway) are not overridden
// by a local file during deployment.
try {
  const envPath = path.join(process.cwd(), '.env')
  if ((process.env.NODE_ENV || 'development') !== 'production' && fs.existsSync(envPath)) {
    dotenv.config({ path: envPath })
  }
} catch (e) {
  // ignore
}
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Allow using DATABASE_URL (e.g. mysql://user:pass@host:port/db) or explicit
// DB env vars for MySQL (for local MySQL / Workbench) or default to SQLite.
const defaultSqlite = `sqlite:${path.join(__dirname, '..', '..', 'data', 'database.sqlite')}`

let sequelize

const makeSqliteSequelize = () =>
  new Sequelize(defaultSqlite, {
    logging: process.env.NODE_ENV === 'production' ? false : console.log
  })

// Helpful debug logging in non-production
if ((process.env.NODE_ENV || 'development') !== 'production') {
  console.log('[models] DATABASE_URL=', process.env.DATABASE_URL)
  console.log('[models] DB_CLIENT=', process.env.DB_CLIENT, 'DB_HOST=', process.env.DB_HOST)
}

if (process.env.DATABASE_URL) {
  // Let Sequelize parse DATABASE_URL automatically for supported dialects
  console.log('[models] Using DATABASE_URL for connection')
  // Parse SSL setting (some clouds require SSL connections). Set
  // DATABASE_SSL=true in the Railway environment if needed.
  const dialectOptions = {}
  if (process.env.DATABASE_SSL === 'true' || process.env.DB_SSL === 'true') {
    dialectOptions.ssl = { rejectUnauthorized: false }
  }

  sequelize = new Sequelize(process.env.DATABASE_URL, {
    logging: process.env.NODE_ENV === 'production' ? false : console.log,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: { connectTimeout: 15000, ...dialectOptions },
    retry: {
      match: [/ETIMEDOUT/, /ECONNRESET/, /EHOSTUNREACH/, /ECONNREFUSED/],
      max: 5
    }
  })
} else if (process.env.DB_CLIENT === 'mysql' || process.env.DB_HOST) {
  // Prefer explicit MySQL connection via env vars when provided
  if ((process.env.NODE_ENV || 'development') !== 'production') {
    console.log('[models] Using explicit DB_* env vars for MySQL')
  }
  const dbName = process.env.DB_NAME || 'hospital_system_002'
  const dbUser = process.env.DB_USER || 'root'
  const dbPass = process.env.DB_PASS || ''
  const dbHost = process.env.DB_HOST || '127.0.0.1'
  const dbPort = process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306
  console.log('[models] mysql config', { dbName, dbUser, dbHost, dbPort })
  const dialectOptions = {}
  if (process.env.DB_SSL === 'true' || process.env.DATABASE_SSL === 'true') {
    dialectOptions.ssl = { rejectUnauthorized: false }
  }

  sequelize = new Sequelize(dbName, dbUser, dbPass, {
    host: dbHost,
    port: dbPort,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'production' ? false : console.log,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: { connectTimeout: 15000, ...dialectOptions },
    retry: {
      match: [/ETIMEDOUT/, /ECONNRESET/, /EHOSTUNREACH/, /ECONNREFUSED/],
      max: 5
    }
  })
} else {
  console.log('[models] Falling back to SQLite at', defaultSqlite)
  // default to SQLite file
  sequelize = makeSqliteSequelize()
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
  try {
    await sequelize.authenticate()
  } catch (err) {
    console.error('[models] DB connection failed:', err && err.message ? err.message : err)
    // In production we want to fail-fast on DB connection errors. In
    // development only, fall back to a local SQLite file so the app stays
    // runnable for iterative work.
    const dialect = typeof sequelize.getDialect === 'function' ? sequelize.getDialect() : null
    if ((process.env.NODE_ENV || 'development') === 'production') {
      // rethrow to stop startup in production (so platform shows the failure)
      throw err
    }

    if (dialect && dialect !== 'sqlite') {
      console.warn('[models] Falling back to local SQLite database due to connection issues (development only)')
      sequelize = makeSqliteSequelize()
    } else {
      // already sqlite or unknown — rethrow
      throw err
    }
  }

  // perform sync on whichever sequelize instance we have (remote or fallback)
  await sequelize.sync(options)
}

export default { sequelize, models, syncDatabase }
