// CrudReportes.tsx — estilo replicado desde CrudUsuarios

import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  FiTrash2,
  FiEye,
  FiMoreHorizontal,
  FiSearch,
  FiFlag,
} from "react-icons/fi";

interface Tag {
  id: number;
  name: string;
}

interface Report {
  id: number;
  url: string;
  title?: string;
  description?: string;
  categoryId?: number;
  categoryName?: string;
  statusId?: number;
  voteCount?: number;
  commentCount?: number;
  createdAt?: string;
  reporterName?: string;
  userId?: number;
  tags?: Tag[];
}

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

interface Sibling extends Report {}

export default function CrudReportes() {
  const [reportes, setReportes] = useState<Report[]>([]);
  const [detalle, setDetalle] = useState<Report | null>(null);
  const [siblings, setSiblings] = useState<Sibling[] | null>(null);
  const [error, setError] = useState("");

  const [filtro, setFiltro] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<keyof Report | "">("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [usuarioDetalle, setUsuarioDetalle] = useState<UsuarioDetalle | null>(null);

  const API = "http://localhost:3000";
  const authHeaders = (): Record<string, string> => {
    const t = localStorage.getItem("accessToken");
    return t ? { Authorization: `Bearer ${t}` } : {};
  };

  // ===== Carga de reportes
  const fetchReportes = async () => {
    setError("");
    try {
      const res = await axios.get(`${API}/reports?status=3`);
      const data: Report[] = res.data;
      setReportes(data ?? []);
      setPage(1);
    } catch {
      setError("No se pudieron cargar los reportes");
    }
  };

  // ===== Obtener tags
  const fetchReportTags = async (reportId: number): Promise<Tag[]> => {
    try {
      const res = await axios.get(`${API}/reports/${reportId}/tags`);
      console.log("Tags del reporte cargados");
      console.log(res);
      const tags: Tag[] = res.data;
      return tags;
    } catch {
      console.error("Error al cargar tags del reporte");
      return [];
    }
  };

  // ===== Obtener categoría
  const fetchReportCategory = async (reportId: number): Promise<string> => {
    try {
      const res = await axios.get(`${API}/reports/${reportId}/category`);
      const response: { categoryName: string } = res.data;
      console.log(res);
      return response.categoryName;
    } catch {
      console.error("Error al cargar categoría del reporte");
      return "Sin categoría";
    }
  };

  const fetchUserDetails = async (userId: number) => {
    try {
      const res = await axios.get(`${API}/admin/user/stats`, {
        headers: { ...authHeaders(), "Content-Type": "application/json" },
      });
      const data = res.data;
      const user = data?.users?.find((u: UsuarioDetalle) => u.id === userId);
      if (user) setUsuarioDetalle(user);
      else setError("Usuario no encontrado");
    } catch {
      setError("No se pudieron cargar los detalles del usuario");
    }
  };

  // ===== Detalle (cargar categoría + tags + siblings)
  const handleVerDetalle = async (rep: Report) => {
    const [tags, categoryName] = await Promise.all([
      fetchReportTags(rep.id),
      fetchReportCategory(rep.id),
    ]);

    const reporteCompleto = { ...rep, tags, categoryName };
    setDetalle(reporteCompleto);
    await fetchSiblings(rep.url);
  };

  useEffect(() => {
    fetchReportes();
  }, []);

  // ===== KPIs
  const { total, populares, conComentarios, hoy } = useMemo(() => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    let t = 0,
      pop = 0,
      cc = 0,
      d = 0;
    for (const r of reportes) {
      t++;
      if ((r.voteCount ?? 0) > 0) pop++;
      if ((r.commentCount ?? 0) > 0) cc++;
      if (r.createdAt && now - new Date(r.createdAt).getTime() <= oneDay) d++;
    }
    return { total: t, populares: pop, conComentarios: cc, hoy: d };
  }, [reportes]);

  // ===== Filtro
  const filtrados = useMemo(() => {
    const f = filtro.trim().toLowerCase();
    if (!f) return reportes;
    return reportes.filter((r) => {
      const u = r.url?.toLowerCase() ?? "";
      const t = r.title?.toLowerCase() ?? "";
      const d = r.description?.toLowerCase() ?? "";
      return u.includes(f) || t.includes(f) || d.includes(f);
    });
  }, [reportes, filtro]);

  // ===== Ordenamiento
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

  useEffect(() => setPage(1), [filtro, sortKey, sortDir, pageSize]);

  const toggleSort = (key: keyof Report) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir("desc");
    } else {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    }
  };

  // ===== Eliminar
  const handleEliminar = async (id: number) => {
    if (!window.confirm("¿Eliminar este reporte?")) return;
    try {
      await axios.delete(`${API}/reports/${id}`, {
        headers: { ...authHeaders() },
      });
      setReportes((curr) => curr.filter((r) => r.id !== id));
      if (detalle?.id === id) setDetalle(null);
    } catch {
      setError("No se pudo eliminar el reporte");
    }
  };

  // ===== Siblings por URL
  const fetchSiblings = async (url: string) => {
    setSiblings(null);
    try {
      const res = await axios.get(`${API}/reports?url=${encodeURIComponent(url)}`);
      const data: Sibling[] = res.data;
      setSiblings(data ?? []);
    } catch {
      setSiblings([]);
    }
  };

  // ===== UI
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
          <h2 className="text-[22px] font-semibold tracking-tight">Reportes</h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por URL, título o descripción…"
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                className="pl-10 pr-4 py-2 w-72 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white"
              />
            </div>
          </div>
        </div>

        {/* Tarjetas KPI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard title="Reportes activos" value={total} tone="solid" />
          <KpiCard title="Con votos" value={populares} tone="soft" />
          <KpiCard title="Con comentarios" value={conComentarios} tone="soft" />
          <KpiCard title="Nuevos (hoy)" value={hoy} tone="soft" />
        </div>

        {error && (
          <div className="text-red-600 text-sm mb-3 bg-red-50 border border-red-200 px-3 py-2 rounded">
            {error}
          </div>
        )}

        {/* Tabla */}
        <div className="w-full text-sm text-left text-gray-600">
          <table className="w-full min-w-[980px]">
            <thead>
              <tr className="text-gray-600">
                <Th
                  onClick={() => toggleSort("url")}
                  active={sortKey === "url"}
                  dir={sortDir}
                >
                  URL
                </Th>
                <Th
                  onClick={() => toggleSort("title")}
                  active={sortKey === "title"}
                  dir={sortDir}
                >
                  Título
                </Th>
                <Th
                  onClick={() => toggleSort("voteCount")}
                  active={sortKey === "voteCount"}
                  dir={sortDir}
                >
                  Votos
                </Th>
                <Th
                  onClick={() => toggleSort("commentCount")}
                  active={sortKey === "commentCount"}
                  dir={sortDir}
                >
                  Comentarios
                </Th>
                <Th
                  onClick={() => toggleSort("userId")}
                  active={sortKey === "userId"}
                  dir={sortDir}
                >
                  Usuario
                </Th>
                <Th
                  onClick={() => toggleSort("createdAt")}
                  active={sortKey === "createdAt"}
                  dir={sortDir}
                >
                  Creado
                </Th>
                <th className="py-3 pr-4 text-right w-0">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-300">
              {pageItems.map((rep) => (
                <RowReporte
                  key={rep.id}
                  rep={rep}
                  onView={() => handleVerDetalle(rep)}
                  onDelete={() => handleEliminar(rep.id)}
                  onViewUser={(userId) => fetchUserDetails(userId)}
                />
              ))}
              {pageItems.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-gray-400">
                    {filtro
                      ? `Sin resultados para "${filtro}"`
                      : "No hay reportes."}
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
                  ? `${(page - 1) * pageSize + 1}–${Math.min(
                      page * pageSize,
                      ordenados.length
                    )} de ${ordenados.length}`
                  : `0 de ${ordenados.length}`}
              </span>
            </div>
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </div>
        </div>

        {/* Modal detalle */}
        {detalle && (
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
                      <span className="text-sm font-semibold text-gray-600">
                        Categoría:
                      </span>
                      <span className="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800">
                        {detalle.categoryName || "Sin categoría"}
                      </span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="mt-4">
                    <div className="text-sm font-semibold text-gray-600 mb-2">
                      Tags:
                    </div>
                    {detalle.tags && detalle.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {detalle.tags.map((tag) => (
                          <span
                            key={tag.id}
                            className="inline-flex px-3 py-1 text-xs font-bold rounded-full shadow-sm"
                            style={{
                              backgroundColor: "#E5E7EB",
                              color: "#374151",
                            }}
                          >
                            #{tag.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">Sin tags</span>
                    )}
                  </div>

                  <div className="text-xs text-gray-500 mt-4">
                    Creado:{" "}
                    {detalle.createdAt
                      ? new Date(detalle.createdAt).toLocaleString()
                      : "—"}
                  </div>
                </div>
                <button
                  className="bg-teal-600 hover:bg-teal-700 text-white px-3 py-2 rounded cursor-pointer"
                  onClick={() => setDetalle(null)}
                >
                  Cerrar
                </button>
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
                  <div className="text-xs text-gray-500">Usuario</div>
                  <div className="text-xl font-semibold">
                    {detalle.userId ? (
                      <button
                        onClick={() => fetchUserDetails(detalle.userId!)}
                        className="text-teal-600 hover:text-teal-800 hover:underline font-medium cursor-pointer"
                        title="Ver detalles del usuario"
                      >
                        #{detalle.userId}
                      </button>
                    ) : ("—")}
                  </div>
                </div>
              </div>

              {/* Hermanos por URL */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <FiFlag /> Otros reportes de esta URL
                  </h4>
                  <span className="text-sm text-gray-500">
                    {siblings?.length ?? 0}
                  </span>
                </div>

                {!siblings && (
                  <div className="text-gray-400">Cargando…</div>
                )}
                {siblings && siblings.length === 0 && (
                  <div className="text-gray-400">
                    No hay más reportes de esta URL.
                  </div>
                )}
                {siblings && siblings.length > 0 && (
                  <ul className="space-y-3 max-h-72 overflow-auto pr-1">
                    {siblings.map((s) => (
                      <li
                        key={s.id}
                        className=" rounded-lg p-3 bg-gray-50"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="font-medium">
                              {s.title || "(sin título)"} · #{s.id}
                            </div>
                            <div className="text-xs text-gray-500">
                              {s.createdAt
                                ? new Date(s.createdAt).toLocaleString()
                                : "—"}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            <span>👍 {s.voteCount ?? 0}</span>
                            <span>💬 {s.commentCount ?? 0}</span>
                            <button
                              className="px-3 py-1 border rounded hover:bg-gray-100 cursor-pointer"
                              onClick={() => handleVerDetalle(s)}
                            >
                              Ver
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal detalle usuario */}
        {usuarioDetalle && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between gap-4 mb-4">
                <h3 className="text-lg font-bold">Detalles del Usuario</h3>
                <button
                  className="bg-teal-600 hover:bg-teal-700 text-white px-3 py-2 rounded"
                  onClick={() => setUsuarioDetalle(null)}
                >
                  Cerrar
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-sm font-semibold text-gray-600">Nombre:</span>
                  <p className="text-gray-900">{usuarioDetalle.name}</p>
                </div>
                
                <div>
                  <span className="text-sm font-semibold text-gray-600">Email:</span>
                  <p className="text-gray-900">{usuarioDetalle.email}</p>
                </div>

                <div>
                  <span className="text-sm font-semibold text-gray-600">Tipo:</span>
                  <div className="flex gap-2 mt-1">
                    {usuarioDetalle.is_super_admin && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                        Super Admin
                      </span>
                    )}
                    {usuarioDetalle.is_admin && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        Admin
                      </span>
                    )}
                    {!usuarioDetalle.is_admin && !usuarioDetalle.is_super_admin && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                        Usuario Regular
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-sm font-semibold text-gray-600">Registrado:</span>
                  <p className="text-gray-900">
                    {new Date(usuarioDetalle.created_at).toLocaleString()}
                  </p>
                </div>

                {/* Estadísticas */}
                <div className="grid grid-cols-3 gap-3 pt-4 border-t">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-teal-600">
                      {usuarioDetalle.reportCount}
                    </div>
                    <div className="text-sm text-gray-500">Reportes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {usuarioDetalle.commentCount}
                    </div>
                    <div className="text-sm text-gray-500">Comentarios</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {usuarioDetalle.likeCount}
                    </div>
                    <div className="text-sm text-gray-500">Likes</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ====== KpiCard (idéntico a CrudUsuarios) ====== */
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
      ? "bg-teal-600 text-white"
      : "bg-teal-50 text-teal-900 border border-teal-100";
  const numberStyle =
    tone === "solid"
      ? "text-3xl font-semibold"
      : "text-3xl font-bold text-teal-700";

  return (
    <div className={`rounded-2xl ${base} p-5 shadow-sm transition-transform transform hover:scale-105 hover:shadow-lg`}>
      <div className="text-sm opacity-90">{title}</div>
      <div className={numberStyle}>{value}</div>
    </div>
  );
}

/* ====== Header cell con ordenamiento (idéntico) ====== */
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
        {active && (
          <span className="text-gray-400">{dir === "asc" ? "▲" : "▼"}</span>
        )}
      </div>
    </th>
  );
}

/* ====== Fila — estilos replicados del RowUsuario ====== */
function RowReporte({
  rep,
  onView,
  onDelete,
  onViewUser,
}: {
  rep: Report;
  onView: () => void;
  onDelete: () => void;
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
        <a
          href={rep.url}
          target="_blank"
          rel="noreferrer"
          className="text-teal-700 hover:underline break-all"
        >
          {rep.url}
        </a>
      </td>
      <td className="py-4">{rep.title ?? "—"}</td>
      <td className="py-4 pl-8">{rep.voteCount ?? 0}</td>
      <td className="py-4 pl-8">{rep.commentCount ?? 0}</td>
      <td className="py-4">
        {rep.userId ? (
          <button
            onClick={() => onViewUser(rep.userId!)}
            className="text-teal-600 hover:text-teal-800 hover:underline font-medium cursor-pointer"
            title="Ver detalles del usuario"
          >
            #{rep.userId}
          </button>
        ) : ("—")}
      </td>
      <td className="py-4">
        <div className="text-gray-600 text-sm">
          {rep.createdAt ? new Date(rep.createdAt).toLocaleDateString() : "—"}
        </div>
        <div className="text-gray-400 text-xs">
          {rep.createdAt ? new Date(rep.createdAt).toLocaleTimeString() : "—"}
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

  if (totalPages <= 1) {
    return null;
  }

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

  if (totalPages === 0) {
    return (
      <div className="text-gray-500 text-sm">
        No hay datos para paginar
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* Botón anterior */}
      <button
        className="px-2 py-1 rounded border border-gray-200 hover:bg-teal-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page <= 1}
        title={page <= 1 ? "Ya estás en la primera página" : "Página anterior"}
      >
        {"<"}
      </button>

      {/* Páginas numeradas */}
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

      {/* Botón siguiente */}
      <button
        className="px-2 py-1 rounded border border-gray-200 hover:bg-teal-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}
        title={page >= totalPages ? "Ya estás en la última página" : "Página siguiente"}
      >
        {">"}
      </button>

      {/* Indicador de página (para muchas páginas) */}
      {totalPages > 10 && (
        <span className="ml-2 text-sm text-gray-500 select-none">
          {page} de {totalPages}
        </span>
      )}
    </div>
  );