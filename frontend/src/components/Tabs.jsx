import { useState } from "react";
import Calendar from "./Calendar";
import CourseForm from "./CourseForm";

export default function Tabs() {
  const [activeTab, setActiveTab] = useState("calendar");

  return (
    <div className="max-w-6xl mx-auto py-6 px-4">
      <div className="flex gap-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab("calendar")}
          className={`pb-2 border-b-2 ${activeTab === "calendar" ? "border-blue-600 text-blue-600 font-bold" : "border-transparent text-gray-500"}`}
        >
          Ver calendario
        </button>
        <button
          onClick={() => setActiveTab("form")}
          className={`pb-2 border-b-2 ${activeTab === "form" ? "border-blue-600 text-blue-600 font-bold" : "border-transparent text-gray-500"}`}
        >
          Crear curso
        </button>
      </div>

      {activeTab === "calendar" && <Calendar />}
      {activeTab === "form" && <CourseForm />}
    </div>
  );
}
