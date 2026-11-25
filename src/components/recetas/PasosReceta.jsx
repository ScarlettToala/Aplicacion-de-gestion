import { agruparPorFases } from '../../utils/recetas'

export default function PasosReceta({ pasos }) {
    const pasosOrdenados = [...pasos].sort((a, b) => a.orden - b.orden)

    return (
        <>
            <h3>Pasos</h3>
            <div className="receta-pasos">
                {agruparPorFases(pasosOrdenados).map(([grupo, items]) => (
                    <section className="fase" key={grupo || 'sin-fase'}>
                        {grupo && <h4 className="fase-titulo">{grupo}</h4>}
                        <ol className="pasos">
                            {items.map(paso => (
                                <li key={paso.orden}>
                                    <div>
                                        {paso.descripcion}
                                        {(paso.tiempo || paso.temperatura) && (
                                            <div className="chips">
                                                {paso.tiempo && (
                                                    <span className="chip">{paso.tiempo}</span>
                                                )}
                                                {paso.temperatura && (
                                                    <span className="chip">
                                                        {paso.temperatura} °C
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
        </>
    )
}
