import { useEffect, useMemo, useState } from "react";
import { auth } from "../../firebase/config";
import { signOut } from "firebase/auth";

import {
    subirTrabajoWeb,
    obtenerTrabajosWeb,
    eliminarTrabajoWeb,
    actualizarTrabajoWeb
} from "../../services/web/webContentService";

const CATEGORIAS = [
    { value: "cocinas", label: "Cocinas" },
    { value: "campanas", label: "Campanas" },
    { value: "extractores", label: "Extractores" },
    { value: "rejillas", label: "Rejillas de desagüe" },
    { value: "equipos", label: "Equipos" },
    { value: "exteriores", label: "Exteriores" },
    { value: "trampas", label: "Trampas de grasa" }
];

export default function AdminWeb({ user, onBack }) {
    const [tabActiva, setTabActiva] = useState("cargar");

    const [categoria, setCategoria] = useState("cocinas");
    const [titulo, setTitulo] = useState("");
    const [descripcion, setDescripcion] = useState("");

    const [fotoAntes, setFotoAntes] = useState(null);
    const [fotoDespues, setFotoDespues] = useState(null);
    const [videoTrabajo, setVideoTrabajo] = useState(null);

    const [trabajos, setTrabajos] = useState([]);
    const [cargandoTrabajos, setCargandoTrabajos] = useState(false);
    const [borrandoId, setBorrandoId] = useState("");
    const [editandoId, setEditandoId] = useState("");
    const [trabajoEditando, setTrabajoEditando] = useState(null);

    const [error, setError] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [loading, setLoading] = useState(false);

    const previewAntes = useMemo(() => {
        if (fotoAntes) return URL.createObjectURL(fotoAntes);
        if (trabajoEditando?.fotoAntesUrl) return trabajoEditando.fotoAntesUrl;
        if (trabajoEditando?.antesUrl) return trabajoEditando.antesUrl;
        if (trabajoEditando?.fotoAntes) return trabajoEditando.fotoAntes;
        if (trabajoEditando?.antes) return trabajoEditando.antes;
        return "";
    }, [fotoAntes, trabajoEditando]);

    const previewDespues = useMemo(() => {
        if (fotoDespues) return URL.createObjectURL(fotoDespues);
        if (trabajoEditando?.fotoDespuesUrl) return trabajoEditando.fotoDespuesUrl;
        if (trabajoEditando?.despuesUrl) return trabajoEditando.despuesUrl;
        if (trabajoEditando?.fotoDespues) return trabajoEditando.fotoDespues;
        if (trabajoEditando?.despues) return trabajoEditando.despues;
        return "";
    }, [fotoDespues, trabajoEditando]);

    const previewVideo = useMemo(() => {
        if (videoTrabajo) return URL.createObjectURL(videoTrabajo);
        if (trabajoEditando?.videoTrabajoUrl) return trabajoEditando.videoTrabajoUrl;
        if (trabajoEditando?.videoUrl) return trabajoEditando.videoUrl;
        if (trabajoEditando?.videoTrabajo) return trabajoEditando.videoTrabajo;
        if (trabajoEditando?.video) return trabajoEditando.video;
        return "";
    }, [videoTrabajo, trabajoEditando]);

    useEffect(() => {
        if (tabActiva === "gestionar") {
            cargarTrabajos();
        }
    }, [tabActiva]);

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
            setError("El archivo debe ser un video válido.");
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
        setEditandoId("");
        setTrabajoEditando(null);
        setError("");
        setMensaje("");
    }

    async function cargarTrabajos() {
        try {
            setCargandoTrabajos(true);
            limpiarMensajes();

            const res = await obtenerTrabajosWeb();
            setTrabajos(Array.isArray(res) ? res : []);
        } catch (err) {
            console.error(err);
            setError("No se pudieron cargar los trabajos.");
        } finally {
            setCargandoTrabajos(false);
        }
    }

    function editarTrabajo(trabajo) {
        limpiarMensajes();

        setEditandoId(trabajo.id || "");
        setTrabajoEditando(trabajo);

        setCategoria(trabajo.categoria || "cocinas");
        setTitulo(trabajo.titulo || "");
        setDescripcion(trabajo.descripcion || "");

        setFotoAntes(null);
        setFotoDespues(null);
        setVideoTrabajo(null);

        setTabActiva("cargar");
    }

    async function handleEliminarTrabajo(id) {
        const confirmar = window.confirm("¿Seguro que querés eliminar este trabajo?");
        if (!confirmar) return;

        try {
            limpiarMensajes();
            setBorrandoId(id);

            const res = await eliminarTrabajoWeb(id);

            if (res?.ok === false) {
                setError("No se pudo eliminar el trabajo.");
                return;
            }

            setTrabajos((prev) => prev.filter((item) => item.id !== id));

            if (editandoId === id) {
                limpiarFormulario();
            }

            setMensaje("Trabajo eliminado correctamente.");
        } catch (err) {
            console.error(err);
            setError("No se pudo eliminar el trabajo.");
        } finally {
            setBorrandoId("");
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        limpiarMensajes();

        const yaTieneFotoAntes =
            !!trabajoEditando?.fotoAntesUrl ||
            !!trabajoEditando?.antesUrl ||
            !!trabajoEditando?.fotoAntes ||
            !!trabajoEditando?.antes;

        const yaTieneFotoDespues =
            !!trabajoEditando?.fotoDespuesUrl ||
            !!trabajoEditando?.despuesUrl ||
            !!trabajoEditando?.fotoDespues ||
            !!trabajoEditando?.despues;

        if (!titulo.trim() || !descripcion.trim()) {
            setError("Completá título y descripción.");
            return;
        }

        if (!editandoId && (!fotoAntes || !fotoDespues)) {
            setError("Completá título, descripción y ambas fotos.");
            return;
        }

        if (editandoId && !fotoAntes && !yaTieneFotoAntes) {
            setError("El trabajo debe tener una foto ANTES.");
            return;
        }

        if (editandoId && !fotoDespues && !yaTieneFotoDespues) {
            setError("El trabajo debe tener una foto DESPUÉS.");
            return;
        }

        setLoading(true);

        try {
            let res;

            if (editandoId) {
                res = await actualizarTrabajoWeb(editandoId, {
                    categoria,
                    titulo,
                    descripcion,
                    fotoAntes,
                    fotoDespues,
                    videoTrabajo,
                    trabajoActual: trabajoEditando
                });
            } else {
                res = await subirTrabajoWeb({
                    categoria,
                    titulo,
                    descripcion,
                    fotoAntes,
                    fotoDespues,
                    videoTrabajo
                });
            }

            if (!res?.ok) {
                setError(editandoId ? "Error actualizando el trabajo en Firebase." : "Error subiendo el trabajo a Firebase.");
                return;
            }

            setMensaje(editandoId ? "Trabajo actualizado correctamente" : "Trabajo subido correctamente");
            limpiarFormulario();

            if (tabActiva === "gestionar") {
                await cargarTrabajos();
            }
        } catch (err) {
            console.error(err);
            setError(editandoId ? "Error actualizando el trabajo en Firebase." : "Error subiendo el trabajo a Firebase.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={app}>
            <header style={header}>
                <div style={brand}>
                    <img src="/logo-brillo-urbano.png" alt="Brillo Urbano" style={logo} />
                    <div>
                        <div style={brandTitle}>BRILLO URBANO</div>
                        <div style={brandSub}>Admin Web</div>
                    </div>
                </div>
                <div style={userBox}>
                    <span style={userMail}>{user.email}</span>
                    <button onClick={() => signOut(auth)} style={logout}>Cerrar sesión</button>
                </div>
            </header>

            <main style={main}>
                <div style={hero}>
                    <div>
                        <div style={heroTitle}>Administrador Web</div>
                        <div style={heroText}>Carga los trabajos antes/después y videos por categoría para la landing.</div>
                        <div style={heroButtons}>
                            <button style={btnHero} onClick={() => window.open("/?landing", "_blank")}>Ver landing</button>
                            <button style={btnHeroOutline} onClick={onBack}>Volver</button>
                        </div>
                    </div>
                </div>

                <div style={tabsRow}>
                    <button
                        type="button"
                        onClick={() => setTabActiva("cargar")}
                        style={tabActiva === "cargar" ? tabButtonActive : tabButton}
                    >
                        Cargar nuevo trabajo
                    </button>

                    <button
                        type="button"
                        onClick={() => setTabActiva("gestionar")}
                        style={tabActiva === "gestionar" ? tabButtonActive : tabButton}
                    >
                        Ver / editar / borrar trabajos
                    </button>
                </div>

                {tabActiva === "cargar" && (
                    <>
                        <div style={sectionTitle}>
                            {editandoId ? "Editar trabajo" : "Cargar nuevo trabajo"}
                        </div>

                        <form onSubmit={handleSubmit} style={formCard}>
                            <div style={grid2}>
                                <div>
                                    <label style={label}>Categoría</label>
                                    <select value={categoria} onChange={(e) => setCategoria(e.target.value)} style={input}>
                                        {CATEGORIAS.map((item) => (
                                            <option key={item.value} value={item.value}>{item.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label style={label}>Título</label>
                                    <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ej: Desengrase en restaurante" style={input} />
                                </div>
                            </div>

                            <div style={{ marginTop: 18 }}>
                                <label style={label}>Descripción breve</label>
                                <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Ej: Limpieza profunda de campana..." style={textarea} />
                            </div>

                            <div style={mediaGrid}>
                                <div style={mediaCard}>
                                    <div style={mediaTitle}>Foto ANTES</div>
                                    <input type="file" accept="image/*" onChange={handleFotoAntes} style={fileInput} />
                                    <div style={previewBox}>
                                        {previewAntes ? <img src={previewAntes} alt="Antes" style={previewImage} /> : <div style={emptyText}>Sin foto ANTES</div>}
                                    </div>
                                </div>

                                <div style={mediaCard}>
                                    <div style={mediaTitle}>Foto DESPUÉS</div>
                                    <input type="file" accept="image/*" onChange={handleFotoDespues} style={fileInput} />
                                    <div style={previewBox}>
                                        {previewDespues ? <img src={previewDespues} alt="Después" style={previewImage} /> : <div style={emptyText}>Sin foto DESPUÉS</div>}
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginTop: 24 }}>
                                <div style={videoCard}>
                                    <div style={mediaTitle}>Video del trabajo (opcional)</div>
                                    <input type="file" accept="video/*" onChange={handleVideoTrabajo} style={fileInput} />
                                    <div style={videoPreviewBox}>
                                        {previewVideo ? <video src={previewVideo} controls style={previewVideoStyle} /> : <div style={emptyText}>Sin video seleccionado</div>}
                                    </div>
                                </div>
                            </div>

                            {error && <div style={errorBox}>{error}</div>}
                            {mensaje && <div style={okBox}>{mensaje}</div>}

                            <div style={actions}>
                                <button type="submit" disabled={loading} style={btnSave}>
                                    {loading ? (editandoId ? "Actualizando..." : "Subiendo...") : (editandoId ? "Guardar cambios" : "Guardar trabajo")}
                                </button>

                                <button type="button" onClick={limpiarFormulario} style={btnSecondary}>
                                    {editandoId ? "Cancelar edición" : "Limpiar"}
                                </button>

                                {editandoId && (
                                    <button type="button" onClick={() => setTabActiva("gestionar")} style={btnGhost}>
                                        Volver a la lista
                                    </button>
                                )}
                            </div>
                        </form>
                    </>
                )}

                {tabActiva === "gestionar" && (
                    <>
                        <div style={manageHeader}>
                            <div style={sectionTitleNoMargin}>Trabajos cargados</div>
                            <button type="button" onClick={cargarTrabajos} style={btnSecondary}>
                                {cargandoTrabajos ? "Actualizando..." : "Actualizar lista"}
                            </button>
                        </div>

                        {error && <div style={errorBox}>{error}</div>}
                        {mensaje && <div style={okBox}>{mensaje}</div>}

                        {cargandoTrabajos ? (
                            <div style={formCard}>
                                <div style={emptyText}>Cargando trabajos...</div>
                            </div>
                        ) : trabajos.length === 0 ? (
                            <div style={formCard}>
                                <div style={emptyText}>Todavía no hay trabajos cargados.</div>
                            </div>
                        ) : (
                            <div style={listGrid}>
                                {trabajos.map((trabajo) => {
                                    const fotoAntesCard =
                                        trabajo?.fotoAntesUrl ||
                                        trabajo?.antesUrl ||
                                        trabajo?.fotoAntes ||
                                        trabajo?.antes ||
                                        "";

                                    const fotoDespuesCard =
                                        trabajo?.fotoDespuesUrl ||
                                        trabajo?.despuesUrl ||
                                        trabajo?.fotoDespues ||
                                        trabajo?.despues ||
                                        "";

                                    const videoCardUrl =
                                        trabajo?.videoTrabajoUrl ||
                                        trabajo?.videoUrl ||
                                        trabajo?.videoTrabajo ||
                                        trabajo?.video ||
                                        "";

                                    return (
                                        <div key={trabajo.id} style={itemCard}>
                                            <div style={itemCategory}>
                                                {CATEGORIAS.find((cat) => cat.value === trabajo.categoria)?.label || trabajo.categoria || "Sin categoría"}
                                            </div>

                                            <div style={itemTitle}>{trabajo.titulo || "Sin título"}</div>
                                            <div style={itemDescription}>{trabajo.descripcion || "Sin descripción"}</div>

                                            <div style={itemMediaGrid}>
                                                <div style={thumbBox}>
                                                    {fotoAntesCard ? (
                                                        <img src={fotoAntesCard} alt="Antes" style={thumbImage} />
                                                    ) : (
                                                        <div style={emptyThumbText}>Sin ANTES</div>
                                                    )}
                                                </div>

                                                <div style={thumbBox}>
                                                    {fotoDespuesCard ? (
                                                        <img src={fotoDespuesCard} alt="Después" style={thumbImage} />
                                                    ) : (
                                                        <div style={emptyThumbText}>Sin DESPUÉS</div>
                                                    )}
                                                </div>
                                            </div>

                                            {videoCardUrl && (
                                                <div style={{ marginTop: 14 }}>
                                                    <video src={videoCardUrl} controls style={itemVideo} />
                                                </div>
                                            )}

                                            <div style={itemActions}>
                                                <button type="button" onClick={() => editarTrabajo(trabajo)} style={btnSave}>
                                                    Editar
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => handleEliminarTrabajo(trabajo.id)}
                                                    style={btnDanger}
                                                    disabled={borrandoId === trabajo.id}
                                                >
                                                    {borrandoId === trabajo.id ? "Borrando..." : "Borrar"}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
/* ======================= */
/* ESTILOS (Brillo Urbano) */
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

const tabsRow = {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 24
};

const tabButton = {
    background: "#161a21",
    border: "1px solid #262b33",
    padding: "12px 16px",
    borderRadius: 12,
    color: "#d2d8df",
    cursor: "pointer",
    fontWeight: 700
};

const tabButtonActive = {
    background: "#00c27a",
    border: "1px solid #00c27a",
    padding: "12px 16px",
    borderRadius: 12,
    color: "white",
    cursor: "pointer",
    fontWeight: 700
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

const sectionTitleNoMargin = {
    color: "white",
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 0
};

const manageHeader = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap",
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

const listGrid = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: 20
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

const itemCard = {
    background: "#161a21",
    border: "1px solid #262b33",
    borderRadius: 18,
    padding: 18,
    boxShadow: "0 8px 25px rgba(0,0,0,.25)"
};

const itemCategory = {
    display: "inline-block",
    background: "rgba(0,194,122,.12)",
    border: "1px solid rgba(0,194,122,.35)",
    color: "#8af0c2",
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 12
};

const itemTitle = {
    color: "white",
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 10
};

const itemDescription = {
    color: "#b7bec8",
    fontSize: 14,
    lineHeight: 1.6
};

const itemMediaGrid = {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 12,
    marginTop: 16
};

const thumbBox = {
    aspectRatio: "4 / 3",
    background: "#0b0f14",
    borderRadius: 14,
    overflow: "hidden",
    border: "1px solid #262b33",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
};

const thumbImage = {
    width: "100%",
    height: "100%",
    objectFit: "cover"
};

const emptyThumbText = {
    color: "#7f8a97",
    fontSize: 13,
    textAlign: "center",
    padding: 14
};

const itemVideo = {
    width: "100%",
    maxHeight: 280,
    borderRadius: 12
};

const itemActions = {
    marginTop: 16,
    display: "flex",
    gap: 12,
    flexWrap: "wrap"
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

const btnGhost = {
    padding: "12px 18px",
    borderRadius: 12,
    border: "1px solid #2a2f37",
    background: "#1c2027",
    color: "white",
    cursor: "pointer",
    fontWeight: 700
};

const btnDanger = {
    padding: "12px 18px",
    borderRadius: 12,
    border: "1px solid #8a2b2b",
    background: "#4d1f1f",
    color: "#ffdddd",
    cursor: "pointer",
    fontWeight: 700
};
