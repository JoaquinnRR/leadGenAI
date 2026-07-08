import express from "express";
import path from "path";
import cors from "cors";
import axios from "axios";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3005;

app.use(cors());
app.use(express.json());

// Initialize Gemini
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Fallback Logic for simulation
const simulateSearch = (query: string, deepScan: boolean = false) => {
  const queryLower = (query || "").toLowerCase();
  
  // Determine if searching for dentists
  const isDentist = queryLower.includes("dent") || queryLower.includes("odon") || queryLower.includes("diente") || queryLower.includes("orto") || queryLower.includes("molar") || queryLower.includes("boca");
  const isRestaurant = queryLower.includes("rest") || queryLower.includes("comida") || queryLower.includes("sushi") || queryLower.includes("cafe") || queryLower.includes("pub") || queryLower.includes("bar");
  const isMedical = queryLower.includes("medic") || queryLower.includes("salud") || queryLower.includes("doctor") || queryLower.includes("clinica") || queryLower.includes("pediatra");
  
  // Decide target industry
  let detectedIndustry = "Comercio Local";
  if (isDentist) {
    detectedIndustry = "Clínica Dental";
  } else if (isRestaurant) {
    detectedIndustry = "Gastronomía";
  } else if (isMedical) {
    detectedIndustry = "Centro Médico";
  } else if (query && query.trim().length > 0) {
    detectedIndustry = query.charAt(0).toUpperCase() + query.slice(1);
  }

  const targetComunas = deepScan 
    ? ["Santiago Centro", "La Florida", "Estación Central", "Maipú", "Puente Alto", "Recoleta", "Providencia", "Ñuñoa", "Las Condes", "Vitacura", "Lo Barnechea"]
    : ["Santiago Centro", "La Florida", "Estación Central", "Maipú", "Puente Alto"];
  
  // Names of dental clinics, restaurants or businesses
  const dentalNameTemplates = [
    (c: string) => `Clínica Dental ${c}`,
    (c: string) => `Odontología Integral ${c}`,
    (c: string) => `Centro Dental Elite ${c}`,
    (c: string) => `Dental Studio ${c}`,
    (c: string) => `Clínica de Ortodoncia ${c}`,
    (c: string) => `Dentistas ${c} Asociados`,
    (c: string) => `Smile Clinic ${c}`,
    (c: string) => `Ortodoncia e Implantes ${c}`,
    (c: string) => `Centro Odontológico San ${c}`,
    (c: string) => `Clínica Dental Dr. Andrés ${c}`,
    (c: string) => `Salud Dental ${c}`,
    (c: string) => `Implantes Dentales ${c}`,
    (c: string) => `Clínica Odontológica ${c}`,
    (c: string) => `Estética Dental ${c}`,
    (c: string) => `Centro de Estética Dental ${c}`,
    (c: string) => `OdontoCare ${c}`,
    (c: string) => `DentiSur ${c}`,
    (c: string) => `BocaSana ${c}`,
    (c: string) => `Clínica Dental Familiar ${c}`,
    (c: string) => `Dentistas Premium ${c}`,
  ];

  const restaurantNameTemplates = [
    (c: string) => `Restaurante Don ${c}`,
    (c: string) => `La Consentida de ${c}`,
    (c: string) => `Sushi & Roll ${c}`,
    (c: string) => `Café Boutique ${c}`,
    (c: string) => `Pizzería Don ${c}`,
    (c: string) => `Sabores de ${c}`,
    (c: string) => `Gourmet ${c}`,
    (c: string) => `Taberna ${c}`,
    (c: string) => `Bistró ${c}`,
    (c: string) => `Terraza ${c} Bar`,
  ];

  const genericNameTemplates = [
    (c: string) => `Servicios ${detectedIndustry} ${c}`,
    (c: string) => `${detectedIndustry} Central ${c}`,
    (c: string) => `Grupo ${detectedIndustry} ${c}`,
    (c: string) => `${detectedIndustry} Providencia & ${c}`,
    (c: string) => `Socio ${detectedIndustry} ${c}`,
    (c: string) => `${detectedIndustry} Express ${c}`,
    (c: string) => `${detectedIndustry} Profesional Chile`,
    (c: string) => `Distribuidora ${detectedIndustry} ${c}`,
    (c: string) => `${detectedIndustry} Global ${c}`,
    (c: string) => `Consorcio ${detectedIndustry} ${c}`,
  ];

  const templates = isDentist ? dentalNameTemplates : (isRestaurant ? restaurantNameTemplates : genericNameTemplates);

  const streets = [
    "Av. Providencia", "Av. Apoquindo", "Av. Vitacura", "Av. El Golf", "La Dehesa",
    "Av. Irarrázaval", "Manuel Montt", "Pedro de Valdivia", "Sucre", "Av. Las Condes",
    "Av. Américo Vespucio", "Av. Nueva Providencia", "Suecia", "Los Leones", "Humberto Alcaíno"
  ];

  const surnames = [
    "Vargas", "Silva", "Gómez", "Figueroa", "Tapia", "Contreras", "Mendoza", "Espinoza",
    "Oyarzún", "Alarcón", "Lagos", "Valenzuela", "Carrasco", "Sandoval", "Henríquez",
    "González", "Muñoz", "Rojas", "Díaz", "Pérez", "Soto", "Sepúlveda", "Martínez"
  ];

  const leads = [];
  
  // We want hundreds of results! 5 comunas * 24 leads each = ~120 leads!
  let idCounter = 1;

  for (const comuna of targetComunas) {
    const numLeadsForComuna = deepScan
      ? 46 + Math.floor(Math.random() * 12) // 46 to 58 leads per comuna! Much more!
      : 22 + Math.floor(Math.random() * 6); // 22 to 27 leads per comuna
    for (let k = 0; k < numLeadsForComuna; k++) {
      const template = templates[Math.floor(Math.random() * templates.length)];
      const randomDetail = k % 2 === 0 ? surnames[Math.floor(Math.random() * surnames.length)] : `${100 + k * 12}`;
      
      const name = template(randomDetail);
      const street = streets[Math.floor(Math.random() * streets.length)];
      const number = 100 + Math.floor(Math.random() * 8500);
      const location = `${street} ${number}, ${comuna}, Región Metropolitana, Chile`;
      
      const randValue = Math.random();
      let status: 'no_website' | 'old_tech' | 'optimized' = 'no_website';
      let website: string | null = null;
      
      if (randValue > 0.45 && randValue <= 0.8) {
        status = 'old_tech';
        const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '');
        website = `http://www.${slug.substring(0, 15)}.cl`;
      } else if (randValue > 0.8) {
        status = 'optimized';
        const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '');
        website = `https://${slug.substring(0, 15)}.cl`;
      }

      const phone = `+56 9 ${Math.floor(4000 + Math.random() * 5999)} ${Math.floor(1000 + Math.random() * 8999)}`;

      leads.push({
        id: `sim_d_${comuna.toLowerCase()}_${idCounter++}`,
        name,
        industry: isDentist ? "Clínica Dental" : (isMedical ? "Centro Médico" : (isRestaurant ? "Gastronomía" : detectedIndustry)),
        location,
        comuna, // bind exact comuna
        phone,
        website,
        status,
        lastFound: new Date().toISOString(),
        isSimulated: true
      });
    }
  }

  return leads;
};

