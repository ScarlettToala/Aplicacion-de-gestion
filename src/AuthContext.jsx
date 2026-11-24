import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../backend/supabaseClient' // ajusta la ruta si hace falta

const Ctx = createContext(null)
export const useAuth = () => useContext(Ctx)

export function AuthProvider({ children }) {
    const [session, setSession] = useState(null)
    const [rol, setRol] = useState(null)
    const [cargando, setCargando] = useState(true)

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            setSession(data.session)
            if (!data.session) setCargando(false)
        })
        const { data: sub } = supabase.auth.onAuthStateChange((_evento, s) => setSession(s))
        return () => sub.subscription.unsubscribe()
    }, [])

    // Cuando hay sesión, consultamos el rol en la tabla perfiles
    useEffect(() => {
        if (!session) { setRol(null); return }
        setCargando(true)
        supabase
            .from('perfiles')
            .select('rol')
            .eq('id', session.user.id)
            .maybeSingle()
            .then(({ data }) => {
                setRol(data?.rol ?? null)
                setCargando(false)
            })
    }, [session])

    const entrar = (email, password) => supabase.auth.signInWithPassword({ email, password })
    const salir = () => supabase.auth.signOut()

    return (
        <Ctx.Provider value={{ session, rol, cargando, entrar, salir }}>
            {children}
        </Ctx.Provider>
    )
}