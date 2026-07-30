import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Logout } from '@mui/icons-material';
import { logout } from '../auth/authClient';
import { BRAND } from '../theme/theme';

// Left sidebar + content shell used by every page — replaced the old top
// AppBar (Header.jsx). Sidebar carries the app brand and section nav;
// the page's own title now renders as a heading in the content column.
const AppShell = ({ title, navLinks = [], showLogout = false, children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="w-full h-screen overflow-hidden flex bg-brand-paper">
      <aside
        className="w-60 h-full flex-shrink-0 flex flex-col"
        style={{ backgroundColor: BRAND.navy }}
      >
        <div className="flex items-center gap-2.5 px-4 py-5 border-b border-white/10">
          <img src="/depEdCNLogo.png" alt="DepEd SDO Camarines Norte seal" className="w-9 h-9 object-contain" />
          <div className="leading-tight">
            <div className="text-white font-bold text-sm">SDO Camarines Norte</div>
            <div className="text-white/50 text-[10px] uppercase tracking-wide">Records System</div>
          </div>
        </div>

        <nav className="scrollbar-on-dark flex-1 min-h-0 overflow-y-auto px-2 py-2 flex flex-col gap-1">
          {navLinks.map((link) => {
            const active = link.active !== undefined ? link.active : location.pathname === link.path;
            return (
              <button
                key={link.path}
                onClick={() => (link.onClick ? link.onClick() : navigate(link.path))}
                className={`w-full text-left px-3.5 py-2.5 rounded-lg text-sm font-semibold border-l-4 transition-all duration-200 ease-out ${
                  active
                    ? 'text-white border-brand-accent bg-white/10 shadow-[inset_0_0_0_1px_rgba(184,128,31,0.15)]'
                    : 'text-white/70 border-transparent hover:bg-white/5 hover:text-white hover:translate-x-0.5'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {showLogout && (
          <div className="p-2.5 border-t border-white/10">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm font-semibold text-white/75 hover:bg-white/5 hover:text-white transition-all duration-200 ease-out hover:translate-x-0.5"
            >
              <Logout sx={{ fontSize: 18 }} />
              Log out
            </button>
          </div>
        )}

        <div className="px-4 py-3 border-t border-white/10 text-center">
          <span className="text-white/35 text-[10px] leading-tight">
            Credits for Interns of Mabini 2025 &amp; 2026
          </span>
        </div>
      </aside>

      <div className="flex-1 min-w-0 h-full flex flex-col overflow-hidden">
        {title && (
          <header className="px-6 pt-5 pb-3 flex-shrink-0 border-b" style={{ borderColor: BRAND.line }}>
            <h1 className="text-xl font-bold" style={{ color: BRAND.navy }}>{title}</h1>
          </header>
        )}
        <div className="flex-1 min-h-0 overflow-auto px-6 pt-5 pb-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AppShell;
