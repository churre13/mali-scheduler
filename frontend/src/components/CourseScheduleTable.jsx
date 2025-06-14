import { useEffect, useState } from "react";
import axios from "axios";
import EditCourseDrawer from "./EditCourseDrawer"; // 👈 Asegúrate que esté en la misma carpeta

export default function CourseScheduleTable() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const fetchCourses = () => {
    setLoading(true);
    axios.get("http://127.0.0.1:8000/courses/")
      .then((res) => setCourses(res.data))
      .catch((err) => console.error("Error cargando cursos:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCourses();
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
              <th className="border p-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((c, idx) => (
              <tr key={idx}>
                <td className="border p-2">{c.name}</td>
                <td className="border p-2">{c.professors?.map(p => p.name).join(", ")}</td>
                <td className="border p-2">{c.start_date || "—"}</td>
                <td className="border p-2">{c.schedule}</td>
                <td className="border p-2">
                  <button
                    className="text-blue-600 underline"
                    onClick={() => setSelectedCourse(c)}
                  >
                    ✏️ Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {selectedCourse && (
        <EditCourseDrawer
          course={selectedCourse}
          onClose={() => setSelectedCourse(null)}
          onUpdated={() => {
            fetchCourses();
            setSelectedCourse(null);
          }}
        />
      )}
    </div>
  );
}
