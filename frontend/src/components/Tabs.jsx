import { useState } from "react";

import CourseScheduleTable from "./CourseScheduleTable";
import CourseForm from "./CourseForm";

export default function Tabs() {
  const [activeTab, setActiveTab] = useState("calendar");
  const [selectedCourse, setSelectedCourse] = useState(null);

  const handleEditCourse = (course) => {
    setSelectedCourse(course);
    setActiveTab("form");
  };

  const handleFormSuccess = () => {
    setSelectedCourse(null);
    setActiveTab("calendar");
  };

  return (
    <div className="max-w-6xl mx-auto py-6 px-4">
      <div className="flex gap-4 mb-6 border-b">
        <button
          onClick={() => {
            setActiveTab("calendar");
            setSelectedCourse(null);
          }}
          className={`pb-2 px-4 border-b-2 transition-all ${
  activeTab === "calendar"
    ? "border-mali-pink text-mali-pink font-bold"
    : "border-transparent text-gray-500 hover:text-mali-pink"
}`}
        >
          Ver calendario
        </button>
        <button
          onClick={() => {
            setActiveTab("form");
            setSelectedCourse(null);
          }}
          className={`pb-2 border-b-2 ${activeTab === "form" ? "border-blue-600 text-blue-600 font-bold" : "border-transparent text-gray-500"}`}
        >
          Crear curso
        </button>
      </div>

      {activeTab === "calendar" && <CourseScheduleTable onEdit={handleEditCourse} />}
      {activeTab === "form" && (
        <CourseForm selectedCourse={selectedCourse} onSuccess={handleFormSuccess} />
      )}
    </div>
  );
}
