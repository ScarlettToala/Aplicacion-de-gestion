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
    return (
        <article className="receta">
            <div className="titulo-fila">
                <h2>{receta.nombre}</h2>
                {esAdmin && (
                    <div className="acciones">
                        <Link className="btn btn-sec" to={`/recetas/${receta.id}/editar`}>
                            Editar
                        </Link>
                        <button className="btn btn-peligro" onClick={onEliminar}>
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
        </article>
    )
}
