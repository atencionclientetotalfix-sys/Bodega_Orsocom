import { login, signup } from './actions'

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  return (
    <div className="flex bg-[#0f1115] min-h-screen text-slate-100 flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8 bg-[#1a1d24] p-8 rounded-xl border border-slate-800 shadow-2xl relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
          <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>

        <div className="flex flex-col items-center">
          <img 
            src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/assets/logo.png`} 
            alt="Orsocom Logo" 
            className="h-16 w-auto object-contain mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]"
            onError={(e) => {
              // Fallback visual si la imagen aún no se sube a Supabase
              e.currentTarget.style.display = 'none';
            }}
          />
          <h2 className="text-center text-3xl font-extrabold text-white">
            Orsocom Cloud
          </h2>
          <p className="mt-2 text-center text-sm text-slate-400">
            Warehouse Management System
          </p>
        </div>

        <form className="mt-8 space-y-6">
          {searchParams?.error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-md text-center font-medium">
              {searchParams.error}
            </div>
          )}
          
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">Correo Electrónico</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-slate-700 bg-slate-800 placeholder-slate-400 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:z-10 sm:text-sm transition-all"
                placeholder="Ingresa tu correo"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Contraseña</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-slate-700 bg-slate-800 placeholder-slate-400 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:z-10 sm:text-sm transition-all"
                placeholder="Contraseña"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-2">
            <button
              formAction={login}
              disabled={false}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-[#0f1115] bg-amber-500 hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all font-semibold"
            >
              Iniciar Sesión
            </button>
            <button
              formAction={signup}
              disabled={false}
              className="group relative w-full flex justify-center py-3 px-4 border border-slate-700 text-sm font-medium rounded-lg text-white bg-slate-800 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all"
            >
              Registrarse
            </button>
          </div>
          <p className="text-xs text-center text-slate-500 mt-4">
            Autenticación segura fase 2 activada.
          </p>
        </form>
      </div>
    </div>
  )
}
