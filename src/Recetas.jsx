import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { supabase } from '../backend/supabaseClient'
import { useAuth } from './AuthContext'

const numero = new Intl.NumberFormat('es-ES', {
    maximumFractionDigits: 1
})

// Agrupa por fase respetando el orden de aparición
function porFases(lista) {
    const mapa = new Map()

    for (const x of lista) {
        const k = x.grupo ?? ''

        if (!mapa.has(k)) {
            mapa.set(k, [])
        }

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

    // Multiplicador de la receta
    const [multiplicador, setMultiplicador] = useState(1)

    const [error, setError] = useState(null)
    const [cargando, setCargando] = useState(true)

    async function cargar(idSeleccionar) {
        const { data, error } = await supabase
            .from('receta')
            .select(`
                id,
                nombre,
                descripcion,
                consejo,
                rendimiento_cantidad,
                rendimiento_unidad,
                receta_ingrediente (
                    id,
                    grupo,
                    cantidad,
                    unidad,
                    recomendacion,
                    ingrediente ( nombre )
                ),
                receta_paso (
                    orden,
                    grupo,
                    descripcion,
                    tiempo,
                    temperatura
                )
            `)
            .order('nombre')
            .order('id', { referencedTable: 'receta_ingrediente' })

        if (error) {
            setError(error.message)
        } else {
            setRecetas(data)

            const sel = data.find(r => r.id === idSeleccionar)

            if (sel) {
                elegir(sel)
            }
        }

        setCargando(false)
    }

    useEffect(() => {
        cargar(state?.id)
    }, [])

    function elegir(r) {
        setSeleccionada(r)
        setMultiplicador(1)
    }

    // Multiplicar o dividir directamente la receta
    function aplicarMultiplo(m) {
        if (!Number.isFinite(m) || m <= 0) return

        setMultiplicador(m)
    }

    async function eliminar(r) {
        if (!window.confirm(`¿Eliminar "${r.nombre}"? No se puede deshacer.`)) {
            return
        }

        const { error } = await supabase.rpc('eliminar_receta', {
            p_id: r.id
        })

        if (error) {
            setError(error.message)
            return
        }

        setError(null)
        setSeleccionada(null)
        cargar()
    }

    return (
        <div className="app">

            <div className="titulo-fila">
                <h1 className="app-titulo">Recetas</h1>

                {esAdmin && (
                    <Link
                        className="btn btn-primario"
                        to="/recetas/nueva"
                    >
                        Nueva receta
                    </Link>
                )}
            </div>

            {error && <p className="error">{error}</p>}

            <div className="layout">

                <nav className="lista" aria-label="Recetas">

                    {cargando && <p>Cargando…</p>}

                    {!cargando && recetas.length === 0 && (
                        <p>Aún no hay recetas.</p>
                    )}

                    {recetas.map(r => (
                        <button
                            key={r.id}
                            className="lista-item"
                            aria-current={
                                seleccionada?.id === r.id
                            }
                            onClick={() => elegir(r)}
                        >
                            {r.nombre}

                            {r.rendimiento_cantidad && (
                                <small>
                                    Receta original: {r.rendimiento_cantidad}{' '}
                                    {r.rendimiento_unidad === 'cm'
                                        ? 'cm'
                                        : r.rendimiento_unidad}
                                </small>
                            )}
                        </button>
                    ))}

                </nav>

                {!seleccionada ? (

                    <div className="vacio">
                        Elige una receta de la lista para ver sus
                        ingredientes y ajustar la cantidad.
                    </div>

                ) : (

                    <Receta
                        r={seleccionada}
                        multiplicador={multiplicador}
                        aplicarMultiplo={aplicarMultiplo}
                        esAdmin={esAdmin}
                        onEliminar={() =>
                            eliminar(seleccionada)
                        }
                    />

                )}

            </div>
        </div>
    )
}


function Receta({
    r,
    multiplicador,
    aplicarMultiplo,
    esAdmin,
    onEliminar
}) {

    const [valorMultiplicador, setValorMultiplicador] =
        useState('2')

    const n = Number(valorMultiplicador)

    const valido =
        Number.isFinite(n) && n > 0

    return (
        <article className="receta">

            <div className="titulo-fila">

                <h2>{r.nombre}</h2>

                {esAdmin && (
                    <div className="acciones">

                        <Link
                            className="btn btn-sec"
                            to={`/recetas/${r.id}/editar`}
                        >
                            Editar
                        </Link>

                        <button
                            className="btn btn-peligro"
                            onClick={onEliminar}
                        >
                            Eliminar
                        </button>

                    </div>
                )}

            </div>

            {r.descripcion && (
                <p className="receta-desc">
                    {r.descripcion}
                </p>
            )}

            {/* ESCALADOR */}

            <div className="escalador">

                <label>
                    ¿Cuánto quieres preparar?
                </label>

                <div className="escalador-fila">

                    <button
                        type="button"
                        onClick={() => aplicarMultiplo(1)}
                    >
                        Original
                    </button>

                    <div
                        className="multiplo"
                        role="group"
                        aria-label="Multiplicar o dividir la receta"
                    >

                        <button
                            type="button"
                            disabled={!valido}
                            title={
                                valido
                                    ? `Dividir entre ${valorMultiplicador}`
                                    : 'Escribe un número mayor que 0'
                            }
                            onClick={() =>
                                aplicarMultiplo(1 / n)
                            }
                        >
                            ÷
                        </button>

                        <input
                            type="number"
                            min="0"
                            step="any"
                            inputMode="decimal"
                            value={valorMultiplicador}
                            onChange={e =>
                                setValorMultiplicador(
                                    e.target.value
                                )
                            }
                            aria-label="Número por el que multiplicar o dividir"
                        />

                        <button
                            type="button"
                            disabled={!valido}
                            title={
                                valido
                                    ? `Multiplicar por ${valorMultiplicador}`
                                    : 'Escribe un número mayor que 0'
                            }
                            onClick={() =>
                                aplicarMultiplo(n)
                            }
                        >
                            ×
                        </button>

                    </div>

                </div>

                <p className="escalador-info">
                    Receta original: ×1
                    {' · '}
                    Cantidades actuales: ×
                    {numero.format(multiplicador)}
                </p>

            </div>

            {/* INGREDIENTES */}

            <h3>Ingredientes</h3>

            {porFases(r.receta_ingrediente).map(
                ([grupo, items]) => (

                    <section
                        className="fase"
                        key={grupo || 'sin-fase'}
                    >

                        {grupo && (
                            <h4 className="fase-titulo">
                                {grupo}
                            </h4>
                        )}

                        <table className="tabla-ingredientes">

                            <tbody>

                                {items.map((ri, i) => (

                                    <tr
                                        key={ri.id ?? i}
                                    >

                                        <td className="cantidad">

                                            {numero.format(
                                                ri.cantidad *
                                                multiplicador
                                            )}

                                            {' '}

                                            {ri.unidad !== 'unidad' &&
                                                ri.unidad}

                                        </td>

                                        <td>
                                            {ri.ingrediente.nombre}
                                        </td>

                                        <td className="nota">
                                            {ri.recomendacion}
                                        </td>

                                    </tr>

                                ))}

                            </tbody>

                        </table>

                    </section>

                )
            )}

            {/* PASOS */}

            <h3>Pasos</h3>

            <div className="receta-pasos">

                {porFases(
                    [...r.receta_paso].sort(
                        (a, b) => a.orden - b.orden
                    )
                ).map(([grupo, items]) => (

                    <section
                        className="fase"
                        key={grupo || 'sin-fase'}
                    >

                        {grupo && (
                            <h4 className="fase-titulo">
                                {grupo}
                            </h4>
                        )}

                        <ol className="pasos">

                            {items.map(p => (

                                <li key={p.orden}>

                                    <div>

                                        {p.descripcion}

                                        {(p.tiempo ||
                                            p.temperatura) && (

                                                <div className="chips">

                                                    {p.tiempo && (
                                                        <span className="chip">
                                                            {p.tiempo}
                                                        </span>
                                                    )}

                                                    {p.temperatura && (
                                                        <span className="chip">
                                                            {p.temperatura} °C
                                                        </span>
                                                    )}

                                                </div>

                                            )}

                                    </div>

                                </li>

                            ))}

                        </ol>

                    </section>

                ))}

            </div>

            {r.consejo && (
                <div className="consejo">
                    <strong>Consejo:</strong>{' '}
                    {r.consejo}
                </div>
            )}

            <p className="aviso-escala">
                Los tiempos y las temperaturas no se escalan:
                ajústalos a mano según la cantidad.
            </p>

        </article>
    )
}