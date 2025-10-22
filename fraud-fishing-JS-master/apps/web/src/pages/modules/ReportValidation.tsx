// CrudValidacionReportes.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiSearch,
  FiEye,
  FiMoreHorizontal,
  FiCheckCircle,
  FiXCircle,
  FiChevronRight,
} from "react-icons/fi";

type StatusId = 1 | 2 | 3 | 4;

interface Tag {
  id: number;
  name: string;
  color: string;
}

interface Report {
  id: number;
  url: string;
  title?: string;
  description?: string;
  categoryId?: number;
  categoryName?: string;
  statusId?: StatusId;
  voteCount?: number;
  commentCount?: number;
  createdAt?: string;  // ISO
  userId?: number; // Cambio: usar userId en lugar de reporterName
  tags?: Tag[];
}

// Agregar interface para datos del usuario
interface UsuarioDetalle {
  id: number;
  name: string;
  email: string;
  is_admin: boolean;
  is_super_admin: boolean;
  created_at: string;
  reportCount: number;
  commentCount: number;
  likeCount: number;
}

const API = "http://localhost:3000";

export default function CrudValidacionReportes() {
  const [activeTab, setActiveTab] = useState<"sin_empezar" | "en_progreso">("sin_empezar");

  // Listas separadas por status
  const [pendientes, setPendientes] = useState<Report[]>([]); // status_id = 1
  const [enProgreso, setEnProgreso] = useState<Report[]>([]); // status_id = 2

  // Estado de UI
  const [error, setError] = useState("");
  const [filtro, setFiltro] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<keyof Report | "">("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Detalle
  const [detalle, setDetalle] = useState<Report | null>(null);
  const [moderationNote, setModerationNote] = useState("");
  
  // Agregar estado para modal de usuario
  const [usuarioDetalle, setUsuarioDetalle] = useState<UsuarioDetalle | null>(null);

  const authHeaders = (): Record<string, string> => {
    const t = localStorage.getItem("accessToken");
    return t ? { Authorization: `Bearer ${t}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
  };

  // Fetch por status
  const fetchByStatus = async (statusId: StatusId) => {
    try {
      const res = await fetch(`${API}/reports?status=${statusId}`, { headers: authHeaders() });
      if (!res.ok) throw new Error();
      const data: Report[] = await res.json();
      if (statusId === 1) setPendientes(data ?? []);
      if (statusId === 2) setEnProgreso(data ?? []);
    } catch {
      setError("No se pudieron cargar los reportes");
    }
  };

  // Agregar función para obtener detalles del usuario
  const fetchUserDetails = async (userId: number) => {
    try {
      const res = await fetch(`${API}/admin/user/stats`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const user = data?.users?.find((u: UsuarioDetalle) => u.id === userId);
      if (user) {
        setUsuarioDetalle(user);
      } else {
        setError("Usuario no encontrado");
      }
    } catch {
      setError("No se pudieron cargar los detalles del usuario");
    }
  };

  useEffect(() => {
    fetchByStatus(1);
    fetchByStatus(2);
  }, []);

  // Filtro/orden/paginación por pestaña activa
  const dataset = activeTab === "sin_empezar" ? pendientes : enProgreso;

  const filtrados = useMemo(() => {
    const f = filtro.trim().toLowerCase();
    if (!f) return dataset;
    return dataset.filter((r) => {
      const u = r.url?.toLowerCase() ?? "";
      const t = r.title?.toLowerCase() ?? "";
      const d = r.description?.toLowerCase() ?? "";
      const uid = r.userId?.toString() ?? "";
      return u.includes(f) || t.includes(f) || d.includes(f) || uid.includes(f);
    });
  }, [dataset, filtro]);

  const ordenados = useMemo(() => {
    if (!sortKey) return filtrados;
    const arr = [...filtrados];
    arr.sort((a, b) => {
      const va = a[sortKey] as any;
      const vb = b[sortKey] as any;

      if (sortKey === "createdAt") {
        const da = va ? new Date(va).getTime() : 0;
        const db = vb ? new Date(vb).getTime() : 0;
        return sortDir === "asc" ? da - db : db - da;
      }
      if (typeof va === "string" && typeof vb === "string") {
        return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      return sortDir === "asc" ? (va ?? 0) - (vb ?? 0) : (vb ?? 0) - (va ?? 0);
    });
    return arr;
  }, [filtrados, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(ordenados.length / pageSize));
  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return ordenados.slice(start, start + pageSize);
  }, [ordenados, page, pageSize]);

  useEffect(() => setPage(1), [activeTab, filtro, sortKey, sortDir, pageSize]);

  const toggleSort = (key: keyof Report) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir("desc");
    } else {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    }
  };

  // Enriquecer detalle
  const fetchReportTags = async (id: number): Promise<Tag[]> => {
    try {
      const res = await fetch(`${API}/reports/${id}/tags`);
      if (!res.ok) throw new Error();
      return await res.json();
    } catch {
      return [];
    }
  };
  const fetchReportCategory = async (id: number): Promise<string> => {
    try {
      const res = await fetch(`${API}/reports/${id}/category`);
      if (!res.ok) throw new Error();
      const { categoryName } = await res.json();
      return categoryName;
    } catch {
      return "Sin categoría";
    }
  };
  const handleVerDetalle = async (rep: Report) => {
    const [tags, categoryName] = await Promise.all([
      fetchReportTags(rep.id),
      fetchReportCategory(rep.id),
    ]);
    setDetalle({ ...rep, tags, categoryName });
    setModerationNote("");
  };

  // Cambios de status
  const updateStatus = async (id: number, statusId: StatusId, note?: string) => {
    setError("");
    try {
      const res = await fetch(`${API}/reports/${id}/status`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ statusId, moderationNote: note ?? undefined }),
      });
      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        console.error("Update status error:", msg);
        throw new Error();
      }
      // Refrescar ambas listas para mantener consistencia
      await Promise.all([fetchByStatus(1), fetchByStatus(2)]);
      if (detalle && detalle.id === id) setDetalle(null);
    } catch {
      setError("No se pudo actualizar el status");
    }
  };

  // ===== KPIs =====
  const { totalReportes, totalSinEmpezar, totalEnProgreso, nuevasSinEmpezar24h } = useMemo(() => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    
    const totalSinEmpezar = pendientes.length;
    const totalEnProgreso = enProgreso.length;
    const totalReportes = totalSinEmpezar + totalEnProgreso;
    
    // Contar reportes "sin empezar" creados en las últimas 24 horas
    const nuevasSinEmpezar24h = pendientes.filter(r => 
      r.createdAt && (now - new Date(r.createdAt).getTime() <= oneDay)
    ).length;
    
    return { 
      totalReportes, 
      totalSinEmpezar, 
      totalEnProgreso, 
      nuevasSinEmpezar24h 
    };
  }, [pendientes, enProgreso]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
          <h2 className="text-[22px] font-semibold tracking-tight">
            Validación de reportes
          </h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por URL, título, descripción o user ID…"
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                className="pl-10 pr-4 py-2 w-80 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white"
              />
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard title="Total reportes" value={totalReportes} tone="solid" />
          <KpiCard title="Sin empezar" value={totalSinEmpezar} tone="soft" />
          <KpiCard title="En progreso" value={totalEnProgreso} tone="soft" />
          <KpiCard title="Nuevas (24h)" value={nuevasSinEmpezar24h} tone="soft" />
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-4">
          <button
            className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition ${
              activeTab === "sin_empezar"
                ? "bg-teal-50 border-teal-300 text-teal-700"
                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 cursor-pointer"
            }`}
            onClick={() => setActiveTab("sin_empezar")}
          >
            Sin empezar (status 1) {/* Mostrar count en el tab */}
            <span className="ml-2 inline-flex px-2 py-1 text-xs font-bold rounded-full bg-teal-100 text-teal-800">
              {totalSinEmpezar}
            </span>
          </button>
          <button
            className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition ${
              activeTab === "en_progreso"
                ? "bg-blue-50 border-blue-300 text-blue-700"
                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 cursor-pointer"
            }`}
            onClick={() => setActiveTab("en_progreso")}
          >
            En progreso (status 2) {/* Mostrar count en el tab */}
            <span className="ml-2 inline-flex px-2 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-800">
              {totalEnProgreso}
            </span>
          </button>
        </div>

        {error && (
          <div className="text-red-600 text-sm mb-3 bg-red-50 border border-red-200 px-3 py-2 rounded">
            {error}
          </div>
        )}

        {/* Tabla (estilo de CrudAdmins) */}
        <div className="w-full text-sm text-left text-gray-600">
          <table className="w-full min-w-[980px]">
            <thead>
              <tr className="text-gray-600">
                <Th onClick={() => toggleSort("url")} active={sortKey === "url"} dir={sortDir}>
                  URL
                </Th>
                <Th onClick={() => toggleSort("title")} active={sortKey === "title"} dir={sortDir}>
                  Título
                </Th>
                <Th onClick={() => toggleSort("userId")} active={sortKey === "userId"} dir={sortDir}>
                  User ID
                </Th>
                <Th onClick={() => toggleSort("createdAt")} active={sortKey === "createdAt"} dir={sortDir}>
                  Creado
                </Th>
                <th className="py-3 pr-4 text-right w-56">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-300">
              {pageItems.map((r) => (
                <RowValidacion
                  key={r.id}
                  rep={r}
                  isTabPendientes={activeTab === "sin_empezar"}
                  onView={() => handleVerDetalle(r)}
                  onMoveToProgress={() => updateStatus(r.id, 2)}
                  onViewUser={(userId) => fetchUserDetails(userId)}
                />
              ))}
              {pageItems.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-gray-400">
                    {filtro ? `Sin resultados para "${filtro}"` : "No hay reportes."}
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

        {/* Modal detalle: aprobar/denegar (solo en pestaña 2) */}
        {detalle && activeTab === "en_progreso" && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-1">
                    {detalle.title || detalle.url}
                  </h3>
                  <a
                    href={detalle.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-teal-700 hover:underline break-all"
                  >
                    {detalle.url}
                  </a>
                  {detalle.description && (
                    <p className="text-gray-700 mt-2">{detalle.description}</p>
                  )}

                  {/* Categoría */}
                  <div className="mt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-semibold text-gray-600">Categoría:</span>
                      <span className="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800">
                        {detalle.categoryName || "Sin categoría"}
                      </span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="mt-4">
                    <div className="text-sm font-semibold text-gray-600 mb-2">Tags:</div>
                    {detalle.tags && detalle.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {detalle.tags.map((tag) => (
                          <span
                            key={tag.id}
                            className="inline-flex px-3 py-1 text-xs font-bold rounded-full shadow-sm"
                            style={{ backgroundColor: tag.color || "#E5E7EB", color: "#374151" }}
                          >
                            #{tag.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">Sin tags</span>
                    )}
                  </div>

                  {/* Métricas */}
                  <div className="grid grid-cols-3 gap-3 my-5 text-center">
                    <div className="rounded-lg border p-3">
                      <div className="text-xs text-gray-500">Votos</div>
                      <div className="text-xl font-semibold">{detalle.voteCount ?? 0}</div>
                    </div>
                    <div className="rounded-lg border p-3">
                      <div className="text-xs text-gray-500">Comentarios</div>
                      <div className="text-xl font-semibold">{detalle.commentCount ?? 0}</div>
                    </div>
                    <div className="rounded-lg border p-3">
                      <div className="text-xs text-gray-500">Status</div>
                      <div className="text-xl font-semibold">{detalle.statusId ?? "—"}</div>
                    </div>
                  </div>

                  {/* Nota de moderación */}
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nota de moderación (opcional)
                    </label>
                    <textarea
                      className="w-full border rounded-lg p-2"
                      rows={3}
                      placeholder="Agrega contexto de por qué apruebas o deniegas…"
                      value={moderationNote}
                      onChange={(e) => setModerationNote(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded cursor-pointer"
                  onClick={() => setDetalle(null)}
                >
                  Cerrar
                </button>
              </div>

              {/* Acciones finales */}
              <div className="flex flex-col sm:flex-row gap-2 justify-end mt-6">
                <button
                  className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-red-700 border-red-300 hover:bg-red-50"
                  onClick={() => updateStatus(detalle.id, 4, moderationNote)}
                  title="Denegar (status 4)"
                >
                  <FiXCircle /> Denegar
                </button>
                <button
                  className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white"
                  onClick={() => updateStatus(detalle.id, 3, moderationNote)}
                  title="Aprobar (status 3)"
                >
                  <FiCheckCircle /> Aprobar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal detalle usuario */}
        {usuarioDetalle && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md">
              <h3 className="text-lg font-bold mb-1">{usuarioDetalle.name}</h3>
              <p className="text-gray-700">{usuarioDetalle.email}</p>
              <p className="text-sm text-gray-500 mb-4">
                Rol: {usuarioDetalle.is_admin ? "Admin" : "Usuario"}
              </p>

              <div className="grid grid-cols-3 gap-3 mb-4 text-center">
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-gray-500">Reports</div>
                  <div className="text-xl font-semibold">{usuarioDetalle.reportCount}</div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-gray-500">Comments</div>
                  <div className="text-xl font-semibold">{usuarioDetalle.commentCount}</div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-gray-500">Likes</div>
                  <div className="text-xl font-semibold">{usuarioDetalle.likeCount}</div>
                </div>
              </div>

              <div className="text-xs text-gray-500 mb-5">
                Created: {new Date(usuarioDetalle.created_at).toLocaleString()}
              </div>

              <div className="flex justify-end">
                <button 
                  className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded" 
                  onClick={() => setUsuarioDetalle(null)}
                >
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

/* ====== Header cell con ordenamiento (mismo estilo CrudAdmins) ====== */
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
function RowValidacion({
  rep,
  isTabPendientes,
  onView,
  onMoveToProgress,
  onViewUser,
}: {
  rep: Report;
  isTabPendientes: boolean;
  onView: () => void;
  onMoveToProgress: () => void;
  onViewUser: (userId: number) => void;
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
        <a href={rep.url} target="_blank" rel="noreferrer" className="text-teal-700 hover:underline break-all">
          {rep.url}
        </a>
      </td>
      <td className="py-4">{rep.title ?? "—"}</td>
      <td className="py-4">
        {rep.userId ? (
          <button
            onClick={() => onViewUser(rep.userId!)}
            className="text-teal-600 hover:text-teal-800 hover:underline font-medium cursor-pointer"
            title="Ver detalles del usuario"
          >
            #{rep.userId}
          </button>
        ) : (
          "—"
        )}
      </td>
      <td className="py-4">
        <div className="text-gray-600 text-sm">
          {rep.createdAt ? new Date(rep.createdAt).toLocaleDateString() : "—"}
        </div>
        <div className="text-gray-400 text-xs">
          {rep.createdAt ? new Date(rep.createdAt).toLocaleTimeString() : ""}
        </div>
      </td>
      <td className="py-4 pr-4">
        <div className="relative flex justify-end" ref={menuRef}>
          {isTabPendientes ? (
            // En pestaña "Sin empezar": solo botón directo para mover a progreso
            <button
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium cursor-pointer"
              onClick={onMoveToProgress}
              title="Mover a En progreso (status 2)"
            >
              <FiChevronRight /> Iniciar revisión
            </button>
          ) : (
            // En pestaña "En progreso": menú completo con opciones
            <>
              <button
                className="p-2 rounded hover:bg-gray-100 cursor-pointer"
                onClick={() => setOpen((v) => !v)}
                aria-label="Más acciones"
              >
                <FiMoreHorizontal />
              </button>
              {open && (
                <div className="absolute right-0 top-9 w-56 bg-white border-gray-200 rounded shadow z-10">
                  <button
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      onView();
                      setOpen(false);
                    }}
                  >
                    <FiEye /> Ver detalle completo
                  </button>
                </div>
              )}
            </>
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
        No hay reportes para paginar
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
            key={`page-${p}`} // ← Mejor key más específica
            className={`px-3 py-1 rounded border cursor-pointer transition-colors ${
              p === page ? "bg-teal-600 text-white border-teal-600" : "border-gray-200 hover:bg-teal-50"
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

/* ====== KpiCard (igual que en CrudReportes) ====== */
function KpiCard({
  title,
  value,
  tone = "soft",
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
