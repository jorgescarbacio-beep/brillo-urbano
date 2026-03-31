import { db } from "../firebase/config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const storage = getStorage();

export async function subirAntesDespues(antesFile, despuesFile) {
    try {

        const antesRef = ref(storage, `antesDespues/${Date.now()}_antes.jpg`);
        const despuesRef = ref(storage, `antesDespues/${Date.now()}_despues.jpg`);

        await uploadBytes(antesRef, antesFile);
        await uploadBytes(despuesRef, despuesFile);

        const antesURL = await getDownloadURL(antesRef);
        const despuesURL = await getDownloadURL(despuesRef);

        await addDoc(collection(db, "antesDespues"), {
            antes: antesURL,
            despues: despuesURL,
            createdAt: serverTimestamp(),
        });

    } catch (error) {
        console.error("Error subiendo fotos:", error);
    }
}