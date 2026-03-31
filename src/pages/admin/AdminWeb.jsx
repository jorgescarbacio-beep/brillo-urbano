import { useMemo, useState } from "react";
import { auth } from "../../firebase/config";
import { signOut } from "firebase/auth";
import { subirTrabajoWeb } from "../../services/web/webContentService";

const CATEGORIAS = [
    { value: "cocinas", label: "Cocinas" },
    { value: "campanas", label: "Campanas" },
    { value: "equipos", label: "Equipos" },
    { value: "exteriores", label: "Exteriores" }
];

export default function AdminWeb({ user, onBack }) {
    const [categoria, setCategoria] = useState("cocinas");
    const [titulo, setTitulo] = useState("");
    const [descripcion, setDescripcion] = useState("");

    const [fotoAntes, setFotoAntes] = useState(null);
    const [fotoDespues, setFotoDespues] = useState(null);
    const [videoTrabajo, setVideoTrabajo] = useState(null);

    const [error, setError] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [loading, setLoading] = useState(false);

    const previewAntes = useMemo(() => {
        if (!fotoAntes) return "";
        return URL.createObjectURL(fotoAntes);
    }, [fotoAntes]);

    const previewDespues = useMemo(() => {
        if (!fotoDespues) return "";
        return URL.createObjectURL(fotoDespues);
    }, [fotoDespues]);

    const previewVideo = useMemo(() => {
        if (!videoTrabajo) return "";
        return URL.createObjectURL(videoTrabajo);
    }, [videoTrabajo]);

    function limpiarMensajes() {
        setError("");
        setMensaje("");
    }

    function handleFotoAntes(e) {
        const file = e.target.files?.[0];
        limpiarMensajes();

        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setError("La foto ANTES debe ser una imagen válida.");
            return;
        }

        setFotoAntes(file);
    }

    function handleFotoDespues(e) {
        const file = e.target.files?.[0];
        limpiarMensajes();

        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setError("La foto DESPUÉS debe ser una imagen válida.");
            return;
        }

        setFotoDespues(file);
    }

    function handleVideoTrabajo(e) {
        const file = e.target.files?.[0];
        limpiarMensajes();

        if (!file) return;

        if (!file.type.startsWith("video/")) {
            setError("El archivo de trabajo debe ser un video válido.");
            return;
        }

        setVideoTrabajo(file);
    }

    function limpiarFormulario() {
        setCategoria("cocinas");
        setTitulo("");
        setDescripcion("");
        setFotoAntes(null);
        setFotoDespues(null);
        setVideoTrabajo(null);
        setError("");
        setMensaje("");
    }

    async function handleSubmit(e) {
        e.preventDefault();
        limpiarMensajes();

        if (!categoria) {
            setError("Seleccioná una categoría.");
            return;
        }

        if (!titulo.trim()) {
            setError("Completá un título.");
            return;
        }

        if (!descripcion.trim()) {
            setError("Completá una descripción breve.");
            return;
        }

        if (!fotoAntes) {
            setError("Tenés que cargar la foto ANTES.");
            return;
        }

        if (!fotoDespues) {
            setError("Tenés que cargar la foto DESPUÉS.");
            return;
        }

        // 🔥 NUEVO (FIREBASE)
        setLoading(true);

        const res = await subirTrabajoWeb({
            categoria,
            titulo,
            descripcion,
            fotoAntes,
            fotoDespues,
            videoTrabajo
        });

        setLoading(false);

        if (!res.ok) {
            setError("Error subiendo el trabajo");
            return;
        }

        setMensaje("Trabajo subido correctamente");
    }

    return (
        <div style={app}>
            <header style={header}>
                <div style={brand}>
                    <img
                        src="/logo-brillo-urbano.png"
                        alt="Brillo Urbano"
                        style={logo}
                    />

                    <div>
                        <div style={brandTitle}>
                            BRILLO URBANO
                        </div>

                        <div style={brandSub}>
                            Admin Web
                        </div>
                    </div>
                </div>

                <div style={userBox}>
                    <span style={userMail}>
                        {user.email}
                    </span>

                    <button
                        onClick={() => signOut(auth)}
                        style={logout}
                    >
                        Cerrar sesión
                    </button>
                </div>
            </header>

            <main style={main}>
                <div style={hero}>
                    <div>
                        <div style={heroTitle}>
                            Administrador Web
                        </div>

                        <div style={heroText}>
                            Desde acá vas a cargar trabajos reales para la landing: antes/después y videos por categoría.
                        </div>

                        <div style={heroButtons}>
                            <button
                                style={btnHero}
                                onClick={() => window.open("/?landing", "_blank")}
                            >
                                Ver landing
                            </button>

                            <button
                                style={btnHeroOutline}
                                onClick={onBack}
                            >
                                Volver
                            </button>
                        </div>
                    </div>
                </div>

                <div style={sectionTitle}>
                    Cargar trabajo para la web
                </div>

                <form onSubmit={handleSubmit} style={formCard}>
                    <div style={grid2}>
                        <div>
                            <label style={label}>
                                Categoría
                            </label>

                            <select
                                value={categoria}
                                onChange={(e) => setCategoria(e.target.value)}
                                style={input}
                            >
                                {CATEGORIAS.map((item) => (
                                    <option key={item.value} value={item.value}>
                                        {item.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label style={label}>
                                Título
                            </label>

                            <input
                                type="text"
                                value={titulo}
                                onChange={(e) => setTitulo(e.target.value)}
                                placeholder="Ej: Desengrase profundo en cocina"
                                style={input}
                            />
                        </div>
                    </div>

                    <div style={{ marginTop: 18 }}>
                        <label style={label}>
                            Descripción breve
                        </label>

                        <textarea
                            value={descripcion}
                            onChange={(e) => setDescripcion(e.target.value)}
                            placeholder="Ej: Limpieza profunda de grasa en cocina gastronómica"
                            style={textarea}
                        />
                    </div>

                    <div style={mediaGrid}>
                        <div style={mediaCard}>
                            <div style={mediaTitle}>Foto ANTES</div>

                            <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={handleFotoAntes}
                                style={fileInput}
                            />

                            <div style={previewBox}>
                                {previewAntes ? (
                                    <img
                                        src={previewAntes}
                                        alt="Vista previa antes"
                                        style={previewImage}
                                    />
                                ) : (
                                    <div style={emptyText}>
                                        Todavía no cargaste la foto ANTES
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={mediaCard}>
                            <div style={mediaTitle}>Foto DESPUÉS</div>

                            <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={handleFotoDespues}
                                style={fileInput}
                            />

                            <div style={previewBox}>
                                {previewDespues ? (
                                    <img
                                        src={previewDespues}
                                        alt="Vista previa después"
                                        style={previewImage}
                                    />
                                ) : (
                                    <div style={emptyText}>
                                        Todavía no cargaste la foto DESPUÉS
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: 24 }}>
                        <div style={videoCard}>
                            <div style={mediaTitle}>
                                Video del trabajo (opcional)
                            </div>

                            <input
                                type="file"
                                accept="video/*"
                                capture="environment"
                                onChange={handleVideoTrabajo}
                                style={fileInput}
                            />

                            <div style={videoPreviewBox}>
                                {previewVideo ? (
                                    <video
                                        src={previewVideo}
                                        controls
                                        style={previewVideoStyle}
                                    />
                                ) : (
                                    <div style={emptyText}>
                                        Podés cargar un video real del trabajo para mostrar en la landing
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {error ? (
                        <div style={errorBox}>
                            {error}
                        </div>
                    ) : null}

                    {mensaje ? (
                        <div style={okBox}>
                            {mensaje}
                        </div>
                    ) : null}

                    <div style={actions}>
                        <button type="submit" style={btnSave}>
                            Guardar trabajo
                        </button>

                        <button
                            type="button"
                            onClick={limpiarFormulario}
                            style={btnSecondary}
                        >
                            Limpiar
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}

/* ======================= */
/* ESTILOS */
/* ======================= */

const app = {
    minHeight: "100vh",
    background: "#0f1115"
};

const header = {
    background: "linear-gradient(90deg,#11161d,#18212b)",
    padding: "18px 30px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #1f242c",
    gap: 16,
    flexWrap: "wrap"
};

const brand = {
    display: "flex",
    alignItems: "center",
    gap: 16
};

const logo = {
    width: 60,
    height: 60,
    objectFit: "contain"
};

const brandTitle = {
    color: "#00c27a",
    fontWeight: 700,
    fontSize: 22,
    letterSpacing: 1
};

const brandSub = {
    color: "#888",
    fontSize: 12
};

const userBox = {
    display: "flex",
    gap: 12,
    alignItems: "center",
    flexWrap: "wrap"
};

const userMail = {
    color: "#bbb",
    fontSize: 14
};

const logout = {
    background: "#1c2027",
    border: "1px solid #2a2f37",
    color: "white",
    padding: "8px 14px",
    borderRadius: 10,
    cursor: "pointer"
};

const main = {
    padding: "32px 20px 40px",
    maxWidth: 1200,
    margin: "0 auto"
};

const hero = {
    background: "linear-gradient(135deg,#11161d,#1b232d)",
    padding: 30,
    borderRadius: 20,
    marginBottom: 30,
    border: "1px solid #262b33"
};

const heroTitle = {
    fontSize: 30,
    color: "white",
    fontWeight: 700
};

const heroText = {
    color: "#aaa",
    marginTop: 8,
    lineHeight: 1.5
};

const heroButtons = {
    marginTop: 20,
    display: "flex",
    gap: 12,
    flexWrap: "wrap"
};

const btnHero = {
    background: "#00c27a",
    border: 0,
    padding: "10px 16px",
    borderRadius: 10,
    color: "white",
    cursor: "pointer",
    fontWeight: 700
};

const btnHeroOutline = {
    background: "transparent",
    border: "1px solid #00c27a",
    padding: "10px 16px",
    borderRadius: 10,
    color: "#00c27a",
    cursor: "pointer",
    fontWeight: 700
};

const sectionTitle = {
    color: "white",
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 18
};

const formCard = {
    background: "#161a21",
    padding: 24,
    borderRadius: 18,
    border: "1px solid #262b33",
    boxShadow: "0 8px 25px rgba(0,0,0,.35)"
};

const grid2 = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 18
};

const mediaGrid = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 20,
    marginTop: 24
};

const label = {
    display: "block",
    marginBottom: 8,
    color: "white",
    fontSize: 14,
    fontWeight: 700
};

const input = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid #303641",
    background: "#0f1115",
    color: "white",
    outline: "none",
    boxSizing: "border-box"
};

const textarea = {
    width: "100%",
    minHeight: 100,
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid #303641",
    background: "#0f1115",
    color: "white",
    outline: "none",
    resize: "vertical",
    boxSizing: "border-box"
};

const mediaCard = {
    background: "#11161d",
    border: "1px solid #262b33",
    borderRadius: 16,
    padding: 18
};

const videoCard = {
    background: "#11161d",
    border: "1px solid #262b33",
    borderRadius: 16,
    padding: 18
};

const mediaTitle = {
    color: "#00c27a",
    fontWeight: 700,
    fontSize: 18,
    marginBottom: 12
};

const fileInput = {
    width: "100%",
    marginBottom: 14,
    color: "#bbb"
};

const previewBox = {
    width: "100%",
    aspectRatio: "4 / 3",
    background: "#0b0f14",
    borderRadius: 14,
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid #262b33"
};

const videoPreviewBox = {
    width: "100%",
    minHeight: 260,
    background: "#0b0f14",
    borderRadius: 14,
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid #262b33",
    padding: 12,
    boxSizing: "border-box"
};

const previewImage = {
    width: "100%",
    height: "100%",
    objectFit: "cover"
};

const previewVideoStyle = {
    width: "100%",
    maxHeight: 420,
    borderRadius: 12
};

const emptyText = {
    color: "#7f8a97",
    fontSize: 14,
    textAlign: "center",
    padding: 18,
    lineHeight: 1.5
};

const errorBox = {
    marginTop: 18,
    background: "#4d1f1f",
    border: "1px solid #8a2b2b",
    padding: "12px 14px",
    borderRadius: 12,
    color: "#ffb3b3",
    fontWeight: 600
};

const okBox = {
    marginTop: 18,
    background: "#163824",
    border: "1px solid #1f7a46",
    padding: "12px 14px",
    borderRadius: 12,
    color: "#b8ffd2",
    fontWeight: 600
};

const actions = {
    marginTop: 24,
    display: "flex",
    gap: 12,
    flexWrap: "wrap"
};

const btnSave = {
    padding: "12px 18px",
    borderRadius: 12,
    border: 0,
    background: "#00c27a",
    color: "white",
    cursor: "pointer",
    fontWeight: 700
};

const btnSecondary = {
    padding: "12px 18px",
    borderRadius: 12,
    border: "1px solid #00c27a",
    background: "transparent",
    color: "#00c27a",
    cursor: "pointer",
    fontWeight: 700
};