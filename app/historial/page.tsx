"use client";
import { useRouter } from "next/navigation"; 
import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, getDocs, query, orderBy, doc, deleteDoc, where } from "firebase/firestore";
import Link from "next/link";
import { Trash2, Search, ArrowLeft, FileText, Loader2, Calendar, User } from "lucide-react";

// --- CONFIGURACIÓN FIREBASE (La misma de siempre) ---
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

// --- DICCIONARIOS PARA ETIQUETAS BONITAS ---
const ESTRATEGIAS_LABELS: Record<string, string> = {
    equilibrada: "⚖️ Equilibrada",
    mediterranea: "🍅 Mediterránea",
    lowcarb: "🥩 Low Carb",
    atleta: "⚡ Alto Rendimiento",
    definicion: "🔥 Definición",
    bariatrica: "💧 Bariátrica"
};

export default function HistorialPage() {
    const router = useRouter(); 
    const [user, setUser] = useState<any>(null);
    const [pautas, setPautas] = useState<any[]>([]);
    const [busqueda, setBusqueda] = useState("");
    const [cargando, setCargando] = useState(true);

    // 1. VERIFICAR SEGURIDAD Y CARGAR SOLO MIS DATOS
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (usuario) => {
            if (usuario) {
                setUser(usuario);
                cargarMisDatos(usuario.email);
            } else {
                window.location.href = "/";
            }
        });
        return () => unsubscribe();
    }, []);

    // 2. CARGAR PACIENTES FILTRADOS POR USUARIO
    const cargarMisDatos = async (email: string | null) => {
        if (!email) return;
        setCargando(true);
        try {
            // TRUCO DE EXPERTO: Traemos los datos filtrados por "creadoPor"
            // Nota: Si no tienes índices creados, Firebase puede pedirte crear uno en la consola.
            // Para evitar errores ahora, traeremos todo y filtraremos en Javascript (seguro para <1000 registros).
            
            const q = query(collection(db, "pautas"), orderBy("fecha", "desc"));
            const querySnapshot = await getDocs(q);
            
            const datos = querySnapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                // AQUÍ ESTÁ EL CANDADO DE SEGURIDAD 🔒
                // Solo mostramos si el email coincide O si es un registro antiguo sin dueño (opcional)
                .filter((doc: any) => doc.creadoPor === email || !doc.creadoPor); 

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

    // 4. CARGAR EN CALCULADORA
    const cargarEnCalculadora = (pauta: any) => {
        localStorage.setItem("pauta_editar", JSON.stringify(pauta));
        router.push("/");
    };

    // 5. HELPER PARA BADGES DE OBJETIVO
    const getObjetivoBadge = (obj: string) => {
        if (obj === 'bajar') return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-md text-xs font-bold border border-red-200">📉 Déficit (Bajar)</span>;
        if (obj === 'subir') return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-xs font-bold border border-blue-200">💪 Superávit (Subir)</span>;
        return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-md text-xs font-bold border border-green-200">⚓ Mantención</span>;
    };

    // 6. FILTRO DE BÚSQUEDA
    const pautasFiltradas = pautas.filter(p => 
        p.paciente.toLowerCase().includes(busqueda.toLowerCase())
    );

    if (cargando) return (
        <div className="min-h-screen flex items-center justify-center text-blue-600 font-bold gap-2 bg-slate-50">
            <Loader2 className="animate-spin" /> Cargando tus pacientes...
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 p-6 font-sans">
            <div className="max-w-6xl mx-auto">
                
                {/* CABECERA */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <Link href="/" className="text-slate-500 hover:text-blue-600 flex items-center gap-2 mb-2 text-xs font-bold transition uppercase tracking-wide">
                            <ArrowLeft className="w-3 h-3" /> Volver al Calculador
                        </Link>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Mis Pacientes</h1>
                        <p className="text-slate-500 text-sm flex items-center gap-2">
                            <User className="w-3 h-3" /> 
                            Registros de: <span className="font-bold text-blue-600">{user?.email}</span>
                        </p>
                    </div>
                    <div className="bg-white px-5 py-3 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Atenciones</span>
                        <div className="text-2xl font-black text-blue-600">{pautas.length}</div>
                    </div>
                </div>

                {/* BUSCADOR */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex gap-3 items-center ring-1 ring-slate-100 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                    <Search className="w-5 h-5 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Buscar por nombre del paciente..." 
                        className="w-full outline-none text-slate-700 font-medium placeholder:text-slate-300"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                    />
                </div>

                {/* TABLA PROFESIONAL */}
                <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                                <th className="p-4 w-40">Fecha Atención</th>
                                <th className="p-4">Paciente & Estrategia</th>
                                <th className="p-4 text-center">Calorías</th>
                                <th className="p-4 text-center">Objetivo</th>
                                <th className="p-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {pautasFiltradas.length > 0 ? (
                                pautasFiltradas.map((p) => {
                                    const fechaObj = new Date(p.fecha);
                                    return (
                                    <tr key={p.id} className="hover:bg-blue-50/50 transition-colors group">
                                        {/* COLUMNA FECHA */}
                                        <td className="p-4">
                                            <div className="flex items-center gap-2 text-slate-600 font-medium text-sm">
                                                <Calendar className="w-4 h-4 text-slate-300" />
                                                {fechaObj.toLocaleDateString('es-CL')}
                                            </div>
                                            <div className="text-[10px] text-slate-400 pl-6">
                                                {fechaObj.toLocaleTimeString('es-CL', {hour: '2-digit', minute:'2-digit'})} hrs
                                            </div>
                                        </td>

                                        {/* COLUMNA PACIENTE */}
                                        <td className="p-4">
                                            <div className="font-bold text-slate-800 text-base">{p.paciente}</div>
                                            <div className="text-xs text-slate-400 mt-0.5 font-medium flex items-center gap-1">
                                                {ESTRATEGIAS_LABELS[p.estrategia] || "Estrategia Personalizada"}
                                            </div>
                                        </td>

                                        {/* COLUMNA CALORÍAS */}
                                        <td className="p-4 text-center">
                                            <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-black border border-slate-200">
                                                {Math.round(p.caloriasMeta || 0)} kcal
                                            </span>
                                        </td>

                                        {/* COLUMNA OBJETIVO (BADGE) */}
                                        <td className="p-4 text-center">
                                            {getObjetivoBadge(p.objetivo)}
                                        </td>

                                        {/* COLUMNA ACCIONES */}
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => cargarEnCalculadora(p)}
                                                    className="p-2 text-blue-500 hover:bg-blue-100 rounded-lg transition"
                                                    title="Editar / Imprimir / WhatsApp"
                                                >
                                                    <FileText className="w-4 h-4" />
                                                </button>
                                                
                                                <button 
                                                    onClick={() => borrarPauta(p.id)}
                                                    className="p-2 text-red-400 hover:bg-red-100 rounded-lg transition"
                                                    title="Eliminar Registro"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )})
                            ) : (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-slate-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <User className="w-10 h-10 opacity-20" />
                                            <p>No tienes pacientes registrados con este usuario.</p>
                                        </div>
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