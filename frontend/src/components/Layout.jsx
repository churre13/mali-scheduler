// src/components/Layout.jsx
export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 text-gray-800 font-sans">
      <div className="max-w-7xl mx-auto px-6 py-8">{children}</div>
    </div>
  );
}
