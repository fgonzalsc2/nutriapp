"use client";
import Link from "next/link";
import { FileText } from "lucide-react";
import { useState, useEffect } from "react";
// --- Importamos herramientas de Firebase ---
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
// --- Herramientas para base de datos ---
import { getFirestore, doc, setDoc, onSnapshot } from "firebase/firestore";
import { Eye, EyeOff, Lock, User, LogOut, Sparkles } from "lucide-react";
import { GoogleGenerativeAI } from "@google/generative-ai";

// --- Configuración de Firebase ---
const firebaseConfig = {
    apiKey: "AIzaSyCjeI7Om5Qqlxcga-O0k_jaqCL8cHbCaNk",
    authDomain: "nutriapp-94e6b.firebaseapp.com",
    projectId: "nutriapp-94e6b",
    storageBucket: "nutriapp-94e6b.firebasestorage.app",
    messagingSenderId: "403128573577",
    appId: "1:403128573577:web:6548324a8c7e93db193058"
};

// Iniciamos la conexión
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- 1. DATA CIENTÍFICA ---
const MACROS_PORCION = {
  cereales: { cho: 30, prot: 3, gras: 1, cal: 140, unit: "Porc.", medida: "1/2 Pan / 3/4 Taza" }, 
  proteina: { cho: 1, prot: 11, gras: 2, cal: 65, unit: "Porc.", medida: "1 Huevo / 50g Carne" },   
  lacteos: { cho: 10, prot: 7, gras: 0, cal: 70, unit: "Porc.", medida: "200ml / 1 Unid (125g)" },    
  frutas: { cho: 15, prot: 0, gras: 0, cal: 65, unit: "Unid.", medida: "1 Fruta Regular" },
  verduras: { cho: 5, prot: 2, gras: 0, cal: 25, unit: "Taza", medida: "1 Taza (200ml)" }, 
  grasas: { cho: 0, prot: 0, gras: 5, cal: 45, unit: "Porc.", medida: "1 cdta / 3 cdas Palta" }
};

const DISPLAY_LABELS: Record<string, string> = {
    cereales: "Cereales y Pan",
    proteina: "Proteínas / Carnes",
    lacteos: "Lácteos",
    frutas: "Frutas",
    verduras: "Verduras",
    grasas: "Aceites y Grasas"
};

const MEAL_NAMES: Record<string, string> = {
    desayuno: "🌅 Desayuno",
    colacion: "🍎 Colación Mañana",
    almuerzo: "☀️ Almuerzo",
    colacion_tarde: "🍪 Snack Tarde",
    once: "🌇 Once / Merienda",
    cena: "🌙 Cena",
    recena: "🦉 Snack Nocturno"
};

const FOOD_DB_DISPLAY: any = {
    cereales: "1/2 Pan / 3/4 Taza",
    proteina: "1 Huevo / 50g Carne",
    lacteos: "200ml / 1 Yogurt",
    frutas: "1 Unid.",
    grasas: "1 cdta Aceite / Palta",
    verduras: "Dinámico" 
};

// --- GUIAS INTA INTELIGENTES ---
const GUIAS_INTA = [
    { icon: "🐟", text: "Consume pescado al horno o a la plancha 2 veces por semana.", exclude: ['vegano', 'vegetariano', 'gota'] },
    { icon: "🍲", text: "Consume legumbres al menos 2 veces por semana, sin mezclarlas con cecinas.", exclude: ['fodmap', 'gota'] },
    { icon: "🧂", text: "Saca el salero de la mesa. Evita alimentos altos en sodio (sellos negros).", exclude: [] },
    { icon: "🥛", text: "Consume lácteos descremados o bajos en grasa diariamente.", exclude: ['vegano', 'lactosa', 'gota'] },
    { icon: "🚶", text: "Camina a paso rápido al menos 30 minutos al día.", exclude: [] },
    { icon: "🍎", text: "Intenta comer 5 porciones de frutas y verduras de distintos colores.", exclude: ['diabetes', 'resistencia'] }
];

const FOOD_EXAMPLES: any = {
  cereales: {
    normal: " (Ej: 1/2 Marraqueta, Arroz, Fideos, Papas)",
    celiaco: " (Ej: Arroz, Quinoa, Maíz, Papa)",
    vegetariano: " (Ej: Avena, Arroz, Quinoa)",
    vegano: " (Ej: Avena, Arroz, Quinoa)",
    lactosa: " (Ej: 1/2 Marraqueta, Avena, Arroz)",
    fodmap: " (Ej: Arroz, Quinoa, Papa - Evitar Trigo)",
    menopausia: " (Ej: Avena, Quinoa, Pan Integral)",
    diabetes: " (Ej: Avena, Pan Integral, Quinoa)",
    hipertension: " (Ej: Avena, Arroz, Pan sin sal)",
    embarazo: " (Ej: Avena, Pan Integral)",
    colesterol: " (Ej: Avena obligatoria, Pan Integral)",
    reflujo: " (Ej: Arroz blanco, Papa cocida)",
    gota: " (Ej: Arroz, Papa, Fideos)"
  },
  proteina: {
    normal: " (Ej: 1 Huevo, 50g Carne/Pollo)",
    celiaco: " (Ej: Huevo, Carne, Pescado)",
    vegetariano: " (Ej: Huevo, Legumbres*, Carne Soya)", 
    vegano: " (Ej: Legumbres*, Tofu, Seitán)", 
    lactosa: " (Ej: Huevo, Carne, Pollo)",
    fodmap: " (Ej: Huevo, Carne, Tofu firme)",
    menopausia: " (Ej: Pescado, Huevo, Soya)",
    diabetes: " (Ej: Pescado, Pollo, Huevo)",
    hipertension: " (Ej: Pescado, Pollo, Huevo)",
    embarazo: " (Ej: Carne/Huevo bien cocidos)",
    colesterol: " (Ej: Pescado Azul, Clara Huevo)",
    reflujo: " (Ej: Pollo cocido, Pescado blanco)",
    gota: " (Ej: Huevo, Lácteos, Tofu - NO Carnes Rojas)"
  },
  lacteos: {
    normal: " (Ej: 1 Taza (200cc) Leche o 1 Yogurt)",
    celiaco: " (Ej: 1 Taza (200cc) Leche o Yogurt)",
    vegetariano: " (Ej: Leche, Yogurt, Quesillo)", 
    vegano: " (Ej: Bebida Vegetal fortificada, Tofu)", 
    lactosa: " (Ej: Leche Sin Lactosa 200cc)",
    fodmap: " (Ej: Leche Sin Lactosa, Quesillo)",
    menopausia: " (Ej: Leche/Yoghurt Alto en Calcio)",
    diabetes: " (Ej: Yoghurt Natural sin azúcar)",
    hipertension: " (Ej: Leche descremada, Quesillo sin sal)",
    embarazo: " (Ej: Leche/Yoghurt Pasteurizado)",
    colesterol: " (Ej: Leche Descremada, Quesillo)",
    reflujo: " (Ej: Leche descremada)",
    gota: " (Ej: Leche Descremada)"
  },
  frutas: {
    normal: " (Ej: 1 Manzana, Naranja, Pera)",
    celiaco: " (Ej: Todas las frutas frescas)",
    vegetariano: " (Ej: Todas las frutas)",
    vegano: " (Ej: Todas las frutas)",
    lactosa: " (Ej: Todas las frutas)",
    fodmap: " (Ej: Kiwi, Naranja, Frutillas)",
    menopausia: " (Ej: Frutos Rojos, Cítricos)",
    diabetes: " (Ej: Manzana, Pera, Berries)",
    hipertension: " (Ej: Plátano, Naranja)",
    embarazo: " (Ej: Naranja, Kiwi)",
    colesterol: " (Ej: Manzana con piel)",
    reflujo: " (Ej: Pera cocida, Plátano - NO Cítricos)",
    gota: " (Ej: Cerezas, Frutillas, Naranja)"
  },
  grasas: {
    normal: " (Ej: Palta, Aceite, Almendras)",
    celiaco: " (Ej: Palta, Aceite, Frutos Secos)",
    vegetariano: " (Ej: Palta, Aceite, Nueces)",
    vegano: " (Ej: Palta, Aceite, Nueces)",
    lactosa: " (Ej: Palta, Aceite, Almendras)",
    fodmap: " (Ej: Aceite Oliva, Nueces)",
    menopausia: " (Ej: Aceite Oliva, Linaza)",
    diabetes: " (Ej: Palta, Aceite de Oliva)",
    hipertension: " (Ej: Aceite de Oliva, Palta)",
    embarazo: " (Ej: Aceite de Oliva, Nueces)",
    colesterol: " (Ej: Palta, Oliva, Nueces)",
    reflujo: " (Ej: Aceite de Oliva crudo)",
    gota: " (Ej: Aceite de Oliva, Palta)"
  },
  verduras: { 
    normal: "", celiaco: "", vegano: "", vegetariano: "", lactosa: "", fodmap: "", menopausia: "", diabetes: "", hipertension: "", colesterol: "", gota: "",
    embarazo: " (🚫 Lavar muy bien/Cocidas)", 
    reflujo: " (🚫 Evitar Tomate, Cebolla, Ajo)"
  }
};

// --- 2. ESTRATEGIAS ---
const ESTRATEGIAS: Record<string, { label: string, p: number, c: number, f: number }> = {
  equilibrada: { label: "Equilibrada (Minsal)", p: 20, c: 50, f: 30 },
  mediterranea: { label: "Mediterránea (Antiinflamatoria)", p: 20, c: 40, f: 40 }, 
  lowcarb: { label: "Low Carb (Resistencia Insulina)", p: 30, c: 35, f: 35 }, 
  atleta: { label: "Alto Rendimiento", p: 25, c: 55, f: 20 },
  definicion: { label: "Pérdida de Grasa (Alta Proteína)", p: 35, c: 30, f: 35 },
  bariatrica: { label: "Bariátrica (Prioridad Proteína)", p: 40, c: 30, f: 30 }
};

const OBJETIVOS_LABELS: any = {
    bajar: "Déficit (Pérdida de Grasa)",
    mantener: "Normocalórico (Mantención)",
    subir: "Superávit (Hipertrofia)"
};

