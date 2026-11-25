import { useState } from 'react'
import { Link } from 'react-router-dom'
import EscaladorReceta from './EscaladorReceta'
import IngredientesReceta from './IngredientesReceta'
import PasosReceta from './PasosReceta'

export default function DetalleReceta({
    receta,
    multiplicador,
    esAdmin,
    onAplicarMultiplo,
    onEliminar
}) {

    const [paso, setPaso] = useState(0) // 0 = cerrado, 1 = primera pregunta, 2 = escribir nombre
    const [texto, setTexto] = useState('')

    const coincide = texto.trim().toLowerCase() === receta.nombre.trim().toLowerCase()

    function cerrar() {
        setPaso(0)
        setTexto('')
    }

    function confirmarFinal() {
        if (!coincide) return
        cerrar()
        onEliminar()
    }

    return (
        <article className="receta">
            <div className="titulo-fila">
                <h2>{receta.nombre}</h2>
                {esAdmin && (
                    <div className="acciones">
                        <Link className="btn btn-sec" to={`/recetas/${receta.id}/editar`}>
                            Editar
                        </Link>
                        <button className="btn btn-peligro" onClick={() => setPaso(1)}>
                            Eliminar
                        </button>
                    </div>
                )}
            </div>

            {receta.descripcion && (
                <p className="receta-desc">{receta.descripcion}</p>
            )}

            <EscaladorReceta
                multiplicador={multiplicador}
                onAplicarMultiplo={onAplicarMultiplo}
            />
            <IngredientesReceta
                ingredientes={receta.receta_ingrediente}
                multiplicador={multiplicador}
            />
            <PasosReceta pasos={receta.receta_paso} />

            {receta.consejo && (
                <div className="consejo">
                    <strong>Consejo:</strong>{' '}
                    {receta.consejo}
                </div>
            )}
            <p className="aviso-escala">
                Los tiempos y las temperaturas no se escalan:
                ajústalos a mano según la cantidad.
            </p>

            {paso > 0 && (
                <div className="modal-fondo" onClick={cerrar}>
                    <div
                        className="modal-caja"
                        role="dialog"
                        aria-modal="true"
                        onClick={e => e.stopPropagation()}
                    >
                        {paso === 1 && (
                            <>
                                <h3>¿Eliminar esta receta?</h3>
                                <p>
                                    Vas a eliminar <strong>{receta.nombre}</strong>, con sus
                                    ingredientes y pasos. No se puede deshacer.
                                </p>
                                <div className="acciones">
                                    <button className="btn btn-sec" onClick={cerrar}>
                                        Cancelar
                                    </button>
                                    <button className="btn btn-peligro" onClick={() => setPaso(2)}>
                                        Sí, continuar
                                    </button>
                                </div>
                            </>
                        )}

                        {paso === 2 && (
                            <>
                                <h3>Última confirmación</h3>
                                <p>
                                    Escribe <strong>{receta.nombre}</strong> para confirmar:
                                </p>
                                <input
                                    type="text"
                                    value={texto}
                                    onChange={e => setTexto(e.target.value)}
                                    autoFocus
                                    placeholder={receta.nombre}
                                />
                                <div className="acciones">
                                    <button className="btn btn-sec" onClick={cerrar}>
                                        Cancelar
                                    </button>
                                    <button
                                        className="btn btn-peligro"
                                        onClick={confirmarFinal}
                                        disabled={!coincide}
                                    >
                                        Eliminar definitivamente
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

        </article>
    )
}