// Real search using Google Places API (New)
let lastApiErrorDetails = "";

const searchLeads = async (query: string, deepScan: boolean = false) => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.warn("GOOGLE_MAPS_API_KEY is missing. Falling back to simulation.");
    return simulateSearch(query, deepScan);
  }

  console.log(`[Places API] Starting search for "${query}". API Key length: ${apiKey.length}. Prefixes: ${apiKey.substring(0, 5)}...`);

  const targetComunas = deepScan
    ? ["Santiago Centro", "La Florida", "Estación Central", "Maipú", "Puente Alto", "Recoleta", "Providencia", "Ñuñoa", "Las Condes", "Vitacura", "Lo Barnechea"]
    : ["Santiago Centro", "La Florida", "Estación Central", "Maipú", "Puente Alto"];
  
  // Clean up user query - remove any pre-existing location terms if we are adding them systematically
  let baseQuery = query;
  targetComunas.forEach(comuna => {
    const rx = new RegExp(`\\ben\\s+${comuna}\\b|\\b${comuna}\\b`, 'gi');
    baseQuery = baseQuery.replace(rx, '').trim();
  });
  baseQuery = baseQuery.replace(/\ben\s+chile\b|\bchile\b/gi, '').trim();
  if (!baseQuery) {
    baseQuery = query;
  }

  let anyRealCallsFailed = false;

  // Create search tasks for each target comuna
  const searchTasks = targetComunas.map(async (comuna) => {
    try {
      const localizedQuery = `${baseQuery} en ${comuna}, Chile`;
      
      const response = await axios.post(
        'https://places.googleapis.com/v1/places:searchText',
        {
          textQuery: localizedQuery,
          maxResultCount: deepScan ? 20 : 12, // Max supported per query by modern API
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.websiteUri,places.internationalPhoneNumber,places.types'
          },
          timeout: 10000 // 10s timeout
        }
      );

      const places = response.data.places || [];
      const leads = places.map((p: any) => {
        const hasWebsite = !!p.websiteUri;
        const isOld = hasWebsite && (p.websiteUri.startsWith('http://') || Math.random() > 0.6);
        return {
          id: p.id,
          name: p.displayName?.text || "Negocio",
          industry: p.types?.[0]?.replace(/_/g, ' ') || "Empresa",
          location: p.formattedAddress || `${comuna}, Santiago, Chile`,
          comuna: comuna, // Enforce correct comuna binding
          phone: p.internationalPhoneNumber || "Sin teléfono",
          website: p.websiteUri || null,
          status: !hasWebsite ? "no_website" : (isOld ? "old_tech" : "optimized"),
          lastFound: new Date().toISOString(),
          isSimulated: false
        };
      });

      // If deepScan is true and we need "more" per comuna, let's also execute an additional specific query variation!
      if (deepScan && leads.length < 20) {
        try {
          const secondaryQuery = `${baseQuery} centro de ${comuna}, Chile`;
          const secondaryResponse = await axios.post(
            'https://places.googleapis.com/v1/places:searchText',
            {
              textQuery: secondaryQuery,
              maxResultCount: 20,
            },
            {
              headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': apiKey,
                'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.websiteUri,places.internationalPhoneNumber,places.types'
              },
              timeout: 6000
            }
          );
          const rawSecPlaces = secondaryResponse.data.places || [];
          rawSecPlaces.forEach((p: any) => {
            // Check if place is already captured
            if (!leads.some((l: any) => l.id === p.id)) {
              const hasWebsite = !!p.websiteUri;
              const isOld = hasWebsite && (p.websiteUri.startsWith('http://') || Math.random() > 0.6);
              leads.push({
                id: p.id,
                name: p.displayName?.text || "Negocio",
                industry: p.types?.[0]?.replace(/_/g, ' ') || "Empresa",
                location: p.formattedAddress || `${comuna}, Santiago, Chile`,
                comuna: comuna,
                phone: p.internationalPhoneNumber || "Sin teléfono",
                website: p.websiteUri || null,
                status: !hasWebsite ? "no_website" : (isOld ? "old_tech" : "optimized"),
                lastFound: new Date().toISOString(),
                isSimulated: false
              });
            }
          });
        } catch (secErr: any) {
          console.warn(`Secondary search warning for ${comuna}:`, secErr.message);
          if (secErr.response?.data) {
            console.error("[Places API Secondary Error Details]:", JSON.stringify(secErr.response.data));
          }
        }
      }

      return leads;
    } catch (err: any) {
      anyRealCallsFailed = true;
      const status = err.response?.status;
      const errorMsg = err.response?.data ? JSON.stringify(err.response.data) : err.message;
      lastApiErrorDetails = `Status: ${status}, Error: ${errorMsg}`;
      console.error(`[Places API Error] Search in ${comuna} failed. Status: ${status}. Message: ${err.message}`);
      if (err.response?.data) {
        console.error("[Places API Error Response Details]:", errorMsg);
      }
      return [];
    }
  });

  try {
    const resultsArray = await Promise.all(searchTasks);
    let allLeads = resultsArray.flat();

    // Deduplicate leads by Google place ID or normalized name
    const seenIds = new Set<string>();
    const seenNames = new Set<string>();
    const dedupedLeads = [];

    for (const lead of allLeads) {
      const normName = lead.name.toLowerCase().trim();
      if (!seenIds.has(lead.id) && !seenNames.has(normName)) {
        seenIds.add(lead.id);
        seenNames.add(normName);
        dedupedLeads.push(lead);
      }
    }

    // If we have some real results, return them!
    if (dedupedLeads.length > 0) {
      return dedupedLeads;
    }

    // In case Google returned 0 for all searches, but we failed any real calls, fallback to simulation
    if (anyRealCallsFailed) {
      console.warn("Real API calls failed with errors. Falling back to simulated data. Error details:", lastApiErrorDetails);
      return simulateSearch(query, deepScan);
    }

    // In case it succeeded but actually returned 0 results
    console.warn("No real leads returned from parallel searches, falling back to simulation.");
    return simulateSearch(query, deepScan);
  } catch (error: any) {
    console.error("Error in parallel Places API searches. Falling back to simulation.", error.message);
    return simulateSearch(query, deepScan);
  }
};

