import { db, storage } from "../firebase/config";
import {
    addDoc,
    collection,
    doc,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
    where
} from "firebase/firestore";

import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import dayjs from "dayjs";
import { v4 as uuidv4 } from "uuid";

const COL = "servicios";
const PROGRAMADOS = "servicios_programados";

const startOfDay = (d) => dayjs(d).startOf("day").toDate();
const endOfDay = (d) => dayjs(d).endOf("day").toDate();

export const FIXED_TYPES = ["campana", "ducto", "cocina"];

export function calcNextDueDate(fechaISO) {
    return dayjs(fechaISO).add(35, "day").startOf("day").toDate();
}

//
// CREAR SERVICIO REALIZADO
//

export async function crearServicio(
    { clienteId, servicios, fechaISO, importe, notas },
    user
) {

    const tieneServicioFijo = servicios.some((s) =>
        FIXED_TYPES.includes(s)
    );

    const nextDue = tieneServicioFijo
        ? calcNextDueDate(fechaISO)
        : null;

    const payload = {
        clienteId,
        servicios,
        fijo: tieneServicioFijo,
        fechaISO,
        importe: Number(importe || 0),
        notas: (notas || "").trim(),
        fotos: [],
        nextDue,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: user?.uid || null
    };

    const docRef = await addDoc(collection(db, COL), payload);

    return docRef.id;
}

//
// CREAR SERVICIO PROGRAMADO
//

export async function crearServicioProgramado(data, user) {

    const payload = {
        ...data,
        estado: "programado",
        createdAt: serverTimestamp(),
        createdBy: user?.uid || null
    };

    const docRef = await addDoc(collection(db, PROGRAMADOS), payload);

    return docRef.id;
}

//
// LISTEN SERVICIOS PROGRAMADOS
//

export function listenServiciosProgramados(cb) {

    const q = query(
        collection(db, PROGRAMADOS),
        orderBy("createdAt", "desc")
    );

    return onSnapshot(q, (snap) => {

        const items = snap.docs.map((d) => ({
            id: d.id,
            ...d.data()
        }));

        cb(items);

    });

}

//
// SUBIR FOTOS
//

export async function subirFotosServicio({ servicioId, clienteId, files }) {

    if (!files?.length) return [];

    const uploads = [];

    for (const f of files) {

        const ext = (f.name.split(".").pop() || "jpg").toLowerCase();

        const path =
            `clientes/${clienteId}/servicios/${servicioId}/${uuidv4()}.${ext}`;

        const storageRef = ref(storage, path);

        await uploadBytes(storageRef, f);

        const url = await getDownloadURL(storageRef);

        uploads.push({
            url,
            path,
            name: f.name,
            size: f.size
        });

    }

    const refDoc = doc(db, COL, servicioId);

    await updateDoc(refDoc, {
        fotos: uploads,
        updatedAt: serverTimestamp()
    });

    return uploads;
}

//
// RECORDATORIOS HOY
//

export function listenAvisarHoy(cb) {

    const s = startOfDay(new Date());
    const e = endOfDay(new Date());

    const q = query(
        collection(db, COL),
        where("fijo", "==", true),
        where("nextDue", ">=", s),
        where("nextDue", "<=", e),
        orderBy("nextDue", "asc")
    );

    return onSnapshot(q, (snap) => {

        const items = snap.docs.map((d) => ({
            id: d.id,
            ...d.data()
        }));

        cb(items);

    });
}

//
// SERVICIOS VENCIDOS
//

export function listenServiciosVencidos(cb) {

    const hoy = startOfDay(new Date());

    const q = query(
        collection(db, COL),
        where("fijo", "==", true),
        where("nextDue", "<", hoy),
        orderBy("nextDue", "asc")
    );

    return onSnapshot(q, (snap) => {

        const items = snap.docs.map((d) => {

            const data = d.data();

            const fecha = data.nextDue?.toDate?.() || data.nextDue;

            return {
                id: d.id,
                ...data,
                diasVencido: dayjs().diff(dayjs(fecha), "day")
            };

        });

        cb(items);

    });
}

//
// LISTEN GENERAL SERVICIOS
//

export function listenServicios(cb) {

    const q = query(
        collection(db, COL),
        orderBy("createdAt", "desc")
    );

    return onSnapshot(q, (snap) => {

        const items = snap.docs.map((d) => ({
            id: d.id,
            ...d.data()
        }));

        cb(items);

    });
}