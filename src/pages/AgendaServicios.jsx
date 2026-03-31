import { useEffect, useState } from "react";
import { listenServiciosProgramados } from "../services/serviciosService";
import dayjs from "dayjs";
import "dayjs/locale/es";

dayjs.locale("es");

export default function AgendaServicios({ onBack }) {

    const [servicios, setServicios] = useState([]);

    useEffect(() => {
        const unsub = listenServiciosProgramados(setServicios);
        return () => unsub();
    }, []);

    // ordenar por fecha + hora
    const ordenados = [...servicios].sort((a, b) => {

        const f1 = dayjs(`${a.fecha || ""} ${a.hora || "00:00"}`);
        const f2 = dayjs(`${b.fecha || ""} ${b.hora || "00:00"}`);

        return f1 - f2;

    });

    // agrupar por fecha
    const agrupados = ordenados.reduce((acc, s) => {

        const key = s.fecha || "sin_fecha";

        if (!acc[key]) acc[key] = [];

        acc[key].push(s);

        return acc;

    }, {});

    const abrirWhatsapp = (telefono) => {

        if (!telefono) return;

        let tel = telefono.replace(/\D/g, "");

        if (!tel.startsWith("54")) tel = "54" + tel;

        window.open(`https://wa.me/${tel}`, "_blank");

    };

    return (

        <div style={container}>

            <button onClick={onBack} style={btnVolver}>
                ← Volver
            </button>

            <h2 style={titulo}>Agenda de trabajos</h2>

            {Object.keys(agrupados).map((fecha) => (

                <div key={fecha} style={bloqueDia}>

                    <div style={fechaHeader}>
                        {fecha === "sin_fecha"
                            ? "Sin fecha"
                            : dayjs(fecha).format("dddd DD MMMM YYYY")}
                    </div>

                    {agrupados[fecha].map((s) => (

                        <div key={s.id} style={card}>

                            <div style={colHora}>

                                <div style={hora}>
                                    {s.hora || "--:--"}
                                </div>

                            </div>

                            <div style={colInfo}>

                                <div style={cliente}>
                                    {s.nombreCliente || "Cliente"}
                                </div>

                                <div style={direccion}>
                                    📍 {s.direccion || "-"}
                                </div>

                                <div style={telefono}>
                                    📞 {s.telefono || "-"}
                                </div>

                            </div>

                            <div style={colDerecha}>

                                <div style={importe}>
                                    {s.importe
                                        ? "$ " + Number(s.importe).toLocaleString("es-AR")
                                        : ""}
                                </div>

                                {s.telefono && (
                                    <button
                                        style={btnWhatsapp}
                                        onClick={() => abrirWhatsapp(s.telefono)}
                                    >
                                        WhatsApp
                                    </button>
                                )}

                            </div>

                        </div>

                    ))}

                </div>

            ))}

            {servicios.length === 0 && (
                <div style={sinDatos}>
                    No hay trabajos programados
                </div>
            )}

        </div>

    );

}

const container = {
    padding: 24,
    maxWidth: 1100,
    margin: "auto"
};

const titulo = {
    marginTop: 20,
    marginBottom: 20,
    color: "white"
};

const bloqueDia = {
    marginBottom: 35
};

const fechaHeader = {
    fontWeight: 700,
    fontSize: 18,
    textTransform: "capitalize",
    marginBottom: 10,
    color: "#00c27a"
};

const card = {
    display: "flex",
    gap: 15,
    background: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    alignItems: "center",
    flexWrap: "wrap",
    border: "1px solid #ddd"
};

const colHora = {
    minWidth: 80
};

const hora = {
    fontSize: 22,
    fontWeight: 700,
    color: "#111"
};

const colInfo = {
    flex: 1
};

const cliente = {
    fontWeight: 700,
    fontSize: 16
};

const direccion = {
    fontSize: 13,
    color: "#666"
};

const telefono = {
    fontSize: 13,
    color: "#666"
};

const colDerecha = {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 6
};

const importe = {
    fontWeight: 700,
    fontSize: 16,
    color: "#00a859"
};

const btnWhatsapp = {
    padding: "6px 10px",
    borderRadius: 8,
    border: 0,
    background: "#25D366",
    color: "white",
    cursor: "pointer",
    fontSize: 12
};

const btnVolver = {
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid #ddd",
    background: "white",
    cursor: "pointer"
};

const sinDatos = {
    marginTop: 20,
    color: "#aaa"
};