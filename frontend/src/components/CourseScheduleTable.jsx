import { useEffect, useState } from "react";
import axios from "axios";

export default function CourseScheduleTable() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("http://127.0.0.1:8000/courses/schedule-preview")
      .then((res) => setCourses(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Calendario de Cursos</h2>
      {loading ? (
        <p>Cargando...</p>
      ) : (
        <table className="w-full table-auto border border-gray-300 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">Curso</th>
              <th className="border p-2">Profesores</th>
              <th className="border p-2">Inicio</th>
              <th className="border p-2">Horario</th>
              <th className="border p-2">Sesiones programadas</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((c, idx) => (
              <tr key={idx}>
                <td className="border p-2">{c.course_name}</td>
                <td className="border p-2">{c.professors.join(", ")}</td>
                <td className="border p-2">{c.start_date || "—"}</td>
                <td className="border p-2">{c.schedule}</td>
                <td className="border p-2">
                  {c.sessions.slice(0, 5).join(", ")}{c.sessions.length > 5 ? "..." : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
