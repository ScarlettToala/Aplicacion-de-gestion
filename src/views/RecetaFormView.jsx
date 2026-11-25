import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../backend/supabaseClient'

const UNIDADES = ['g', 'kg', 'ml', 'l', 'unidad', 'cucharada', 'cucharadita', 'pizca', 'taza']
const nuevoIng = () => ({ grupo: '', nombre: '', cantidad: '', unidad: 'g', recomendacion: '' })
const nuevoPaso = () => ({ grupo: '', descripcion: '', tiempo: '', temperatura: '' })

// Primera letra en mayúscula; el resto del texto no se toca (así "UHT" sigue siendo "UHT")
const mayus = (texto) => {
    const t = (texto ?? '').trim()
    if (!t) return t
    const [primera] = t // por puntos de código, no parte caracteres raros
    return primera.toLocaleUpperCase('es') + t.slice(primera.length)
}

// Utilidades para editar listas (ingredientes y pasos)
const cambiar = (lista, set, i, campo, valor) =>
    set(lista.map((x, j) => (j === i ? { ...x, [campo]: valor } : x)))
const quitar = (lista, set, i) => set(lista.filter((_, j) => j !== i))
const mover = (lista, set, i, d) => {
    const j = i + d
    if (j < 0 || j >= lista.length) return
    const copia = [...lista]
        ;[copia[i], copia[j]] = [copia[j], copia[i]]
    set(copia)
}

