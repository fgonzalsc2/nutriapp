"use client";
import { useRouter } from "next/navigation"; 
import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, getDocs, query, orderBy, doc, deleteDoc } from "firebase/firestore";
import Link from "next/link";
// --- AGREGADO: LineChart en los imports ---
import { Trash2, Search, ArrowLeft, FileText, Loader2, Calendar, User, Download, LineChart } from "lucide-react";

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

// --- DICCIONARIO DE ESTRATEGIAS ---
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

    // 1. VERIFICAR USUARIO Y CARGAR DATOS
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

    const cargarMisDatos = async (email: string | null) => {
        if (!email) return;
        setCargando(true);
        try {
            const q = query(collection(db, "pautas"), orderBy("fecha", "desc"));
            const querySnapshot = await getDocs(q);
            
            const datos = querySnapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter((doc: any) => doc.creadoPor === email || !doc.creadoPor); 

            setPautas(datos);
        } catch (error) {
            console.error("Error cargando historial:", error);
        }
        setCargando(false);
    };

    // 2. EXPORTAR A EXCEL (ARREGLADO: HORA 24H Y SIN EMOJIS)
    const exportarExcel = () => {
        if (pautas.length === 0) return alert("No hay datos para exportar.");

        let csvContent = "\uFEFFsep=;\n"; 
        csvContent += "Fecha;Hora;Paciente;Estrategia;Peso (kg);Objetivo;Calorias Meta\n";

        pautas.forEach(p => {
            const f = new Date(p.fecha);
            const fecha = f.toLocaleDateString('es-CL');
            const hora = f.toLocaleTimeString('es-CL', {hour: '2-digit', minute:'2-digit', hour12: false});
            
            const nombre = p.paciente ? p.paciente.replace(/;/g, "") : "Sin nombre"; 
            
            let estTexto = p.estrategia || "Personalizada";
            estTexto = estTexto.charAt(0).toUpperCase() + estTexto.slice(1);

            const peso = p.peso || "-";
            const objetivo = p.objetivo || "-";
            const calorias = p.caloriasMeta ? Math.round(p.caloriasMeta) : "0";

            const row = `${fecha};${hora};${nombre};${estTexto};${peso};${objetivo};${calorias}`;
            csvContent += row + "\n";
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        const fechaArchivo = new Date().toISOString().split('T')[0];
        link.setAttribute("download", `Pacientes_NutriApp_${fechaArchivo}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // 3. OTRAS FUNCIONES
    const borrarPauta = async (id: string) => {
        if(!confirm("¿Eliminar este registro permanentemente?")) return;
        try {
            await deleteDoc(doc(db, "pautas", id));
            setPautas(pautas.filter(p => p.id !== id));
        } catch (error) { alert("Error al borrar"); }
    };

    const cargarEnCalculadora = (pauta: any) => {
        localStorage.setItem("pauta_editar", JSON.stringify(pauta));
        router.push("/");
    };

    const getObjetivoBadge = (obj: string) => {
        if (obj === 'bajar') return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-md text-[10px] font-black border border-red-200">📉 DÉFICIT</span>;
        if (obj === 'subir') return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-[10px] font-black border border-blue-200">💪 SUPERÁVIT</span>;
        return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-md text-[10px] font-black border border-green-200">⚓ MANTENCIÓN</span>;
    };

    const pautasFiltradas = pautas.filter(p => 
        p.paciente.toLowerCase().includes(busqueda.toLowerCase())
    );

    if (cargando) return (
        <div className="min-h-screen flex items-center justify-center text-blue-600 font-bold gap-2 bg-slate-50">
            <Loader2 className="animate-spin" /> Cargando historial privado...
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 p-6 font-sans">
            <div className="max-w-6xl mx-auto">
                
                {/* CABECERA */}
                <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
                    <div>
                        <Link href="/" className="text-slate-400 hover:text-blue-600 flex items-center gap-2 mb-2 text-xs font-bold transition uppercase tracking-widest">
                            <ArrowLeft className="w-3 h-3" /> Volver al Calculador
                        </Link>
                        <h1 className="text-4xl font-black text-slate-800 tracking-tighter">Mis Pacientes</h1>
                        <p className="text-slate-500 text-sm mt-1">
                            Sesión activa: <span className="font-bold text-blue-600">{user?.email}</span>
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <button 
                            onClick={exportarExcel}
                            className="bg-white hover:bg-slate-50 text-slate-700 px-4 py-3 rounded-xl shadow-sm border border-slate-200 font-bold text-xs flex items-center gap-2 transition-all active:scale-95"
                        >
                            <Download className="w-4 h-4 text-green-600" />
                            Exportar Excel
                        </button>

                        <div className="bg-blue-600 px-6 py-3 rounded-xl shadow-lg shadow-blue-200 flex flex-col items-center justify-center min-w-[120px]">
                            <span className="text-[10px] font-bold text-blue-100 uppercase tracking-widest">Total</span>
                            <div className="text-2xl font-black text-white">{pautas.length}</div>
                        </div>
                    </div>
                </div>

                {/* BUSCADOR */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 flex gap-3 items-center focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                    <Search className="w-5 h-5 text-slate-300" />
                    <input 
                        type="text" 
                        placeholder="Buscar paciente por nombre..." 
                        className="w-full outline-none text-slate-600 font-medium"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                    />
                </div>

                {/* TABLA */}
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <th className="p-5">Fecha / Hora</th>
                                <th className="p-5">Paciente & Estrategia</th>
                                <th className="p-5 text-center">Calorías</th>
                                <th className="p-5 text-center">Objetivo</th>
                                <th className="p-5 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {pautasFiltradas.length > 0 ? (
                                pautasFiltradas.map((p) => {
                                    const f = new Date(p.fecha);
                                    return (
                                    <tr key={p.id} className="hover:bg-blue-50/30 transition-colors group">
                                        <td className="p-5">
                                            <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
                                                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                                                {f.toLocaleDateString('es-CL')}
                                            </div>
                                            <div className="text-[10px] text-slate-400 font-medium ml-5">
                                                {f.toLocaleTimeString('es-CL', {hour: '2-digit', minute:'2-digit'})} hrs
                                            </div>
                                        </td>
                                        
                                        <td className="p-5">
                                            <div className="font-extrabold text-slate-800 text-base uppercase tracking-tight">{p.paciente}</div>
                                            <div className="text-[11px] text-slate-500 font-semibold italic">
                                                {ESTRATEGIAS_LABELS[p.estrategia] || "Personalizada"}
                                            </div>
                                        </td>
                                        
                                        <td className="p-5 text-center">
                                            <span className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-black border border-slate-200">
                                                {Math.round(p.caloriasMeta || 0)} <span className="text-[9px] opacity-60">KCAL</span>
                                            </span>
                                        </td>
                                        
                                        <td className="p-5 text-center">
                                            {getObjetivoBadge(p.objetivo)}
                                        </td>
                                        
                                        {/* COLUMNA ACCIONES */}
                                        <td className="p-5 text-right">
                                            <div className="flex justify-end gap-1">
                                                {/* BOTÓN NUEVO: VER GRÁFICO */}
                                                <Link 
                                                    href={`/paciente/${p.paciente}`}
                                                    className="p-2.5 text-purple-600 hover:bg-purple-100 rounded-xl transition-all"
                                                    title="Ver Evolución y Gráficos"
                                                >
                                                    <LineChart className="w-5 h-5" />
                                                </Link>

                                                <button 
                                                    onClick={() => cargarEnCalculadora(p)}
                                                    className="p-2.5 text-blue-600 hover:bg-blue-100 rounded-xl transition-all"
                                                    title="Ver Detalle / Editar"
                                                >
                                                    <FileText className="w-5 h-5" />
                                                </button>
                                                <button 
                                                    onClick={() => borrarPauta(p.id)}
                                                    className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 className="w-5 h-5" />
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