import { useEffect, useState } from "react";
import { listenServicios } from "../services/serviciosService";
import { listenClientes } from "../services/clientesService";
import dayjs from "dayjs";

export default function Agenda({ onBack }) {

    const [servicios, setServicios] = useState([]);
    const [clientes, setClientes] = useState([]);

    useEffect(() => {

        const u1 = listenServicios(setServicios);
        const u2 = listenClientes(setClientes);

        return () => {
            u1();
            u2();
        };

    }, []);

    const getCliente = (id) => clientes.find((c) => c.id === id);

    const serviciosOrdenados = [...servicios].sort((a, b) =>
        dayjs(a.fechaISO).diff(dayjs(b.fechaISO))
    );

    return (
        <div style={{ padding: 24 }}>

            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <button onClick={onBack} style={btnLight}>← Volver</button>
                <h2 style={{ margin: 0 }}>Agenda de Servicios</h2>
            </div>

            <div style={{ display: "grid", gap: 12 }}>

                {serviciosOrdenados.map((s) => {

                    const c = getCliente(s.clienteId);

                    return (
                        <div key={s.id} style={row}>

                            <div>

                                <div style={{ fontWeight: 700 }}>
                                    {c?.nombre || "Cliente"}
                                </div>

                                <div style={{ fontSize: 13, color: "#666" }}>
                                    {s.tipo}
                                </div>

                            </div>

                            <div style={{ fontWeight: 600 }}>
                                {dayjs(s.fechaISO).format("DD MMM YYYY")}
                            </div>

                        </div>
                    );
                })}

                {serviciosOrdenados.length === 0 && (
                    <div style={muted}>
                        No hay servicios cargados
                    </div>
                )}

            </div>

        </div>
    );
}

const row = {
    background: "white",
    border: "1px solid #eee",
    borderRadius: 16,
    padding: 14,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 8px 25px rgba(0,0,0,.05)"
};

const btnLight = {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #ddd",
    background: "white",
    cursor: "pointer"
};

const muted = {
    padding: 14,
    color: "#666",
    fontSize: 13
};