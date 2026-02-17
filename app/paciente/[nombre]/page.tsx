"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { ArrowLeft, Scale, Calendar } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import Link from "next/link";

// --- CONFIGURACIÓN FIREBASE (Igual que siempre) ---
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
    // Decodificamos el nombre (ej: "Felipe%20Gonzalez" -> "Felipe Gonzalez")
    const nombrePaciente = decodeURIComponent(params.nombre as string);
    
    const [registros, setRegistros] = useState<any[]>([]);
    const [cargando, setCargando] = useState(true);
    const [stats, setStats] = useState({ inicio: 0, actual: 0, diff: 0 });

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
            // Buscamos SOLO las fichas de ESTE paciente y ESTE nutri
            const q = query(
                collection(db, "pautas"), 
                where("paciente", "==", paciente),
                orderBy("fecha", "asc") // Importante: Ordenar por fecha para el gráfico
            );
            
            const querySnapshot = await getDocs(q);
            
            // Filtramos por seguridad extra (dueño del dato)
            const data = querySnapshot.docs
                .map(doc => {
                    const d = doc.data();
                    const fechaObj = new Date(d.fecha);
                    return {
                        id: doc.id,
                        ...d,
                        // Formato fecha corto para el gráfico (ej: "17/02")
                        fechaCorta: fechaObj.toLocaleDateString('es-CL', {day:'2-digit', month:'2-digit'}),
                        fechaLarga: fechaObj.toLocaleDateString('es-CL'),
                        pesoNum: Number(d.peso) || 0
                    };
                })
                .filter((d: any) => d.creadoPor === email || !d.creadoPor);

            setRegistros(data);

            // Calcular Estadísticas Rápidas
            if (data.length > 0) {
                const pesoInicio = data[0].pesoNum;
                const pesoFin = data[data.length - 1].pesoNum;
                setStats({
                    inicio: pesoInicio,
                    actual: pesoFin,
                    diff: Number((pesoFin - pesoInicio).toFixed(1))
                });
            }

        } catch (error) {
            console.error("Error:", error);
        }
        setCargando(false);
    };

    if (cargando) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-blue-600 font-bold">Cargando evolución...</div>;

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-5xl mx-auto">
                
                {/* 1. ENCABEZADO */}
                <div className="mb-8">
                    <Link href="/historial" className="text-slate-400 hover:text-blue-600 flex items-center gap-2 mb-4 text-xs font-bold transition uppercase tracking-widest">
                        <ArrowLeft className="w-3 h-3" /> Volver al Historial
                    </Link>
                    <div className="flex justify-between items-end">
                        <div>
                            <h1 className="text-4xl font-black text-slate-800 uppercase tracking-tight">{nombrePaciente}</h1>
                            <p className="text-slate-500 font-medium">Ficha de Evolución Clínica</p>
                        </div>
                        
                        {/* RESUMEN RÁPIDO */}
                        <div className="flex gap-4">
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                <div className="text-[10px] text-slate-400 font-bold uppercase">Peso Inicial</div>
                                <div className="text-xl font-bold text-slate-700">{stats.inicio} kg</div>
                            </div>
                            <div className="bg-blue-600 p-4 rounded-xl border border-blue-600 shadow-lg text-white">
                                <div className="text-[10px] text-blue-200 font-bold uppercase">Peso Actual</div>
                                <div className="text-xl font-bold">{stats.actual} kg</div>
                            </div>
                            <div className={`p-4 rounded-xl border shadow-sm ${stats.diff <= 0 ? 'bg-green-100 border-green-200 text-green-800' : 'bg-red-100 border-red-200 text-red-800'}`}>
                                <div className="text-[10px] opacity-60 font-bold uppercase">Progreso</div>
                                <div className="text-xl font-black">
                                    {stats.diff > 0 ? "+" : ""}{stats.diff} kg
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. GRÁFICO DE EVOLUCIÓN */}
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 mb-8">
                    <h2 className="text-sm font-bold text-slate-500 uppercase mb-6 flex items-center gap-2">
                        <Scale className="w-4 h-4" /> Curva de Peso
                    </h2>
                    
                    <div className="h-[300px] w-full">
                        {registros.length > 1 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={registros}>
                                    <defs>
                                        <linearGradient id="colorPeso" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis 
                                        dataKey="fechaCorta" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{fill: '#94a3b8', fontSize: 12}} 
                                        dy={10}
                                    />
                                    <YAxis 
                                        domain={['auto', 'auto']} 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{fill: '#94a3b8', fontSize: 12}} 
                                    />
                                    <Tooltip 
                                        contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                                        itemStyle={{color: '#2563eb', fontWeight: 'bold'}}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="pesoNum" 
                                        stroke="#2563eb" 
                                        strokeWidth={3}
                                        fillOpacity={1} 
                                        fill="url(#colorPeso)" 
                                        name="Peso (kg)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-100 rounded-xl">
                                <Scale className="w-8 h-8 mb-2" />
                                <p className="font-bold text-sm">Se necesitan al menos 2 controles para graficar</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. HISTORIAL DE CITAS (TABLA SIMPLE) */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="p-4 bg-slate-50 border-b border-slate-200">
                        <h3 className="font-bold text-slate-700 text-sm">📜 Bitácora de Atenciones</h3>
                    </div>
                    {registros.map((reg) => (
                        <div key={reg.id} className="p-4 border-b border-slate-100 flex justify-between items-center last:border-0 hover:bg-slate-50 transition">
                            <div className="flex items-center gap-3">
                                <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                                    <Calendar className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className="font-bold text-slate-800 text-sm">{reg.fechaLarga}</div>
                                    <div className="text-xs text-slate-400 capitalize">{reg.estrategia}</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="font-black text-slate-700">{reg.peso} kg</div>
                                <div className="text-[10px] text-slate-400 font-bold uppercase">{reg.objetivo}</div>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
}