import { useEffect, useState } from "react";
import axios from "axios";

const statusOptions = [
  "Programada",
  "Cancelada",
  "Recuperación",
  "Confirmada",
  "Falta profe",
  "Pendiente",
];

export default function AcademicTable({ moduleId }) {
  const [sessions, setSessions] = useState([]);
  const [newSession, setNewSession] = useState({
    session_number: "",
    date: "",
    status: "Programada",
    extra_note: "",
  });

  const fetchSessions = async () => {
    try {
      const res = await axios.get(`http://127.0.0.1:8000/sessions/by-module/${moduleId}`);
      setSessions(res.data);
    } catch (err) {
      console.error("Error al obtener sesiones", err);
    }
  };

  const createSession = async () => {
    try {
      await axios.post(`http://127.0.0.1:8000/sessions/`, {
        ...newSession,
        course_module_id: moduleId,
      });
      setNewSession({ session_number: "", date: "", status: "Programada", extra_note: "" });
      fetchSessions();
    } catch (err) {
      console.error("Error al crear sesión", err);
    }
  };

  const updateSession = async (id, field, value) => {
    try {
      await axios.put(`http://127.0.0.1:8000/sessions/${id}`, {
        [field]: value,
      });
      fetchSessions();
    } catch (err) {
      console.error("Error al actualizar sesión", err);
    }
  };

  const deleteSession = async (id) => {
    if (!confirm("¿Eliminar esta sesión?")) return;
    try {
      await axios.delete(`http://127.0.0.1:8000/sessions/${id}`);
      fetchSessions();
    } catch (err) {
      console.error("Error al eliminar sesión", err);
    }
  };

  useEffect(() => {
    if (moduleId) {
      fetchSessions();
    }
  }, [moduleId]);

  return (
    <div className="mt-6 bg-white p-4 rounded shadow-md">
      <h3 className="text-lg font-semibold mb-4">Sesiones del módulo</h3>

      <table className="w-full table-auto border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">#</th>
            <th className="border p-2">Fecha</th>
            <th className="border p-2">Estado</th>
            <th className="border p-2">Observaciones</th>
            <th className="border p-2">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((s) => (
            <tr key={s.id}>
              <td className="border p-2">{s.session_number}</td>
              <td className="border p-2">
                <input
                  type="date"
                  className="w-full"
                  value={s.date}
                  onChange={(e) => updateSession(s.id, "date", e.target.value)}
                />
              </td>
              <td className={`border p-2`}>
  <select
    className={`w-full p-1 rounded ${getStatusColor(s.status)}`}
    value={s.status}
    onChange={(e) => updateSession(s.id, "status", e.target.value)}
  >
    {statusOptions.map((opt) => (
      <option key={opt} value={opt}>
        {opt}
      </option>
    ))}
  </select>
</td>
              <td className="border p-2">
                <input
                  type="text"
                  className="w-full"
                  value={s.extra_note || ""}
                  onChange={(e) => updateSession(s.id, "extra_note", e.target.value)}
                />
              </td>
              <td className="border p-2 text-center">
                <button
                  onClick={() => deleteSession(s.id)}
                  className="text-red-600 hover:underline"
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}

          <tr className="bg-gray-50">
            <td className="border p-2">
              <input
                type="number"
                className="w-full"
                value={newSession.session_number}
                onChange={(e) => setNewSession({ ...newSession, session_number: parseInt(e.target.value) })}
              />
            </td>
            <td className="border p-2">
              <input
                type="date"
                className="w-full"
                value={newSession.date}
                onChange={(e) => setNewSession({ ...newSession, date: e.target.value })}
              />
            </td>
            <td className={`border p-2`}>
  <select
    className={`w-full p-1 rounded ${getStatusColor(s.status)}`}
    value={s.status}
    onChange={(e) => updateSession(s.id, "status", e.target.value)}
  >
    {statusOptions.map((opt) => (
      <option key={opt} value={opt}>
        {opt}
      </option>
    ))}
  </select>
</td>
            <td className="border p-2">
              <input
                type="text"
                className="w-full"
                placeholder="Comentario extra"
                value={newSession.extra_note}
                onChange={(e) => setNewSession({ ...newSession, extra_note: e.target.value })}
              />
            </td>
            <td className="border p-2 text-center">
              <button
                onClick={createSession}
                className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
              >
                Agregar
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

const getStatusColor = (status) => {
  switch (status) {
    case "Programada":
      return "bg-blue-100 text-blue-800";
    case "Cancelada":
      return "bg-red-100 text-red-800";
    case "Recuperación":
      return "bg-yellow-100 text-yellow-800";
    case "Confirmada":
      return "bg-green-100 text-green-800";
    case "Falta profe":
      return "bg-orange-100 text-orange-800";
    case "Pendiente":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-white";
  }
};
