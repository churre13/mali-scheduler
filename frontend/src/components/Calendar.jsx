import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { parseISO, addDays, addMonths, format } from "date-fns";
import CourseForm from "./CourseForm";
import Holidays from 'date-holidays';

const hd = new Holidays('PE');


export default function Calendar() {
  const [events, setEvents] = useState([]);
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  
  const categoryColors = {
    interiores: "#C00000",
    escenicas: "#9900FF",
    graficas: "#A02B93",
    audiovisual: "#BF4F14",
    modas: "#BF9000",
    socialmedia: "#747474",
    literatura: "#78206E",
    musica: "#3333FF",
  };

  function parseScheduleDays(scheduleStr) {
    if (!scheduleStr) return [];
    const daysMap = {
      "lunes": 1,
      "martes": 2,
      "miercoles": 3,
      "jueves": 4,
      "viernes": 5,
      "sabado": 6,
      "domingo": 0,
    };
    const normalize = str =>
      str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  
    const normalizedSchedule = normalize(scheduleStr);
    return Object.keys(daysMap)
      .filter(day => normalizedSchedule.includes(day))
      .map(day => daysMap[day]);
  }
  
  
  useEffect(() => {
    axios.get("http://127.0.0.1:8000/courses/").then((response) => {
      const expandedEvents = [];
  
      response.data.forEach((course) => {
        if (!course.start_date || !course.schedule) return;
  
        const start = parseISO(course.start_date);
        const end = addMonths(start, course.duration_months);
        const days = parseScheduleDays(course.schedule);
  
        let current = new Date(start);
  
        while (current <= end) {
            const holiday = hd.isHoliday(current);
          
            if (days.includes(current.getDay()) && !holiday) {
              expandedEvents.push({
                title: course.name,
                start: format(current, "yyyy-MM-dd"),
                allDay: true,
                backgroundColor: categoryColors[course.category] || "#999",
                borderColor: categoryColors[course.category] || "#999",
                courseId: course.id,
              });
            }
          
            if (holiday) {
              expandedEvents.push({
                title: holiday[0].name,
                start: format(current, "yyyy-MM-dd"),
                allDay: true,
                display: "background",
                backgroundColor: "#fdd",
                borderColor: "#fdd",
              });
            }
          
            current = addDays(current, 1); // <--- DEJA ESTO AL FINAL SIEMPRE
          }
          
      });
  
      setEvents(expandedEvents);
    });
  }, []);
  const handleEventClick = (info) => {
    const courseId = info.event.extendedProps.courseId;
const action = window.prompt(`¿Qué deseas hacer con "${info.event.title}"?\n[editar] o [eliminar]`);

if (action === "editar") {
  setEditingCourseId(courseId);  
  setShowForm(true);             
}
 else if (action === "eliminar") {
      if (window.confirm("¿Seguro que deseas eliminar este curso?")) {
        axios
          .delete(`http://127.0.0.1:8000/courses/${courseId}`)
          .then(() => {
            alert("Curso eliminado");
            window.location.reload();
          })
          .catch((err) => {
            console.error("Error al eliminar curso:", err);
          });
      }
    }
  };
  
  
  return (
    <div className="p-4">
      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        events={events}
        height="auto"
        eventClick={(info) => handleEventClick(info)}
      />
  
      {showForm && (
        <CourseForm
          mode="edit"
          courseId={editingCourseId}
          onSuccess={() => {
            setShowForm(false);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}


  