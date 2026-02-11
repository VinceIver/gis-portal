import { pool } from "../db.js";

// Helper: convert input into valid MySQL DATETIME "YYYY-MM-DD HH:mm:ss"
function toMysqlDatetime(input) {
  if (!input) return null;

  const s = String(input).trim();

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s)) {
    return s.replace("T", " ") + ":00";
  }

  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(s)) {
    return s;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return s + " 00:00:00";
  }

  return null;
}

export const listTrainings = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         id,
         title,
         objectives,
         training_date,
         training_datetime,
         location,
         capacity,
         attendees_count
       FROM trainings
       ORDER BY training_datetime DESC, training_date DESC, id DESC`
    );

    const normalized = rows.map((r) => ({
      ...r,
      date: r.training_date,
      datetime: r.training_datetime,
      attendees: r.attendees_count,
    }));

    res.json(normalized);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const createTraining = async (req, res) => {
  const body = req.body || {};

  const title = body.title;
  const objectives = body.objectives;
  const location = body.location;
  const datetimeInput = body.datetime || body.training_datetime;
  const dateInput = body.date || body.training_date;

  if (!title || !objectives || !location) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const capNum = Number(body.capacity);
  if (!Number.isFinite(capNum) || capNum <= 0) {
    return res.status(400).json({ message: "Invalid capacity" });
  }

  const mysqlDatetime = toMysqlDatetime(datetimeInput || dateInput);
  if (!mysqlDatetime) {
    return res.status(400).json({ message: "Invalid date/datetime" });
  }

  const mysqlDate = mysqlDatetime.slice(0, 10);

  try {
    const [result] = await pool.query(
      `INSERT INTO trainings
       (title, objectives, training_date, training_datetime, location, capacity, attendees_count)
       VALUES (?, ?, ?, ?, ?, ?, 0)`,
      [title, objectives, mysqlDate, mysqlDatetime, location, capNum]
    );

    res.status(201).json({ id: result.insertId, ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ NEW: UPDATE TRAINING (EDIT)
export const updateTraining = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) {
    return res.status(400).json({ message: "Invalid id" });
  }

  const body = req.body || {};

  const title = body.title;
  const objectives = body.objectives;
  const location = body.location;
  const datetimeInput = body.datetime || body.training_datetime;
  const dateInput = body.date || body.training_date;

  if (!title || !objectives || !location) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const capNum = Number(body.capacity);
  if (!Number.isFinite(capNum) || capNum <= 0) {
    return res.status(400).json({ message: "Invalid capacity" });
  }

  const mysqlDatetime = toMysqlDatetime(datetimeInput || dateInput);
  if (!mysqlDatetime) {
    return res.status(400).json({ message: "Invalid date/datetime" });
  }

  const mysqlDate = mysqlDatetime.slice(0, 10);

  try {
    const [result] = await pool.query(
      `UPDATE trainings
       SET title = ?,
           objectives = ?,
           training_date = ?,
           training_datetime = ?,
           location = ?,
           capacity = ?
       WHERE id = ?`,
      [title, objectives, mysqlDate, mysqlDatetime, location, capNum, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Not found" });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteTraining = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    return res.status(400).json({ message: "Invalid id" });
  }

  try {
    const [result] = await pool.query(`DELETE FROM trainings WHERE id = ?`, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Not found" });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const registerTraining = async (req, res) => {
  const trainingId = Number(req.params.id);
  const name = String(req.body?.name || "").trim();

  if (!Number.isFinite(trainingId) || trainingId <= 0) {
    return res.status(400).json({ message: "Invalid training id" });
  }
  if (!name) {
    return res.status(400).json({ message: "Name is required" });
  }

  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const [rows] = await conn.query(
      `SELECT capacity, attendees_count
       FROM trainings
       WHERE id = ?
       FOR UPDATE`,
      [trainingId]
    );

    if (rows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: "Training not found" });
    }

    const cap = Number(rows[0].capacity || 0);
    const count = Number(rows[0].attendees_count || 0);

    if (cap > 0 && count >= cap) {
      await conn.rollback();
      return res.status(409).json({ message: "Training is already full" });
    }

    await conn.query(
      `INSERT INTO training_registrations (training_id, registrant_name)
       VALUES (?, ?)`,
      [trainingId, name]
    );

    await conn.query(
      `UPDATE trainings
       SET attendees_count = attendees_count + 1
       WHERE id = ?`,
      [trainingId]
    );

    await conn.commit();

    res.json({
      ok: true,
      registrant_name: name,
      attendees_count: count + 1,
    });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ message: "Registration failed" });
  } finally {
    conn.release();
  }
};

export const listAttendees = async (req, res) => {
  const trainingId = Number(req.params.id);
  if (!Number.isFinite(trainingId) || trainingId <= 0) {
    return res.status(400).json({ message: "Invalid training id" });
  }

  try {
    const [rows] = await pool.query(
      `SELECT registrant_name
       FROM training_registrations
       WHERE training_id = ?
       ORDER BY registered_at ASC`,
      [trainingId]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};