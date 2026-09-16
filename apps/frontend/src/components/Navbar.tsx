import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
    isActive ? "bg-emerald-500 text-slate-950" : "text-slate-300 hover:bg-slate-800 hover:text-white"
  }`;

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <nav className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-6 py-3">
      <div className="flex items-center gap-6">
        <span className="text-lg font-semibold text-white">Code Judge</span>
        {user && (
          <div className="flex items-center gap-2">
            <NavLink to="/editor" className={linkClass}>
              Editor
            </NavLink>
            <NavLink to="/submissions" className={linkClass}>
              Submissions
            </NavLink>
          </div>
        )}
      </div>
      <div className="flex items-center gap-3">
        {user ? (
          <>
            <span className="text-sm text-slate-400">{user.email}</span>
            <button
              onClick={handleLogout}
              className="rounded-md bg-slate-800 px-3 py-1.5 text-sm font-medium text-slate-200 hover:bg-slate-700"
            >
              Log out
            </button>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <NavLink to="/login" className={linkClass}>
              Login
            </NavLink>
            <NavLink to="/register" className={linkClass}>
              Register
            </NavLink>
          </div>
        )}
      </div>
    </nav>
  );
}
