import { useEffect, useState } from "react";
import axios from "axios";

export default function ProfessorDetailsModal({ professorId, onClose }) {
  const [professor, setProfessor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("info"); // "info", "courses", "modules"
  
  const [editForm, setEditForm] = useState({
    name: "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    bio: "",
    specialties: "",
    is_active: true
  });

  const fetchProfessorDetails = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`http://127.0.0.1:8000/professors/${professorId}/details`);
      setProfessor(response.data);
      setEditForm({
        name: response.data.name || "",
        first_name: response.data.first_name || "",
        last_name: response.data.last_name || "",
        email: response.data.email || "",
        phone: response.data.phone || "",
        bio: response.data.bio || "",
        specialties: response.data.specialties || "",
        is_active: response.data.is_active
      });
    } catch (error) {
      console.error("Error fetching professor details:", error);
      setError("Error al cargar los detalles del profesor");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfessorDetails();
  }, [professorId]);

  const handleEditToggle = () => {
    if (editing) {
      // Cancel editing - reset form
      setEditForm({
        name: professor.name || "",
        first_name: professor.first_name || "",
        last_name: professor.last_name || "",
        email: professor.email || "",
        phone: professor.phone || "",
        bio: professor.bio || "",
        specialties: professor.specialties || "",
        is_active: professor.is_active
      });
    }
    setEditing(!editing);
    setError("");
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    
    try {
      const response = await axios.put(`http://127.0.0.1:8000/professors/${professorId}/details`, editForm);
      setProfessor(response.data);
      setEditing(false);
    } catch (error) {
      console.error("Error updating professor:", error);
      if (error.response?.status === 400) {
        setError("El email ya está en uso por otro profesor");
      } else {
        setError(`Error al actualizar: ${error.response?.data?.detail || error.message}`);
      }
    } finally {
      setSaving(false);
    }
  };

  const updateSyllabusStatus = async (moduleId, status, observations = "") => {
    try {
      await axios.put(
        `http://127.0.0.1:8000/professors/${professorId}/module/${moduleId}/syllabus-status`,
        null,
        {
          params: { status, observations }
        }
      );
      await fetchProfessorDetails(); // Refresh data
    } catch (error) {
      console.error("Error updating syllabus status:", error);
      alert("Error al actualizar el estado del sílabo");
    }
  };

  const getDisplayName = () => {
    if (professor?.first_name && professor?.last_name) {
      return `${professor.first_name} ${professor.last_name}`;
    }
    return professor?.name || "Profesor";
  };

  const getSyllabusColor = (status) => {
    switch (status) {
      case "hay documento": return "bg-green-100 text-green-800";
      case "no hay documento": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <>
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50"></div>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full h-[80vh] flex items-center justify-center">
            <div className="text-lg text-gray-600">Cargando detalles del profesor...</div>
          </div>
        </div>
      </>
    );
  }

  if (!professor) {
    return (
      <>
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50"></div>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">❌</div>
              <div className="text-lg text-gray-800 mb-2">Profesor no encontrado</div>
              <button
                onClick={onClose}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  const tabs = [
    { id: "info", label: "Información Personal", icon: "👤" },
    { id: "courses", label: "Cursos Asignados", icon: "📚" },
    { id: "modules", label: "Módulos y Sílabos", icon: "📋" }
  ];

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50"></div>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full h-[85vh] overflow-hidden flex flex-col">
          
          {/* Header */}
          <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{getDisplayName()}</h2>
                <div className="text-sm text-gray-600 mt-1">
                  ID: {professor.id} • 
                  {professor.email && ` Email: ${professor.email} • `}
                  Miembro desde: {professor.created_at ? new Date(professor.created_at).toLocaleDateString('es-ES') : 'N/A'}
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    professor.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {professor.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                  <span className="text-sm text-gray-600">
                    {professor.courses?.length || 0} cursos • {professor.modules?.length || 0} módulos • {professor.total_hours}h totales
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {editing ? (
                  <>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      {saving ? "Guardando..." : "Guardar"}
                    </button>
                    <button
                      onClick={handleEditToggle}
                      disabled={saving}
                      className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleEditToggle}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    ✏️ Editar
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Tab Navigation */}
            <div className="flex gap-2 mt-4">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === "info" && (
              <PersonalInfoTab
                professor={professor}
                editForm={editForm}
                editing={editing}
                onInputChange={handleInputChange}
              />
            )}

            {activeTab === "courses" && (
              <CoursesTab courses={professor.courses} />
            )}

            {activeTab === "modules" && (
              <ModulesTab
                modules={professor.modules}
                syllabusStats={professor.syllabus_stats}
                onUpdateSyllabus={updateSyllabusStatus}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// Personal Information Tab
function PersonalInfoTab({ professor, editForm, editing, onInputChange }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Name fields */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombre Completo
          </label>
          {editing ? (
            <input
              type="text"
              name="name"
              value={editForm.name}
              onChange={onInputChange}
              placeholder="Nombre completo"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <p className="text-gray-900 p-3 bg-gray-50 rounded-lg">{professor.name || "No especificado"}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Primer Nombre
          </label>
          {editing ? (
            <input
              type="text"
              name="first_name"
              value={editForm.first_name}
              onChange={onInputChange}
              placeholder="Primer nombre"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <p className="text-gray-900 p-3 bg-gray-50 rounded-lg">{professor.first_name || "No especificado"}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Apellidos
          </label>
          {editing ? (
            <input
              type="text"
              name="last_name"
              value={editForm.last_name}
              onChange={onInputChange}
              placeholder="Apellidos"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <p className="text-gray-900 p-3 bg-gray-50 rounded-lg">{professor.last_name || "No especificado"}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          {editing ? (
            <input
              type="email"
              name="email"
              value={editForm.email}
              onChange={onInputChange}
              placeholder="email@example.com"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <p className="text-gray-900 p-3 bg-gray-50 rounded-lg">{professor.email || "No especificado"}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Teléfono
          </label>
          {editing ? (
            <input
              type="text"
              name="phone"
              value={editForm.phone}
              onChange={onInputChange}
              placeholder="+51 999 999 999"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <p className="text-gray-900 p-3 bg-gray-50 rounded-lg">{professor.phone || "No especificado"}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Estado
          </label>
          {editing ? (
            <label className="flex items-center">
              <input
                type="checkbox"
                name="is_active"
                checked={editForm.is_active}
                onChange={onInputChange}
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              Profesor activo
            </label>
          ) : (
            <p className={`p-3 rounded-lg ${professor.is_active ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {professor.is_active ? "Activo" : "Inactivo"}
            </p>
          )}
        </div>
      </div>

      {/* Bio and Specialties */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Biografía
        </label>
        {editing ? (
          <textarea
            name="bio"
            value={editForm.bio}
            onChange={onInputChange}
            placeholder="Breve descripción del profesor, experiencia, etc."
            rows={4}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        ) : (
          <p className="text-gray-900 p-3 bg-gray-50 rounded-lg min-h-[100px]">
            {professor.bio || "No especificado"}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Especialidades
        </label>
        {editing ? (
          <input
            type="text"
            name="specialties"
            value={editForm.specialties}
            onChange={onInputChange}
            placeholder="Ej: Diseño Gráfico, Ilustración Digital, Branding"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        ) : (
          <div className="p-3 bg-gray-50 rounded-lg">
            {professor.specialties ? (
              <div className="flex flex-wrap gap-2">
                {professor.specialties.split(',').map((specialty, idx) => (
                  <span key={idx} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                    {specialty.trim()}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No especificado</p>
            )}
          </div>
        )}
        {editing && (
          <p className="text-xs text-gray-500 mt-1">
            Separa las especialidades con comas
          </p>
        )}
      </div>
    </div>
  );
}

// Courses Tab
function CoursesTab({ courses }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Cursos Asignados</h3>
        <span className="text-sm text-gray-500">{courses?.length || 0} cursos</span>
      </div>

      {courses && courses.length > 0 ? (
        <div className="grid gap-4">
          {courses.map((course) => (
            <div key={course.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{course.name}</h4>
                  <div className="text-sm text-gray-600 mt-1">
                    <span className="mr-4">📅 Duración: {course.duration_months} meses</span>
                    {course.category && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800 mr-4">
                        {course.category}
                      </span>
                    )}
                  </div>
                  {course.schedule && (
                    <div className="text-sm text-gray-600 mt-1">
                      🕒 {course.schedule}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  {course.start_date && (
                    <div className="text-sm text-gray-600">
                      <div>Inicio: {new Date(course.start_date).toLocaleDateString('es-ES')}</div>
                      {course.end_date && (
                        <div>Fin: {new Date(course.end_date).toLocaleDateString('es-ES')}</div>
                      )}
                    </div>
                  )}
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    course.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {course.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="text-gray-500 text-6xl mb-4">📚</div>
          <div className="text-gray-600 text-lg">No hay cursos asignados</div>
          <p className="text-gray-500 text-sm mt-2">
            Asigna cursos a este profesor desde la gestión de cursos
          </p>
        </div>
      )}
    </div>
  );
}

// Modules Tab
function ModulesTab({ modules, syllabusStats, onUpdateSyllabus }) {
  const getSyllabusColor = (status) => {
    switch (status) {
      case "hay documento": return "bg-green-100 text-green-800";
      case "no hay documento": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Módulos Asignados</h3>
        <span className="text-sm text-gray-500">{modules?.length || 0} módulos</span>
      </div>

      {/* Syllabus Statistics */}
      {syllabusStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-green-800 font-semibold text-lg">{syllabusStats.hay_documento || 0}</div>
            <div className="text-green-600 text-sm">Sílabos Completados</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-red-800 font-semibold text-lg">{syllabusStats.no_hay_documento || 0}</div>
            <div className="text-red-600 text-sm">Sin Documento</div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="text-gray-800 font-semibold text-lg">{syllabusStats.pendiente || 0}</div>
            <div className="text-gray-600 text-sm">Pendientes</div>
          </div>
        </div>
      )}

      {modules && modules.length > 0 ? (
        <div className="space-y-4">
          {modules.map((module) => (
            <div key={module.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {module.order || '#'}
                    </span>
                    <div>
                      <h4 className="font-medium text-gray-900">{module.name}</h4>
                      <p className="text-sm text-gray-600">
                        Curso: {module.course_name} • {module.hours}h
                      </p>
                    </div>
                  </div>
                  
                  {module.observations && (
                    <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                      <strong>Observaciones:</strong> {module.observations}
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getSyllabusColor(module.syllabus_status)}`}>
                    {module.syllabus_status || 'Pendiente'}
                  </span>
                  
                  <select
                    value={module.syllabus_status || "pendiente"}
                    onChange={(e) => onUpdateSyllabus(module.id, e.target.value)}
                    className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="hay documento">Hay Documento</option>
                    <option value="no hay documento">No Hay Documento</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="text-gray-500 text-6xl mb-4">📋</div>
          <div className="text-gray-600 text-lg">No hay módulos asignados</div>
          <p className="text-gray-500 text-sm mt-2">
            Asigna módulos específicos a este profesor desde la gestión de cursos
          </p>
        </div>
      )}
    </div>
  );
}