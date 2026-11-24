import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { supabase } from '../backend/supabaseClient' // ajusta la ruta si hace falta
import { useAuth } from './AuthContext'

const numero = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 })

// Agrupa por fase respetando el orden de aparición: [[fase, elementos], ...]
// Los que no tienen fase van juntos en un bloque sin título.
function porFases(lista) {
    const mapa = new Map()
    for (const x of lista) {
        const k = x.grupo ?? ''
        if (!mapa.has(k)) mapa.set(k, [])
        mapa.get(k).push(x)
    }
    return [...mapa]
}

export default function Recetas() {
    const { rol } = useAuth()
    const esAdmin = rol === 'admin'
    const { state } = useLocation()

    const [recetas, setRecetas] = useState([])
    const [seleccionada, setSeleccionada] = useState(null)
    const [objetivo, setObjetivo] = useState('')
    const [error, setError] = useState(null)
    const [cargando, setCargando] = useState(true)

    async function cargar(idSeleccionar) {
        const { data, error } = await supabase
            .from('receta')
            .select(`
        id, nombre, descripcion, consejo, rendimiento_cantidad, rendimiento_unidad,
        receta_ingrediente ( id, grupo, cantidad, unidad, recomendacion, ingrediente ( nombre ) ),
        receta_paso ( orden, grupo, descripcion, tiempo, temperatura )
      `)
            .order('nombre')
            .order('id', { referencedTable: 'receta_ingrediente' })
        if (error) setError(error.message)
        else {
            setRecetas(data)
            const sel = data.find(r => r.id === idSeleccionar)
            if (sel) elegir(sel)
        }
        setCargando(false)
    }

    useEffect(() => { cargar(state?.id) }, [])

    const esMolde = r => r.rendimiento_unidad === 'cm'

    function elegir(r) {
        setSeleccionada(r)
        setObjetivo(String(r.rendimiento_cantidad ?? ''))
    }

    // Moldes redondos (cm): el factor va por área. El resto, proporcional.
    function factor(r) {
        const base = Number(r.rendimiento_cantidad)
        const nuevo = Number(objetivo)
        if (!base || !nuevo) return 1
        return esMolde(r) ? (nuevo / base) ** 2 : nuevo / base
    }

    function aplicarMultiplo(r, m) {
        const base = Number(r.rendimiento_cantidad)
        const medida = esMolde(r) ? base * Math.sqrt(m) : base * m
        setObjetivo(String(Math.round(medida * 10) / 10))
    }

    async function eliminar(r) {
        if (!window.confirm(`¿Eliminar "${r.nombre}"? No se puede deshacer.`)) return
        const { error } = await supabase.rpc('eliminar_receta', { p_id: r.id })
        if (error) { setError(error.message); return }
        setError(null)
        setSeleccionada(null)
        cargar()
    }

    return (
        <div className="app">
            <div className="titulo-fila">
                <h1 className="app-titulo">Recetas</h1>
                {esAdmin && <Link className="btn btn-primario" to="/recetas/nueva">Nueva receta</Link>}
            </div>

            {error && <p className="error">{error}</p>}

            <div className="layout">
                <nav className="lista" aria-label="Recetas">
                    {cargando && <p>Cargando…</p>}
                    {!cargando && recetas.length === 0 && <p>Aún no hay recetas.</p>}
                    {recetas.map(r => (
                        <button
                            key={r.id}
                            className="lista-item"
                            aria-current={seleccionada?.id === r.id}
                            onClick={() => elegir(r)}
                        >
                            {r.nombre}
                            {r.rendimiento_cantidad && (
                                <small>
                                    {esMolde(r) ? `Molde de ${r.rendimiento_cantidad} cm` : `${r.rendimiento_cantidad} ${r.rendimiento_unidad}`}
                                </small>
                            )}
                        </button>
                    ))}
                </nav>

                {!seleccionada ? (
                    <div className="vacio">Elige una receta de la lista para ver sus ingredientes y ajustar la cantidad.</div>
                ) : (
                    <Receta
                        r={seleccionada}
                        objetivo={objetivo}
                        setObjetivo={setObjetivo}
                        f={factor(seleccionada)}
                        esMolde={esMolde(seleccionada)}
                        aplicarMultiplo={m => aplicarMultiplo(seleccionada, m)}
                        esAdmin={esAdmin}
                        onEliminar={() => eliminar(seleccionada)}
                    />
                )}
            </div>
        </div>
    )
}

