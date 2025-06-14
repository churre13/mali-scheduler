import { useEffect, useState } from "react";
import axios from "axios";

export default function CourseScheduleTable() {
  const [courses, setCourses] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedProfessor, setSelectedProfessor] = useState(null);
  const [showEditDrawer, setShowEditDrawer] = useState(false);
  const [showProfessorSchedule, setShowProfessorSchedule] = useState(false);
  const [professorSchedule, setProfessorSchedule] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [coursesRes, professorsRes] = await Promise.all([
        axios.get("http://127.0.0.1:8000/courses/"),
        axios.get("http://127.0.0.1:8000/professors/")
      ]);
      
      console.log("Courses data:", coursesRes.data); // Debug log
      setCourses(coursesRes.data);
      setProfessors(professorsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleProfessorClick = async (professor) => {
    setSelectedProfessor(professor);
    try {
      const response = await axios.get(`http://127.0.0.1:8000/professors/${professor.id}/schedule`);
      setProfessorSchedule(response.data);
      setShowProfessorSchedule(true);
    } catch (error) {
      console.error("Error fetching professor schedule:", error);
      setProfessorSchedule([]);
      setShowProfessorSchedule(true);
    }
  };

  const handleEditCourse = (course) => {
    console.log("Editing course:", course); // Debug log
    setSelectedCourse(course);
    setShowEditDrawer(true);
  };

  const handleCloseDrawer = () => {
    setSelectedCourse(null);
    setShowEditDrawer(false);
    fetchData();
  };

  const handleCloseProfessorSchedule = () => {
    setSelectedProfessor(null);
    setShowProfessorSchedule(false);
    setProfessorSchedule([]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Cargando cursos y profesores...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Calendario de Cursos</h2>
        <div className="text-sm text-gray-500">
          {courses.length} cursos • {professors.length} profesores
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-4 font-semibold text-gray-700 border-b">Curso</th>
              <th className="text-left p-4 font-semibold text-gray-700 border-b">Profesores</th>
              <th className="text-left p-4 font-semibold text-gray-700 border-b">Inicio</th>
              <th className="text-left p-4 font-semibold text-gray-700 border-b">Horario</th>
              <th className="text-left p-4 font-semibold text-gray-700 border-b">Categoría</th>
              <th className="text-left p-4 font-semibold text-gray-700 border-b">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course, idx) => (
              <tr key={course.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-25"}>
                <td className="p-4 border-b">
                  <div className="font-medium text-gray-900">{course.name}</div>
                  <div className="text-sm text-gray-500">{course.duration_months} meses</div>
                </td>
                <td className="p-4 border-b">
                  {course.professors && course.professors.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {course.professors.map((prof, profIdx) => (
                        <button
                          key={profIdx}
                          onClick={() => handleProfessorClick(prof)}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors cursor-pointer"
                        >
                          {prof.name}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-400 italic">Sin asignar</span>
                  )}
                </td>
                <td className="p-4 border-b">
                  {course.start_date ? (
                    <span className="text-gray-900">
                      {new Date(course.start_date).toLocaleDateString('es-ES')}
                    </span>
                  ) : (
                    <span className="text-gray-400 italic">Sin fecha</span>
                  )}
                </td>
                <td className="p-4 border-b">
                  <span className="text-gray-700">{course.schedule || "No definido"}</span>
                </td>
                <td className="p-4 border-b">
                  {course.category ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {course.category}
                    </span>
                  ) : (
                    <span className="text-gray-400 italic">Sin categoría</span>
                  )}
                </td>
                <td className="p-4 border-b">
                  <button
                    onClick={() => handleEditCourse(course)}
                    className="inline-flex items-center px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                  >
                    ✏️ Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Course Drawer */}
      {showEditDrawer && selectedCourse && (
        <EnhancedEditCourseDrawer
          course={selectedCourse}
          professors={professors}
          onClose={handleCloseDrawer}
        />
      )}

      {/* Professor Schedule Modal */}
      {showProfessorSchedule && selectedProfessor && (
        <ProfessorScheduleModal
          professor={selectedProfessor}
          schedule={professorSchedule}
          onClose={handleCloseProfessorSchedule}
        />
      )}
    </div>
  );
}

// Enhanced Edit Course Drawer with better error handling
function EnhancedEditCourseDrawer({ course, professors, onClose }) {
  const [form, setForm] = useState({
    name: course.name || "",
    duration_months: course.duration_months || 1,
    start_date: course.start_date || "",
    schedule: course.schedule || "",
    category: course.category || "",
  });
  const [selectedProfessors, setSelectedProfessors] = useState(
    course.professors?.map(p => p.id) || []
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  console.log("Current course data:", course); // Debug log
  console.log("Form state:", form); // Debug log
  console.log("Selected professors:", selectedProfessors); // Debug log

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setError(""); // Clear error when user makes changes
  };

  const handleProfessorToggle = (professorId) => {
    setSelectedProfessors(prev =>
      prev.includes(professorId)
        ? prev.filter(id => id !== professorId)
        : [...prev, professorId]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    
    try {
      // Prepare the data with professor_ids
      const updateData = {
        ...form,
        professor_ids: selectedProfessors
      };

      console.log("Sending update data:", updateData); // Debug log

      // Update course with all data including professors
      const response = await axios.put(`http://127.0.0.1:8000/courses/${course.id}`, updateData);
      
      console.log("Update response:", response.data); // Debug log
      
      alert("Curso actualizado exitosamente");
      onClose();
    } catch (error) {
      console.error("Error updating course:", error);
      
      if (error.response?.status === 422) {
        console.error("Validation error details:", error.response.data);
        setError(`Error de validación: ${JSON.stringify(error.response.data.detail || error.response.data)}`);
      } else {
        setError(`Error al actualizar el curso: ${error.message}`);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-30 z-40" onClick={onClose}></div>
      
      <div className="fixed top-0 right-0 w-full max-w-lg h-full bg-white shadow-xl z-50 overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-900">Editar Curso</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">
              ×
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Curso
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duración (meses)
                </label>
                <input
                  type="number"
                  name="duration_months"
                  value={form.duration_months}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Inicio
                </label>
                <input
                  type="date"
                  name="start_date"
                  value={form.start_date}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Horario
              </label>
              <input
                type="text"
                name="schedule"
                value={form.schedule}
                onChange={handleInputChange}
                placeholder="Ej: Lunes y Miércoles 8:00 pm - 10:00 pm"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoría
              </label>
              <select
                name="category"
                value={form.category}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Selecciona una categoría</option>
                <option value="interiores">Arquitectura y Diseño de Interiores</option>
                <option value="escenicas">Artes Escénicas y Eventos</option>
                <option value="graficas">Artes Gráficas e Ilustración</option>
                <option value="audiovisual">Comunicación Audiovisual</option>
                <option value="modas">Diseño de Modas</option>
                <option value="socialmedia">IA y Social Media</option>
                <option value="literatura">Literatura y Escritura Creativa</option>
                <option value="musica">Música y Negocios</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Profesores Asignados ({selectedProfessors.length} seleccionados)
              </label>
              <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
                {professors.map((professor) => (
                  <label key={professor.id} className="flex items-center py-2 cursor-pointer hover:bg-white rounded px-2">
                    <input
                      type="checkbox"
                      checked={selectedProfessors.includes(professor.id)}
                      onChange={() => handleProfessorToggle(professor.id)}
                      className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700 flex-1">{professor.name}</span>
                    <span className="text-xs text-gray-500">
                      {professor.courses?.length || 0} cursos
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-between mt-8 pt-6 border-t">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// Professor Schedule Modal (unchanged)
function ProfessorScheduleModal({ professor, schedule, onClose }) {
  const groupedSchedule = schedule.reduce((acc, session) => {
    if (!acc[session.course_name]) {
      acc[session.course_name] = [];
    }
    acc[session.course_name].push(session);
    return acc;
  }, {});

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose}></div>
      
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
          <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Calendario de {professor.name}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {schedule.length} sesiones programadas • {Object.keys(groupedSchedule).length} cursos
                </p>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">
                ×
              </button>
            </div>
          </div>
          
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {Object.keys(groupedSchedule).length > 0 ? (
              <div className="space-y-6">
                {Object.entries(groupedSchedule).map(([courseName, sessions]) => (
                  <div key={courseName} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b">
                      <h4 className="font-semibold text-gray-900">{courseName}</h4>
                      <p className="text-sm text-gray-600">{sessions.length} sesiones</p>
                    </div>
                    <div className="p-4">
                      <div className="grid gap-3">
                        {sessions.slice(0, 10).map((session) => (
                          <div key={session.session_id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                            <div>
                              <div className="font-medium text-gray-900">
                                {session.module_name} - Sesión {session.session_number}
                              </div>
                              <div className="text-sm text-gray-600">
                                {new Date(session.date).toLocaleDateString('es-ES', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </div>
                            </div>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {session.status}
                            </span>
                          </div>
                        ))}
                        {sessions.length > 10 && (
                          <div className="text-center text-sm text-gray-500 py-2">
                            ... y {sessions.length - 10} sesiones más
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-500 text-6xl mb-4">📅</div>
                <div className="text-gray-600 text-lg">
                  No hay sesiones programadas para {professor.name}
                </div>
              </div>
            )}
          </div>
          
          <div className="p-6 border-t bg-gray-50">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}