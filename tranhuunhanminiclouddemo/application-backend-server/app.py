from flask import Flask, jsonify, request, redirect
import time
import os
import requests
import json
import pymysql
from jose import jwt

# ── Keycloak OIDC config ──────────────────────────────────────────────────────
ISSUER = os.getenv(
    "OIDC_ISSUER",
    "http://authentication-identity-server:8080/realms/master"
)
AUDIENCE   = os.getenv("OIDC_AUDIENCE", "myapp")
JWKS_URL   = f"{ISSUER}/protocol/openid-connect/certs"
_JWKS, _TS = None, 0


def get_jwks():
    global _JWKS, _TS
    now = time.time()
    if not _JWKS or now - _TS > 600:
        resp = requests.get(JWKS_URL, timeout=5)
        resp.raise_for_status()
        _JWKS = resp.json()
        _TS   = now
    return _JWKS


# ── DB helper ────────────────────────────────────────────────────────────────
def get_db():
    return pymysql.connect(
        host=os.getenv("DB_HOST", "relational-database-server"),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD") or os.getenv("MYSQL_ROOT_PASSWORD", ""),
        database=os.getenv("DB_NAME", "studentdb"),
        connect_timeout=5,
        cursorclass=pymysql.cursors.DictCursor,
    )


# ── Shared HTML helpers ───────────────────────────────────────────────────────
def major_style(major):
    m = (major or "").lower()
    if "network"  in m: return "background:#0c4a6e;color:#7dd3fc;border:1px solid #0284c7"
    if "software" in m: return "background:#2e1065;color:#c4b5fd;border:1px solid #7c3aed"
    if "ai" in m or "machine" in m: return "background:#1c1200;color:#fde68a;border:1px solid #d97706"
    return "background:#1e293b;color:#cbd5e1;border:1px solid #475569"


app = Flask(__name__)


# ── /hello ────────────────────────────────────────────────────────────────────
@app.get("/hello")
def hello():
    return jsonify(message="Hello from App Server!")


# ── /secure ───────────────────────────────────────────────────────────────────
@app.get("/secure")
def secure():
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return jsonify(error="Missing Bearer token"), 401
    token = auth.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, get_jwks(), algorithms=["RS256"],
                             audience=AUDIENCE, options={"verify_iss": False})
        return jsonify(message="Secure resource OK",
                       preferred_username=payload.get("preferred_username"))
    except Exception as e:
        return jsonify(error=str(e)), 401


