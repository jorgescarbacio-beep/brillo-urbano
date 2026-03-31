import { db } from "../firebase/config";
import {
    collection,
    addDoc,
    deleteDoc,
    doc,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
} from "firebase/firestore";

const COL = "clientes";

export function listenClientes(cb) {

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

export async function crearCliente(data, user) {

    const payload = {

        nombre: (data.nombre || "").trim(),
        direccion: (data.direccion || "").trim(),
        telefono: (data.telefono || "").trim(),
        notas: (data.notas || "").trim(),

        activo: true,

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),

        createdBy: user?.uid || null,

    };

    if (!payload.nombre) throw new Error("Falta nombre");

    const ref = await addDoc(
        collection(db, COL),
        payload
    );

    return ref.id;

}

export async function actualizarCliente(id, patch) {

    const ref = doc(db, COL, id);

    return updateDoc(ref, {
        ...patch,
        updatedAt: serverTimestamp()
    });

}

export async function borrarCliente(id) {

    const ref = doc(db, COL, id);

    return deleteDoc(ref);

}