import { useEffect, useRef, useMemo, useState } from "react";
import axios from "axios";
import {
  FiPlus,
  FiTrash2,
  FiEye,
  FiMoreHorizontal,
  FiSearch,
} from "react-icons/fi";

interface Categoria {
  id: number;
  name: string;
  description: string;
  created_at?: string;
}

export default function CrudCategorias() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [topCategorias, setTopCategorias] = useState<{ name: string; usage_count: number }[]>([]);
  const [detalle, setDetalle] = useState<Categoria | null>(null);
  const [editando, setEditando] = useState<Categoria | null>(null);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [nueva, setNueva] = useState({ name: "", description: "" });

  const [filtro, setFiltro] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<keyof Categoria | "">("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Carga de categorías
  useEffect(() => {
    axios.get("http://localhost:3000/categories")
      .then((res) => {
        setCategorias(res.data ?? []);
        setPage(1);
      })
      .catch(() => setError("No se pudieron cargar las categorías"));

    // Cargar las 3 categorías más usadas
    axios.get("http://localhost:3000/categories/top/3")
      .then((res) => {
        if (res.data && res.data.length > 0) {
          setTopCategorias(res.data);
        }
      })
      .catch(() => {
        console.error("No se pudieron cargar las top categorías");
      });
  }, []);

  // ===== KPIs (tarjetas) =====
  const { total } = useMemo(() => {
    return { total: categorias.length };
  }, [categorias]);

  // Filtro por nombre/descr.
  const filtradas = useMemo(() => {
    const f = filtro.trim().toLowerCase();
    if (!f) return categorias;
    return categorias.filter(
      (c) =>
        c.name.toLowerCase().includes(f) ||
        (c.description ?? "").toLowerCase().includes(f)
    );
  }, [categorias, filtro]);

  // Ordenamiento
  const ordenadas = useMemo(() => {
    if (!sortKey) return filtradas;
    const arr = [...filtradas];
    arr.sort((a, b) => {
      const va = a[sortKey] as any;
      const vb = b[sortKey] as any;

      if (sortKey === "created_at") {
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
  }, [filtradas, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(ordenadas.length / pageSize));
  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return ordenadas.slice(start, start + pageSize);
  }, [ordenadas, page, pageSize]);

  useEffect(() => setPage(1), [filtro, sortKey, sortDir, pageSize]);

  const toggleSort = (key: keyof Categoria) => {
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
      const res = await axios.post("http://localhost:3000/categories", nueva, {
        headers: { "Content-Type": "application/json" },
      });
      const creada: Categoria = res.data;
      setCategorias((curr) => [...curr, creada]);
      setShowForm(false);
      setNueva({ name: "", description: "" });
    } catch {
      setError("No se pudo crear la categoría");
    }
  };

  const handleEliminar = async (id: number) => {
    if (!window.confirm("¿Eliminar esta categoría?")) return;
    try {
      await axios.delete(`http://localhost:3000/categories/${id}`);
      setCategorias((curr) => curr.filter((c) => c.id !== id));
      if (detalle?.id === id) setDetalle(null);
    } catch {
      setError("No se pudo eliminar la categoría (quizá está en uso)");
    }
  };

  const handleEditar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editando) return;
    try {
      const res = await axios.put(`http://localhost:3000/categories/${editando.id}`, editando, {
        headers: { "Content-Type": "application/json" },
      });
      const actualizada = res.data;
      setCategorias((curr) =>
        curr.map((c) => (c.id === actualizada.id ? actualizada : c))
      );
      setEditando(null);
    } catch {
      setError("No se pudo actualizar la categoría");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
          <h2 className="text-[22px] font-semibold tracking-tight">Categorías</h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o descripción..."
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                className="pl-10 pr-4 py-2 w-72 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white"
              />
            </div>
            <button
              className="cursor-pointer inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg shadow-sm"
              onClick={() => setShowForm(true)}
            >
              <FiPlus className="text-[18px]" />
              Agregar categoría
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard title="Categorías totales" value={total} tone="solid" />
          <KpiCard 
            title="Top 1" 
            value={topCategorias[0]?.name ?? "N/A"} 
            subValue={topCategorias[0]?.usage_count}
            tone="soft" 
          />
          <KpiCard 
            title="Top 2" 
            value={topCategorias[1]?.name ?? "N/A"} 
            subValue={topCategorias[1]?.usage_count}
            tone="soft" 
          />
          <KpiCard 
            title="Top 3" 
            value={topCategorias[2]?.name ?? "N/A"} 
            subValue={topCategorias[2]?.usage_count}
            tone="soft" 
          />
        </div>

        {error && (
          <div className="text-teal-600 text-sm mb-3 bg-teal-50 border border-teal-200 px-3 py-2 rounded">
            {error}
          </div>
        )}

        {/* Tabla */}
        <div className="w-full text-sm text-left text-gray-600">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="text-gray-600">
                <Th onClick={() => toggleSort("name")} active={sortKey === "name"} dir={sortDir}>Nombre</Th>
                <Th onClick={() => toggleSort("description")} active={sortKey === "description"} dir={sortDir}>Descripción</Th>
                <th className="py-3 pr-4 text-right w-0">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-300">
              {pageItems.map((cat) => (
                <RowCategoria
                  key={cat.id}
                  cat={cat}
                  onView={() => setDetalle(cat)}
                  onDelete={() => handleEliminar(cat.id)}
                />
              ))}
              {pageItems.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-gray-400">
                    {filtro
                      ? `No se encontraron categorías con "${filtro}"`
                      : "No hay categorías."}
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
                      ordenadas.length
                    )} de ${ordenadas.length}`
                  : `0 de ${ordenadas.length}`}
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
              <h3 className="text-lg font-semibold mb-4">Agregar categoría</h3>
              <input
                className="bg-gray-50 p-2 rounded w-full mb-3"
                placeholder="Nombre"
                value={nueva.name}
                onChange={(e) => setNueva((n) => ({ ...n, name: e.target.value }))}
                required
              />
              <input
                className="bg-gray-50 p-2 rounded w-full mb-4"
                placeholder="Descripción"
                value={nueva.description}
                onChange={(e) => setNueva((n) => ({ ...n, description: e.target.value }))}
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
              <h3 className="text-lg font-bold mb-1">{detalle.name}</h3>
              {detalle.description && (
                <p className="text-gray-700 mb-4">{detalle.description}</p>
              )}
              {detalle.created_at && (
                <div className="text-xs text-gray-500 mb-5">
                  Created: {new Date(detalle.created_at).toLocaleString()}
                </div>
              )}
              <div className="flex justify-end">
                <button className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded cursor-pointer" onClick={() => setDetalle(null)}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Editar */}
        {editando && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <form
              onSubmit={handleEditar}
              className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md"
            >
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Editar categoría</h3>
              <input
                className="bg-white border border-gray-300 text-gray-900 p-2 rounded w-full mb-3 focus:ring-2 focus:ring-teal-200"
                value={editando.name}
                onChange={(e) => setEditando({ ...editando, name: e.target.value })}
                required
              />
              <input
                className="bg-white border border-gray-300 text-gray-900 p-2 rounded w-full mb-4 focus:ring-2 focus:ring-teal-200"
                value={editando.description}
                onChange={(e) => setEditando({ ...editando, description: e.target.value })}
                required
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700"
                  onClick={() => setEditando(null)}
                >
                  Cancelar
                </button>
                <button className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white" type="submit">
                  Guardar
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

/* ====== KpiCard (mismo que CrudUsuarios, con hover) ====== */
function KpiCard({
  title,
  value,
  subValue,
  tone = "soft",
}: {
  title: string;
  value: number | string;
  subValue?: number | string;
  tone?: "solid" | "soft";
}) {
  const base =
    tone === "solid"
      ? "bg-teal-600 text-white hover:bg-teal-700"
      : "bg-teal-50 text-teal-900 border border-teal-100 hover:bg-teal-100";
  const numberStyle =
    tone === "solid" ? "text-3xl font-semibold" : "text-3xl font-bold text-teal-700";

  return (
    <div
      className={`rounded-2xl ${base} p-5 shadow-sm transition-transform transform hover:scale-105 hover:shadow-lg`}
    >
      <div className="text-sm opacity-90">{title}</div>
      <div className="mt-2">
        <div className={numberStyle}>{value}</div>
        {subValue !== undefined && (
          <div className="text-xs opacity-80 mt-1">
            {subValue} {subValue === 1 ? "reporte" : "reportes"}
          </div>
        )}
      </div>
    </div>
  );
}

/* ====== Header sortable ====== */
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
function RowCategoria({
  cat,
  onView,
  onDelete,
}: {
  cat: Categoria;
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
        <div className="text-lg font-semibold">{cat.name}</div>
      </td>
      <td className="py-4 pr-5">
        <div className="text-base text-gray-700">{cat.description}</div>
      </td>
      <td className="py-4 pr-7">
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
    
    // Si hay pocas páginas, mostrar todas
    if (totalPages <= 6) {
      for (let i = 1; i <= totalPages; i++) push(i);
      return arr;
    }
    
    // Lógica para muchas páginas
    push(1);
    if (page > 3) push("…");
    
    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);
    
    for (let i = start; i <= end; i++) push(i);
    
    if (page < totalPages - 2) push("…");
    push(totalPages);
    
    return arr;
  }, [page, totalPages]);

  // Caso edge: No mostrar paginación si no hay páginas o solo una
  if (totalPages <= 1) {
    return null;
  }

  // Caso edge: Página inválida
  if (page < 1 || page > totalPages) {
    return (
      <div className="flex items-center gap-2 text-red-500">
        <span>Página inválida</span>
        <button
          className="px-2 py-1 rounded border border-red-200 hover:bg-red-50"
          onClick={() => onChange(1)}
        >
          Ir a página 1
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* Botón anterior */}
      <button
        className="px-2 py-1 rounded border border-gray-200 hover:bg-teal-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
            className={`px-3 py-1 rounded border transition-colors ${
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
        className="px-2 py-1 rounded border border-gray-200 hover:bg-teal-50 disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}
        title={page >= totalPages ? "Ya estás en la última página" : "Página siguiente"}
      >
        {">"}
      </button>

      {/* Indicador de página actual (opcional) */}
      {totalPages > 10 && (
        <span className="ml-2 text-sm text-gray-500">
          {page} de {totalPages}
        </span>
      )}
    </div>
  );
}