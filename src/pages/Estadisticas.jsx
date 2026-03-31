import { useEffect, useMemo, useRef, useState } from "react";
import { listenServicios } from "../services/serviciosService";
import { listenClientes } from "../services/clientesService";
import { db } from "../firebase/config";
import { collection, onSnapshot, doc, deleteDoc, updateDoc } from "firebase/firestore";
import dayjs from "dayjs";
import "dayjs/locale/es";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    Legend
} from "recharts";

dayjs.locale("es");

const CHART_COLORS = [
    "#00c27a",
    "#1890ff",
    "#ffb020",
    "#ff4d4f",
    "#7a5cff",
    "#14b8a6",
    "#f97316",
    "#e879f9"
];

export default function Estadisticas({ onBack }) {
    const [servicios, setServicios] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [gastos, setGastos] = useState([]);
    const [operarios, setOperarios] = useState([]);

    const [editando, setEditando] = useState(null);
    const [editData, setEditData] = useState({});

    const [mes, setMes] = useState(dayjs().format("YYYY-MM"));
    const [isMobile, setIsMobile] = useState(
        typeof window !== "undefined" ? window.innerWidth <= 768 : false
    );

    const [modoInforme, setModoInforme] = useState(false);

    const reporteRef = useRef(null);

    useEffect(() => {
        const u1 = listenServicios((data) => {
            const normalizados = (data || []).map((s) => ({
                ...s,
                servicios: Array.isArray(s.servicios)
                    ? s.servicios
                    : s.servicio
                        ? [s.servicio]
                        : []
            }));
            setServicios(normalizados);
        });

        const u2 = listenClientes(setClientes);

        const u3 = onSnapshot(collection(db, "gastos"), (snap) => {
            const arr = [];
            snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
            setGastos(arr);
        });

        const u4 = onSnapshot(collection(db, "operarios"), (snap) => {
            const arr = [];
            snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
            setOperarios(arr);
        });

        return () => {
            if (u1) u1();
            if (u2) u2();
            if (u3) u3();
            if (u4) u4();
        };
    }, []);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const formatMoney = (n) =>
        Number(n || 0).toLocaleString("es-AR", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });

    const formatPercent = (n) => {
        if (!Number.isFinite(n)) return "0%";
        const sign = n > 0 ? "+" : "";
        return `${sign}${n.toFixed(1)}%`;
    };

    const getClienteNombre = (id) =>
        clientes.find((c) => c.id === id)?.nombre || "Cliente";

    const getOperariosDetalle = (s) => {
        if (Array.isArray(s?.operariosDetalle) && s.operariosDetalle.length) {
            return s.operariosDetalle.map((o) => ({
                id: o.id,
                costo: Number(o.costo || 0)
            }));
        }

        if (Array.isArray(s?.operarios) && s.operarios.length) {
            const costoTotal = Number(s.costoOperario || 0);
            const costoPorOperario = s.operarios.length
                ? costoTotal / s.operarios.length
                : 0;

            return s.operarios.map((id) => ({
                id,
                costo: costoPorOperario
            }));
        }

        return [];
    };

    const getCosto = (s) => {
        const detalle = getOperariosDetalle(s);
        return detalle.reduce((acc, o) => acc + Number(o.costo || 0), 0);
    };

    const getNombresOperarios = (s) => {
        const detalle = getOperariosDetalle(s);

        if (!detalle.length) return "Sin asignar";

        return detalle
            .map((op) => operarios.find((o) => o.id === op.id)?.nombre)
            .filter(Boolean)
            .join(", ");
    };

    const serviciosMes = useMemo(() => {
        return servicios.filter((s) => {
            if (!s.fechaISO) return false;
            return dayjs(s.fechaISO).format("YYYY-MM") === mes;
        });
    }, [servicios, mes]);

    const mesAnterior = useMemo(() => {
        return dayjs(`${mes}-01`).subtract(1, "month").format("YYYY-MM");
    }, [mes]);

    const serviciosMesAnterior = useMemo(() => {
        return servicios.filter((s) => {
            if (!s.fechaISO) return false;
            return dayjs(s.fechaISO).format("YYYY-MM") === mesAnterior;
        });
    }, [servicios, mesAnterior]);

    const facturacionMes = useMemo(() => {
        return serviciosMes.reduce((acc, s) => acc + Number(s.importe || 0), 0);
    }, [serviciosMes]);

    const facturacionMesAnterior = useMemo(() => {
        return serviciosMesAnterior.reduce((acc, s) => acc + Number(s.importe || 0), 0);
    }, [serviciosMesAnterior]);

    const costoOperarios = useMemo(() => {
        return serviciosMes.reduce((acc, s) => acc + getCosto(s), 0);
    }, [serviciosMes]);

    const costoOperariosAnterior = useMemo(() => {
        return serviciosMesAnterior.reduce((acc, s) => acc + getCosto(s), 0);
    }, [serviciosMesAnterior]);

    const gastosMes = useMemo(() => {
        return gastos.reduce((acc, g) => {
            if (!g.fecha) return acc;
            if (dayjs(g.fecha).format("YYYY-MM") === mes) {
                return acc + Number(g.monto || 0);
            }
            return acc;
        }, 0);
    }, [gastos, mes]);

    const gastosMesAnterior = useMemo(() => {
        return gastos.reduce((acc, g) => {
            if (!g.fecha) return acc;
            if (dayjs(g.fecha).format("YYYY-MM") === mesAnterior) {
                return acc + Number(g.monto || 0);
            }
            return acc;
        }, 0);
    }, [gastos, mesAnterior]);

    const gananciaServicios = facturacionMes - costoOperarios;
    const gananciaFinal = gananciaServicios - gastosMes;

    const gananciaFinalAnterior =
        facturacionMesAnterior - costoOperariosAnterior - gastosMesAnterior;

    const cantidadServiciosMes = serviciosMes.length;
    const cantidadServiciosMesAnterior = serviciosMesAnterior.length;

    const ticketPromedio = cantidadServiciosMes ? facturacionMes / cantidadServiciosMes : 0;
    const ticketPromedioAnterior = cantidadServiciosMesAnterior
        ? facturacionMesAnterior / cantidadServiciosMesAnterior
        : 0;

    const variacion = (actual, anterior) => {
        if (!anterior && !actual) return 0;
        if (!anterior) return 100;
        return ((actual - anterior) / anterior) * 100;
    };

    const facturacionVar = variacion(facturacionMes, facturacionMesAnterior);
    const gananciaVar = variacion(gananciaFinal, gananciaFinalAnterior);
    const serviciosVar = variacion(cantidadServiciosMes, cantidadServiciosMesAnterior);
    const ticketVar = variacion(ticketPromedio, ticketPromedioAnterior);

    const rankingClientes = useMemo(() => {
        const map = {};
        serviciosMes.forEach((s) => {
            map[s.clienteId] = (map[s.clienteId] || 0) + Number(s.importe || 0);
        });

        return Object.entries(map)
            .map(([id, total]) => ({
                id,
                nombre: getClienteNombre(id),
                total
            }))
            .sort((a, b) => b.total - a.total);
    }, [serviciosMes, clientes]);

    const rankingOperarios = useMemo(() => {
        const map = {};

        serviciosMes.forEach((s) => {
            const ops = getOperariosDetalle(s);

            if (!ops.length) {
                const nombre = "Sin asignar";

                map[nombre] = {
                    nombre,
                    cantidad: (map[nombre]?.cantidad || 0) + 1,
                    facturacion: (map[nombre]?.facturacion || 0) + Number(s.importe || 0),
                    costo: (map[nombre]?.costo || 0) + 0
                };

                return;
            }

            const importe = Number(s.importe || 0);
            const parteImporte = ops.length ? importe / ops.length : 0;

            ops.forEach((op) => {
                const nombre =
                    operarios.find((o) => o.id === op.id)?.nombre || "Operario";

                map[nombre] = {
                    nombre,
                    cantidad: (map[nombre]?.cantidad || 0) + 1,
                    facturacion: (map[nombre]?.facturacion || 0) + parteImporte,
                    costo: (map[nombre]?.costo || 0) + Number(op.costo || 0)
                };
            });
        });

        return Object.values(map).sort((a, b) => b.facturacion - a.facturacion);
    }, [serviciosMes, operarios]);

    const ingresosPorServicio = useMemo(() => {
        const map = {};
        serviciosMes.forEach((s) => {
            const tipos = Array.isArray(s.servicios) && s.servicios.length
                ? s.servicios
                : ["Sin tipo"];

            tipos.forEach((tipo) => {
                map[tipo] = (map[tipo] || 0) + Number(s.importe || 0);
            });
        });

        return Object.entries(map)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [serviciosMes]);

    const cantidadPorServicio = useMemo(() => {
        const map = {};
        serviciosMes.forEach((s) => {
            const tipos = Array.isArray(s.servicios) && s.servicios.length
                ? s.servicios
                : ["Sin tipo"];

            tipos.forEach((tipo) => {
                map[tipo] = (map[tipo] || 0) + 1;
            });
        });

        return Object.entries(map)
            .map(([name, cantidad]) => ({ name, cantidad }))
            .sort((a, b) => b.cantidad - a.cantidad);
    }, [serviciosMes]);

    const facturacionPorMes = useMemo(() => {
        const map = {};
        servicios.forEach((s) => {
            if (!s.fechaISO) return;
            const m = dayjs(s.fechaISO).format("YYYY-MM");
            map[m] = (map[m] || 0) + Number(s.importe || 0);
        });

        return Object.entries(map)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .slice(-12)
            .map(([m, total]) => ({
                mes: m,
                label: dayjs(`${m}-01`).format("MMM YY"),
                total
            }));
    }, [servicios]);

    const comparativoMes = useMemo(() => {
        return [
            {
                name: "Mes actual",
                Facturación: facturacionMes,
                "Costo operarios": costoOperarios,
                "Gastos empresa": gastosMes,
                Ganancia: gananciaFinal
            }
        ];
    }, [facturacionMes, costoOperarios, gastosMes, gananciaFinal]);

    const diasConMasFacturacion = useMemo(() => {
        const map = {};
        serviciosMes.forEach((s) => {
            if (!s.fechaISO) return;
            const d = dayjs(s.fechaISO).format("YYYY-MM-DD");
            map[d] = (map[d] || 0) + Number(s.importe || 0);
        });

        return Object.entries(map)
            .map(([fecha, total]) => ({ fecha, total }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 5);
    }, [serviciosMes]);

    const alertas = useMemo(() => {
        const arr = [];

        if (facturacionVar > 0) {
            arr.push(`📈 La facturación subió ${formatPercent(facturacionVar)} vs el mes anterior.`);
        } else if (facturacionVar < 0) {
            arr.push(`⚠️ La facturación bajó ${formatPercent(facturacionVar)} vs el mes anterior.`);
        }

        if (gananciaVar > 0) {
            arr.push(`💸 La ganancia mejoró ${formatPercent(gananciaVar)}.`);
        } else if (gananciaVar < 0) {
            arr.push(`🔎 La ganancia cayó ${formatPercent(gananciaVar)}.`);
        }

        if (cantidadServiciosMes >= 10) {
            arr.push(`🔥 Se realizaron ${cantidadServiciosMes} servicios en el mes.`);
        }

        if (gastosMes > facturacionMes * 0.35 && facturacionMes > 0) {
            arr.push("🚨 Los gastos de empresa están altos respecto a la facturación.");
        }

        if (!arr.length) {
            arr.push("✅ Mes estable, sin alertas destacadas.");
        }

        return arr;
    }, [facturacionVar, gananciaVar, cantidadServiciosMes, gastosMes, facturacionMes]);

    const iniciarEdicion = (s) => {
        setEditando(s.id);
        setEditData({
            fechaISO: s.fechaISO || "",
            importe: s.importe || 0,
            operariosDetalle: getOperariosDetalle(s)
        });
    };

    const guardarEdicion = async () => {
        if (!editando) return;

        await updateDoc(doc(db, "servicios", editando), {
            fechaISO: editData.fechaISO,
            importe: Number(editData.importe || 0),
            operariosDetalle: (editData.operariosDetalle || []).map((o) => ({
                id: o.id,
                costo: Number(o.costo || 0)
            }))
        });

        setEditando(null);
        setEditData({});
    };

    const borrarServicio = async (id) => {
        if (!window.confirm("¿Seguro borrar este servicio?")) return;
        await deleteDoc(doc(db, "servicios", id));
    };

    const exportarPDF = async () => {
        try {
            const original = modoInforme;
            if (!modoInforme) setModoInforme(true);

            await new Promise((resolve) => setTimeout(resolve, 350));

            const element = reporteRef.current;
            if (!element) return;

            const canvas = await html2canvas(element, {
                scale: 2,
                backgroundColor: "#0b1016",
                useCORS: true
            });

            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF("p", "mm", "a4");

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            const imgWidth = pdfWidth - 12;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            let heightLeft = imgHeight;
            let position = 6;

            pdf.addImage(imgData, "PNG", 6, position, imgWidth, imgHeight);
            heightLeft -= pdfHeight - 12;

            while (heightLeft > 0) {
                position = heightLeft - imgHeight + 6;
                pdf.addPage();
                pdf.addImage(imgData, "PNG", 6, position, imgWidth, imgHeight);
                heightLeft -= pdfHeight - 12;
            }

            pdf.save(`balance-${mes}.pdf`);

            if (!original) {
                setModoInforme(false);
            }
        } catch (error) {
            console.error("Error exportando PDF:", error);
            alert("No se pudo generar el PDF.");
        }
    };

    return (
        <div style={container}>
            {!modoInforme && (
                <div style={topBar}>
                    <button onClick={onBack} style={btnLight}>← Volver</button>

                    <div style={topActions}>
                        <button
                            onClick={() => setModoInforme((v) => !v)}
                            style={btnSecondary}
                        >
                            {modoInforme ? "Salir informe" : "Modo informe"}
                        </button>

                        <button onClick={exportarPDF} style={btnPrimary}>
                            Exportar balance PDF
                        </button>
                    </div>
                </div>
            )}

            <div ref={reporteRef} style={modoInforme ? reportWrapper : undefined}>
                <div style={headerCard}>
                    <div>
                        <div style={brand}>BRILLO URBANO</div>
                        <h2 style={title}>Dashboard financiero</h2>
                        <div style={subtitle}>
                            Balance mensual · {dayjs(`${mes}-01`).format("MMMM YYYY")}
                        </div>
                    </div>

                    <div style={isMobile ? mesBoxMobile : mesBox}>
                        <span style={mesLabel}>Mes</span>
                        <input
                            type="month"
                            value={mes}
                            onChange={(e) => setMes(e.target.value)}
                            style={mesInput}
                        />
                    </div>
                </div>

                <div style={alertsWrap}>
                    {alertas.map((a, i) => (
                        <div key={i} style={alertItem}>{a}</div>
                    ))}
                </div>

                <div style={kpiGrid}>
                    <KpiCard
                        title="Facturación"
                        value={`$ ${formatMoney(facturacionMes)}`}
                        subtitle={`${cantidadServiciosMes} servicios en el mes`}
                        change={formatPercent(facturacionVar)}
                        positive={facturacionVar >= 0}
                    />
                    <KpiCard
                        title="Ganancia real"
                        value={`$ ${formatMoney(gananciaFinal)}`}
                        subtitle="Facturación - operarios - gastos"
                        change={formatPercent(gananciaVar)}
                        positive={gananciaVar >= 0}
                    />
                    <KpiCard
                        title="Ticket promedio"
                        value={`$ ${formatMoney(ticketPromedio)}`}
                        subtitle="Promedio por servicio"
                        change={formatPercent(ticketVar)}
                        positive={ticketVar >= 0}
                    />
                    <KpiCard
                        title="Costo operarios"
                        value={`$ ${formatMoney(costoOperarios)}`}
                        subtitle="Costo total del mes"
                    />
                    <KpiCard
                        title="Gastos empresa"
                        value={`$ ${formatMoney(gastosMes)}`}
                        subtitle="Gastos fijos / variables"
                    />
                    <KpiCard
                        title="Servicios realizados"
                        value={String(cantidadServiciosMes)}
                        subtitle="Cantidad total"
                        change={formatPercent(serviciosVar)}
                        positive={serviciosVar >= 0}
                    />
                </div>

                <div style={chartGrid}>
                    <Panel title="Facturación últimos 12 meses" subtitle="Evolución mensual de ingresos">
                        <div style={chartBox}>
                            <ResponsiveContainer width="100%" height={280}>
                                <LineChart data={facturacionPorMes}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#253142" />
                                    <XAxis dataKey="label" stroke="#a9b4c0" />
                                    <YAxis stroke="#a9b4c0" />
                                    <Tooltip
                                        formatter={(value) => [`$ ${formatMoney(value)}`, "Facturación"]}
                                        contentStyle={{
                                            background: "#10161f",
                                            border: "1px solid #223041",
                                            borderRadius: 12,
                                            color: "#fff"
                                        }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="total"
                                        stroke="#00c27a"
                                        strokeWidth={3}
                                        dot={{ r: 4 }}
                                        activeDot={{ r: 6 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </Panel>

                    <Panel title="Ingresos por tipo de servicio" subtitle="Qué trabajo te deja más dinero">
                        <div style={chartBox}>
                            <ResponsiveContainer width="100%" height={280}>
                                <PieChart>
                                    <Pie
                                        data={ingresosPorServicio}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={95}
                                        label={({ name }) => name}
                                    >
                                        {ingresosPorServicio.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={CHART_COLORS[index % CHART_COLORS.length]}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value) => `$ ${formatMoney(value)}`}
                                        contentStyle={{
                                            background: "#10161f",
                                            border: "1px solid #223041",
                                            borderRadius: 12,
                                            color: "#fff"
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        <div style={legendList}>
                            {ingresosPorServicio.map((item, index) => (
                                <div key={item.name} style={legendItem}>
                                    <span
                                        style={{
                                            ...legendDot,
                                            background: CHART_COLORS[index % CHART_COLORS.length]
                                        }}
                                    />
                                    <span style={{ flex: 1 }}>{item.name}</span>
                                    <strong>$ {formatMoney(item.value)}</strong>
                                </div>
                            ))}
                        </div>
                    </Panel>

                    <Panel title="Facturación vs costos vs ganancia" subtitle="Resumen contable del mes">
                        <div style={chartBox}>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={comparativoMes}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#253142" />
                                    <XAxis dataKey="name" stroke="#a9b4c0" />
                                    <YAxis stroke="#a9b4c0" />
                                    <Tooltip
                                        formatter={(value) => `$ ${formatMoney(value)}`}
                                        contentStyle={{
                                            background: "#10161f",
                                            border: "1px solid #223041",
                                            borderRadius: 12,
                                            color: "#fff"
                                        }}
                                    />
                                    <Legend />
                                    <Bar dataKey="Facturación" fill="#00c27a" radius={[8, 8, 0, 0]} />
                                    <Bar dataKey="Costo operarios" fill="#1890ff" radius={[8, 8, 0, 0]} />
                                    <Bar dataKey="Gastos empresa" fill="#ffb020" radius={[8, 8, 0, 0]} />
                                    <Bar dataKey="Ganancia" fill="#7a5cff" radius={[8, 8, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Panel>

                    <Panel title="Servicios por tipo" subtitle="Cantidad de trabajos realizados">
                        <div style={miniList}>
                            {cantidadPorServicio.length ? (
                                cantidadPorServicio.map((item, index) => (
                                    <div key={item.name} style={miniRow}>
                                        <div style={miniLeft}>
                                            <span
                                                style={{
                                                    ...miniBadge,
                                                    background: CHART_COLORS[index % CHART_COLORS.length]
                                                }}
                                            />
                                            <span>{item.name}</span>
                                        </div>
                                        <strong>{item.cantidad}</strong>
                                    </div>
                                ))
                            ) : (
                                <EmptyText />
                            )}
                        </div>
                    </Panel>

                    <Panel title="Ranking clientes" subtitle="Clientes que más facturaron en el mes">
                        <div style={miniList}>
                            {rankingClientes.length ? (
                                rankingClientes.map((c, i) => (
                                    <div key={c.id || i} style={miniRow}>
                                        <div style={miniLeft}>
                                            <span style={rankNumber}>{i + 1}</span>
                                            <span>{c.nombre}</span>
                                        </div>
                                        <strong>$ {formatMoney(c.total)}</strong>
                                    </div>
                                ))
                            ) : (
                                <EmptyText />
                            )}
                        </div>
                    </Panel>

                    <Panel title="Rendimiento por operario" subtitle="Facturación y cantidad de trabajos">
                        <div style={miniList}>
                            {rankingOperarios.length ? (
                                rankingOperarios.map((o, i) => (
                                    <div key={`${o.nombre}-${i}`} style={operarioCard}>
                                        <div style={operarioTop}>
                                            <strong>{o.nombre}</strong>
                                            <span style={operarioChip}>{o.cantidad} servicios</span>
                                        </div>
                                        <div style={operarioNumbers}>
                                            <span>Facturación: <strong>$ {formatMoney(o.facturacion)}</strong></span>
                                            <span>Costo: <strong>$ {formatMoney(o.costo)}</strong></span>
                                            <span>Margen: <strong>$ {formatMoney(o.facturacion - o.costo)}</strong></span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <EmptyText />
                            )}
                        </div>
                    </Panel>

                    <Panel title="Días más fuertes del mes" subtitle="Top jornadas por facturación">
                        <div style={miniList}>
                            {diasConMasFacturacion.length ? (
                                diasConMasFacturacion.map((d) => (
                                    <div key={d.fecha} style={miniRow}>
                                        <span>{dayjs(d.fecha).format("DD/MM/YYYY")}</span>
                                        <strong>$ {formatMoney(d.total)}</strong>
                                    </div>
                                ))
                            ) : (
                                <EmptyText />
                            )}
                        </div>
                    </Panel>
                </div>

                <Panel title="Balance mensual" subtitle="Resumen listo para impresión o PDF">
                    <div style={balanceBox}>
                        <div style={balanceRow}>
                            <span>Facturación total</span>
                            <strong>$ {formatMoney(facturacionMes)}</strong>
                        </div>
                        <div style={balanceRow}>
                            <span>Costo operarios</span>
                            <strong>$ {formatMoney(costoOperarios)}</strong>
                        </div>
                        <div style={balanceRow}>
                            <span>Gastos empresa</span>
                            <strong>$ {formatMoney(gastosMes)}</strong>
                        </div>
                        <div style={{ ...balanceRow, ...balanceFinal }}>
                            <span>GANANCIA REAL</span>
                            <strong>$ {formatMoney(gananciaFinal)}</strong>
                        </div>
                    </div>
                </Panel>

                <Panel title="Servicios del mes" subtitle="Detalle operativo del período">
                    {!serviciosMes.length ? (
                        <EmptyText />
                    ) : isMobile ? (
                        <div style={cardsWrap}>
                            {serviciosMes.map((s) => {
                                const cliente = getClienteNombre(s.clienteId);
                                const costo = getCosto(s);
                                const saldo = Number(s.importe || 0) - costo;
                                const nombresOperarios = getNombresOperarios(s);
                                const detalleOperarios = getOperariosDetalle(s);

                                return (
                                    <div key={s.id} style={mobileServiceCard}>
                                        {editando === s.id ? (
                                            <div style={editMobileWrap}>
                                                <label style={editLabel}>
                                                    Fecha
                                                    <input
                                                        type="date"
                                                        value={editData.fechaISO}
                                                        onChange={(e) =>
                                                            setEditData({ ...editData, fechaISO: e.target.value })
                                                        }
                                                        style={editInput}
                                                    />
                                                </label>

                                                <label style={editLabel}>
                                                    Importe
                                                    <input
                                                        type="number"
                                                        value={editData.importe}
                                                        onChange={(e) =>
                                                            setEditData({ ...editData, importe: e.target.value })
                                                        }
                                                        style={editInput}
                                                    />
                                                </label>

                                                <label style={editLabel}>
                                                    Operarios
                                                    <div style={{ display: "grid", gap: 8 }}>
                                                        {operarios.map((o) => {
                                                            const existente = editData.operariosDetalle?.find(
                                                                (x) => x.id === o.id
                                                            );

                                                            return (
                                                                <div
                                                                    key={o.id}
                                                                    style={{
                                                                        display: "grid",
                                                                        gridTemplateColumns: "auto 1fr 110px",
                                                                        gap: 8,
                                                                        alignItems: "center"
                                                                    }}
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={!!existente}
                                                                        onChange={() => {
                                                                            const existe = !!existente;

                                                                            setEditData((prev) => ({
                                                                                ...prev,
                                                                                operariosDetalle: existe
                                                                                    ? (prev.operariosDetalle || []).filter(
                                                                                        (x) => x.id !== o.id
                                                                                    )
                                                                                    : [
                                                                                        ...(prev.operariosDetalle || []),
                                                                                        { id: o.id, costo: 0 }
                                                                                    ]
                                                                            }));
                                                                        }}
                                                                    />

                                                                    <span>{o.nombre}</span>

                                                                    <input
                                                                        type="number"
                                                                        placeholder="Costo"
                                                                        disabled={!existente}
                                                                        value={existente ? existente.costo : ""}
                                                                        onChange={(e) => {
                                                                            const val = Number(e.target.value || 0);

                                                                            setEditData((prev) => ({
                                                                                ...prev,
                                                                                operariosDetalle: (prev.operariosDetalle || []).map(
                                                                                    (x) =>
                                                                                        x.id === o.id
                                                                                            ? { ...x, costo: val }
                                                                                            : x
                                                                                )
                                                                            }));
                                                                        }}
                                                                        style={{
                                                                            ...editInput,
                                                                            opacity: existente ? 1 : 0.45
                                                                        }}
                                                                    />
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </label>

                                                {!!editData.operariosDetalle?.length && (
                                                    <div style={resumenCostosBox}>
                                                        <div style={resumenCostosTitle}>Detalle de pago</div>
                                                        {editData.operariosDetalle.map((op) => {
                                                            const nombre =
                                                                operarios.find((o) => o.id === op.id)?.nombre || "Operario";
                                                            return (
                                                                <div key={op.id} style={resumenCostoRow}>
                                                                    <span>{nombre}</span>
                                                                    <strong>$ {formatMoney(op.costo)}</strong>
                                                                </div>
                                                            );
                                                        })}
                                                        <div style={{ ...resumenCostoRow, ...resumenCostoTotal }}>
                                                            <span>Total operarios</span>
                                                            <strong>
                                                                $ {formatMoney(
                                                                    (editData.operariosDetalle || []).reduce(
                                                                        (acc, op) => acc + Number(op.costo || 0),
                                                                        0
                                                                    )
                                                                )}
                                                            </strong>
                                                        </div>
                                                    </div>
                                                )}

                                                <div style={mobileButtons}>
                                                    <button style={btnSave} onClick={guardarEdicion}>
                                                        Guardar
                                                    </button>
                                                    <button
                                                        style={btnGhost}
                                                        onClick={() => {
                                                            setEditando(null);
                                                            setEditData({});
                                                        }}
                                                    >
                                                        Cancelar
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div style={mobileCardHeader}>
                                                    <strong style={{ fontSize: 16 }}>{cliente}</strong>
                                                    <span style={statusChip}>Saldo $ {formatMoney(saldo)}</span>
                                                </div>

                                                <div style={mobileDato}>
                                                    <strong>Fecha:</strong> {dayjs(s.fechaISO).format("DD/MM/YYYY")}
                                                </div>
                                                <div style={mobileDato}>
                                                    <strong>Servicio:</strong> {s.servicios?.join(", ") || "Sin tipo"}
                                                </div>
                                                <div style={mobileDato}>
                                                    <strong>Monto:</strong> $ {formatMoney(s.importe)}
                                                </div>
                                                <div style={mobileDato}>
                                                    <strong>Costo:</strong> $ {formatMoney(costo)}
                                                </div>
                                                <div style={mobileDato}>
                                                    <strong>Operarios:</strong> {nombresOperarios}
                                                </div>

                                                {!!detalleOperarios.length && (
                                                    <div style={detalleOperariosWrap}>
                                                        {detalleOperarios.map((op) => {
                                                            const nombre =
                                                                operarios.find((o) => o.id === op.id)?.nombre || "Operario";
                                                            return (
                                                                <div key={op.id} style={detalleOperarioRow}>
                                                                    <span>{nombre}</span>
                                                                    <strong>$ {formatMoney(op.costo)}</strong>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}

                                                {!modoInforme && (
                                                    <div style={mobileButtons}>
                                                        <button
                                                            style={btnEdit}
                                                            onClick={() => iniciarEdicion(s)}
                                                        >
                                                            Editar
                                                        </button>
                                                        <button
                                                            style={btnDelete}
                                                            onClick={() => borrarServicio(s.id)}
                                                        >
                                                            Borrar
                                                        </button>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div style={tableWrapper}>
                            <div style={tableHeader}>
                                <span>Cliente</span>
                                <span>Fecha</span>
                                <span>Servicio</span>
                                <span>Monto</span>
                                <span>Operarios</span>
                                <span>Costo</span>
                                <span>Saldo</span>
                                {!modoInforme && <span>Acciones</span>}
                            </div>

                            {serviciosMes.map((s) => {
                                const cliente = getClienteNombre(s.clienteId);
                                const costo = getCosto(s);
                                const saldo = Number(s.importe || 0) - costo;
                                const nombresOperarios = getNombresOperarios(s);
                                const detalleOperarios = getOperariosDetalle(s);

                                if (editando === s.id) {
                                    return (
                                        <div key={s.id} style={editRowDesktop}>
                                            <label style={editLabelDesktop}>
                                                Fecha
                                                <input
                                                    type="date"
                                                    value={editData.fechaISO}
                                                    onChange={(e) =>
                                                        setEditData({ ...editData, fechaISO: e.target.value })
                                                    }
                                                    style={editInputDesktop}
                                                />
                                            </label>

                                            <label style={editLabelDesktop}>
                                                Importe
                                                <input
                                                    type="number"
                                                    value={editData.importe}
                                                    onChange={(e) =>
                                                        setEditData({ ...editData, importe: e.target.value })
                                                    }
                                                    style={editInputDesktop}
                                                />
                                            </label>

                                            <label style={editLabelDesktop}>
                                                Operarios
                                                <div
                                                    style={{
                                                        display: "grid",
                                                        gap: 8,
                                                        maxHeight: 240,
                                                        overflowY: "auto",
                                                        padding: 10,
                                                        borderRadius: 10,
                                                        border: "1px solid #253445",
                                                        background: "#0b1016"
                                                    }}
                                                >
                                                    {operarios.map((o) => {
                                                        const existente = editData.operariosDetalle?.find(
                                                            (x) => x.id === o.id
                                                        );

                                                        return (
                                                            <div
                                                                key={o.id}
                                                                style={{
                                                                    display: "grid",
                                                                    gridTemplateColumns: "auto 1fr 110px",
                                                                    gap: 8,
                                                                    alignItems: "center",
                                                                    color: "#fff",
                                                                    fontSize: 13
                                                                }}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={!!existente}
                                                                    onChange={() => {
                                                                        const existe = !!existente;

                                                                        setEditData((prev) => ({
                                                                            ...prev,
                                                                            operariosDetalle: existe
                                                                                ? (prev.operariosDetalle || []).filter(
                                                                                    (x) => x.id !== o.id
                                                                                )
                                                                                : [
                                                                                    ...(prev.operariosDetalle || []),
                                                                                    { id: o.id, costo: 0 }
                                                                                ]
                                                                        }));
                                                                    }}
                                                                />

                                                                <span>{o.nombre}</span>

                                                                <input
                                                                    type="number"
                                                                    placeholder="Costo"
                                                                    disabled={!existente}
                                                                    value={existente ? existente.costo : ""}
                                                                    onChange={(e) => {
                                                                        const val = Number(e.target.value || 0);

                                                                        setEditData((prev) => ({
                                                                            ...prev,
                                                                            operariosDetalle: (prev.operariosDetalle || []).map(
                                                                                (x) =>
                                                                                    x.id === o.id
                                                                                        ? { ...x, costo: val }
                                                                                        : x
                                                                            )
                                                                        }));
                                                                    }}
                                                                    style={{
                                                                        ...editInputDesktop,
                                                                        opacity: existente ? 1 : 0.45
                                                                    }}
                                                                />
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </label>

                                            <div style={resumenDesktopBox}>
                                                <div style={resumenCostosTitle}>Resumen</div>

                                                {(editData.operariosDetalle || []).length ? (
                                                    <>
                                                        {(editData.operariosDetalle || []).map((op) => {
                                                            const nombre =
                                                                operarios.find((o) => o.id === op.id)?.nombre || "Operario";
                                                            return (
                                                                <div key={op.id} style={resumenCostoRow}>
                                                                    <span>{nombre}</span>
                                                                    <strong>$ {formatMoney(op.costo)}</strong>
                                                                </div>
                                                            );
                                                        })}

                                                        <div style={{ ...resumenCostoRow, ...resumenCostoTotal }}>
                                                            <span>Total</span>
                                                            <strong>
                                                                $ {formatMoney(
                                                                    (editData.operariosDetalle || []).reduce(
                                                                        (acc, op) => acc + Number(op.costo || 0),
                                                                        0
                                                                    )
                                                                )}
                                                            </strong>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div style={{ color: "#9fb0c0", fontSize: 13 }}>
                                                        No hay operarios seleccionados.
                                                    </div>
                                                )}
                                            </div>

                                            <div style={{ display: "flex", gap: 10, alignItems: "flex-start", paddingTop: 20 }}>
                                                <button style={btnSave} onClick={guardarEdicion}>
                                                    Guardar
                                                </button>
                                                <button
                                                    style={btnGhost}
                                                    onClick={() => {
                                                        setEditando(null);
                                                        setEditData({});
                                                    }}
                                                >
                                                    Cancelar
                                                </button>
                                            </div>
                                        </div>
                                    );
                                }

                                return (
                                    <div key={s.id} style={tableRow}>
                                        <span>{cliente}</span>
                                        <span>{dayjs(s.fechaISO).format("DD/MM/YYYY")}</span>
                                        <span>{s.servicios?.join(", ") || "Sin tipo"}</span>
                                        <span>$ {formatMoney(s.importe)}</span>

                                        <div style={{ display: "grid", gap: 4 }}>
                                            <span>{nombresOperarios}</span>
                                            {!!detalleOperarios.length && (
                                                <div style={detalleOperariosDesktop}>
                                                    {detalleOperarios.map((op) => {
                                                        const nombre =
                                                            operarios.find((o) => o.id === op.id)?.nombre || "Operario";
                                                        return (
                                                            <div key={op.id} style={detalleOperarioChip}>
                                                                {nombre}: $ {formatMoney(op.costo)}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>

                                        <span>$ {formatMoney(costo)}</span>

                                        <span style={{ color: "#00d084", fontWeight: 700 }}>
                                            $ {formatMoney(saldo)}
                                        </span>

                                        {!modoInforme && (
                                            <div style={tableActions}>
                                                <button
                                                    style={btnEdit}
                                                    onClick={() => iniciarEdicion(s)}
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    style={btnDelete}
                                                    onClick={() => borrarServicio(s.id)}
                                                >
                                                    Borrar
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </Panel>
            </div>
        </div>
    );
}

function KpiCard({ title, value, subtitle, change, positive }) {
    return (
        <div style={kpiCard}>
            <div style={kpiTitle}>{title}</div>
            <div style={kpiValue}>{value}</div>
            <div style={kpiFooter}>
                <span style={kpiSubtitle}>{subtitle}</span>
                {change ? (
                    <span
                        style={{
                            ...kpiChange,
                            color: positive ? "#00d084" : "#ff6b6b",
                            background: positive
                                ? "rgba(0,208,132,0.12)"
                                : "rgba(255,107,107,0.12)"
                        }}
                    >
                        {positive ? "▲" : "▼"} {change.replace("-", "")}
                    </span>
                ) : null}
            </div>
        </div>
    );
}

function Panel({ title, subtitle, children }) {
    return (
        <div style={panel}>
            <div style={panelHeader}>
                <div>
                    <div style={panelTitle}>{title}</div>
                    {subtitle ? <div style={panelSubtitle}>{subtitle}</div> : null}
                </div>
            </div>
            {children}
        </div>
    );
}

function EmptyText() {
    return (
        <div style={emptyText}>
            No hay datos para mostrar en este período.
        </div>
    );
}

/* ====================== */
/* ESTILOS */
/* ====================== */

const container = {
    padding: 20,
    maxWidth: 1380,
    margin: "0 auto",
    width: "100%",
    boxSizing: "border-box",
    background: "#0b1016",
    minHeight: "100vh"
};

const reportWrapper = {
    background: "#0b1016",
    padding: 4
};

const topBar = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 18
};

const topActions = {
    display: "flex",
    gap: 10,
    flexWrap: "wrap"
};

const headerCard = {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "center",
    flexWrap: "wrap",
    padding: 22,
    borderRadius: 22,
    background: "linear-gradient(135deg, #121a24 0%, #182534 100%)",
    border: "1px solid #223041",
    marginBottom: 18,
    boxShadow: "0 10px 30px rgba(0,0,0,0.25)"
};

const brand = {
    color: "#00c27a",
    fontWeight: 800,
    letterSpacing: 1.2,
    fontSize: 13
};

const title = {
    margin: "8px 0 4px 0",
    color: "#fff",
    fontSize: 30
};

const subtitle = {
    color: "#a9b4c0",
    fontSize: 14,
    textTransform: "capitalize"
};

const mesBox = {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap"
};

const mesBoxMobile = {
    display: "grid",
    gap: 8,
    width: "100%"
};

const mesLabel = {
    color: "#fff",
    fontWeight: 700
};

const mesInput = {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #314155",
    background: "#0f151d",
    color: "#fff",
    outline: "none"
};

const alertsWrap = {
    display: "grid",
    gap: 10,
    marginBottom: 18
};

const alertItem = {
    background: "#121a24",
    border: "1px solid #223041",
    borderRadius: 14,
    padding: "12px 14px",
    color: "#dfe7ef",
    fontSize: 14
};

const kpiGrid = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 16,
    marginBottom: 18
};

const kpiCard = {
    background: "linear-gradient(180deg, #131b25 0%, #10161f 100%)",
    border: "1px solid #223041",
    borderRadius: 20,
    padding: 18,
    boxShadow: "0 10px 25px rgba(0,0,0,0.18)"
};

const kpiTitle = {
    color: "#91a0b2",
    fontSize: 13,
    marginBottom: 10,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.6
};

const kpiValue = {
    color: "#fff",
    fontSize: 28,
    fontWeight: 800,
    lineHeight: 1.1,
    wordBreak: "break-word"
};

const kpiFooter = {
    marginTop: 12,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap"
};

const kpiSubtitle = {
    color: "#aab6c3",
    fontSize: 13
};

const kpiChange = {
    padding: "6px 10px",
    borderRadius: 999,
    fontWeight: 700,
    fontSize: 12
};

const chartGrid = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: 16,
    marginBottom: 18
};

const panel = {
    background: "linear-gradient(180deg, #131b25 0%, #10161f 100%)",
    border: "1px solid #223041",
    borderRadius: 22,
    padding: 18,
    boxShadow: "0 10px 25px rgba(0,0,0,0.18)"
};

const panelHeader = {
    marginBottom: 14
};

const panelTitle = {
    color: "#fff",
    fontSize: 18,
    fontWeight: 800
};

const panelSubtitle = {
    color: "#91a0b2",
    fontSize: 13,
    marginTop: 4
};

const chartBox = {
    width: "100%",
    minHeight: 280
};

const legendList = {
    display: "grid",
    gap: 8,
    marginTop: 12
};

const legendItem = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    color: "#dfe7ef",
    fontSize: 14
};

const legendDot = {
    width: 12,
    height: 12,
    borderRadius: 999
};

const miniList = {
    display: "grid",
    gap: 10
};

const miniRow = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    padding: "12px 14px",
    borderRadius: 14,
    background: "#0e141c",
    border: "1px solid #1d2a38",
    color: "#fff"
};

const miniLeft = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    minWidth: 0
};

const miniBadge = {
    width: 10,
    height: 10,
    borderRadius: 999
};

const rankNumber = {
    width: 28,
    height: 28,
    borderRadius: 999,
    background: "#182534",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    color: "#fff",
    flexShrink: 0
};

const operarioCard = {
    padding: 14,
    borderRadius: 16,
    background: "#0e141c",
    border: "1px solid #1d2a38",
    color: "#fff"
};

const operarioTop = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 10
};

const operarioChip = {
    padding: "6px 10px",
    borderRadius: 999,
    background: "#16202c",
    color: "#b8c4d1",
    fontSize: 12,
    fontWeight: 700
};

const operarioNumbers = {
    display: "grid",
    gap: 6,
    color: "#d8e0e8",
    fontSize: 14
};

const balanceBox = {
    display: "grid",
    gap: 12
};

const balanceRow = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    padding: "14px 16px",
    borderRadius: 14,
    background: "#0e141c",
    border: "1px solid #1d2a38",
    color: "#fff"
};

const balanceFinal = {
    background: "linear-gradient(135deg, rgba(0,194,122,0.14), rgba(24,144,255,0.12))",
    border: "1px solid #1e6f57",
    fontWeight: 800
};

const tableWrapper = {
    width: "100%",
    overflowX: "auto"
};

const tableHeader = {
    display: "grid",
    gridTemplateColumns: "1.5fr 1fr 1.8fr 1fr 2fr 1fr 1fr 170px",
    gap: 10,
    padding: "12px 14px",
    color: "#8dcfff",
    borderBottom: "1px solid #223041",
    fontWeight: 800,
    minWidth: 1180
};

const tableRow = {
    display: "grid",
    gridTemplateColumns: "1.5fr 1fr 1.8fr 1fr 2fr 1fr 1fr 170px",
    gap: 10,
    padding: "14px",
    color: "#fff",
    borderBottom: "1px solid #1a2633",
    alignItems: "center",
    minWidth: 1180
};

const tableActions = {
    display: "flex",
    gap: 8,
    flexWrap: "wrap"
};

const editRowDesktop = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 2.2fr 1.1fr auto",
    gap: 14,
    padding: 16,
    borderBottom: "1px solid #1a2633",
    background: "#0e141c",
    minWidth: 1180
};

const editLabelDesktop = {
    display: "grid",
    gap: 6,
    color: "#dfe7ef",
    fontSize: 13
};

const cardsWrap = {
    display: "grid",
    gap: 12
};

const mobileServiceCard = {
    background: "#0e141c",
    border: "1px solid #1d2a38",
    borderRadius: 18,
    padding: 14,
    color: "#fff"
};

const mobileCardHeader = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 10
};

const statusChip = {
    background: "rgba(0,194,122,0.14)",
    color: "#00d084",
    border: "1px solid rgba(0,208,132,0.25)",
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700
};

const mobileDato = {
    color: "#d5dde6",
    fontSize: 14,
    lineHeight: 1.45,
    marginBottom: 6
};

const mobileButtons = {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    marginTop: 12
};

const editMobileWrap = {
    display: "grid",
    gap: 10
};

const editLabel = {
    display: "grid",
    gap: 6,
    color: "#dfe7ef",
    fontSize: 13
};

const editInput = {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #314155",
    background: "#0b1016",
    color: "#fff",
    width: "100%",
    boxSizing: "border-box",
    outline: "none"
};

const editInputDesktop = {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #314155",
    background: "#0b1016",
    color: "#fff",
    width: "100%",
    boxSizing: "border-box",
    outline: "none"
};

const emptyText = {
    color: "#9aabbb",
    background: "#0e141c",
    border: "1px dashed #2b3948",
    borderRadius: 14,
    padding: 18,
    textAlign: "center"
};

const btnLight = {
    background: "#fff",
    color: "#111",
    border: 0,
    borderRadius: 12,
    padding: "10px 14px",
    cursor: "pointer",
    fontWeight: 700
};

const btnPrimary = {
    background: "#00c27a",
    color: "#fff",
    border: 0,
    borderRadius: 12,
    padding: "10px 14px",
    cursor: "pointer",
    fontWeight: 700
};

const btnSecondary = {
    background: "#16202c",
    color: "#fff",
    border: "1px solid #2a3b4f",
    borderRadius: 12,
    padding: "10px 14px",
    cursor: "pointer",
    fontWeight: 700
};

const btnGhost = {
    background: "#16202c",
    color: "#fff",
    border: "1px solid #2a3b4f",
    borderRadius: 10,
    padding: "8px 12px",
    cursor: "pointer",
    fontWeight: 700
};

const btnDelete = {
    background: "#ff4d4f",
    color: "#fff",
    border: 0,
    borderRadius: 10,
    padding: "8px 12px",
    cursor: "pointer",
    fontWeight: 700
};

const btnEdit = {
    background: "#1890ff",
    color: "#fff",
    border: 0,
    borderRadius: 10,
    padding: "8px 12px",
    cursor: "pointer",
    fontWeight: 700
};

const btnSave = {
    background: "#00c27a",
    color: "#fff",
    border: 0,
    borderRadius: 10,
    padding: "8px 12px",
    cursor: "pointer",
    fontWeight: 700
};

const detalleOperariosWrap = {
    display: "grid",
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTop: "1px solid #223041"
};

const detalleOperarioRow = {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    fontSize: 13,
    color: "#dce5ee"
};

const detalleOperariosDesktop = {
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
    marginTop: 4
};

const detalleOperarioChip = {
    fontSize: 12,
    padding: "4px 8px",
    borderRadius: 999,
    background: "#16202c",
    border: "1px solid #27384a",
    color: "#dfe7ef",
    width: "fit-content"
};

const resumenCostosBox = {
    display: "grid",
    gap: 8,
    marginTop: 4,
    background: "#0e141c",
    border: "1px solid #223041",
    borderRadius: 14,
    padding: 12
};

const resumenDesktopBox = {
    display: "grid",
    gap: 8,
    background: "#0b1016",
    border: "1px solid #253445",
    borderRadius: 10,
    padding: 12,
    alignSelf: "start",
    marginTop: 20
};

const resumenCostosTitle = {
    color: "#8dcfff",
    fontWeight: 800,
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 0.5
};

const resumenCostoRow = {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    color: "#fff",
    fontSize: 13
};

const resumenCostoTotal = {
    borderTop: "1px solid #253445",
    paddingTop: 8,
    marginTop: 4,
    fontWeight: 800
};