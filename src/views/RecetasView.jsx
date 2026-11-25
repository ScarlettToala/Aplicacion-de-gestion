import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { supabase } from '../../backend/supabaseClient'
import { useAuth } from '../AuthContext'
import DetalleReceta from '../components/recetas/DetalleReceta'
import ListaRecetas from '../components/recetas/ListaRecetas'

export default function RecetasView() {
    const { rol } = useAuth()
    const esAdmin = rol === 'admin'
    const { state } = useLocation()

    const [recetas, setRecetas] = useState([])
    const [seleccionada, setSeleccionada] = useState(null)
    const [multiplicador, setMultiplicador] = useState(1)
    const [error, setError] = useState(null)
    const [cargando, setCargando] = useState(true)
    const [recargar, setRecargar] = useState(0)
    const [busqueda, setBusqueda] = useState('')
    const [categoriaFiltro, setCategoriaFiltro] = useState('')

    useEffect(() => {
        async function cargar() {
            const { data, error: errorCarga } = await supabase
                .from('receta')
                .select(`
                    id,
                    nombre,
                    descripcion,
                    consejo,
                    rendimiento_cantidad,
                    categoria ( id, nombre ),
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

            if (errorCarga) {
                setError(errorCarga.message)
            } else {
                setError(null)
                setRecetas(data)

                const recetaInicial = data.find(receta => receta.id === state?.id)
                if (recetaInicial) {
                    setSeleccionada(recetaInicial)
                    setMultiplicador(1)
                }
            }

            setCargando(false)
        }

        cargar()
    }, [state?.id, recargar])

    const categorias = useMemo(() => {
        const mapa = new Map()
        for (const receta of recetas) {
            if (receta.categoria) {
                mapa.set(receta.categoria.id, receta.categoria.nombre)
            }
        }
        return [...mapa].sort((a, b) => a[1].localeCompare(b[1], 'es'))
    }, [recetas])

    const recetasFiltradas = useMemo(() => {
        const normalizar = texto =>
            (texto ?? '')
                .toString()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .toLowerCase()
        const palabras = normalizar(busqueda).split(/\s+/).filter(Boolean)

        return recetas.filter(receta => {
            if (
                categoriaFiltro &&
                String(receta.categoria?.id) !== categoriaFiltro
            ) {
                return false
            }

            const texto = normalizar(
                `${receta.nombre} ${receta.descripcion ?? ''} ${receta.categoria?.nombre ?? ''}`
            )
            return palabras.every(palabra => texto.includes(palabra))
        })
    }, [recetas, busqueda, categoriaFiltro])

    function elegir(receta) {
        setSeleccionada(receta)
        setMultiplicador(1)
    }

    function aplicarMultiplo(multiplo) {
        if (!Number.isFinite(multiplo) || multiplo <= 0) return
        setMultiplicador(multiplo)
    }

    async function eliminar(receta) {
        if (!window.confirm(`¿Eliminar "${receta.nombre}"? No se puede deshacer.`)) {
            return
        }

        const { error: errorEliminacion } = await supabase.rpc('eliminar_receta', {
            p_id: receta.id
        })

        if (errorEliminacion) {
            setError(errorEliminacion.message)
            return
        }

        setError(null)
        setSeleccionada(null)
        setRecargar(valor => valor + 1)
    }

    return (
        <main className="app">
            <div className="titulo-fila">
                <h1 className="app-titulo">Recetas</h1>
                {esAdmin && (
                    <Link className="btn btn-primario" to="/recetas/nueva">
                        Nueva receta
                    </Link>
                )}
            </div>

            {error && <p className="error">{error}</p>}

            <div className="layout">
                <ListaRecetas
                    recetas={recetasFiltradas}
                    totalRecetas={recetas.length}
                    categorias={categorias}
                    cargando={cargando}
                    busqueda={busqueda}
                    categoriaFiltro={categoriaFiltro}
                    seleccionadaId={seleccionada?.id}
                    onBuscar={setBusqueda}
                    onFiltrarCategoria={setCategoriaFiltro}
                    onElegir={elegir}
                />

                {seleccionada ? (
                    <DetalleReceta
                        receta={seleccionada}
                        multiplicador={multiplicador}
                        esAdmin={esAdmin}
                        onAplicarMultiplo={aplicarMultiplo}
                        onEliminar={() => eliminar(seleccionada)}
                    />
                ) : (
                    <div className="vacio">
                        Elige una receta de la lista para ver sus
                        ingredientes y ajustar la cantidad.
                    </div>
                )}
            </div>
        </main>
    )
}
