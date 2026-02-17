"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import { ArrowLeft, Scale, Calendar, Activity, Ruler, Layers, BicepsFlexed } from "lucide-react";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import Link from "next/link";

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

export default function PacienteDetalle() {
    const params = useParams();
    const nombrePaciente = decodeURIComponent(params.nombre as string);
    
    const [registros, setRegistros] = useState<any[]>([]);
    const [cargando, setCargando] = useState(true);
    const [stats, setStats] = useState({ inicio: 0, actual: 0, diff: 0 });
    
    // 5 MÉTRICAS CLAVE PARA EL NUTRICIONISTA
    const [metrica, setMetrica] = useState<'peso' | 'imc' | 'cintura' | 'grasa' | 'musculo'>('peso');

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                cargarDatos(user.email, nombrePaciente);
            } else {
                window.location.href = "/";
            }
        });
        return () => unsubscribe();
    }, [nombrePaciente]);

    const cargarDatos = async (email: string | null, paciente: string) => {
        if (!email) return;
        
        try {
            const q = query(
                collection(db, "pautas"), 
                where("paciente", "==", paciente)
            );
            
            const querySnapshot = await getDocs(q);
            
            const data = querySnapshot.docs
                .map(doc => {
                    const d = doc.data();
                    const fechaObj = new Date(d.fecha);
                    
                    // EXTRACCIÓN DE DATOS CLÍNICOS
                    const peso = Number(d.peso) || 0;
                    const altura = Number(d.altura) || 0;
                    
                    // Cálculos
                    const imcCalc = altura > 0 ? (peso / ((altura/100)**2)).toFixed(1) : 0;
                    
                    // Buscamos datos profundos (si existen en el objeto antropometria)
                    const cinturaCalc = d.antropometria?.cintura ? Number(d.antropometria.cintura) : 0;
                    const grasaCalc = d.antropometria?.grasa ? Number(d.antropometria.grasa) : 0; // % Grasa
                    const musculoCalc = d.antropometria?.musculo ? Number(d.antropometria.musculo) : 0; // % Músculo

                    return {
                        id: doc.id,
                        ...d,
                        fechaCorta: fechaObj.toLocaleDateString('es-CL', {day:'2-digit', month:'2-digit'}),
                        fechaLarga: fechaObj.toLocaleDateString('es-CL'),
                        fechaObj: fechaObj,
                        
                        // Mapeo para el gráfico
                        peso: peso,
                        imc: Number(imcCalc),
                        cintura: cinturaCalc,
                        grasa: grasaCalc,
                        musculo: musculoCalc
                    };
                })
                .filter((d: any) => d.creadoPor === email || !d.creadoPor)
                .sort((a, b) => a.fechaObj.getTime() - b.fechaObj.getTime());

            setRegistros(data);

            if (data.length > 0) {
                const primerRegistro = data.find(d => d.peso > 0) || data[0];
                const ultimoRegistro = data[data.length - 1];
                setStats({
                    inicio: primerRegistro.peso,
                    actual: ultimoRegistro.peso,
                    diff: Number((ultimoRegistro.peso - primerRegistro.peso).toFixed(1))
                });
            }

        } catch (error) {
            console.error("Error:", error);
        }
        setCargando(false);
    };

    // CONFIGURACIÓN VISUAL SEGÚN MÉTRICA
    const getChartConfig = () => {
        switch(metrica) {
            case 'peso': return { color: "#2563eb", unit: "kg", label: "Peso Corporal" };
            case 'imc': return { color: "#7c3aed", unit: "pts", label: "IMC" };
            case 'cintura': return { color: "#ea580c", unit: "cm", label: "Cintura" };
            case 'grasa': return { color: "#eab308", unit: "%", label: "% Grasa" }; // Amarillo Adiposo
            case 'musculo': return { color: "#dc2626", unit: "%", label: "% Músculo" }; // Rojo Muscular
            default: return { color: "#2563eb", unit: "", label: "" };
        }
    };

    const config = getChartConfig();

    if (cargando) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-blue-600 font-bold">Cargando perfil...</div>;

    return (
        <div className="min-h-screen bg-slate-50 p-6 font-sans">
            <div className="max-w-5xl mx-auto">
                
                {/* 1. ENCABEZADO */}
                <div className="mb-8">
                    <Link href="/historial" className="text-slate-400 hover:text-blue-600 flex items-center gap-2 mb-4 text-xs font-bold transition uppercase tracking-widest">
                        <ArrowLeft className="w-3 h-3" /> Volver al Historial
                    </Link>
                    <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black text-slate-800 uppercase tracking-tight">{nombrePaciente}</h1>
                            <p className="text-slate-500 font-medium">Ficha Clínica Integral</p>
                        </div>
                        
                        {/* RESUMEN DE PESO (Siempre visible como ancla) */}
                        <div className="flex gap-2">
                            <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                                <div className="text-[10px] text-slate-400 font-bold uppercase">Inicio</div>
                                <div className="text-lg font-bold text-slate-700">{stats.inicio} kg</div>
                            </div>
                            <div className="bg-blue-600 px-4 py-2 rounded-xl border border-blue-600 shadow-lg text-white">
                                <div className="text-[10px] text-blue-200 font-bold uppercase">Actual</div>
                                <div className="text-lg font-bold">{stats.actual} kg</div>
                            </div>
                            <div className={`px-4 py-2 rounded-xl border shadow-sm ${stats.diff <= 0 ? 'bg-green-100 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                                <div className="text-[10px] opacity-70 font-bold uppercase">Cambio</div>
                                <div className="text-lg font-black">{stats.diff > 0 ? "+" : ""}{stats.diff} kg</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. GRÁFICO PROFESIONAL */}
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 mb-8">
                    
                    {/* BOTONERA DE MÉTRICAS */}
                    <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-100 pb-4">
                        <button onClick={() => setMetrica('peso')} className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition ${metrica === 'peso' ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-200' : 'text-slate-400 hover:bg-slate-50'}`}>
                            <Scale className="w-3.5 h-3.5" /> Peso
                        </button>
                        <button onClick={() => setMetrica('imc')} className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition ${metrica === 'imc' ? 'bg-purple-100 text-purple-700 ring-2 ring-purple-200' : 'text-slate-400 hover:bg-slate-50'}`}>
                            <Activity className="w-3.5 h-3.5" /> IMC
                        </button>
                        <button onClick={() => setMetrica('cintura')} className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition ${metrica === 'cintura' ? 'bg-orange-100 text-orange-700 ring-2 ring-orange-200' : 'text-slate-400 hover:bg-slate-50'}`}>
                            <Ruler className="w-3.5 h-3.5" /> Cintura
                        </button>
                        <div className="w-px h-6 bg-slate-200 mx-1 hidden md:block"></div>
                        <button onClick={() => setMetrica('grasa')} className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition ${metrica === 'grasa' ? 'bg-yellow-100 text-yellow-700 ring-2 ring-yellow-200' : 'text-slate-400 hover:bg-slate-50'}`}>
                            <Layers className="w-3.5 h-3.5" /> % Grasa
                        </button>
                        <button onClick={() => setMetrica('musculo')} className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition ${metrica === 'musculo' ? 'bg-red-100 text-red-700 ring-2 ring-red-200' : 'text-slate-400 hover:bg-slate-50'}`}>
                            <BicepsFlexed className="w-3.5 h-3.5" /> % Músculo
                        </button>
                    </div>
                    
                    {/* ZONA DE GRÁFICO */}
                    <div className="h-[320px] w-full">
                        {registros.length > 1 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={registros}>
                                    <defs>
                                        <linearGradient id="colorGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={config.color} stopOpacity={0.2}/>
                                            <stop offset="95%" stopColor={config.color} stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis 
                                        dataKey="fechaCorta" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 'bold'}} 
                                        dy={10}
                                    />
                                    <YAxis 
                                        domain={['auto', 'auto']} 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{fill: '#94a3b8', fontSize: 11}} 
                                    />
                                    <Tooltip 
                                        contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}}
                                        itemStyle={{color: config.color, fontWeight: 'bold'}}
                                        formatter={(value: any) => [`${value} ${config.unit}`, config.label]}
                                        labelStyle={{color: '#64748b', marginBottom: '0.25rem', fontSize: '10px', textTransform: 'uppercase'}}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey={metrica} 
                                        stroke={config.color} 
                                        strokeWidth={3}
                                        fillOpacity={1} 
                                        fill="url(#colorGrad)" 
                                        animationDuration={1000}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/50">
                                <Scale className="w-10 h-10 mb-2 opacity-50" />
                                <p className="font-bold text-sm text-slate-400">Insuficientes datos para graficar</p>
                                <p className="text-xs">Registra al menos 2 controles para ver la curva.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. TABLA DE DATOS */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                        <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider">📜 Historial Completo</h3>
                        <span className="text-[10px] bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full font-bold">{registros.length} Citas</span>
                    </div>
                    {registros.map((reg) => (
                        <div key={reg.id} className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:justify-between sm:items-center last:border-0 hover:bg-slate-50 transition gap-4">
                            <div className="flex items-center gap-4">
                                <div className="bg-blue-50 p-2.5 rounded-lg text-blue-600">
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="font-bold text-slate-800 text-sm">{reg.fechaLarga}</div>
                                    <div className="text-xs text-slate-400 capitalize font-medium">{reg.estrategia || "Control General"}</div>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-4 gap-4 sm:gap-8 text-right w-full sm:w-auto">
                                <div>
                                    <span className="block text-[9px] text-slate-400 font-bold uppercase">Cintura</span>
                                    <span className="text-sm font-medium text-slate-700">{reg.cintura ? `${reg.cintura} cm` : "-"}</span>
                                </div>
                                <div>
                                    <span className="block text-[9px] text-slate-400 font-bold uppercase">% Grasa</span>
                                    <span className="text-sm font-medium text-yellow-600">{reg.grasa ? `${reg.grasa}%` : "-"}</span>
                                </div>
                                <div>
                                    <span className="block text-[9px] text-slate-400 font-bold uppercase">% Músc.</span>
                                    <span className="text-sm font-medium text-red-600">{reg.musculo ? `${reg.musculo}%` : "-"}</span>
                                </div>
                                <div>
                                    <span className="block text-[9px] text-slate-400 font-bold uppercase text-blue-600">Peso</span>
                                    <span className="text-sm font-black text-slate-800">{reg.peso} kg</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
}