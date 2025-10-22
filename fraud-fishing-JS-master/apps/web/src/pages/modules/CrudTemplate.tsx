export default function CrudTemplate({ title, addLabel }: { title: string; addLabel: string }) {
  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-[#00204D]">{title}</h2>
        <button className="px-4 py-2 bg-[#00B5BC] text-white rounded hover:bg-[#009da3]">
          + {addLabel}
        </button>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full border border-gray-200 rounded-lg overflow-hidden">
          <thead className="bg-[#00204D] text-white">
            <tr>
              {/* 👉 Cambia estas columnas según tu entidad */}
              <th className="p-3 text-left">ID</th>
              <th className="p-3 text-left">Campo 1</th>
              <th className="p-3 text-left">Campo 2</th>
              <th className="p-3 text-left">Campo 3</th>
              <th className="p-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {/* 👉 Aquí mapearás tus registros cuando conectes el backend */}
            <tr className="border-b hover:bg-gray-50">
              <td className="p-3">#</td>
              <td className="p-3">Dato 1</td>
              <td className="p-3">Dato 2</td>
              <td className="p-3">Dato 3</td>
              <td className="p-3 text-center space-x-2">
                <button className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600">
                  Editar
                </button>
                <button className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600">
                  Eliminar
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
