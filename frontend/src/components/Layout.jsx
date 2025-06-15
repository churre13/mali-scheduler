// src/components/Layout.jsx
import Header from "./Header";

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 text-gray-800 font-sans">
      {/* Header */}
      <Header />
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
      
      {/* Optional Footer */}
      <footer className="border-t border-gray-200 bg-white mt-16">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center text-sm text-gray-500">
            <div>
              © 2025 MALI Scheduler. Sistema de gestión de cursos y profesores.
            </div>
            <div className="flex items-center gap-4">
              <span>Versión 1.0</span>
              <span>•</span>
              <span>Soporte: admin@mali.edu</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}