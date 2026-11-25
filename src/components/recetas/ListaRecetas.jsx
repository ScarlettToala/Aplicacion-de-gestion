export default function ListaRecetas({
    recetas,
    totalRecetas,
    categorias,
    cargando,
    busqueda,
    categoriaFiltro,
    seleccionadaId,
    onBuscar,
    onFiltrarCategoria,
    onElegir
}) {
    return (
        <div className="lista-panel">

            <div className="filtros">
                <input
                    type="search"
                    placeholder="Buscar receta…"
                    value={busqueda}
                    onChange={evento => onBuscar(evento.target.value)}
                    aria-label="Buscar receta"
                />

                <select
                    value={categoriaFiltro}
                    onChange={evento => onFiltrarCategoria(evento.target.value)}
                    aria-label="Filtrar por categoría"
                >
                    <option value="">Todas las categorías</option>

                    {categorias.map(([id, nombre]) => (
                        <option key={id} value={id}>
                            {nombre}
                        </option>
                    ))}
                </select>
            </div>

            <nav className="lista" aria-label="Recetas">

                {cargando && <p>Cargando…</p>}

                {!cargando && totalRecetas === 0 && (
                    <p>Aún no hay recetas.</p>
                )}

                {!cargando && totalRecetas > 0 && recetas.length === 0 && (
                    <p>No hay recetas que coincidan.</p>
                )}

                <div className="lista-items">
                    {recetas.map(receta => (
                        <button
                            key={receta.id}
                            className="lista-item"
                            aria-current={seleccionadaId === receta.id}
                            onClick={() => onElegir(receta)}
                        >
                            {receta.nombre}

                            {receta.rendimiento_cantidad && (
                                <small>
                                    Receta original: {receta.rendimiento_cantidad}{' '}
                                    {receta.rendimiento_unidad}
                                </small>
                            )}
                        </button>
                    ))}
                </div>

            </nav>

        </div>
    )
}