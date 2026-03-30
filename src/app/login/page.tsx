'use client';

import { login, signup } from './actions'

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  return (
    <div className="flex bg-[#0f1115] min-h-screen text-slate-100 flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8 bg-[#1a1d24] p-8 rounded-xl border border-slate-800 shadow-2xl">
        <div className="flex flex-col items-center">
          <div className="p-3 bg-amber-500/10 rounded-2xl mb-4 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
          </div>
          <h2 className="text-center text-3xl font-extrabold text-white">
            Orsocom Cloud
          </h2>
          <p className="mt-2 text-center text-sm text-slate-400">
            Sistema de Gestión Logística
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
             Acceso seguro requerido.
          </p>
        </form>
      </div>
    </div>
  )
}
