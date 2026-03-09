import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("database.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS hospital_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    dob DATE,
    anniversary DATE,
    doctor TEXT,
    department TEXT,
    village TEXT,
    block TEXT,
    district TEXT,
    pincode TEXT,
    city TEXT,
    state TEXT,
    age INTEGER,
    photo TEXT,
    id_card TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS dairy_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT CHECK(type IN ('Farmer', 'Customer', 'Staff')),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    dob DATE,
    anniversary DATE,
    village TEXT,
    block TEXT,
    pincode TEXT,
    city TEXT,
    state TEXT,
    district TEXT,
    bmc_dpmc TEXT,
    aadhar TEXT,
    age INTEGER,
    photo TEXT,
    aadhaar_card TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    module TEXT CHECK(module IN ('Hospital', 'Dairy')),
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT CHECK(type IN ('Birthday', 'Anniversary', 'Bulk', 'Custom'))
  );

  CREATE TABLE IF NOT EXISTS message_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    module TEXT,
    recipient_name TEXT,
    recipient_phone TEXT,
    message TEXT,
    status TEXT,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS media (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    module TEXT CHECK(module IN ('Hospital', 'Dairy')),
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    data TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    module TEXT UNIQUE CHECK(module IN ('Hospital', 'Dairy')),
    whatsapp_api_key TEXT,
    hospital_name TEXT,
    auto_birthday INTEGER DEFAULT 0,
    auto_anniversary INTEGER DEFAULT 0
  );

  INSERT OR IGNORE INTO settings (module, hospital_name) VALUES ('Hospital', 'Shri Krishna Mission Hospital');
  INSERT OR IGNORE INTO settings (module, hospital_name) VALUES ('Dairy', 'Shri Krishna Sugar & Dairy');
`);

// Seed Data
const hospitalCount = db.prepare("SELECT COUNT(*) as count FROM hospital_entries").get() as { count: number };
if (hospitalCount.count === 0) {
  const insertHospital = db.prepare(`
    INSERT INTO hospital_entries (name, phone, dob, anniversary, doctor, department, village, block, district, age)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertHospital.run("Rahul Sharma", "919876543210", "1990-05-15", "2015-12-10", "Dr. Gupta", "Cardiology", "Ramnagar", "Block A", "District X", 34);
  insertHospital.run("Priya Verma", "918765432109", "1985-08-22", "2010-02-14", "Dr. Singh", "Orthopedics", "Shantinagar", "Block B", "District Y", 39);
  insertHospital.run("Amit Patel", "917654321098", "2005-01-01", null, "Dr. Mehta", "Pediatrics", "Gopalpur", "Block C", "District Z", 19);
}

