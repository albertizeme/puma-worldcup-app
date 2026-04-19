import { createUserAction } from "../actions";

export default function CreateUserForm() {
  return (
    <form
      action={createUserAction}
      className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5"
    >
      <div className="mb-4">
        <h3 className="text-sm font-bold text-slate-900">Añadir nuevo usuario</h3>
        <p className="mt-1 text-sm text-slate-500">
          Crea un acceso manual con contraseña temporal.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="xl:col-span-2">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Email
          </label>
          <input
            type="email"
            name="email"
            required
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            placeholder="usuario@empresa.com"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Nombre visible
          </label>
          <input
            type="text"
            name="display_name"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            placeholder="Juan Pérez"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Rol
          </label>
          <select
            name="role"
            defaultValue="user"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="user">user</option>
            <option value="admin">admin</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Estado inicial
          </label>
          <select
            name="is_active"
            defaultValue="true"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="true">Activo</option>
            <option value="false">Inactivo</option>
          </select>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,320px)_1fr]">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Password temporal
          </label>
          <input
            type="text"
            name="temporaryPassword"
            required
            minLength={8}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            placeholder="Mundial2026!"
          />
        </div>

        <div className="flex items-end">
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            El usuario quedará con <strong>cambio de password pendiente</strong>.
          </div>
        </div>
      </div>

      <div className="mt-5 flex justify-end">
        <button
          type="submit"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Crear usuario
        </button>
      </div>
    </form>
  );
}