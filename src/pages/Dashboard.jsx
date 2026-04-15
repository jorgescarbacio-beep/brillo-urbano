import { useEffect, useState } from "react";
import { auth, db } from "../firebase/config";
import { signOut } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";

import Clientes from "./Clientes";
import AvisarHoy from "./AvisarHoy";
import NuevoServicio from "./NuevoServicio";
import Estadisticas from "./Estadisticas";
import Costos from "./Costos";
import Calendarios from "./Calendarios";
import ServiciosProgramados from "./ServiciosProgramados";
import AgendaServicios from "./AgendaServicios";
import TrabajosRealizados from "./TrabajosRealizados";

import AdminWeb from "./admin/AdminWeb";

import { listenAvisarHoy, listenServiciosVencidos } from "../services/serviciosService";
import { listenClientes } from "../services/clientesService";

export default function Dashboard({ user }) {

    const [view, setView] = useState("home");
    const [servicioInicial, setServicioInicial] = useState(null);

    const [hoy, setHoy] = useState([]);
    const [vencidos, setVencidos] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [filtroAlerta, setFiltroAlerta] = useState(null);

    const [windowWidth, setWindowWidth] = useState(() => window.innerWidth);
    const [showAdminWebMenu, setShowAdminWebMenu] = useState(false);

    useEffect(() => {

        const u1 = listenAvisarHoy(setHoy);
        const u2 = listenServiciosVencidos(setVencidos);
        const u3 = listenClientes(setClientes);

        return () => {
            u1();
            u2();
            u3();
        };

    }, []);

    useEffect(() => {

        const onResize = () => setWindowWidth(window.innerWidth);

        window.addEventListener("resize", onResize);

        return () => window.removeEventListener("resize", onResize);

    }, []);

    useEffect(() => {

        const handleClickOutside = () => {
            setShowAdminWebMenu(false);
        };

        if (showAdminWebMenu) {
            window.addEventListener("click", handleClickOutside);
        }

        return () => {
            window.removeEventListener("click", handleClickOutside);
        };

    }, [showAdminWebMenu]);

    const isMobile = windowWidth < 768;

    /* ===================== */
    /* LOGICA DE CONTACTO */
    /* ===================== */

    const getCliente = (id) => clientes.find(c => c.id === id);

    const marcarAvisado = async (id) => {
        const ref = doc(db, "servicios", id);
        await updateDoc(ref, {
            avisado: true,
            fechaUltimoAviso: Date.now()
        });
    };

    const handleWapp = (servicio) => {
        const cliente = getCliente(servicio.clienteId);
        if (!cliente) return;

        const telefono = cliente.telefono?.replace(/\D/g, '');
        const fechaFormat = new Date(servicio.fechaISO || servicio.fecha).toLocaleDateString("es-AR");

        // Tu mensaje personalizado con emojis y saltos de línea
        const msj = `*¡Hola ${cliente.nombre}!* 👋 ¿Cómo estás? \n\nTe escribimos de *Brillo Urbano* ✨ para recordarte que ya pasaron los días sugeridos desde tu último servicio del ${fechaFormat}. 🗓️ \n\nQueríamos consultarte si te gustaría que te reservemos un lugar para realizar el mantenimiento de limpieza en los próximos días. ¡Avisanos y coordinamos! 😊`;

        const url = `https://wa.me/${telefono}?text=${encodeURIComponent(msj)}`;
        window.open(url, '_blank');

        // Marcamos como avisado en Firebase para que cambie el color del botón
        marcarAvisado(servicio.id);
    };

    /* ===================== */
    /* VISTAS */
    /* ===================== */

    if (view === "clientes") return <Clientes user={user} onBack={() => setView("home")} />;
    if (view === "avisar") return <AvisarHoy onBack={() => setView("home")} />;
    if (view === "nuevo") return <NuevoServicio user={user} servicioInicial={servicioInicial} onBack={() => setView("home")} />;
    if (view === "estadisticas") return <Estadisticas onBack={() => setView("home")} />;
    if (view === "costos") return <Costos onBack={() => setView("home")} />;
    if (view === "calendarios") return <Calendarios user={user} onBack={() => setView("home")} />;

    if (view === "programados") {
        return (
            <ServiciosProgramados
                onBack={() => setView("home")}
                onStartServicio={(data) => {
                    setServicioInicial(data);
                    setView("nuevo");
                }}
            />
        );
    }

    if (view === "agenda") return <AgendaServicios onBack={() => setView("home")} />;
    if (view === "trabajos") return <TrabajosRealizados onBack={() => setView("home")} />;
    if (view === "adminWeb") return <AdminWeb user={user} onBack={() => setView("home")} />;

    /* ===================== */
    /* DASHBOARD MAIN */
    /* ===================== */

    return (

        <div style={app}>

            <header style={header(isMobile)}>

                <div style={brand}>
                    <img src="/logo-brillo-urbano.png" alt="Brillo Urbano" style={logo(isMobile)} />
                    <div>
                        <div style={brandTitle(isMobile)}>BRILLO URBANO</div>
                        <div style={brandSub}>Panel de gestión</div>
                    </div>
                </div>

                <div style={headerRight(isMobile)}>

                    {/* ACA ESTA TU ACCESO AL LANDING QUE ME HABIA COMIDO */}
                    <div style={adminWebBox} onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => setShowAdminWebMenu((prev) => !prev)}
                            style={adminWebButton}
                        >
                            Admin Web
                        </button>

                        {showAdminWebMenu && (
                            <div style={adminWebMenu(isMobile)}>
                                <button
                                    style={adminWebMenuItem}
                                    onClick={() => {
                                        setShowAdminWebMenu(false);
                                        setView("adminWeb");
                                    }}
                                >
                                    Administrar contenido
                                </button>

                                <button
                                    style={adminWebMenuItem}
                                    onClick={() => {
                                        setShowAdminWebMenu(false);
                                        window.open("/?landing", "_blank");
                                    }}
                                >
                                    Ver landing
                                </button>
                            </div>
                        )}
                    </div>

                    <div style={userBox(isMobile)}>
                        <span style={userMail(isMobile)}>{user.email}</span>
                        <button onClick={() => signOut(auth)} style={logout}>Cerrar sesión</button>
                    </div>

                </div>

            </header>

            <main style={main(isMobile)}>

                <div style={hero(isMobile)}>
                    <div>
                        <div style={heroTitle}>Bienvenido</div>
                        <div style={heroText}>Gestioná clientes, servicios y estadísticas desde un solo lugar</div>
                        <div style={heroButtons}>
                            <button style={btnHero} onClick={() => setView("agenda")}>Ver agenda</button>
                            <button
                                style={btnHeroOutline}
                                onClick={() => {
                                    setServicioInicial(null);
                                    setView("nuevo");
                                }}
                            >
                                Nuevo servicio
                            </button>
                        </div>
                    </div>
                </div>

                {/* ALERTAS CON CLIC PARA DESPLEGAR */}
                {(hoy.length > 0 || vencidos.length > 0) && (
                    <div style={alertBox}>
                        {vencidos.length > 0 && (
                            <div
                                style={{ ...alertRed, cursor: 'pointer' }}
                                onClick={() => setFiltroAlerta(filtroAlerta === 'vencidos' ? null : 'vencidos')}
                            >
                                🔴 {vencidos.length} servicios vencidos {filtroAlerta === 'vencidos' ? '▲' : '▼'}
                            </div>
                        )}

                        {hoy.length > 0 && (
                            <div
                                style={{ ...alertYellow, cursor: 'pointer' }}
                                onClick={() => setFiltroAlerta(filtroAlerta === 'hoy' ? null : 'hoy')}
                            >
                                🟡 {hoy.length} servicios para avisar hoy {filtroAlerta === 'hoy' ? '▲' : '▼'}
                            </div>
                        )}
                    </div>
                )}

                {/* AREA DESPLEGABLE DE DETALLES */}
                {filtroAlerta && (
                    <div style={detallePanel}>
                        <h4 style={{ color: '#fff', marginBottom: 15 }}>
                            {filtroAlerta === 'hoy' ? 'Avisar hoy' : 'Vencidos'}
                        </h4>
                        {(filtroAlerta === 'hoy' ? hoy : vencidos).map(s => {
                            const c = getCliente(s.clienteId);
                            return (
                                <div key={s.id} style={filaDetalle}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 'bold', color: '#00c27a' }}>{c?.nombre || 'Sin nombre'}</div>
                                        <div style={{ fontSize: 12, color: '#aaa' }}>{new Date(s.fechaISO || s.fecha).toLocaleDateString()}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 10 }}>
                                        <button
                                            onClick={() => handleWapp(s)}
                                            style={{ ...btnAccion, background: s.avisado ? '#128C7E' : '#25D366' }}
                                        >
                                            {s.avisado ? '✔ Re-enviar' : 'WhatsApp'}
                                        </button>
                                        <button
                                            onClick={() => { setServicioInicial({ clienteId: s.clienteId }); setView("nuevo"); }}
                                            style={{ ...btnAccion, background: '#333' }}
                                        >
                                            + Servicio
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                <div style={grid(windowWidth)}>
                    <Card icon="👥" title="Clientes" desc="Alta y listado de clientes" onClick={() => setView("clientes")} />
                    <Card icon="📅" title="Calendarios" desc="Prospectos y visitas programadas" onClick={() => setView("calendarios")} />
                    <Card icon="📋" title="Servicios programados" desc="Trabajos confirmados pendientes" onClick={() => setView("programados")} />
                    <Card icon="🗓" title="Agenda de trabajos" desc="Vista organizada por día y hora" onClick={() => setView("agenda")} />
                    <Card icon="⏰" title="Avisar hoy" desc="Recordatorios exactos a 35 días" onClick={() => setView("avisar")} />
                    <Card icon="📊" title="Estadísticas" desc="Facturación y ranking automático" onClick={() => setView("estadisticas")} />
                    <Card icon="💰" title="Costos / Gastos" desc="Operarios, insumos y ganancias" onClick={() => setView("costos")} />
                    <Card icon="📁" title="Trabajos realizados" desc="Historial completo de servicios" onClick={() => setView("trabajos")} />
                    <Card icon="➕" title="Nuevo servicio" desc="Cargar servicio + fotos" onClick={() => { setServicioInicial(null); setView("nuevo"); }} />
                </div>

            </main>

        </div>

    );
}

function Card({ title, desc, icon, onClick }) {
    return (
        <div style={card}>
            <div>
                <div style={cardIcon}>{icon}</div>
                <h3 style={cardTitle}>{title}</h3>
                <p style={cardDesc}>{desc}</p>
            </div>
            <button style={btnPrimary} onClick={onClick}>Abrir</button>
        </div>
    );
}

/* ======================= */
/* ESTILOS (Tus originales) */
/* ======================= */

const app = { minHeight: "100vh", background: "#0f1115" };

const header = (isMobile) => ({
    background: "linear-gradient(90deg,#11161d,#18212b)",
    padding: isMobile ? "16px" : "18px 30px",
    display: "flex",
    flexDirection: isMobile ? "column" : "row",
    alignItems: isMobile ? "flex-start" : "center",
    justifyContent: "space-between",
    borderBottom: "1px solid #1f242c",
    gap: isMobile ? 14 : 20,
});

const brand = { display: "flex", alignItems: "center", gap: 16 };
const logo = (isMobile) => ({ width: isMobile ? 44 : 68, height: isMobile ? 44 : 68, objectFit: "contain" });
const brandTitle = (isMobile) => ({ fontSize: isMobile ? 18 : 22, fontWeight: 700, color: "#00c27a", letterSpacing: 1 });
const brandSub = { fontSize: 12, color: "#888" };

const headerRight = (isMobile) => ({
    display: "flex",
    alignItems: isMobile ? "stretch" : "center",
    flexDirection: isMobile ? "column" : "row",
    gap: 12,
    width: isMobile ? "100%" : "auto"
});

const userBox = (isMobile) => ({
    display: "flex",
    alignItems: isMobile ? "stretch" : "center",
    flexDirection: isMobile ? "column" : "row",
    gap: 12,
    width: isMobile ? "100%" : "auto"
});

const userMail = (isMobile) => ({ color: "#bbb", fontSize: 14, wordBreak: "break-word", maxWidth: isMobile ? "100%" : 260 });

const logout = { background: "#1c2027", border: "1px solid #2a2f37", color: "white", padding: "8px 14px", borderRadius: 10, cursor: "pointer" };

const adminWebBox = { position: "relative" };

const adminWebButton = { background: "transparent", border: "1px solid #00c27a", color: "#00c27a", padding: "8px 14px", borderRadius: 10, cursor: "pointer", fontWeight: 700 };

const adminWebMenu = (isMobile) => ({
    position: "absolute",
    top: "calc(100% + 8px)",
    right: 0,
    minWidth: isMobile ? "100%" : 220,
    background: "#1c2027",
    border: "1px solid #2a2f37",
    borderRadius: 12,
    boxShadow: "0 8px 25px rgba(0,0,0,.35)",
    overflow: "hidden",
    zIndex: 20
});

const adminWebMenuItem = { width: "100%", background: "transparent", border: 0, color: "white", textAlign: "left", padding: "12px 14px", cursor: "pointer", fontSize: 14 };

const main = (isMobile) => ({ padding: isMobile ? "20px 16px 30px" : "40px", maxWidth: 1200, margin: "auto" });

const hero = (isMobile) => ({
    background: "linear-gradient(135deg,#11161d,#1b232d)",
    borderRadius: 20,
    padding: isMobile ? 20 : 30,
    marginBottom: 30,
    border: "1px solid #262b33"
});

const heroTitle = { fontSize: 28, color: "white", fontWeight: 700 };
const heroText = { color: "#aaa", marginTop: 6 };
const heroButtons = { marginTop: 20, display: "flex", gap: 12, flexWrap: "wrap" };
const btnHero = { padding: "10px 18px", borderRadius: 12, border: 0, background: "#00c27a", color: "white", fontWeight: 700, cursor: "pointer" };
const btnHeroOutline = { padding: "10px 18px", borderRadius: 12, border: "1px solid #00c27a", background: "transparent", color: "#00c27a", fontWeight: 700, cursor: "pointer" };

const alertBox = { display: "flex", gap: 10, marginBottom: 25, flexWrap: "wrap" };
const alertRed = { background: "#4d1f1f", border: "1px solid #8a2b2b", padding: "10px 14px", borderRadius: 12, color: "#ffb3b3", fontWeight: 600 };
const alertYellow = { background: "#4a3f17", border: "1px solid #9e8c33", padding: "10px 14px", borderRadius: 12, color: "#ffe58a", fontWeight: 600 };

/* NUEVOS ESTILOS PARA EL PANEL DESPLEGABLE */
const detallePanel = { background: '#161a21', border: '1px solid #262b33', borderRadius: 16, padding: 20, marginBottom: 30 };
const filaDetalle = { display: 'flex', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #262b33' };
const btnAccion = { border: 0, color: 'white', padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' };

const grid = (windowWidth) => {
    if (windowWidth < 768) return { display: "grid", gridTemplateColumns: "1fr", gap: 20 };
    if (windowWidth < 1100) return { display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 24 };
    return { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24 };
};

const card = { background: "#161a21", borderRadius: 16, padding: 24, border: "1px solid #262b33", boxShadow: "0 8px 25px rgba(0,0,0,.35)", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 180 };
const cardIcon = { fontSize: 26, marginBottom: 10 };
const cardTitle = { fontSize: 20, color: "white", margin: 0 };
const cardDesc = { marginTop: 8, color: "#aaa", fontSize: 14, lineHeight: 1.5 };
const btnPrimary = { marginTop: 20, padding: "12px", borderRadius: 12, border: 0, background: "#00c27a", color: "white", cursor: "pointer", fontWeight: 700 };