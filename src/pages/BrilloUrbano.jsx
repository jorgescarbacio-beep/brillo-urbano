// VERSION COMPLETA Y RESTAURADA - BRILLO URBANO
import React, { useEffect, useState } from "react";

// 1. IMPORTACIÓN DE ASSETS (IMÁGENES DE LA LANDING)
import logo from "../assets/logo-brillo-urbano.png";
import imgCampanas from "../assets/campanas.jpeg";
import imgCocinas from "../assets/cocinas.jpeg";
import imgExtractores from "../assets/extractores.jpeg";
import imgRejillas from "../assets/rejillas.jpeg";
import imgExterior from "../assets/exterior.jpeg";
import imgTrampasGrasa from "../assets/trampas.jpeg";

// 2. CONFIGURACIÓN DE FIREBASE
import { db } from "../firebase/config";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";

export default function BrilloUrbanoLanding() {
    const [trabajos, setTrabajos] = useState([]);
    const [filtro, setFiltro] = useState("todos");
    const [view, setView] = useState("landing");

    const serviceImages = {
        cocinas: imgCocinas,
        campanas: imgCampanas,
        extractores: imgExtractores,
        rejillas: imgRejillas,
        exteriores: imgExterior,
        trampas: imgTrampasGrasa
    };

    const certificacionesList = [
        {
            nombre: "Normas ISO 9001:2015",
            link: "https://firebasestorage.googleapis.com/v0/b/brillo-urbano.firebasestorage.app/o/certificaciones%2Fcertificado-iso-9001-2015.pdf?alt=media&token=c4564394-d86f-405a-b201-38c6b1615da9"
        },
        {
            nombre: "Certificado 9001-2023",
            link: "https://firebasestorage.googleapis.com/v0/b/brillo-urbano.firebasestorage.app/o/certificaciones%2Fcertificados-9001-2023-esp.pdf?alt=media&token=8821a04c-1b0e-4099-bef1-fac9f0c2c49f"
        },
        {
            nombre: "Certificado 45001-2023",
            link: "https://firebasestorage.googleapis.com/v0/b/brillo-urbano.firebasestorage.app/o/certificaciones%2Fcertificados-45001-2023-esp.pdf?alt=media&token=ec4738d4-3d0a-4d10-a1da-910384d1ea6b"
        },
        {
            nombre: "Ficha de Seguridad CMC",
            link: "https://firebasestorage.googleapis.com/v0/b/brillo-urbano.firebasestorage.app/o/certificaciones%2Fficha-seguridad-cmc.pdf?alt=media&token=ff070a75-26b9-49ef-a2ae-62eac80a96a4"
        },
        {
            nombre: "Ficha Técnica Deptal V1.6",
            link: "https://firebasestorage.googleapis.com/v0/b/brillo-urbano.firebasestorage.app/o/certificaciones%2Fdeptal-cmc-v1-6.pdf?alt=media&token=b863bbca-2189-4440-89b8-14f54ac21ac1"
        },
        {
            nombre: "Ficha Técnica HD 585",
            link: "https://firebasestorage.googleapis.com/v0/b/brillo-urbano.firebasestorage.app/o/certificaciones%2Fficha-hd-585.pdf?alt=media&token=88847ebe-2619-48bc-a888-3cd30699761d"
        },
        {
            nombre: "Habilitación SENASA 2029",
            link: "https://firebasestorage.googleapis.com/v0/b/brillo-urbano.firebasestorage.app/o/certificaciones%2Fhabilitacion-senasa-2029.pdf?alt=media&token=9ac74113-7334-4fe4-96b8-d3d30f49f754"
        },
        {
            nombre: "Protocolo PST.01",
            link: "https://firebasestorage.googleapis.com/v0/b/brillo-urbano.firebasestorage.app/o/certificaciones%2Fprotocolo-pst-01.pdf?alt=media&token=e2f47499-cdf6-452b-9f5f-0832348cc31d"
        }
    ];

    useEffect(() => {
        const handleNavigation = () => {
            const url = window.location.href;

            if (
                url.includes("#certificaciones") ||
                url.includes("certificaciones")
            ) {
                setView("certificaciones");
            } else {
                setView("landing");
            }
        };

        handleNavigation();

        window.addEventListener("hashchange", handleNavigation);
        window.addEventListener("popstate", handleNavigation);

        return () => {
            window.removeEventListener("hashchange", handleNavigation);
            window.removeEventListener("popstate", handleNavigation);
        };
    }, []);

    useEffect(() => {
        const q = query(collection(db, "web_trabajos"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTrabajos(data);
        });
        return () => unsubscribe();
    }, []);

    const abrirCertificaciones = () => {
        window.location.hash = "#certificaciones";
        window.scrollTo(0, 0);
    };

    const volverALanding = () => {
        window.location.hash = "";
        window.scrollTo(0, 0);
    };

    if (view === "certificaciones") {
        return (
            <div style={{ ...app, padding: "20px" }}>
                <nav style={{ display: "flex", justifyContent: "space-between", marginBottom: "30px", alignItems: "center" }}>
                    <img src={logo} style={{ width: "50px" }} alt="Logo" />
                    <button
                        onClick={volverALanding}
                        style={{
                            background: "#22c55e",
                            color: "black",
                            border: "none",
                            padding: "10px 20px",
                            borderRadius: "10px",
                            fontWeight: "bold",
                            cursor: "pointer"
                        }}
                    >
                        VOLVER A LA WEB
                    </button>
                </nav>
                <div style={{ textAlign: "center", marginBottom: "40px" }}>
                    <h2 style={sectionTitle}>Certificaciones de Calidad</h2>
                    <p style={sectionSubtitle}>Respaldo técnico legal de nuestros procesos.</p>
                </div>
                <div style={certGrid}>
                    {certificacionesList.map((c, i) => (
                        <a
                            key={i}
                            href={c.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ ...certCard, cursor: "pointer" }}
                        >
                            <div style={certIconBox}>
                                <svg viewBox="0 0 24 24" width="24" height="24" fill="#22c55e">
                                    <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                                </svg>
                            </div>

                            <div style={certTextContainer}>
                                <span style={certName}>{c.nombre}</span>
                                <span style={certSub}>TOCAR PARA VER PDF</span>
                            </div>
                        </a>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div style={app} className="app-container">
            {/* HEADER CON ESTILO PROFESIONAL */}
            <header style={header} className="main-header">
                <div style={brand} className="brand-container">
                    <div style={logoWrapper}>
                        <img src={logo} style={logoStyle} alt="Brillo Urbano Logo" className="logo-glow" />
                    </div>
                    <div style={brandTextContainer}>
                        <span style={brandText}>BRILLO <span style={brandHighlight}>URBANO</span></span>
                        <span style={brandSubtext}>LIMPIEZA INDUSTRIAL</span>
                    </div>
                </div>

                <div style={headerActions}>
                    <div style={socials}>
                        <div style={socialItem}>
                            <a href="https://www.instagram.com/brillourbano.limpieza/" target="_blank" rel="noreferrer" style={socialLink}>
                                <div style={iconInsta}>
                                    <svg viewBox="0 0 24 24" width="20" height="20" fill="white"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a3.838 3.838 0 110-7.676A3.838 3.838 0 0112 16zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
                                </div>
                                <span style={socialLabel}>INSTAGRAM</span>
                            </a>
                        </div>
                        <div style={socialItem}>
                            <a href="https://wa.me/5492236713970" target="_blank" rel="noreferrer" style={socialLink}>
                                <div style={iconWapp}>
                                    <svg viewBox="0 0 24 24" width="20" height="20" fill="white"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" /></svg>
                                </div>
                                <span style={socialLabel}>WHATSAPP</span>
                            </a>
                        </div>
                    </div>

                    <button onClick={abrirCertificaciones} style={certificacionesBtn}>
                        CERTIFICACIONES
                    </button>
                </div>
            </header>

            {/* SECCIÓN HERO */}
            <section style={hero}>
                <div style={heroBadge}>SERVICIO ESPECIALIZADO EN MAR DEL PLATA</div>
                <h1 style={title}>
                    Soluciones integrales de <br />
                    <span style={gradientText}>limpieza gastronómica</span>
                </h1>
                <p style={subtitle}>
                    Mantenimiento preventivo y correctivo de campanas, ductos, extractores y trampas de grasa con tecnología de vanguardia.
                </p>
                <div style={heroActions}>
                    <a href="https://wa.me/5492236713970" target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
                        <button style={cta} className="pulse-btn">Solicitar Presupuesto Gratis</button>
                    </a>
                </div>
            </section>

            {/* GRILLA DE SERVICIOS - 3x3 */}
            <section style={gridContainer}>
                <div style={grid} className="services-grid">
                    <Card titulo="Cocinas" texto="Desengrase profundo de equipos y pisos industriales." imgSrc={serviceImages.cocinas} />
                    <Card titulo="Campanas" texto="Eliminación de grasa acumulada con vapor y químicos." imgSrc={serviceImages.campanas} />
                    <Card titulo="Extractores" texto="Limpieza interna de turbinas y motores de extracción." imgSrc={serviceImages.extractores} />
                    <Card titulo="Rejillas" texto="Desobstrucción técnica de sistemas de desagüe." imgSrc={serviceImages.rejillas} />
                    <Card titulo="Exteriores" texto="Lavado a presión de veredas y fachadas comerciales." imgSrc={serviceImages.exteriores} />
                    <Card titulo="Trampas de Grasa" texto="Mantenimiento y evacuación de residuos grasos." imgSrc={serviceImages.trampas} />
                </div>
            </section>

            {/* SECCIÓN TRABAJOS REALIZADOS */}
            <section style={trabajosBox}>
                <div style={sectionHeader}>
                    <h2 style={sectionTitle}>Nuestra Galería de Trabajos</h2>
                    <p style={sectionSubtitle}>Evidencia real de nuestra calidad y compromiso en cada servicio.</p>
                </div>

                {/* BARRA DE FILTROS */}
                <nav style={filtros} className="filter-bar">
                    {["todos", "cocinas", "campanas", "extractores", "rejillas", "exteriores", "trampas"].map(cat => (
                        <button
                            key={cat}
                            onClick={() => setFiltro(cat)}
                            style={filtroBtnStyle(filtro === cat)}
                            className="filter-btn-item"
                        >
                            {cat === "trampas" ? "Trampas" : cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </button>
                    ))}
                </nav>

                {/* GRID DE TRABAJOS DESDE FIREBASE */}
                <div style={gridTrabajos} className="trabajos-grid">
                    {trabajos
                        .filter(t => filtro === "todos" || t.categoria?.toLowerCase() === filtro)
                        .map(t => (
                            <article key={t.id} style={cardTrabajo} className="trabajo-card-anim">
                                <div style={cardTrabajoHeader}>
                                    <h3 style={cardTrabajoTitle}>{t.titulo}</h3>
                                    <span style={tagCat}>{t.categoria}</span>
                                </div>
                                <p style={cardTrabajoDesc}>{t.descripcion}</p>

                                {/* COMPONENTE ANTES/DESPUES */}
                                <AntesDespues antes={t.antes} despues={t.despues} />

                                {t.video && (
                                    <div style={videoWrapper}>
                                        <video src={t.video} controls style={videoStyle} />
                                    </div>
                                )}
                            </article>
                        ))}
                </div>
            </section>

            {/* ESTILOS GLOBALES Y ANIMACIONES */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
                
                body { margin: 0; padding: 0; background-color: #020617; overflow-x: hidden; }
                
                .logo-glow { animation: logoPulse 3s infinite ease-in-out; }
                @keyframes logoPulse {
                    0%, 100% { filter: drop-shadow(0 0 8px rgba(34,197,94,0.4)); transform: scale(1); }
                    50% { filter: drop-shadow(0 0 20px rgba(34,197,94,0.7)); transform: scale(1.05); }
                }

                .service-card { transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
                .service-card:hover { transform: translateY(-12px); border-color: rgba(34,197,94,0.5) !important; }

                .pulse-btn { animation: pulseShadow 2s infinite; }
                @keyframes pulseShadow {
                    0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
                    70% { box-shadow: 0 0 0 15px rgba(34, 197, 94, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
                }

                .trabajo-card-anim { animation: fadeInUp 0.6s ease forwards; }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                @media (max-width: 900px) {
                    .services-grid { grid-template-columns: repeat(2, 1fr) !important; }
                }

                @media (max-width: 700px) {
                    .header-actions { width: 100% !important; align-items: center !important; }
                    .certificaciones-btn { width: 100% !important; }
                }

                @media (max-width: 600px) {
                    .services-grid { grid-template-columns: 1fr !important; }
                    .main-header { padding: 15px !important; flex-direction: column; gap: 15px; height: auto !important; }
                    .filter-bar { flex-wrap: wrap; }
                }
            `}</style>
        </div>
    );
}

// COMPONENTES AUXILIARES
function Card({ titulo, texto, imgSrc }) {
    return (
        <div style={cardStyle} className="service-card">
            <div style={cardImgBox}>
                <img src={imgSrc} alt={titulo} style={cardImg} />
                <div style={cardImgGradient}></div>
            </div>
            <div style={cardBody}>
                <div style={cardIndicator}></div>
                <h3 style={cardTitle}>{titulo}</h3>
                <p style={cardText}>{texto}</p>
            </div>
        </div>
    );
}

function AntesDespues({ antes, despues }) {
    const [sliderPos, setSliderPos] = useState(50);
    return (
        <div style={sliderContainer}>
            <div style={sliderFrame}>
                <img src={despues} style={sliderImgBase} alt="Despues" />
                <div style={{ ...sliderImgOverlay, width: `${sliderPos}%` }}>
                    <img src={antes} style={sliderImgAntes} alt="Antes" />
                </div>
                <div style={{ ...sliderDivider, left: `${sliderPos}%` }}>
                    <div style={sliderHandle}></div>
                </div>
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={sliderPos}
                    onChange={(e) => setSliderPos(e.target.value)}
                    style={sliderInput}
                />
            </div>
        </div>
    );
}

// --- OBJETOS DE ESTILO (CONSTANTES) ---
const app = { backgroundColor: "#020617", color: "#f8fafc", fontFamily: "'Plus Jakarta Sans', sans-serif", minHeight: "100vh" };

const header = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 40px",
    minHeight: "90px",
    maxWidth: "1400px",
    margin: "0 auto",
    background: "rgba(15, 23, 42, 0.8)",
    backdropFilter: "blur(15px)",
    position: "sticky",
    top: 0,
    zIndex: 1000,
    gap: "20px",
    flexWrap: "wrap"
};

const brand = { display: "flex", alignItems: "center", gap: "15px" };
const logoWrapper = { padding: "5px", background: "rgba(34,197,94,0.05)", borderRadius: "12px", border: "1px solid rgba(34,197,94,0.2)" };
const logoStyle = { width: "45px", height: "auto" };
const brandTextContainer = { display: "flex", flexDirection: "column" };
const brandText = { fontSize: "22px", fontWeight: "800" };
const brandHighlight = { color: "#22c55e" };
const brandSubtext = { fontSize: "10px", color: "#64748b", letterSpacing: "2px" };

const headerActions = {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "10px"
};

const socials = { display: "flex", gap: "20px" };
const socialItem = { textAlign: "center" };
const socialLink = { textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" };
const iconInsta = { width: "40px", height: "40px", borderRadius: "12px", background: "linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)", display: "flex", alignItems: "center", justifyContent: "center" };
const iconWapp = { width: "40px", height: "40px", borderRadius: "12px", background: "#22c55e", display: "flex", alignItems: "center", justifyContent: "center" };
const socialLabel = { fontSize: "9px", fontWeight: "800", color: "#94a3b8" };

const certificacionesBtn = {
    background: "#22c55e",
    color: "#04130a",
    border: "none",
    borderRadius: "14px",
    padding: "12px 22px",
    fontWeight: "800",
    fontSize: "13px",
    letterSpacing: "0.5px",
    cursor: "pointer",
    boxShadow: "0 8px 24px rgba(34,197,94,0.25)"
};

const hero = { padding: "100px 20px 60px", textAlign: "center", maxWidth: "900px", margin: "0 auto" };
const heroBadge = { display: "inline-block", padding: "8px 20px", borderRadius: "100px", background: "rgba(34,197,94,0.1)", color: "#4ade80", fontSize: "12px", fontWeight: "700", marginBottom: "30px" };
const title = { fontSize: "clamp(40px, 8vw, 72px)", fontWeight: "800", lineHeight: "1.1" };
const gradientText = { color: "#22c55e" };
const subtitle = { fontSize: "19px", color: "#94a3b8", marginTop: "25px" };
const heroActions = { marginTop: "40px" };
const cta = { padding: "20px 45px", borderRadius: "20px", background: "#22c55e", color: "#fff", border: "none", fontSize: "18px", fontWeight: "800", cursor: "pointer" };

const gridContainer = { maxWidth: "1200px", margin: "60px auto", padding: "0 20px" };
const grid = { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "25px" };

const cardStyle = { background: "#0f172a", borderRadius: "30px", border: "1px solid rgba(255,255,255,0.05)", overflow: "hidden", position: "relative" };
const cardImgBox = { width: "100%", height: "180px", position: "relative" };
const cardImg = { width: "100%", height: "100%", objectFit: "cover" };
const cardImgGradient = { position: "absolute", bottom: 0, width: "100%", height: "50%", background: "linear-gradient(to top, #0f172a, transparent)" };
const cardBody = { padding: "25px", position: "relative" };
const cardIndicator = { width: "40px", height: "4px", background: "rgba(34,197,94,0.2)", marginBottom: "15px" };
const cardTitle = { fontSize: "20px", fontWeight: "700", margin: "0 0 10px 0" };
const cardText = { fontSize: "14px", color: "#94a3b8", margin: 0 };

const trabajosBox = { padding: "100px 20px", maxWidth: "1300px", margin: "0 auto" };
const sectionHeader = { textAlign: "center", marginBottom: "50px" };
const sectionTitle = { fontSize: "40px", fontWeight: "800" };
const sectionSubtitle = { color: "#64748b" };

const filtros = { display: "flex", justifyContent: "center", gap: "10px", marginBottom: "40px" };
const filtroBtnStyle = (active) => ({ padding: "12px 24px", borderRadius: "100px", border: "none", background: active ? "#22c55e" : "transparent", color: active ? "#000" : "#94a3b8", cursor: "pointer", fontWeight: "700", transition: "0.3s" });

const gridTrabajos = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "30px" };
const cardTrabajo = { background: "#0f172a", borderRadius: "28px", padding: "25px", border: "1px solid rgba(255,255,255,0.04)" };
const cardTrabajoHeader = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" };
const cardTrabajoTitle = { margin: 0, fontSize: "18px", fontWeight: "700" };
const tagCat = { background: "rgba(34,197,94,0.1)", color: "#4ade80", fontSize: "11px", fontWeight: "800", padding: "5px 12px", borderRadius: "8px" };
const cardTrabajoDesc = { fontSize: "14px", color: "#94a3b8", marginBottom: "20px" };

const sliderContainer = { marginTop: "20px" };
const sliderFrame = { position: "relative", width: "100%", height: "280px", borderRadius: "20px", overflow: "hidden" };
const sliderImgBase = { width: "100%", height: "100%", objectFit: "cover" };
const sliderImgOverlay = { position: "absolute", top: 0, left: 0, height: "100%", overflow: "hidden", borderRight: "2px solid white" };
const sliderImgAntes = { width: "100%", height: "280px", objectFit: "cover", display: "block", maxWidth: "none" };
const sliderDivider = { position: "absolute", top: 0, bottom: 0, width: "2px", background: "white", zIndex: 10 };
const sliderHandle = { position: "absolute", top: "50%", left: "50%", width: "40px", height: "40px", borderRadius: "50%", background: "white", transform: "translate(-50%, -50%)", boxShadow: "0 0 15px rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center" };
const sliderInput = { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0, cursor: "ew-resize", zIndex: 20 };

const videoWrapper = { marginTop: "20px", borderRadius: "20px", overflow: "hidden", background: "#000" };
const videoStyle = { width: "100%", display: "block" };

const certGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "15px", maxWidth: "1000px", margin: "0 auto" };
const certCard = { background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "20px", padding: "20px", display: "flex", alignItems: "center", gap: "15px", color: "white", textDecoration: "none", transition: "0.3s" };
const certIconBox = { width: "50px", height: "50px", borderRadius: "12px", background: "rgba(34,197,94,0.1)", display: "flex", alignItems: "center", justifyContent: "center", minWidth: "50px" };
const certTextContainer = { display: "flex", flexDirection: "column" };
const certName = { fontSize: "14px", fontWeight: "700" };
const certSub = { fontSize: "10px", color: "#22c55e", fontWeight: "800", marginTop: "4px" };