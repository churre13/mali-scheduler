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
  
  // New state for module management
  const [expandedCourses, setExpandedCourses] = useState(new Set());
  const [courseModules, setCourseModules] = useState({});
  const [loadingModules, setLoadingModules] = useState({});

  // Sorting state
  const [sortConfig, setSortConfig] = useState({ 
    key: null, 
    direction: 'asc' 
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [coursesRes, professorsRes] = await Promise.all([
        axios.get("http://127.0.0.1:8000/courses/"),
        axios.get("http://127.0.0.1:8000/professors/")
      ]);
      
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

  // Fetch modules for a specific course
  const fetchCourseModules = async (courseId) => {
    if (courseModules[courseId]) return; // Already loaded
    
    setLoadingModules(prev => ({ ...prev, [courseId]: true }));
    try {
      const response = await axios.get(`http://127.0.0.1:8000/courses/${courseId}/modules-with-professors`);
      setCourseModules(prev => ({ ...prev, [courseId]: response.data }));
    } catch (error) {
      console.error("Error fetching course modules:", error);
    } finally {
      setLoadingModules(prev => ({ ...prev, [courseId]: false }));
    }
  };

  // Toggle course expansion
  const toggleCourseExpansion = async (courseId) => {
    const newExpanded = new Set(expandedCourses);
    if (newExpanded.has(courseId)) {
      newExpanded.delete(courseId);
    } else {
      newExpanded.add(courseId);
      await fetchCourseModules(courseId);
    }
    setExpandedCourses(newExpanded);
  };

  // Assign professor to module
  const assignProfessorToModule = async (moduleId, professorId) => {
    try {
      await axios.put(`http://127.0.0.1:8000/modules/${moduleId}/assign-professor`, null, {
        params: { professor_id: professorId }
      });
      
      // Refresh the modules for the affected course
      const courseId = Object.keys(courseModules).find(id => 
        courseModules[id].modules.some(m => m.id === moduleId)
      );
      if (courseId) {
        delete courseModules[courseId]; // Force reload
        await fetchCourseModules(parseInt(courseId));
      }
    } catch (error) {
      console.error("Error assigning professor to module:", error);
      alert("Error al asignar profesor al módulo");
    }
  };

  // Sorting functions (same as before)
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedCourses = () => {
    if (!sortConfig.key) return courses;

    return [...courses].sort((a, b) => {
      let aValue, bValue;

      switch (sortConfig.key) {
        case 'name':
          aValue = a.name?.toLowerCase() || '';
          bValue = b.name?.toLowerCase() || '';
          break;
        case 'start_date':
          aValue = a.start_date ? new Date(a.start_date) : new Date(0);
          bValue = b.start_date ? new Date(b.start_date) : new Date(0);
          break;
        case 'schedule':
          aValue = a.schedule?.toLowerCase() || '';
          bValue = b.schedule?.toLowerCase() || '';
          break;
        case 'category':
          aValue = a.category?.toLowerCase() || '';
          bValue = b.category?.toLowerCase() || '';
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  const getSortIndicator = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <span className="text-gray-400 ml-1">⇅</span>;
    }
    return sortConfig.direction === 'asc' ? 
      <span className="text-blue-600 ml-1">↑</span> : 
      <span className="text-blue-600 ml-1">↓</span>;
  };

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
    setSelectedCourse(course);
    setShowEditDrawer(true);
  };

  const handleCloseDrawer = () => {
    setSelectedCourse(null);
    setShowEditDrawer(false);
    fetchData();
    // Refresh expanded course modules
    expandedCourses.forEach(courseId => {
      delete courseModules[courseId];
      fetchCourseModules(courseId);
    });
  };

  const handleCloseProfessorSchedule = () => {
    setSelectedProfessor(null);
    setShowProfessorSchedule(false);
    setProfessorSchedule([]);
  };

  const sortedCourses = getSortedCourses();

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
          {sortConfig.key && (
            <div className="text-xs mt-1">
              Ordenado por: {sortConfig.key} ({sortConfig.direction === 'asc' ? 'A-Z' : 'Z-A'})
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {/* Expand/Collapse column */}
              <th className="text-left p-4 font-semibold text-gray-700 border-b w-12">
                <span className="text-xs">Módulos</span>
              </th>

              {/* Sortable Course Name */}
              <th className="text-left p-4 font-semibold text-gray-700 border-b">
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center hover:text-blue-600 transition-colors"
                >
                  Curso
                  {getSortIndicator('name')}
                </button>
              </th>

              {/* Non-sortable Professors */}
              <th className="text-left p-4 font-semibold text-gray-700 border-b">
                Profesores
                <span className="text-xs text-gray-500 block font-normal">
                  (no ordenable)
                </span>
              </th>

              {/* Sortable Start Date */}
              <th className="text-left p-4 font-semibold text-gray-700 border-b">
                <button
                  onClick={() => handleSort('start_date')}
                  className="flex items-center hover:text-blue-600 transition-colors"
                >
                  Inicio
                  {getSortIndicator('start_date')}
                </button>
              </th>

              {/* Sortable Schedule */}
              <th className="text-left p-4 font-semibold text-gray-700 border-b">
                <button
                  onClick={() => handleSort('schedule')}
                  className="flex items-center hover:text-blue-600 transition-colors"
                >
                  Horario
                  {getSortIndicator('schedule')}
                </button>
              </th>

              {/* Sortable Category */}
              <th className="text-left p-4 font-semibold text-gray-700 border-b">
                <button
                  onClick={() => handleSort('category')}
                  className="flex items-center hover:text-blue-600 transition-colors"
                >
                  Categoría
                  {getSortIndicator('category')}
                </button>
              </th>

              {/* Non-sortable Actions */}
              <th className="text-left p-4 font-semibold text-gray-700 border-b">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {sortedCourses.map((course, idx) => (
              <>
                {/* Main course row */}
                <tr key={course.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-25 hover:bg-gray-50"}>
                  {/* Expand/Collapse button */}
                  <td className="p-4 border-b">
                    <button
                      onClick={() => toggleCourseExpansion(course.id)}
                      className="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded hover:bg-gray-100"
                      title={expandedCourses.has(course.id) ? "Ocultar módulos" : "Ver módulos"}
                    >
                      {expandedCourses.has(course.id) ? "▼" : "▶"}
                    </button>
                  </td>

                  <td className="p-4 border-b">
                    <div className="font-medium text-gray-900">{course.name}</div>
                    <div className="text-sm text-gray-500">
                      {course.duration_months} meses • {course.modules?.length || 0} módulos
                    </div>
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
                        {new Date(course.start_date).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
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
                        {getCategoryDisplayName(course.category)}
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

                {/* Expanded modules row */}
                {expandedCourses.has(course.id) && (
                  <tr key={`${course.id}-modules`}>
                    <td colSpan="7" className="bg-gray-50 border-b">
                      <div className="p-4">
                        <ModulesTable
                          courseId={course.id}
                          modules={courseModules[course.id]?.modules || []}
                          professors={professors}
                          loading={loadingModules[course.id]}
                          onAssignProfessor={assignProfessorToModule}
                          onDeleteModule={(moduleId, moduleName) => confirmDelete({
                          type: 'module',
                          id: moduleId,
                          name: moduleName,
                          courseId: course.id,
                          courseName: course.name
                        })}
                        onUnassignProfessor={(moduleId, professorName) => confirmDelete({
                          type: 'professor-from-module',
                          moduleId: moduleId,
                          professorName: professorName,
                          courseId: course.id
                        })}
                          />
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>

        {/* Sorting info footer */}
        {sortedCourses.length > 0 && (
          <div className="px-4 py-3 bg-gray-50 border-t text-xs text-gray-500 flex justify-between items-center">
            <span>
              Mostrando {sortedCourses.length} curso{sortedCourses.length !== 1 ? 's' : ''}
            </span>
            {sortConfig.key && (
              <button
                onClick={() => setSortConfig({ key: null, direction: 'asc' })}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Limpiar ordenamiento
              </button>
            )}
          </div>
        )}
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
    onDeleteProfessor={(professorId, professorName) => confirmDelete({
      type: 'professor',
      id: professorId,
      name: professorName
    })}
  />
)}
    </div>
  );
}

// Modules Table Component
function ModulesTable({ courseId, modules, professors, loading, onAssignProfessor, onDeleteModule, onUnassignProfessor }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500">Cargando módulos...</div>
      </div>
    );
  }

  if (!modules || modules.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-lg mb-2">📚</div>
        <div>Este curso no tiene módulos configurados</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="px-4 py-3 bg-gray-100 border-b">
        <h4 className="font-semibold text-gray-800">
          Módulos del Curso ({modules.length})
        </h4>
        <p className="text-sm text-gray-600">
          Asigna profesores específicos a cada módulo
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3 font-medium text-gray-700 border-b">#</th>
              <th className="text-left p-3 font-medium text-gray-700 border-b">Módulo</th>
              <th className="text-left p-3 font-medium text-gray-700 border-b">Profesor Asignado</th>
              <th className="text-left p-3 font-medium text-gray-700 border-b">Horas</th>
              <th className="text-left p-3 font-medium text-gray-700 border-b">Estado Sílabo</th>
              <th className="text-left p-3 font-medium text-gray-700 border-b">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {modules.map((module, idx) => (
              <tr key={module.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-25"}>
                <td className="p-3 border-b">
                  <span className="inline-flex items-center justify-center w-6 h-6 bg-gray-100 rounded-full text-xs font-medium">
                    {module.order || idx + 1}
                  </span>
                </td>
                
                <td className="p-3 border-b">
                  <div className="font-medium text-gray-900">{module.name}</div>
                  {module.observations && (
                    <div className="text-xs text-gray-500 mt-1">{module.observations}</div>
                  )}
                </td>
                
                <td className="p-3 border-b">
                  <select
                    value={module.professor?.id || ""}
                    onChange={(e) => onAssignProfessor(module.id, e.target.value || null)}
                    className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Sin asignar</option>
                    {professors.map((prof) => (
                      <option key={prof.id} value={prof.id}>
                        {prof.name}
                      </option>
                    ))}
                  </select>
                </td>
                
                <td className="p-3 border-b">
                  <span className="text-gray-600">{module.hours || 2}h</span>
                </td>
                
                <td className="p-3 border-b">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    module.syllabus_status === 'hay documento' 
                      ? 'bg-green-100 text-green-800'
                      : module.syllabus_status === 'no hay documento'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {module.syllabus_status || 'Pendiente'}
                  </span>
                </td>
                
                <td className="p-3 border-b">
                  <div className="flex gap-1">
                    {module.professor && (
                      <button
                        onClick={() => onAssignProfessor(module.id, null)}
                        className="text-red-600 hover:text-red-800 text-xs px-2 py-1 rounded hover:bg-red-50"
                        title="Desasignar profesor"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="px-4 py-3 bg-gray-50 border-t text-xs text-gray-600">
        <div className="flex justify-between items-center">
          <span>
            {modules.filter(m => m.professor).length} de {modules.length} módulos asignados
          </span>
          <span>
            Total: {modules.reduce((acc, m) => acc + (m.hours || 2), 0)} horas
          </span>
        </div>
      </div>
    </div>
  );
}

// Helper function to get readable category names
function getCategoryDisplayName(category) {
  const categoryNames = {
    'interiores': 'Arquitectura e Interiores',
    'escenicas': 'Artes Escénicas',
    'graficas': 'Artes Gráficas',
    'audiovisual': 'Audiovisual',
    'modas': 'Diseño de Modas',
    'socialmedia': 'IA y Social Media',
    'literatura': 'Literatura',
    'musica': 'Música y Negocios'
  };
  return categoryNames[category] || category;
}

// Enhanced Edit Course Drawer (same as before, keeping it for completeness)
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setError("");
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
      const updateData = {
        ...form,
        professor_ids: selectedProfessors
      };

      await axios.put(`http://127.0.0.1:8000/courses/${course.id}`, updateData);
      
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

// Professor Schedule Modal with enhanced module view
function ProfessorScheduleModal({ professor, schedule, onClose, onDeleteProfessor }) {
  const [professorModules, setProfessorModules] = useState([]);
  const [loadingModules, setLoadingModules] = useState(false);
  const [activeTab, setActiveTab] = useState('schedule');

  useEffect(() => {
    const fetchProfessorModules = async () => {
      setLoadingModules(true);
      try {
        const response = await axios.get(`http://127.0.0.1:8000/professors/${professor.id}/modules`);
        setProfessorModules(response.data.modules);
      } catch (error) {
        console.error("Error fetching professor modules:", error);
        setProfessorModules([]);
      } finally {
        setLoadingModules(false);
      }
    };

    fetchProfessorModules();
  }, [professor.id]);

  const groupedSchedule = schedule.reduce((acc, session) => {
    if (!acc[session.course_name]) {
      acc[session.course_name] = [];
    }
    acc[session.course_name].push(session);
    return acc;
  }, {});

  const groupedModules = professorModules.reduce((acc, module) => {
    if (!acc[module.course_name]) {
      acc[module.course_name] = [];
    }
    acc[module.course_name].push(module);
    return acc;
  }, {});

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose}></div>
      
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[85vh] overflow-hidden">
          <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {professor.name}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {schedule.length} sesiones • {professorModules.length} módulos asignados
                </p>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">
                ×
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-4 mt-4">
              <button
                onClick={() => setActiveTab('schedule')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === 'schedule'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                📅 Calendario de Sesiones
              </button>
              <button
                onClick={() => setActiveTab('modules')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === 'modules'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                📚 Módulos Asignados
              </button>
            </div>
          </div>
          
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {activeTab === 'schedule' && (
              <div>
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
            )}

            {activeTab === 'modules' && (
              <div>
                {loadingModules ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-gray-500">Cargando módulos...</div>
                  </div>
                ) : Object.keys(groupedModules).length > 0 ? (
                  <div className="space-y-6">
                    {Object.entries(groupedModules).map(([courseName, modules]) => (
                      <div key={courseName} className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-gray-50 px-4 py-3 border-b">
                          <h4 className="font-semibold text-gray-900">{courseName}</h4>
                          <p className="text-sm text-gray-600">
                            {modules.length} módulo{modules.length !== 1 ? 's' : ''} • 
                            {modules.reduce((acc, m) => acc + (m.hours || 2), 0)} horas totales
                          </p>
                        </div>
                        <div className="p-4">
                          <div className="grid gap-3">
                            {modules.map((module) => (
                              <div key={module.module_id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                                <div>
                                  <div className="font-medium text-gray-900">
                                    {module.module_name}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    Orden: {module.module_order} • {module.hours || 2} horas
                                  </div>
                                </div>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  module.syllabus_status === 'hay documento' 
                                    ? 'bg-green-100 text-green-800'
                                    : module.syllabus_status === 'no hay documento'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {module.syllabus_status || 'Pendiente'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-gray-500 text-6xl mb-4">📚</div>
                    <div className="text-gray-600 text-lg">
                      No hay módulos asignados a {professor.name}
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Asigna módulos específicos desde la vista de cursos
                    </p>
                  </div>
                )}
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