function Receta({ r, objetivo, setObjetivo, f, esMolde, aplicarMultiplo, esAdmin, onEliminar }) {
    const unidadEtiqueta = esMolde ? 'cm de diámetro' : r.rendimiento_unidad
    const [multiplo, setMultiplo] = useState('2')
    const n = Number(multiplo)
    const valido = Number.isFinite(n) && n > 0

    return (
        <article className="receta">
            <div className="titulo-fila">
                <h2>{r.nombre}</h2>
                {esAdmin && (
                    <div className="acciones">
                        <Link className="btn btn-sec" to={`/recetas/${r.id}/editar`}>Editar</Link>
                        <button className="btn btn-peligro" onClick={onEliminar}>Eliminar</button>
                    </div>
                )}
            </div>
            {r.descripcion && <p className="receta-desc">{r.descripcion}</p>}

            <div className="escalador">
                <label htmlFor="objetivo">¿Cuánto vas a hacer?</label>
                <div className="escalador-fila">
                    <input id="objetivo" type="number" min="0" step="any" value={objetivo} onChange={e => setObjetivo(e.target.value)} />
                    <span className="escalador-unidad">{unidadEtiqueta}</span>
                    <div className="atajos">
                        <button type="button" onClick={() => aplicarMultiplo(1)}>Original</button>
                        <div className="multiplo" role="group" aria-label="Multiplicar o dividir la receta">
                            <button type="button" disabled={!valido} title={valido ? `Dividir entre ${multiplo}` : 'Escribe un número mayor que 0'} onClick={() => aplicarMultiplo(1 / n)}>÷</button>
                            <input
                                type="number" min="0" step="any" inputMode="decimal"
                                value={multiplo}
                                onChange={e => setMultiplo(e.target.value)}
                                aria-label="Número por el que multiplicar o dividir"
                            />
                            <button type="button" disabled={!valido} title={valido ? `Multiplicar por ${multiplo}` : 'Escribe un número mayor que 0'} onClick={() => aplicarMultiplo(n)}>×</button>
                        </div>
                    </div>
                </div>
                <p className="escalador-info">
                    La receta original es para {r.rendimiento_cantidad} {r.rendimiento_unidad}. Cantidades × {f.toFixed(2)}
                    {esMolde && ' (calculado por superficie del molde)'}.
                </p>
            </div>

            <h3>Ingredientes</h3>
            {porFases(r.receta_ingrediente).map(([grupo, items]) => (
                <section className="fase" key={grupo || 'sin-fase'}>
                    {grupo && <h4 className="fase-titulo">{grupo}</h4>}
                    <table className="tabla-ingredientes">
                        <tbody>
                            {items.map((ri, i) => (
                                <tr key={ri.id ?? i}>
                                    <td className="cantidad">{numero.format(ri.cantidad * f)} {ri.unidad !== 'unidad' && ri.unidad}</td>
                                    <td>{ri.ingrediente.nombre}</td>
                                    <td className="nota">{ri.recomendacion}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
            ))}

            <h3>Pasos</h3>
            <div className="receta-pasos">
                {porFases([...r.receta_paso].sort((a, b) => a.orden - b.orden)).map(([grupo, items]) => (
                    <section className="fase" key={grupo || 'sin-fase'}>
                        {grupo && <h4 className="fase-titulo">{grupo}</h4>}
                        <ol className="pasos">
                            {items.map(p => (
                                <li key={p.orden}>
                                    <div>
                                        {p.descripcion}
                                        {(p.tiempo || p.temperatura) && (
                                            <div className="chips">
                                                {p.tiempo && <span className="chip">{p.tiempo}</span>}
                                                {p.temperatura && <span className="chip">{p.temperatura} °C</span>}
                                            </div>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </section>
                ))}
            </div>

            {r.consejo && <div className="consejo"><strong>Consejo:</strong> {r.consejo}</div>}
            <p className="aviso-escala">Los tiempos y las temperaturas no se escalan: ajústalos a mano según el tamaño.</p>
        </article>
    )
}