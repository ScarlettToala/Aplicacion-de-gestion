export const numero = new Intl.NumberFormat('es-ES', {
    maximumFractionDigits: 1
})

export function agruparPorFases(lista) {
    const mapa = new Map()

    for (const elemento of lista) {
        const grupo = elemento.grupo ?? ''
        if (!mapa.has(grupo)) mapa.set(grupo, [])
        mapa.get(grupo).push(elemento)
    }

    return [...mapa]
}
