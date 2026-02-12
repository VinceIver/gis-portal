import { pool } from "../db.js";

const rand = (n = 6) =>
  Math.random().toString(36).slice(2, 2 + n).toUpperCase();

const makeExternalCode = () =>
  `EXT-${new Date().getFullYear().toString().slice(-2)}-${rand()}`;

// --------------------
// STUDENT/EXTERNAL CREATE
// --------------------
export const createResourceRequest = async (req, res) => {
  try {
    const {
      requester_name,
      requester_type, // STUDENT | EXTERNAL
      sr_code,
      email,
      department,
      needed_date,
      request_type,
      requested_items,
      purpose,
      notes,
    } = req.body;

    if (!String(requester_name || "").trim())
      return res.status(400).json({ message: "requester_name is required." });
    if (!String(request_type || "").trim())
      return res.status(400).json({ message: "request_type is required." });
    if (!String(requested_items || "").trim())
      return res.status(400).json({ message: "requested_items is required." });
    if (!String(purpose || "").trim())
      return res.status(400).json({ message: "purpose is required." });

    const type = String(requester_type || "STUDENT").trim().toUpperCase();
    const finalType = type === "STUDENT" ? "STUDENT" : "EXTERNAL";

    let srToSave = null;

    if (finalType === "STUDENT") {
      const sr = String(sr_code || "").trim();
      if (!sr)
        return res
          .status(400)
          .json({ message: "sr_code is required for STUDENT." });

      srToSave = sr;
    } else {
      srToSave = null;
    }

    // retry insert if tracking_code collides (rare but safe)
    for (let attempt = 0; attempt < 5; attempt++) {
      const tracking_code =
        finalType === "STUDENT"
          ? `REQ-${srToSave}-${rand(6)}`
          : makeExternalCode();

      try {
        const [result] = await pool.query(
          `INSERT INTO resource_requests
           (tracking_code, requester_type, sr_code, requester_name, email, department, needed_date,
            request_type, requested_items, purpose, notes, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
          [
            tracking_code,
            finalType,
            srToSave,
            String(requester_name).trim(),
            String(email || "").trim() || null,
            String(department || "").trim() || null,
            needed_date || null,
            String(request_type).trim(),
            String(requested_items).trim(),
            String(purpose).trim(),
            String(notes || "").trim() || null,
          ]
        );

        return res.status(201).json({
          id: result.insertId,

          tracking_code,

          tracking: finalType === "STUDENT" ? srToSave : tracking_code,

          requester_type: finalType,
          sr_code: srToSave,
          status: "pending",
        });
      } catch (err) {
        if (err?.code === "ER_DUP_ENTRY") {
          // generate a new code and retry
          continue;
        }
        throw err;
      }
    }

    return res
      .status(500)
      .json({ message: "Failed to generate unique tracking code." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// --------------------
// PUBLIC TRACKING
// --------------------
export const trackResourceRequest = async (req, res) => {
  try {
    const code = String(req.params.code || "").trim();
    if (!code)
      return res.status(400).json({ message: "tracking code is required." });

    // 1) If code matches a tracking_code, return single request + deliveries
    const [[single]] = await pool.query(
      `SELECT *
       FROM resource_requests
       WHERE tracking_code = ?
       LIMIT 1`,
      [code]
    );

    if (single) {
      const [deliveries] = await pool.query(
        `SELECT id, delivery_type, file_name, file_path, external_url, message, created_at
         FROM resource_deliveries
         WHERE request_id = ?
         ORDER BY created_at DESC`,
        [single.id]
      );

      const mapped = deliveries.map((d) => {
        let file_url = null;
        if (d.delivery_type === "FILE" && d.file_path) file_url = d.file_path;
        else if (d.delivery_type === "LINK" && d.external_url)
          file_url = d.external_url;

        return { ...d, file_url, original_name: d.file_name };
      });

      return res.json({ request: single, deliveries: mapped });
    }

    // 2) Otherwise treat it as SR code, return all requests for that SR
    const [requests] = await pool.query(
      `SELECT *
       FROM resource_requests
       WHERE sr_code = ?
       ORDER BY submitted_at DESC`,
      [code]
    );

    if (!requests.length)
      return res.status(404).json({ message: "No record found." });

    return res.json({ requests });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// --------------------
// ADMIN LIST (PENDING/APPROVED/REJECTED)
// --------------------
export const adminListResourceRequests = async (req, res) => {
  try {
    const status = String(req.query.status || "pending").toLowerCase();
    const allowed = ["pending", "approved", "rejected"];
    const s = allowed.includes(status) ? status : "pending";

    const [rows] = await pool.query(
      `SELECT
         id,
         tracking_code,
         requester_type,
         sr_code,
         requester_name,
         email,
         department,
         needed_date,
         request_type,
         requested_items,
         purpose,
         notes,
         status,
         remarks AS admin_remarks,
         remarks,
         submitted_at,
         handled_at,
         handled_by_admin_id
       FROM resource_requests
       WHERE status = ?
       ORDER BY submitted_at DESC`,
      [s]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// --------------------
// ADMIN APPROVE
// --------------------
export const adminApproveResourceRequest = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id))
      return res.status(400).json({ message: "Invalid id." });

    const [result] = await pool.query(
      `UPDATE resource_requests
       SET status='approved',
           handled_at=NOW(),
           handled_by_admin_id=?,
           remarks=NULL
       WHERE id=? AND status='pending'`,
      [req.adminId, id]
    );

    if (result.affectedRows === 0)
      return res
        .status(404)
        .json({ message: "Request not found or not pending." });

    res.json({ message: "Approved" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// --------------------
// ADMIN REJECT
// --------------------
export const adminRejectResourceRequest = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id))
      return res.status(400).json({ message: "Invalid id." });

    const remarks = String(req.body?.remarks || "").trim();
    if (!remarks) return res.status(400).json({ message: "remarks is required." });

    const [result] = await pool.query(
      `UPDATE resource_requests
       SET status='rejected',
           handled_at=NOW(),
           handled_by_admin_id=?,
           remarks=?
       WHERE id=? AND status='pending'`,
      [req.adminId, remarks, id]
    );

    if (result.affectedRows === 0)
      return res
        .status(404)
        .json({ message: "Request not found or not pending." });

    res.json({ message: "Rejected" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// --------------------
// ADMIN ADD DELIVERY (FILE/LINK/NOTE) + AUTO-APPROVE + REMARKS
// --------------------
export const adminAddDelivery = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const request_id = Number(req.params.id);
    if (!Number.isFinite(request_id))
      return res.status(400).json({ message: "Invalid id." });

    const delivery_type = String(req.body?.delivery_type || "")
      .trim()
      .toUpperCase();
    const external_url = String(req.body?.external_url || "").trim() || null;
    const message = String(req.body?.message || "").trim() || null;

    const remarks = String(req.body?.remarks || "").trim();
    if (!remarks) return res.status(400).json({ message: "remarks is required." });

    const file = req.file || null;

    if (!["FILE", "LINK", "NOTE"].includes(delivery_type)) {
      return res
        .status(400)
        .json({ message: "delivery_type must be FILE, LINK, or NOTE." });
    }

    if (delivery_type === "FILE" && !file)
      return res
        .status(400)
        .json({ message: "File is required for FILE delivery_type." });

    if (delivery_type === "LINK" && !external_url)
      return res
        .status(400)
        .json({ message: "external_url is required for LINK delivery_type." });

    if (delivery_type === "NOTE" && !message)
      return res
        .status(400)
        .json({ message: "message is required for NOTE delivery_type." });

    const file_path = file ? `/uploads/resource-deliveries/${file.filename}` : null;
    const file_name = file ? file.originalname : null;

    await conn.beginTransaction();

    const [[reqRow]] = await conn.query(
      `SELECT id, status
       FROM resource_requests
       WHERE id = ?
       LIMIT 1`,
      [request_id]
    );

    if (!reqRow) {
      await conn.rollback();
      return res.status(404).json({ message: "Request not found." });
    }

    const [ins] = await conn.query(
      `INSERT INTO resource_deliveries
       (request_id, delivery_type, file_path, file_name, external_url, message, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [request_id, delivery_type, file_path, file_name, external_url, message]
    );

    const [upd] = await conn.query(
      `UPDATE resource_requests
       SET status='approved',
           handled_at=NOW(),
           handled_by_admin_id=?,
           remarks=?
       WHERE id=? AND status='pending'`,
      [req.adminId, remarks, request_id]
    );

    await conn.commit();

    return res.status(201).json({
      id: ins.insertId,
      autoApproved: upd.affectedRows > 0,
    });
  } catch (err) {
    try {
      await conn.rollback();
    } catch { }
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  } finally {
    conn.release();
  }
};