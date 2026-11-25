import { agruparPorFases, numero } from '../../utils/recetas'

export default function IngredientesReceta({ ingredientes, multiplicador }) {
    return (
        <>
            <h3>Ingredientes</h3>
            {agruparPorFases(ingredientes).map(([grupo, items]) => (
                <section className="fase" key={grupo || 'sin-fase'}>
                    {grupo && <h4 className="fase-titulo">{grupo}</h4>}
                    <table className="tabla-ingredientes">
                        <tbody>
                            {items.map((ingrediente, indice) => (
                                <tr key={ingrediente.id ?? indice}>
                                    <td className="cantidad">
                                        {numero.format(ingrediente.cantidad * multiplicador)}
                                        {' '}
                                        {ingrediente.unidad !== 'unidad' && ingrediente.unidad}
                                    </td>
                                    <td>{ingrediente.ingrediente.nombre}</td>
                                    <td className="nota">{ingrediente.recomendacion}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
            ))}
        </>
    )
}
