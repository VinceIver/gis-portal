import { pool } from "../db.js";

/**
 * Helper: generate tracking codes for faculty/outsider
 * NOTE: Real uniqueness should be enforced with a UNIQUE index on requests.tracking_code
 */
function genTrackingCode(len = 10) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // avoids O/0, I/1
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function toListParam(v) {
  return String(v || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function toPositiveInt(v, fallback) {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.floor(n);
}

/**
 * ✅ CREATE REQUEST (NO LOGIN)
 * POST /api/requests
 */
export const createRequest = async (req, res) => {
  try {
    const {
      requester_type, // 'student' | 'faculty' | 'outsider'
      full_name,
      requester_code, // SR code (students only)
      department,
      needed_date,
      email,
      contact_number,
      request_type,
      description,
    } = req.body || {};

    if (
      !String(requester_type || "").trim() ||
      !String(full_name || "").trim() ||
      !String(email || "").trim() ||
      !String(request_type || "").trim()
    ) {
      return res.status(400).json({
        message: "requester_type, full_name, email, and request_type are required.",
      });
    }

    const rt = String(requester_type).trim().toLowerCase();

    let finalRequesterCode = null;
    let tracking_code = null;

    if (rt === "student") {
      if (!String(requester_code || "").trim()) {
        return res.status(400).json({ message: "SR code is required for students." });
      }
      finalRequesterCode = String(requester_code).trim();
      tracking_code = null;
    } else if (rt === "faculty" || rt === "outsider") {
      finalRequesterCode = null;

      // Generate unique tracking code for this request
      // Best practice: UNIQUE index on tracking_code and handle duplicate key errors.
      for (let tries = 0; tries < 10; tries++) {
        const candidate = genTrackingCode(10);
        const [exists] = await pool.query(
          "SELECT 1 FROM requests WHERE tracking_code = ? LIMIT 1",
          [candidate]
        );
        if (exists.length === 0) {
          tracking_code = candidate;
          break;
        }
      }

      if (!tracking_code) {
        return res.status(500).json({ message: "Failed to generate tracking code. Try again." });
      }
    } else {
      return res.status(400).json({ message: "Invalid requester_type." });
    }

    const finalDepartment =
      rt === "outsider" ? null : String(department || "").trim() || null;

    const [result] = await pool.query(
      `INSERT INTO requests
       (requester_type, full_name, requester_code, tracking_code, department, needed_date, email, contact_number, request_type, description, status, submitted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())`,
      [
        rt,
        String(full_name).trim(),
        finalRequesterCode,
        tracking_code,
        finalDepartment,
        needed_date || null,
        String(email).trim(),
        contact_number || null,
        String(request_type).trim(),
        description || null,
      ]
    );

    const tracking = rt === "student" ? finalRequesterCode : tracking_code;

    return res.status(201).json({
      id: result.insertId,
      tracking,
      tracking_type: rt === "student" ? "sr_code" : "tracking_code",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * ✅ TRACKING (NO LOGIN)
 * GET /api/requests/track/:code
 */
export const trackRequest = async (req, res) => {
  try {
    const code = String(req.params.code || "").trim();
    if (!code) return res.status(400).json({ message: "Code is required." });

    // 1) student SR code => return ALL
    const [studentRows] = await pool.query(
      `SELECT
         id,
         requester_type,
         full_name,
         requester_code,
         tracking_code,
         department,
         needed_date,
         email,
         contact_number,
         request_type,
         description,
         status,
         handled_at,
         remarks,
         submitted_at
       FROM requests
       WHERE requester_type='student' AND requester_code = ?
       ORDER BY submitted_at DESC, id DESC`,
      [code]
    );

    if (studentRows.length > 0) {
      return res.json({
        tracking_type: "sr_code",
        count: studentRows.length,
        requests: studentRows,
      });
    }

    // 2) tracking_code => return ONE
    const [otherRows] = await pool.query(
      `SELECT
         id,
         requester_type,
         full_name,
         requester_code,
         tracking_code,
         department,
         needed_date,
         email,
         contact_number,
         request_type,
         description,
         status,
         handled_at,
         remarks,
         submitted_at
       FROM requests
       WHERE tracking_code = ?
       LIMIT 1`,
      [code]
    );

    if (otherRows.length === 0) {
      return res.status(404).json({ message: "No request found for this code." });
    }

    return res.json({
      tracking_type: "tracking_code",
      count: 1,
      requests: otherRows,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * ✅ LIST REQUESTS (ADMIN)
 * GET /api/requests
 *
 * Supports minimizing reads:
 * - status=pending,approved,rejected
 * - type=consultation,resource
 * - requester_type=student|faculty|outsider|all
 * - from=YYYY-MM-DD, to=YYYY-MM-DD (filters by submitted_at)
 * - limit, offset
 * - fields=lite (excludes description)
 */
export const listRequests = async (req, res) => {
  try {
    const statuses = toListParam(req.query.status);

    const requesterTypeRaw = String(req.query.requester_type || "all").trim().toLowerCase();
    const requesterType = requesterTypeRaw === "all" ? null : requesterTypeRaw;

    const fields = String(req.query.fields || "").trim().toLowerCase();
    const lite = fields === "lite";

    const limit = toPositiveInt(req.query.limit, 500);
    const offset = Math.max(0, toPositiveInt(req.query.offset, 0));

    const from = String(req.query.from || "").trim();
    const to = String(req.query.to || "").trim();

    const where = [];
    const params = [];

    if (statuses.length) {
      where.push(`status IN (${statuses.map(() => "?").join(",")})`);
      params.push(...statuses);
    }

    // IMPORTANT: request_type is FREE TEXT now
    // Do not use it to filter tabs/categories.
    // If frontend still sends ?type=consultation, we just ignore it.

    if (requesterType) {
      where.push(`requester_type = ?`);
      params.push(requesterType);
    }

    if (from) {
      where.push(`submitted_at >= ?`);
      params.push(`${from} 00:00:00`);
    }

    if (to) {
      where.push(`submitted_at <= ?`);
      params.push(`${to} 23:59:59`);
    }

    const selectCols = lite
      ? `id, requester_type, full_name, requester_code, tracking_code, department,
         needed_date, email, contact_number, request_type, status, handled_at, remarks, submitted_at`
      : `id, requester_type, full_name, requester_code, tracking_code, department,
         needed_date, email, contact_number, request_type, description, status, handled_at, remarks, submitted_at`;

    const sql = `
      SELECT ${selectCols}
      FROM requests
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY submitted_at DESC, id DESC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.query(sql, [...params, limit, offset]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * ✅ APPROVE (ADMIN)
 */
export const approveRequest = async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isFinite(id) || id <= 0) {
    return res.status(400).json({ message: "Invalid id" });
  }

  try {
    const [result] = await pool.query(
      `UPDATE requests
       SET status='approved',
           handled_at=NOW(),
           handled_by_admin_id=?,
           remarks=NULL
       WHERE id=? AND status='pending'`,
      [req.adminId, id]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({ message: "Request not pending or not found" });
    }

    // Optional: return updated row so frontend can update state without reloading
    const [rows] = await pool.query(
      `SELECT id, requester_type, full_name, requester_code, tracking_code, request_type, status, handled_at, remarks, submitted_at
       FROM requests
       WHERE id=? LIMIT 1`,
      [id]
    );

    res.json({ ok: true, request: rows[0] || null });
  } catch (err) {
    console.error("APPROVE ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * ✅ REJECT (ADMIN)
 */
export const rejectRequest = async (req, res) => {
  const id = Number(req.params.id);
  const reason = String(req.body?.reason || "").trim();

  if (!Number.isFinite(id) || id <= 0) {
    return res.status(400).json({ message: "Invalid id" });
  }
  if (!reason) return res.status(400).json({ message: "Remarks is required" });

  try {
    const [result] = await pool.query(
      `UPDATE requests
       SET status='rejected',
           handled_at=NOW(),
           handled_by_admin_id=?,
           remarks=?
       WHERE id=? AND status='pending'`,
      [req.adminId, reason, id]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({ message: "Request not pending or not found" });
    }

    // Optional: return updated row so frontend can update state without reloading
    const [rows] = await pool.query(
      `SELECT id, requester_type, full_name, requester_code, tracking_code, request_type, status, handled_at, remarks, submitted_at
       FROM requests
       WHERE id=? LIMIT 1`,
      [id]
    );

    res.json({ ok: true, request: rows[0] || null });
  } catch (err) {
    console.error("REJECT ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};