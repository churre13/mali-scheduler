import { useState, useEffect } from "react";
import axios from "axios";

export default function CourseForm({ mode = "create", courseId = null, onSuccess }) {
  const [course, setCourse] = useState({
    name: "",
    duration_months: 1,
    start_date: "",
    schedule: "",
    category: "",
    modules: [],
  });

    useEffect(() => {
        if (mode === "edit" && courseId) {
          axios.get(`http://127.0.0.1:8000/courses/${courseId}`).then((res) => {
            setCourse(res.data);
          });
        }
      }, [mode, courseId]);

  const [newModule, setNewModule] = useState("");

  const addModule = () => {
    if (newModule.trim()) {
      setCourse({
        ...course,
        modules: [...course.modules, { name: newModule, order: course.modules.length + 1 }],
      });
      setNewModule("");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCourse({ ...course, [name]: value });
  };

  const submitCourse = async (e) => {
    e.preventDefault();
    try {
        if (mode === "edit" && courseId) {
            await axios.put(`http://127.0.0.1:8000/courses/${courseId}`, course);
          } else {
            await axios.post("http://127.0.0.1:8000/courses/", course);
          }

          onSuccess && onSuccess();

          
      alert("Curso creado 🎉");
      window.location.reload(); // o puedes hacer setEvents otra vez si prefieres
    } catch (err) {
        console.error("Error al crear curso:", err);
        if (err.response) {
          console.error("Detalles:", err.response.data);
          alert("Error al crear el curso: " + JSON.stringify(err.response.data));
        } else {
          alert("Error al crear el curso");
        }
      }
      
  };

  return (
    <form onSubmit={submitCourse} className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Crear nuevo curso</h2>

      <label className="block mb-2">Nombre del curso</label>
      <input
        type="text"
        name="name"
        value={course.name}
        onChange={handleChange}
        className="w-full mb-4 p-2 border rounded"
        required
      />

      <label className="block mb-2">Duración (meses)</label>
      <input
        type="number"
        name="duration_months"
        value={course.duration_months}
        onChange={handleChange}
        className="w-full mb-4 p-2 border rounded"
        min="1"
        required
      />

      <label className="block mb-2">Fecha de inicio</label>
      <input
        type="date"
        name="start_date"
        value={course.start_date}
        onChange={handleChange}
        className="w-full mb-4 p-2 border rounded"
        required
      />

      <label className="block mb-2">Horario</label>
      <input
        type="text"
        name="schedule"
        value={course.schedule}
        onChange={handleChange}
        placeholder="Ej: Lunes y Miércoles 8:00 pm - 10:00 pm"
        className="w-full mb-4 p-2 border rounded"
        required
      />

<label className="block mb-2">Categoría</label>
<select
  name="category"
  value={course.category}
  onChange={handleChange}
  className="w-full mb-4 p-2 border rounded"
  required
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


      <div className="mb-4">
        <label className="block mb-2">Módulos</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newModule}
            onChange={(e) => setNewModule(e.target.value)}
            className="flex-1 p-2 border rounded"
            placeholder="Nombre del módulo"
          />
          <button
            type="button"
            onClick={addModule}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Agregar
          </button>
        </div>
        <ul className="list-disc pl-5 text-sm text-gray-700">
          {course.modules.map((mod, idx) => (
            <li key={idx}>{mod.order}. {mod.name}</li>
          ))}
        </ul>
      </div>

      <button
        type="submit"
        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded"
      >
        Guardar curso
      </button>
    </form>
  );
}