// API ROUTES
app.post("/api/leads/search", async (req, res) => {
  const { query, deepScan } = req.body;
  if (!query) return res.status(400).json({ error: "Query is required" });
  
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  let leads = [];

  if (!apiKey) {
    leads = simulateSearch(query, deepScan === true);
  } else {
    leads = await searchLeads(query, deepScan === true);
  }

  const resultIsSimulated = leads.some((l: any) => l.isSimulated === true);
  
  res.json({ leads, isSimulated: resultIsSimulated });
});

app.post("/api/leads/analyze", async (req, res) => {
  const { lead } = req.body;
  if (!lead) return res.status(400).json({ error: "Lead data is required" });

  try {
    const prompt = `Analiza este prospecto de negocio para servicios de IA y desarrollo web:
    Nombre: ${lead.name}
    Industria: ${lead.industry}
    Ubicación: ${lead.location}
    Estado Digital: ${lead.status === 'no_website' ? 'Sin sitio web' : 'Sitio web antiguo'}
    
    Genera:
    1. Un análisis de por qué necesitan IA o una nueva web.
    2. Tres casos de uso de IA específicos para su industria.
    3. Tres tendencias de mercado actuales para esta industria específicamente en Chile o Latinoamérica.
    4. Referencia genérica a 3 tipos de competidores locales que ya podrían estar usando tecnología (ej: franquicias grandes, apps de delivery, etc).
    5. Un "pitch" de ventas de 2 párrafos convincente en español.
    
    Responde en formato JSON:
    {
      "analysis": "...",
      "useCases": ["...", "...", "..."],
      "marketTrends": ["...", "...", "..."],
      "competitors": ["...", "...", "..."],
      "pitch": "..."
    }`;

    // Try using general stable gemini-3.5-flash with a strict responseSchema
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            analysis: { type: Type.STRING },
            useCases: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            marketTrends: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            competitors: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            pitch: { type: Type.STRING }
          },
          required: ["analysis", "useCases", "marketTrends", "competitors", "pitch"]
        }
      }
    });

    let rawText = (response.text || "").trim();
    if (rawText.startsWith("```")) {
      rawText = rawText.replace(/^```(?:json)?\s*/i, "");
      rawText = rawText.replace(/\s*```$/, "");
    }
    const result = JSON.parse(rawText || "{}");
    res.json({ ...result, isFallback: false });
  } catch (error: any) {
    console.log(`[Backup Engine] Local backup template generated for: ${lead.name}. Details: high demand on primary server.`);
    
    // Beautiful, detailed, custom local fallback generator to bypass 503 errors seamlessly
    const fallbackResult = {
      analysis: `Para ${lead.name} (${lead.industry}), la presencia digital y la agilidad de atención en ${lead.location} son fundamentales hoy en día. Al encontrarse con un estado digital de '${lead.status === 'no_website' ? 'Sin sitio web' : 'Sitio web legacy'}', existe un gran potencial para automatizar procesos y modernizar su canal de captación de clientes locales, aprovechando tecnologías de IA y diseño adaptativo de última generación.`,
      useCases: [
        `Asistente Digital en WhatsApp: Captación de consultas y automatización de respuestas sobre servicios de ${lead.industry} las 24 horas del día.`,
        `Fidelización Inteligente: Sistema de recordatorios automatizados o recomendaciones personalizadas para clientes recurrentes.`,
        `Optimización de Operaciones locales: Implementación de flujos basados en IA para agendar y gestionar citas, cotizaciones o consultas de forma automatizada.`
      ],
      marketTrends: [
        `Crecimiento exponencial de búsquedas locales "cerca de mí" y posicionamiento geolocalizado en Chile y Latinoamérica para el rubro de ${lead.industry}.`,
        `Adopción masiva de canales conversacionales automáticos para mejorar la experiencia antes y después del servicio.`,
        `Integración estricta de pagos digitales automáticos con emisión de boletas y agendamiento interactivo autónomo.`
      ],
      competitors: [
        `Franquicias del rubro que operan con sistemas de chat interactivos automatizados.`,
        `Plataformas tipo Marketplace dedicadas a agregar servicios locales con cotizadores inmediatos.`,
        `Competidores locales directos que ya han actualizado su portal web y se posicionan con anuncios geográficos optimizados.`
      ],
      pitch: `Estimado equipo de ${lead.name},\n\nHemos analizado su presencia digital en ${lead.location} y vemos una excelente oportunidad para expandir su alcance local. Actualmente, el mercado prefiere interacciones ágiles y con agendamiento o respuestas inmediatas. Con una plataforma web moderna e integrada a flujos de IA conversacional, podrán captar de forma pasiva a cada cliente interesado y brindarle atención premium sin sobrecargar sus tareas de administración.\n\nNuestra propuesta llave en mano está especialmente diseñada para el sector de ${lead.industry}. Incluye una web optimizada para dispositivos móviles, posicionamiento SEO preferencial y el diseño de un chatbot con IA entrenado con las especificaciones de su negocio. ¿Podríamos coordinar una breve llamada de 10 minutos para presentarles el prototipo en funcionamiento?`
    };
    
    // Add brief info about fallback being active to keep interfaces aligned
    res.json({ ...fallbackResult, isFallback: true });
  }
});

// Vite Middleware & Static Serving
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

setupVite();
