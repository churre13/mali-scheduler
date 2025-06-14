import { useState } from "react";
import CourseScheduleTable from "./CourseScheduleTable";
import CourseForm from "./CourseForm";
import Calendar from "./Calendar";

export default function Tabs() {
  const [activeTab, setActiveTab] = useState("table");
  const [selectedCourse, setSelectedCourse] = useState(null);

  const handleEditCourse = (course) => {
    setSelectedCourse(course);
    setActiveTab("form");
  };

  const handleFormSuccess = () => {
    setSelectedCourse(null);
    setActiveTab("table");
  };

  const tabs = [
    { id: "table", label: "Ver calendario", icon: "📋" },
    { id: "calendar", label: "Vista calendario", icon: "📅" },
    { id: "form", label: "Crear curso", icon: "➕" }
  ];

  return (
    <div className="max-w-7xl mx-auto py-6 px-4">
      {/* Tab Navigation */}
      <div className="flex gap-1 mb-6 border-b border-gray-200 bg-white rounded-t-lg">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              if (tab.id !== "form") setSelectedCourse(null);
            }}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-all font-medium ${
              activeTab === tab.id
                ? "border-mali-pink text-mali-pink bg-pink-50"
                : "border-transparent text-gray-500 hover:text-mali-pink hover:bg-gray-50"
            }`}
          >
            <span className="text-lg">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-b-lg rounded-tr-lg shadow-sm min-h-[600px]">
        {activeTab === "table" && (
          <CourseScheduleTable onEdit={handleEditCourse} />
        )}
        
        {activeTab === "calendar" && (
          <Calendar />
        )}
        
        {activeTab === "form" && (
          <CourseForm 
            selectedCourse={selectedCourse} 
            onSuccess={handleFormSuccess} 
          />
        )}
      </div>
    </div>
  );
}