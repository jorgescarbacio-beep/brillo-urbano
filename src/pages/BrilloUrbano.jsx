// VERSION FINAL CON IMAGENES LOCALES - BRILLO URBANO
import React, { useEffect, useState } from "react";

// 1. IMPORTACIÓN DE ASSETS LOCALES
import logo from "../assets/logo-brillo-urbano.png";
import imgCampanas from "../assets/Campanas.jpeg";
import imgCocinas from "../assets/Cocinas.jpeg";
import imgEquipos from "../assets/Equipos.jpeg";
import imgExterior from "../assets/Exterior.jpeg";

import { db } from "../firebase/config";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";

export default function BrilloUrbanoLanding() {
    const [trabajos, setTrabajos] = useState([]);
    const [filtro, setFiltro] = useState("todos");

    // Asignamos las imágenes importadas a sus categorías
    const serviceImages = {
        cocinas: imgCocinas,
        campanas: imgCampanas,
        equipos: imgEquipos,
        exteriores: imgExterior
    };

    useEffect(() => {
        const q = query(
            collection(db, "web_trabajos"),
            orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setTrabajos(data);
        });

        return () => unsubscribe();
    }, []);

    return (
        <div style={app}>
            {/* HEADER */}
            <div style={header}>
                <div style={brand}>
                    <img src={logo} style={{ width: 45, filter: "drop-shadow(0 0 8px rgba(34,197,94,0.4))" }} alt="Logo" />
                    <span style={brandText}>
                        BRILLO <span style={{ color: "#22c55e" }}>URBANO</span>
                    </span>
                </div>

                <div style={socials}>
                    <div style={socialItem}>
                        <a href="https://www.instagram.com/brillourbano.limpieza/" target="_blank" rel="noreferrer" style={socialLink}>
                            <div style={iconInsta}>
                                <svg viewBox="0 0 24 24" width="24" height="24" fill="white"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a3.838 3.838 0 110-7.676A3.838 3.838 0 0112 16zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
                            </div>
                            <span style={socialLabel}>Seguinos</span>
                        </a>
                    </div>
                    <div style={socialItem}>
                        <a href="https://wa.me/5492236713970" target="_blank" rel="noreferrer" style={socialLink}>
                            <div style={iconWapp}>
                                <svg viewBox="0 0 24 24" width="24" height="24" fill="white"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" /></svg>
                            </div>
                            <span style={socialLabel}>Contactanos</span>
                        </a>
                    </div>
                </div>
            </div>

            {/* HERO */}
            <div style={hero}>
                <div style={heroBadge}>Servicio 24/7 en Mar del Plata</div>
                <h1 style={title}>
                    Limpieza profesional
                    <br />
                    <span style={gradientText}>para gastronomía</span>
                </h1>
                <p style={subtitle}>
                    Especialistas en campanas, ductos, cocinas industriales y frentes comerciales.
                </p>
                <a href="https://wa.me/5492236713970" target="_blank" rel="noreferrer">
                    <button style={cta}>Pedir presupuesto gratis</button>
                </a>
            </div>

            {/* SERVICIOS CON TUS IMAGENES REALES */}
            <div style={grid}>
                <Card titulo="Cocinas" texto="Desinfección profunda y desengrase de pisos y azulejos." imgSrc={serviceImages.cocinas} />
                <Card titulo="Campanas" texto="Limpieza técnica de extractores con certificación de calidad." imgSrc={serviceImages.campanas} />
                <Card titulo="Equipos" texto="Mantenimiento de freidoras, hornos y planchas industriales." imgSrc={serviceImages.equipos} />
                <Card titulo="Exteriores" texto="Lavado a presión de veredas, frentes y cartelería." imgSrc={serviceImages.exteriores} />
            </div>

            {/* TRABAJOS (GALERIA FIREBASE) */}
            <div style={trabajosBox}>
                <h2 style={{ fontSize: 34, fontWeight: 800 }}>Nuestra Galería</h2>
                <p style={{ color: "#64748b", marginBottom: 30 }}>Resultados reales que hablan por nosotros</p>

                <div style={filtros}>
                    {["todos", "cocinas", "campanas", "equipos", "exteriores"].map(cat => (
                        <button key={cat} onClick={() => setFiltro(cat)} style={filtroBtn(filtro === cat)}>
                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </button>
                    ))}
                </div>

                <div style={gridTrabajos}>
                    {trabajos
                        .filter(t => filtro === "todos" || t.categoria === filtro)
                        .map(t => (
                            <div key={t.id} style={cardTrabajo}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 15 }}>
                                    <h3 style={{ margin: 0, fontSize: 18 }}>{t.titulo}</h3>
                                    <span style={tagCat}>{t.categoria}</span>
                                </div>
                                <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: "1.5", marginBottom: 15 }}>{t.descripcion}</p>
                                <AntesDespues antes={t.antes} despues={t.despues} />
                                {t.video && <video src={t.video} controls style={video} />}
                            </div>
                        ))}
                </div>
            </div>

            <a href="https://wa.me/5492236713970" target="_blank" rel="noreferrer" style={floating}>
                <svg viewBox="0 0 24 24" width="30" height="30" fill="white"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.181-2.587-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.756-1.158.793-.322.036-.71.056-1.127-.08-.242-.078-.544-.182-.931-.349-1.636-.704-2.704-2.368-2.786-2.478-.083-.109-.67-.891-.67-1.701 0-.811.424-1.21.574-1.372.15-.162.33-.203.44-.203.11 0 .22.001.314.004.106.004.248-.04.388.297.144.347.493 1.203.536 1.291.043.087.072.188.014.304-.058.116-.087.188-.173.289-.087.101-.183.226-.261.304-.087.087-.178.182-.077.356.101.174.449.741.964 1.201.662.591 1.221.774 1.394.861.174.087.275.072.376-.043.101-.116.434-.506.55-.68.116-.174.232-.145.39-.087.159.058 1.013.477 1.187.564.174.087.289.13.332.202.045.074.045.426-.099.831z" /></svg>
            </a>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap');
                * { box-sizing: border-box; }
                button { transition: all 0.3s ease; }
                button:hover { transform: translateY(-2px); filter: brightness(1.1); }
            `}</style>
        </div>
    );
}

// Componentes auxiliares
function Card({ titulo, texto, imgSrc }) {
    return (
        <div style={card}>
            <div style={cardImageContainer}>
                <img src={imgSrc} alt={titulo} style={cardServiceImg} />
                <div style={cardImageOverlay}></div>
            </div>
            <div style={{ position: "relative", zIndex: 1, padding: 25 }}>
                <div style={cardDot}></div>
                <h3 style={{ margin: "0 0 10px 0", fontSize: 20 }}>{titulo}</h3>
                <p style={{ margin: 0, color: "#94a3b8", fontSize: 15, lineHeight: "1.6" }}>{texto}</p>
            </div>
        </div>
    );
}

function AntesDespues({ antes, despues }) {
    const [pos, setPos] = React.useState(50);
    return (
        <div style={slider}>
            <img src={despues} style={imgFull} alt="Después" />
            <div style={{ ...imgFull, width: pos + "%", overflow: "hidden" }}>
                <img src={antes} style={{ ...imgFull }} alt="Antes" />
            </div>
            <div style={{ ...sliderDivider, left: pos + "%" }}></div>
            <input type="range" value={pos} onChange={e => setPos(e.target.value)} style={range} />
        </div>
    );
}

// ESTILOS
const app = { background: "#020617", color: "#f8fafc", fontFamily: "'Plus Jakarta Sans', sans-serif", minHeight: "100vh", paddingBottom: 100 };
const header = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 40px", maxWidth: 1300, margin: "auto", background: "rgba(15, 23, 42, 0.7)", backdropFilter: "blur(12px)", borderRadius: "0 0 24px 24px", position: "sticky", top: 0, zIndex: 100, border: "1px solid rgba(255,255,255,0.05)" };
const brand = { display: "flex", gap: 15, alignItems: "center" };
const brandText = { fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px" };
const socials = { display: "flex", gap: 20 };
const socialItem = { display: "flex", flexDirection: "column", alignItems: "center" };
const socialLink = { textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 };
const iconInsta = { width: 48, height: 48, borderRadius: 14, background: "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 15px rgba(220, 39, 67, 0.3)" };
const iconWapp = { width: 48, height: 48, borderRadius: 14, background: "#22c55e", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 15px rgba(34, 197, 94, 0.3)" };
const socialLabel = { fontSize: 11, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase" };
const hero = { textAlign: "center", marginTop: 80, padding: "0 20px" };
const heroBadge = { display: "inline-block", padding: "6px 16px", borderRadius: 100, background: "rgba(34,197,94,0.1)", color: "#22c55e", fontSize: 13, fontWeight: 700, marginBottom: 20, border: "1px solid rgba(34,197,94,0.2)" };
const title = { fontSize: "clamp(32px, 5vw, 64px)", fontWeight: 800, lineHeight: 1.1 };
const gradientText = { color: "#22c55e" };
const subtitle = { color: "#94a3b8", marginTop: 20, fontSize: 18, maxWidth: 600, marginInline: "auto" };
const cta = { marginTop: 35, padding: "18px 36px", borderRadius: 16, background: "#22c55e", border: "none", cursor: "pointer", color: "white", fontSize: 18, fontWeight: 800, boxShadow: "0 10px 30px rgba(34,197,94,0.4)" };
const grid = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 30, marginTop: 100, maxWidth: 1200, marginInline: "auto", padding: "0 20px" };
const card = { background: "#0f172a", borderRadius: 24, border: "1px solid rgba(255,255,255,0.05)", position: "relative", overflow: "hidden" };
const cardImageContainer = { width: "100%", height: 180, position: "relative", overflow: "hidden" };
const cardServiceImg = { width: "100%", height: "100%", objectFit: "cover" };
const cardImageOverlay = { position: "absolute", bottom: 0, left: 0, width: "100%", height: "60%", background: "linear-gradient(to top, #0f172a, transparent)" };
const cardDot = { width: 40, height: 4, background: "#22c55e", borderRadius: 2, marginBottom: 20 };
const trabajosBox = { marginTop: 120, maxWidth: 1200, marginInline: "auto", textAlign: "center", padding: "0 20px" };
const filtros = { display: "flex", justifyContent: "center", gap: 10, marginTop: 20, flexWrap: "wrap", background: "#0f172a", padding: 8, borderRadius: 100, width: "fit-content", marginInline: "auto", border: "1px solid rgba(255,255,255,0.05)" };
const filtroBtn = (active) => ({ padding: "10px 24px", borderRadius: 100, border: "none", background: active ? "#22c55e" : "transparent", color: active ? "#000" : "#94a3b8", cursor: "pointer", fontWeight: 700, fontSize: 14 });
const gridTrabajos = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))", gap: 25, marginTop: 40 };
const cardTrabajo = { background: "#0f172a", padding: 24, borderRadius: 24, textAlign: "left", border: "1px solid rgba(255,255,255,0.05)" };
const tagCat = { fontSize: 10, background: "rgba(255,255,255,0.05)", padding: "4px 8px", borderRadius: 6, textTransform: "uppercase", color: "#22c55e", fontWeight: 800 };
const slider = { position: "relative", height: 260, borderRadius: 16, overflow: "hidden", marginTop: 15 };
const sliderDivider = { position: "absolute", top: 0, bottom: 0, width: 4, background: "white", transform: "translateX(-50%)", zIndex: 5 };
const video = { width: "100%", borderRadius: 16, marginTop: 15, border: "1px solid rgba(255,255,255,0.1)" };
const imgFull = { position: "absolute", width: "100%", height: "100%", objectFit: "cover" };
const range = { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", cursor: "pointer", opacity: 0, zIndex: 10 };
const floating = { position: "fixed", bottom: 30, right: 30, background: "#22c55e", width: 65, height: 65, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", boxShadow: "0 10px 30px rgba(34,197,94,0.5)", zIndex: 1000, textDecoration: "none" };