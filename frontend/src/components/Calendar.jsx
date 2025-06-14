import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { parseISO, addDays, addMonths, format } from "date-fns";
import CourseForm from "./CourseForm";
import Holidays from 'date-holidays';

const hd = new Holidays('PE');

export default function Calendar() {
  const [events, setEvents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedProfessor, setSelectedProfessor] = useState(null);
  const [showProfessorModal, setShowProfessorModal] = useState(false);
  const [professorSchedule, setProfessorSchedule] = useState([]);
  const [calendarView, setCalendarView] = useState('dayGridMonth');
  const [loading, setLoading] = useState(true);

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

  // Add this CSS to the component
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      /* FullCalendar custom styles */
      .fc-event {
        margin-bottom: 1px !important;
        font-size: 10px !important;
        border-radius: 3px !important;
        padding: 1px 3px !important;
        overflow: hidden !important;
      }
      
      .fc-daygrid-event {
        white-space: normal !important;
        height: auto !important;
        min-height: 18px !important;
      }
      
      .fc-daygrid-event-harness {
        margin-bottom: 1px !important;
      }
      
      .fc-daygrid-day-events {
        margin-bottom: 0 !important;
        overflow: visible !important;
      }
      
      .fc-daygrid-day-frame {
        min-height: 100px !important;
      }
      
      .fc-event-title {
        font-weight: 500 !important;
        line-height: 1.2 !important;
      }
      
      .fc-more-link {
        font-size: 10px !important;
        color: #666 !important;
      }
      
      .holiday-event {
        opacity: 0.3 !important;
      }
      
      .fc-daygrid-day {
        vertical-align: top !important;
      }
      
      /* Ensure proper spacing */
      .fc-daygrid-day-top {
        flex-direction: row !important;
        justify-content: center !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

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

  const loadCalendarData = async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://127.0.0.1:8000/courses/");
      const coursesData = response.data;
      setCourses(coursesData);
      
      const expandedEvents = [];

      coursesData.forEach((course) => {
        if (!course.start_date || !course.schedule) return;

        const start = parseISO(course.start_date);
        const end = addMonths(start, course.duration_months);
        const days = parseScheduleDays(course.schedule);

        let current = new Date(start);
        let sessionCount = 0;

        while (current <= end) {
          const holiday = hd.isHoliday(current);
          
          if (days.includes(current.getDay()) && !holiday) {
            sessionCount++;
            
            // Extract time from schedule if available
            const timeMatch = course.schedule.match(/(\d{1,2}:\d{2})\s*(?:pm|am|\-|\s)/i);
            const eventTime = timeMatch ? timeMatch[1] : null;
            
            expandedEvents.push({
              id: `${course.id}-${sessionCount}`,
              title: course.name,
              start: eventTime ? 
                `${format(current, "yyyy-MM-dd")}T${convertTo24Hour(eventTime)}` : 
                format(current, "yyyy-MM-dd"),
              allDay: !eventTime,
              backgroundColor: categoryColors[course.category] || "#6366f1",
              borderColor: categoryColors[course.category] || "#6366f1",
              textColor: "#ffffff",
              courseId: course.id,
              courseName: course.name,
              professors: course.professors || [],
              category: course.category,
              sessionNumber: sessionCount,
              extendedProps: {
                courseId: course.id,
                professors: course.professors || [],
                category: course.category,
                sessionNumber: sessionCount,
                duration: course.duration_months
              }
            });
          }
          
          // Add holiday events as background
          if (holiday) {
            expandedEvents.push({
              id: `holiday-${format(current, "yyyy-MM-dd")}`,
              title: holiday[0].name,
              start: format(current, "yyyy-MM-dd"),
              allDay: true,
              display: "background",
              backgroundColor: "rgba(254, 202, 202, 0.5)",
              borderColor: "rgba(248, 113, 113, 0.5)",
              className: "holiday-event"
            });
          }
          
          current = addDays(current, 1);
        }
      });

      setEvents(expandedEvents);
    } catch (error) {
      console.error("Error loading calendar data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCalendarData();
  }, []);

  // Convert 12-hour to 24-hour format
  const convertTo24Hour = (time12h) => {
    if (!time12h) return "09:00";
    
    const [time, modifier] = time12h.split(/([ap]m)/i);
    let [hours, minutes] = time.split(':');
    
    if (hours === '12') {
      hours = '00';
    }
    if (modifier?.toLowerCase() === 'pm') {
      hours = parseInt(hours, 10) + 12;
    }
    
    return `${hours.padStart(2, '0')}:${minutes || '00'}`;
  };

  const handleEventClick = (info) => {
    const event = info.event;
    const courseId = event.extendedProps.courseId;
    const professors = event.extendedProps.professors;
    
    if (!courseId) return; // Skip holiday events
    
    const course = courses.find(c => c.id === courseId);
    
    // Create custom modal content
    const modalContent = `
      Curso: ${event.title}
      Sesión: ${event.extendedProps.sessionNumber}
      Profesores: ${professors.map(p => p.name).join(', ') || 'Sin asignar'}
      Categoría: ${event.extendedProps.category || 'Sin categoría'}
      
      ¿Qué deseas hacer?
      [editar] - Editar curso
      [profesor] - Ver calendario del profesor (si hay uno asignado)
      [eliminar] - Eliminar curso
    `;
    
    const action = window.prompt(modalContent);

    if (action === "editar") {
      setEditingCourseId(courseId);  
      setShowForm(true);             
    } else if (action === "profesor" && professors.length > 0) {
      if (professors.length === 1) {
        handleProfessorClick(professors[0]);
      } else {
        // Multiple professors - let user choose
        const profNames = professors.map((p, i) => `${i + 1}. ${p.name}`).join('\n');
        const choice = window.prompt(`Selecciona un profesor:\n${profNames}\n\nIngresa el número:`);
        const profIndex = parseInt(choice) - 1;
        if (profIndex >= 0 && profIndex < professors.length) {
          handleProfessorClick(professors[profIndex]);
        }
      }
    } else if (action === "eliminar") {
      if (window.confirm(`¿Seguro que deseas eliminar el curso "${event.title}"?`)) {
        axios
          .delete(`http://127.0.0.1:8000/courses/${courseId}`)
          .then(() => {
            alert("Curso eliminado");
            loadCalendarData(); // Reload calendar
          })
          .catch((err) => {
            console.error("Error al eliminar curso:", err);
            alert("Error al eliminar el curso");
          });
      }
    }
  };

  const handleProfessorClick = async (professor) => {
    setSelectedProfessor(professor);
    try {
      const response = await axios.get(`http://127.0.0.1:8000/professors/${professor.id}/schedule`);
      setProfessorSchedule(response.data);
      setShowProfessorModal(true);
    } catch (error) {
      console.error("Error fetching professor schedule:", error);
      setProfessorSchedule([]);
      setShowProfessorModal(true);
    }
  };

  const handleDateSelect = (selectInfo) => {
    const title = prompt('Crear nuevo curso para la fecha ' + selectInfo.startStr);
    if (title) {
      // You could open the course form with the selected date pre-filled
      setEditingCourseId(null);
      setShowForm(true);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-2xl mb-2">📅</div>
          <div className="text-lg text-gray-600">Cargando calendario...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Calendar Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Calendario de Cursos</h2>
          <p className="text-sm text-gray-600">
            {events.filter(e => e.courseId).length} sesiones programadas • 
            Respeta feriados de Perú
          </p>
        </div>
        <div className="flex gap-2">
          <select 
            value={calendarView} 
            onChange={(e) => setCalendarView(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="dayGridMonth">Vista Mensual</option>
            <option value="timeGridWeek">Vista Semanal</option>
            <option value="timeGridDay">Vista Diaria</option>
          </select>
        </div>
      </div>

      {/* Legend */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Categorías:</h3>
        <div className="flex flex-wrap gap-3">
          {Object.entries(categoryColors).map(([category, color]) => (
            <div key={category} className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded border border-gray-300" 
                style={{ backgroundColor: color }}
              ></div>
              <span className="text-xs text-gray-600 capitalize">
                {category === 'interiores' && 'Arquitectura e Interiores'}
                {category === 'escenicas' && 'Artes Escénicas'}
                {category === 'graficas' && 'Artes Gráficas'}
                {category === 'audiovisual' && 'Audiovisual'}
                {category === 'modas' && 'Diseño de Modas'}
                {category === 'socialmedia' && 'IA y Social Media'}
                {category === 'literatura' && 'Literatura'}
                {category === 'musica' && 'Música y Negocios'}
              </span>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-100 border border-red-200"></div>
            <span className="text-xs text-gray-600">Feriados</span>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={calendarView}
          key={calendarView} // Force re-render when view changes
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          events={events}
          height="auto"
          eventClick={handleEventClick}
          selectable={true}
          selectMirror={true}
          select={handleDateSelect}
          dayMaxEvents={3} // Show max 3 events, then "+X more" link
          eventDisplay="block"
          eventContent={(eventInfo) => {
            if (eventInfo.event.display === 'background') return null;
            
            return (
              <div className="fc-event-main-frame overflow-hidden">
                <div className="fc-event-title-container p-1">
                  <div className="fc-event-title font-medium text-white truncate leading-tight">
                    {eventInfo.event.title}
                  </div>
                  {eventInfo.event.extendedProps.professors && eventInfo.event.extendedProps.professors.length > 0 && (
                    <div className="text-xs text-white opacity-90 truncate leading-tight">
                      {eventInfo.event.extendedProps.professors.slice(0, 2).map(p => p.name).join(', ')}
                      {eventInfo.event.extendedProps.professors.length > 2 && '...'}
                    </div>
                  )}
                  {eventInfo.event.extendedProps.sessionNumber && (
                    <div className="text-xs text-white opacity-75 leading-tight">
                      S{eventInfo.event.extendedProps.sessionNumber}
                    </div>
                  )}
                </div>
              </div>
            );
          }}
          locale="es"
          firstDay={1} // Monday first
          buttonText={{
            today: 'Hoy',
            month: 'Mes',
            week: 'Semana',
            day: 'Día'
          }}
          aspectRatio={1.8}
          eventMinHeight={20}
        />
      </div>

      {/* Course Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CourseForm
              mode={editingCourseId ? "edit" : "create"}
              courseId={editingCourseId}
              onSuccess={() => {
                setShowForm(false);
                setEditingCourseId(null);
                loadCalendarData();
              }}
            />
          </div>
        </div>
      )}

      {/* Professor Schedule Modal */}
      {showProfessorModal && selectedProfessor && (
        <ProfessorScheduleModal
          professor={selectedProfessor}
          schedule={professorSchedule}
          onClose={() => {
            setShowProfessorModal(false);
            setSelectedProfessor(null);
            setProfessorSchedule([]);
          }}
        />
      )}
    </div>
  );
}

// Professor Schedule Modal (reused from previous component)
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