import { useState } from 'react'
import { numero } from '../../utils/recetas'

export default function EscaladorReceta({ multiplicador, onAplicarMultiplo }) {
    const [valorMultiplicador, setValorMultiplicador] = useState('2')
    const valor = Number(valorMultiplicador)
    const valido = Number.isFinite(valor) && valor > 0

    return (
        <section className="escalador" aria-label="Ajustar cantidades">
            <label>¿Cuánto quieres preparar?</label>
            <div className="escalador-fila">
                <button type="button" onClick={() => onAplicarMultiplo(1)}>
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
                        title={valido
                            ? `Dividir entre ${valorMultiplicador}`
                            : 'Escribe un número mayor que 0'}
                        onClick={() => onAplicarMultiplo(1 / valor)}
                    >
                        ÷
                    </button>
                    <input
                        type="number"
                        min="0"
                        step="any"
                        inputMode="decimal"
                        value={valorMultiplicador}
                        onChange={evento => setValorMultiplicador(evento.target.value)}
                        aria-label="Número por el que multiplicar o dividir"
                    />
                    <button
                        type="button"
                        disabled={!valido}
                        title={valido
                            ? `Multiplicar por ${valorMultiplicador}`
                            : 'Escribe un número mayor que 0'}
                        onClick={() => onAplicarMultiplo(valor)}
                    >
                        ×
                    </button>
                </div>
            </div>
            <p className="escalador-info">
                Receta original: ×1
                {' · '}
                Cantidades actuales: ×{numero.format(multiplicador)}
            </p>
        </section>
    )
}
