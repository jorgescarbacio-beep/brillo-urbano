import { useEffect, useState } from "react";
import { auth, db } from "./firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

// Importación de tus páginas
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import TrabajosRealizados from "./pages/TrabajosRealizados";
import BrilloUrbanoLanding from "./pages/BrilloUrbano";
import AgendaOperarios from "./pages/AgendaOperarios";

function App() {
  const [user, setUser] = useState(null);
  const [rol, setRol] = useState(null);
  const [pagina, setPagina] = useState("dashboard");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        try {
          const docRef = doc(db, "usuarios", u.email);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setRol(docSnap.data().rol);
          } else {
            setRol("admin");
          }
        } catch (error) {
          console.error("Error obteniendo rol:", error);
          setRol("admin");
        }
        setUser(u);
      } else {
        setUser(null);
        setRol(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 1. DETECTAR SI QUEREMOS VER LA WEB PÚBLICA (LANDING)
  // Si NO tiene "?admin" en la URL, mostramos la Landing por defecto, incluso en localhost.
  const wantsAdmin = window.location.search.includes("admin");
  const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

  if (loading) return null;

  // 👉 REGLA DE ORO: Si no pide explícitamente "admin", va a la Landing.
  // Esto permite que el QR y la visita normal de un cliente funcionen siempre.
  if (!wantsAdmin && !isLocalhost) {
    return <BrilloUrbanoLanding />;
  }

  // 👉 SI ESTÁS EN LOCALHOST PERO QUERÉS VER LA LANDING:
  // Si entras a http://localhost:3000/ sin el ?admin, te mostrará la landing.
  if (isLocalhost && !wantsAdmin) {
    return <BrilloUrbanoLanding />;
  }

  // 👉 MODO GESTIÓN (Solo si tiene ?admin o es localhost con intención de admin)
  if (wantsAdmin || isLocalhost) {
    if (!user) {
      return <Login />;
    }

    if (rol === "operario") {
      return <AgendaOperarios />;
    }

    if (pagina === "trabajos") {
      return (
        <TrabajosRealizados
          onBack={() => setPagina("dashboard")}
        />
      );
    }

    return (
      <Dashboard
        user={user}
        setPagina={setPagina}
      />
    );
  }

  return <BrilloUrbanoLanding />;
}

export default App;