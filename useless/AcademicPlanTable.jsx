import React, { useState } from "react";

// Asume que recibes "courses" como prop, y cada curso tiene modules (módulos)
const AcademicPlanTable = ({ courses, onUpdateModule }) => {
  // id del módulo actualmente editándose
  const [editingModuleId, setEditingModuleId] = useState(null);
  const [editedModule, setEditedModule] = useState({});

  // Cuando le das click a editar
  const handleEditClick = (module) => {
    setEditingModuleId(module.id);
    setEditedModule({ ...module });
  };

  // Cuando cambias un valor
  const handleFieldChange = (field, value) => {
    setEditedModule((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Guardar cambios
  const handleSave = async () => {
    // Llama al backend vía prop (o aquí si prefieres)
    await onUpdateModule(editedModule);
    setEditingModuleId(null);
    setEditedModule({});
  };

  // Cancelar edición
  const handleCancel = () => {
    setEditingModuleId(null);
    setEditedModule({});
  };

  return (
    <div>
      {courses.map((course) => (
        <div key={course.id} className="mb-8">
          <h2 className="text-xl font-bold mb-2">{course.name}</h2>
          <div className="overflow-x-auto rounded-2xl shadow">
            <table className="min-w-full bg-white dark:bg-gray-900 rounded-2xl">
              <thead>
                <tr>
                  <th className="p-2">Module</th>
                  <th className="p-2">Professor</th>
                  <th className="p-2">Start Date</th>
                  <th className="p-2">End Date</th>
                  <th className="p-2">Hours</th>
                  <th className="p-2">Syllabus Status</th>
                  <th className="p-2">Observations</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {course.modules.map((module) => (
                  <tr key={module.id} className="border-b">
                    {/* Module Name */}
                    <td className="p-2">{module.name}</td>

                    {/* Professor */}
                    <td className="p-2">
                      {editingModuleId === module.id ? (
                        <input
                          type="text"
                          value={editedModule.professor || ""}
                          onChange={(e) =>
                            handleFieldChange("professor", e.target.value)
                          }
                          className="border rounded p-1"
                        />
                      ) : (
                        module.professor
                      )}
                    </td>

                    {/* Start Date */}
                    <td className="p-2">{module.start_date}</td>

                    {/* End Date */}
                    <td className="p-2">{module.end_date}</td>

                    {/* Hours */}
                    <td className="p-2">
                      {editingModuleId === module.id ? (
                        <input
                          type="number"
                          min="0"
                          value={editedModule.hours || ""}
                          onChange={(e) =>
                            handleFieldChange("hours", e.target.value)
                          }
                          className="border rounded p-1 w-16"
                        />
                      ) : (
                        module.hours
                      )}
                    </td>

                    {/* Syllabus Status */}
                    <td className="p-2">
                      {editingModuleId === module.id ? (
                        <select
                          value={editedModule.syllabus_status || ""}
                          onChange={(e) =>
                            handleFieldChange("syllabus_status", e.target.value)
                          }
                          className="border rounded p-1"
                        >
                          <option value="Completado">Completado</option>
                          <option value="En proceso">En proceso</option>
                          <option value="Pendiente">Pendiente</option>
                        </select>
                      ) : (
                        module.syllabus_status
                      )}
                    </td>

                    {/* Observations */}
                    <td className="p-2">
                      {editingModuleId === module.id ? (
                        <input
                          type="text"
                          value={editedModule.observations || ""}
                          onChange={(e) =>
                            handleFieldChange("observations", e.target.value)
                          }
                          className="border rounded p-1"
                        />
                      ) : (
                        module.observations
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-2">
                      {editingModuleId === module.id ? (
                        <>
                          <button
                            onClick={handleSave}
                            className="bg-blue-600 text-white px-2 py-1 rounded-xl mr-1"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancel}
                            className="bg-gray-400 text-white px-2 py-1 rounded-xl"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleEditClick(module)}
                          className="bg-green-600 text-white px-2 py-1 rounded-xl"
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AcademicPlanTable;
