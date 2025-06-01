import { useEffect, useState } from "react";
import axios from "axios";

export default function AcademicTable() {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);

  const syllabusOptions = ["hay documento", "no hay documento"];

  useEffect(() => {
    axios.get("http://127.0.0.1:8000/coursemodule/academic-view")
      .then((res) => setModules(res.data))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (id, field, value) => {
    setModules((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Plan Académico por Módulo</h2>
      {loading ? (
        <p>Cargando módulos...</p>
      ) : (
        <table className="w-full table-auto border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">Curso</th>
              <th className="border p-2">Módulo</th>
              <th className="border p-2">Profesor</th>
              <th className="border p-2">Estado del Sílabo</th>
              <th className="border p-2">Observaciones</th>
              <th className="border p-2">Horas</th>
            </tr>
          </thead>
          <tbody>
            {modules.map((mod) => (
              <tr key={mod.id} className="border-t">
                <td className="border p-2">{mod.course_name}</td>
                <td className="border p-2">{mod.module_name}</td>
                <td className="border p-2">{mod.professor_name || "—"}</td>
                <td className="border p-2">
                  <select
                    className="w-full border rounded px-1 py-1"
                    value={mod.syllabus_status || ""}
                    onChange={(e) =>
                      handleChange(mod.id, "syllabus_status", e.target.value)
                    }
                  >
                    <option value="">Seleccionar</option>
                    {syllabusOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="border p-2">
                  <input
                    type="text"
                    className="w-full border rounded px-1 py-1"
                    value={mod.observations || ""}
                    onChange={(e) =>
                      handleChange(mod.id, "observations", e.target.value)
                    }
                  />
                </td>
                <td className="border p-2">
                  <input
                    type="number"
                    className="w-full border rounded px-1 py-1"
                    value={mod.hours || ""}
                    onChange={(e) =>
                      handleChange(mod.id, "hours", parseInt(e.target.value))
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
