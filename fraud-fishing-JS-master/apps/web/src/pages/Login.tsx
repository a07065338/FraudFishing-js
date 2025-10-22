import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { axiosInstance } from "../network/axiosInstance";

interface LoginProps {
  setUser: (user: { correo: string }) => void;
}

export default function Login({ setUser }: LoginProps) {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, isAuthenticated, loading: loadingAuth } = useAuth();

  useEffect(() => {
    if (!loadingAuth && isAuthenticated) {
      navigate("/dashboard");
    }
  }, [loadingAuth, isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1) Login mediante el contexto (guarda tokens en localStorage)
      await login(correo, contrasena);

      // 2) Obtener perfil con el accessToken recién guardado
      const { data } = await axiosInstance.get("/auth/profile");
      const profile = data?.profile;

      if (!profile) {
        throw new Error("No se pudo obtener el perfil");
      }

      // 3) Solo admins
      if (!profile.is_admin) {
        setError("Solo los administradores pueden ingresar.");
        setLoading(false);
        return;
      }

      // 4) Guardar usuario en tu estado y navegar
      setUser({ correo: profile.email });
      navigate("/dashboard");
    } catch (err: any) {
      console.error("Error al iniciar sesión:", err);
      setError(
        err?.response?.data?.message ??
          err?.message ??
          "Error de conexión o credenciales inválidas"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen font-sans">
      {/* Panel izquierdo (formulario) */}
      <div className="flex flex-1 bg-white items-center justify-center p-8">
        <div className="w-full max-w-sm text-center">
          {/* Logo */}
          <img src="/logo.png" alt="Fraud Fishing" className="mx-auto mb-10 w-64" />

          <h2 className="text-2xl font-bold text-[#00204D] mb-4">Inicia sesión</h2>
          <p className="text-gray-600 mb-6">Accede con tus credenciales</p>

          <form onSubmit={handleSubmit} className="flex flex-col items-center space-y-4">
            <input
              type="email"
              placeholder="Correo"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg 
                         focus:outline-none focus:ring-2 focus:ring-[#00B5BC]"
            />
            <input
              type="password"
              placeholder="Contraseña"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg 
                         focus:outline-none focus:ring-2 focus:ring-[#00B5BC]"
            />

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-[#00B5BC] text-white 
                         font-bold text-lg hover:bg-[#009da3] transition-colors cursor-pointer
                         disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>
        </div>
      </div>

      {/* Panel derecho (bienvenida) */}
      <div className="flex flex-1 bg-gradient-to-br from-[#00204D] to-[#00B5BC] 
                      items-center justify-center text-center text-white p-8">
        <div>
          <h2 className="text-3xl font-bold mb-4">¡Bienvenido!</h2>
          <p className="max-w-xs mx-auto">
            Ingresa tus datos para acceder al dashboard y gestionar tu información.
          </p>
        </div>
      </div>
    </div>
  );
}