export default function RecetaForm() {
    const { id } = useParams()
    const navigate = useNavigate()

    const [r, setR] = useState({
        nombre: '', descripcion: '', consejo: '', categoria: '',
        rendimiento_cantidad: '', rendimiento_unidad: 'cm',
    })
    const [ings, setIngs] = useState([nuevoIng()])
    const [pasos, setPasos] = useState([nuevoPaso()])
    const [categorias, setCategorias] = useState([])
    const [catalogo, setCatalogo] = useState([])
    const [error, setError] = useState(null)
    const [guardando, setGuardando] = useState(false)
    const [cargando, setCargando] = useState(Boolean(id))

    useEffect(() => {
        async function iniciar() {
            const [c, i] = await Promise.all([
                supabase.from('categoria').select('nombre').order('nombre'),
                supabase.from('ingrediente').select('nombre').order('nombre'),
            ])
            setCategorias(c.data?.map(x => x.nombre) ?? [])
            setCatalogo(i.data?.map(x => x.nombre) ?? [])

            if (id) {
                const { data, error } = await supabase
                    .from('receta')
                    .select(`
            nombre, descripcion, consejo, rendimiento_cantidad, rendimiento_unidad,
            categoria ( nombre ),
            receta_ingrediente ( id, grupo, cantidad, unidad, recomendacion, ingrediente ( nombre ) ),
            receta_paso ( orden, grupo, descripcion, tiempo, temperatura )
          `)
                    .eq('id', id)
                    .order('id', { referencedTable: 'receta_ingrediente' })
                    .single()
                if (error) { setError(error.message); setCargando(false); return }
                setR({
                    nombre: data.nombre,
                    descripcion: data.descripcion ?? '',
                    consejo: data.consejo ?? '',
                    categoria: data.categoria?.nombre ?? '',
                    rendimiento_cantidad: data.rendimiento_cantidad ?? '',
                    rendimiento_unidad: data.rendimiento_unidad ?? 'cm',
                })
                setIngs(
                    data.receta_ingrediente.length
                        ? data.receta_ingrediente.map(x => ({
                            grupo: x.grupo ?? '', nombre: x.ingrediente.nombre, cantidad: x.cantidad, unidad: x.unidad, recomendacion: x.recomendacion ?? '',
                        }))
                        : [nuevoIng()]
                )
                setPasos(
                    data.receta_paso.length
                        ? [...data.receta_paso].sort((a, b) => a.orden - b.orden).map(p => ({
                            grupo: p.grupo ?? '', descripcion: p.descripcion ?? '', tiempo: p.tiempo ?? '', temperatura: p.temperatura ?? '',
                        }))
                        : [nuevoPaso()]
                )
                setCargando(false)
            }
        }
        iniciar()
    }, [id])

    async function guardar(e) {
        e.preventDefault()
        setError(null)

        const ingredientes = ings
            .filter(x => x.nombre.trim() && x.cantidad !== '')
            .map(x => ({ ...x, grupo: mayus(x.grupo), nombre: mayus(x.nombre), recomendacion: mayus(x.recomendacion) }))
        const pasosOk = pasos
            .filter(p => p.descripcion.trim())
            .map(p => ({ ...p, grupo: mayus(p.grupo), descripcion: mayus(p.descripcion) }))

        if (!r.nombre.trim()) return setError('Ponle un nombre a la receta.')
        if (!(Number(r.rendimiento_cantidad) > 0))
            return setError('Indica para cuánto está hecha la receta. Es necesario para poder escalarla.')
        if (ingredientes.length === 0) return setError('Añade al menos un ingrediente con su cantidad.')
        if (ingredientes.some(x => !(Number(x.cantidad) > 0)))
            return setError('La cantidad de cada ingrediente debe ser mayor que 0.')

        // Un ingrediente puede repetirse, pero en fases distintas (no dos veces en la misma)
        const vistos = new Set()
        for (const x of ingredientes) {
            const clave = `${x.grupo.toLowerCase()}|${x.nombre.toLowerCase()}`
            if (vistos.has(clave)) {
                return setError(`"${x.nombre}" está repetido${x.grupo ? ` en "${x.grupo}"` : ''}. Súmalo en una sola línea o ponlo en otra fase.`)
            }
            vistos.add(clave)
        }

        setGuardando(true)
        const { data, error } = await supabase.rpc('guardar_receta', {
            p: {
                id: id ?? null, ...r,
                nombre: mayus(r.nombre), descripcion: mayus(r.descripcion),
                consejo: mayus(r.consejo), categoria: mayus(r.categoria),
                ingredientes, pasos: pasosOk,
            },
        })
        setGuardando(false)
        if (error) return setError(error.message)
        navigate('/', { state: { id: data } })
    }

    if (cargando) return <p className="centrado">Cargando…</p>

    // Fases ya escritas en esta receta (para sugerirlas y no escribir "Merengue" y "merengue")
    const fases = [...new Set([...ings, ...pasos].map(x => mayus(x.grupo)).filter(Boolean))]

    return (
        <form className="app formulario" onSubmit={guardar}>
            <h1 className="app-titulo">{id ? 'Editar receta' : 'Nueva receta'}</h1>

            <fieldset>
                <legend>Datos generales</legend>
                <label>
                    Nombre
                    <input value={r.nombre} onChange={e => setR({ ...r, nombre: e.target.value })} required />
                </label>
                <label>
                    Descripción
                    <textarea rows="2" value={r.descripcion} onChange={e => setR({ ...r, descripcion: e.target.value })} />
                </label>
                <label>
                    Categoría
                    <input list="lista-categorias" value={r.categoria} onChange={e => setR({ ...r, categoria: e.target.value })} />
                    <datalist id="lista-categorias">{categorias.map(c => <option key={c} value={c} />)}</datalist>
                </label>
                <div className="fila-doble">
                    <label>
                        La receta está hecha para
                        <input type="number" min="0" step="any" value={r.rendimiento_cantidad}
                            onChange={e => setR({ ...r, rendimiento_cantidad: e.target.value })} required />
                    </label>
                    <label>
                        Medida
                        <select value={r.rendimiento_unidad} onChange={e => setR({ ...r, rendimiento_unidad: e.target.value })}>
                            <option value="cm">Molde redondo (cm de diámetro)</option>
                            <option value="unidades">Unidades</option>
                            <option value="raciones">Raciones</option>
                        </select>
                    </label>
                </div>
            </fieldset>

            <fieldset>
                <legend>Ingredientes</legend>
                <datalist id="lista-ingredientes">{catalogo.map(c => <option key={c} value={c} />)}</datalist>
                <datalist id="lista-fases">{fases.map(f => <option key={f} value={f} />)}</datalist>
                {ings.map((x, i) => (
                    <div className="fila-ing" key={i}>
                        <label className="sr-only">Fase</label>
                        <input aria-label="Fase" placeholder="Base de galleta" list="lista-fases"
                            title="Parte de la receta a la que pertenece. Ej.: Base de galleta, Relleno, Merengue"
                            value={x.grupo} onChange={e => cambiar(ings, setIngs, i, 'grupo', e.target.value)} />
                        <label className="sr-only">Ingrediente</label>
                        <input aria-label="Ingrediente" placeholder="Galleta" list="lista-ingredientes"
                            value={x.nombre} onChange={e => cambiar(ings, setIngs, i, 'nombre', e.target.value)} />
                        <label className="sr-only">Cantidad</label>
                        <input aria-label="Cantidad" placeholder="160" type="number" min="0" step="any"
                            value={x.cantidad} onChange={e => cambiar(ings, setIngs, i, 'cantidad', e.target.value)} />
                        <label className="sr-only">Unidad</label>
                        <select aria-label="Unidad" value={x.unidad} onChange={e => cambiar(ings, setIngs, i, 'unidad', e.target.value)}>
                            {UNIDADES.map(u => <option key={u}>{u}</option>)}
                        </select>
                        <label className="sr-only">Nota</label>
                        <input aria-label="Nota" placeholder="Nota (opcional): Derritir la mantequilla antes de usarla"
                            value={x.recomendacion} onChange={e => cambiar(ings, setIngs, i, 'recomendacion', e.target.value)} />
                        <button type="button" className="btn btn-sec" onClick={() => quitar(ings, setIngs, i)}
                            disabled={ings.length === 1} aria-label="Quitar ingrediente">Quitar</button>
                    </div>
                ))}
                <button type="button" className="btn btn-sec" onClick={() => setIngs([...ings, { ...nuevoIng(), grupo: ings.at(-1)?.grupo ?? '' }])}>
                    Añadir ingrediente
                </button>
            </fieldset>

            <fieldset>
                <legend>Pasos</legend>
                {pasos.map((p, i) => (
                    <div className="fila-paso" key={i}>
                        <span className="num-paso">{i + 1}</span>
                        <label className="sr-only">Fase (opcional)</label>
                        <input aria-label="Fase" placeholder="Fase (opcional)" list="lista-fases"
                            value={p.grupo} onChange={e => cambiar(pasos, setPasos, i, 'grupo', e.target.value)} />
                        <label className="sr-only">Descripción del paso</label>
                        <textarea aria-label={`Paso ${i + 1}`} rows="2" placeholder="Describe el paso"
                            value={p.descripcion} onChange={e => cambiar(pasos, setPasos, i, 'descripcion', e.target.value)} />
                        <label className="sr-only">Tiempo </label>
                        <input aria-label="Tiempo" placeholder="Tiempo (ej. 40 min)"
                            value={p.tiempo} onChange={e => cambiar(pasos, setPasos, i, 'tiempo', e.target.value)} />
                        <label className="sr-only">Temperatura</label>
                        <input aria-label="Temperatura" placeholder="°C" type="number" min="0"
                            value={p.temperatura} onChange={e => cambiar(pasos, setPasos, i, 'temperatura', e.target.value)} />
                        <div className="acciones">
                            <button type="button" className="btn btn-sec" onClick={() => mover(pasos, setPasos, i, -1)} disabled={i === 0}>Subir</button>
                            <button type="button" className="btn btn-sec" onClick={() => mover(pasos, setPasos, i, 1)} disabled={i === pasos.length - 1}>Bajar</button>
                            <button type="button" className="btn btn-sec" onClick={() => quitar(pasos, setPasos, i)} disabled={pasos.length === 1}>Quitar</button>
                        </div>
                    </div>
                ))}
                <button type="button" className="btn btn-sec" onClick={() => setPasos([...pasos, { ...nuevoPaso(), grupo: pasos.at(-1)?.grupo ?? '' }])}>
                    Añadir paso
                </button>
            </fieldset>

            <fieldset>
                <legend>Consejo</legend>
                <textarea rows="2" aria-label="Consejo" value={r.consejo} onChange={e => setR({ ...r, consejo: e.target.value })} />
            </fieldset>

            {error && <p className="error">{error}</p>}

            <div className="acciones acciones-fin">
                <Link className="btn btn-sec" to="/">Cancelar</Link>
                <button className="btn btn-primario" disabled={guardando}>
                    {guardando ? 'Guardando…' : 'Guardar receta'}
                </button>
            </div>
        </form>
    )
}