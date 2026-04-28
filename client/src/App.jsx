import { useState, useEffect, useCallback } from "react";
import { api } from "./api";

function getTodayStr() {
  return new Date().toISOString().split("T")[0];
}

function getTomorrowStr() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

function getDayAfterTomorrowStr() {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  return d.toISOString().split("T")[0];
}

function formatDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function getDaysDiff(dateStr) {
  const today = new Date(getTodayStr());
  const target = new Date(dateStr);
  const diff = Math.round((target - today) / 86400000);
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  if (diff === -1) return "yesterday";
  if (diff > 0) return `in ${diff}d`;
  return `${Math.abs(diff)}d ago`;
}

const CATEGORIES = ["Study", "Project", "Health", "Work", "Life"];
const CAT_COLORS = {
  Study:   "#4ade80",
  Project: "#60a5fa",
  Health:  "#f472b6",
  Work:    "#fb923c",
  Life:    "#a78bfa",
};

const inputStyle = {
  width: "100%",
  background: "#0a0a0f",
  border: "1px solid #2a2a3a",
  color: "#e2e2e8",
  borderRadius: 10,
  padding: "12px 14px",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
  marginBottom: 2,
  fontFamily: "inherit",
};

export default function App() {
  const [tasks, setTasks]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [view, setView]           = useState("today");
  const [upcomingDate, setUpcomingDate] = useState(getDayAfterTomorrowStr);
  const [filter, setFilter]       = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId]   = useState(null);
  const [form, setForm]       = useState({ title: "", category: "Study", dueDate: getTodayStr(), note: "" });

  const today    = getTodayStr();
  const tomorrow = getTomorrowStr();

  const loadTasks = useCallback(async () => {
    try {
      setError(null);
      const data = await api.getTasks();
      setTasks(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  const activeDate = view === "today" ? today : view === "tomorrow" ? tomorrow : upcomingDate;

  const viewTasks = tasks
    .filter(t => t.dueDate === activeDate)
    .filter(t => filter === "all" || t.category === filter)
    .sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return a.dueDate.localeCompare(b.dueDate);
    });

  const todayTasks = tasks.filter(t => t.dueDate === today);
  const done  = todayTasks.filter(t => t.completed).length;
  const total = todayTasks.length;
  const pct   = total === 0 ? 0 : Math.round((done / total) * 100);

  async function toggleTask(id, current) {
    const updated = await api.updateTask(id, { completed: !current });
    setTasks(ts => ts.map(t => t._id === id ? updated : t));
  }

  async function deleteTask(id) {
    await api.deleteTask(id);
    setTasks(ts => ts.filter(t => t._id !== id));
  }

  async function addOrUpdateTask() {
    if (!form.title.trim()) return;
    if (editId) {
      const updated = await api.updateTask(editId, form);
      setTasks(ts => ts.map(t => t._id === editId ? updated : t));
      setEditId(null);
    } else {
      const task = await api.createTask({ ...form, completed: false, forwarded: false, originalDate: null });
      setTasks(ts => [...ts, task]);
    }
    setForm({ title: "", category: "Study", dueDate: today, note: "" });
    setAddOpen(false);
  }

  function startEdit(task) {
    setEditId(task._id);
    setForm({ title: task.title, category: task.category, dueDate: task.dueDate, note: task.note || "" });
    setAddOpen(true);
  }

  async function forwardToTomorrow(task) {
    const updated = await api.updateTask(task._id, {
      dueDate:      tomorrow,
      forwarded:    true,
      originalDate: task.originalDate || task.dueDate,
    });
    setTasks(ts => ts.map(t => t._id === task._id ? updated : t));
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0f",
      color: "#e2e2e8",
      fontFamily: "'DM Mono', 'Fira Code', monospace",
    }}>
      {/* Top bar */}
      <div style={{
        borderBottom: "1px solid #1e1e2e",
        padding: "18px 24px 14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        background: "#0a0a0f",
        zIndex: 10,
      }}>
        <div>
          <div style={{ fontSize: 11, color: "#555", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 2 }}>
            DAILY OPS
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#f0f0f5", letterSpacing: "-0.02em" }}>
            {formatDate(today)}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: pct === 100 ? "#4ade80" : "#f0f0f5", lineHeight: 1 }}>
              {pct}<span style={{ fontSize: 14, color: "#555" }}>%</span>
            </div>
            <div style={{ fontSize: 10, color: "#444", letterSpacing: "0.08em" }}>{done}/{total} TODAY</div>
          </div>
          <svg width="44" height="44" viewBox="0 0 44 44">
            <circle cx="22" cy="22" r="18" fill="none" stroke="#1e1e2e" strokeWidth="4"/>
            <circle cx="22" cy="22" r="18" fill="none"
              stroke={pct === 100 ? "#4ade80" : "#60a5fa"}
              strokeWidth="4"
              strokeDasharray={`${(pct / 100) * 113} 113`}
              strokeLinecap="round"
              transform="rotate(-90 22 22)"
              style={{ transition: "stroke-dasharray 0.4s ease" }}
            />
          </svg>
        </div>
      </div>

      {/* View tabs */}
      <div style={{ display: "flex", gap: 2, padding: "12px 24px 0", borderBottom: "1px solid #1e1e2e" }}>
        {["today", "tomorrow", "upcoming"].map(v => (
          <button key={v} onClick={() => setView(v)} style={{
            background: view === v ? "#1e1e2e" : "transparent",
            color: view === v ? "#f0f0f5" : "#555",
            border: "none",
            borderRadius: "6px 6px 0 0",
            padding: "7px 16px",
            fontSize: 12,
            cursor: "pointer",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            transition: "all 0.15s",
          }}>{v}</button>
        ))}
      </div>

      {/* Upcoming date picker */}
      {view === "upcoming" && (
        <div style={{ padding: "12px 24px 0" }}>
          <input
            type="date"
            value={upcomingDate}
            onChange={e => setUpcomingDate(e.target.value)}
            style={{ ...inputStyle, colorScheme: "dark", marginBottom: 0 }}
          />
        </div>
      )}

      {/* Category filter pills */}
      <div style={{ display: "flex", gap: 6, padding: "12px 24px", flexWrap: "wrap" }}>
        {["all", ...CATEGORIES].map(c => (
          <button key={c} onClick={() => setFilter(c)} style={{
            background: filter === c ? (c === "all" ? "#333" : CAT_COLORS[c] + "22") : "transparent",
            color:      filter === c ? (c === "all" ? "#f0f0f5" : CAT_COLORS[c]) : "#444",
            border: `1px solid ${filter === c ? (c === "all" ? "#444" : CAT_COLORS[c] + "55") : "#1e1e2e"}`,
            borderRadius: 20,
            padding: "4px 12px",
            fontSize: 11,
            cursor: "pointer",
            letterSpacing: "0.06em",
            textTransform: "capitalize",
          }}>{c}</button>
        ))}
      </div>

      {/* Task list */}
      <div style={{ padding: "0 24px", display: "flex", flexDirection: "column", gap: 8 }}>
        {loading && (
          <div style={{ color: "#333", fontSize: 13, textAlign: "center", padding: "40px 0" }}>Loading…</div>
        )}
        {error && (
          <div style={{ color: "#ef4444", fontSize: 13, textAlign: "center", padding: "40px 0" }}>
            {error} — is the server running?
          </div>
        )}
        {!loading && !error && viewTasks.length === 0 && (
          <div style={{ color: "#333", fontSize: 13, textAlign: "center", padding: "40px 0" }}>
            {view === "today" ? "No tasks for today. Add one." : view === "tomorrow" ? "Nothing scheduled for tomorrow." : `Nothing scheduled for ${formatDate(upcomingDate)}.`}
          </div>
        )}
        {viewTasks.map(task => (
          <TaskCard
            key={task._id}
            task={task}
            today={today}
            onToggle={() => toggleTask(task._id, task.completed)}
            onDelete={() => deleteTask(task._id)}
            onEdit={() => startEdit(task)}
            onForward={() => forwardToTomorrow(task)}
          />
        ))}
      </div>

      {/* Add button */}
      <div style={{ padding: "20px 24px 80px" }}>
        <button
          onClick={() => {
            setEditId(null);
            setForm({ title: "", category: "Study", dueDate: activeDate, note: "" });
            setAddOpen(true);
          }}
          style={{
            width: "100%",
            background: "transparent",
            border: "1px dashed #2a2a3a",
            color: "#444",
            borderRadius: 10,
            padding: "12px",
            fontSize: 13,
            cursor: "pointer",
            letterSpacing: "0.06em",
          }}
        >
          + ADD TASK
        </button>
      </div>

      {/* Add/Edit modal — bottom sheet */}
      {addOpen && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
            display: "flex", alignItems: "flex-end", zIndex: 100,
          }}
          onClick={e => { if (e.target === e.currentTarget) setAddOpen(false); }}
        >
          <div style={{
            background: "#111118",
            border: "1px solid #2a2a3a",
            borderRadius: "16px 16px 0 0",
            padding: "24px",
            width: "100%",
            boxSizing: "border-box",
          }}>
            <div style={{ fontSize: 13, color: "#888", letterSpacing: "0.08em", marginBottom: 16, textTransform: "uppercase" }}>
              {editId ? "Edit Task" : "New Task"}
            </div>
            <input
              placeholder="What needs to be done?"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              onKeyDown={e => e.key === "Enter" && addOrUpdateTask()}
              style={inputStyle}
              autoFocus
            />
            <div style={{ display: "flex", gap: 8, margin: "10px 0" }}>
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => setForm(f => ({ ...f, category: c }))} style={{
                  flex: 1,
                  background: form.category === c ? CAT_COLORS[c] + "22" : "transparent",
                  color: form.category === c ? CAT_COLORS[c] : "#444",
                  border: `1px solid ${form.category === c ? CAT_COLORS[c] + "55" : "#2a2a3a"}`,
                  borderRadius: 8,
                  padding: "6px 4px",
                  fontSize: 10,
                  cursor: "pointer",
                  letterSpacing: "0.04em",
                  fontFamily: "inherit",
                }}>{c}</button>
              ))}
            </div>
            <input
              type="date"
              value={form.dueDate}
              onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
              style={{ ...inputStyle, colorScheme: "dark" }}
            />
            <input
              placeholder="Note (optional)"
              value={form.note}
              onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
              style={{ ...inputStyle, marginTop: 2 }}
            />
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button onClick={() => setAddOpen(false)} style={{
                flex: 1, background: "transparent", border: "1px solid #2a2a3a",
                color: "#555", borderRadius: 10, padding: "12px", fontSize: 13,
                cursor: "pointer", fontFamily: "inherit",
              }}>Cancel</button>
              <button onClick={addOrUpdateTask} style={{
                flex: 2, background: "#60a5fa22", border: "1px solid #60a5fa55",
                color: "#60a5fa", borderRadius: 10, padding: "12px", fontSize: 13,
                cursor: "pointer", letterSpacing: "0.06em", fontFamily: "inherit",
              }}>{editId ? "SAVE" : "ADD"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TaskCard({ task, today, onToggle, onDelete, onEdit, onForward }) {
  const [open, setOpen] = useState(false);
  const isOverdue = task.dueDate < today && !task.completed;
  const isFuture  = task.dueDate > today;
  const color     = CAT_COLORS[task.category] || "#888";

  return (
    <div style={{
      background: task.completed ? "#0d0d12" : "#111118",
      border: `1px solid ${isOverdue ? "#ef444433" : task.completed ? "#1a1a28" : "#1e1e2e"}`,
      borderLeft: `3px solid ${task.completed ? "#2a2a3a" : color}`,
      borderRadius: 10,
      overflow: "hidden",
      opacity: task.completed ? 0.5 : 1,
      transition: "all 0.15s",
    }}>
      <div
        style={{ display: "flex", alignItems: "center", padding: "12px 14px", gap: 12, cursor: "pointer" }}
        onClick={() => setOpen(o => !o)}
      >
        <div
          onClick={e => { e.stopPropagation(); onToggle(); }}
          style={{
            width: 20, height: 20, borderRadius: 6,
            border: `2px solid ${task.completed ? color : "#333"}`,
            background: task.completed ? color + "33" : "transparent",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", flexShrink: 0, transition: "all 0.15s",
          }}
        >
          {task.completed && <span style={{ color, fontSize: 12 }}>✓</span>}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 14,
            color: task.completed ? "#444" : "#e2e2e8",
            textDecoration: task.completed ? "line-through" : "none",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>{task.title}</div>
          <div style={{ display: "flex", gap: 8, marginTop: 4, alignItems: "center" }}>
            <span style={{ fontSize: 10, color, background: color + "18", borderRadius: 4, padding: "1px 6px" }}>
              {task.category}
            </span>
            {task.forwarded && (
              <span style={{ fontSize: 10, color: "#fb923c", background: "#fb923c18", borderRadius: 4, padding: "1px 6px" }}>
                ↪ carried
              </span>
            )}
            <span style={{ fontSize: 10, color: isOverdue ? "#ef4444" : isFuture ? "#888" : "#555" }}>
              {getDaysDiff(task.dueDate)}
            </span>
          </div>
        </div>
        <span style={{ color: "#333", fontSize: 12 }}>{open ? "▲" : "▼"}</span>
      </div>

      {open && (
        <div style={{ borderTop: "1px solid #1a1a28", padding: "10px 14px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
          {task.note && <div style={{ fontSize: 12, color: "#666" }}>{task.note}</div>}
          {task.originalDate && (
            <div style={{ fontSize: 11, color: "#555" }}>Originally due {formatDate(task.originalDate)}</div>
          )}
          {task.completedAt && (
            <div style={{ fontSize: 11, color: "#4ade8077" }}>
              Done at {new Date(task.completedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
            </div>
          )}
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <ActionBtn onClick={onEdit} color="#60a5fa">Edit</ActionBtn>
            {!task.completed && task.dueDate <= today && (
              <ActionBtn onClick={onForward} color="#fb923c">→ Tomorrow</ActionBtn>
            )}
            <ActionBtn onClick={onDelete} color="#ef4444">Delete</ActionBtn>
          </div>
        </div>
      )}
    </div>
  );
}

function ActionBtn({ onClick, color, children }) {
  return (
    <button onClick={onClick} style={{
      background: color + "15",
      border: `1px solid ${color}33`,
      color,
      borderRadius: 6,
      padding: "5px 12px",
      fontSize: 11,
      cursor: "pointer",
      letterSpacing: "0.04em",
      fontFamily: "inherit",
    }}>{children}</button>
  );
}
