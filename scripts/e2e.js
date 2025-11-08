import fetch from 'node-fetch'

const BASE = process.env.BASE_URL || 'http://localhost:5000/v1'

async function run() {
  console.log('Base URL:', BASE)

  // 1) Register
  const registerBody = { name: 'E2E Tester', email: 'e2e@test.local', password: 'secret123' }
  let resp = await fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(registerBody)
  })
  const reg = await resp.json().catch(() => ({}))
  console.log('register ->', resp.status, JSON.stringify(reg))
  if (!resp.ok) throw new Error('Register failed')

  // token from register
  const token = reg.token
  if (!token) throw new Error('No token returned from register')

  // 2) Create a patient
  const patientBody = { name: 'E2E Patient', age: 30, gender: 'female', diagnosis: 'Testing' }
  resp = await fetch(`${BASE}/patients`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(patientBody)
  })
  const patient = await resp.json().catch(() => ({}))
  console.log('create patient ->', resp.status, JSON.stringify(patient))
  if (!resp.ok) throw new Error('Create patient failed')

  const patientId = patient.id
  if (!patientId) throw new Error('No patient id returned')

  // 3) Create a record
  const recordBody = { patientId, type: 'prescription', medication: 'TestMed 10mg', notes: 'Take once daily' }
  resp = await fetch(`${BASE}/records`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(recordBody)
  })
  const record = await resp.json().catch(() => ({}))
  console.log('create record ->', resp.status, JSON.stringify(record))
  if (!resp.ok) throw new Error('Create record failed')

  console.log('\nE2E OK: created record id', record.id)
}

run().catch((err) => {
  console.error('E2E ERROR', err.message)
  process.exit(1)
})
