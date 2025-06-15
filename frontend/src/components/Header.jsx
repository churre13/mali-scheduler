// src/components/Header.jsx
export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center gap-4">
            {/* Logo Image */}
            <div className="flex-shrink-0">
              <img 
                src="/logo-mali.png" 
                alt="MALI Logo" 
                className="h-12 w-auto object-contain"
                onError={(e) => {
                  // Fallback si no encuentra la imagen
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              {/* Fallback logo si no hay imagen */}
              <div className="h-12 w-12 bg-gradient-to-br from-mali-pink to-purple-600 rounded-lg items-center justify-center shadow-lg hidden">
                <span className="text-white font-bold text-xl">M</span>
              </div>
            </div>
            
            {/* Title and Subtitle */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                MALI <span className="text-mali-pink">Scheduler</span>
              </h1>
              <p className="text-sm text-gray-600">Sistema de Gestión de Cursos</p>
            </div>
          </div>

          {/* User Info / Actions */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">Admin</p>
              <p className="text-xs text-gray-500">Sistema de Gestión</p>
            </div>
            
            {/* Settings Icon */}
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

// Versión alternativa del logo (más elaborada)
export function MaliLogoDetailed({ className = "h-8 w-8" }) {
  return (
    <svg className={className} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="detailedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#DC358B" />
          <stop offset="50%" stopColor="#9333EA" />
          <stop offset="100%" stopColor="#007BFF" />
        </linearGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="2" dy="2" stdDeviation="3" floodOpacity="0.3"/>
        </filter>
      </defs>
      
      {/* Círculo principal con sombra */}
      <circle cx="60" cy="60" r="50" fill="url(#detailedGradient)" filter="url(#shadow)" />
      
      {/* Letra M principal */}
      <path 
        d="M30 85 L30 35 L42 35 L60 70 L78 35 L90 35 L90 85 L78 85 L78 55 L65 80 L55 80 L42 55 L42 85 Z" 
        fill="white" 
        stroke="rgba(255,255,255,0.3)" 
        strokeWidth="1"
      />
      
      {/* Elementos decorativos - calendario/schedule */}
      <rect x="95" y="25" width="20" height="15" rx="2" fill="white" opacity="0.8" />
      <rect x="98" y="28" width="3" height="2" fill="#DC358B" />
      <rect x="103" y="28" width="3" height="2" fill="#DC358B" />
      <rect x="108" y="28" width="3" height="2" fill="#DC358B" />
      <rect x="98" y="32" width="3" height="2" fill="#DC358B" />
      <rect x="103" y="32" width="3" height="2" fill="#DC358B" />
      
      {/* Punto decorativo */}
      <circle cx="15" cy="30" r="4" fill="white" opacity="0.6" />
      <circle cx="105" cy="95" r="3" fill="white" opacity="0.4" />
    </svg>
  );
}