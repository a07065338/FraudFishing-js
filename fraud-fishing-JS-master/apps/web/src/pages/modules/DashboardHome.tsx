import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import {
  FiUsers,
  FiClipboard,
  FiTag,
  FiShield,
  FiCheckCircle,
} from "react-icons/fi";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  LineChart,
  Line,
  Legend,
} from "recharts";

export default function DashboardHome() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [usersRes, catsRes, reportsRes, valRes] = await Promise.all([
          axios.get("http://localhost:3000/admin/user/stats").then((res) => res.data),
          axios.get("http://localhost:3000/categories").then((res) => res.data),
          axios.get("http://localhost:3000/reports").then((res) => res.data),
          axios.get("http://localhost:3000/report-validations").then((res) => res.data),
        ]);

        const users = usersRes?.users ?? [];
        const admins = users.filter((u: any) => u.is_admin).length;
        const usuarios = users.length - admins;
        const categorias = catsRes?.length ?? 0;
        const reportes = reportsRes?.length ?? 0;
        const validaciones = valRes?.length ?? 0;
        const recientes = reportsRes.slice(0, 5);
        const ultimosUsuarios = users.slice(-5).reverse();
        const topCategorias = catsRes.slice(0, 5);

        // ===== Calcular datos mensuales reales =====
        const meses = [
          "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
          "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
        ];

        const conteoUsuarios: Record<string, number> = {};
        const conteoReportes: Record<string, number> = {};
        meses.forEach((m) => {
          conteoUsuarios[m] = 0;
          conteoReportes[m] = 0;
        });

        // Contar usuarios creados por mes
        users.forEach((u: any) => {
          if (u.created_at) {
            const fecha = new Date(u.created_at);
            const mes = meses[fecha.getMonth()];
            conteoUsuarios[mes]++;
          }
        });
        
        // Contar reportes creados por mes (detecta automáticamente el campo de fecha)
        reportsRes.forEach((r: any) => {
          const fechaCampo =
            r.created_at ||
            r.createdAt ||
            r.fecha_creacion ||
            r.date ||
            r.created ||
            null;

          if (fechaCampo) {
            const fecha = new Date(fechaCampo);
            if (!isNaN(fecha.getTime())) {
              const mes = meses[fecha.getMonth()];
              conteoReportes[mes]++;
            }
          }
        });


        // Generar dataset para gráficos
        const barData = meses.map((mes) => ({
          name: mes,
          usuarios: conteoUsuarios[mes],
          reportes: conteoReportes[mes],
        }));

        setData({
          usuarios,
          admins,
          categorias,
          reportes,
          validaciones,
          recientes,
          ultimosUsuarios,
          topCategorias,
          barData,
        });
      } catch {
        setError("No se pudieron cargar los datos del dashboard.");
      }
    };
    fetchAll();
  }, []);

  const COLORS = ["#14B8A6", "#3B82F6", "#10B981", "#F59E0B", "#EF4444"];

  const pieData = useMemo(() => {
    if (!data) return [];
    return [
      { name: "Usuarios", value: data.usuarios },
      { name: "Admins", value: data.admins },
      { name: "Categorías", value: data.categorias },
      { name: "Reportes", value: data.reportes },
      { name: "Validaciones", value: data.validaciones },
    ];
  }, [data]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <h1 className="text-3xl font-bold tracking-tight text-[#00204D]">
            Dashboard general
          </h1>
          <p className="text-gray-500 text-sm">
            Resumen ejecutivo de la plataforma Fraud Fishing
          </p>
        </header>

        {error && (
          <div className="text-red-600 text-sm mb-3 bg-red-50 border border-red-200 px-3 py-2 rounded">
            {error}
          </div>
        )}

        {!data ? (
          <div className="text-center text-gray-500 py-10">Cargando...</div>
        ) : (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <KpiCard icon={<FiUsers />} title="Usuarios" value={data.usuarios} />
              <KpiCard icon={<FiShield />} title="Admins" value={data.admins} />
              <KpiCard icon={<FiTag />} title="Categorías" value={data.categorias} />
              <KpiCard icon={<FiClipboard />} title="Reportes" value={data.reportes} />
              <KpiCard icon={<FiCheckCircle />} title="Validaciones" value={data.validaciones} />
            </div>

            {/* Gráficos */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pie */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4">Distribución general</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={(entry: any) =>
                        `${entry.name}: ${(Number(entry.percent ?? 0) * 100).toFixed(0)}%`
                      }
                      dataKey="value"
                    >
                      {pieData.map((_entry, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Barras con datos reales */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4">
                  Actividad mensual (Usuarios / Reportes)
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.barData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="reportes" fill="#14B8A6" />
                    <Bar dataKey="usuarios" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* Línea de crecimiento real */}
            <section className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">
                Crecimiento y tendencia real
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.barData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="usuarios" stroke="#3B82F6" strokeWidth={3} />
                  <Line type="monotone" dataKey="reportes" stroke="#14B8A6" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </section>

            {/* Actividad reciente */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <RecentBox title="Últimos reportes" headers={["URL", "Estado"]}
                data={data.recientes.map((r: any) => [r.url, r.status ?? "Pendiente"])} />
              <RecentBox title="Usuarios recientes" headers={["Nombre", "Email"]}
                data={data.ultimosUsuarios.map((u: any) => [u.name, u.email])} />
              <RecentBox title="Top categorías" headers={["Nombre", "Descripción"]}
                data={data.topCategorias.map((c: any) => [c.name, c.description])} />
            </section>
          </>
        )}
      </div>
    </div>
  );
}

/* ====== KpiCard ====== */
function KpiCard({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: number | string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 flex items-center justify-between hover:shadow-md transition-transform hover:scale-105">
      <div>
        <div className="text-sm text-gray-500">{title}</div>
        <div className="text-3xl font-semibold text-teal-600">{value}</div>
      </div>
      <div className="text-teal-500 text-3xl opacity-70">{icon}</div>
    </div>
  );
}

/* ====== Reusable box for tables ====== */
function RecentBox({
  title,
  headers,
  data,
}: {
  title: string;
  headers: string[];
  data: (string | number)[][];
}) {
  return (
    <div className="bg-white  rounded-2xl shadow-sm p-6">
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      <table className="w-full text-sm">
        <thead className="text-gray-600 border-b">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="border-b border-gray-200 text-left py-2">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-b border-gray-200 last:border-none hover:bg-gray-50 transition">
              {row.map((cell, j) => (
                <td key={j} className="py-2">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}