// --- UI COMPONENTS ---
// --- UI COMPONENTS (VERSIÓN COMPACTA) ---
function Input({ label, ...props }: any) { return <div className="flex flex-col gap-0.5 w-full"><label className="text-slate-500 font-bold text-[9px] uppercase tracking-wide">{label}</label><input className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-blue-600 bg-white h-8" {...props} /></div>; }
function Select({ label, children, ...props }: any) { return <div className="flex flex-col gap-0.5 w-full"><label className="text-slate-500 font-bold text-[9px] uppercase tracking-wide">{label}</label><select className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-blue-600 bg-white h-8" {...props}>{children}</select></div>; }

export default function Home() {
  // --- Estado de Sesión ---
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorLogin, setErrorLogin] = useState("");
  const [verClave, setVerClave] = useState(false);

  // --- Estados de la App ---
  const [datos, setDatos] = useState({ 
    nombre: "", peso: "", altura: "", edad: "", genero: "masculino", 
    actividad: "sedentario", objetivo: "bajar", estrategia: "equilibrada",
    restriccion: "normal"
  });

  const [antropometria, setAntropometria] = useState({
    mostrar: false,
    cintura: "",
    brazo: "",
    tricipital: "",
    bicipital: "",
    subescapular: "",
    suprailiaco: ""
  });

  const [resAntro, setResAntro] = useState({
    grasa: 0,
    amb: 0,
    riesgo: "",
    areaGrasa: 0,
    areaMuscular: 0,
    porcMusculo: 0,
    porcGrasaBrazo: 0
  });

  const [nutriNombre, setNutriNombre] = useState("");
  const [observaciones, setObservaciones] = useState("");

  // --- 1. LÓGICA DE NOTAS RÁPIDAS ---
  const RECOMENDACIONES_RAPIDAS = {
    "Resistencia Insulina": "• Orden de comida: 1° Fibra (Ensalada) -> 2° Proteína -> 3° Carbohidratos.",
    "Ansiedad PM": "• Si tienes hambre extra: Gelatina light, caldo de huesos o bastones de apio a libre demanda.",
    "Reflujo": "• Evitar: Café, menta, tomate y picantes. Última comida 3 horas antes de dormir.",
    "Constipación": "• Meta: 2.5L de agua al día + 1 cda de linaza/chia remojada en ayunas.",
    "Deportista": "• Pre-Entreno: Fruta o carbohidrato simple 45 min antes. Post-Entreno: Proteína inmediata."
  };

  const agregarNota = (texto: string) => {
    setObservaciones(prev => prev ? `${prev}\n\n${texto}` : texto);
  };

  const [grid, setGrid] = useState({
    desayuno: { cereales: 0, proteina: 0, lacteos: 0, frutas: 0, grasas: 0, verduras: 0 },
    colacion: { cereales: 0, proteina: 0, lacteos: 0, frutas: 0, grasas: 0, verduras: 0 },
    almuerzo: { cereales: 0, proteina: 0, lacteos: 0, frutas: 0, grasas: 0, verduras: 0 },
    colacion_tarde: { cereales: 0, proteina: 0, lacteos: 0, frutas: 0, grasas: 0, verduras: 0 },
    once: { cereales: 0, proteina: 0, lacteos: 0, frutas: 0, grasas: 0, verduras: 0 },
    cena: { cereales: 0, proteina: 0, lacteos: 0, frutas: 0, grasas: 0, verduras: 0 },
    recena: { cereales: 0, proteina: 0, lacteos: 0, frutas: 0, grasas: 0, verduras: 0 }
  });

  const [visible, setVisible] = useState<Record<string, boolean>>({
    desayuno: true,
    colacion: false,
    almuerzo: true,
    colacion_tarde: false,
    once: true,
    cena: true,
    recena: false
  });

  const [totales, setTotales] = useState({ cal: 0, prot: 0, cho: 0, gras: 0, pP: 0, pC: 0, pF: 0 });
  const [metaCal, setMetaCal] = useState(0);
  const [activeTab, setActiveTab] = useState(false);
  const [diagnostico, setDiagnostico] = useState({ imc: 0, estado: "", color: "" });
  const [mensajeAlerta, setMensajeAlerta] = useState("");
  
  // Estado para la Lista de Compras
  const [listaCompras, setListaCompras] = useState("");
  const [cargandoLista, setCargandoLista] = useState(false);
  const [tabIA, setTabIA] = useState<'menu' | 'lista'>('menu'); 
  
  // --- LÓGICA DEL CHEF IA ---
  const [menuIA, setMenuIA] = useState("");
  const [cargandoIA, setCargandoIA] = useState(false);
  const [mostrarChef, setMostrarChef] = useState(false); // NUEVO: Estado para plegar

    const generarMenuIA = async () => {
      if (!totales.cho || !totales.prot) {
        return alert("Primero calcula las porciones (botón verde).");
      }
   
      setCargandoIA(true);
   
      let detallesComidas = "";
      const ordenComidas = ['desayuno', 'colacion', 'almuerzo', 'colacion_tarde', 'once', 'cena', 'recena'];
   
      ordenComidas.forEach((tiempo) => {
          if (visible[tiempo]) { 
              const porciones = (grid as any)[tiempo];
              let detallePorciones = "";
   
              Object.keys(porciones).forEach((alimento) => {
                  const cantidad = porciones[alimento];
                  if (cantidad > 0) {
                      const nombreAlimento = DISPLAY_LABELS[alimento] || alimento;
                      detallePorciones += `- ${cantidad} porción(es) de ${nombreAlimento}\n`;
                  }
              });
   
              if (detallePorciones) {
                  const nombreComida = MEAL_NAMES[tiempo] || tiempo.toUpperCase();
                  detallesComidas += `\n📌 ${nombreComida}:\n${detallePorciones}`;
              }
          }
      });
   
      let notasExtra = observaciones ? `\n⚠️ NOTAS IMPORTANTES DE LA NUTRICIONISTA: "${observaciones}"` : "";
   
      const prompt = `Actúa como un Chef Nutricionista Experto en cocina chilena.
      Crea un MENÚ DE UN DÍA detallado, realista y apetitoso para un paciente con objetivo: ${datos.objetivo}.
   
      DATOS GLOBALES:
      - Calorías Totales del día: ${Math.round(totales.cal)} kcal.
      
      INSTRUCCIONES DE ARMADO (Usa ESTRICTAMENTE estos ingredientes por comida):
      ${detallesComidas}
   
      ${notasExtra}
   
      REGLAS:
      1. Solo genera las comidas listadas arriba. Si falta la Cena en la lista, NO la inventes.
      2. Usa ingredientes chilenos comunes y preparaciones típicas cuando sea posible.
      3. Si hay "0 porciones" de algo en una comida, no lo incluyas.
      4. Formato de respuesta: Nombre del plato atractivo + Breve descripción de cómo usar los ingredientes asignados.`;
   
      const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
   
      try {
        const respuesta = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                maxOutputTokens: 1200, 
                temperature: 0.7,
              }
            }),
          }
        );
   
        clearTimeout(timeoutId);
   
        if (!respuesta.ok) throw new Error(`Error de Google: ${respuesta.status}`);
   
        const data = await respuesta.json();
        const textoMenu = data.candidates[0].content.parts[0].text;
   
        setMenuIA(textoMenu);
        setCargandoIA(false);
   
      } catch (error: any) {
        if (error.name === 'AbortError') {
          alert("El Chef tardó demasiado. Intenta de nuevo.");
        } else {
          console.error("Falló la conexión:", error);
          alert("Error conectando con el Chef.");
        }
        setCargandoIA(false);
      }
    };

    const generarListaIA = async () => {
      if (!menuIA) return alert("Primero debes generar un Menú con el Chef (botón morado).");
      
      setCargandoLista(true);
      setTabIA('lista'); 
   
      const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || ""; 
      
      const prompt = `Actúa como un Asistente de Compras experto.
      Analiza este MENÚ NUTRICIONAL y crea una LISTA DE COMPRAS consolidada:
      
      "${menuIA}"
      
      INSTRUCCIONES:
      1. Agrupa por pasillo: 🥬 VERDULERÍA, 🥩 CARNICERÍA, 🥫 DESPENSA/ABARROTES, 🥛 LÁCTEOS Y FRIOS.
      2. Suma las cantidades (ej: si hay huevo al desayuno y cena, pon "2 Unidades").
      3. Sé conciso (Solo ingrediente y cantidad estimada).
      4. Formato: Usa viñetas y emojis.`;
   
      try {
        const respuesta = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { maxOutputTokens: 800 } 
            }),
          }
        );
   
        const data = await respuesta.json();
        const textoLista = data.candidates[0].content.parts[0].text;
   
        setListaCompras(textoLista);
        setCargandoLista(false);
   
      } catch (error) {
        console.error(error);
        alert("Error creando la lista.");
        setCargandoLista(false);
      }
    };

  // --- MONITOR DE SESIÓN ÚNICA ---
  useEffect(() => {
    let unsubscribeSnapshot: any = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const sessionID = Math.random().toString(36).substring(7);
        localStorage.setItem("session_token", sessionID);

        const userRef = doc(db, "active_sessions", currentUser.uid);
        await setDoc(userRef, { lastSession: sessionID, email: currentUser.email }, { merge: true });

        unsubscribeSnapshot = onSnapshot(userRef, (doc) => {
          if (doc.exists()) {
            const data = doc.data();
            const localToken = localStorage.getItem("session_token");
            
            if (data.lastSession !== localToken) {
              alert("⚠️ SESIÓN CERRADA: Se ha iniciado sesión en otro dispositivo.");
              handleLogout();
            }
          }
        });

        setUser(currentUser);
      } else {
        setUser(null);
        if (unsubscribeSnapshot) unsubscribeSnapshot();
      }
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  // --- CARGAR DATOS DESDE EL HISTORIAL ---
  useEffect(() => {
    const pautaGuardada = localStorage.getItem("pauta_editar");
    
    if (pautaGuardada) {
      try {
        const data = JSON.parse(pautaGuardada);
        
        // 1. Rellenamos el formulario
        setDatos({
            nombre: data.paciente || "",
            peso: data.peso || "",
            altura: data.altura || "",
            edad: data.edad || "",
            genero: data.genero || "Femenino",
            actividad: data.actividad || "Sedentario",
            objetivo: data.objetivo || "Déficit (Pérdida de Grasa)",
            estrategia: data.estrategia || "Equilibrada (Minsal)",
            restriccion: data.restriccion || "Ninguna"
        });

        // 2. Rellenamos los alimentos
        if (data.alimentos) setGrid(data.alimentos);

        // 3. Rellenamos observaciones
        if (data.observaciones) setObservaciones(data.observaciones);

        // 4. NUEVO: Rellenamos Antropometría
        if (data.antropometria) {
            setAntropometria({ ...data.antropometria, mostrar: true });
        }
        
        localStorage.removeItem("pauta_editar");
        
      } catch (e) {
        console.error("Error al cargar pauta", e);
      }
    }
  }, []);

  // --- FUNCIONES DE AUTENTICACIÓN ---
  const handleLogin = async (e: any) => {
    e.preventDefault();
    setErrorLogin("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      if (error.code === 'auth/invalid-credential') setErrorLogin("🚫 Correo o clave incorrectos");
      else setErrorLogin("❌ Error de conexión.");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  // --- FUNCIÓN GUARDAR PLAN (COMPLETA CON ANTROPO) ---
  const guardarPlan = async () => {
    if (!datos.nombre || datos.nombre.trim() === "") {
      return alert("⚠️ Por favor, ingresa el nombre del paciente antes de guardar.");
    }

    try {
      const pautaID = `${datos.nombre.replace(/\s+/g, '_')}-${Date.now()}`;
      const pautaRef = doc(db, "pautas", pautaID);

      await setDoc(pautaRef, {
        paciente: datos.nombre,
        peso: datos.peso,
        altura: datos.altura,
        edad: datos.edad,
        genero: datos.genero,
        actividad: datos.actividad,
        objetivo: datos.objetivo,
        estrategia: datos.estrategia,
        restriccion: datos.restriccion,
        profesional: nutriNombre,
        fecha: new Date().toISOString(),
        caloriasMeta: metaCal,
        macros: totales,
        alimentos: grid,
        observaciones: observaciones,
        antropometria: antropometria, // Guardamos la antropometría
        creadoPor: user?.email
      });

      alert("✅ ¡Plan de " + datos.nombre + " guardado con éxito!");
    } catch (error) {
      console.error("Error al guardar:", error);
      alert("❌ Error al guardar en la base de datos.");
    }
  };

  // --- HANDLERS ---
  const handleChange = (e: any) => setDatos({ ...datos, [e.target.name]: e.target.value });
  const handleAntro = (e: any) => setAntropometria({...antropometria, [e.target.name]: e.target.value});

  useEffect(() => {
    if(!antropometria.mostrar) return;
    let r = { grasa: 0, amb: 0, riesgo: "", areaGrasa: 0, areaMuscular: 0, porcMusculo: 0, porcGrasaBrazo: 0 };
    
    if(antropometria.cintura) {
        const c = Number(antropometria.cintura);
        if(datos.genero==='masculino') r.riesgo = c>=102 ? "Muy Aumentado" : (c>=94 ? "Aumentado" : "Normal");
        else r.riesgo = c>=88 ? "Muy Aumentado" : (c>=80 ? "Aumentado" : "Normal");
    }
    
    if(antropometria.brazo && antropometria.tricipital) {
        const cb = Number(antropometria.brazo); // cm
        const pt = Number(antropometria.tricipital)/10; // cm
        const pi = Math.PI;
        const atb = (cb * cb) / (4 * pi);
        const ambRaw = Math.pow((cb - (pi * pt)), 2) / (4 * pi);
        r.amb = Math.round(ambRaw - (datos.genero==='masculino' ? 10 : 6.5));
        r.areaGrasa = Math.round(atb - ambRaw);
        if(atb > 0) {
            r.porcMusculo = Math.round((ambRaw / atb) * 100);
            r.porcGrasaBrazo = Math.round(((atb - ambRaw) / atb) * 100);
        }
    }

    if(antropometria.bicipital && antropometria.tricipital && antropometria.subescapular && antropometria.suprailiaco) {
        const sum = Number(antropometria.bicipital)+Number(antropometria.tricipital)+Number(antropometria.subescapular)+Number(antropometria.suprailiaco);
        const log = Math.log10(sum);
        let c=0, m=0;
        if(datos.genero==='masculino') { c=1.1765; m=0.0744; } else { c=1.1567; m=0.0717; }
        r.grasa = Math.round(((495 / (c - (m * log))) - 450)*10)/10;
    }
    setResAntro(r);
  }, [antropometria, datos.genero]);

  const iniciarPlan = (e: any) => {
    e.preventDefault();
    if (!datos.peso || !datos.altura) return alert("Falta Peso/Altura");
    setMensajeAlerta("");

    const imc = Number(datos.peso) / ((Number(datos.altura)/100) ** 2);
    let estado = "Normal";
    let color = "bg-green-100 text-green-700 border-green-200";
    
    if (imc < 18.5) { estado = "Bajo Peso (Peligro)"; color = "bg-red-100 text-red-700 border-red-200"; }
    else if (imc >= 25 && imc < 30) { estado = "Sobrepeso"; color = "bg-yellow-100 text-yellow-700 border-yellow-200"; }
    else if (imc >= 30) { estado = "Obesidad"; color = "bg-orange-100 text-orange-700 border-orange-200"; }
    
    setDiagnostico({ imc: parseFloat(imc.toFixed(1)), estado, color });

    let bmr = (10 * Number(datos.peso)) + (6.25 * Number(datos.altura)) - (5 * Number(datos.edad)) + (datos.genero === "masculino" ? 5 : -161);
    const factores: any = { sedentario: 1.2, moderado: 1.55, intenso: 1.725 };
    let cal = Math.round(bmr * factores[datos.actividad]);
    
    if (imc < 18.5) {
        cal += 500; 
        setMensajeAlerta("🚨 ALERTA: Paciente Bajo Peso. Dieta Recuperación (+500 kcal).");
    } else {
        if (datos.objetivo === "bajar") cal -= 400;
        if (datos.objetivo === "subir") {
            if (datos.actividad === "sedentario") cal += 0; 
            else { if (datos.genero === "femenino") cal += 200; else cal += 350; }
        }
    }
    
    const minCal = datos.genero === "masculino" ? 1500 : 1200;
    if (imc < 18.5 && cal < 1600) cal = 1600; 
    else if (cal < minCal) cal = minCal;

    setMetaCal(cal);
    const necesitaColacion = cal > 2200;
    
    setVisible({
        desayuno: true,
        colacion: necesitaColacion,
        almuerzo: true,
        colacion_tarde: false,
        once: true,
        cena: true,
        recena: false
    });

    const est = ESTRATEGIAS[datos.estrategia];
    const metaProtG = (cal * (est.p / 100)) / 4;
    const metaGrasG = (cal * (est.f / 100)) / 9;

    const p = { lacteos: 2, frutas: 2, verduras: 2, proteina: 0, cereales: 0, grasas: 0 };
    
    if (datos.estrategia === 'lowcarb' || datos.estrategia === 'bariatrica') p.frutas = 1;
    if (datos.estrategia === 'mediterranea') p.grasas += 2; 
    if (necesitaColacion) p.lacteos = 3;

    const aporteProtFijos = (p.lacteos * MACROS_PORCION.lacteos.prot) + (p.verduras * MACROS_PORCION.verduras.prot);
    
    let factorProt = 2.0; 
    if (datos.genero === "femenino") factorProt = 1.8;
    if (datos.actividad === "sedentario") factorProt = 1.5; 
    
    const maxProt = Number(datos.peso) * factorProt; 
    let targetProt = Math.min(metaProtG, maxProt);
    if(targetProt < 60) targetProt = 65; 

    p.proteina = Math.max(3, Math.round((targetProt - aporteProtFijos) / MACROS_PORCION.proteina.prot));

    const aporteGrasFijos = (p.proteina * MACROS_PORCION.proteina.gras); 
    let grasasCalc = Math.round((metaGrasG - aporteGrasFijos) / MACROS_PORCION.grasas.gras);
    if( (aporteGrasFijos + grasasCalc*5) < 45 ) grasasCalc = Math.ceil((45-aporteGrasFijos)/5); 
    p.grasas = Math.max(2, grasasCalc);

    const calGastadas = (p.lacteos * 70) + (p.frutas * 65) + (p.verduras * 25) + (p.proteina * 65) + (p.grasas * 45);
    const calDisponibles = Math.max(0, cal - calGastadas);
    p.cereales = Math.round(calDisponibles / 140);

    const newGrid = {
      desayuno: { cereales: 0, proteina: 0, lacteos: 0, frutas: 0, grasas: 0, verduras: 0 },
      colacion: { cereales: 0, proteina: 0, lacteos: 0, frutas: 0, grasas: 0, verduras: 0 },
      almuerzo: { cereales: 0, proteina: 0, lacteos: 0, frutas: 0, grasas: 0, verduras: 0 },
      colacion_tarde: { cereales: 0, proteina: 0, lacteos: 0, frutas: 0, grasas: 0, verduras: 0 },
      once: { cereales: 0, proteina: 0, lacteos: 0, frutas: 0, grasas: 0, verduras: 0 },
      cena: { cereales: 0, proteina: 0, lacteos: 0, frutas: 0, grasas: 0, verduras: 0 },
      recena: { cereales: 0, proteina: 0, lacteos: 0, frutas: 0, grasas: 0, verduras: 0 }
    };

    const repartir = (key: string, total: number, slots: string[]) => {
      let i = 0;
      while(total > 0) { (newGrid as any)[slots[i % slots.length]][key]++; total--; i++; }
    };

    repartir("proteina", p.proteina, ["almuerzo", "cena", "desayuno", "once"]);
    repartir("verduras", p.verduras, ["almuerzo", "cena"]);

    if(necesitaColacion) {
        repartir("lacteos", p.lacteos, ["desayuno", "once", "colacion"]);
        repartir("frutas", p.frutas, ["colacion", "desayuno", "once"]);
    } else {
        repartir("lacteos", p.lacteos, ["desayuno", "once"]);
        repartir("frutas", p.frutas, ["once", "desayuno"]);
    }

    repartir("grasas", p.grasas, ["almuerzo", "cena", "once", "desayuno"]);

    let slotsC = ["desayuno", "almuerzo", "once", "cena"];
    if(necesitaColacion) slotsC.push("colacion");
    if(datos.estrategia === "lowcarb" || datos.estrategia === "bariatrica") slotsC = ["almuerzo", "desayuno", "once"];
    repartir("cereales", p.cereales, slotsC);

    setGrid(newGrid);
    setActiveTab(true);
  };

  useEffect(() => {
    let t = { cal: 0, prot: 0, cho: 0, gras: 0 };
    Object.keys(grid).forEach((key) => {
        if(visible[key]) {
            const comida = (grid as any)[key];
            Object.keys(comida).forEach((k) => {
                const cant = comida[k];
                const val = MACROS_PORCION[k as keyof typeof MACROS_PORCION];
                if(val) { t.cal += cant*val.cal; t.prot += cant*val.prot; t.cho += cant*val.cho; t.gras += cant*val.gras; }
            });
        }
    });
    t.cal += 50; 
    setTotales({
      ...t,
      pP: Math.round((t.prot * 4 / (t.cal||1)) * 100),
      pC: Math.round((t.cho * 4 / (t.cal||1)) * 100),
      pF: Math.round((t.gras * 9 / (t.cal||1)) * 100)
    });
  }, [grid, visible]);

  const ajustar = (tiempo: string, grupo: string, delta: number) => {
    setGrid(prev => {
      const valorActual = (prev[tiempo as keyof typeof prev] as any)[grupo];
      const nuevoValor = Math.max(0, Math.round((valorActual + delta) * 10) / 10);
      return { ...prev, [tiempo]: { ...prev[tiempo as keyof typeof prev], [grupo]: nuevoValor } };
    });
  };

  const toggleMeal = (meal: string) => {
      setVisible(prev => ({...prev, [meal]: !prev[meal]}));
  };

  const mostrarRecomendacionLegumbres = !['fodmap', 'reflujo', 'gota'].includes(datos.restriccion);
  const textoLegumbres = mostrarRecomendacionLegumbres 
    ? "\n💡 *RECOMENDACIÓN INTA/OMS:* Consume legumbres (porotos, lentejas, garbanzos) al menos 2 veces por semana en reemplazo de la carne. (Aprox 2 tazas cocidas por plato)."
    : "\n⚠️ *NOTA DIGESTIVA:* Si consumes legumbres, prefiérelas peladas o pasadas por cedazo para evitar malestar.";

  const copiarPauta = () => {
    const peso = Number(datos.peso) || 60;
    const aguaMl = Math.round(peso * 35);
    const vasos = Math.round(aguaMl / 250);
    
    let mensajeHidratacion = `💧 *TU HIDRATACIÓN META:* \n• ${aguaMl} ml al día (Aprox. ${vasos} vasos).`;
    if (datos.restriccion === "gota") mensajeHidratacion += "\n⚠️ *IMPORTANTE:* Debes aumentar tu consumo de agua para ayudar a eliminar el ácido úrico.";
    else if (datos.actividad === "intenso") mensajeHidratacion += "\n⚡ *DEPORTE:* Recuerda reponer líquidos (500ml extra) por cada hora de entrenamiento intenso.";

    let sosTexto = datos.restriccion === "vegano" 
        ? `🆘 *¿HAMBRE O ANSIEDAD EXTRA? (Opciones SOS Veganas)*\n• Jalea Vegetal (Agar Agar) Light\n• Bastones de Apio/Pepino\n• Té/Café/Mate sin azúcar`
        : `🆘 *¿HAMBRE O ANSIEDAD EXTRA? (Opciones SOS Libres)*\n• Jalea Light / Zero\n• Bastones de Apio/Pepino\n• Caldo de Huesos/Verduras\n• Té/Café/Mate sin azúcar`;

    const tr = (k: string, n: number) => {
       if (k === 'verduras') { if (n === 0) return "🥗 Base: Solo Libres (A gusto)"; return `🥗 ${n} Taza General (+ Libres a gusto)`; }
       if (n===0) return "";
       const ejemplo = FOOD_EXAMPLES[k]?.[datos.restriccion] || "";
       const emo: any = {cereales:"🍞", proteina:"🍗", lacteos:"🥛", frutas:"🍎", grasas:"🥑", verduras:"🥗"};
       let label = DISPLAY_LABELS[k] || k.toUpperCase();
       let unit = n === 1 ? "Porción" : "Porciones"; 
       return `${emo[k]} ${n} ${unit} ${label}${ejemplo}`;
    };

    const fmt = (c: any) => {
      let txt = [];
      if(c.hasOwnProperty('verduras')) txt.push(tr('verduras', c.verduras));
      if(c.cereales) txt.push(tr('cereales', c.cereales));
      if(c.proteina) txt.push(tr('proteina', c.proteina));
      if(c.lacteos) txt.push(tr('lacteos', c.lacteos));
      if(c.frutas) txt.push(tr('frutas', c.frutas));
      if(c.grasas) txt.push(tr('grasas', c.grasas));
      return txt.join("\n");
    };

    let firma = nutriNombre ? `\n\n_Pauta diseñada por: ${nutriNombre}_` : "";
    let textoObservaciones = observaciones ? `\n📝 *INDICACIONES ESPECIALES:*\n${observaciones}\n` : "";

    let t = `📄 *PLAN NUTRICIONAL - ${datos.nombre}*
🎯 Meta: ${OBJETIVOS_LABELS[datos.objetivo].toUpperCase()} (${totales.cal} kcal)
⚠️ Estrategia: ${ESTRATEGIAS[datos.estrategia].label.toUpperCase()}

${mensajeHidratacion}

🍽️ *TU ESTRUCTURA DIARIA:*
`;

    const order = ['desayuno', 'colacion', 'almuerzo', 'colacion_tarde', 'once', 'cena', 'recena'];
    order.forEach(k => {
        if(visible[k]) t += `\n${MEAL_NAMES[k]}:\n${fmt((grid as any)[k]) || "☕ Té/Café (Libre)"}\n`;
    });

    t += `\n${sosTexto}
${textoLegumbres}
${textoObservaciones}
${firma}`;

    navigator.clipboard.writeText(t);
    alert("✅ Pauta copiada al portapapeles");
  };

  const copiarGuia = () => {
    let firma = nutriNombre ? `\n\n_Guía entregada por: ${nutriNombre}_` : "";
    let t = `📚 *GUÍA MAESTRA DE PORCIONES*
📏 *Referencia Clave:* 1 Taza = 200ml (NO Tazón).

🍲 *LEGUMBRES (El "Super Alimento")*
• En esta pauta, las legumbres cuentan como "Cereal + Proteína".
• Porción: 1 Taza cocida (reemplaza a la carne en el almuerzo).

🥗 *VERDURAS*
✅ *LIBRES:* Lechuga, Apio, Repollo, Pepino, Espinaca.
⚠️ *GENERALES (1 Taza):* Tomate, Zanahoria, Betarraga, Zapallo.

🍞 *CEREALES Y PAN (1 Porción =)*
• 1/2 Marraqueta/Hallulla (sin miga) | 2 Pan Molde
• 3/4 Taza Arroz/Fideos/Quinoa | 1 Papa regular

🍗 *PROTEÍNAS / CARNES (1 Porción =)*
• 1 Huevo | 50g Carne/Pollo/Pavo | 1 Lata Atún chica
• Vegano: 3/4 Taza Legumbres | 80g Tofu

🥛 *LÁCTEOS (1 Porción =)*
• 1 Taza (200ml) Leche | 1 Yoghurt (125-150g) | 1 trozo Quesillo

🥑 *ACEITES Y GRASAS (1 Porción =)*
• 1 cdta Aceite | 3 cdas Palta | 10 Almendras

${firma}`;
    navigator.clipboard.writeText(t);
    alert("✅ Guía de Porciones copiada al portapapeles"); 
  };

  const imprimirProfesional = () => {
    const win: any = window.open("", "_blank");
    
    const peso = Number(datos.peso) || 60;
    const aguaMl = Math.round(peso * 35);
    const vasos = Math.round(aguaMl / 250);
    let msjAguaExtra = "";
    if (datos.restriccion === "gota") msjAguaExtra = "<br/>⚠️ <b>Patología:</b> Ingesta crítica por Gota.";
    
    const renderComida = (comida: any) => {
        let items = "";
        for (const [key, cant] of Object.entries(comida)) {
            if(Number(cant) > 0) {
                let nombre = DISPLAY_LABELS[key] || key.toUpperCase(); 
                let medida = MACROS_PORCION[key as keyof typeof MACROS_PORCION]?.medida || "";
                let ejemplo = key === 'verduras' ? "(+ Libres)" : (FOOD_EXAMPLES[key]?.[datos.restriccion] || "");
                let unit = Number(cant) === 1 ? "Porción" : "Porciones";
                items += `<li style="margin-bottom:2px;"><b>${cant} ${unit} ${nombre}</b> <span style="color:#666;font-size:0.85em;">(${medida})</span> <i style="color:#888;">${ejemplo}</i></li>`;
            }
        }
        return items || "<li style='color:#aaa; font-style:italic;'>Consumo libre (Agua, Té, Café)</li>";
    };

    const htmlObservaciones = observaciones ? `<div style="margin-top:15px; border:2px solid #fbbf24; background-color: #fffbeb; padding:15px; border-radius:8px;"><h4 style="margin:0 0 5px 0; color:#b45309; font-size:12px; text-transform:uppercase;">📝 Indicaciones del Especialista</h4><p style="margin:0; font-size:11px; color:#451a03; white-space: pre-line;">${observaciones}</p></div>` : "";

    const htmlAntro = (antropometria.mostrar && resAntro.grasa > 0) ? `
        <div style="margin-top:15px; border:1px solid #cbd5e1; background-color: #f8fafc; padding:15px; border-radius:8px;">
            <h4 style="margin:0 0 8px 0; color:#334155; font-size:12px; text-transform:uppercase;">📊 Diagnóstico de Composición Corporal</h4>
            <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:10px; text-align:center;">
                <div><span style="font-size:10px; color:#64748b;">% Grasa (Total)</span><br/><strong style="font-size:14px;">${resAntro.grasa}%</strong></div>
                <div><span style="font-size:10px; color:#64748b;">% Muscular (Brazo)</span><br/><strong style="font-size:14px; color:#16a34a;">${resAntro.porcMusculo}%</strong></div>
                <div><span style="font-size:10px; color:#64748b;">% Grasa (Brazo)</span><br/><strong style="font-size:14px; color:#ea580c;">${resAntro.porcGrasaBrazo}%</strong></div>
                <div><span style="font-size:10px; color:#64748b;">Riesgo Cardio</span><br/><strong style="font-size:12px; color:${resAntro.riesgo.includes('Aumentado') ? 'red' : 'green'};">${resAntro.riesgo}</strong></div>
            </div>
        </div>` : "";

    const guiasFiltradas = GUIAS_INTA.filter(g => !g.exclude.some(r => datos.restriccion.includes(r)));
    const htmlGuiasInta = `
        <div style="margin-top:20px; page-break-inside: avoid;">
            <h3 style="color:#2563EB; border-bottom:1px solid #eee; font-size: 14px; margin-bottom: 10px; text-transform:uppercase;">✅ Decálogo de Salud (INTA/Minsal)</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                ${guiasFiltradas.map(g => `
                    <div style="display:flex; gap:8px; align-items:start; background:#f8fafc; padding:8px; border-radius:6px; border:1px solid #e2e8f0;">
                        <span style="font-size:16px;">${g.icon}</span>
                        <span style="font-size:10px; color:#334155; line-height:1.3;">${g.text}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    const mostrarConsejoDulce = !['diabetes', 'resistencia', 'higado', 'colesterol', 'hipertension'].includes(datos.restriccion);
    
    let htmlMeals = "";
    const order = ['desayuno', 'colacion', 'almuerzo', 'colacion_tarde', 'once', 'cena', 'recena'];
    order.forEach(k => {
        if(visible[k]) htmlMeals += `<div class="meal-section"><div class="meal-title">${MEAL_NAMES[k]}</div><ul>${renderComida((grid as any)[k])}</ul></div>`;
    });

    const textoManual = `
    <div style="page-break-before: always; padding-top: 20px;">
        <div class="header"><div class="brand"><h1>Manual de Uso del Plan</h1><p>Guía para el Éxito</p></div></div>
        <div style="display: grid; grid-template-columns: 1fr; gap: 20px;">
            <div class="guide-box"><h3 style="color:#2563EB; border-bottom:1px solid #eee; font-size: 14px; margin-bottom: 5px;">1. FLEXIBILIDAD Y HORARIOS</h3><p style="font-size:11px; color:#444; margin-top:2px;">La pauta te indica <b>QUÉ</b> comer, tú decides <b>CUÁNDO</b>. Puedes juntar colaciones con comidas principales. Lo importante es cumplir los totales.</p></div>
            <div class="guide-box"><h3 style="color:#2563EB; border-bottom:1px solid #eee; font-size: 14px; margin-bottom: 5px;">2. CÓMO ARMAR TU PLATO</h3><p style="font-size:11px; color:#444; margin-top:2px;">Si tu almuerzo dice: <b>2 Proteínas + 2 Cereales</b>, puedes elegir: 2 Huevos + 1 taza Arroz, O BIEN, 100g Pollo + 1 Papa grande.</p></div>
            
            <div class="guide-box">
                <h3 style="color:#2563EB; border-bottom:1px solid #eee; font-size: 14px; margin-bottom: 5px;">3. LÍQUIDOS</h3>
                <p style="font-size:11px; color:#444; margin-top:2px;">
                    Agua libre. Té, Café y Mate: Idealmente sin azúcar. Si usas endulzante, <b>el desafío es usar la mitad de gotas que usas hoy</b>. ¿Por qué? El exceso de dulzor (aunque sea light) engaña a tu cerebro y te genera más ansiedad por comer cosas ricas.
                </p>
            </div>
            
            <div class="guide-box">
                <h3 style="color:#2563EB; border-bottom:1px solid #eee; font-size: 14px; margin-bottom: 5px;">🍷 VIDA SOCIAL Y EQUILIBRIO</h3>
                <p style="font-size:11px; color:#444; margin-top:2px;">
                    Esta pauta es una guía, no una jaula. Si tienes un asado o cumpleaños: <b>Disfruta.</b> Prioriza proteínas y ensaladas, pero no te aísles ni lleves tupper. Lo que define tu éxito es lo que haces el 90% del tiempo, no esa comida especial. ¡Sin culpa!
                </p>
            </div>

            <div class="guide-box" style="border: 1px solid #fed7aa; background-color: #fff7ed;">
                <h3 style="color:#c2410c; border-bottom:1px solid #fed7aa; font-size: 14px; margin-bottom: 5px;">🕵️‍♀️ DETECTIVE DE ETIQUETAS</h3>
                <p style="font-size:11px; color:#7c2d12; margin-top:2px;">
                    <b>Evita los Ultraprocesados:</b> Si un producto tiene más de 5 ingredientes y no puedes pronunciar el tercero, probablemente no es comida real. <br/>
                    <b>Ojo con los sellos:</b> Prefiere alimentos SIN sellos negros "ALTOS EN".<br/>
                    <b>Azúcar oculta:</b> Cuidado con la "Maltodextrina", "Jarabe de Maíz" o "Dextrosa", son nombres disfrazados del azúcar.
                </p>
            </div>
        </div>
        
        ${htmlGuiasInta}

        <div class="footer">Página 3 de 3 - Manual de apoyo</div>
    </div>`;

    const htmlGuia = `
    <div style="page-break-before: always; padding-top: 20px;">
        <div class="header"><div class="brand"><h1>Guía Maestra de Porciones</h1><p>Lista de Intercambio</p></div></div>
        
        <div style="background:#ecfdf5; border:1px solid #10b981; padding:10px; border-radius:5px; margin-bottom:15px; font-size:11px; color:#064e3b;">
            💡 <b>LEGUMBRES:</b> Reemplazan a la carne. 1 Taza = Porción de Cereal + Proteína.
        </div>
        <div style="background:#fff7ed; border:1px solid #f97316; padding:10px; border-radius:5px; margin-bottom:15px; font-size:11px; color:#c2410c;">
            📏 <b>MEDIDA CLAVE:</b> 1 Taza = 200ml (Taza de té). Un tazón grande son 2 porciones.
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
            
            <div class="guide-box" style="border:1px solid #eee; padding:8px; border-radius:5px;">
                <h3 style="color:#2563EB; border-bottom:1px solid #ddd; font-size: 11px; margin-bottom: 5px; text-transform:uppercase;">🍞 CEREALES (1 Porc)</h3>
                <ul style="padding-left:12px; font-size:10px; color:#444;">
                    <li>1/2 Marraqueta / Hallulla (50g)</li>
                    <li>2 Reb. Pan Molde (60g)</li>
                    <li>1.5 Unid. Pan Pita (60g)</li>
                    <li>6 Galletas Soda / Agua / Salvado</li>
                    <li>3/4 Taza Arroz / Fideos (Cocido)</li>
                    <li>3/4 Taza Quinoa / Choclo / Habas / Arvejas</li>
                    <li>1 Papa Regular / 3/4 Taza Puré</li>
                    <li>3/4 Taza Avena / Granola / Cereales</li>
                </ul>
            </div>

            <div class="guide-box" style="border:1px solid #eee; padding:8px; border-radius:5px;">
                <h3 style="color:#2563EB; border-bottom:1px solid #ddd; font-size: 11px; margin-bottom: 5px; text-transform:uppercase;">🍗 PROTEÍNAS (1 Porc)</h3>
                <ul style="padding-left:12px; font-size:10px; color:#444;">
                    <li>1 Huevo Grande / 2 Claras</li>
                    <li>50g Pollo / Pavo / Posta (Magro)</li>
                    <li>1 Lata Atún (Agua) Pequeña</li>
                    <li>80g Pescado (Reineta/Merluza)</li>
                    <li>3/4 Taza Legumbres (Lentejas/Porotos)</li>
                    <li>1/2 Taza Carne Soya / 80g Tofu</li>
                    <li>1 Lámina Queso Mantecoso / 2 Jamón Pavo</li>
                </ul>
            </div>

            <div class="guide-box" style="border:1px solid #eee; padding:8px; border-radius:5px;">
                <h3 style="color:#2563EB; border-bottom:1px solid #ddd; font-size: 11px; margin-bottom: 5px; text-transform:uppercase;">🥛 LÁCTEOS (1 Porc)</h3>
                <ul style="padding-left:12px; font-size:10px; color:#444;">
                    <li>1 Taza Leche Descremada (200ml)</li>
                    <li>1 Unidad Yoghurt Light/Protein (125g)</li>
                    <li>1 Taza Leche Cultivada</li>
                    <li>1 Trozo Quesillo (3x3cm / 60g)</li>
                    <li>1 Rebanada Queso Fresco</li>
                    <li>1 Taza Bebida Vegetal (Soya/Almendra)</li>
                </ul>
            </div>

            <div class="guide-box" style="border:1px solid #eee; padding:8px; border-radius:5px;">
                <h3 style="color:#2563EB; border-bottom:1px solid #ddd; font-size: 11px; margin-bottom: 5px; text-transform:uppercase;">🍎 FRUTAS (1 Porc)</h3>
                <ul style="padding-left:12px; font-size:10px; color:#444;">
                    <li>1 Manzana / Pera / Naranja (Regular)</li>
                    <li>2 Kiwis / Clementinas / Duraznos / Tunas</li>
                    <li>1 Taza Frutillas / Frambuesas / Melón / Sandía</li>
                    <li>1/2 Plátano / 1/2 Mango</li>
                    <li>12-15 Uvas / Cerezas</li>
                    <li>3/4 Taza Piña Picada</li>
                </ul>
            </div>

            <div class="guide-box" style="border:1px solid #eee; padding:8px; border-radius:5px;">
                <h3 style="color:#2563EB; border-bottom:1px solid #ddd; font-size: 11px; margin-bottom: 5px; text-transform:uppercase;">🥑 GRASAS (1 Porc)</h3>
                <ul style="padding-left:12px; font-size:10px; color:#444;">
                    <li>1 cdta Aceite (Oliva/Canola/Maravilla)</li>
                    <li>3 cdas Palta (molida) / 1/4 Unidad</li>
                    <li>25 Almendras / 5 Nueces / 30 Maní (sin sal)</li>
                    <li>11 Aceitunas</li>
                    <li>1 cda Semillas (Chia/Linaza/Zapallo)</li>
                    <li>2 cdas Queso Crema Light / Mayonesa Light</li>
                </ul>
            </div>

            <div class="guide-box" style="border:1px solid #eee; padding:8px; border-radius:5px;">
                <h3 style="color:#2563EB; border-bottom:1px solid #ddd; font-size: 11px; margin-bottom: 5px; text-transform:uppercase;">🥗 VERDURAS</h3>
                <ul style="padding-left:12px; font-size:10px; color:#444;">
                    <li><b>LIBRES (A gusto):</b> Lechuga, Apio, Repollo, Pepino, Espinaca (cruda), Zapallito Italiano (crudo), Rúcula, Acelga, Pimentón, Rabanitos.</li>
                    <li style="margin-top:4px;"><b>GENERAL (1 Taza = 1 Porc):</b> Tomate, Zanahoria, Betarraga, Porotos Verdes, Zapallo Camote, Brócoli, Coliflor, Berenjena, Champiñones, Alcachofa.</li>
                </ul>
            </div>

        </div>
        <div class="footer">Página 2 de 3 - Guía de apoyo clínico</div>
    </div>`;

    const htmlContent = `
      <html>
        <head>
          <title>Plan Nutricional - ${datos.nombre}</title>
          <style>
            @media print {
                @page { size: A4; margin: 10mm; }
                body { padding: 0; font-size: 10.5px; } 
                .header { margin-bottom: 10px; padding-bottom: 5px; } 
                .meta-box { padding: 8px; margin-bottom: 10px; } 
                .meal-section { margin-bottom: 8px; break-inside: avoid; } 
                .meal-title { padding: 2px 8px; font-size: 11px; } 
                ul { padding-left: 15px; margin: 0; }
                li { margin-bottom: 1px; }
                h1 { font-size: 18px; margin: 0; }
                p { margin: 0; }
            }
            body { font-family: 'Helvetica', sans-serif; padding: 30px; color: #333; max-width: 800px; margin: 0 auto; }
            .header { border-bottom: 2px solid #2563EB; padding-bottom: 10px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: flex-end; }
            .brand h1 { margin: 0; color: #2563EB; font-size: 20px; }
            .brand p { margin: 0; color: #666; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; }
            .meta-box { background: #F8FAFC; padding: 10px; border-radius: 6px; border-left: 4px solid #2563EB; margin-bottom: 15px; display: flex; justify-content: space-between; }
            .stat { text-align: center; }
            .stat label { display: block; font-size: 9px; text-transform: uppercase; color: #888; margin-bottom: 2px; }
            .stat val { display: block; font-size: 14px; font-weight: bold; color: #333; }
            .meal-section { margin-bottom: 12px; }
            .meal-title { background: #334155; color: white; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: bold; margin-bottom: 5px; }
            ul { list-style: none; padding-left: 5px; margin: 0; }
            .footer { margin-top: 20px; border-top: 1px solid #eee; padding-top: 10px; text-align: center; font-size: 9px; color: #999; }
            .guide-box ul { font-size: 10px; color: #444; margin-top: 2px; padding-left: 10px; list-style-type: disc;}
            .guide-box li { margin-bottom: 2px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="brand"><h1>Plan de Alimentación</h1><p>Clínico & Personalizado</p></div>
            <div style="text-align:right;"><div style="font-size: 14px;"><b>${datos.nombre}</b></div><div style="font-size:10px; color:#666;">${new Date().toLocaleDateString()}</div></div>
          </div>

          <div class="meta-box">
             <div class="stat"><label>Objetivo</label><val>${datos.objetivo.toUpperCase()}</val></div>
             <div class="stat"><label>Calorías</label><val>${Math.round(totales.cal)} kcal</val></div>
             <div class="stat"><label>Proteína</label><val>${totales.prot}g</val></div>
             <div class="stat"><label>Carbos</label><val>${totales.cho}g</val></div>
             <div class="stat"><label>Grasas</label><val>${totales.gras}g</val></div>
          </div>

          ${htmlAntro}

          <div style="margin-bottom:20px; margin-top:15px; background:#e0f2fe; border:1px solid #0ea5e9; padding:10px; border-radius:6px; display:flex; justify-content:space-between; align-items:center;">
             <div><span style="font-weight:bold; color:#0369a1; font-size:12px;">💧 META DE HIDRATACIÓN</span><div style="font-size:10px; color:#0c4a6e;">Consumo diario recomendado.</div></div>
             <div style="text-align:right;"><span style="display:block; font-size:16px; font-weight:bold; color:#0284c7;">${aguaMl} ml</span><span style="font-size:10px; color:#0369a1;">(Aprox. ${vasos} vasos)</span><span style="font-size:9px; color:red;">${msjAguaExtra}</span></div>
          </div>

          ${htmlMeals}

          <div style="margin-top:10px; padding:10px; background:#eff6ff; border-radius:5px; font-size:10px; color:#1e3a8a;">
             ${mostrarRecomendacionLegumbres ? "💡 <b>TIP NUTRICIONAL:</b> Consume legumbres al menos 2 veces por semana." : "⚠️ <b>NOTA:</b> Cuidado con las legumbres si tienes malestar digestivo."}
          </div>

          ${htmlObservaciones}

          <div class="footer">Página 1 de 3 | Elaborado por ${nutriNombre || "Tu Especialista en Nutrición"}.</div>
          ${htmlGuia}
          ${textoManual}
          <script>setTimeout(() => { window.print(); }, 800);</script>
        </body>
      </html>
    `;
    win.document.write(htmlContent);
    win.document.close();
  };

  const getCalColor = () => {
    const diff = Math.abs(totales.cal - metaCal);
    if(diff > 500) return "text-red-600 animate-pulse";
    if(diff > 200) return "text-orange-500";
    return "text-slate-800";
  };

  const getBarColor = (current: number, meta: number, baseColor: string) => {
    if(current > (meta + 5)) return "bg-red-500";
    if(current < (meta / 2)) return "bg-slate-300";
    return baseColor;
  };

  const getDiagnosticoTiempoReal = () => {
    const diff = totales.cal - metaCal;
    const absDiff = Math.abs(diff);
    
    if (absDiff > 500) {
        return diff > 0 
            ? { msg: `🚨 ALERTA CRÍTICA: Exceso Severo (+${diff} kcal)`, color: "bg-red-600 text-white animate-pulse" }
            : { msg: `🚨 ALERTA CRÍTICA: Déficit Severo (-${absDiff} kcal)`, color: "bg-red-600 text-white animate-pulse" };
    }
    if (absDiff > 200) {
        return diff > 0 
            ? { msg: `⚠️ Desviación Moderada (+${diff} kcal)`, color: "bg-orange-100 text-orange-700 border border-orange-200" }
            : { msg: `⚠️ Faltan Calorías (-${absDiff} kcal)`, color: "bg-yellow-100 text-yellow-700 border border-yellow-200" };
    }

    const metaC = ESTRATEGIAS[datos.estrategia].c;
    const metaP = ESTRATEGIAS[datos.estrategia].p;
    
    if (totales.pC > (metaC + 10)) return { msg: "🍞 Cuidado: Exceso de Carbohidratos (Revisar Cereales/Fruta)", color: "bg-orange-50 text-orange-600 border border-orange-200" };
    if (totales.pP < (metaP - 10)) return { msg: "💪 Falta Proteína (Aumentar Huevo/Carne/Legumbres)", color: "bg-blue-50 text-blue-600 border border-blue-200" };

    return { msg: "✅ Plan Balanceado y Ajustado", color: "bg-green-100 text-green-700 border border-green-200" };
  };
  
  const diagVisual = getDiagnosticoTiempoReal();

  // --- Si está cargando, muestra espera ---
  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-400">Cargando seguridad...</div>;

  // --- Si NO hay usuario, muestra Login ---
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white max-w-sm w-full rounded-2xl shadow-xl overflow-hidden border border-slate-200">
          <div className="bg-blue-600 p-8 text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">NutriPlannerIA</h1>
            <p className="text-blue-100 text-xs">Acceso Restringido</p>
          </div>
          
          <form onSubmit={handleLogin} className="p-8 space-y-5">
            <div>
              <label className="block text-xs font-black text-black uppercase mb-1 tracking-wide">Correo Electrónico</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-black" />
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  className="w-full pl-9 pr-3 py-2 border-2 border-slate-300 rounded-lg text-sm text-black font-bold outline-none focus:border-blue-600 placeholder:text-slate-400" 
                  placeholder="usuario@ejemplo.com" 
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-black uppercase mb-1 tracking-wide">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-black" />
                <input 
                  type={verClave ? "text" : "password"} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className="w-full pl-9 pr-10 py-2 border-2 border-slate-300 rounded-lg text-sm text-black font-bold outline-none focus:border-blue-600 placeholder:text-slate-400" 
                  placeholder="••••••••" 
                />
                <button type="button" onClick={() => setVerClave(!verClave)} className="absolute right-3 top-2.5 text-slate-500 hover:text-black">
                  {verClave ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {errorLogin && (
              <div className="p-3 bg-red-100 border-2 border-red-200 rounded-lg flex items-center gap-2 animate-pulse">
                <span className="text-red-700 font-bold text-xs">{errorLogin}</span>
              </div>
            )}

            <button type="submit" className="w-full bg-blue-700 hover:bg-blue-800 text-white font-black py-3 rounded-lg shadow-lg transition-all active:scale-[0.98]">
              INGRESAR AL SISTEMA
            </button>
          </form>
          
          <div className="bg-slate-50 p-4 text-center border-t border-slate-200">
            <p className="text-[10px] text-slate-500 font-medium">Protegido por Google Firebase Security™</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 py-8 px-4 font-sans text-slate-800 flex justify-center">
      <div className="w-full max-w-[95%] grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* --- COLUMNA 1: DATOS DEL PACIENTE (Compacta) --- */}
        <section className="lg:col-span-2 bg-white p-4 rounded-2xl shadow-lg border border-slate-200 h-fit sticky top-4 flex flex-col gap-4">
            
            {/* ENCABEZADO COMPACTO */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                    <h1 className="font-black text-lg text-blue-700 leading-tight">NutriPlannerIA</h1>
                    <p className="text-[10px] text-slate-400 font-medium">Panel Clínico Pro</p>
                </div>
                <Link href="/historial" className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors" title="Ver Historial">
                    <FileText className="w-4 h-4" />
                </Link>
            </div>

            <div className="bg-blue-50 p-2.5 rounded-lg border border-blue-100">
                <label className="text-[9px] font-bold text-blue-800 uppercase block mb-1">Tu Nombre (Firma)</label>
                <input 
                    className="w-full border border-blue-200 rounded px-2 py-1 text-xs text-blue-900 bg-white placeholder-blue-300 h-7" 
                    placeholder="Ej: Nut. María Pérez" 
                    value={nutriNombre} 
                    onChange={(e) => setNutriNombre(e.target.value)} 
                />
            </div>

            <form onSubmit={iniciarPlan} className="flex flex-col gap-3">
                <Input label="Nombre Paciente" name="nombre" value={datos.nombre} onChange={handleChange} placeholder="Nombre completo" />
                
                <div className="grid grid-cols-2 gap-3">
                    <Input label="Peso (kg)" name="peso" type="number" value={datos.peso} onChange={handleChange} />
                    <Input label="Altura (cm)" name="altura" type="number" value={datos.altura} onChange={handleChange} />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                    <Input label="Edad" name="edad" type="number" value={datos.edad} onChange={handleChange} />
                    <Select label="Sexo" name="genero" value={datos.genero} onChange={handleChange}>
                        <option value="masculino">Masculino</option>
                        <option value="femenino">Femenino</option>
                    </Select>
                </div>
                
                <div className="bg-orange-50 p-2 rounded-lg border border-orange-100">
                    <Select label="Restricción / Alergia" name="restriccion" value={datos.restriccion} onChange={handleChange} className="bg-transparent font-bold text-orange-800 text-xs h-7 border-0">
                        <option value="normal">Ninguna</option>
                        <option value="celiaco">Celiaco (Sin Gluten)</option>
                        <option value="lactosa">Intolerante Lactosa</option>
                        <option value="vegetariano">Vegetariano</option>
                        <option value="vegano">Vegano</option>
                        <option value="fodmap">Dieta FODMAP</option>
                        <option value="menopausia">Menopausia</option>
                        <option value="diabetes">Diabetes / Resistencia</option>
                        <option value="hipertension">Hipertensión</option>
                        <option value="embarazo">Embarazo</option>
                        <option value="colesterol">Colesterol Alto</option>
                        <option value="reflujo">Reflujo / Gastritis</option>
                        <option value="gota">Gota</option>
                    </Select>
                </div>

                <div className="bg-indigo-50 p-2 rounded-lg border border-indigo-100">
                    <Select label="Estrategia Nutricional" name="estrategia" value={datos.estrategia} onChange={handleChange} className="bg-transparent font-bold text-indigo-800 text-xs h-7 border-0">
                        {Object.entries(ESTRATEGIAS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <Select label="Actividad Física" name="actividad" value={datos.actividad} onChange={handleChange}>
                        <option value="sedentario">Sedentario</option>
                        <option value="moderado">Moderado</option>
                        <option value="intenso">Deportista</option>
                    </Select>
                    <Select label="Objetivo" name="objetivo" value={datos.objetivo} onChange={handleChange}>
                        <option value="bajar">Déficit</option>
                        <option value="mantener">Mantención</option>
                        <option value="subir">Superávit</option>
                    </Select>
                </div>

                {/* SECCIÓN ANTROPOMETRÍA (Colapsada por defecto) */}
                <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                    <button type="button" onClick={() => setAntropometria({...antropometria, mostrar: !antropometria.mostrar})} className="w-full px-3 py-2 flex justify-between items-center text-[10px] font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition uppercase tracking-wide">
                        <span>📐 Antropometría (Opcional)</span>
                        <span>{antropometria.mostrar ? "▲" : "▼"}</span>
                    </button>
                    
                    {antropometria.mostrar && (
                        <div className="p-3 space-y-2 bg-white animate-in slide-in-from-top-1">
                            {/* Fila 1: Perímetros */}
                            <div className="grid grid-cols-2 gap-2">
                                <Input label="Cintura (cm)" name="cintura" type="number" value={antropometria.cintura} onChange={handleAntro} />
                                <Input label="Brazo (cm)" name="brazo" type="number" value={antropometria.brazo} onChange={handleAntro} />
                            </div>
                            
                            {/* Fila 2: Pliegues Brazo */}
                            <div className="grid grid-cols-2 gap-2">
                                <Input label="Tricipital (mm)" name="tricipital" type="number" value={antropometria.tricipital} onChange={handleAntro} />
                                <Input label="Bicipital (mm)" name="bicipital" type="number" value={antropometria.bicipital} onChange={handleAntro} />
                            </div>

                            {/* Fila 3: Pliegues Tronco */}
                            <div className="grid grid-cols-2 gap-2">
                                <Input label="Subescapular (mm)" name="subescapular" type="number" value={antropometria.subescapular} onChange={handleAntro} />
                                <Input label="Suprailiaco (mm)" name="suprailiaco" type="number" value={antropometria.suprailiaco} onChange={handleAntro} />
                            </div>

                            {resAntro.grasa > 0 && (
                                <div className="text-[10px] bg-blue-50 p-1.5 rounded text-blue-800 border border-blue-100 text-center mt-1">
                                    <b>{resAntro.grasa}% Grasa</b> | {resAntro.amb} cm² Músculo
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <button className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-xl shadow-md mt-1 transition active:scale-95 text-xs uppercase tracking-widest border-b-4 border-slate-950 active:border-b-0 active:translate-y-1">
                    ⚡ CALCULAR AHORA
                </button>
            </form>

            {/* BOTÓN CERRAR SESIÓN (Zona Segura al final) */}
            <div className="mt-2 border-t border-slate-100 pt-3 flex justify-center">
                <button 
                    onClick={handleLogout} 
                    className="flex items-center gap-2 text-[10px] font-bold text-slate-300 hover:text-red-500 transition-colors px-3 py-1 rounded hover:bg-red-50"
                >
                    <LogOut className="w-3 h-3" />
                    Cerrar Sesión
                </button>
            </div>
        </section>
        
        {/* --- COLUMNA 2: PANEL CENTRAL (6 cols) --- */}
        <section className="lg:col-span-6 flex flex-col gap-6">
          {!activeTab ? (
             <div className="h-full bg-white rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 p-10"><h3 className="font-bold text-lg">Listo para calcular</h3></div>
          ) : (
            <>
{/* ENCABEZADO DE DASHBOARD (Corregido: Incluye Guía) */}
<div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 sticky top-4 z-20">
                 
                 {/* FILA 1: Título y Datos */}
                 <div className="flex justify-between items-start mb-2">
                    <div>
                        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resumen Nutricional</h2>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className={`text-3xl font-black tracking-tight ${getCalColor()}`}>
                                {Math.round(totales.cal)}
                            </span>
                            <div className="flex flex-col leading-none">
                                <span className="text-[10px] text-slate-400 font-bold uppercase">Kcal Actuales</span>
                                <span className="text-xs font-bold text-slate-500">
                                    Meta: {metaCal} <span className="text-slate-300">|</span> Dif: {Math.round(totales.cal - metaCal) > 0 ? "+" : ""}{Math.round(totales.cal - metaCal)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                        <div className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wide border ${diagnostico.color}`}>
                            IMC: {diagnostico.estado}
                        </div>
                        {mensajeAlerta && (
                            <div className="text-[9px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded border border-red-100 max-w-[150px] text-right truncate">
                                {mensajeAlerta}
                            </div>
                        )}
                    </div>
                 </div>

                 {/* FILA 2: BARRA DE ACCIONES (Aquí volvió la Guía) */}
                 <div className={`mb-4 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-between border ${diagVisual.color}`}>
                    <span className="truncate mr-2">{diagVisual.msg}</span>
                    
                    <div className="flex items-center gap-3 shrink-0">
                        {/* Grupo WhatsApp */}
                        <div className="flex items-center gap-2">
                            <button onClick={copiarPauta} className="hover:underline opacity-80 hover:opacity-100 transition flex items-center gap-1" title="Copiar Plan Diario">
                                📲 Pauta
                            </button>
                            <span className="opacity-20">/</span>
                            <button onClick={copiarGuia} className="hover:underline opacity-80 hover:opacity-100 transition flex items-center gap-1" title="Copiar Guía de Porciones">
                                📚 Guía
                            </button>
                        </div>

                        <span className="opacity-20 text-slate-400">|</span>
                        
                        <button onClick={imprimirProfesional} className="hover:underline opacity-80 hover:opacity-100 transition flex items-center gap-1">
                            🖨️ PDF
                        </button>
                        
                        <span className="opacity-20 text-slate-400">|</span>
                        
                        <button onClick={guardarPlan} className="hover:underline opacity-80 hover:opacity-100 transition flex items-center gap-1 text-indigo-700">
                            💾 Guardar
                        </button>
                    </div>
                 </div>

                 {/* FILA 3: MACROS */}
                 <div className="grid grid-cols-3 gap-4 border-t border-slate-100 pt-3">
                    {/* Proteína */}
                    <div>
                        <div className="flex justify-between items-end mb-1">
                            <span className="text-[10px] font-bold text-blue-600 uppercase">Proteína</span>
                            <span className="text-[9px] font-bold text-slate-400">{totales.pP}% / {ESTRATEGIAS[datos.estrategia].p}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mb-1">
                            <div className={`h-full ${getBarColor(totales.pP, ESTRATEGIAS[datos.estrategia].p, "bg-blue-500")}`} style={{width: `${Math.min(totales.pP, 100)}%`}}></div>
                        </div>
                        <div className="flex justify-between text-[10px]">
                            <span className="font-bold text-slate-700">{totales.prot}g</span>
                            <span className="text-slate-400">{(totales.prot/(Number(datos.peso) || 1)).toFixed(1)} g/kg</span>
                        </div>
                    </div>
                    {/* Carbos */}
                    <div>
                        <div className="flex justify-between items-end mb-1">
                            <span className="text-[10px] font-bold text-orange-600 uppercase">Carbos</span>
                            <span className="text-[9px] font-bold text-slate-400">{totales.pC}% / {ESTRATEGIAS[datos.estrategia].c}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mb-1">
                             <div className={`h-full ${getBarColor(totales.pC, ESTRATEGIAS[datos.estrategia].c, "bg-orange-500")}`} style={{width: `${Math.min(totales.pC, 100)}%`}}></div>
                        </div>
                        <div className="flex justify-between text-[10px]">
                             <span className="font-bold text-slate-700">{totales.cho}g</span>
                             <span className="text-slate-400">{(totales.cho/(Number(datos.peso) || 1)).toFixed(1)} g/kg</span>
                        </div>
                    </div>
                    {/* Grasas */}
                    <div>
                        <div className="flex justify-between items-end mb-1">
                            <span className="text-[10px] font-bold text-yellow-600 uppercase">Grasas</span>
                            <span className="text-[9px] font-bold text-slate-400">{totales.pF}% / {ESTRATEGIAS[datos.estrategia].f}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mb-1">
                            <div className={`h-full ${getBarColor(totales.pF, ESTRATEGIAS[datos.estrategia].f, "bg-yellow-500")}`} style={{width: `${Math.min(totales.pF, 100)}%`}}></div>
                        </div>
                        <div className="flex justify-between text-[10px]">
                             <span className="font-bold text-slate-700">{totales.gras}g</span>
                             <span className="text-slate-400">{(totales.gras/(Number(datos.peso) || 1)).toFixed(1)} g/kg</span>
                        </div>
                    </div>
                 </div>
              </div>
              {/* GRILLA DE COMIDAS (TEXTO VISIBLE + BOTONES MINI) */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
                {['desayuno', 'colacion', 'almuerzo', 'colacion_tarde', 'once', 'cena', 'recena'].map((t) => {
                  return (
                  <div key={t} className={`p-2 rounded-xl border transition ${visible[t] ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50 border-slate-100'}`}>
                    
                    {/* TÍTULO DE LA COMIDA */}
                    <div className="flex justify-between items-center mb-1 pb-1 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                            <input type="checkbox" checked={visible[t]} onChange={() => toggleMeal(t)} className="w-3 h-3 cursor-pointer accent-blue-600" />
                            <h3 className={`font-black uppercase text-[10px] tracking-wide ${visible[t] ? 'text-slate-700' : 'text-slate-400'}`}>{MEAL_NAMES[t] || t}</h3>
                        </div>
                    </div>

                    {/* LISTA DE ALIMENTOS */}
                    {visible[t] ? (
                        <div className="space-y-1">
                        {['verduras', 'cereales', 'proteina', 'lacteos', 'frutas', 'grasas'].map((g) => {
                            let subLabel = FOOD_DB_DISPLAY[g];
                            if (g === 'verduras') {
                                const cantidad = (grid as any)[t][g];
                                if (cantidad === 0) subLabel = "Libres (A gusto)";
                                else subLabel = "Taza (+ Libres)";
                            }

                            return (
                            <div key={g} className="flex justify-between items-center py-1 group hover:bg-slate-50 rounded px-1 -mx-1 transition">
                                {/* LADO IZQUIERDO: TEXTO COMPLETO (Se ajusta, no se corta) */}
                                <div className="flex-1 pr-1 flex flex-col justify-center">
                                    <span className="text-[9px] font-bold text-slate-700 uppercase leading-none">
                                        {DISPLAY_LABELS[g]}
                                    </span>
                                    <span className={`text-[8px] font-medium leading-tight mt-0.5 ${g==='verduras' ? 'text-green-600' : 'text-slate-400'}`}>
                                        {subLabel}
                                    </span>
                                </div>

                                {/* LADO DERECHO: CONTROLES MINI (w-4 y h-5 para ahorrar espacio) */}
                                <div className="flex items-center bg-white border border-slate-200 rounded shrink-0 shadow-sm h-5">
                                    <button 
                                        onClick={()=>ajustar(t, g, -0.5)} 
                                        className="w-4 h-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 font-bold transition text-[10px] rounded-l border-r border-slate-100"
                                    >-</button>
                                    
                                    <span className="text-[9px] font-black w-5 text-center text-slate-800 select-none bg-slate-50 h-full flex items-center justify-center">
                                        {(grid as any)[t][g]}
                                    </span>
                                    
                                    <button 
                                        onClick={()=>ajustar(t, g, 0.5)} 
                                        className="w-4 h-full flex items-center justify-center text-slate-400 hover:text-blue-500 hover:bg-blue-50 font-bold transition text-[10px] rounded-r border-l border-slate-100"
                                    >+</button>
                                </div>
                            </div>
                        )})}
                        </div>
                    ) : (
                        <div className="h-24 flex flex-col items-center justify-center text-slate-300 gap-1">
                            <span className="text-[9px] font-bold uppercase">Omitido</span>
                        </div>
                    )}
                  </div>
                )})}
              </div>
            </>
          )}
        </section>

        {/* --- COLUMNA 3: PANEL DERECHO (4 cols) --- */}
        <section className="lg:col-span-4 flex flex-col gap-6">
          
          {/* 1. NOTAS DEL ESPECIALISTA (Siempre visibles) */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 sticky top-4 z-10">
              <div className="flex justify-between items-center mb-3">
                <label className="text-xs font-black text-slate-700 uppercase flex items-center gap-2">
                    📝 Notas Clínicas
                </label>
                <button 
                    onClick={() => setObservaciones("")}
                    className="text-[10px] text-red-400 hover:text-red-600 font-bold hover:underline"
                >
                    Limpiar
                </button>
              </div>

              {/* Botones Rápidos */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                  {Object.entries(RECOMENDACIONES_RAPIDAS).map(([titulo, texto]) => (
                      <button
                          key={titulo}
                          onClick={() => agregarNota(texto)}
                          className="text-[9px] font-bold px-2 py-1 rounded-md bg-slate-50 border border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-all"
                      >
                          + {titulo}
                      </button>
                  ))}
              </div>

              <textarea 
                  value={observaciones} 
                  onChange={(e) => setObservaciones(e.target.value)} 
                  placeholder="Escribe indicaciones o selecciona arriba..."
                  className="w-full border border-slate-200 rounded-lg p-3 text-xs h-40 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none bg-slate-50"
              />
          </div>

          {/* 2. CHEF INTELIGENTE (Plegable) */}
          <div className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${mostrarChef ? 'shadow-xl border-purple-200 ring-1 ring-purple-100' : 'shadow-sm border-slate-200'}`}>
              
              {/* ENCABEZADO (Botón) */}
              <button 
                  onClick={() => setMostrarChef(!mostrarChef)}
                  className={`w-full p-4 flex justify-between items-center transition-colors ${mostrarChef ? 'bg-purple-50' : 'bg-white hover:bg-slate-50'}`}
              >
                  <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${mostrarChef ? 'bg-white text-purple-600 shadow-sm' : 'bg-slate-100 text-slate-400'}`}>
                          <Sparkles className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                          <h3 className={`font-bold text-sm ${mostrarChef ? 'text-purple-900' : 'text-slate-600'}`}>
                              Chef Inteligente IA
                          </h3>
                          <p className="text-[10px] text-slate-400">
                              {mostrarChef ? "Asistente activo" : "Click para desplegar"}
                          </p>
                      </div>
                  </div>
                  <div className={`transform transition-transform duration-300 text-slate-400 ${mostrarChef ? 'rotate-180 text-purple-500' : ''}`}>
                      ▼
                  </div>
              </button>

              {/* CUERPO DEL CHEF */}
              {mostrarChef && (
                  <div className="p-4 border-t border-purple-100 bg-white animate-in slide-in-from-top-2 fade-in duration-200">
                      
                      {/* Pestañas Menú / Lista */}
                      <div className="flex bg-slate-100 p-1 rounded-lg mb-4">
                          <button 
                            onClick={() => setTabIA('menu')}
                            className={`flex-1 py-1.5 rounded-md text-[10px] font-bold transition ${tabIA==='menu' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-400 hover:text-purple-500'}`}
                          >
                            🍽️ MENÚ
                          </button>
                          <button 
                            onClick={() => setTabIA('lista')}
                            className={`flex-1 py-1.5 rounded-md text-[10px] font-bold transition ${tabIA==='lista' ? 'bg-white text-pink-700 shadow-sm' : 'text-slate-400 hover:text-pink-500'}`}
                          >
                            🛒 COMPRAS
                          </button>
                      </div>

                      {/* Contenido Menú */}
                      {tabIA === 'menu' && (
                        <>
                            <button 
                                onClick={generarMenuIA} 
                                disabled={cargandoIA}
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-bold text-xs transition shadow-lg shadow-purple-200 active:scale-95 flex justify-center items-center gap-2 mb-4"
                            >
                                {cargandoIA ? "🔥 Cocinando..." : "✨ Generar Menú"}
                            </button>
                            
                            {menuIA && (
                                <div className="bg-purple-50 p-3 rounded-xl border border-purple-100 text-xs text-slate-700 whitespace-pre-line leading-relaxed relative max-h-96 overflow-y-auto custom-scrollbar">
                                    <button 
                                        onClick={() => {navigator.clipboard.writeText(menuIA); alert("Copiado!");}}
                                        className="sticky top-0 float-right ml-2 mb-2 text-[9px] bg-white border border-purple-200 text-purple-600 px-2 py-1 rounded hover:bg-purple-100 font-bold z-10"
                                    >
                                        COPIAR
                                    </button>
                                    {menuIA}
                                </div>
                            )}
                        </>
                      )}

                      {/* Contenido Lista */}
                      {tabIA === 'lista' && (
                        <>
                            <button 
                                onClick={generarListaIA} 
                                disabled={cargandoLista || !menuIA}
                                className={`w-full py-3 rounded-xl font-bold text-xs transition shadow-lg flex justify-center items-center gap-2 mb-4 ${!menuIA ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-pink-600 hover:bg-pink-700 text-white shadow-pink-200 active:scale-95'}`}
                            >
                                {cargandoLista ? "🛒 Procesando..." : "📝 Crear Lista"}
                            </button>
                            
                            {listaCompras && (
                                <div className="bg-pink-50 p-3 rounded-xl border border-pink-100 text-xs text-slate-700 whitespace-pre-line leading-relaxed relative max-h-96 overflow-y-auto custom-scrollbar">
                                    <button 
                                        onClick={() => {navigator.clipboard.writeText(listaCompras); alert("Copiado!");}}
                                        className="sticky top-0 float-right ml-2 mb-2 text-[9px] bg-white border border-pink-200 text-pink-600 px-2 py-1 rounded hover:bg-pink-100 font-bold z-10"
                                    >
                                        COPIAR
                                    </button>
                                    {listaCompras}
                                </div>
                            )}
                        </>
                      )}
                  </div>
              )}
          </div>
        </section>
      </div>
    </main>
  );
}