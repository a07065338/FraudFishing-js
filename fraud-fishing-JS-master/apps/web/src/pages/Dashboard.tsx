import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { axiosInstance } from "../network/axiosInstance";
import {
  HomeIcon,
  Cog6ToothIcon,
  ChartPieIcon,
  UserIcon,
  PlusCircleIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../context/AuthContext";

interface User {
  id: number;
  email: string;
  name: string;
  is_admin: boolean;
  is_super_admin: boolean;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const { logout } = useAuth();
  const navigate = useNavigate();

  // Obtener información del usuario actual
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) return;

        const res = await axiosInstance.get("/auth/profile");

        if (res.status === 200) {
          const data = res.data;
          console.log("Datos recibidos:", data);
          const userData = data.profile;
          setUser({
            id: userData.id,
            email: userData.email,
            name: userData.name,
            is_admin: Boolean(userData.is_admin),
            is_super_admin: Boolean(userData.is_super_admin),
          });
        }
      } catch (error) {
        console.error("Error al obtener el perfil del usuario:", error);
      }
    };

    fetchUserProfile();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 h-screen flex flex-col bg-white border-r border-teal-600">
        {/* Logo */}
        <div className="p-6 text-2xl font-bold text-teal-700">
          Fraud<span className="text-black">Fishing</span>
        </div>

        {/* Menu */}
        <nav className="flex-1 px-4 space-y-2">
          <NavLink
            to="/dashboard"
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                isActive
                  ? "bg-teal-100 text-teal-700 font-semibold"
                  : "text-gray-700 hover:bg-teal-50"
              }`
            }
          >
            <HomeIcon className="w-5 h-5 text-teal-600" />
            Dashboard
          </NavLink>

          <NavLink
            to="reportes"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                isActive
                  ? "bg-teal-100 text-teal-700 font-semibold"
                  : "text-gray-700 hover:bg-teal-50"
              }`
            }
          >
            <Cog6ToothIcon className="w-5 h-5 text-teal-600" />
            Reportes
          </NavLink>

          <NavLink
            to="usuarios"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                isActive
                  ? "bg-teal-100 text-teal-700 font-semibold"
                  : "text-gray-700 hover:bg-teal-50"
              }`
            }
          >
            <UserIcon className="w-5 h-5 text-teal-600" />
            Usuarios
          </NavLink>

          <NavLink
            to="categorias"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                isActive
                  ? "bg-teal-100 text-teal-700 font-semibold"
                  : "text-gray-700 hover:bg-teal-50"
              }`
            }
          >
            <ChartPieIcon className="w-5 h-5 text-teal-600" />
            Categorías
          </NavLink>

          {/* Solo mostrar "Admins" si el usuario es super admin */}
          {(user?.is_super_admin === true) &&  (
            <NavLink
              to="admins"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                  isActive
                    ? "bg-teal-100 text-teal-700 font-semibold"
                    : "text-gray-700 hover:bg-teal-50"
                }`
              }
            >
              <PlusCircleIcon className="w-5 h-5 text-teal-600" />
              Admins
            </NavLink>
          )}

          <NavLink
            to="validar"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                isActive
                  ? "bg-teal-100 text-teal-700 font-semibold"
                  : "text-gray-700 hover:bg-teal-50"
              }`
            }
          >
            <DocumentTextIcon className="w-5 h-5 text-teal-600" />
            Validar Reportes
          </NavLink>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/30">
          <button
            onClick={handleLogout}
            className="w-full py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}