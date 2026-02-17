"use client";
import { useState } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";

// Usamos la misma configuración que ya tienes
const firebaseConfig = {
    apiKey: "AIzaSyCjeI7Om5Qqlxcga-O0k_jaqCL8cHbCaNk",
    authDomain: "nutriapp-94e6b.firebaseapp.com",
    projectId: "nutriapp-94e6b",
    storageBucket: "nutriapp-94e6b.firebasestorage.app",
    messagingSenderId: "403128573577",
    appId: "1:403128573577:web:6548324a8c7e93db193058"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default function PaginaCliente() {
    const [nombre, setNombre] = useState("");
    const [pauta, setPauta] = useState<any>(null);
    const [cargando, setCargando] = useState(false);

    const buscarPauta = async () => {
        if (!nombre) return alert("Escribe tu nombre");
        setCargando(true);
        try {
            const pautasRef = collection(db, "pautas");
            const q = query(
                pautasRef, 
                where("paciente", "==", nombre), 
                orderBy("fecha", "desc"), 
                limit(1)
            );
            const querySnapshot = await getDocs(q);
            
            if (querySnapshot.empty) {
                alert("No se encontró ninguna pauta para este nombre.");
            } else {
                setPauta(querySnapshot.docs[0].data());
            }
        } catch (error) {
            console.error(error);
            alert("Error al buscar. Asegúrate de escribir el nombre exacto.");
        }
        setCargando(false);
    };

    return (
        <main className="min-h-screen bg-slate-50 p-4 flex flex-col items-center">
            <div className="max-w-md w-full bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
                <h1 className="text-2xl font-bold text-blue-600 mb-4 text-center">Mi Pauta Nutricional</h1>
                
                {!pauta ? (
                    <div className="space-y-4">
                        <p className="text-sm text-slate-500 text-center">Ingresa tu nombre completo para ver tu plan actualizado.</p>
                        <input 
                            className="w-full p-3 border rounded-xl outline-none focus:border-blue-500"
                            placeholder="Ej: Juan Pérez"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                        />
                        <button 
                            onClick={buscarPauta}
                            className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold"
                        >
                            {cargando ? "Buscando..." : "Ver mi Plan"}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="bg-blue-50 p-4 rounded-xl">
                            <h2 className="font-bold text-blue-800">Hola, {pauta.paciente}!</h2>
                            <p className="text-xs text-blue-600">Última actualización: {new Date(pauta.fecha).toLocaleDateString()}</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-center">
                            <div className="bg-slate-50 p-2 rounded-lg">
                                <span className="block text-[10px] text-slate-400 uppercase">Calorías</span>
                                <span className="font-bold text-lg text-slate-700">{Math.round(pauta.caloriasActuales || pauta.caloriasMeta)}</span>
                            </div>
                            <div className="bg-slate-50 p-2 rounded-lg">
                                <span className="block text-[10px] text-slate-400 uppercase">Proteína</span>
                                <span className="font-bold text-lg text-blue-600">{pauta.macros?.prot}g</span>
                            </div>
                        </div>

                        <button onClick={() => setPauta(null)} className="text-xs text-slate-400 underline w-full text-center">Buscar otro nombre</button>
                    </div>
                )}
            </div>
        </main>
    );
}