# ── /student  (JSON file) ─────────────────────────────────────────────────────
@app.get("/student")
def student():
    try:
        with open("students.json", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
        return f"<h2 style='color:red;font-family:sans-serif;padding:40px'>Loi: {e}</h2>", 500

    def gpa_color(gpa):
        if gpa >= 3.6: return "#34d399", "Xuat sac"
        if gpa >= 3.0: return "#fbbf24", "Kha"
        return "#f87171", "Trung binh"

    rows = ""
    for i, s in enumerate(data):
        color, label = gpa_color(s.get("gpa", 0))
        bg = "#0f172a" if i % 2 == 0 else "#0d1f3c"
        rows += f"""
        <tr style="background:{bg};border-bottom:1px solid rgba(148,163,184,0.15);">
          <td style="padding:14px 20px;text-align:center;color:#64748b;font-weight:700;font-size:.82rem;">{s.get("id", i+1)}</td>
          <td style="padding:14px 20px;font-weight:600;color:#e2e8f0;">{s.get("name","")}</td>
          <td style="padding:14px 20px;">
            <span style="display:inline-block;padding:4px 12px;border-radius:999px;
                         font-size:.76rem;font-weight:500;{major_style(s.get("major",""))}">
              {s.get("major","")}
            </span>
          </td>
          <td style="padding:14px 20px;">
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="width:9px;height:9px;border-radius:50%;background:{color};
                           box-shadow:0 0 8px {color};display:inline-block;"></span>
              <span style="font-weight:700;color:{color};">{s.get("gpa",0):.1f}</span>
              <span style="font-size:.74rem;color:#64748b;">({label})</span>
            </div>
          </td>
        </tr>"""

    CSS = _common_css()
    html = f"""<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Danh Sach Sinh Vien - MyMiniCloud</title><style>{CSS}</style></head>
<body><div class="container">
  <div class="header">
    <h1>Danh Sach Sinh Vien</h1>
    <p>Application Backend Server · Flask REST API · students.json</p>
  </div>
  <div class="card">
    <div class="card-head">
      <span>Bang sinh vien <span class="pill">{len(data)}</span></span>
      <span class="api-tag">GET /api/student</span>
    </div>
    <div class="table-wrap"><table>
      <thead><tr><th>#</th><th>Ho Ten</th><th>Nganh Hoc</th><th>GPA</th></tr></thead>
      <tbody>{rows}</tbody>
    </table></div>
    <div class="foot">
      <span>Tong cong <strong style="color:#e2e8f0">{len(data)}</strong> sinh vien</span>
      <span>Nguon: <code style="color:#38bdf8">students.json</code></span>
    </div>
  </div>
  <footer>&copy; 2026 · MyMiniCloud · Tran Huu Nhan - Do Van Trong - Nguyen Yen Phung</footer>
</div></body></html>"""
    return html, 200, {"Content-Type": "text/html; charset=utf-8"}


# ── /students-db  CRUD page ───────────────────────────────────────────────────
@app.route("/students-db", methods=["GET", "POST"])
def students_db():
    db_host = os.getenv("DB_HOST", "relational-database-server")
    db_name = os.getenv("DB_NAME", "studentdb")
    msg, msg_type = "", ""

    # ── Handle CRUD actions via query params (GET) ────────────────────────────
    action = request.args.get("action", "")
    try:
        conn = get_db()
        with conn:
            with conn.cursor() as cur:
                if action == "add":
                    student_id = request.args.get("student_id", "").strip()
                    fullname   = request.args.get("fullname", "").strip()
                    dob        = request.args.get("dob", "").strip() or None
                    major      = request.args.get("major", "").strip()
                    if student_id and fullname:
                        cur.execute(
                            "INSERT INTO students (student_id, fullname, dob, major) VALUES (%s,%s,%s,%s)",
                            (student_id, fullname, dob, major)
                        )
                        conn.commit()
                        msg = f"Da them sinh vien '{fullname}' thanh cong!"
                        msg_type = "success"
                    else:
                        msg, msg_type = "Vui long dien Ma SV va Ho Ten.", "error"

                elif action == "update":
                    sid      = request.args.get("id", "")
                    fullname = request.args.get("fullname", "").strip()
                    dob      = request.args.get("dob", "").strip() or None
                    major    = request.args.get("major", "").strip()
                    if sid and fullname:
                        cur.execute(
                            "UPDATE students SET fullname=%s, dob=%s, major=%s WHERE id=%s",
                            (fullname, dob, major, sid)
                        )
                        conn.commit()
                        msg = f"Da cap nhat sinh vien ID={sid} thanh cong!"
                        msg_type = "success"
                    else:
                        msg, msg_type = "Thieu thong tin cap nhat.", "error"

                elif action == "delete":
                    sid = request.args.get("id", "")
                    if sid:
                        cur.execute("DELETE FROM students WHERE id=%s", (sid,))
                        conn.commit()
                        msg = f"Da xoa sinh vien ID={sid}."
                        msg_type = "warning"

                # Always re-query to get fresh data
                cur.execute("SELECT id, student_id, fullname, dob, major FROM students ORDER BY id")
                data = cur.fetchall()

    except Exception as e:
        err_html = _error_page(str(e), db_host, db_name)
        return err_html, 500, {"Content-Type": "text/html; charset=utf-8"}

    # ── Build table rows ──────────────────────────────────────────────────────
    rows = ""
    for i, s in enumerate(data):
        bg      = "#0f172a" if i % 2 == 0 else "#0d1f3c"
        dob_str = str(s.get("dob", "")) if s.get("dob") else "–"
        sid     = s.get("id", "")
        rows += f"""
        <tr id="row-{sid}" style="background:{bg};border-bottom:1px solid rgba(148,163,184,0.15);">
          <td style="padding:13px 16px;text-align:center;color:#64748b;font-weight:700;font-size:.82rem;">{sid}</td>
          <td style="padding:13px 16px;font-weight:600;color:#38bdf8;font-family:'Courier New',monospace;font-size:.85rem;">{s.get("student_id","")}</td>
          <td style="padding:13px 16px;font-weight:600;color:#e2e8f0;">{s.get("fullname","")}</td>
          <td style="padding:13px 16px;color:#94a3b8;font-size:.87rem;">{dob_str}</td>
          <td style="padding:13px 16px;">
            <span style="display:inline-block;padding:4px 10px;border-radius:999px;
                         font-size:.75rem;font-weight:500;{major_style(s.get("major",""))}">
              {s.get("major","–")}
            </span>
          </td>
          <td style="padding:13px 16px;white-space:nowrap;">
            <button onclick="fillEdit({sid},'{s.get("student_id","")}','{s.get("fullname","")}','{dob_str if dob_str != chr(8211) else ""}','{s.get("major","")}')"
              style="padding:5px 12px;border-radius:6px;border:1px solid rgba(56,189,248,.4);
                     background:rgba(56,189,248,.12);color:#38bdf8;font-size:.78rem;
                     cursor:pointer;margin-right:6px;transition:.2s;">
              Sua
            </button>
            <a href="/api/students-db?action=delete&id={sid}"
               onclick="return confirm('Xac nhan xoa ID={sid}?')"
               style="padding:5px 12px;border-radius:6px;border:1px solid rgba(248,113,113,.4);
                      background:rgba(248,113,113,.12);color:#f87171;font-size:.78rem;
                      text-decoration:none;display:inline-block;transition:.2s;">
              Xoa
            </a>
          </td>
        </tr>"""

    # ── Notification bar ──────────────────────────────────────────────────────
    notif_colors = {
        "success": ("rgba(52,211,153,.12)", "rgba(52,211,153,.35)", "#34d399"),
        "warning": ("rgba(251,191,36,.12)",  "rgba(251,191,36,.35)",  "#fbbf24"),
        "error":   ("rgba(248,113,113,.12)", "rgba(248,113,113,.35)", "#f87171"),
    }
    notif_html = ""
    if msg:
        bg_n, bd_n, c_n = notif_colors.get(msg_type, notif_colors["success"])
        notif_html = f"""
        <div style="margin-bottom:18px;padding:12px 18px;border-radius:10px;
                    background:{bg_n};border:1px solid {bd_n};color:{c_n};font-size:.88rem;">
          {msg}
        </div>"""

    # ── CSS ──────────────────────────────────────────────────────────────────
    CSS = _common_css()

    html = f"""<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Sinh Vien CRUD (MariaDB) - MyMiniCloud</title>
  <style>
    {CSS}
    .form-card{{background:rgba(15,23,42,.9);border:1px solid rgba(148,163,184,.2);
               border-radius:16px;padding:22px 24px;margin-bottom:20px}}
    .form-card h3{{font-size:.95rem;font-weight:700;color:#bfdbfe;margin-bottom:16px;
                  display:flex;align-items:center;gap:8px}}
    .form-grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px}}
    .form-group label{{display:block;font-size:.74rem;font-weight:600;color:#64748b;
                       text-transform:uppercase;letter-spacing:.06em;margin-bottom:5px}}
    .form-group input,.form-group select{{width:100%;padding:9px 12px;border-radius:8px;
      border:1px solid rgba(148,163,184,.25);background:rgba(15,23,42,.8);
      color:#e2e8f0;font-size:.88rem;outline:none;transition:.2s}}
    .form-group input:focus{{border-color:#38bdf8;box-shadow:0 0 0 2px rgba(56,189,248,.15)}}
    .btn-submit{{padding:10px 22px;border-radius:8px;border:none;cursor:pointer;
                 font-size:.88rem;font-weight:600;transition:.2s}}
    .btn-add{{background:linear-gradient(135deg,#1d4ed8,#38bdf8);color:#fff;
              box-shadow:0 6px 20px rgba(56,189,248,.3)}}
    .btn-add:hover{{filter:brightness(1.1);transform:translateY(-1px)}}
    .btn-update{{background:linear-gradient(135deg,#065f46,#34d399);color:#fff;
                 box-shadow:0 6px 20px rgba(52,211,153,.3)}}
    .btn-update:hover{{filter:brightness(1.1);transform:translateY(-1px)}}
    .tabs{{display:flex;gap:8px;margin-bottom:16px}}
    .tab{{padding:7px 16px;border-radius:8px;font-size:.82rem;font-weight:600;
          cursor:pointer;border:1px solid rgba(148,163,184,.2);color:#64748b;
          background:rgba(15,23,42,.6);transition:.2s}}
    .tab.active{{border-color:#38bdf8;background:rgba(56,189,248,.15);color:#38bdf8}}
    .vol-card{{background:rgba(15,23,42,.9);border:1px solid rgba(148,163,184,.2);
               border-radius:16px;padding:24px;margin-top:24px}}
    .vol-card h3{{font-size:1rem;font-weight:700;color:#bfdbfe;margin-bottom:4px}}
    .vol-card .sub{{font-size:.8rem;color:#64748b;margin-bottom:18px}}
    .vol-diagram{{background:#020617;border:1px solid rgba(148,163,184,.15);
                  border-radius:12px;padding:20px;font-family:"Courier New",monospace;
                  font-size:.82rem;line-height:1.9;color:#94a3b8;margin:14px 0}}
    .vol-diagram .hl{{color:#38bdf8}}
    .vol-diagram .hl2{{color:#34d399}}
    .vol-diagram .hl3{{color:#fbbf24}}
    .info-grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-top:14px}}
    .info-box{{border-radius:10px;padding:14px 16px;border:1px solid}}
    .info-box h4{{font-size:.82rem;font-weight:700;margin-bottom:6px}}
    .info-box p{{font-size:.78rem;line-height:1.6;color:#94a3b8}}
  </style>
</head>
<body>
<div class="container" style="max-width:1020px">

  <!-- Header -->
  <div class="header">
    <h1>Sinh Vien - Relational Database</h1>
    <p>MariaDB · studentdb.students · CRUD Operations</p>
    <div class="db-badge">MariaDB · {db_host} · {db_name}</div>
  </div>

  {notif_html}

  <!-- CRUD Forms -->
  <div class="form-card">
    <div class="tabs">
      <div class="tab active" id="tab-add" onclick="showTab('add')">+ Them sinh vien</div>
      <div class="tab" id="tab-edit" onclick="showTab('edit')">Chinh sua</div>
    </div>

    <!-- ADD FORM -->
    <div id="panel-add">
      <form method="GET" action="/api/students-db">
        <input type="hidden" name="action" value="add"/>
        <div class="form-grid">
          <div class="form-group">
            <label>Ma Sinh Vien *</label>
            <input name="student_id" placeholder="VD: ST004" required/>
          </div>
          <div class="form-group">
            <label>Ho va Ten *</label>
            <input name="fullname" placeholder="VD: Nguyen Van C" required/>
          </div>
          <div class="form-group">
            <label>Ngay Sinh</label>
            <input name="dob" type="date"/>
          </div>
          <div class="form-group">
            <label>Nganh Hoc</label>
            <input name="major" placeholder="VD: Computer Networks"/>
          </div>
        </div>
        <button type="submit" class="btn-submit btn-add" style="margin-top:14px">
          Them Sinh Vien
        </button>
      </form>
    </div>

    <!-- EDIT FORM -->
    <div id="panel-edit" style="display:none">
      <p style="font-size:.82rem;color:#64748b;margin-bottom:12px">
        Bam nut <strong style="color:#38bdf8">Sua</strong> o dong trong bang de dien thong tin vao day.
      </p>
      <form method="GET" action="/api/students-db">
        <input type="hidden" name="action" value="update"/>
        <div class="form-grid">
          <div class="form-group">
            <label>ID (tu dong)</label>
            <input id="edit-id" name="id" readonly
                   style="opacity:.5;cursor:not-allowed"/>
          </div>
          <div class="form-group">
            <label>Ma Sinh Vien</label>
            <input id="edit-stid" name="student_id_display" readonly
                   style="opacity:.5;cursor:not-allowed"/>
          </div>
          <div class="form-group">
            <label>Ho va Ten *</label>
            <input id="edit-name" name="fullname" placeholder="Ho va ten" required/>
          </div>
          <div class="form-group">
            <label>Ngay Sinh</label>
            <input id="edit-dob" name="dob" type="date"/>
          </div>
          <div class="form-group">
            <label>Nganh Hoc</label>
            <input id="edit-major" name="major" placeholder="Nganh hoc"/>
          </div>
        </div>
        <button type="submit" class="btn-submit btn-update" style="margin-top:14px">
          Luu Thay Doi
        </button>
      </form>
    </div>
  </div>

  <!-- Data Table -->
  <div class="card">
    <div class="card-head">
      <span>Bang sinh vien <span class="pill">{len(data)}</span></span>
      <span class="api-tag">GET /api/students-db</span>
    </div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th style="width:50px">#</th>
            <th>Ma SV</th>
            <th>Ho Ten</th>
            <th>Ngay Sinh</th>
            <th>Nganh Hoc</th>
            <th style="width:130px">Thao Tac</th>
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
    </div>
    <div class="foot">
      <span>Tong cong <strong style="color:#e2e8f0">{len(data)}</strong> sinh vien</span>
      <span>Nguon: <code style="color:#34d399">MariaDB {db_host}/{db_name}</code></span>
    </div>
  </div>

  <footer>&copy; 2026 · MyMiniCloud · Tran Huu Nhan - Do Van Trong - Nguyen Yen Phung</footer>
</div>

<script>
function showTab(name) {{
  document.getElementById('panel-add').style.display  = name==='add'  ? 'block' : 'none';
  document.getElementById('panel-edit').style.display = name==='edit' ? 'block' : 'none';
  document.getElementById('tab-add').classList.toggle('active',  name==='add');
  document.getElementById('tab-edit').classList.toggle('active', name==='edit');
}}

function fillEdit(id, stid, name, dob, major) {{
  document.getElementById('edit-id').value    = id;
  document.getElementById('edit-stid').value  = stid;
  document.getElementById('edit-name').value  = name;
  document.getElementById('edit-dob').value   = dob;
  document.getElementById('edit-major').value = major;
  showTab('edit');
  document.querySelector('.form-card').scrollIntoView({{behavior:'smooth'}});
}}
</script>
</body></html>"""

    return html, 200, {"Content-Type": "text/html; charset=utf-8"}


# ── Shared CSS ────────────────────────────────────────────────────────────────
def _common_css():
    return """
    *{box-sizing:border-box;margin:0;padding:0;
      font-family:system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif}
    body{min-height:100vh;background:radial-gradient(circle at top,#1d4ed8,#020617 55%);
         color:#e5e7eb;padding:32px 20px}
    .container{max-width:900px;margin:0 auto}
    .header{margin-bottom:22px}
    .header h1{font-size:1.55rem;font-weight:700;color:#bfdbfe}
    .header p{font-size:.8rem;color:#64748b;margin-top:4px}
    .db-badge{display:inline-flex;align-items:center;gap:6px;margin-top:8px;
              background:rgba(52,211,153,.12);border:1px solid rgba(52,211,153,.3);
              color:#34d399;font-size:.75rem;font-weight:600;padding:3px 10px;border-radius:999px}
    .card{background:rgba(15,23,42,.95);border:1px solid rgba(148,163,184,.2);
          border-radius:20px;overflow:hidden;box-shadow:0 24px 60px rgba(2,6,23,.7)}
    .card-head{padding:16px 22px;border-bottom:1px solid rgba(148,163,184,.18);
               display:flex;align-items:center;justify-content:space-between;
               background:rgba(29,78,216,.25)}
    .card-head span{font-size:.93rem;font-weight:600;color:#bfdbfe;display:flex;align-items:center;gap:8px}
    .pill{background:rgba(56,189,248,.2);border:1px solid rgba(56,189,248,.35);
          color:#38bdf8;font-size:.76rem;font-weight:700;padding:2px 10px;border-radius:999px}
    .api-tag{font-family:"Courier New",monospace;font-size:.76rem;color:#64748b;
             background:rgba(15,23,42,.7);border:1px solid rgba(148,163,184,.2);
             padding:4px 12px;border-radius:999px}
    .table-wrap{overflow-x:auto}
    table{width:100%;border-collapse:collapse}
    thead tr{background:rgba(29,78,216,.45);border-bottom:2px solid rgba(56,189,248,.35)}
    th{text-align:left;padding:13px 20px;font-size:.74rem;font-weight:700;
       text-transform:uppercase;letter-spacing:.09em;color:#38bdf8;white-space:nowrap}
    th:first-child{text-align:center}
    tbody tr:hover{background:rgba(56,189,248,.1)!important}
    .foot{padding:13px 22px;border-top:1px solid rgba(148,163,184,.15);
          display:flex;align-items:center;justify-content:space-between;
          font-size:.77rem;color:#475569;background:rgba(15,23,42,.4);flex-wrap:wrap;gap:6px}
    footer{margin-top:22px;text-align:center;font-size:.76rem;color:#334155}
    """



def _error_page(err, host, db):
    return f"""<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"/>
<title>Loi ket noi DB</title>
<style>body{{font-family:system-ui,sans-serif;background:#020617;color:#f87171;
  display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px}}
.box{{background:rgba(248,113,113,.08);border:1px solid rgba(248,113,113,.3);
  border-radius:16px;padding:32px 40px;max-width:560px;text-align:center}}
h2{{font-size:1.3rem;margin-bottom:10px}}code{{background:rgba(248,113,113,.15);
  padding:2px 8px;border-radius:6px;font-size:.85rem}}</style></head>
<body><div class="box">
  <h2>Khong the ket noi toi MariaDB</h2>
  <p>Host: <code>{host}</code> &nbsp;|&nbsp; DB: <code>{db}</code></p>
  <p style="margin-top:12px;font-size:.85rem;color:#94a3b8">Chi tiet: <code>{err}</code></p>
</div></body></html>"""


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8081)
