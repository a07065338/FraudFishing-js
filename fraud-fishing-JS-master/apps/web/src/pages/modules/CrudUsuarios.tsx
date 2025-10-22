import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  FiPlus,
  FiTrash2,
  FiEye,
  FiMoreHorizontal,
  FiSearch,
} from "react-icons/fi";

interface UsuarioStats {
  id: number;
  name: string;
  email: string;
  is_admin: boolean;
  is_super_admin: boolean;
  created_at: string; // ISO
  reportCount: number;
  commentCount: number;
  likeCount: number;
}

export default function CrudUsuarios() {
  const [usuarios, setUsuarios] = useState<UsuarioStats[]>([]);
  const [detalle, setDetalle] = useState<UsuarioStats | null>(null);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [tipoNuevo, setTipoNuevo] = useState<"usuario" | "admin">("usuario");
  const [nuevo, setNuevo] = useState({ name: "", email: "", password: "" });

  const [filtro, setFiltro] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<keyof UsuarioStats | "">("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Función para obtener token de autorización
  const authHeaders = () => {
    const token = localStorage.getItem("accessToken");
    return {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  // Carga desde /admin/user/stats -> { users: [...] } - SOLO usuarios normales
  useEffect(() => {
    axios.get("http://localhost:3000/admin/user/stats", {
      headers: authHeaders(),
    })
      .then((res) => {
        const data = res.data;
        // Filtrar solo usuarios que NO son administradores
        const regularUsers = (data?.users ?? []).filter((user: UsuarioStats) => 
          !user.is_admin && !user.is_super_admin
        );
        setUsuarios(regularUsers);
        setPage(1);
      })
      .catch(() => setError("No se pudieron cargar los usuarios"));
  }, []);

  // ===== KPIs (tarjetas) - Actualizadas para usuarios normales =====
  const { total, nuevosSemana, nuevosDia } = useMemo(() => {
    const now = new Date().getTime();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const oneDayMs = 24 * 60 * 60 * 1000;
    let t = 0,
      n = 0,
      a = 0, // Este será 0 ya que solo mostramos usuarios normales
      d = 0;

    for (const u of usuarios) {
      t++;
      if (u.is_admin) a++; // Esto será 0 porque ya filtramos admins
      const created = new Date(u.created_at).getTime();
      if (now - created <= sevenDaysMs) n++;
      if (now - created <= oneDayMs) d++;
    }
    return { total: t, nuevosSemana: n, admins: a, nuevosDia: d };
  }, [usuarios]);

  // Filtro por nombre/email
  const filtrados = useMemo(() => {
    const f = filtro.trim().toLowerCase();
    if (!f) return usuarios;
    return usuarios.filter(
      (u) => u.name.toLowerCase().includes(f) || u.email.toLowerCase().includes(f)
    );
  }, [usuarios, filtro]);

  // Ordenamiento
  const ordenados = useMemo(() => {
    if (!sortKey) return filtrados;
    const arr = [...filtrados];
    arr.sort((a, b) => {
      const va = a[sortKey] as any;
      const vb = b[sortKey] as any;

      if (sortKey === "created_at") {
        const da = new Date(va).getTime();
        const db = new Date(vb).getTime();
        return sortDir === "asc" ? da - db : db - da;
      }
      if (typeof va === "string" && typeof vb === "string") {
        return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      return sortDir === "asc" ? (va as number) - (vb as number) : (vb as number) - (va as number);
    });
    return arr;
  }, [filtrados, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(ordenados.length / pageSize));
  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return ordenados.slice(start, start + pageSize);
  }, [ordenados, page, pageSize]);

  useEffect(() => setPage(1), [filtro, sortKey, sortDir, pageSize]);

  const toggleSort = (key: keyof UsuarioStats) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir("desc");
    } else {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    }
  };

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      // Crear el usuario asegurándose que NO sea admin
      const userData = {
        ...nuevo,
        is_admin: tipoNuevo === "admin", // Solo true si explícitamente se elige admin
        is_super_admin: false // Nunca super admin desde usuarios normales
      };

      await axios.post("http://localhost:3000/users", userData, {
        headers: authHeaders(),
      });
      
      // Recargar solo usuarios normales
      const ref = await axios.get("http://localhost:3000/admin/user/stats", {
        headers: authHeaders(),
      });
      const data = ref.data;
      const regularUsers = (data?.users ?? []).filter((user: UsuarioStats) => 
        !user.is_admin && !user.is_super_admin
      );
      setUsuarios(regularUsers);
      
      setShowForm(false);
      setNuevo({ name: "", email: "", password: "" });
    } catch {
      setError("No se pudo crear el usuario");
    }
  };

  const handleEliminar = async (id: number) => {
    if (!window.confirm("¿Eliminar este usuario?")) return;
    try {
      await axios.delete(`http://localhost:3000/admin/user/${id}`, {
        headers: { Authorization: "Bearer <TOKEN_ADMIN>" },
      });
      setUsuarios((curr) => curr.filter((u) => u.id !== id));
    } catch {
      setError("No se pudo eliminar el usuario");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
          <h2 className="text-[22px] font-semibold tracking-tight">
            Usuarios
          </h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o email..."
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                className="pl-10 pr-4 py-2 w-72 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white"
              />
            </div>
            <button
              className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg shadow-sm cursor-pointer"
              onClick={() => {
              setShowForm(true)
              setTipoNuevo("usuario");
              }}
            >
              <FiPlus className="text-[18px]" />
              Agregar usuario
            </button>
          </div>
        </div>

        {/* Tarjetas KPI - Actualizadas para usuarios normales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard
            title="Usuarios normales"
            value={total}
            tone="solid"
          />
          <KpiCard
            title="Nuevos (7 días)"
            value={nuevosSemana}
            tone="soft"
          />
          <KpiCard
            title="Nuevos (Hoy)"
            value={nuevosDia}
            tone="soft"
          />
          <KpiCard
            title="Usuarios activos"
            value={usuarios.filter(u => u.reportCount > 0 || u.commentCount > 0).length}
            tone="soft"
          />
        </div>

        {error && (
          <div className="text-red-600 text-sm mb-3 bg-red-50 border border-red-200 px-3 py-2 rounded">
            {error}
          </div>
        )}

        {/* Tabla */}
        <div className="w-full text-sm text-left text-gray-600">
          <table className="w-full min-w-[860px]">
            <thead>
              <tr className="text-gray-600">
                <Th onClick={() => toggleSort("name")} active={sortKey === "name"} dir={sortDir}>Nombre</Th>
                <Th onClick={() => toggleSort("email")} active={sortKey === "email"} dir={sortDir}>Email</Th>
                <Th onClick={() => toggleSort("is_admin")} active={sortKey === "is_admin"} dir={sortDir}>Rol</Th>
                <Th onClick={() => toggleSort("reportCount")} active={sortKey === "reportCount"} dir={sortDir}>Reports</Th>
                <Th onClick={() => toggleSort("commentCount")} active={sortKey === "commentCount"} dir={sortDir}>Comments</Th>
                <Th onClick={() => toggleSort("likeCount")} active={sortKey === "likeCount"} dir={sortDir}>Likes</Th>
                <Th onClick={() => toggleSort("created_at")} active={sortKey === "created_at"} dir={sortDir}>Created</Th>
                <th className="py-3 pr-4 text-right w-0">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-300">
              {pageItems.map((user) => (
                <RowUsuario
                  key={user.id}
                  user={user}
                  onView={() => setDetalle(user)}
                  onDelete={() => handleEliminar(user.id)}
                />
              ))}
              {pageItems.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-gray-400">
                    {filtro
                      ? `No se encontraron usuarios con "${filtro}"`
                      : "No hay usuarios."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Footer paginación */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-200 px-4 py-3 bg-white">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Filas por página</span>
              <select
                className="border border-gray-300 rounded-md px-2 py-1 bg-white cursor-pointer"
                value={pageSize}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setPageSize(v);
                  setPage(1);
                }}
              >
                {[10, 20, 50].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <span className="ml-2">
                {pageItems.length > 0
                  ? `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, ordenados.length)} de ${ordenados.length}`
                  : `0 de ${ordenados.length}`}
              </span>
            </div>
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </div>
        </div>

        {/* Modal crear */}
        {showForm && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <form
              onSubmit={handleCrear}
              className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md"
            >
              <h3 className="text-lg font-semibold mb-4">{tipoNuevo === "usuario" ? "Agregar usuario" : "Agregar administrador"}</h3>
              <input
                className="bg-gray-50 p-2 rounded w-full mb-3"
                placeholder="Nombre"
                value={nuevo.name}
                onChange={(e) => setNuevo((n) => ({ ...n, name: e.target.value }))}
                required
              />
              <input
                className="bg-gray-50 p-2 rounded w-full mb-3"
                placeholder="Email"
                type="email"
                value={nuevo.email}
                onChange={(e) => setNuevo((n) => ({ ...n, email: e.target.value }))}
                required
              />
              <input
                className="bg-gray-50 p-2 rounded w-full mb-4"
                placeholder="Contraseña"
                type="password"
                value={nuevo.password}
                onChange={(e) => setNuevo((n) => ({ ...n, password: e.target.value }))}
                required
              />
              <div className="flex justify-end gap-2">
                <button type="button" className="px-4 py-2 bg-gray-100 hover:bg-gray-300 rounded cursor-pointer" onClick={() => setShowForm(false)}>
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded cursor-pointer">
                  Crear
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Modal detalle */}
        {detalle && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md">
              <h3 className="text-lg font-bold">{detalle.name}</h3>
              <p className="text-gray-700 py-3">{detalle.email}</p>

              <div className="grid grid-cols-3 gap-3 mb-4 text-center">
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-gray-500">Reports</div>
                  <div className="text-xl font-semibold">{detalle.reportCount}</div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-gray-500">Comments</div>
                  <div className="text-xl font-semibold">{detalle.commentCount}</div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-gray-500">Likes</div>
                  <div className="text-xl font-semibold">{detalle.likeCount}</div>
                </div>
              </div>

              <div className="text-xs text-gray-500 mb-5">
                Created: {new Date(detalle.created_at).toLocaleString()}
              </div>

              <div className="flex justify-end">
                <button className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded cursor-pointer" onClick={() => setDetalle(null)}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ====== KpiCard ====== */
function KpiCard({
  title,
  value,
  tone = "soft", // "solid" | "soft"
}: {
  title: string;
  value: number | string;
  tone?: "solid" | "soft";
}) {
  const base =
    tone === "solid"
      ? "bg-teal-600 text-white hover:bg-teal-700"
      : "bg-teal-50 text-teal-900 border border-teal-100 hover:bg-teal-100";
  const numberStyle =
    tone === "solid" ? "text-3xl font-semibold" : "text-3xl font-bold text-teal-700";

  return (
    <div className={`rounded-2xl ${base} p-5 shadow-sm transition-transform transform hover:scale-105 hover:shadow-lg`}>
      <div className="text-sm opacity-90">{title}</div>
      <div className={numberStyle}>{value}</div>
    </div>
  );
}

/* ====== Header cell con ordenamiento ====== */
function Th({
  children,
  onClick,
  active,
  dir,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  dir?: "asc" | "desc";
}) {
  return (
    <th
      className="py-3 px-2 text-left font-bold text-[13px] select-none cursor-pointer"
      onClick={onClick}
      title="Ordenar"
    >
      <div className="inline-flex items-center gap-1">
        {children}
        {active && <span className="text-gray-400">{dir === "asc" ? "▲" : "▼"}</span>}
      </div>
    </th>
  );
}

/* ====== Fila ====== */
function RowUsuario({
  user,
  onView,
  onDelete,
}: {
  user: UsuarioStats;
  onView: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <tr className="border-t hover:bg-teal-50/40">
      <td className="py-4 pl-4">
        <div className="text-lg font-semibold">{user.name}</div>
      </td>
      <td className="py-4">
        <div className="text-base">{user.email}</div>
      </td>
      <td className="py-4">{user.is_admin ? "Admin" : "Usuario"}</td>
      <td className="py-4 pl-8">{user.reportCount}</td>
      <td className="py-4 pl-8">{user.commentCount}</td>
      <td className="py-4 pl-4">{user.likeCount}</td>
      <td className="py-4">
        <div className="text-gray-600 text-sm">
          {new Date(user.created_at).toLocaleDateString()}
        </div>
        <div className="text-gray-400 text-xs">
          {new Date(user.created_at).toLocaleTimeString()}
        </div>
      </td>
      <td className="py-4 pr-4">
        <div className="relative flex justify-end" ref={menuRef}>
          <button
            className="p-2 rounded hover:bg-gray-100 cursor-pointer"
            onClick={() => setOpen((v) => !v)}
            aria-label="Más acciones"
          >
            <FiMoreHorizontal />
          </button>
          {open && (
            <div className="absolute rounded right-0 top-9 z-50 w-40 bg-white bg-white shadow-lg rounded shadow">
              <button
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                onClick={() => {
                  onView();
                  setOpen(false);
                }}
              >
                <FiEye /> Ver
              </button>
              <button
                className="w-full flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 cursor-pointer"
                onClick={() => {
                  onDelete();
                  setOpen(false);
                }}
              >
                <FiTrash2 /> Eliminar
              </button>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

/* ====== Paginación mejorada ====== */
function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}) {
  const pages = useMemo(() => {
    const arr: (number | string)[] = [];
    const push = (v: number | string) => arr.push(v);
    
    // Si no hay páginas, retornar array vacío
    if (totalPages <= 0) return arr;
    
    if (totalPages <= 6) {
      for (let i = 1; i <= totalPages; i++) push(i);
      return arr;
    }
    push(1);
    if (page > 3) push("…");
    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);
    for (let i = start; i <= end; i++) push(i);
    if (page < totalPages - 2) push("…");
    push(totalPages);
    return arr;
  }, [page, totalPages]);

  // Casos edge: No mostrar paginación
  if (totalPages <= 1) {
    return null;
  }

  // Caso edge: Página inválida
  if (page < 1 || page > totalPages) {
    return (
      <div className="flex items-center gap-2 text-red-500 text-sm">
        <span>Página inválida ({page})</span>
        <button
          className="px-2 py-1 rounded border border-red-200 hover:bg-red-50 text-red-600"
          onClick={() => onChange(1)}
        >
          Ir a página 1
        </button>
      </div>
    );
  }

  // Caso edge: Sin datos
  if (totalPages === 0) {
    return (
      <div className="text-gray-500 text-sm">
        No hay usuarios para paginar
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        className="px-2 py-1 rounded border border-gray-200 hover:bg-teal-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page <= 1}
        title={page <= 1 ? "Ya estás en la primera página" : "Página anterior"}
      >
        {"<"}
      </button>
      
      {pages.map((p, i) =>
        typeof p === "number" ? (
          <button
            key={`page-${p}`}
            className={`px-3 py-1 rounded border cursor-pointer transition-colors ${
              p === page
                ? "bg-teal-600 text-white border-teal-600"
                : "border-gray-200 hover:bg-teal-50"
            }`}
            onClick={() => onChange(p)}
            title={`Ir a página ${p}`}
          >
            {p}
          </button>
        ) : (
          <span key={`ellipsis-${i}`} className="px-2 text-gray-500 select-none">
            {p}
          </span>
        )
      )}
      
      <button
        className="px-2 py-1 rounded border border-gray-200 hover:bg-teal-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}
        title={page >= totalPages ? "Ya estás en la última página" : "Página siguiente"}
      >
        {">"}
      </button>

      {/* Indicador de página para muchas páginas */}
      {totalPages > 10 && (
        <span className="ml-2 text-sm text-gray-500 select-none">
          {page} de {totalPages}
        </span>
      )}
    </div>
  );
}