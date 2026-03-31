import { useMemo, useState } from "react"

export default function AdminWebAntesDespuesUploader() {
    const [titulo, setTitulo] = useState("")
    const [fotoAntes, setFotoAntes] = useState(null)
    const [fotoDespues, setFotoDespues] = useState(null)
    const [error, setError] = useState("")
    const [mensaje, setMensaje] = useState("")

    const previewAntes = useMemo(() => {
        if (!fotoAntes) return ""
        return URL.createObjectURL(fotoAntes)
    }, [fotoAntes])

    const previewDespues = useMemo(() => {
        if (!fotoDespues) return ""
        return URL.createObjectURL(fotoDespues)
    }, [fotoDespues])

    function handleFotoAntes(e) {
        const file = e.target.files?.[0]
        setMensaje("")
        setError("")

        if (!file) return

        if (!file.type.startsWith("image/")) {
            setError("La foto ANTES debe ser una imagen válida.")
            return
        }

        setFotoAntes(file)
    }

    function handleFotoDespues(e) {
        const file = e.target.files?.[0]
        setMensaje("")
        setError("")

        if (!file) return

        if (!file.type.startsWith("image/")) {
            setError("La foto DESPUÉS debe ser una imagen válida.")
            return
        }

        setFotoDespues(file)
    }

    function limpiarFormulario() {
        setTitulo("")
        setFotoAntes(null)
        setFotoDespues(null)
        setError("")
        setMensaje("")
    }

    function handleSubmit(e) {
        e.preventDefault()
        setError("")
        setMensaje("")

        if (!titulo.trim()) {
            setError("Completá un título para identificar este trabajo.")
            return
        }

        if (!fotoAntes) {
            setError("Tenés que seleccionar la foto ANTES.")
            return
        }

        if (!fotoDespues) {
            setError("Tenés que seleccionar la foto DESPUÉS.")
            return
        }

        setMensaje(
            "Pantalla lista. En el próximo paso conectamos este formulario a Firebase Storage + Firestore."
        )
    }

    return (
        <div
            style={{
                width: "100%",
                padding: "24px",
                background: "#ffffff",
                borderRadius: "18px",
                boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
                border: "1px solid #e8e8e8"
            }}
        >
            <div style={{ marginBottom: "24px" }}>
                <h2
                    style={{
                        margin: 0,
                        fontSize: "28px",
                        fontWeight: 800,
                        color: "#111827"
                    }}
                >
                    Antes / Después
                </h2>

                <p
                    style={{
                        marginTop: "8px",
                        marginBottom: 0,
                        fontSize: "15px",
                        color: "#6b7280"
                    }}
                >
                    Desde acá vas a cargar las imágenes que después se van a mostrar
                    automáticamente en la landing.
                </p>
            </div>

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: "20px" }}>
                    <label
                        htmlFor="titulo-trabajo"
                        style={{
                            display: "block",
                            marginBottom: "8px",
                            fontSize: "14px",
                            fontWeight: 700,
                            color: "#111827"
                        }}
                    >
                        Título del trabajo
                    </label>

                    <input
                        id="titulo-trabajo"
                        type="text"
                        value={titulo}
                        onChange={(e) => setTitulo(e.target.value)}
                        placeholder="Ej: Limpieza profunda en cocina de restaurante"
                        style={{
                            width: "100%",
                            padding: "14px 16px",
                            borderRadius: "12px",
                            border: "1px solid #d1d5db",
                            outline: "none",
                            fontSize: "15px",
                            boxSizing: "border-box"
                        }}
                    />
                </div>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                        gap: "20px",
                        marginBottom: "24px"
                    }}
                >
                    <div
                        style={{
                            border: "1px solid #e5e7eb",
                            borderRadius: "16px",
                            padding: "18px",
                            background: "#f9fafb"
                        }}
                    >
                        <h3
                            style={{
                                marginTop: 0,
                                marginBottom: "14px",
                                fontSize: "18px",
                                fontWeight: 800,
                                color: "#111827"
                            }}
                        >
                            Foto ANTES
                        </h3>

                        <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handleFotoAntes}
                            style={{ width: "100%", marginBottom: "14px" }}
                        />

                        <div
                            style={{
                                width: "100%",
                                aspectRatio: "4 / 3",
                                borderRadius: "14px",
                                overflow: "hidden",
                                background: "#e5e7eb",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center"
                            }}
                        >
                            {previewAntes ? (
                                <img
                                    src={previewAntes}
                                    alt="Vista previa antes"
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover"
                                    }}
                                />
                            ) : (
                                <span
                                    style={{
                                        fontSize: "14px",
                                        color: "#6b7280",
                                        padding: "12px",
                                        textAlign: "center"
                                    }}
                                >
                                    Todavía no seleccionaste la foto ANTES
                                </span>
                            )}
                        </div>
                    </div>

                    <div
                        style={{
                            border: "1px solid #e5e7eb",
                            borderRadius: "16px",
                            padding: "18px",
                            background: "#f9fafb"
                        }}
                    >
                        <h3
                            style={{
                                marginTop: 0,
                                marginBottom: "14px",
                                fontSize: "18px",
                                fontWeight: 800,
                                color: "#111827"
                            }}
                        >
                            Foto DESPUÉS
                        </h3>

                        <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handleFotoDespues}
                            style={{ width: "100%", marginBottom: "14px" }}
                        />

                        <div
                            style={{
                                width: "100%",
                                aspectRatio: "4 / 3",
                                borderRadius: "14px",
                                overflow: "hidden",
                                background: "#e5e7eb",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center"
                            }}
                        >
                            {previewDespues ? (
                                <img
                                    src={previewDespues}
                                    alt="Vista previa después"
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover"
                                    }}
                                />
                            ) : (
                                <span
                                    style={{
                                        fontSize: "14px",
                                        color: "#6b7280",
                                        padding: "12px",
                                        textAlign: "center"
                                    }}
                                >
                                    Todavía no seleccionaste la foto DESPUÉS
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {error ? (
                    <div
                        style={{
                            marginBottom: "16px",
                            padding: "14px 16px",
                            borderRadius: "12px",
                            background: "#fef2f2",
                            border: "1px solid #fecaca",
                            color: "#b91c1c",
                            fontSize: "14px",
                            fontWeight: 600
                        }}
                    >
                        {error}
                    </div>
                ) : null}

                {mensaje ? (
                    <div
                        style={{
                            marginBottom: "16px",
                            padding: "14px 16px",
                            borderRadius: "12px",
                            background: "#ecfdf5",
                            border: "1px solid #bbf7d0",
                            color: "#166534",
                            fontSize: "14px",
                            fontWeight: 600
                        }}
                    >
                        {mensaje}
                    </div>
                ) : null}

                <div
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "12px"
                    }}
                >
                    <button
                        type="submit"
                        style={{
                            border: "none",
                            borderRadius: "12px",
                            padding: "14px 18px",
                            background: "#00c27a",
                            color: "#ffffff",
                            fontSize: "15px",
                            fontWeight: 800,
                            cursor: "pointer"
                        }}
                    >
                        Guardar trabajo
                    </button>

                    <button
                        type="button"
                        onClick={limpiarFormulario}
                        style={{
                            border: "1px solid #d1d5db",
                            borderRadius: "12px",
                            padding: "14px 18px",
                            background: "#ffffff",
                            color: "#111827",
                            fontSize: "15px",
                            fontWeight: 700,
                            cursor: "pointer"
                        }}
                    >
                        Limpiar
                    </button>
                </div>
            </form>
        </div>
    )
}