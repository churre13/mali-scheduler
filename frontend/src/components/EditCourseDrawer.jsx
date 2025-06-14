import { useState } from "react";
import axios from "axios";

export default function EditCourseDrawer({ course, onClose, onUpdated }) {
  const [form, setForm] = useState({
    name: course.name,
    duration_months: course.duration_months,
    start_date: course.start_date,
    schedule: course.schedule,
    category: course.category,
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    axios.put(`http://127.0.0.1:8000/courses/${course.id}`, form)
      .then(() => onUpdated())
      .catch((err) => console.error("Error actualizando curso:", err));
  };

  return (
    <>
      {/* Fondo oscuro */}
      <div
        className="fixed inset-0 bg-black bg-opacity-30 z-40"
        onClick={onClose}
      ></div>

      {/* Drawer */}
      <div className="fixed top-0 right-0 w-full max-w-md h-full bg-white shadow-lg z-50 transition-transform transform translate-x-0">
        <div className="p-6 flex flex-col h-full">
          <h3 className="text-lg font-bold mb-4">Editar Curso</h3>

          <label className="mb-2 text-sm font-medium">Nombre</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            className="border p-2 mb-4 w-full"
          />

          <label className="mb-2 text-sm font-medium">Duración (meses)</label>
          <input
            type="number"
            name="duration_months"
            value={form.duration_months}
            onChange={handleChange}
            className="border p-2 mb-4 w-full"
          />

          <label className="mb-2 text-sm font-medium">Fecha de Inicio</label>
          <input
            type="date"
            name="start_date"
            value={form.start_date || ""}
            onChange={handleChange}
            className="border p-2 mb-4 w-full"
          />

          <label className="mb-2 text-sm font-medium">Horario</label>
          <input
            name="schedule"
            value={form.schedule}
            onChange={handleChange}
            className="border p-2 mb-4 w-full"
          />

          <label className="mb-2 text-sm font-medium">Categoría</label>
          <input
            name="category"
            value={form.category}
            onChange={handleChange}
            className="border p-2 mb-4 w-full"
          />

          <div className="mt-auto flex justify-between">
            <button
              onClick={handleSave}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Guardar
            </button>
            <button
              onClick={onClose}
              className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

