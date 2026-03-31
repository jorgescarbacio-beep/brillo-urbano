import { useEffect, useState } from "react";
import { auth } from "./firebase/config";
import { onAuthStateChanged } from "firebase/auth";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import TrabajosRealizados from "./pages/TrabajosRealizados";
import BrilloUrbanoLanding from "./pages/BrilloUrbano";

function App() {

  const [user, setUser] = useState(null);
  const [pagina, setPagina] = useState("dashboard");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  // 🔥 DETECTAR LANDING DESDE LA URL
  const isLanding = window.location.search.includes("landing");

  // 👉 SI ES LANDING, MOSTRAR DIRECTO
  if (isLanding) {
    return <BrilloUrbanoLanding />;
  }

  // 👉 FLUJO NORMAL DE TU APP
  if (!user) return <Login />;

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

export default App;