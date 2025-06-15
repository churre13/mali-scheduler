import { useEffect, useState } from "react";
import axios from "axios";
import ProfessorDetailsModal from "./ProfessorDetailsModal"; // Add this import

export default function ProfessorManagement() {
  const [professors, setProfessors] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfessors, setSelectedProfessors] = useState(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  
  // Add Professor state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProfessor, setNewProfessor] = useState({
    name: "",
    course_names: []
  });
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");

  // Professor Details state
  const [showProfessorDetails, setShowProfessorDetails] = useState(false);
  const [selectedProfessorId, setSelectedProfessorId] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [professorsRes, coursesRes] = await Promise.all([
        axios.get("http://127.0.0.1:8000/professors/"),
        axios.get("http://127.0.0.1:8000/professors/available-courses")
      ]);
      setProfessors(professorsRes.data);
      setCourses(coursesRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // View professor details
  const handleViewProfessor = (professorId) => {
    setSelectedProfessorId(professorId);
    setShowProfessorDetails(true);
  };

  const handleCloseProfessorDetails = () => {
    setShowProfessorDetails(false);
    setSelectedProfessorId(null);
    fetchData(); // Refresh data in case professor was updated
  };

  // Selection management
  const toggleProfessorSelection = (professorId) => {
    const newSelection = new Set(selectedProfessors);
    if (newSelection.has(professorId)) {
      newSelection.delete(professorId);
    } else {
      newSelection.add(professorId);
    }
    setSelectedProfessors(newSelection);
    setShowBulkActions(newSelection.size > 0);
  };

  const selectAllProfessors = () => {
    if (selectedProfessors.size === professors.length) {
      setSelectedProfessors(new Set());
      setShowBulkActions(false);
    } else {
      setSelectedProfessors(new Set(professors.map(p => p.id)));
      setShowBulkActions(true);
    }
  };

  // Add Professor functions
  const handleAddProfessor = () => {
    setNewProfessor({ name: "", course_names: [] });
    setAddError("");
    setShowAddForm(true);
  };

  const handleProfessorNameChange = (e) => {
    setNewProfessor(prev => ({ ...prev, name: e.target.value }));
    setAddError("");
  };

  const handleCourseToggle = (courseName) => {
    setNewProfessor(prev => ({
      ...prev,
      course_names: prev.course_names.includes(courseName)
        ? prev.course_names.filter(name => name !== courseName)
        : [...prev.course_names, courseName]
    }));
  };

  const submitNewProfessor = async () => {
    if (!newProfessor.name.trim()) {
      setAddError("El nombre del profesor es requerido");
      return;
    }

    setAdding(true);
    setAddError("");

    try {
      await axios.post("http://127.0.0.1:8000/professors/", newProfessor);
      await fetchData(); // Refresh data
      setShowAddForm(false);
      setNewProfessor({ name: "", course_names: [] });
    } catch (error) {
      console.error("Error creating professor:", error);
      if (error.response?.status === 400) {
        setAddError("Ya existe un profesor con este nombre");
      } else {
        setAddError(`Error al crear profesor: ${error.response?.data?.detail || error.message}`);
      }
    } finally {
      setAdding(false);
    }
  };

  // Deletion functions
  const confirmDelete = (target) => {
    setDeleteTarget(target);
    setShowDeleteConfirmation(true);
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    
    setDeleting(true);
    try {
      let response;
      
      if (deleteTarget.type === 'single') {
        response = await axios.delete(`http://127.0.0.1:8000/professors/${deleteTarget.id}`);
      } else if (deleteTarget.type === 'bulk') {
        response = await axios.delete(`http://127.0.0.1:8000/professors/bulk-delete-professors`, {
          data: Array.from(selectedProfessors)
        });
        setSelectedProfessors(new Set());
        setShowBulkActions(false);
      }
      
      console.log('Deletion response:', response.data);
      await fetchData(); // Refresh data
      
    } catch (error) {
      console.error('Error deleting professor(s):', error);
      alert(`Error al eliminar: ${error.response?.data?.detail || error.message}`);
    } finally {
      setDeleting(false);
      setShowDeleteConfirmation(false);
      setDeleteTarget(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Cargando profesores...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Gestión de Profesores</h2>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            {professors.length} profesores en total
          </div>
          
          {/* Add Professor Button */}
          <button
            onClick={handleAddProfessor}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            ➕ Añadir Profesor
          </button>
          
          {/* Bulk Actions */}
          {showBulkActions && (
            <div className="flex items-center gap-2 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
              <span className="text-sm text-red-700">{selectedProfessors.size} seleccionados</span>
              <button
                onClick={() => confirmDelete({ 
                  type: 'bulk', 
                  count: selectedProfessors.size,
                  professorNames: professors
                    .filter(p => selectedProfessors.has(p.id))
                    .map(p => p.name)
                })}
                className="bg-red-600 text-white px-3 py-1 text-sm rounded hover:bg-red-700 transition-colors"
              >
                🗑️ Eliminar Seleccionados
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {/* Bulk selection checkbox */}
              <th className="text-left p-4 font-semibold text-gray-700 border-b w-12">
                <input
                  type="checkbox"
                  checked={selectedProfessors.size === professors.length && professors.length > 0}
                  onChange={selectAllProfessors}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="text-left p-4 font-semibold text-gray-700 border-b">Profesor</th>
              <th className="text-left p-4 font-semibold text-gray-700 border-b">Información</th>
              <th className="text-left p-4 font-semibold text-gray-700 border-b">Cursos Asignados</th>
              <th className="text-left p-4 font-semibold text-gray-700 border-b">Total Cursos</th>
              <th className="text-left p-4 font-semibold text-gray-700 border-b">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {professors.map((professor, idx) => (
              <tr key={professor.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-25 hover:bg-gray-50"}>
                {/* Selection checkbox */}
                <td className="p-4 border-b">
                  <input
                    type="checkbox"
                    checked={selectedProfessors.has(professor.id)}
                    onChange={() => toggleProfessorSelection(professor.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </td>

                <td className="p-4 border-b">
                  <div className="font-medium text-gray-900">
                    {professor.first_name && professor.last_name 
                      ? `${professor.first_name} ${professor.last_name}` 
                      : professor.name}
                  </div>
                  <div className="text-sm text-gray-500">ID: {professor.id}</div>
                </td>

                <td className="p-4 border-b">
                  <div className="text-sm text-gray-600">
                    {professor.email && (
                      <div className="flex items-center gap-1">
                        📧 {professor.email}
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        professor.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {professor.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>
                </td>

                <td className="p-4 border-b">
                  {professor.courses && professor.courses.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {professor.courses.slice(0, 2).map((courseName, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {courseName}
                        </span>
                      ))}
                      {professor.courses.length > 2 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          +{professor.courses.length - 2} más
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-400 italic">Sin cursos asignados</span>
                  )}
                </td>

                <td className="p-4 border-b">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                    {professor.courses?.length || 0}
                  </span>
                </td>

                <td className="p-4 border-b">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewProfessor(professor.id)}
                      className="inline-flex items-center px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                    >
                      👁️ Ver
                    </button>
                    <button
                      onClick={() => confirmDelete({
                        type: 'single',
                        id: professor.id,
                        name: professor.name,
                        courseCount: professor.courses?.length || 0
                      })}
                      className="inline-flex items-center px-3 py-1 text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                    >
                      🗑️ Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer */}
        {professors.length > 0 && (
          <div className="px-4 py-3 bg-gray-50 border-t text-xs text-gray-500 flex justify-between items-center">
            <span>
              Mostrando {professors.length} profesor{professors.length !== 1 ? 'es' : ''}
            </span>
            <button
              onClick={() => {
                setSelectedProfessors(new Set());
                setShowBulkActions(false);
              }}
              className="text-gray-600 hover:text-gray-800 underline"
            >
              Limpiar selección
            </button>
          </div>
        )}
      </div>

      {/* No professors message */}
      {professors.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <div className="text-gray-500 text-6xl mb-4">👨‍🏫</div>
          <div className="text-gray-600 text-lg mb-2">No hay profesores registrados</div>
          <p className="text-gray-500 text-sm mb-4">
            Añade profesores para asignarlos a cursos y módulos
          </p>
          <button
            onClick={handleAddProfessor}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            ➕ Añadir Primer Profesor
          </button>
        </div>
      )}

      {/* Add Professor Modal */}
      {showAddForm && (
        <AddProfessorModal
          newProfessor={newProfessor}
          courses={courses}
          onNameChange={handleProfessorNameChange}
          onCourseToggle={handleCourseToggle}
          onSubmit={submitNewProfessor}
          onCancel={() => {
            setShowAddForm(false);
            setNewProfessor({ name: "", course_names: [] });
            setAddError("");
          }}
          adding={adding}
          error={addError}
        />
      )}

      {/* Professor Details Modal */}
      {showProfessorDetails && selectedProfessorId && (
        <ProfessorDetailsModal
          professorId={selectedProfessorId}
          onClose={handleCloseProfessorDetails}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && deleteTarget && (
        <ProfessorDeleteConfirmationModal
          target={deleteTarget}
          onConfirm={executeDelete}
          onCancel={() => {
            setShowDeleteConfirmation(false);
            setDeleteTarget(null);
          }}
          deleting={deleting}
        />
      )}
    </div>
  );
}

// Add Professor Modal Component (keeping the same as before)
function AddProfessorModal({ newProfessor, courses, onNameChange, onCourseToggle, onSubmit, onCancel, adding, error }) {
  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50"></div>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Añadir Nuevo Profesor</h3>
              <button
                onClick={onCancel}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              {/* Professor Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Profesor *
                </label>
                <input
                  type="text"
                  value={newProfessor.name}
                  onChange={onNameChange}
                  placeholder="Ingresa el nombre completo"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Course Assignment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Asignar a Cursos ({newProfessor.course_names.length} seleccionados)
                </label>
                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
                  {courses.length > 0 ? (
                    courses.map((course) => (
                      <label key={course.id} className="flex items-center py-2 cursor-pointer hover:bg-white rounded px-2">
                        <input
                          type="checkbox"
                          checked={newProfessor.course_names.includes(course.name)}
                          onChange={() => onCourseToggle(course.name)}
                          className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">{course.name}</span>
                      </label>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      No hay cursos disponibles
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Opcional: Puedes asignar cursos ahora o hacerlo después
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
              <button
                onClick={onCancel}
                disabled={adding}
                className="px-6 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={onSubmit}
                disabled={adding || !newProfessor.name.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {adding ? "Creando..." : "Crear Profesor"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Professor-specific delete confirmation modal (keeping the same as before)
function ProfessorDeleteConfirmationModal({ target, onConfirm, onCancel, deleting }) {
  const getConfirmationConfig = () => {
    if (target.type === 'single') {
      return {
        title: 'Eliminar Profesor',
        message: `¿Estás seguro de que deseas eliminar al profesor "${target.name}"?`,
        details: [
          `Se desasignará de ${target.courseCount} curso${target.courseCount !== 1 ? 's' : ''}`,
          'Se desasignará de todos los módulos',
          'El profesor será eliminado permanentemente',
          'Esta acción no se puede deshacer'
        ],
        buttonText: 'Eliminar Profesor'
      };
    } else {
      return {
        title: 'Eliminar Profesores Seleccionados',
        message: `¿Eliminar ${target.count} profesores seleccionados?`,
        details: [
          'Se desasignarán de todos sus cursos',
          'Se desasignarán de todos los módulos',
          'Los profesores serán eliminados permanentemente',
          'Esta acción no se puede deshacer',
          '',
          'Profesores a eliminar:',
          ...target.professorNames.map(name => `• ${name}`)
        ],
        buttonText: `Eliminar ${target.count} Profesores`
      };
    }
  };

  const config = getConfirmationConfig();

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50"></div>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <span className="text-xl">⚠️</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{config.title}</h3>
            </div>
            
            <p className="text-gray-700 mb-4">{config.message}</p>
            
            <div className="bg-gray-50 rounded-lg p-3 mb-4 max-h-48 overflow-y-auto">
              <ul className="text-sm text-gray-600 space-y-1">
                {config.details.map((detail, idx) => (
                  <li key={idx} className={detail === '' ? 'h-2' : 'flex items-start gap-2'}>
                    {detail !== '' && (
                      <>
                        <span className="text-gray-400 mt-1">•</span>
                        <span>{detail}</span>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={onCancel}
                disabled={deleting}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={onConfirm}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? 'Eliminando...' : config.buttonText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}