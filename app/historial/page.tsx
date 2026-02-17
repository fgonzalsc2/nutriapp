"use client";
import { useRouter } from "next/navigation"; // <--- Importante para viajar al inicio
import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, getDocs, query, orderBy, doc, deleteDoc } from "firebase/firestore";
import Link from "next/link";
import { Trash2, Search, ArrowLeft, FileText, Loader2 } from "lucide-react";

// --- CONFIGURACIÓN FIREBASE ---
const firebaseConfig = {
    apiKey: "AIzaSyCjeI7Om5Qqlxcga-O0k_jaqCL8cHbCaNk",
    authDomain: "nutriapp-94e6b.firebaseapp.com",
    projectId: "nutriapp-94e6b",
    storageBucket: "nutriapp-94e6b.firebasestorage.app",
    messagingSenderId: "403128573577",
    appId: "1:403128573577:web:6548324a8c7e93db193058"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export default function HistorialPage() {
    const router = useRouter(); // Hook para navegar
    const [user, setUser] = useState<any>(null);
    const [pautas, setPautas] = useState<any[]>([]);
    const [busqueda, setBusqueda] = useState("");
    const [cargando, setCargando] = useState(true);

    // 1. VERIFICAR SEGURIDAD
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (usuario) => {
            if (usuario) {
                setUser(usuario);
                cargarDatos();
            } else {
                window.location.href = "/";
            }
        });
        return () => unsubscribe();
    }, []);

    // 2. CARGAR TODOS LOS PACIENTES
    const cargarDatos = async () => {
        setCargando(true);
        try {
            const q = query(collection(db, "pautas"), orderBy("fecha", "desc"));
            const querySnapshot = await getDocs(q);
            const datos = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setPautas(datos);
        } catch (error) {
            console.error("Error cargando historial:", error);
        }
        setCargando(false);
    };

    // 3. FUNCIÓN PARA BORRAR
    const borrarPauta = async (id: string) => {
        if(!confirm("¿Seguro que quieres eliminar este registro permanentemente?")) return;
        try {
            await deleteDoc(doc(db, "pautas", id));
            setPautas(pautas.filter(p => p.id !== id));
        } catch (error) {
            alert("Error al borrar");
        }
    };

    // 4. NUEVO: CARGAR EN CALCULADORA
    const cargarEnCalculadora = (pauta: any) => {
        // Guardamos los datos en la memoria temporal
        localStorage.setItem("pauta_editar", JSON.stringify(pauta));
        // Nos vamos a la calculadora
        router.push("/");
    };

    // 5. FILTRO INTELIGENTE
    const pautasFiltradas = pautas.filter(p => 
        p.paciente.toLowerCase().includes(busqueda.toLowerCase())
    );

    if (cargando) return (
        <div className="min-h-screen flex items-center justify-center text-blue-600 font-bold gap-2">
            <Loader2 className="animate-spin" /> Cargando historial...
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-100 p-6 font-sans">
            <div className="max-w-5xl mx-auto">
                
                {/* CABECERA */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <Link href="/" className="text-slate-500 hover:text-blue-600 flex items-center gap-2 mb-2 text-sm font-bold transition">
                            <ArrowLeft className="w-4 h-4" /> Volver al Calculador
                        </Link>
                        <h1 className="text-3xl font-black text-slate-800">Historial de Pacientes</h1>
                        <p className="text-slate-500 text-sm">Base de datos clínica</p>
                    </div>
                    <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200">
                        <span className="text-xs font-bold text-slate-400 uppercase">Total Registros</span>
                        <div className="text-xl font-black text-blue-600 text-center">{pautas.length}</div>
                    </div>
                </div>

                {/* BUSCADOR */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex gap-3 items-center">
                    <Search className="w-5 h-5 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Buscar por nombre del paciente..." 
                        className="w-full outline-none text-slate-700 font-medium"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                    />
                </div>

                {/* TABLA DE RESULTADOS */}
                <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                <th className="p-4">Fecha</th>
                                <th className="p-4">Paciente</th>
                                <th className="p-4 text-center">Calorías</th>
                                <th className="p-4 text-center">Objetivo</th>
                                <th className="p-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {pautasFiltradas.length > 0 ? (
                                pautasFiltradas.map((p) => (
                                    <tr key={p.id} className="hover:bg-blue-50 transition-colors group">
                                        <td className="p-4 text-sm text-slate-500">
                                            {new Date(p.fecha).toLocaleDateString()}
                                            <span className="block text-[10px] opacity-60">{new Date(p.fecha).toLocaleTimeString().slice(0,5)}</span>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-bold text-slate-700">{p.paciente}</div>
                                            <div className="text-xs text-slate-400">{p.profesional || "Sin firma"}</div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold border border-slate-200">
                                                {Math.round(p.caloriasActuales || p.caloriasMeta || 0)} kcal
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            {p.macros && (
                                                <div className="flex gap-1 justify-center text-[10px] font-bold text-slate-400">
                                                    <span className="text-blue-500">P:{p.macros.prot}g</span>
                                                    <span className="text-orange-500">C:{p.macros.cho}g</span>
                                                    <span className="text-yellow-500">G:{p.macros.gras}g</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4 text-right flex justify-end gap-2">
                                            {/* BOTÓN CARGAR EN CALCULADORA */}
                                            <button 
                                                onClick={() => cargarEnCalculadora(p)}
                                                className="p-2 text-blue-400 hover:text-white hover:bg-blue-500 bg-blue-50 rounded-lg transition border border-blue-100"
                                                title="Cargar datos para Editar/Imprimir"
                                            >
                                                <FileText className="w-4 h-4" />
                                            </button>
                                            
                                            {/* BOTÓN BORRAR */}
                                            <button 
                                                onClick={() => borrarPauta(p.id)}
                                                className="p-2 text-red-300 hover:text-white hover:bg-red-500 bg-red-50 rounded-lg transition border border-red-100"
                                                title="Eliminar Registro"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-400">
                                        No se encontraron pacientes con ese nombre.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

            </div>
        </div>
    );
}