const dairyCount = db.prepare("SELECT COUNT(*) as count FROM dairy_entries").get() as { count: number };
if (dairyCount.count === 0) {
  const insertDairy = db.prepare(`
    INSERT INTO dairy_entries (type, name, phone, dob, anniversary, village, block, bmc_dpmc, aadhar, age)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertDairy.run("Farmer", "Suresh Kumar", "916543210987", "1975-03-20", "1998-05-05", "Village 1", "Block Alpha", "BMC North", "123456789012", 49);
  insertDairy.run("Customer", "Anita Devi", "915432109876", "1988-11-11", "2008-11-11", "Village 2", "Block Beta", "DPMC South", "987654321098", 36);
  insertDairy.run("Staff", "Rajesh Singh", "914321098765", "1995-07-07", null, "Village 3", "Block Gamma", "Staff HQ", "456789012345", 29);
}

const templateCount = db.prepare("SELECT COUNT(*) as count FROM templates").get() as { count: number };
if (templateCount.count === 0) {
  const insertTemplate = db.prepare("INSERT INTO templates (module, name, content, type) VALUES (?, ?, ?, ?)");
  insertTemplate.run("Hospital", "Birthday Wish", "Happy Birthday {{name}}! Wishing you good health from Shri Krishna Mission Hospital.", "Birthday");
  insertTemplate.run("Hospital", "Anniversary Wish", "Happy Anniversary {{name}}! Best wishes from Shri Krishna Mission Hospital.", "Anniversary");
  insertTemplate.run("Dairy", "Farmer Greeting", "Hello {{name}}, thank you for your contribution to Shri Krishna Dairy.", "Bulk");
}

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = 3000;

  // Hospital API
  app.get("/api/hospital/entries", (req, res) => {
    const entries = db.prepare("SELECT * FROM hospital_entries ORDER BY created_at DESC").all();
    res.json(entries);
  });

  app.post("/api/hospital/entries", (req, res) => {
    const { name, phone, dob, anniversary, doctor, department, village, block, district, pincode, city, state, age, photo, id_card } = req.body;
    const info = db.prepare(`
      INSERT INTO hospital_entries (name, phone, dob, anniversary, doctor, department, village, block, district, pincode, city, state, age, photo, id_card)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name, phone, dob, anniversary, doctor, department, village, block, district, pincode, city, state, age, photo, id_card);
    res.json({ id: info.lastInsertRowid });
  });

  app.delete("/api/hospital/entries/:id", (req, res) => {
    db.prepare("DELETE FROM hospital_entries WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.put("/api/hospital/entries/:id", (req, res) => {
    const { name, phone, dob, anniversary, doctor, department, village, block, district, pincode, city, state, age, photo, id_card } = req.body;
    db.prepare(`
      UPDATE hospital_entries 
      SET name = ?, phone = ?, dob = ?, anniversary = ?, doctor = ?, department = ?, village = ?, block = ?, district = ?, pincode = ?, city = ?, state = ?, age = ?, photo = ?, id_card = ?
      WHERE id = ?
    `).run(name, phone, dob, anniversary, doctor, department, village, block, district, pincode, city, state, age, photo, id_card, req.params.id);
    res.json({ success: true });
  });

  // Dairy API
  app.get("/api/dairy/entries", (req, res) => {
    const entries = db.prepare("SELECT * FROM dairy_entries ORDER BY created_at DESC").all();
    res.json(entries);
  });

  app.post("/api/dairy/entries", (req, res) => {
    const { type, name, phone, dob, anniversary, village, block, pincode, city, state, district, bmc_dpmc, aadhar, age, photo, aadhaar_card } = req.body;
    const info = db.prepare(`
      INSERT INTO dairy_entries (type, name, phone, dob, anniversary, village, block, pincode, city, state, district, bmc_dpmc, aadhar, age, photo, aadhaar_card)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(type, name, phone, dob, anniversary, village, block, pincode, city, state, district, bmc_dpmc, aadhar, age, photo, aadhaar_card);
    res.json({ id: info.lastInsertRowid });
  });

  app.delete("/api/dairy/entries/:id", (req, res) => {
    db.prepare("DELETE FROM dairy_entries WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.put("/api/dairy/entries/:id", (req, res) => {
    const { type, name, phone, dob, anniversary, village, block, pincode, city, state, district, bmc_dpmc, aadhar, age, photo, aadhaar_card } = req.body;
    db.prepare(`
      UPDATE dairy_entries 
      SET type = ?, name = ?, phone = ?, dob = ?, anniversary = ?, village = ?, block = ?, pincode = ?, city = ?, state = ?, district = ?, bmc_dpmc = ?, aadhar = ?, age = ?, photo = ?, aadhaar_card = ?
      WHERE id = ?
    `).run(type, name, phone, dob, anniversary, village, block, pincode, city, state, district, bmc_dpmc, aadhar, age, photo, aadhaar_card, req.params.id);
    res.json({ success: true });
  });

  // Templates API
  app.get("/api/templates/:module", (req, res) => {
    const templates = db.prepare("SELECT * FROM templates WHERE module = ?").all(req.params.module);
    res.json(templates);
  });

  app.post("/api/templates", (req, res) => {
    const { module, name, content, type } = req.body;
    const info = db.prepare("INSERT INTO templates (module, name, content, type) VALUES (?, ?, ?, ?)").run(module, name, content, type);
    res.json({ id: info.lastInsertRowid });
  });

  // Media API
  app.get("/api/media/:module", (req, res) => {
    const media = db.prepare("SELECT * FROM media WHERE module = ? ORDER BY created_at DESC").all(req.params.module);
    res.json(media);
  });

  app.post("/api/media", (req, res) => {
    const { module, name, type, data } = req.body;
    const info = db.prepare("INSERT INTO media (module, name, type, data) VALUES (?, ?, ?, ?)").run(module, name, type, data);
    res.json({ id: info.lastInsertRowid });
  });

  app.delete("/api/media/:id", (req, res) => {
    db.prepare("DELETE FROM media WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Settings API
  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    
    const adminId = process.env.ADMIN_ID || 'admin';
    const adminPass = process.env.ADMIN_PASSWORD || '12345';
    const staffId = process.env.STAFF_ID || 'staff';
    const staffPass = process.env.STAFF_PASSWORD || '12345';

    if (username === adminId && password === adminPass) {
      res.json({ username: adminId, role: 'admin' });
    } else if (username === staffId && password === staffPass) {
      res.json({ username: staffId, role: 'staff' });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  });

  app.get("/api/settings/:module", (req, res) => {
    const settings = db.prepare("SELECT * FROM settings WHERE module = ?").get(req.params.module);
    res.json(settings || {});
  });

  app.post("/api/settings/:module", (req, res) => {
    const { whatsapp_api_key, hospital_name, auto_birthday, auto_anniversary } = req.body;
    db.prepare(`
      INSERT INTO settings (module, whatsapp_api_key, hospital_name, auto_birthday, auto_anniversary)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(module) DO UPDATE SET
        whatsapp_api_key = excluded.whatsapp_api_key,
        hospital_name = excluded.hospital_name,
        auto_birthday = excluded.auto_birthday,
        auto_anniversary = excluded.auto_anniversary
    `).run(req.params.module, whatsapp_api_key, hospital_name, auto_birthday ? 1 : 0, auto_anniversary ? 1 : 0);
    res.json({ success: true });
  });

  // Logs API
  app.get("/api/logs", (req, res) => {
    const logs = db.prepare("SELECT * FROM message_logs ORDER BY sent_at DESC LIMIT 100").all();
    res.json(logs);
  });

  app.post("/api/logs", (req, res) => {
    const { module, recipient_name, recipient_phone, message, status } = req.body;
    db.prepare("INSERT INTO message_logs (module, recipient_name, recipient_phone, message, status) VALUES (?, ?, ?, ?, ?)").run(module, recipient_name, recipient_phone, message, status);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
