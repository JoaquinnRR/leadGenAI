/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  Search,
  Globe,
  Ghost,
  ShieldCheck,
  Zap,
  Activity,
  Mail,
  Phone,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Filter,
  Loader2,
  Sparkles,
  Database,
  Bookmark,
  BookmarkCheck,
  LogOut,
  LogIn,
  Trash2,
  MapPin,
  Bell,
  Clock,
  Calendar,
  TrendingUp,
  Users,
  History,
  FileText,
  Plus,
  Edit3,
  Check,
  X,
  SlidersHorizontal,
  Cpu,
  Copy,
  RotateCcw,
  Printer,
  Award,
  FileDown,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Lead, Analysis } from "./types";
import { StatsPanel } from "./components/StatsPanel";
import { RemindersPanel } from "./components/RemindersPanel";
import { LeadMap } from "./components/LeadMap";
import axios from "axios";
import { CHILE_COMUNAS, extractComuna } from "./chileComunas";
import {
  auth,
  db,
  googleProvider,
  signInWithPopup,
  signOut,
  collection,
  doc,
  setDoc,
  updateDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  deleteDoc,
} from "./lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";

function formatFriendlyDate(dateValue: string | Date | number): string {
  if (!dateValue) return "";
  const date = new Date(dateValue);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();

  if (isNaN(date.getTime())) return "";

  const diffInSecs = Math.floor(diffInMs / 1000);
  const diffInMins = Math.floor(diffInSecs / 60);
  const diffInHours = Math.floor(diffInMins / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInSecs < 10) {
    return "Hace instantes";
  }
  if (diffInSecs < 60) {
    return `Hace ${diffInSecs} s`;
  }
  if (diffInMins < 60) {
    return diffInMins === 1 ? "Hace 1 minuto" : `Hace ${diffInMins} minutos`;
  }
  if (diffInHours < 24) {
    return diffInHours === 1 ? "Hace 1 hora" : `Hace ${diffInHours} horas`;
  }
  if (diffInDays < 7) {
    if (diffInDays === 1) return "Ayer";
    return `Hace ${diffInDays} días`;
  }

  const months = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${day} de ${month}, ${year} a las ${hours}:${minutes}`;
}

interface AutocompleteSnippet {
  trigger: string;
  label: string;
  category: string;
  text: string;
}

const autocompleteSnippets: AutocompleteSnippet[] = [
  {
    trigger: "/saludo-formal",
    label: "Saludo Formal",
    category: "Saludos",
    text: "Estimado equipo de [Empresa],\n\nEspero que se encuentren muy bien.\n\n",
  },
  {
    trigger: "/saludo-cercano",
    label: "Saludo Cercano",
    category: "Saludos",
    text: "¡Hola team de [Empresa]! 👋\nEspero que estén muy bien.\n\n",
  },
  {
    trigger: "/diseno-web",
    label: "Propuesta Diseño Web",
    category: "Servicios",
    text: "Propongo el diseño de una nueva página web moderna, de alta velocidad de carga y 100% responsiva (optimizada para celulares).",
  },
  {
    trigger: "/tienda-online",
    label: "Propuesta Tienda Online",
    category: "Servicios",
    text: "Implementación de una plataforma E-commerce autoadministrable con carro de compras e integración de pagos locales (Webpay, Flow o MercadoPago).",
  },
  {
    trigger: "/seo-local",
    label: "Servicio SEO Local",
    category: "Servicios",
    text: "Optimización avanzada de SEO local y de su perfil de Google Business Profile (Google Maps) progresando en el mercado zonal.",
  },
  {
    trigger: "/boton-whatsapp",
    label: "Fórmula WhatsApp Directo",
    category: "Servicios",
    text: "Integración del botón de WhatsApp flotante automatizado para agilizar el canal de consultas y aumentar el ratio de conversión de clientes.",
  },
  {
    trigger: "/visibilidad-ads",
    label: "Gestión Campañas Ads",
    category: "Servicios",
    text: "Desarrollo de campañas pagadas en Google Ads y Meta Ads orientadas específicamente a capturar prospectos calificados en su comuna y alrededores.",
  },
  {
    trigger: "/cta-videollamada",
    label: "CTA Video-reunión",
    category: "Acción",
    text: "¿Tendrían disponibilidad de coordinar una breve llamada virtual de 10 minutos esta semana para revisar este diagnóstico técnico y sugerir soluciones?",
  },
  {
    trigger: "/cta-cotizar",
    label: "CTA Envío Cotización",
    category: "Acción",
    text: "Nos encantaría agendar una breve llamada para levantar sus dudas y enviarles un presupuesto formal sin compromisos en menos de 24 horas.",
  },
  {
    trigger: "/aumento-velocidad",
    label: "Diagnóstico Carga Web",
    category: "Diagnóstico",
    text: "Hemos identificado demoras significativas en los tiempos de carga del sitio actual; optimizar este punto clave evitará que sigan perdiendo clientes potenciales.",
  },
  {
    trigger: "/seguridad-ssl",
    label: "Diagnóstico Seguridad SSL",
    category: "Diagnóstico",
    text: "Es fundamental subsanar la ausencia de un certificado de seguridad SSL en la web, ya que los navegadores alertan de sitio no seguro dañando la credibilidad.",
  },
  {
    trigger: "/contacto-facil",
    label: "Diagnóstico Conversión Directa",
    category: "Diagnóstico",
    text: "Recomendamos simplificar sustancialmente el formulario de cotizaciones, haciéndolo directo y visible en portada para maximizar consultas.",
  },
];

const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Ignore
    }
  },
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore
    }
  },
};

const ensureAbsoluteUrl = (url: string) => {
  if (!url) return "";
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
};

export default function App() {
  const [queryInput, setQueryInput] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    const saved = safeStorage.getItem("santiago_recent_searches");
    try {
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const addRecentSearch = (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter(
        (q) => q.toLowerCase() !== trimmed.toLowerCase(),
      );
      const updated = [trimmed, ...filtered].slice(0, 6);
      safeStorage.setItem("santiago_recent_searches", JSON.stringify(updated));
      return updated;
    });
  };

  const removeRecentSearch = (searchQuery: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches((prev) => {
      const updated = prev.filter((q) => q !== searchQuery);
      safeStorage.setItem("santiago_recent_searches", JSON.stringify(updated));
      return updated;
    });
  };

  const clearAllRecentSearches = () => {
    setRecentSearches([]);
    safeStorage.removeItem("santiago_recent_searches");
  };
  const [deepScan, setDeepScan] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [isSimulated, setIsSimulated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<
    "search" | "saved" | "stats" | "reminders"
  >("search");
  const [savedLeads, setSavedLeads] = useState<Lead[]>([]);
  const [savingLeadId, setSavingLeadId] = useState<string | null>(null);
  const [updatingCrm, setUpdatingCrm] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [industryFilter, setIndustryFilter] = useState("all");
  const [crmStatusFilter, setCrmStatusFilter] = useState("all");
  const [techFilter, setTechFilter] = useState<
    "all" | "weak" | "no_website" | "old_tech" | "optimized"
  >("all");
  const [comunaFilter, setComunaFilter] = useState<string[]>([]);
  const [isComunasDropdownOpen, setIsComunasDropdownOpen] = useState(false);
  const [comunasDropdownSearch, setComunasDropdownSearch] = useState("");
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
  const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false);
  const [localSearchTerm, setLocalSearchTerm] = useState("");
  const [visibleLeadsCount, setVisibleLeadsCount] = useState(15);
  const [isPitchModalOpen, setIsPitchModalOpen] = useState(false);
  const [editedPitchText, setEditedPitchText] = useState("");
  const [originalPitchText, setOriginalPitchText] = useState("");
  const [pitchCopyFeedback, setPitchCopyFeedback] = useState(false);
  const [showSimulatedWebsiteModal, setShowSimulatedWebsiteModal] = useState(false);
  const [simulatedWebsiteUrl, setSimulatedWebsiteUrl] = useState("");

  useEffect(() => {
    setVisibleLeadsCount(15);
  }, [activeTab, techFilter, comunaFilter, crmStatusFilter, localSearchTerm, queryInput]);

  // Autocomplete suggestions state variables
  const [isAutocompleteMenuOpen, setIsAutocompleteMenuOpen] = useState(false);
  const [autocompleteSearchText, setAutocompleteSearchText] = useState("");
  const [autocompleteCursorPos, setAutocompleteCursorPos] = useState(0);
  const [autocompleteSelectedIndex, setAutocompleteSelectedIndex] = useState(0);
  const [activeSnippetTab, setActiveSnippetTab] = useState<
    "Todos" | "Saludos" | "Servicios" | "Diagnóstico" | "Acción"
  >("Todos");
  const [snippetQuery, setSnippetQuery] = useState("");

  // Notes state for multi-note logs
  const [newNoteText, setNewNoteText] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState("");
  const [selectedHistoryIndex, setSelectedHistoryIndex] = useState<
    number | null
  >(null);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [editLocText, setEditLocText] = useState("");
  const [editComunaSelect, setEditComunaSelect] = useState("");

  // PDF Report State Variables
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [reportConsultorName, setReportConsultorName] = useState(
    "Consultor de Logros y Canales Digitales",
  );
  const [reportConsultorEmail, setReportConsultorEmail] = useState("");
  const [reportConsultorPhone, setReportConsultorPhone] =
    useState("+56 9 1234 5678");
  const [reportScoreSeo, setReportScoreSeo] = useState<
    "critic" | "warning" | "good"
  >("warning");
  const [reportScoreVelocity, setReportScoreVelocity] = useState<
    "critic" | "warning" | "good"
  >("critic");
  const [reportScoreMobile, setReportScoreMobile] = useState<
    "critic" | "warning" | "good"
  >("warning");
  const [reportScoreSSL, setReportScoreSSL] = useState<
    "critic" | "warning" | "good"
  >("good");
  const [reportScoreContacto, setReportScoreContacto] = useState<
    "critic" | "warning" | "good"
  >("critic");
  const [pdfPersonalizedTitle, setPdfPersonalizedTitle] = useState(
    "Informe de Auditoría y Propuesta de Crecimiento Digital",
  );
  const [pdfIntroduction, setPdfIntroduction] = useState(
    "Estimado equipo comercial.\n\nHemos realizado una auditoría exhaustiva externa de su presencia digital. Identificamos fortalezas relevantes en su propuesta de valor, pero también oportunidades de optimización cruciales que podrían estar afectando directamente su conversión diaria de cotizaciones y el tráfico de prospectos locales en Google Maps y búsquedas móviles.\n\nEste reporte resume los puntos de mejora críticos evaluados y propone un plan estratégico concreto con el cual impulsaremos su presencia y automatizaremos sus consultas comerciales.",
  );
  const [customOfferText, setCustomOfferText] = useState("");
  const [reportColorTheme, setReportColorTheme] = useState<
    "indigo" | "emerald" | "amber" | "rose" | "slate"
  >("indigo");

  useEffect(() => {
    const tourSeen = safeStorage.getItem("onboarding_seen");
    if (!tourSeen) {
      setTimeout(() => setShowTour(true), 1500);
    }
  }, []);

  const completeTour = () => {
    setShowTour(false);
    safeStorage.setItem("onboarding_seen", "true");
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        fetchSavedLeads();
      } else {
        setSavedLeads([]);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (selectedLead) {
      setEditLocText(selectedLead.location || "");
      setEditComunaSelect(
        selectedLead.comuna || extractComuna(selectedLead.location),
      );
      setIsEditingLocation(false);
    }
  }, [selectedLead?.id]);

  // Synchronize PDF fields when user has email
  useEffect(() => {
    if (user && user.email) {
      setReportConsultorEmail(user.email);
    } else {
      setReportConsultorEmail("contacto@agenciapro.cl");
    }
  }, [user]);

  // Prepare PDF content when lead or analysis changes
  useEffect(() => {
    if (selectedLead) {
      const active =
        selectedHistoryIndex !== null && selectedLead.analysisHistory
          ? selectedLead.analysisHistory[selectedHistoryIndex]?.analysis
          : analysis || selectedLead.analysis;

      if (active) {
        setCustomOfferText(active.pitch || "");
      } else {
        setCustomOfferText("");
      }

      // Smart score detection based on lead data
      const isWeakScoring =
        selectedLead.techScore?.Score && selectedLead.techScore.Score < 50;
      const isCriticSeo =
        selectedLead.techScore?.Explanation?.toLowerCase().includes("seo") ||
        selectedLead.techScore?.Explanation?.toLowerCase().includes(
          "posicionamiento",
        ) ||
        !selectedLead.website;
      const hasNoSsl =
        selectedLead.tags?.includes("Sin SSL") ||
        selectedLead.techScore?.Explanation?.toLowerCase().includes("ssl") ||
        selectedLead.techScore?.Explanation?.toLowerCase().includes(
          "seguridad",
        );

      setReportScoreVelocity(isWeakScoring ? "critic" : "warning");
      setReportScoreSeo(isCriticSeo ? "critic" : "warning");
      setReportScoreSSL(hasNoSsl ? "critic" : "good");
      setReportScoreMobile("warning");
      setReportScoreContacto(
        selectedLead.phoneNumber && selectedLead.phoneNumber !== "No registrado"
          ? "good"
          : "critic",
      );

      setPdfPersonalizedTitle(
        `Estudio de Optimización Digital — ${selectedLead.name || "Empresa"}`,
      );
    }
  }, [selectedLead, selectedHistoryIndex, analysis]);

  const login = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const handleCopyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setPitchCopyFeedback(true);
      setTimeout(() => setPitchCopyFeedback(false), 2000);
    } catch (err) {
      console.error("No se pudo copiar el texto: ", err);
    }
  };

  const insertSnippet = (
    snippetText: string,
    isSlashCommand: boolean = false,
  ) => {
    const name = selectedLead?.name || "su empresa";
    const processedText = snippetText.replaceAll("[Empresa]", name);

    const textarea = document.getElementById(
      "pitch-textarea",
    ) as HTMLTextAreaElement;
    if (!textarea) {
      setEditedPitchText((prev) => prev + processedText);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = textarea.value;

    let newText = "";
    if (isSlashCommand) {
      const beforeSlash = currentText.substring(0, autocompleteCursorPos);
      const afterCursor = currentText.substring(end);
      newText = beforeSlash + processedText + afterCursor;
      setEditedPitchText(newText);

      setTimeout(() => {
        textarea.focus();
        const newCursorPos = beforeSlash.length + processedText.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 50);
    } else {
      const beforeText = currentText.substring(0, start);
      const afterText = currentText.substring(end);
      newText = beforeText + processedText + afterText;
      setEditedPitchText(newText);

      setTimeout(() => {
        textarea.focus();
        const newCursorPos = start + processedText.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 50);
    }

    setIsAutocompleteMenuOpen(false);
  };

  const fetchSavedLeads = async () => {
    try {
      const q = query(
        collection(db, "saved_leads"),
      );
      const querySnapshot = await getDocs(q);
      const fetched: Lead[] = [];
      querySnapshot.forEach((doc) => {
        fetched.push(doc.data() as Lead);
      });
      setSavedLeads(fetched);
    } catch (error) {
      console.error("Fetch saved leads failed", error);
    }
  };

  const executeSearch = async (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    setLoading(true);
    setIsSimulated(false);
    try {
      const response = await axios.post("/api/leads/search", {
        query: trimmed,
        deepScan,
      });
      setLeads(response.data.leads);
      setIsSimulated(response.data.isSimulated);
      addRecentSearch(trimmed);
    } catch (error) {
      console.error("Search failed", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeSearch(queryInput);
  };

  const handleUpdateCRM = async (leadId: string, updates: Partial<Lead>) => {
    if (!user) {
      login();
      return;
    }
    setUpdatingCrm(true);
    try {
      let finalUpdates = { ...updates };
      const isSaved = savedLeads.some((l) => l.id === leadId);

      // If updating crmStatus, track the history log
      if (updates.crmStatus !== undefined) {
        const lead =
          savedLeads.find((l) => l.id === leadId) ||
          (selectedLead?.id === leadId ? selectedLead : null);
        if (lead) {
          const previousStatus = lead.crmStatus || "new";
          if (previousStatus !== updates.crmStatus) {
            const historyItem = {
              date: new Date().toISOString(),
              from: previousStatus,
              to: updates.crmStatus,
            };
            const currentHistory = lead.statusHistory || [];
            finalUpdates.statusHistory = [historyItem, ...currentHistory];
          }
        }
      }

      if (isSaved) {
        await updateDoc(doc(db, "saved_leads", leadId), finalUpdates);
        setSavedLeads((prev) =>
          prev.map((l) => (l.id === leadId ? { ...l, ...finalUpdates } : l)),
        );
      } else {
        // If the lead was NOT saved, we perform setDoc to save it along with the edits!
        const leadToSave = {
          ...selectedLead,
          analysis: analysis || selectedLead?.analysis,
          userId: user.uid,
          createdAt: serverTimestamp(),
          crmStatus: "new" as const,
          ...finalUpdates,
        };
        await setDoc(doc(db, "saved_leads", leadId), leadToSave);
        setSavedLeads((prev) => [...prev, leadToSave as Lead]);
      }

      if (selectedLead?.id === leadId) {
        setSelectedLead((prev) => (prev ? { ...prev, ...finalUpdates } : null));
      }
    } catch (error) {
      console.error("Update CRM failed", error);
    } finally {
      setUpdatingCrm(false);
    }
  };

  const saveLocationChanges = async () => {
    if (!selectedLead) return;
    try {
      const updates = { location: editLocText, comuna: editComunaSelect };

      // Update locally immediately
      setSelectedLead((prev) => (prev ? { ...prev, ...updates } : null));
      setLeads((prev) =>
        prev.map((l) => (l.id === selectedLead.id ? { ...l, ...updates } : l)),
      );

      if (user) {
        await handleUpdateCRM(selectedLead.id, updates);
      }
      setIsEditingLocation(false);
    } catch (err) {
      console.error("No se pudo guardar la comuna/ubicación", err);
    }
  };

  const handleAddNote = async (leadId: string) => {
    if (!newNoteText.trim()) return;
    if (!user) {
      login();
      return;
    }
    const targetLead =
      savedLeads.find((l) => l.id === leadId) ||
      (selectedLead?.id === leadId ? selectedLead : null);
    if (!targetLead) return;

    const newNoteItem = {
      id: Math.random().toString(36).substring(2, 11),
      content: newNoteText.trim(),
      date: new Date().toISOString(),
    };

    const currentNotesList = targetLead.notesList || [];
    const updatedNotesList = [newNoteItem, ...currentNotesList];

    await handleUpdateCRM(leadId, { notesList: updatedNotesList });
    setNewNoteText("");
  };

  const handleDeleteNote = async (leadId: string, noteId: string) => {
    const targetLead =
      savedLeads.find((l) => l.id === leadId) ||
      (selectedLead?.id === leadId ? selectedLead : null);
    if (!targetLead) return;

    const currentNotesList = targetLead.notesList || [];
    const updatedNotesList = currentNotesList.filter((n) => n.id !== noteId);

    await handleUpdateCRM(leadId, { notesList: updatedNotesList });
  };

  const handleSaveEditedNote = async (leadId: string, noteId: string) => {
    if (!editingNoteText.trim()) return;
    const targetLead =
      savedLeads.find((l) => l.id === leadId) ||
      (selectedLead?.id === leadId ? selectedLead : null);
    if (!targetLead) return;

    const currentNotesList = targetLead.notesList || [];
    const updatedNotesList = currentNotesList.map((n) =>
      n.id === noteId ? { ...n, content: editingNoteText.trim() } : n,
    );

    await handleUpdateCRM(leadId, { notesList: updatedNotesList });
    setEditingNoteId(null);
    setEditingNoteText("");
  };

  const handleExportCSV = () => {
    if (savedLeads.length === 0) return;

    const leadsToExport =
      activeTab === "saved" ? filteredSavedLeads : savedLeads;
    if (leadsToExport.length === 0) return;

    const headers = [
      "Nombre",
      "Industria",
      "Dirección",
      "Comuna",
      "Teléfono",
      "Email",
      "Sitio Web",
      "Puntaje de Madurez",
      "Estado CRM",
      "Fecha de Creación",
      "Notas",
    ];

    const getLeadScore = (l: Lead): number => {
      let score = 50;
      if (l.analysis) {
        score = 0;
        const seo =
          l.status === "optimized"
            ? "good"
            : l.status === "old_tech"
              ? "warning"
              : "critic";
        score += seo === "good" ? 20 : seo === "warning" ? 10 : 0;
        score += 20;
        score += l.website ? 20 : 0;
        score += l.phone ? 20 : 0;
        score += l.notesList && l.notesList.length > 0 ? 20 : 10;
      } else {
        const fieldsScore =
          (l.website ? 25 : 0) +
          (l.phone ? 25 : 0) +
          (l.comuna ? 25 : 0) +
          (l.industry ? 25 : 0);
        score = fieldsScore;
      }
      return score;
    };

    const getLeadDate = (l: Lead): string => {
      if (!l.createdAt) {
        if (l.lastFound)
          return new Date(l.lastFound).toLocaleDateString("es-CL");
        return new Date().toLocaleDateString("es-CL");
      }
      if (typeof l.createdAt.toDate === "function") {
        return l.createdAt.toDate().toLocaleDateString("es-CL");
      }
      if (typeof l.createdAt.seconds === "number") {
        return new Date(l.createdAt.seconds * 1000).toLocaleDateString("es-CL");
      }
      const d = new Date(l.createdAt);
      if (!isNaN(d.getTime())) return d.toLocaleDateString("es-CL");
      return new Date().toLocaleDateString("es-CL");
    };

    const crmLabels: Record<string, string> = {
      new: "Nuevo",
      wait: "Por Contactar",
      contacted: "Contactado",
      pitching: "Propuesta",
      closed: "Cerrado",
      rejected: "Perdido",
      modern: "Muy Moderno",
    };

    const rows = leadsToExport.map((l) => {
      const name = l.name || "";
      const industry = l.industry || "";
      const address = l.location || "";
      const comuna = l.comuna || "";
      const phone = l.phone || "";
      const email = l.email || "";
      const website = l.website || "";
      const score = getLeadScore(l);
      const status = crmLabels[l.crmStatus || "new"] || "Nuevo";
      const createdAt = getLeadDate(l);
      const notesJoined = l.notesList
        ? l.notesList.map((n) => n.content).join(" | ")
        : "";

      return [
        name,
        industry,
        address,
        comuna,
        phone,
        email,
        website,
        `${score}/100`,
        status,
        createdAt,
        notesJoined,
      ].map((val) => {
        const escaped = String(val).replace(/"/g, '""');
        return `"${escaped}"`;
      });
    });

    const csvContent =
      "\uFEFF" +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const filename = `leads_guardados_${new Date().toISOString().slice(0, 10)}.csv`;
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const analyzeLead = async (lead: Lead) => {
    setSelectedLead(lead);
    setShowDeleteConfirm(false);
    setAnalyzing(true);
    setAnalysis(null);
    setSelectedHistoryIndex(null);
    try {
      const response = await axios.post("/api/leads/analyze", { lead });
      const newAnalysis = response.data;
      setAnalysis(newAnalysis);

      const previousAnalysis = lead.analysis;
      let updatedHistory = lead.analysisHistory
        ? [...lead.analysisHistory]
        : [];

      if (previousAnalysis) {
        const archiveEntry = {
          date: lead.lastFound || new Date().toISOString(),
          analysis: previousAnalysis,
        };
        const isDuplicate =
          updatedHistory.length > 0 &&
          JSON.stringify(updatedHistory[0].analysis) ===
            JSON.stringify(previousAnalysis);

        if (!isDuplicate) {
          updatedHistory = [archiveEntry, ...updatedHistory];
        }
      }

      const isSaved = savedLeads.some((l) => l.id === lead.id);
      const lastFoundTime = new Date().toISOString();

      if (isSaved && user) {
        await updateDoc(doc(db, "saved_leads", lead.id), {
          analysis: newAnalysis,
          analysisHistory: updatedHistory,
          lastFound: lastFoundTime,
        });
        setSavedLeads((prev) =>
          prev.map((l) =>
            l.id === lead.id
              ? {
                  ...l,
                  analysis: newAnalysis,
                  analysisHistory: updatedHistory,
                  lastFound: lastFoundTime,
                }
              : l,
          ),
        );
      }

      setSelectedLead((prev) =>
        prev && prev.id === lead.id
          ? {
              ...prev,
              analysis: newAnalysis,
              analysisHistory: updatedHistory,
              lastFound: lastFoundTime,
            }
          : prev,
      );
    } catch (error) {
      console.error("Analysis failed", error);
    } finally {
      setAnalyzing(false);
    }
  };

  const toggleSaveLead = async (lead: Lead, forceDelete: boolean = false) => {
    if (!user) {
      login();
      return;
    }

    const isSaved = savedLeads.some((l) => l.id === lead.id);

    if (isSaved && !forceDelete) {
      setShowDeleteConfirm(true);
      return;
    }

    setShowDeleteConfirm(false);
    setSavingLeadId(lead.id);

    try {
      if (isSaved) {
        await deleteDoc(doc(db, "saved_leads", lead.id));
        setSavedLeads((prev) => prev.filter((l) => l.id !== lead.id));
      } else {
        const leadToSave = {
          ...lead,
          analysis: analysis || lead.analysis, // Save analysis if it exists
          analysisHistory:
            (selectedLead?.id === lead.id
              ? selectedLead.analysisHistory
              : lead.analysisHistory) || [],
          userId: user.uid,
          createdAt: serverTimestamp(),
          crmStatus: "new" as const,
        };
        await setDoc(doc(db, "saved_leads", lead.id), leadToSave);
        setSavedLeads((prev) => [...prev, leadToSave as Lead]);
      }
    } catch (error) {
      console.error("Toggle save failed", error);
    } finally {
      setSavingLeadId(null);
    }
  };

  const industries = ["all", ...new Set(savedLeads.map((l) => l.industry))];
  const crmStatuses = [
    "all",
    "new",
    "wait",
    "contacted",
    "pitching",
    "closed",
    "rejected",
    "modern",
  ];

  const filteredSavedLeads = savedLeads.filter((l) => {
    const matchesIndustry =
      industryFilter === "all" || l.industry === industryFilter;
    const matchesCrmStatus =
      crmStatusFilter === "all" || (l.crmStatus || "new") === crmStatusFilter;
    return matchesIndustry && matchesCrmStatus;
  });

  const currentLeads = (activeTab === "search" ? leads : filteredSavedLeads)
    .map((lead) => {
      const saved = savedLeads.find((l) => l.id === lead.id);
      return saved ? { ...lead, ...saved } : lead;
    })
    .filter((lead) => {
      if (techFilter === "all") return true;
      if (techFilter === "weak")
        return lead.status === "no_website" || lead.status === "old_tech";
      return lead.status === techFilter;
    })
    .filter((lead) => {
      if (comunaFilter.length === 0 || comunaFilter.includes("all"))
        return true;
      const c = lead.comuna || extractComuna(lead.location);
      return comunaFilter.some((sel) => sel.toLowerCase() === c.toLowerCase());
    })
    .filter((lead) => {
      const activeSearchTerm = activeTab === "search" ? queryInput : localSearchTerm;
      if (!activeSearchTerm.trim()) return true;
      const term = activeSearchTerm.toLowerCase();
      const notesString = lead.notes ? lead.notes.toLowerCase() : "";
      const notesListString = lead.notesList
        ? lead.notesList
            .map((n) => n.content)
            .join(" ")
            .toLowerCase()
        : "";
      return (
        lead.name.toLowerCase().includes(term) ||
        (lead.industry || "").toLowerCase().includes(term) ||
        (lead.location || "").toLowerCase().includes(term) ||
        (lead.website || "").toLowerCase().includes(term) ||
        notesString.includes(term) ||
        notesListString.includes(term)
      );
    })
    .sort((a, b) => {
      const score = { no_website: 3, old_tech: 2, optimized: 1 };
      const scoreA = score[a.status] || 0;
      const scoreB = score[b.status] || 0;
      return scoreB - scoreA;
    });

  const visibleLeads = currentLeads.slice(0, visibleLeadsCount);

  const countPool = activeTab === "search" ? leads : filteredSavedLeads;
  const techCounts = {
    all: countPool.length,
    weak: countPool.filter(
      (l) => l.status === "no_website" || l.status === "old_tech",
    ).length,
    no_website: countPool.filter((l) => l.status === "no_website").length,
    old_tech: countPool.filter((l) => l.status === "old_tech").length,
    optimized: countPool.filter((l) => l.status === "optimized").length,
  };

  const comunaCounts = {
    all: countPool.length,
    ...CHILE_COMUNAS.reduce(
      (acc, c) => {
        acc[c.name] = countPool.filter((lead) => {
          const leadComuna = lead.comuna || extractComuna(lead.location);
          return leadComuna.toLowerCase() === c.name.toLowerCase();
        }).length;
        return acc;
      },
      {} as Record<string, number>,
    ),
  };

  const activeAnalysis =
    selectedHistoryIndex !== null && selectedLead?.analysisHistory
      ? selectedLead.analysisHistory[selectedHistoryIndex]?.analysis
      : analysis || selectedLead?.analysis;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">
      {/* Navigation */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-bottom border-slate-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <Zap className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-800">
              LeadGen <span className="text-indigo-600">AI</span>
            </span>
            {isSimulated && (
              <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-amber-200 flex items-center gap-1.5 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                Modo Simulación
              </span>
            )}
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-500 mr-4">
              <span className="flex items-center gap-1.5">
                <Database className="w-4 h-4" />{" "}
                {activeTab === "search" ? leads.length : savedLeads.length}{" "}
                Leads
              </span>
            </div>

            {user ? (
              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-slate-900">
                    {user.displayName}
                  </p>
                  <p className="text-[10px] text-slate-500">{user.email}</p>
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-5 h-5" />
                </button>
                <img
                  src={user.photoURL || ""}
                  className="w-8 h-8 rounded-full border-2 border-indigo-100"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              <button
                onClick={login}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold hover:bg-indigo-100 transition-colors"
              >
                <LogIn className="w-4 h-4" /> Entrar
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Tab Switcher */}
        <div className="flex justify-center mb-12">
          <div className="bg-slate-200/50 p-1 rounded-2xl flex gap-1">
            <button
              id="tour-search-tab"
              onClick={() => setActiveTab("search")}
              className={`px-8 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === "search" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              Buscador
            </button>
            <button
              id="tour-saved-tab"
              onClick={() => setActiveTab("saved")}
              className={`px-8 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === "saved" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              Mis Leads {savedLeads.length > 0 && `(${savedLeads.length})`}
            </button>
            <button
              id="tour-stats-tab"
              onClick={() => setActiveTab("stats")}
              className={`px-8 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === "stats" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              Estadísticas CRM
            </button>
            <button
              onClick={() => setActiveTab("reminders")}
              className={`px-8 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5 ${activeTab === "reminders" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              <Bell className="w-4 h-4 text-indigo-500" />
              Agenda / Recordatorios
              {savedLeads.filter((l) => l.reminderAt).length > 0 && (
                <span className="bg-rose-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-black">
                  {savedLeads.filter((l) => l.reminderAt).length}
                </span>
              )}
            </button>
          </div>
        </div>

        {isSimulated && activeTab === "search" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 bg-amber-50 border-2 border-amber-100 rounded-3xl flex items-center gap-4 text-amber-800"
          >
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-amber-500 shadow-sm">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm">Modo demo activo (Simulación)</p>
              <p className="opacity-80 text-xs">
                Asegúrate de que la <strong>'Places API (New)'</strong> esté
                habilitada en Google Cloud.
              </p>
            </div>
            <a
              href="https://console.cloud.google.com/apis/library/places.googleapis.com"
              target="_blank"
              rel="noreferrer"
              className="bg-amber-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-amber-700 transition"
            >
              Solucionar
            </a>
            <button
              onClick={() => setIsSimulated(false)}
              className="p-2 text-amber-300 hover:text-amber-500"
            >
              ✕
            </button>
          </motion.div>
        )}

        {activeTab === "search" ? (
          <section className="mb-16 text-center max-w-2xl mx-auto">
            <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight sm:text-5xl">
              Encuentra clientes en{" "}
              <span className="text-indigo-600">Chile</span> que necesitan{" "}
              <span className="text-indigo-600 italic">IA</span>.
            </h1>
            <p className="text-slate-600 text-lg mb-8 leading-relaxed">
              Escanea negocios locales en comunas clave de Santiago. Identifica
              brechas tecnológicas y genera propuestas automatizadas de IA.
            </p>

            <form
              id="tour-search-form"
              onSubmit={handleSearch}
              className="relative group flex gap-3"
            >
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Ej: Odontólogos en Santiago Centro, Restaurantes en La Florida, Talleres en Maipú..."
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                  className="w-full pl-14 pr-32 py-5 bg-white border-2 border-slate-200 rounded-3xl shadow-2xl shadow-indigo-100/50 focus:border-indigo-500 focus:ring-0 transition-all outline-none text-lg font-medium text-slate-700"
                />
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                <button
                  type="submit"
                  disabled={loading}
                  className="absolute right-2.5 top-2.5 bottom-2.5 px-8 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-2xl font-bold transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-indigo-200 cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Escanear"
                  )}
                </button>
              </div>
              <button
                type="button"
                onClick={() => setIsFiltersModalOpen(true)}
                className="px-6 bg-white border-2 border-slate-200 hover:border-indigo-400 hover:text-indigo-600 rounded-3xl font-bold text-slate-500 transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-100/30"
              >
                <SlidersHorizontal className="w-5 h-5" />
                <span className="hidden sm:inline">Filtrar</span>
              </button>
            </form>

            {/* Historial de Búsquedas Recientes */}
            {recentSearches.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 flex flex-col items-center gap-2 px-1 text-left sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex flex-wrap items-center gap-1.5 w-full">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1 shrink-0 mr-1">
                    <History className="w-3.5 h-3.5 text-slate-400" />{" "}
                    Recientes:
                  </span>
                  <div className="flex flex-wrap gap-1.5 items-center">
                    {recentSearches.map((search, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          setQueryInput(search);
                          executeSearch(search);
                        }}
                        className="group/tag flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-indigo-50/60 border border-slate-150 hover:border-indigo-155 rounded-xl text-[11px] font-bold text-slate-600 hover:text-indigo-700 cursor-pointer transition-all duration-200 active:scale-95"
                      >
                        <Clock className="w-2.5 h-2.5 text-slate-400 group-hover/tag:text-indigo-400 transition-colors" />
                        <span
                          className="truncate max-w-[140px] sm:max-w-[200px]"
                          title={search}
                        >
                          {search}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => removeRecentSearch(search, e)}
                          className="p-0.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all ml-0.5"
                          title="Eliminar de recientes"
                        >
                          <X className="w-2.5 h-2.5 stroke-[2.5]" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={clearAllRecentSearches}
                      className="text-[9.5px] font-black uppercase tracking-wider text-slate-400 hover:text-rose-600 px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                    >
                      Limpiar todo
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Opción de Escaneo Profundo */}
            <div className="mt-5 flex items-center justify-center">
              <button
                type="button"
                onClick={() => setDeepScan(!deepScan)}
                className={`flex items-center gap-3.5 px-5 py-3 rounded-2xl border-2 transition-all cursor-pointer ${
                  deepScan
                    ? "bg-gradient-to-r from-indigo-50 to-violet-50/60 border-indigo-200 text-indigo-750 shadow-md shadow-indigo-100/50"
                    : "bg-white border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-700"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${
                    deepScan
                      ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
                      : "border-slate-300 bg-white"
                  }`}
                >
                  {deepScan && (
                    <Check className="w-3.5 h-3.5 stroke-[3] text-white" />
                  )}
                </div>
                <div className="text-left">
                  <span className="font-extrabold text-[12px] block uppercase tracking-wider leading-none flex items-center gap-1.5 text-slate-800">
                    <Sparkles
                      className={`w-3.5 h-3.5 ${deepScan ? "text-indigo-605 animate-pulse" : "text-slate-450"}`}
                    />
                    Escaneo Ultra-Profundo (11 Comunas)
                  </span>
                  <span className="text-[10.5px] text-slate-500/90 font-medium block mt-1">
                    Multiplica x2.5 los prospectos por comuna y expande el radar
                    digital a todo Santiago.
                  </span>
                </div>
              </button>
            </div>
          </section>
        ) : activeTab === "saved" ? (
          <section className="mb-12 text-center max-w-2xl mx-auto">
            <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight sm:text-5xl">
              Mis{" "}
              <span className="text-indigo-600 italic">Leads Guardados</span>.
            </h1>
            <p className="text-slate-600 text-lg mb-6">
              Aquí puedes ver todos los prospectos que has guardado para
              seguimiento.
            </p>

            {savedLeads.length > 0 && (
              <div className="relative max-w-xl mx-auto mb-8 flex gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Buscar en mis leads por nombre, rubro, comuna o notas..."
                    value={localSearchTerm}
                    onChange={(e) => setLocalSearchTerm(e.target.value)}
                    className="w-full pl-14 pr-10 py-4 bg-white border-2 border-slate-200 rounded-3xl shadow-xl shadow-indigo-100/30 focus:border-indigo-500 focus:ring-0 transition-all outline-none text-base font-medium text-slate-700"
                  />
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 focus-within:text-indigo-600 transition-colors" />
                  {localSearchTerm && (
                    <button
                      type="button"
                      onClick={() => setLocalSearchTerm("")}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer transition"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setIsFiltersModalOpen(true)}
                  className="px-6 bg-white border-2 border-slate-200 hover:border-indigo-400 hover:text-indigo-600 rounded-3xl font-bold text-slate-500 transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-100/30"
                >
                  <SlidersHorizontal className="w-5 h-5" />
                  <span className="hidden sm:inline">Filtrar</span>
                </button>
              </div>
            )}

            {savedLeads.length > 0 && (
              <div className="flex justify-center gap-3 mb-8">
                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-650 hover:to-teal-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center cursor-pointer group"
                >
                  <FileDown className="w-4 h-4 group-hover:scale-110 transition" />
                  <span>
                    Exportar a CSV / Excel ({filteredSavedLeads.length})
                  </span>
                </button>
              </div>
            )}

            {savedLeads.length > 0 && (
              <div className="bg-slate-50 border border-slate-100/80 rounded-[32px] p-6 max-w-2xl mx-auto space-y-5 shadow-sm">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-left mb-2.5">
                    Filtrar por Industria
                  </p>
                  <div className="flex flex-wrap gap-2 justify-start">
                    {industries.map((industry) => (
                      <button
                        key={industry}
                        onClick={() => setIndustryFilter(industry)}
                        className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all border-2 ${
                          industryFilter === industry
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100"
                            : "bg-white border-slate-100 text-slate-500 hover:border-indigo-200 hover:bg-slate-50"
                        }`}
                      >
                        {industry === "all" ? "Todas" : industry}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-200/60" />

                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-left mb-2.5">
                    Filtrar por Estado CRM
                  </p>
                  <div className="flex flex-wrap gap-2 justify-start">
                    {crmStatuses.map((status) => {
                      const labels: Record<string, string> = {
                        all: "Todos los estados",
                        new: "Nuevo",
                        wait: "Por Contactar (En Espera)",
                        contacted: "Contactado",
                        pitching: "Propuesta",
                        closed: "Cerrado",
                        rejected: "Perdido",
                        modern: "Muy Moderno",
                      };
                      const colors: Record<string, string> = {
                        all: "active:bg-indigo-600 active:border-indigo-600",
                        new: "text-blue-600 border-blue-100 bg-blue-50/50 hover:bg-blue-50",
                        wait: "text-cyan-600 border-cyan-100 bg-cyan-50/50 hover:bg-cyan-50",
                        contacted:
                          "text-purple-600 border-purple-100 bg-purple-50/50 hover:bg-purple-50",
                        pitching:
                          "text-amber-600 border-amber-100 bg-amber-50/50 hover:bg-amber-50",
                        closed:
                          "text-emerald-600 border-emerald-100 bg-emerald-50/50 hover:bg-emerald-50",
                        rejected:
                          "text-rose-600 border-rose-100 bg-rose-50/50 hover:bg-rose-50",
                        modern:
                          "text-slate-500 border-slate-200 bg-slate-50 hover:bg-slate-100/80",
                      };

                      const isActive = crmStatusFilter === status;

                      return (
                        <button
                          key={status}
                          onClick={() => setCrmStatusFilter(status)}
                          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all border-2 ${
                            isActive
                              ? status === "all"
                                ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100"
                                : status === "new"
                                  ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100"
                                  : status === "wait"
                                    ? "bg-cyan-600 border-cyan-600 text-white shadow-lg shadow-cyan-100"
                                    : status === "contacted"
                                      ? "bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-100"
                                      : status === "pitching"
                                        ? "bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-100"
                                        : status === "closed"
                                          ? "bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-100"
                                          : status === "modern"
                                            ? "bg-slate-600 border-slate-600 text-white shadow-lg shadow-slate-100"
                                            : "bg-rose-600 border-rose-600 text-white shadow-lg shadow-rose-100"
                              : status === "all"
                                ? "bg-white border-slate-100 text-slate-500 hover:border-indigo-200 hover:bg-slate-50"
                                : `bg-white border-slate-100 ${colors[status]} hover:border-current`
                          }`}
                        >
                          {labels[status]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </section>
        ) : null}

        {/* Results Grid */}
        {activeTab !== "stats" && activeTab !== "reminders" ? (
          <div
            id="tour-grid"
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
          >
            <div
              id="tour-leads-list"
              className={`${selectedLead ? "lg:col-span-4" : "lg:col-span-5"} space-y-4 transition-all duration-300`}
            >
              {/* Header and Filter trigger */}
              <div className="bg-white border border-slate-150 rounded-[28px] p-4 shadow-sm space-y-3.5 text-left">
                <div className="flex items-center justify-between gap-2.5">
                  <h2 className="text-lg font-black flex items-center gap-2 text-slate-800">
                    {activeTab === "search"
                      ? "Resultados del Escaneo"
                      : "Mi Colección"}
                    {currentLeads.length > 0 && (
                      <span className="bg-indigo-50 border border-indigo-150 text-indigo-600 text-xs px-2 py-0.5 rounded-full font-black">
                        {currentLeads.length}
                      </span>
                    )}
                  </h2>
                  <div className="flex items-center gap-2 shrink-0">
                    {activeTab === "saved" && currentLeads.length > 0 && (
                      <button
                        type="button"
                        onClick={handleExportCSV}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-750 hover:text-emerald-850 border border-emerald-150 rounded-xl text-[10.5px] font-black uppercase tracking-wider cursor-pointer transition-all shrink-0 group"
                        title="Exportar lista filtrada a CSV"
                      >
                        <FileDown className="w-3.5 h-3.5 group-hover:scale-110 transition" />
                        <span className="hidden xs:inline">Exportar</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Active Filter ribbon details */}
                <div className="flex items-center justify-between gap-4 pt-3 border-t border-slate-100 text-[11px] font-bold text-slate-500">
                  <span className="flex items-center gap-1 text-slate-450 uppercase text-[9.5px] tracking-wide">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse shrink-0" />
                    {techFilter === "all"
                      ? "Ver todos los leads"
                      : `Madurez: ${techFilter === "weak" ? "Prioritarios" : techFilter === "no_website" ? "Sin Web" : techFilter === "old_tech" ? "Web Básica" : "Optimizado"}`}
                  </span>
                  <span className="truncate max-w-[170px] text-indigo-600 font-extrabold uppercase text-[9.5px] tracking-wide">
                    📍{" "}
                    {comunaFilter.length === 0
                      ? "Todas las comunas"
                      : comunaFilter.join(", ")}
                  </span>
                </div>
              </div>

              {/* FILTROS AVANZADOS MODAL OVERLAY */}
              <AnimatePresence>
                {isFiltersModalOpen && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setIsFiltersModalOpen(false)}
                      className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                    />

                    {/* Modal Box */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 15 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 15 }}
                      className="bg-white border border-slate-150 rounded-[32px] shadow-2xl p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative z-10 space-y-6 text-left"
                    >
                      <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 block">
                            Consola de Segmentación
                          </span>
                          <h3 className="text-xl font-black text-slate-800 tracking-tight mt-1">
                            Filtros Avanzados
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsFiltersModalOpen(false)}
                          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition cursor-pointer"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                        {/* LEFT COLUMN: Madurez Tecnológica */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <Cpu className="w-4 h-4 text-indigo-600 shrink-0" />
                            <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                              Madurez Tecnológica
                            </h4>
                          </div>

                          {/* Distribution Stacked Bar */}
                          {(() => {
                            const total = techCounts.all;
                            const pctNoWeb =
                              total > 0
                                ? (techCounts.no_website / total) * 100
                                : 0;
                            const pctOld =
                              total > 0
                                ? (techCounts.old_tech / total) * 100
                                : 0;
                            const pctOpt =
                              total > 0
                                ? (techCounts.optimized / total) * 100
                                : 0;

                            return (
                              <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl space-y-2">
                                <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden flex">
                                  {total > 0 ? (
                                    <>
                                      <div
                                        style={{ width: `${pctNoWeb}%` }}
                                        className="bg-slate-300 transition-all duration-500"
                                      />
                                      <div
                                        style={{ width: `${pctOld}%` }}
                                        className="bg-amber-400 transition-all duration-500 animate-pulse"
                                      />
                                      <div
                                        style={{ width: `${pctOpt}%` }}
                                        className="bg-emerald-500 transition-all duration-500"
                                      />
                                    </>
                                  ) : (
                                    <div className="w-full bg-slate-105" />
                                  )}
                                </div>
                                {total > 0 && (
                                  <div className="flex justify-between items-center text-[9px] font-black text-slate-400">
                                    <span className="flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 inline-block" />
                                      {Math.round(pctNoWeb)}% Sin Web
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-450 inline-block animate-pulse" />
                                      {Math.round(pctOld)}% Básica
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                                      {Math.round(pctOpt)}% Opt.
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          })()}

                          {/* Speed filters */}
                          <div className="flex flex-col gap-1.5">
                            {[
                              {
                                id: "all",
                                label: "Ver Todos los Leads",
                                emoji: "⚡",
                                count: techCounts.all,
                                colors:
                                  "bg-slate-50 hover:bg-slate-100 border-slate-150 text-slate-700",
                              },
                              {
                                id: "weak",
                                label: "Prioritarios",
                                emoji: "🔥",
                                count: techCounts.weak,
                                colors:
                                  "bg-rose-50/40 hover:bg-rose-50 border-rose-100 text-rose-700",
                              },
                              {
                                id: "no_website",
                                label: "Sin Web (Bajo)",
                                emoji: "🌐",
                                count: techCounts.no_website,
                                colors:
                                  "bg-slate-50 hover:bg-slate-100 border-slate-150 text-slate-600",
                              },
                              {
                                id: "old_tech",
                                label: "Web Básica (Alto)",
                                emoji: "⭐",
                                count: techCounts.old_tech,
                                colors:
                                  "bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-800 font-extrabold",
                              },
                              {
                                id: "optimized",
                                label: "Modernizado",
                                emoji: "✨",
                                count: techCounts.optimized,
                                colors:
                                  "bg-emerald-50 hover:bg-emerald-100 border-emerald-150 text-emerald-800",
                              },
                            ].map((item) => {
                              const isActive = techFilter === item.id;
                              return (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => setTechFilter(item.id as any)}
                                  className={`w-full text-left p-2.5 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-all ${
                                    isActive
                                      ? "bg-indigo-650 border-indigo-650 text-white font-black shadow-sm"
                                      : item.colors
                                  }`}
                                >
                                  <span className="flex items-center gap-2">
                                    <span>{item.emoji}</span>
                                    <span>{item.label}</span>
                                  </span>
                                  <span
                                    className={`text-[9.5px] font-black rounded-lg px-2 py-0.5 shrink-0 ${
                                      isActive
                                        ? "bg-white/20 text-white"
                                        : "bg-slate-100 text-slate-500 border border-slate-200/50"
                                    }`}
                                  >
                                    {item.count}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* RIGHT COLUMN: Comunas de Santiago */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-orange-500 shrink-0" />
                            <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                              Comunas y Oportunidades
                            </h4>
                          </div>

                          <p className="text-[11.5px] text-slate-450 leading-relaxed font-semibold">
                            Busca y selecciona múltiples comunas
                            simultáneamente. Se listan según volumen de leads
                            escaneados.
                          </p>

                          {/* Search input */}
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="Buscar comuna..."
                              value={comunasDropdownSearch}
                              onChange={(e) =>
                                setComunasDropdownSearch(e.target.value)
                              }
                              className="w-full pl-8 pr-7 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500 transition-all"
                            />
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                            {comunasDropdownSearch && (
                              <button
                                type="button"
                                onClick={() => setComunasDropdownSearch("")}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 rounded"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          {/* Scrollable list */}
                          <div className="border border-slate-150 rounded-2xl p-2 bg-slate-50/50 max-h-[190px] overflow-y-auto space-y-1.5 scrollbar-thin text-left">
                            {(() => {
                              const sorted = [...CHILE_COMUNAS].sort((a, b) => {
                                const countA =
                                  comunaCounts[
                                    a.name as keyof typeof comunaCounts
                                  ] || 0;
                                const countB =
                                  comunaCounts[
                                    b.name as keyof typeof comunaCounts
                                  ] || 0;
                                if (countB !== countA) return countB - countA;
                                return b.score - a.score;
                              });
                              const filtered = sorted.filter((c) =>
                                c.name
                                  .toLowerCase()
                                  .includes(
                                    comunasDropdownSearch.toLowerCase(),
                                  ),
                              );

                              if (filtered.length === 0) {
                                return (
                                  <div className="text-center p-4 text-slate-400 text-xs">
                                    No hay resultados
                                  </div>
                                );
                              }

                              return filtered.map((comunaInfo) => {
                                const isSelected = comunaFilter.includes(
                                  comunaInfo.name,
                                );
                                const count =
                                  comunaCounts[
                                    comunaInfo.name as keyof typeof comunaCounts
                                  ] || 0;
                                return (
                                  <button
                                    key={comunaInfo.name}
                                    type="button"
                                    onClick={() => {
                                      setComunaFilter((prev) => {
                                        if (prev.includes(comunaInfo.name)) {
                                          return prev.filter(
                                            (x) => x !== comunaInfo.name,
                                          );
                                        } else {
                                          return [...prev, comunaInfo.name];
                                        }
                                      });
                                    }}
                                    className={`w-full text-left p-2 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-all ${
                                      isSelected
                                        ? "bg-indigo-600 border-indigo-600 text-white font-extrabold shadow-sm"
                                        : "bg-white hover:bg-slate-55 border-slate-100 text-slate-700 hover:border-slate-200"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <div
                                        className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${isSelected ? "border-white/50 bg-white/20" : "border-slate-300 bg-white"}`}
                                      >
                                        {isSelected && (
                                          <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                                        )}
                                      </div>
                                      <span className="truncate">
                                        {comunaInfo.name} ({count})
                                      </span>
                                    </div>
                                    <span
                                      className={`text-[9.5px] font-black px-1.5 py-0.2 rounded-md ${
                                        isSelected
                                          ? "bg-white/20 text-white"
                                          : comunaInfo.level === "very_high"
                                            ? "bg-rose-50 text-rose-600 border border-rose-100"
                                            : comunaInfo.level === "high"
                                              ? "bg-amber-50 text-amber-600 border border-amber-100"
                                              : "bg-indigo-50 text-indigo-600 border border-indigo-100"
                                      }`}
                                    >
                                      {comunaInfo.level === "very_high"
                                        ? "🔥"
                                        : comunaInfo.level === "high"
                                          ? "⚡"
                                          : "📈"}{" "}
                                      {comunaInfo.score} Pts
                                    </span>
                                  </button>
                                );
                              });
                            })()}
                          </div>

                          {/* Selected tags */}
                          {comunaFilter.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
                              {comunaFilter.map((name) => (
                                <span
                                  key={name}
                                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-indigo-50 border border-indigo-150 text-indigo-700 text-[10.5px] font-black"
                                >
                                  {name}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setComunaFilter((prev) =>
                                        prev.filter((x) => x !== name),
                                      )
                                    }
                                    className="hover:text-indigo-900 ml-1"
                                  >
                                    <X className="w-2.5 h-2.5 shrink-0" />
                                  </button>
                                </span>
                              ))}
                              <button
                                type="button"
                                onClick={() => setComunaFilter([])}
                                className="text-[10px] text-slate-400 hover:text-indigo-600 font-bold ml-auto cursor-pointer"
                              >
                                Limpiar todo
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Modal footer action */}
                      <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
                        {techFilter !== "all" || comunaFilter.length > 0 ? (
                          <button
                            type="button"
                            onClick={() => {
                              setTechFilter("all");
                              setComunaFilter([]);
                            }}
                            className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-700 rounded-2xl text-xs font-bold transition-all cursor-pointer"
                          >
                            Restablecer Filtros
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => setIsFiltersModalOpen(false)}
                          className="px-6 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-100 rounded-2xl text-xs font-black transition-all cursor-pointer hover:scale-[1.01]"
                        >
                          Aplicar y Cerrar
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

              <motion.div
                key={`${activeTab}-${techFilter}-${comunaFilter.join(",")}-${industryFilter}-${crmStatusFilter}-${loading}`}
                className="space-y-4 lg:max-h-[calc(100vh-270px)] lg:overflow-y-auto pr-1.5 custom-scrollbar scroll-smooth"
                initial="hidden"
                animate="show"
                variants={{
                  hidden: { opacity: 0 },
                  show: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.025,
                    },
                  },
                }}
              >
                <AnimatePresence mode="popLayout">
                  {currentLeads.length === 0 && !loading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="py-24 text-center bg-white rounded-[32px] border-2 border-dashed border-slate-200"
                    >
                      <div className="w-16 h-16 bg-slate-50 rounded-2xl mb-6 mx-auto flex items-center justify-center text-slate-300">
                        {activeTab === "search" ? (
                          <Activity className="w-8 h-8" />
                        ) : (
                          <Bookmark className="w-8 h-8" />
                        )}
                      </div>
                      <h4 className="text-slate-900 font-bold mb-1">
                        {activeTab === "search"
                          ? "Nada por aquí todavía"
                          : "No tienes leads guardados"}
                      </h4>
                      <p className="text-slate-400 text-sm max-w-[240px] mx-auto">
                        {activeTab === "search"
                          ? "Ingresa una búsqueda arriba para empezar."
                          : "Guarda leads interesantes desde el buscador."}
                      </p>
                    </motion.div>
                  )}
                  {visibleLeads.map((lead, idx) => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      idx={idx}
                      isSelected={selectedLead?.id === lead.id}
                      isSaved={savedLeads.some((l) => l.id === lead.id)}
                      isSaving={savingLeadId === lead.id}
                      onSelect={() => {
                        setSelectedLead(lead);
                        setSelectedHistoryIndex(null);
                        setShowDeleteConfirm(false);
                        if (lead.analysis) {
                          setAnalysis(lead.analysis);
                          setAnalyzing(false);
                        } else {
                          analyzeLead(lead);
                        }
                      }}
                      onToggleSave={() => toggleSaveLead(lead)}
                    />
                  ))}

                  {currentLeads.length > visibleLeadsCount && (
                    <div className="pt-4 pb-6 text-center">
                      <button
                        type="button"
                        onClick={() => setVisibleLeadsCount((prev) => prev + 15)}
                        className="inline-flex items-center gap-2 px-6 py-3.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-800 border border-indigo-150 rounded-2xl text-xs font-black tracking-wide transition-all cursor-pointer hover:scale-[1.015]"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Ver más prospectos (+15)</span>
                        <span className="bg-indigo-100 text-indigo-650 text-[10px] px-2 py-0.5 rounded-full font-black ml-1.5">
                          {visibleLeads.length} de {currentLeads.length}
                        </span>
                      </button>
                    </div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>

            {/* Analysis View */}
            <div className={`${selectedLead ? "lg:col-span-8" : "lg:col-span-7"} transition-all duration-300`}>
              <AnimatePresence mode="wait">
                {selectedLead ? (
                  <motion.div
                    id="tour-analysis-panel"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-[48px] border border-slate-200 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] p-10 lg:sticky lg:top-24 mb-10"
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10 pb-8 border-b border-slate-100/80 items-stretch">
                      <div className="lg:col-span-7 flex flex-col justify-start space-y-5">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider leading-none border border-indigo-100/55 flex items-center gap-1.5 shadow-xs">
                              <Sparkles className="w-3 h-3" />{" "}
                              {selectedLead.industry}
                            </span>
                            {savedLeads.some(
                              (l) => l.id === selectedLead.id,
                            ) ? (
                              <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider leading-none border border-emerald-100/55 flex items-center gap-1.5 shadow-xs">
                                <BookmarkCheck className="w-3 h-3" /> Guardado
                                en Colección
                              </span>
                            ) : (
                              <span className="bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider leading-none border border-amber-150 flex items-center gap-1.5 shadow-xs">
                                <Bookmark className="w-3 h-3" /> Prospecto
                                Rápido
                              </span>
                            )}
                          </div>

                          <div className="flex items-start gap-4 mt-2">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-indigo-600 flex items-center justify-center text-white text-lg font-black tracking-wider shadow-md shadow-indigo-100/60 select-none shrink-0 mt-1">
                              {selectedLead.name
                                .split(" ")
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join("")
                                .toUpperCase()}
                            </div>
                            <div className="flex flex-col items-start gap-1">
                              <h2 className="text-3xl font-black text-slate-900 leading-tight tracking-tight">
                                {selectedLead.name}
                              </h2>
                              {selectedLead.website ? (
                                <a
                                  href={ensureAbsoluteUrl(selectedLead.website)}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => {
                                    if (selectedLead.isSimulated) {
                                      e.preventDefault();
                                      setSimulatedWebsiteUrl(selectedLead.website || "");
                                      setShowSimulatedWebsiteModal(true);
                                    }
                                  }}
                                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-700 hover:text-indigo-800 border border-indigo-200 rounded-xl text-xs font-black transition-all cursor-pointer hover:scale-[1.015] leading-none select-none"
                                >
                                  <Globe className="w-3.5 h-3.5 text-indigo-600" />
                                  <span className="underline decoration-indigo-300 decoration-2 underline-offset-2">{selectedLead.website}</span>
                                  <ExternalLink className="w-3 h-3 text-indigo-500 ml-0.5" />
                                </a>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-500 border border-slate-200 rounded-xl text-xs font-bold leading-none select-none">
                                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Sin sitio web corporativo</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Info Cards Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Website link */}
                          {selectedLead.website ? (
                            <a
                              href={ensureAbsoluteUrl(selectedLead.website)}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => {
                                if (selectedLead.isSimulated) {
                                  e.preventDefault();
                                  setSimulatedWebsiteUrl(selectedLead.website || "");
                                  setShowSimulatedWebsiteModal(true);
                                }
                              }}
                              className="p-3.5 bg-indigo-50/10 hover:bg-indigo-50/30 border border-indigo-100/30 hover:border-indigo-200 rounded-2xl transition-all duration-300 flex items-center justify-between group cursor-pointer sm:col-span-2"
                            >
                              <div className="flex items-center gap-3.5 min-w-0">
                                <div className="w-9 h-9 rounded-xl bg-indigo-100/60 text-indigo-600 flex items-center justify-center transition-all group-hover:scale-105 shrink-0">
                                  <Globe className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <span className="text-[9px] font-black text-indigo-600/80 uppercase tracking-widest block leading-none">
                                    Sitio Web Oficial
                                  </span>
                                  <p className="text-xs font-bold text-slate-800 leading-tight mt-1 truncate">
                                    {selectedLead.website}
                                  </p>
                                </div>
                              </div>
                              <ExternalLink className="w-3.5 h-3.5 text-indigo-400 group-hover:text-indigo-600 transition shrink-0 ml-2" />
                            </a>
                          ) : (
                            <div className="p-3.5 bg-slate-50/55 border border-slate-100 rounded-2xl flex items-center gap-3.5 sm:col-span-2">
                              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                                <Globe className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none">
                                  Sitio Web Oficial
                                </span>
                                <p className="text-xs font-bold text-slate-500 leading-tight mt-1">
                                  Sitio web no disponible
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Phone */}
                          <div className="p-3.5 bg-slate-50/50 hover:bg-white border border-slate-100 hover:border-slate-200/80 rounded-2xl transition-all duration-300 flex items-center gap-3.5 group">
                            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center transition-all group-hover:scale-105">
                              <Phone className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none">
                                Teléfono
                              </span>
                              <p className="text-xs font-bold text-slate-700 leading-tight mt-1 truncate">
                                {selectedLead.phone || "No disponible"}
                              </p>
                            </div>
                          </div>

                          {/* Location */}
                          <div className="p-3.5 bg-slate-50/50 hover:bg-white border border-slate-100 hover:border-slate-200/80 rounded-2xl transition-all duration-300 sm:col-span-2 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 text-left">
                                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
                                  <MapPin className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none">
                                    Ubicación y Comuna
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">
                                    {selectedLead.comuna ||
                                      extractComuna(selectedLead.location) ||
                                      "Comuna autónoma no asignada"}
                                  </span>
                                </div>
                              </div>

                              {!isEditingLocation ? (
                                <button
                                  onClick={() => {
                                    setEditLocText(selectedLead.location || "");
                                    setEditComunaSelect(
                                      selectedLead.comuna ||
                                        extractComuna(selectedLead.location),
                                    );
                                    setIsEditingLocation(true);
                                  }}
                                  className="px-2.5 py-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition rounded-lg flex items-center gap-1 cursor-pointer"
                                >
                                  ✏️ Clasificar
                                </button>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={saveLocationChanges}
                                    className="px-2.5 py-1 text-[10px] font-black text-white bg-indigo-600 hover:bg-indigo-700 transition rounded-lg cursor-pointer animate-pulse"
                                  >
                                    Guardar
                                  </button>
                                  <button
                                    onClick={() => setIsEditingLocation(false)}
                                    className="px-2.5 py-1 text-[10px] font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition rounded-lg cursor-pointer"
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              )}
                            </div>

                            {isEditingLocation ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-left">
                                <div>
                                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                                    Comuna de Chile
                                  </label>
                                  <select
                                    value={editComunaSelect}
                                    onChange={(e) =>
                                      setEditComunaSelect(e.target.value)
                                    }
                                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl p-2 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 transition"
                                  >
                                    <option value="">-- Sin Comuna --</option>
                                    {CHILE_COMUNAS.map((c) => (
                                      <option key={c.name} value={c.name}>
                                        {c.name} (
                                        {c.level === "very_high"
                                          ? "🔥 Crítica"
                                          : c.level === "high"
                                            ? "⚡ Alta"
                                            : "📈 Media"}
                                        )
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                                    Dirección Literal
                                  </label>
                                  <input
                                    type="text"
                                    value={editLocText}
                                    onChange={(e) =>
                                      setEditLocText(e.target.value)
                                    }
                                    placeholder="Ej: Providencia 1234, Santiago"
                                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl p-2 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 transition"
                                  />
                                </div>
                              </div>
                            ) : (
                              <div className="text-xs font-semibold bg-slate-50 border border-slate-100 rounded-xl p-3 leading-relaxed flex items-center justify-between text-left">
                                <span
                                  className="text-slate-700 font-bold truncate max-w-[240px]"
                                  title={selectedLead.location}
                                >
                                  {selectedLead.location || "No consignada"}
                                </span>
                                {(() => {
                                  const cName =
                                    selectedLead.comuna ||
                                    extractComuna(selectedLead.location);
                                  const comunaInfo = CHILE_COMUNAS.find(
                                    (c) =>
                                      c.name.toLowerCase() ===
                                      cName.toLowerCase(),
                                  );
                                  if (comunaInfo) {
                                    return (
                                      <span className="shrink-0 bg-indigo-50 border border-indigo-150 text-indigo-700 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg ml-2">
                                        {comunaInfo.score} Pts Oportunidad
                                      </span>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* CRM Dashboard controls on Right */}
                      <div className="lg:col-span-5 bg-slate-50/70 border border-slate-100 rounded-[32px] p-6 flex flex-col justify-between gap-6">
                        <div className="space-y-4">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                            Comercial & CRM
                          </span>

                          <div className="space-y-3">
                            {/* CRM Dropdown */}
                            <div className="bg-white border border-slate-100 rounded-xl p-4 flex flex-col gap-2.5 shadow-sm">
                              <div>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none">
                                  Fase CRM
                                </span>
                                <span className="text-[10px] font-semibold text-slate-500 block mt-1">
                                  Actualizar estado de venta
                                </span>
                              </div>
                              <select
                                value={selectedLead.crmStatus || "new"}
                                onChange={(e) =>
                                  handleUpdateCRM(selectedLead.id, {
                                    crmStatus: e.target.value as any,
                                  })
                                }
                                className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition cursor-pointer"
                              >
                                <option value="new">🆕 Nuevo</option>
                                <option value="wait">
                                  ⏳ Por Contactar / En Espera
                                </option>
                                <option value="contacted">📞 Contactado</option>
                                <option value="pitching">📝 Propuesta</option>
                                <option value="closed">✅ Ganado</option>
                                <option value="rejected">❌ Perdido</option>
                                <option value="modern">✨ Muy Moderno</option>
                              </select>
                            </div>

                            {/* Tech Maturity */}
                            <div className="bg-white border border-slate-100 rounded-xl p-4 flex flex-col gap-2.5 shadow-sm">
                              <div>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none">
                                  Madurez Tech
                                </span>
                                <span className="text-[10px] font-semibold text-slate-500 block mt-1">
                                  Estado escaneado del sitio web
                                </span>
                              </div>
                              <div className="flex">
                                <StatusBadge status={selectedLead.status} large />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Mapa de ubicación interactivo */}
                        <LeadMap
                          address={selectedLead.location}
                          name={selectedLead.name}
                        />

                        {/* Save/delete controls */}
                        <div>
                          {!showDeleteConfirm ? (
                            <button
                              onClick={() => toggleSaveLead(selectedLead)}
                              disabled={savingLeadId === selectedLead.id}
                              className={`w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                                savedLeads.some((l) => l.id === selectedLead.id)
                                  ? "bg-white border border-slate-205 text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 shadow-sm"
                                  : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100"
                              }`}
                            >
                              {savingLeadId === selectedLead.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : savedLeads.some(
                                  (l) => l.id === selectedLead.id,
                                ) ? (
                                <Trash2 className="w-3.5 h-3.5" />
                              ) : (
                                <Bookmark className="w-3.5 h-3.5" />
                              )}
                              {savedLeads.some((l) => l.id === selectedLead.id)
                                ? "Eliminar Prospecto"
                                : "Guardar Prospecto"}
                            </button>
                          ) : (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="flex flex-col gap-2 p-3 bg-rose-50/50 rounded-xl border border-rose-100"
                            >
                              <p className="text-[9px] font-black text-rose-600 uppercase tracking-widest text-center">
                                ¿Confirmar eliminación?
                              </p>
                              <div className="flex gap-2">
                                <button
                                  onClick={() =>
                                    toggleSaveLead(selectedLead, true)
                                  }
                                  className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black uppercase tracking-wide rounded-lg transition"
                                >
                                  Sí, borrar
                                </button>
                                <button
                                  onClick={() => setShowDeleteConfirm(false)}
                                  className="flex-1 py-1.5 bg-white text-slate-600 text-[10px] font-black uppercase tracking-wide border border-rose-100 rounded-lg hover:bg-slate-50 transition"
                                >
                                  No
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </div>

                    {analyzing ? (
                      <div className="py-24 flex flex-col items-center">
                        <div className="relative mb-8">
                          <div className="absolute inset-0 bg-indigo-200 rounded-full blur-2xl opacity-20 animate-pulse"></div>
                          <Loader2 className="w-16 h-16 text-indigo-600 animate-spin relative" />
                        </div>
                        <p className="text-xl font-bold text-slate-900 mb-2">
                          Generando Inteligencia
                        </p>
                        <p className="text-slate-400 text-sm max-w-xs text-center">
                          Gemini está analizando detalladamente las necesidades
                          tecnológicas de este negocio...
                        </p>
                      </div>
                    ) : activeAnalysis ? (
                      <div className="space-y-12">
                        {/* Gemini Scan History & Versioning Controls */}
                        <div className="p-6 bg-slate-50 border border-slate-100 rounded-[32px] space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                                <History className="w-5 h-5" />
                              </div>
                              <div>
                                <h4 className="text-slate-900 font-extrabold text-xs uppercase tracking-wider">
                                  Historial de Análisis Gemini
                                </h4>
                                <p className="text-[11px] text-slate-400 font-bold mt-0.5">
                                  {selectedLead.analysisHistory &&
                                  selectedLead.analysisHistory.length > 0
                                    ? `${selectedLead.analysisHistory.length + 1} análisis guardados de este lead`
                                    : "1 análisis registrado de este lead"}
                                </p>
                              </div>
                            </div>

                            <button
                              onClick={() => analyzeLead(selectedLead)}
                              disabled={analyzing}
                              className="p-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-2xl flex items-center justify-center gap-2 text-xs font-black transition active:scale-95 shadow-md shadow-indigo-100/50 hover:cursor-pointer"
                            >
                              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                              Escanear de Nuevo con IA
                            </button>
                          </div>

                          {/* Dropdown / list of versions */}
                          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200/50">
                            <button
                              onClick={() => setSelectedHistoryIndex(null)}
                              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all border ${
                                selectedHistoryIndex === null
                                  ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100/50"
                                  : "bg-white hover:bg-slate-100 text-slate-600 border-slate-200/80 cursor-pointer"
                              }`}
                            >
                              ✨ Análisis Actual (Último)
                            </button>

                            {selectedLead.analysisHistory &&
                              selectedLead.analysisHistory.map((hist, idx) => {
                                const dateStr = formatFriendlyDate(hist.date);
                                return (
                                  <button
                                    key={idx}
                                    onClick={() => setSelectedHistoryIndex(idx)}
                                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${
                                      selectedHistoryIndex === idx
                                        ? "bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-100/50"
                                        : "bg-white hover:bg-slate-100 text-slate-500 border-slate-200/80 cursor-pointer"
                                    }`}
                                  >
                                    📄 Historial: {dateStr}
                                  </button>
                                );
                              })}
                          </div>

                          {selectedHistoryIndex !== null && (
                            <div className="p-3.5 bg-purple-50/50 border border-purple-100/60 rounded-2xl flex items-center justify-between">
                              <p className="text-[11px] text-purple-700 font-bold">
                                Viendo versión anterior del análisis
                              </p>
                              <button
                                onClick={() => setSelectedHistoryIndex(null)}
                                className="text-[10px] font-black text-purple-600 bg-white hover:bg-purple-100 border border-purple-200 px-2.5 py-1 rounded-lg transition cursor-pointer"
                              >
                                Volver al Actual
                              </button>
                            </div>
                          )}
                        </div>

                        {/* CRM Annotations and Reminders */}
                        <div className="space-y-6">
                          {!savedLeads.some(
                            (l) => l.id === selectedLead.id,
                          ) && (
                            <div className="p-4 bg-indigo-50/50 border border-indigo-100/50 rounded-[24px] flex items-start gap-3 shadow-sm mb-4">
                              <Sparkles className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5 animate-pulse" />
                              <div>
                                <p className="text-[10px] font-black text-indigo-900 uppercase tracking-wider mb-0.5">
                                  Prospecto Rápido
                                </p>
                                <p className="text-[11px] text-indigo-700/80 leading-normal font-bold">
                                  Al escribir notas o programar recordatorios,
                                  el prospecto se guardará automáticamente en tu
                                  colección.
                                </p>
                              </div>
                            </div>
                          )}
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                            <div className="md:col-span-8">
                              <h4 className="flex items-center gap-3 text-indigo-900 font-black uppercase tracking-[0.2em] text-xs mb-4">
                                <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                                  <Bookmark className="w-4 h-4" />
                                </div>
                                Anotaciones CRM
                              </h4>
                              <div className="bg-white border border-slate-205 rounded-[32px] overflow-hidden focus-within:ring-2 focus-within:ring-indigo-505 focus-within:border-indigo-500 transition-all p-5 shadow-xs">
                                <textarea
                                  placeholder="Escribe aquí notas sobre este cliente, llamadas, acuerdos, notas de reuniones..."
                                  value={
                                    selectedLead.notes
                                      ? selectedLead.notes.replace(
                                          /<[^>]*>/g,
                                          "",
                                        )
                                      : ""
                                  }
                                  onChange={(e) => {
                                    const content = e.target.value;
                                    setSelectedLead((prev) =>
                                      prev ? { ...prev, notes: content } : null,
                                    );
                                  }}
                                  onBlur={(e) => {
                                    handleUpdateCRM(selectedLead.id, {
                                      notes: e.target.value,
                                    });
                                  }}
                                  className="w-full h-44 bg-transparent border-0 resize-none font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-0 text-sm leading-relaxed"
                                />
                                <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                  <span>✍️ Anotaciones CRM de Prospecto</span>
                                  <span>Autoguardado al salir de foco</span>
                                </div>
                              </div>
                            </div>

                            <div className="md:col-span-4">
                              <h4 className="flex items-center gap-3 text-indigo-900 font-black uppercase tracking-[0.2em] text-xs mb-4">
                                <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                  <Bell className="w-4 h-4" />
                                </div>
                                Recordatorio
                              </h4>
                              <div className="p-6 bg-slate-50 border border-slate-100 rounded-[32px]">
                                <p className="text-xs text-slate-500 font-bold mb-4 uppercase tracking-widest">
                                  Seguimiento
                                </p>
                                <input
                                  type="datetime-local"
                                  className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none mb-4"
                                  value={selectedLead.reminderAt || ""}
                                  onChange={(e) =>
                                    handleUpdateCRM(selectedLead.id, {
                                      reminderAt: e.target.value,
                                    })
                                  }
                                />
                                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                  <Clock className="w-3 h-3" />
                                  {selectedLead.reminderAt
                                    ? "Cita o tarea programada"
                                    : "No hay recordatorio"}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Bitácora de Notas Rápidas / Historial de Actividad */}
                          <div className="p-6 bg-slate-50 border border-slate-100/80 rounded-[32px] space-y-4">
                            <h4 className="flex items-center justify-between text-indigo-900 font-black uppercase tracking-[0.2em] text-[10px]">
                              <span className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                                  <FileText className="w-3.5 h-3.5" />
                                </div>
                                Bitácora de Notas del Cliente
                              </span>
                              <span className="text-[9px] text-slate-400 normal-case font-bold bg-white px-2.5 py-1 rounded-full border border-slate-100">
                                {selectedLead.notesList?.length || 0} notas
                                guardadas
                              </span>
                            </h4>

                            {/* Note creation input */}
                            <div className="flex gap-2">
                              <textarea
                                placeholder="Escribe un nuevo evento, comentario o nota rápida para la bitácora..."
                                className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-xs font-semibold text-slate-700 placeholder-slate-400/90 focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-20"
                                value={newNoteText}
                                onChange={(e) => setNewNoteText(e.target.value)}
                              />
                              <button
                                onClick={() => handleAddNote(selectedLead.id)}
                                disabled={!newNoteText.trim()}
                                className={`flex flex-col items-center justify-center min-w-20 rounded-2xl font-bold text-[10px] uppercase gap-1 tracking-wider transition-all duration-300 shadow-sm ${
                                  newNoteText.trim()
                                    ? "bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-100 active:scale-95"
                                    : "bg-slate-100 text-slate-300 cursor-not-allowed border border-slate-200"
                                }`}
                              >
                                <Plus className="w-4 h-4" />
                                Agregar
                              </button>
                            </div>

                            {/* Note Timeline List */}
                            {selectedLead.notesList &&
                            selectedLead.notesList.length > 0 ? (
                              <div className="space-y-3 mt-3 max-h-64 overflow-y-auto pr-2">
                                {selectedLead.notesList.map((note) => {
                                  const isEditing = editingNoteId === note.id;
                                  const formattedDate = new Date(
                                    note.date,
                                  ).toLocaleString("es-CL", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  });

                                  return (
                                    <div
                                      key={note.id}
                                      className="group bg-white border border-slate-100/80 p-4 rounded-2xl transition-all hover:border-slate-200 hover:shadow-xs relative"
                                    >
                                      {isEditing ? (
                                        <div className="space-y-2">
                                          <textarea
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                                            value={editingNoteText}
                                            onChange={(e) =>
                                              setEditingNoteText(e.target.value)
                                            }
                                          />
                                          <div className="flex gap-1.5 justify-end">
                                            <button
                                              onClick={() =>
                                                setEditingNoteId(null)
                                              }
                                              className="px-2.5 py-1 text-[10px] font-bold text-slate-500 bg-slate-100 rounded-lg hover:bg-slate-200 transition flex items-center gap-1"
                                            >
                                              <X className="w-3 h-3" /> Cancelar
                                            </button>
                                            <button
                                              onClick={() =>
                                                handleSaveEditedNote(
                                                  selectedLead.id,
                                                  note.id,
                                                )
                                              }
                                              className="px-2.5 py-1 text-[10px] font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition flex items-center gap-1 shadow-sm"
                                            >
                                              <Check className="w-3 h-3" />{" "}
                                              Guardar
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        <div>
                                          <div className="flex justify-between items-start mb-2">
                                            <span className="text-[9px] text-slate-400 font-bold tracking-wider uppercase">
                                              {formattedDate}
                                            </span>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                              <button
                                                onClick={() => {
                                                  setEditingNoteId(note.id);
                                                  setEditingNoteText(
                                                    note.content,
                                                  );
                                                }}
                                                className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                                title="Editar nota"
                                              >
                                                <Edit3 className="w-3 h-3" />
                                              </button>
                                              <button
                                                onClick={() =>
                                                  handleDeleteNote(
                                                    selectedLead.id,
                                                    note.id,
                                                  )
                                                }
                                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                                title="Eliminar nota"
                                              >
                                                <Trash2 className="w-3 h-3" />
                                              </button>
                                            </div>
                                          </div>
                                          <p className="text-xs text-slate-600 font-semibold whitespace-pre-line leading-relaxed">
                                            {note.content}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="text-[11px] text-slate-400/80 font-semibold text-center py-4 bg-white/50 border border-dashed border-slate-200/60 rounded-2xl">
                                Comienza la bitácora registrando la primera nota
                                de contacto o acuerdo arriba.
                              </p>
                            )}
                          </div>

                          {/* CRM Status History Change Log */}
                          <div className="p-6 bg-slate-50 border border-slate-100/80 rounded-[32px]">
                            <h4 className="flex items-center gap-3 text-slate-700 font-black uppercase tracking-[0.2em] text-[10px] mb-4">
                              <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                                <History className="w-3.5 h-3.5" />
                              </div>
                              Historial de Cambios de Estado CRM
                            </h4>
                            {selectedLead.statusHistory &&
                            selectedLead.statusHistory.length > 0 ? (
                              <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                                {selectedLead.statusHistory.map(
                                  (log, index) => {
                                    const statusInfo: Record<
                                      string,
                                      { label: string; color: string }
                                    > = {
                                      new: {
                                        label: "🆕 Nuevo",
                                        color:
                                          "text-blue-600 bg-blue-50 border-blue-100",
                                      },
                                      wait: {
                                        label: "⏳ Por Contactar",
                                        color:
                                          "text-cyan-600 bg-cyan-50 border-cyan-100",
                                      },
                                      contacted: {
                                        label: "📞 Contactado",
                                        color:
                                          "text-purple-600 bg-purple-50 border-purple-100",
                                      },
                                      pitching: {
                                        label: "📝 Propuesta",
                                        color:
                                          "text-amber-600 bg-amber-50 border-amber-100",
                                      },
                                      closed: {
                                        label: "✅ Ganado",
                                        color:
                                          "text-emerald-600 bg-emerald-50 border-emerald-100",
                                      },
                                      rejected: {
                                        label: "❌ Perdido",
                                        color:
                                          "text-rose-600 bg-rose-50 border-rose-100",
                                      },
                                      modern: {
                                        label: "✨ Muy Moderno",
                                        color:
                                          "text-slate-500 bg-slate-50 border-slate-200",
                                      },
                                    };
                                    const fromInfo = statusInfo[log.from] || {
                                      label: log.from,
                                      color:
                                        "text-slate-500 bg-slate-50 border-slate-100",
                                    };
                                    const toInfo = statusInfo[log.to] || {
                                      label: log.to,
                                      color:
                                        "text-slate-500 bg-slate-50 border-slate-100",
                                    };
                                    const dateStr = new Date(
                                      log.date,
                                    ).toLocaleDateString("es-CL", {
                                      day: "numeric",
                                      month: "short",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    });

                                    return (
                                      <div
                                        key={index}
                                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-white border border-slate-100 rounded-2xl text-xs"
                                      >
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span
                                            className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold ${fromInfo.color}`}
                                          >
                                            {fromInfo.label}
                                          </span>
                                          <span className="text-slate-300 font-bold">
                                            ➔
                                          </span>
                                          <span
                                            className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold ${toInfo.color}`}
                                          >
                                            {toInfo.label}
                                          </span>
                                        </div>
                                        <span className="text-[10px] text-slate-400 font-semibold">
                                          {dateStr}
                                        </span>
                                      </div>
                                    );
                                  },
                                )}
                              </div>
                            ) : (
                              <p className="text-xs text-slate-400 font-medium">
                                No se han registrado cambios de estado en este
                                prospecto aún.
                              </p>
                            )}
                          </div>
                        </div>

                        {activeAnalysis?.isFallback && (
                          <div className="p-5 bg-amber-50/70 border border-amber-200/80 rounded-[28px] flex items-start gap-3.5 shadow-xs mb-8 text-left">
                            <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
                            <div className="flex-1">
                              <p className="text-[11px] font-black text-amber-950 uppercase tracking-wider mb-1">
                                Diagnóstico Predictivo Local Activo
                              </p>
                              <p className="text-xs text-amber-800/95 leading-normal font-semibold">
                                Hemos generado el análisis utilizando nuestra
                                plantilla inteligente local de alta fidelidad
                                porque se supero el límite de llamadas del plan
                                gratuito de Gemini. El servicio continúa
                                disponible operando de forma 100% autónoma.
                              </p>
                            </div>
                          </div>
                        )}

                        <section>
                          <div className="relative mb-8">
                            <div className="absolute -inset-4 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-rose-500/10 rounded-[48px] blur-2xl"></div>
                            <div className="relative p-10 bg-[#1A1C1E] rounded-[40px] shadow-2xl overflow-hidden">
                              <div className="absolute top-0 right-0 p-8 opacity-10">
                                <Sparkles className="w-24 h-24 text-white" />
                              </div>
                              <h4 className="flex items-center gap-3 text-indigo-400 font-bold text-sm mb-6 uppercase tracking-widest">
                                <Sparkles className="w-4 h-4" /> Propuesta
                                Ganadora
                              </h4>
                              <div className="relative z-10">
                                <p className="text-white text-xl font-medium leading-relaxed mb-10 pl-6 border-l-2 border-indigo-500/50 italic opacity-90">
                                  "{activeAnalysis?.pitch}"
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4">
                                  <button
                                    onClick={() => {
                                      if (activeAnalysis?.pitch) {
                                        setOriginalPitchText(
                                          activeAnalysis.pitch,
                                        );
                                        setEditedPitchText(
                                          activeAnalysis.pitch,
                                        );
                                        setIsPitchModalOpen(true);
                                      }
                                    }}
                                    type="button"
                                    className="flex-1 py-4 bg-white text-slate-900 rounded-2xl font-black text-sm uppercase tracking-wider hover:bg-slate-100 transition shadow-xl active:scale-95 flex items-center justify-center gap-3 group"
                                  >
                                    <Mail className="w-5 h-5 group-hover:scale-110 transition" />{" "}
                                    Copiar para Email
                                  </button>
                                  <button
                                    onClick={() => {
                                      setIsPdfModalOpen(true);
                                    }}
                                    type="button"
                                    className="flex-1 py-4 bg-gradient-to-r from-emerald-500 to-indigo-600 hover:from-emerald-600 hover:to-indigo-700 text-white rounded-2xl font-black text-sm uppercase tracking-wider transition shadow-xl active:scale-95 flex items-center justify-center gap-3 group cursor-pointer"
                                  >
                                    <FileDown className="w-5 h-5 group-hover:scale-110 transition" />{" "}
                                    Reporte PDF Cliente
                                  </button>
                                  <div className="flex gap-4">
                                    <button className="p-4 bg-slate-800 text-white rounded-2xl hover:bg-slate-700 transition active:scale-95">
                                      <Database className="w-5 h-5" />
                                    </button>
                                    <button className="p-4 bg-slate-800 text-white rounded-2xl hover:bg-slate-700 transition active:scale-95">
                                      <Phone className="w-5 h-5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </section>

                        <section>
                          <h4 className="flex items-center gap-3 text-indigo-900 font-black uppercase tracking-[0.2em] text-xs mb-6">
                            <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                              <Activity className="w-4 h-4" />
                            </div>
                            Diagnóstico Digital
                          </h4>
                          <div className="p-8 bg-slate-50/50 rounded-[32px] border border-slate-100 text-slate-700 leading-relaxed text-lg">
                            {activeAnalysis?.analysis}
                          </div>
                        </section>

                        <section>
                          <h4 className="flex items-center gap-3 text-indigo-900 font-black uppercase tracking-[0.2em] text-xs mb-6">
                            <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                              <Zap className="w-4 h-4" />
                            </div>
                            Oportunidades de IA
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {activeAnalysis?.useCases.map((useCase, i) => (
                              <div
                                key={i}
                                className="p-6 bg-white border border-slate-100 rounded-[28px] shadow-sm hover:border-indigo-200 transition-all flex gap-4"
                              >
                                <div className="flex-shrink-0 w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center text-[10px] font-black text-indigo-600">
                                  0{i + 1}
                                </div>
                                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                                  {useCase}
                                </p>
                              </div>
                            ))}
                          </div>
                        </section>

                        {activeAnalysis?.marketTrends && (
                          <section>
                            <h4 className="flex items-center gap-3 text-indigo-900 font-black uppercase tracking-[0.2em] text-xs mb-6">
                              <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                                <TrendingUp className="w-4 h-4" />
                              </div>
                              Tendencias del Mercado
                            </h4>
                            <div className="space-y-4">
                              {activeAnalysis?.marketTrends?.map((trend, i) => (
                                <div
                                  key={i}
                                  className="flex items-start gap-4 p-5 bg-slate-50/50 rounded-2xl border border-slate-100/50"
                                >
                                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 flex-shrink-0" />
                                  <p className="text-sm text-slate-600 font-medium leading-relaxed">
                                    {trend}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </section>
                        )}

                        {activeAnalysis?.competitors && (
                          <section>
                            <h4 className="flex items-center gap-3 text-indigo-900 font-black uppercase tracking-[0.2em] text-xs mb-6">
                              <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
                                <Users className="w-4 h-4" />
                              </div>
                              Competidores Estratégicos
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {activeAnalysis?.competitors?.map(
                                (competitor, i) => (
                                  <div
                                    key={i}
                                    className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm text-center"
                                  >
                                    <p className="text-xs font-bold text-slate-700 leading-tight">
                                      {competitor}
                                    </p>
                                  </div>
                                ),
                              )}
                            </div>
                          </section>
                        )}
                      </div>
                    ) : (
                      <div className="py-24 text-center">
                        <p className="text-slate-400 italic">
                          Haz clic en un lead para iniciar el análisis profundo.
                        </p>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <div className="h-[600px] flex flex-col items-center justify-center text-center p-20 bg-indigo-50/10 rounded-[56px] border-4 border-dashed border-indigo-100/50">
                    <div className="w-24 h-24 bg-white rounded-[32px] shadow-2xl flex items-center justify-center text-indigo-600 mb-8 relative">
                      <div className="absolute inset-0 bg-indigo-400 rounded-[32px] blur-xl opacity-20"></div>
                      <Zap className="w-12 h-12 relative" />
                    </div>
                    <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">
                      Lead Intelligence Hub
                    </h3>
                    <p className="text-slate-500 max-w-sm text-lg font-medium leading-relaxed">
                      Selecciona un prospecto para que la IA escanee su huella
                      digital y cree una propuesta técnica personalizada.
                    </p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        ) : activeTab === "stats" ? (
          <div className="bg-white border border-slate-150 rounded-[40px] p-6 md:p-8 shadow-sm">
            <StatsPanel savedLeads={savedLeads} />
          </div>
        ) : (
          <div className="bg-white border border-slate-150 rounded-[40px] p-6 md:p-8 shadow-sm">
            <RemindersPanel
              savedLeads={savedLeads}
              onSelectLead={(lead) => {
                setSelectedLead(lead);
                setSelectedHistoryIndex(null);
                setShowDeleteConfirm(false);
                if (lead.analysis) {
                  setAnalysis(lead.analysis);
                  setAnalyzing(false);
                } else {
                  analyzeLead(lead);
                }
                setActiveTab("saved");
              }}
              onUpdateLead={handleUpdateCRM}
            />
          </div>
        )}
      </main>

      <footer className="py-20 border-t border-slate-100 mt-20 text-center">
        <p className="text-slate-400 text-sm font-bold tracking-widest uppercase mb-2">
          Powered by Google AI Studio
        </p>
        <div className="flex items-center justify-center gap-4 text-slate-300">
          <Globe className="w-4 h-4" />
          <span className="text-xs">
            Integración directa con Google Places & Gemini 3 Preview
          </span>
        </div>
      </footer>

      {/* PITCH CUSTOMIZATION MODAL OVERLAY */}
      <AnimatePresence>
        {isPitchModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPitchModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white border border-slate-150 rounded-[32px] shadow-2xl p-6 md:p-8 max-w-5xl w-full max-h-[90vh] overflow-y-auto relative z-10 space-y-6 text-left"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 block">
                    Personalización de Propuesta
                  </span>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight mt-1">
                    Personalizar Pitch de IA
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPitchModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Dynamic 2-column grid layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* Left Column: Interactive Editor Area - col-span-7 */}
                <div className="lg:col-span-7 space-y-4 flex flex-col justify-between">
                  <div className="space-y-3 relative">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-indigo-600" />
                        Mensaje de Propuesta Comercial
                      </label>
                      {/* Live stats */}
                      <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400">
                        <span>{editedPitchText.length} caracteres</span>
                        <span>•</span>
                        <span>
                          {editedPitchText.split(/\s+/).filter(Boolean).length}{" "}
                          palabras
                        </span>
                      </div>
                    </div>

                    {/* Editor Container with Absolute Suggestion menu */}
                    <div className="relative">
                      <textarea
                        id="pitch-textarea"
                        value={editedPitchText}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditedPitchText(val);

                          const selectionStart = e.target.selectionStart;
                          const lastSlashIndex = val.lastIndexOf(
                            "/",
                            selectionStart - 1,
                          );

                          if (lastSlashIndex !== -1) {
                            const textBetween = val.substring(
                              lastSlashIndex + 1,
                              selectionStart,
                            );
                            if (
                              !textBetween.includes(" ") &&
                              !textBetween.includes("\n")
                            ) {
                              setIsAutocompleteMenuOpen(true);
                              setAutocompleteSearchText(
                                textBetween.toLowerCase(),
                              );
                              setAutocompleteCursorPos(lastSlashIndex);
                              setAutocompleteSelectedIndex(0);
                              return;
                            }
                          }
                          setIsAutocompleteMenuOpen(false);
                        }}
                        onKeyDown={(e) => {
                          if (isAutocompleteMenuOpen) {
                            const filtered = autocompleteSnippets
                              .filter(
                                (snippet) =>
                                  snippet.trigger
                                    .toLowerCase()
                                    .includes("/" + autocompleteSearchText) ||
                                  snippet.label
                                    .toLowerCase()
                                    .includes(autocompleteSearchText) ||
                                  snippet.text
                                    .toLowerCase()
                                    .includes(autocompleteSearchText),
                              )
                              .slice(0, 6);

                            if (filtered.length > 0) {
                              if (e.key === "ArrowDown") {
                                e.preventDefault();
                                setAutocompleteSelectedIndex(
                                  (prev) => (prev + 1) % filtered.length,
                                );
                              } else if (e.key === "ArrowUp") {
                                e.preventDefault();
                                setAutocompleteSelectedIndex(
                                  (prev) =>
                                    (prev - 1 + filtered.length) %
                                    filtered.length,
                                );
                              } else if (e.key === "Enter" || e.key === "Tab") {
                                e.preventDefault();
                                insertSnippet(
                                  filtered[autocompleteSelectedIndex].text,
                                  true,
                                );
                              } else if (e.key === "Escape") {
                                e.preventDefault();
                                setIsAutocompleteMenuOpen(false);
                              }
                            }
                          }
                        }}
                        rows={12}
                        className="w-full p-4 text-slate-800 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium leading-relaxed focus:bg-white focus:border-indigo-505 outline-none focus:ring-2 focus:ring-indigo-100/50 transition-all resize-none shadow-inner scrollbar-thin"
                        placeholder="Escribe o edita la propuesta aquí. Escribe '/' para ver atajos de autocompletado..."
                      />

                      {/* Inside floating reset button */}
                      {editedPitchText !== originalPitchText && (
                        <button
                          type="button"
                          onClick={() => setEditedPitchText(originalPitchText)}
                          className="absolute bottom-4 right-4 flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-50 text-[10px] font-black text-indigo-600 uppercase tracking-wider border border-slate-200 rounded-xl shadow-xs transition cursor-pointer hover:scale-[1.02]"
                          title="Restablecer al texto original de Gemini"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Restablecer
                        </button>
                      )}

                      {/* Floating Slash Autocomplete Dropdown overlay */}
                      <AnimatePresence>
                        {isAutocompleteMenuOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute left-4 bottom-16 z-40 w-80 bg-white border border-slate-200/90 shadow-2xl rounded-2xl p-2.5 max-h-64 overflow-y-auto space-y-1 scrollbar-thin"
                          >
                            <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400">
                              <span>Atajos disponibles</span>
                              <span className="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-md font-mono text-[9px]">
                                / comando
                              </span>
                            </div>

                            {autocompleteSnippets
                              .filter(
                                (snippet) =>
                                  snippet.trigger
                                    .toLowerCase()
                                    .includes("/" + autocompleteSearchText) ||
                                  snippet.label
                                    .toLowerCase()
                                    .includes(autocompleteSearchText) ||
                                  snippet.text
                                    .toLowerCase()
                                    .includes(autocompleteSearchText),
                              )
                              .slice(0, 6)
                              .map((snippet, idx) => (
                                <button
                                  key={snippet.trigger}
                                  type="button"
                                  onClick={() =>
                                    insertSnippet(snippet.text, true)
                                  }
                                  onMouseEnter={() =>
                                    setAutocompleteSelectedIndex(idx)
                                  }
                                  className={`w-full text-left px-3 py-2 rounded-xl transition-all flex items-start gap-2.5 cursor-pointer ${
                                    idx === autocompleteSelectedIndex
                                      ? "bg-indigo-50 text-indigo-950 border-l-4 border-indigo-500"
                                      : "hover:bg-slate-50 text-slate-700"
                                  }`}
                                >
                                  <span className="text-sm shrink-0 mt-0.5">
                                    {snippet.category === "Saludos" && "👋"}
                                    {snippet.category === "Servicios" && "⚡"}
                                    {snippet.category === "Acción" && "🗓️"}
                                    {snippet.category === "Diagnóstico" && "🔍"}
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-1">
                                      <p className="font-extrabold text-xs truncate text-slate-800">
                                        {snippet.label}
                                      </p>
                                      <p className="font-mono text-[9px] text-slate-400 shrink-0">
                                        {snippet.trigger}
                                      </p>
                                    </div>
                                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                                      {snippet.text.replaceAll(
                                        "[Empresa]",
                                        selectedLead?.name || "su empresa",
                                      )}
                                    </p>
                                  </div>
                                </button>
                              ))}
                            {autocompleteSnippets.filter(
                              (snippet) =>
                                snippet.trigger
                                  .toLowerCase()
                                  .includes("/" + autocompleteSearchText) ||
                                snippet.label
                                  .toLowerCase()
                                  .includes(autocompleteSearchText) ||
                                snippet.text
                                  .toLowerCase()
                                  .includes(autocompleteSearchText),
                            ).length === 0 && (
                              <div className="py-4 text-center text-xs italic text-slate-400">
                                Sin coincidencias...
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div className="p-3.5 bg-indigo-50/50 rounded-2xl border border-indigo-100/60 flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-wider text-indigo-950 text-left">
                        Tip de Escritura Rápida
                      </p>
                      <p className="text-[10px] text-slate-500 leading-normal mt-0.5">
                        Escribe{" "}
                        <span className="font-mono font-bold text-indigo-600 bg-indigo-100/50 px-1 rounded-sm text-[10px]">
                          /
                        </span>{" "}
                        en cualquier lugar del editor para abrir el
                        autocompletado interactivo. Usa las flechas{" "}
                        <span className="font-bold">↑ ↓</span> del teclado y
                        presiona <span className="font-bold">Enter</span> o{" "}
                        <span className="font-bold">Tab</span> para insertar.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right Column: Asistente de Autocompletado - col-span-5 */}
                <div className="lg:col-span-5 md:border-l border-slate-100 lg:pl-6 space-y-4 flex flex-col justify-between max-h-[64vh]">
                  <div className="space-y-3.5 flex flex-col flex-1 min-h-0">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-amber-50 text-amber-600 rounded-xl shrink-0">
                        <Cpu className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                          Asistente de Redacción
                        </h4>
                        <p className="text-[10px] font-bold text-slate-400 leading-none mt-0.5">
                          Haz clic en una propuesta para pegarla en el cursor
                        </p>
                      </div>
                    </div>

                    {/* Filter local snippets */}
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Buscar plantillas rápidas..."
                        value={snippetQuery}
                        onChange={(e) => setSnippetQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs font-medium border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-indigo-400 outline-none transition"
                      />
                      {snippetQuery && (
                        <button
                          onClick={() => setSnippetQuery("")}
                          className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 font-bold text-xs"
                        >
                          Limpiar
                        </button>
                      )}
                    </div>

                    {/* Tabs bar */}
                    <div className="flex items-center gap-1 overflow-x-auto pb-1.5 border-b border-slate-100 scrollbar-none shrink-0">
                      {(
                        [
                          "Todos",
                          "Saludos",
                          "Servicios",
                          "Diagnóstico",
                          "Acción",
                        ] as const
                      ).map((tab) => (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => setActiveSnippetTab(tab)}
                          className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition shrink-0 cursor-pointer ${
                            activeSnippetTab === tab
                              ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                              : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>

                    {/* Snippets list wrapper */}
                    <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                      {autocompleteSnippets.filter((snippet) => {
                        const matchesTab =
                          activeSnippetTab === "Todos" ||
                          snippet.category === activeSnippetTab;
                        const matchesQuery =
                          !snippetQuery.trim() ||
                          snippet.label
                            .toLowerCase()
                            .includes(snippetQuery.toLowerCase()) ||
                          snippet.text
                            .toLowerCase()
                            .includes(snippetQuery.toLowerCase()) ||
                          snippet.trigger
                            .toLowerCase()
                            .includes(snippetQuery.toLowerCase());
                        return matchesTab && matchesQuery;
                      }).length === 0 ? (
                        <div className="py-12 text-center text-slate-400 text-xs italic">
                          No se encontraron atajos de plantilla.
                        </div>
                      ) : (
                        autocompleteSnippets
                          .filter((snippet) => {
                            const matchesTab =
                              activeSnippetTab === "Todos" ||
                              snippet.category === activeSnippetTab;
                            const matchesQuery =
                              !snippetQuery.trim() ||
                              snippet.label
                                .toLowerCase()
                                .includes(snippetQuery.toLowerCase()) ||
                              snippet.text
                                .toLowerCase()
                                .includes(snippetQuery.toLowerCase()) ||
                              snippet.trigger
                                .toLowerCase()
                                .includes(snippetQuery.toLowerCase());
                            return matchesTab && matchesQuery;
                          })
                          .map((snippet) => (
                            <button
                              key={snippet.trigger}
                              type="button"
                              onClick={() => insertSnippet(snippet.text, false)}
                              className="w-full text-left p-3 border border-slate-150 hover:border-indigo-205 hover:bg-indigo-50/10 rounded-2xl transition cursor-pointer group hover:shadow-xs flex items-start gap-2.5"
                            >
                              <span className="text-sm select-none shrink-0 mt-0.5">
                                {snippet.category === "Saludos" && "👋"}
                                {snippet.category === "Servicios" && "⚡"}
                                {snippet.category === "Acción" && "🗓️"}
                                {snippet.category === "Diagnóstico" && "🔍"}
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-extrabold text-xs text-slate-800 truncate leading-none">
                                    {snippet.label}
                                  </span>
                                  <span className="font-mono text-[9px] text-indigo-600 font-extrabold bg-indigo-50 px-1 rounded shrink-0">
                                    {snippet.trigger}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-400 leading-normal mt-1.5 line-clamp-2 group-hover:text-slate-600 transition">
                                  {snippet.text.replaceAll(
                                    "[Empresa]",
                                    selectedLead?.name || "su empresa",
                                  )}
                                </p>
                              </div>
                            </button>
                          ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 pt-5">
                <div className="text-slate-400 text-[11px] font-bold flex items-center gap-1.5 self-start sm:self-auto">
                  <span className="flex h-2 w-2 relative shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
                  </span>
                  Edita el texto directamente en el panel.
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setIsPitchModalOpen(false)}
                    className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-700 rounded-2xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopyToClipboard(editedPitchText)}
                    className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 border ${
                      pitchCopyFeedback
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                        : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
                    }`}
                  >
                    {pitchCopyFeedback ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-500" />
                        <span>¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-slate-500" />
                        <span>Solo Copiar</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      if (selectedLead) {
                        setUpdatingCrm(true);
                        try {
                          if (
                            selectedHistoryIndex !== null &&
                            selectedLead.analysisHistory
                          ) {
                            const updatedHistory = [
                              ...selectedLead.analysisHistory,
                            ];
                            if (updatedHistory[selectedHistoryIndex]) {
                              updatedHistory[selectedHistoryIndex] = {
                                ...updatedHistory[selectedHistoryIndex],
                                analysis: {
                                  ...updatedHistory[selectedHistoryIndex]
                                    .analysis,
                                  pitch: editedPitchText,
                                },
                              };
                              await handleUpdateCRM(selectedLead.id, {
                                analysisHistory: updatedHistory,
                              });
                            }
                          } else {
                            const currentAnalysis =
                              analysis || selectedLead?.analysis;
                            if (currentAnalysis) {
                              const updatedAnalysis = {
                                ...currentAnalysis,
                                pitch: editedPitchText,
                              };
                              await handleUpdateCRM(selectedLead.id, {
                                analysis: updatedAnalysis,
                              });
                              setAnalysis(updatedAnalysis);
                            }
                          }
                        } catch (err) {
                          console.error(
                            "No se pudo guardar la propuesta editada: ",
                            err,
                          );
                        } finally {
                          setUpdatingCrm(false);
                        }
                      }

                      await handleCopyToClipboard(editedPitchText);

                      setTimeout(() => {
                        setIsPitchModalOpen(false);
                      }, 400);
                    }}
                    className="px-6 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-100 rounded-2xl text-xs font-black transition-all cursor-pointer hover:scale-[1.01] flex items-center gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    <span>Guardar y Copiar</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PDF Client Report Generator & Live Preview Modal */}
      <AnimatePresence>
        {isPdfModalOpen && selectedLead && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPdfModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-fade-in"
            />

            {/* Modal Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-slate-50 border border-slate-100 rounded-[32px] shadow-2xl p-6 md:p-8 max-w-7xl w-full max-h-[90vh] overflow-hidden relative z-10 flex flex-col space-y-4 text-left"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
                    <FileDown className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                      Estudio de Optimización & Reporte Comercial
                    </h3>
                    <p className="text-xs text-slate-450 font-bold mt-0.5">
                      Analiza el sitio web de su prospecto y descarga un reporte
                      PDF persuasivo para cerrar la venta
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsPdfModalOpen(false)}
                  className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Two Column Layout (Form | Live Preview) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0 flex-1 overflow-hidden">
                {/* Form customizer (Col span 5, scrollable) */}
                <div className="lg:col-span-5 space-y-6 overflow-y-auto pr-2 scrollbar-thin pb-4">
                  {/* Section 1: Consultor Info & Branding */}
                  <div className="p-5 bg-white border border-slate-150 rounded-2xl space-y-4 shadow-xs">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <Award className="w-4 h-4 text-indigo-550" />
                      1. Datos de Tu Agencia y Branding
                    </h4>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                          Nombre del Consultor / Agencia
                        </label>
                        <input
                          type="text"
                          value={reportConsultorName}
                          onChange={(e) =>
                            setReportConsultorName(e.target.value)
                          }
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-indigo-400 focus:outline-none transition font-semibold"
                          placeholder="ej. Agustín Larraín — Director de Growth"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                            Email de Contacto
                          </label>
                          <input
                            type="email"
                            value={reportConsultorEmail}
                            onChange={(e) =>
                              setReportConsultorEmail(e.target.value)
                            }
                            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-indigo-400 focus:outline-none transition font-semibold"
                            placeholder="ej. contacto@agencia.cl"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                            Teléfono / WhatsApp
                          </label>
                          <input
                            type="text"
                            value={reportConsultorPhone}
                            onChange={(e) =>
                              setReportConsultorPhone(e.target.value)
                            }
                            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-indigo-400 focus:outline-none transition font-semibold"
                            placeholder="ej. +56 9 8765 4321"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                          Color de Acento del Documento
                        </label>
                        <div className="flex flex-wrap gap-2 pt-1">
                          {(
                            [
                              {
                                key: "indigo",
                                label: "Indigo",
                                colorClass: "bg-indigo-600",
                              },
                              {
                                key: "emerald",
                                label: "Esmeralda",
                                colorClass: "bg-emerald-600",
                              },
                              {
                                key: "amber",
                                label: "Ámbar",
                                colorClass: "bg-amber-500",
                              },
                              {
                                key: "rose",
                                label: "Rosa",
                                colorClass: "bg-rose-500",
                              },
                              {
                                key: "slate",
                                label: "Pizarra",
                                colorClass: "bg-slate-700",
                              },
                            ] as const
                          ).map((theme) => (
                            <button
                              key={theme.key}
                              type="button"
                              onClick={() => setReportColorTheme(theme.key)}
                              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                                reportColorTheme === theme.key
                                  ? "border-slate-800 bg-slate-105 text-slate-900 ring-2 ring-slate-100"
                                  : "border-slate-205 bg-white text-slate-500 hover:bg-slate-50"
                              }`}
                            >
                              <span
                                className={`w-3 h-3 rounded-full ${theme.colorClass}`}
                              />
                              {theme.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Diagnóstico de Semáforos */}
                  <div className="p-5 bg-white border border-slate-150 rounded-2xl space-y-4 shadow-xs">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <Activity className="w-4 h-4 text-indigo-550" />
                      2. Diagnóstico del Semáforo Técnico
                    </h4>

                    <div className="space-y-4">
                      {/* SEO Pillar */}
                      <div className="space-y-2 pb-2 border-b border-slate-100">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <span className="text-xs font-extrabold text-slate-800">
                            SEO & Posicionamiento en Google
                          </span>
                          <div className="flex gap-1.5">
                            {(["critic", "warning", "good"] as const).map(
                              (v) => (
                                <button
                                  key={v}
                                  type="button"
                                  onClick={() => setReportScoreSeo(v)}
                                  className={`px-2 py-1 text-[9px] font-black uppercase rounded-lg border transition cursor-pointer ${
                                    reportScoreSeo === v
                                      ? v === "critic"
                                        ? "bg-rose-50 text-rose-600 border-rose-300"
                                        : v === "warning"
                                          ? "bg-amber-50 text-amber-600 border-amber-300"
                                          : "bg-green-50 text-green-600 border-green-300"
                                      : "bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100"
                                  }`}
                                >
                                  {v === "critic"
                                    ? "Crítico 🚨"
                                    : v === "warning"
                                      ? "Regular ⚠️"
                                      : "Estable  "}
                                </button>
                              ),
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Speed Pillar */}
                      <div className="space-y-2 pb-2 border-b border-slate-100">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <span className="text-xs font-extrabold text-slate-800">
                            Velocidad de Carga Core Web Vitals
                          </span>
                          <div className="flex gap-1.5">
                            {(["critic", "warning", "good"] as const).map(
                              (v) => (
                                <button
                                  key={v}
                                  type="button"
                                  onClick={() => setReportScoreVelocity(v)}
                                  className={`px-2 py-1 text-[9px] font-black uppercase rounded-lg border transition cursor-pointer ${
                                    reportScoreVelocity === v
                                      ? v === "critic"
                                        ? "bg-rose-50 text-rose-600 border-rose-300"
                                        : v === "warning"
                                          ? "bg-amber-50 text-amber-600 border-amber-300"
                                          : "bg-green-50 text-green-600 border-green-300"
                                      : "bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100"
                                  }`}
                                >
                                  {v === "critic"
                                    ? "Crítico 🚨"
                                    : v === "warning"
                                      ? "Regular ⚠️"
                                      : "Estable  "}
                                </button>
                              ),
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Usability / Mobile UX Pillar */}
                      <div className="space-y-2 pb-2 border-b border-slate-100">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <span className="text-xs font-extrabold text-slate-800">
                            Adaptabilidad Móvil (Responsive UX)
                          </span>
                          <div className="flex gap-1.5">
                            {(["critic", "warning", "good"] as const).map(
                              (v) => (
                                <button
                                  key={v}
                                  type="button"
                                  onClick={() => setReportScoreMobile(v)}
                                  className={`px-2 py-1 text-[9px] font-black uppercase rounded-lg border transition cursor-pointer ${
                                    reportScoreMobile === v
                                      ? v === "critic"
                                        ? "bg-rose-50 text-rose-600 border-rose-300"
                                        : v === "warning"
                                          ? "bg-amber-50 text-amber-600 border-amber-300"
                                          : "bg-green-50 text-green-600 border-green-300"
                                      : "bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100"
                                  }`}
                                >
                                  {v === "critic"
                                    ? "Crítico 🚨"
                                    : v === "warning"
                                      ? "Regular ⚠️"
                                      : "Estable  "}
                                </button>
                              ),
                            )}
                          </div>
                        </div>
                      </div>

                      {/* SSL Pillar */}
                      <div className="space-y-2 pb-2 border-b border-slate-100">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <span className="text-xs font-extrabold text-slate-800">
                            Seguridad SSL & Certificados HTTPS
                          </span>
                          <div className="flex gap-1.5">
                            {(["critic", "warning", "good"] as const).map(
                              (v) => (
                                <button
                                  key={v}
                                  type="button"
                                  onClick={() => setReportScoreSSL(v)}
                                  className={`px-2 py-1 text-[9px] font-black uppercase rounded-lg border transition cursor-pointer ${
                                    reportScoreSSL === v
                                      ? v === "critic"
                                        ? "bg-rose-50 text-rose-600 border-rose-300"
                                        : v === "warning"
                                          ? "bg-amber-50 text-amber-600 border-amber-300"
                                          : "bg-green-50 text-green-600 border-green-300"
                                      : "bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100"
                                  }`}
                                >
                                  {v === "critic"
                                    ? "Crítico 🚨"
                                    : v === "warning"
                                      ? "Regular ⚠️"
                                      : "Estable  "}
                                </button>
                              ),
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Conversion channels Pillar */}
                      <div className="space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <span className="text-xs font-extrabold text-slate-800">
                            Canales de Conversión (CTAs / WhatsApp)
                          </span>
                          <div className="flex gap-1.5">
                            {(["critic", "warning", "good"] as const).map(
                              (v) => (
                                <button
                                  key={v}
                                  type="button"
                                  onClick={() => setReportScoreContacto(v)}
                                  className={`px-2 py-1 text-[9px] font-black uppercase rounded-lg border transition cursor-pointer ${
                                    reportScoreContacto === v
                                      ? v === "critic"
                                        ? "bg-rose-50 text-rose-600 border-rose-300"
                                        : v === "warning"
                                          ? "bg-amber-50 text-amber-600 border-amber-300"
                                          : "bg-green-50 text-green-600 border-green-300"
                                      : "bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100"
                                  }`}
                                >
                                  {v === "critic"
                                    ? "Crítico 🚨"
                                    : v === "warning"
                                      ? "Regular ⚠️"
                                      : "Estable  "}
                                </button>
                              ),
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Title & Introducción editable */}
                  <div className="p-5 bg-white border border-slate-150 rounded-2xl space-y-4 shadow-xs">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-550" />
                      3. Textos del Informe
                    </h4>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                          Título del Estudio
                        </label>
                        <input
                          type="text"
                          value={pdfPersonalizedTitle}
                          onChange={(e) =>
                            setPdfPersonalizedTitle(e.target.value)
                          }
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-indigo-400 focus:outline-none transition leading-normal font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                          Introducción / Carta de Saludo
                        </label>
                        <textarea
                          value={pdfIntroduction}
                          onChange={(e) => setPdfIntroduction(e.target.value)}
                          rows={6}
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-indigo-400 focus:outline-none transition leading-relaxed resize-none scrollbar-thin font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                          Tu Propuesta de Servicio (Oferta Comercial)
                        </label>
                        <textarea
                          value={customOfferText}
                          onChange={(e) => setCustomOfferText(e.target.value)}
                          rows={7}
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-indigo-400 focus:outline-none transition leading-relaxed resize-none font-mono text-[11px] scrollbar-thin"
                          placeholder="ej. Reconstrucción completa del portal con panel autoadministrable..."
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* PDF Preview Area (Col span 7, styling matches a physical piece of paper) */}
                <div className="lg:col-span-7 flex flex-col min-h-0 bg-slate-250 rounded-2xl p-4 overflow-hidden border border-slate-300 relative justify-between">
                  <div className="flex items-center justify-between mb-2 shrink-0">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Printer className="w-3.5 h-3.5 text-slate-600" /> Vista
                      Previa del Documento Impreso
                    </span>
                    <span className="text-[9px] bg-slate-300 text-slate-705 px-2.5 py-1 rounded-lg font-black uppercase tracking-wider">
                      A4 / PDF
                    </span>
                  </div>

                  {/* Scaled paper mockup container */}
                  <div className="flex-1 overflow-y-auto bg-white shadow-2xl p-8 rounded-xl max-w-full text-left font-sans text-slate-800 leading-relaxed max-h-[58vh] border border-slate-200 scrollbar-thin">
                    <div className="space-y-6">
                      {/* Color Banner Brand Indicator */}
                      <div
                        className={`h-2.5 w-full rounded ${
                          reportColorTheme === "indigo"
                            ? "bg-indigo-600"
                            : reportColorTheme === "emerald"
                              ? "bg-emerald-600"
                              : reportColorTheme === "amber"
                                ? "bg-amber-500"
                                : reportColorTheme === "rose"
                                  ? "bg-rose-500"
                                  : "bg-slate-700"
                        }`}
                      />

                      {/* Document Header */}
                      <div className="flex items-start justify-between border-b pb-4">
                        <div>
                          <h4 className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                            AUDITORÍA TECNOLÓGICA
                          </h4>
                          <h1 className="text-xl font-black font-sans tracking-tight text-slate-900 mt-1">
                            {pdfPersonalizedTitle}
                          </h1>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[9px] font-mono text-slate-400 font-extrabold uppercase">
                            FECHA:{" "}
                            {new Date().toLocaleDateString("es-CL", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                          </p>
                          <p className="text-[9px] font-mono text-slate-400 mt-0.5">
                            ID: AUD-{selectedLead.id?.slice(0, 6).toUpperCase()}
                          </p>
                        </div>
                      </div>

                      {/* Meta Section */}
                      <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
                        <div>
                          <p className="text-[9px] font-black uppercase text-slate-400 leading-none mb-1.5">
                            ORGANIZACIÓN AUDITADA
                          </p>
                          <p className="font-extrabold text-slate-805">
                            {selectedLead.name || "Sin nombre"}
                          </p>
                          <p className="text-slate-500 mt-0.5 font-semibold mb-1">
                            {selectedLead.website || "Sin sitio web"}
                          </p>
                          <p className="text-slate-450 mt-1 leading-none font-bold flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-red-500" />{" "}
                            {selectedLead.comuna || "Ubicación local"}
                          </p>
                        </div>
                        <div className="border-l pl-4 border-slate-200">
                          <p className="text-[9px] font-black uppercase text-slate-400 leading-none mb-1.5 font-sans">
                            EMITIDO POR
                          </p>
                          <p className="font-extrabold text-slate-805">
                            {reportConsultorName || "Consultor Digital"}
                          </p>
                          <p className="text-slate-500 mt-0.5 font-semibold">
                            {reportConsultorEmail || "ejemplo@agencia.cl"}
                          </p>
                          <p className="text-slate-450 mt-0.5 font-bold">
                            {reportConsultorPhone || "Sin teléfono"}
                          </p>
                        </div>
                      </div>

                      {/* Introducción */}
                      <div className="text-xs text-slate-650 leading-relaxed whitespace-pre-line border-l-2 pl-4 border-slate-200 font-semibold font-sans">
                        {pdfIntroduction}
                      </div>

                      {/* Semáforo Técnico Section */}
                      <div className="space-y-3.5 pt-2">
                        <h3
                          className={`text-xs font-black uppercase tracking-wider ${
                            reportColorTheme === "indigo"
                              ? "text-indigo-900"
                              : reportColorTheme === "emerald"
                                ? "text-emerald-950"
                                : reportColorTheme === "amber"
                                  ? "text-amber-955"
                                  : reportColorTheme === "rose"
                                    ? "text-rose-950"
                                    : "text-slate-900"
                          }`}
                        >
                          I. Evaluación de Componentes Clave
                        </h3>

                        <div className="space-y-2 text-xs">
                          {/* 1. SEO */}
                          <div className="flex items-start justify-between hover:bg-slate-50 p-2.5 rounded-xl border border-slate-100/60 transition">
                            <div className="min-w-0 flex-1">
                              <span className="font-bold text-slate-800 block text-[11px]">
                                Posicionamiento & SEO Local
                              </span>
                              <span className="text-[10px] text-slate-400 leading-normal font-semibold">
                                Búsquedas en la comuna de {selectedLead.comuna}{" "}
                                y ficha de Google Maps.
                              </span>
                            </div>
                            <span
                              className={`shrink-0 px-2.5 py-1 text-[9px] font-black uppercase rounded-lg border text-center font-mono ${
                                reportScoreSeo === "critic"
                                  ? "bg-rose-50 text-rose-600 border-rose-250 animate-pulse"
                                  : reportScoreSeo === "warning"
                                    ? "bg-amber-50 text-amber-600 border-amber-250"
                                    : "bg-green-50 text-green-605 border-green-250"
                              }`}
                            >
                              {reportScoreSeo === "critic"
                                ? "⚠️ CRÍTICO"
                                : reportScoreSeo === "warning"
                                  ? "⚡ OPTIMIZABLE"
                                  : "  ESTABLE"}
                            </span>
                          </div>

                          {/* 2. Speed */}
                          <div className="flex items-start justify-between hover:bg-slate-50 p-2.5 rounded-xl border border-slate-100/60 transition">
                            <div className="min-w-0 flex-1">
                              <span className="font-bold text-slate-800 block text-[11px]">
                                Velocidad de Carga Core Web Vitals
                              </span>
                              <span className="text-[10px] text-slate-400 leading-normal font-semibold">
                                Tiempos de despliegue interactivo en redes
                                móviles (Chrome Speed).
                              </span>
                            </div>
                            <span
                              className={`shrink-0 px-2.5 py-1 text-[9px] font-black uppercase rounded-lg border text-center font-mono ${
                                reportScoreVelocity === "critic"
                                  ? "bg-rose-50 text-rose-600 border-rose-250 animate-pulse"
                                  : reportScoreVelocity === "warning"
                                    ? "bg-amber-50 text-amber-600 border-amber-250"
                                    : "bg-green-50 text-green-605 border-green-250"
                              }`}
                            >
                              {reportScoreVelocity === "critic"
                                ? "⚠️ CRÍTICO"
                                : reportScoreVelocity === "warning"
                                  ? "⚡ OPTIMIZABLE"
                                  : "  ESTABLE"}
                            </span>
                          </div>

                          {/* 3. Mobile */}
                          <div className="flex items-start justify-between hover:bg-slate-50 p-2.5 rounded-xl border border-slate-100/60 transition">
                            <div className="min-w-0 flex-1">
                              <span className="font-bold text-slate-800 block text-[11px]">
                                Adaptabilidad Celular (Web Mobile UX)
                              </span>
                              <span className="text-[10px] text-slate-400 leading-normal font-semibold">
                                Escabilidad del menú táctil y lectura libre de
                                zooms forzados.
                              </span>
                            </div>
                            <span
                              className={`shrink-0 px-2.5 py-1 text-[9px] font-black uppercase rounded-lg border text-center font-mono ${
                                reportScoreMobile === "critic"
                                  ? "bg-rose-50 text-rose-600 border-rose-250"
                                  : reportScoreMobile === "warning"
                                    ? "bg-amber-50 text-amber-600 border-amber-250"
                                    : "bg-green-50 text-green-605 border-green-250"
                              }`}
                            >
                              {reportScoreMobile === "critic"
                                ? "⚠️ CRÍTICO"
                                : reportScoreMobile === "warning"
                                  ? "⚡ OPTIMIZABLE"
                                  : "  ESTABLE"}
                            </span>
                          </div>

                          {/* 4. SSL */}
                          <div className="flex items-start justify-between hover:bg-slate-50 p-2.5 rounded-xl border border-slate-100/60 transition">
                            <div className="min-w-0 flex-1">
                              <span className="font-bold text-slate-800 block text-[11px]">
                                Seguridad Web & Certificado SSL
                              </span>
                              <span className="text-[10px] text-slate-400 leading-normal font-semibold">
                                Cifrado de datos en tránsito HTTP/HTTPS para
                                credibilidad corporativa.
                              </span>
                            </div>
                            <span
                              className={`shrink-0 px-2.5 py-1 text-[9px] font-black uppercase rounded-lg border text-center font-mono ${
                                reportScoreSSL === "critic"
                                  ? "bg-rose-50 text-rose-600 border-rose-250 animate-pulse"
                                  : reportScoreSSL === "warning"
                                    ? "bg-amber-50 text-amber-600 border-amber-250"
                                    : "bg-green-50 text-green-655 border-green-250"
                              }`}
                            >
                              {reportScoreSSL === "critic"
                                ? "⚠️ CRÍTICO"
                                : reportScoreSSL === "warning"
                                  ? "⚡ OPTIMIZABLE"
                                  : "  ESTABLE"}
                            </span>
                          </div>

                          {/* 5. CTR */}
                          <div className="flex items-start justify-between hover:bg-slate-50 p-2.5 rounded-xl border border-slate-100/60 transition">
                            <div className="min-w-0 flex-1">
                              <span className="font-bold text-slate-800 block text-[11px]">
                                Ratios de Conversión (CTAs & WhatsApp)
                              </span>
                              <span className="text-[10px] text-slate-400 leading-normal font-semibold">
                                Claridad técnica en botones de llamado a la
                                acción comercial rápidos.
                              </span>
                            </div>
                            <span
                              className={`shrink-0 px-2.5 py-1 text-[9px] font-black uppercase rounded-lg border text-center font-mono ${
                                reportScoreContacto === "critic"
                                  ? "bg-rose-50 text-rose-600 border-rose-250"
                                  : reportScoreContacto === "warning"
                                    ? "bg-amber-50 text-amber-600 border-amber-250"
                                    : "bg-green-50 text-green-605 border-green-250"
                              }`}
                            >
                              {reportScoreContacto === "critic"
                                ? "⚠️ CRÍTICO"
                                : reportScoreContacto === "warning"
                                  ? "⚡ OPTIMIZABLE"
                                  : "  ESTABLE"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Calculated Score Section */}
                      <div className="bg-slate-50 flex items-center justify-between p-4 rounded-2xl border border-slate-100 text-xs shadow-inner">
                        <div>
                          <span className="text-[10px] font-black font-sans uppercase tracking-widest text-slate-400 block leading-none">
                            PUNTUACIÓN GLOBAL ESTIMADA
                          </span>
                          <div className="font-bold text-slate-700 leading-relaxed mt-1">
                            Estimación avanzada en base a la matriz de auditoría
                            local.
                          </div>
                        </div>
                        <div
                          className={`p-3 shrink-0 rounded-2xl text-center shadow-lg ${
                            reportColorTheme === "indigo"
                              ? "bg-indigo-55 text-indigo-700 font-black"
                              : reportColorTheme === "emerald"
                                ? "bg-emerald-55 text-emerald-700 font-black"
                                : reportColorTheme === "amber"
                                  ? "bg-amber-55 text-amber-600 font-black"
                                  : reportColorTheme === "rose"
                                    ? "bg-rose-55 text-rose-700 font-black"
                                    : "bg-slate-100 text-slate-850 font-black"
                          }`}
                        >
                          <span className="text-2xl font-black font-sans leading-none block">
                            {(reportScoreSeo === "good"
                              ? 20
                              : reportScoreSeo === "warning"
                                ? 10
                                : 0) +
                              (reportScoreVelocity === "good"
                                ? 20
                                : reportScoreVelocity === "warning"
                                  ? 10
                                  : 0) +
                              (reportScoreMobile === "good"
                                ? 20
                                : reportScoreMobile === "warning"
                                  ? 10
                                  : 0) +
                              (reportScoreSSL === "good"
                                ? 20
                                : reportScoreSSL === "warning"
                                  ? 10
                                  : 0) +
                              (reportScoreContacto === "good"
                                ? 20
                                : reportScoreContacto === "warning"
                                  ? 10
                                  : 0)}
                            <span className="text-sm font-bold opacity-80">
                              /100
                            </span>
                          </span>
                        </div>
                      </div>

                      {/* Propuesta Comercial / Plan Estratégico Section */}
                      <div className="space-y-3 pt-2">
                        <h3
                          className={`text-xs font-black uppercase tracking-wider ${
                            reportColorTheme === "indigo"
                              ? "text-indigo-900"
                              : reportColorTheme === "emerald"
                                ? "text-emerald-950"
                                : reportColorTheme === "amber"
                                  ? "text-amber-955"
                                  : reportColorTheme === "rose"
                                    ? "text-rose-950"
                                    : "text-slate-900"
                          }`}
                        >
                          II. Plan de Acción Técnico y Comercial
                        </h3>

                        <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-105 font-mono text-[11px] leading-relaxed text-slate-750 whitespace-pre-line">
                          {customOfferText ||
                            "Redactando propuesta comercial técnica..."}
                        </div>
                      </div>

                      {/* Footer / Cierre */}
                      <div className="border-t pt-4 text-[10px] text-slate-400 font-medium text-center space-y-1">
                        <p>
                          Estudio estratégico generado con tecnología de
                          Inteligencia Artificial.
                        </p>
                        <p>
                          Para agendar una llamada o resolver dudas técnicas,
                          contactar directamente a{" "}
                          <span className="font-extrabold text-slate-500">
                            {reportConsultorEmail}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Panel Actions */}
              <div className="flex items-center justify-between border-t border-slate-150 pt-4 shrink-0">
                <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Estilo Seleccionado: {reportColorTheme.toUpperCase()} •
                  Calificación:{" "}
                  {(reportScoreSeo === "good"
                    ? 20
                    : reportScoreSeo === "warning"
                      ? 10
                      : 0) +
                    (reportScoreVelocity === "good"
                      ? 20
                      : reportScoreVelocity === "warning"
                        ? 10
                        : 0) +
                    (reportScoreMobile === "good"
                      ? 20
                      : reportScoreMobile === "warning"
                        ? 10
                        : 0) +
                    (reportScoreSSL === "good"
                      ? 20
                      : reportScoreSSL === "warning"
                        ? 10
                        : 0) +
                    (reportScoreContacto === "good"
                      ? 20
                      : reportScoreContacto === "warning"
                        ? 10
                        : 0)}{" "}
                  pts / 100
                </span>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsPdfModalOpen(false)}
                    type="button"
                    className="px-5 py-2.5 rounded-2xl text-xs font-black border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition cursor-pointer"
                  >
                    Cerrar Editor
                  </button>
                  <button
                    onClick={() => {
                      setTimeout(() => {
                        try {
                          if (
                            typeof window !== "undefined" &&
                            typeof window.print === "function"
                          ) {
                            window.print();
                          } else {
                            console.warn(
                              "La función de impresión no está disponible en este explorador.",
                            );
                          }
                        } catch (err) {
                          console.error(
                            "El navegador bloqueó la impresión directa por políticas de seguridad o sandbox.",
                            err,
                          );
                        }
                      }, 50);
                    }}
                    type="button"
                    className={`px-6 py-2.5 rounded-2xl text-xs font-black text-white shadow-xl transition active:scale-95 flex items-center gap-2 cursor-pointer ${
                      reportColorTheme === "indigo"
                        ? "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100"
                        : reportColorTheme === "emerald"
                          ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100"
                          : reportColorTheme === "amber"
                            ? "bg-amber-500 hover:bg-amber-600 shadow-amber-100"
                            : reportColorTheme === "rose"
                              ? "bg-rose-500 hover:bg-rose-600 shadow-rose-100"
                              : "bg-slate-700 hover:bg-slate-800 shadow-slate-205"
                    }`}
                  >
                    <Printer className="w-4 h-4" /> Imprimir / Exportar PDF
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Printable-only container required by @media print (always hidden in screen media) */}
      {isPdfModalOpen && selectedLead && (
        <div
          id="print-gate-container"
          className="hidden text-left bg-white text-slate-800 font-sans leading-relaxed p-0 m-0"
        >
          <div className="space-y-8 p-4">
            {/* Top colored accent line */}
            <div
              className={`h-3 w-full rounded ${
                reportColorTheme === "indigo"
                  ? "bg-indigo-600"
                  : reportColorTheme === "emerald"
                    ? "bg-emerald-600"
                    : reportColorTheme === "amber"
                      ? "bg-amber-550"
                      : reportColorTheme === "rose"
                        ? "bg-rose-550"
                        : "bg-slate-700"
              }`}
            />

            {/* Letterhead Header */}
            <div className="flex items-start justify-between border-b pb-5">
              <div>
                <p className="font-sans tracking-widest text-[9px] text-slate-400 font-black uppercase">
                  AUDITORÍA TECNOLÓGICA Y ESTUDIO COMERCIAL
                </p>
                <h1 className="text-2xl font-black tracking-tight text-slate-800 mt-1">
                  {pdfPersonalizedTitle}
                </h1>
              </div>
              <div className="text-right shrink-0 font-sans">
                <p className="text-[10px] font-mono text-slate-500 font-extrabold">
                  FECHA:{" "}
                  {new Date().toLocaleDateString("es-CL", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                <p className="text-[10px] font-mono text-slate-500 mt-1 uppercase">
                  REGISTRO: AUD-{selectedLead.id?.slice(0, 6).toUpperCase()}
                </p>
              </div>
            </div>

            {/* Recipient / Client Metadata */}
            <div className="grid grid-cols-2 gap-6 bg-slate-50 p-5 rounded-2xl border border-slate-100 text-xs">
              <div>
                <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-2 leading-none">
                  PREPARADO PARA
                </p>
                <p className="font-black text-slate-800 text-sm">
                  {selectedLead.name || "Empresa Evaluada"}
                </p>
                <p className="text-slate-500 font-bold mt-1">
                  {selectedLead.website || "Sin sitio web corporativo"}
                </p>
                <p className="text-slate-450 font-extrabold mt-1.5 flex items-center gap-1.5 uppercase">
                  <MapPin className="w-4 h-4 text-slate-400" /> Ubicación:{" "}
                  {selectedLead.comuna || "Territorio local"}
                </p>
              </div>
              <div className="border-l pl-6 border-slate-200">
                <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-2 leading-none">
                  ANÁLISIS EMITIDO POR
                </p>
                <p className="font-black text-slate-800 text-sm">
                  {reportConsultorName || "Consultor Digital"}
                </p>
                <p className="text-slate-500 font-bold mt-1">
                  {reportConsultorEmail || "contacto@empresa.cl"}
                </p>
                <p className="text-slate-450 font-extrabold mt-1.5 flex items-center gap-1">
                  Teléfono: {reportConsultorPhone || "Sin número directivo"}
                </p>
              </div>
            </div>

            {/* Introduction Paragraph */}
            <div className="text-xs text-slate-600 leading-relaxed whitespace-pre-line border-l-2 pl-4 border-slate-200 tracking-wide font-sans">
              {pdfIntroduction}
            </div>

            {/* Pillars Checklist Core */}
            <div className="space-y-4 avoid-break">
              <h3
                className={`text-xs font-black uppercase tracking-widest border-b pb-2 ${
                  reportColorTheme === "indigo"
                    ? "text-indigo-900 border-indigo-100"
                    : reportColorTheme === "emerald"
                      ? "text-emerald-950 border-emerald-100"
                      : reportColorTheme === "amber"
                        ? "text-amber-950 border-amber-100"
                        : reportColorTheme === "rose"
                          ? "text-rose-950 border-rose-100"
                          : "text-slate-900 border-slate-100"
                }`}
              >
                I. Matriz de Diagnóstico y Cumplimiento Técnico
              </h3>

              <div className="space-y-3">
                {/* Pillar 1 */}
                <div className="flex items-start justify-between border-b pb-2.5 text-xs">
                  <div>
                    <span className="font-extrabold text-slate-800">
                      1. Posicionamiento en Buscadores & SEO Local
                    </span>
                    <p className="text-[10px] text-slate-500 leading-normal mt-0.5 font-medium">
                      Capacidad de indexación, palabras clave locales y
                      presencia digital geoespacial.
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-1 text-[9px] font-black uppercase rounded-lg border font-mono ${
                      reportScoreSeo === "critic"
                        ? "bg-rose-50 text-rose-600 border-rose-200"
                        : reportScoreSeo === "warning"
                          ? "bg-amber-50 text-amber-600 border-amber-200"
                          : "bg-green-50 text-green-600 border-green-200"
                    }`}
                  >
                    {reportScoreSeo === "critic"
                      ? "⚠️ CRÍTICO"
                      : reportScoreSeo === "warning"
                        ? "⚡ OPTIMIZABLE"
                        : "  APROBADO"}
                  </span>
                </div>

                {/* Pillar 2 */}
                <div className="flex items-start justify-between border-b pb-2.5 text-xs">
                  <div>
                    <span className="font-extrabold text-slate-800">
                      2. Velocidad de Navegación y Core Web Vitals
                    </span>
                    <p className="text-[10px] text-slate-500 leading-normal mt-0.5 font-medium">
                      Tiempos de carga crítica móvil y retención de prospectos
                      móviles.
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-1 text-[9px] font-black uppercase rounded-lg border font-mono ${
                      reportScoreVelocity === "critic"
                        ? "bg-rose-50 text-rose-600 border-rose-200"
                        : reportScoreVelocity === "warning"
                          ? "bg-amber-50 text-amber-600 border-amber-200"
                          : "bg-green-50 text-green-600 border-green-200"
                    }`}
                  >
                    {reportScoreVelocity === "critic"
                      ? "⚠️ CRÍTICO"
                      : reportScoreVelocity === "warning"
                        ? "⚡ OPTIMIZABLE"
                        : "  APROBADO"}
                  </span>
                </div>

                {/* Pillar 3 */}
                <div className="flex items-start justify-between border-b pb-2.5 text-xs">
                  <div>
                    <span className="font-extrabold text-slate-800">
                      3. Usabilidad Móvil y Experiencia de Usuario (UX)
                    </span>
                    <p className="text-[10px] text-slate-500 leading-normal mt-0.5 font-medium">
                      Disposición adaptada en pantallas celulares y
                      simplificación táctil.
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-1 text-[9px] font-black uppercase rounded-lg border font-mono ${
                      reportScoreMobile === "critic"
                        ? "bg-rose-50 text-rose-600 border-rose-200"
                        : reportScoreMobile === "warning"
                          ? "bg-amber-50 text-amber-600 border-amber-200"
                          : "bg-green-50 text-green-600 border-green-200"
                    }`}
                  >
                    {reportScoreMobile === "critic"
                      ? "⚠️ CRÍTICO"
                      : reportScoreMobile === "warning"
                        ? "⚡ OPTIMIZABLE"
                        : "  APROBADO"}
                  </span>
                </div>

                {/* Pillar 4 */}
                <div className="flex items-start justify-between border-b pb-2.5 text-xs">
                  <div>
                    <span className="font-extrabold text-slate-800">
                      4. Resguardo y Certificados de Seguridad SSL (HTTPS)
                    </span>
                    <p className="text-[10px] text-slate-500 leading-normal mt-0.5 font-medium">
                      Protección de envío de datos del usuario evitando
                      advertencias de seguridad en navegadores.
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-1 text-[9px] font-black uppercase rounded-lg border font-mono ${
                      reportScoreSSL === "critic"
                        ? "bg-rose-50 text-rose-600 border-rose-200"
                        : reportScoreSSL === "warning"
                          ? "bg-amber-50 text-amber-600 border-amber-200"
                          : "bg-green-50 text-green-600 border-green-200"
                    }`}
                  >
                    {reportScoreSSL === "critic"
                      ? "⚠️ CRÍTICO"
                      : reportScoreSSL === "warning"
                        ? "⚡ OPTIMIZABLE"
                        : "  APROBADO"}
                  </span>
                </div>

                {/* Pillar 5 */}
                <div className="flex items-start justify-between pb-1 text-xs">
                  <div>
                    <span className="font-extrabold text-slate-800">
                      5. Canales de Conversión Activa (Formularios y Chat)
                    </span>
                    <p className="text-[10px] text-slate-500 leading-normal mt-0.5 font-medium">
                      Ruta visual despejada e integraciones rápidas para
                      agilizar llamadas a la acción.
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-1 text-[9px] font-black uppercase rounded-lg border font-mono ${
                      reportScoreContacto === "critic"
                        ? "bg-rose-50 text-rose-600 border-rose-200"
                        : reportScoreContacto === "warning"
                          ? "bg-amber-50 text-amber-600 border-amber-200"
                          : "bg-green-50 text-green-600 border-green-200"
                    }`}
                  >
                    {reportScoreContacto === "critic"
                      ? "⚠️ CRÍTICO"
                      : reportScoreContacto === "warning"
                        ? "⚡ OPTIMIZABLE"
                        : "  APROBADO"}
                  </span>
                </div>
              </div>
            </div>

            {/* Audit Score Frame */}
            <div className="bg-slate-50 rounded-2xl border p-4 flex items-center justify-between avoid-break">
              <div>
                <p className="font-black text-[10px] text-slate-400 uppercase tracking-widest leading-none">
                  PUNTUACIÓN GLOBAL DE ESTADO DIGITAL
                </p>
                <p className="text-[11px] text-slate-500 font-bold mt-1">
                  Estimación ponderada en base a buenas prácticas de
                  optimización web móvil.
                </p>
              </div>
              <div
                className={`px-3 py-1.5 shrink-0 rounded-xl text-center border font-sans font-black text-xl ${
                  reportColorTheme === "indigo"
                    ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                    : reportColorTheme === "emerald"
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                      : reportColorTheme === "amber"
                        ? "bg-amber-50 border-amber-200 text-amber-600"
                        : reportColorTheme === "rose"
                          ? "bg-rose-50 border-rose-200 text-rose-700"
                          : "bg-slate-100 border-slate-200 text-slate-800"
                }`}
              >
                {(reportScoreSeo === "good"
                  ? 20
                  : reportScoreSeo === "warning"
                    ? 10
                    : 0) +
                  (reportScoreVelocity === "good"
                    ? 20
                    : reportScoreVelocity === "warning"
                      ? 10
                      : 0) +
                  (reportScoreMobile === "good"
                    ? 20
                    : reportScoreMobile === "warning"
                      ? 10
                      : 0) +
                  (reportScoreSSL === "good"
                    ? 20
                    : reportScoreSSL === "warning"
                      ? 10
                      : 0) +
                  (reportScoreContacto === "good"
                    ? 20
                    : reportScoreContacto === "warning"
                      ? 10
                      : 0)}{" "}
                / 100
              </div>
            </div>

            {/* Page strategic proposal view */}
            <div className="space-y-4 pt-4 avoid-break">
              <h3
                className={`text-xs font-black uppercase tracking-widest border-b pb-2 ${
                  reportColorTheme === "indigo"
                    ? "text-indigo-900 border-indigo-100"
                    : reportColorTheme === "emerald"
                      ? "text-emerald-950 border-emerald-100"
                      : reportColorTheme === "amber"
                        ? "text-amber-955 border-amber-100"
                        : reportColorTheme === "rose"
                          ? "text-rose-950 border-rose-100"
                          : "text-slate-900 border-slate-100"
                }`}
              >
                II. Plan Estratégico & Soluciones Propuestas
              </h3>

              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-150 font-mono text-[10.5px] whitespace-pre-line leading-relaxed text-slate-800">
                {customOfferText}
              </div>
            </div>

            {/* Page Signature/Footer watermark */}
            <div className="pt-10 border-t border-slate-100 text-[10px] text-slate-400 font-sans font-semibold flex items-center justify-between avoid-break">
              <span>Doc: EST-TECNICO-AUD-SEC.PDF</span>
              <span>
                Para consultas técnicas contactar a: {reportConsultorEmail}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Onboarding Tour Overlay */}
      <AnimatePresence>
        {showTour && (
          <TourDialog
            step={tourStep}
            totalSteps={4}
            onNext={() => setTourStep((prev) => prev + 1)}
            onPrev={() => setTourStep((prev) => prev - 1)}
            onSkip={completeTour}
          />
        )}
      </AnimatePresence>

      {/* SIMULATED WEBSITE WARNING MODAL */}
      <AnimatePresence>
        {showSimulatedWebsiteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSimulatedWebsiteModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white border border-slate-150 rounded-[32px] shadow-2xl p-8 max-w-md w-full relative z-10 space-y-6 text-left"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-650 shrink-0">
                  <AlertCircle className="w-6 h-6 animate-bounce" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 block">
                    Aviso de Simulación
                  </span>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">
                    Sitio Web de Demostración
                  </h3>
                </div>
              </div>

              <div className="space-y-3.5 text-slate-650 text-xs leading-relaxed font-semibold">
                <p>
                  El sitio web <code className="bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded font-mono text-indigo-600 text-[11px]">{simulatedWebsiteUrl}</code> es de carácter de demostración.
                </p>
                <p>
                  Debido a que la API de Google Places está operando con nuestro **motor de simulación predictivo**, los negocios de la lista son simulaciones realistas de alta fidelidad para que puedas probar todas las funciones de auditoría, personalización de pitch, recordatorios y generación de reportes PDF.
                </p>
                <p>
                  Por lo tanto, este sitio web no existe en la realidad y no se puede abrir.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSimulatedWebsiteModal(false)}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100 rounded-2xl text-xs font-black transition-all cursor-pointer text-center"
                >
                  Entendido
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TourDialog({
  step,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
}: {
  step: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}) {
  const steps = [
    {
      title: "¡Bienvenido a LeadGen AI!",
      content:
        "Te ayudaremos a encontrar clientes locales en Chile y analizarlos con Inteligencia Artificial.",
      target: null,
      position: "center",
    },
    {
      title: "Buscador de Negocios",
      content:
        "Usa el buscador para localizar tipos de negocios específicos en cualquier comuna de Chile.",
      target: "tour-search-form",
      position: "bottom",
    },
    {
      title: "Análisis Inteligente",
      content:
        "Haz clic en un lead para que Gemini genere una propuesta personalizada basada en su presencia digital.",
      target: "tour-leads-list",
      position: "right",
    },
    {
      title: "Tu Colección Personal",
      content:
        "Guarda tus prospectos favoritos y gestiona tu relación con ellos en la pestaña 'Mis Leads'.",
      target: "tour-saved-tab",
      position: "bottom",
    },
  ];

  const currentStep = steps[step];
  const [coords, setCoords] = useState({
    top: 0,
    left: 0,
    width: 0,
    height: 0,
  });

  useEffect(() => {
    if (currentStep.target) {
      const el = document.getElementById(currentStep.target);
      if (el) {
        const rect = el.getBoundingClientRect();
        setCoords({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        });
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [step]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] pointer-events-none"
    >
      {/* Dimmed Background */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px]" />

      {/* Spotlight Effect */}
      {currentStep.target && (
        <motion.div
          animate={{
            top: coords.top - 8,
            left: coords.left - 8,
            width: coords.width + 16,
            height: coords.height + 16,
          }}
          className="absolute bg-white/10 border-2 border-white rounded-3xl shadow-[0_0_0_9999px_rgba(15,23,42,0.6)]"
          style={{ pointerEvents: "none" }}
        />
      )}

      {/* Dialog Card */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-4">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="bg-white rounded-[32px] p-8 shadow-2xl max-w-sm w-full pointer-events-auto border-t-8 border-indigo-600"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Paso {step + 1} de {totalSteps}
              </p>
              <h4 className="text-xl font-bold text-slate-900">
                {currentStep.title}
              </h4>
            </div>
          </div>

          <p className="text-slate-600 text-sm leading-relaxed mb-8">
            {currentStep.content}
          </p>

          <div className="flex items-center justify-between">
            <button
              onClick={onSkip}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
            >
              Saltar tour
            </button>

            <div className="flex gap-2">
              {step > 0 && (
                <button
                  onClick={onPrev}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition"
                >
                  Atrás
                </button>
              )}
              {step < totalSteps - 1 ? (
                <button
                  onClick={onNext}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition"
                >
                  Siguiente
                </button>
              ) : (
                <button
                  onClick={onSkip}
                  className="px-6 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition"
                >
                  ¡Entendido!
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

interface LeadCardProps {
  key?: string | number;
  lead: Lead;
  idx: number;
  isSelected: boolean;
  isSaved: boolean;
  isSaving: boolean;
  onSelect: () => void;
  onToggleSave: () => void | Promise<void>;
}

function LeadCard({
  lead,
  idx,
  isSelected,
  isSaved,
  isSaving,
  onSelect,
  onToggleSave,
}: LeadCardProps) {
  // Determine gradient, score and color configurations based on lead status
  const getStatusMetrics = (status: Lead["status"]) => {
    switch (status) {
      case "no_website":
        return {
          score: 18,
          scoreLabel: "Complejo (Baja Prioridad)",
          scoreColor: "text-slate-500 bg-slate-100 border border-slate-200",
          barColor: "bg-slate-350",
          gradient: "from-slate-400 via-slate-500 to-slate-450",
          statusText: "Sin Web",
        };
      case "old_tech":
        return {
          score: 85,
          scoreLabel: "Alta Viabilidad (Web Básica)",
          scoreColor:
            "text-amber-800 bg-amber-50 ring-2 ring-amber-200 border border-amber-250",
          barColor: "bg-gradient-to-r from-amber-500 to-indigo-600",
          gradient: "from-amber-550 via-orange-500 to-indigo-650",
          statusText: "Optimización de Web",
        };
      default:
        return {
          score: 95,
          scoreLabel: "Modernizado",
          scoreColor:
            "text-emerald-750 bg-emerald-50 border border-emerald-150",
          barColor: "bg-gradient-to-r from-emerald-500 to-teal-550",
          gradient: "from-emerald-500 via-teal-500 to-cyan-500",
          statusText: "Optimizado",
        };
    }
  };

  const metrics = getStatusMetrics(lead.status);
  const initials = lead.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const hasNotes =
    (lead.notes && lead.notes.replace(/<[^>]*>/g, "").trim().length > 0) ||
    (lead.notesList && lead.notesList.length > 0);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{
        opacity: 0,
        scale: 0.92,
        transition: { duration: 0.35, ease: "easeInOut" },
      }}
      transition={{
        type: "spring",
        stiffness: 240,
        damping: 24,
        delay: Math.min(idx * 0.025, 0.3), // Cap max delay to keep animations fast for large lists
      }}
      whileHover={{
        y: -2,
        scale: 1.01,
        transition: { type: "spring", stiffness: 400, damping: 25 },
      }}
      className={`group relative p-6 bg-white rounded-[32px] border-2 cursor-pointer transition-[border-color,background-color,box-shadow] duration-300 ease-out ${
        isSelected
          ? "border-indigo-600 bg-indigo-50/5 shadow-2xl shadow-indigo-100/80 ring-4 ring-indigo-50/50"
          : "border-slate-100 hover:border-indigo-200 hover:shadow-[0_24px_48px_-12px_rgba(99,102,241,0.08)] shadow-sm"
      }`}
      onClick={onSelect}
    >
      {/* Dynamic light accent line for active cards */}
      {isSelected && (
        <div className="absolute top-0 inset-x-12 h-[3px] bg-gradient-to-r from-transparent via-indigo-600 to-transparent rounded-full" />
      )}

      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          {/* Brand/Business Avatar Indicator */}
          <div
            className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${metrics.gradient} text-white font-black text-sm flex items-center justify-center shadow-md shadow-indigo-100 relative overflow-hidden group-hover:scale-105 transition-transform duration-300`}
          >
            <span className="relative z-10 tracking-tight">{initials}</span>
            <div className="absolute inset-0 bg-black/10 mix-blend-overlay opacity-50" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-indigo-600/80">
              {lead.industry}
            </span>
            {lead.crmStatus && <CRMStatusBadge status={lead.crmStatus} />}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {typeof lead.reminderAt === "string" &&
            lead.reminderAt.trim() !== "" &&
            (() => {
              const parsed = new Date(lead.reminderAt);
              return !isNaN(parsed.getTime()) ? (
                <div className="flex items-center gap-1 bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest">
                  <Calendar className="w-2.5 h-2.5" />{" "}
                  {parsed.toLocaleDateString([], {
                    day: "2-digit",
                    month: "2-digit",
                  })}
                </div>
              ) : null;
            })()}
          {hasNotes && (
            <div
              className="flex items-center gap-1 bg-indigo-50 text-indigo-600 border border-indigo-100 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest"
              title="Tiene anotaciones"
            >
              <FileText className="w-2.5 h-2.5" /> Nota
            </div>
          )}
          <StatusBadge status={lead.status} />
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              onToggleSave();
            }}
            disabled={isSaving}
            className={`p-2 rounded-xl transition-all duration-300 relative ${
              isSaved
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100"
                : "bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
            }`}
          >
            <AnimatePresence mode="wait">
              {isSaving ? (
                <motion.div
                  key="saving"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Loader2 className="w-4 h-4 animate-spin" />
                </motion.div>
              ) : isSaved ? (
                <motion.div
                  key="saved"
                  initial={{ opacity: 0, scale: 0.5, rotate: -45 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.5, rotate: 45 }}
                  transition={{ type: "spring", stiffness: 500, damping: 25 }}
                >
                  <BookmarkCheck className="w-4 h-4" />
                </motion.div>
              ) : (
                <motion.div
                  key="unsaved"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                >
                  <Bookmark className="w-4 h-4" />
                </motion.div>
              )}
            </AnimatePresence>
            {isSaved && !isSaving && (
              <motion.div
                initial={{ scale: 1, opacity: 0.5 }}
                animate={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 bg-indigo-400 rounded-xl pointer-events-none"
              />
            )}
          </motion.button>
        </div>
      </div>

      <h3 className="text-xl font-extrabold text-slate-800 mb-2 leading-tight group-hover:text-indigo-600 transition-colors">
        {lead.name}
      </h3>

      {/* Address & Contact Info Row */}
      <div className="flex flex-col gap-1.5 mb-4 text-xs font-semibold text-slate-400">
        <div className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-slate-300 group-hover:text-amber-500 transition-colors shrink-0" />
          <span className="truncate max-w-[150px]">{lead.location}</span>
          {(() => {
            const comName = lead.comuna || extractComuna(lead.location);
            const comInfo = CHILE_COMUNAS.find(
              (c) => c.name.toLowerCase() === comName.toLowerCase(),
            );
            if (comInfo) {
              return (
                <span
                  className={`text-[8.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg shrink-0 ${
                    comInfo.level === "very_high"
                      ? "bg-red-50 text-red-650 border border-red-100"
                      : comInfo.level === "high"
                        ? "bg-amber-50 text-amber-650 border border-amber-100"
                        : "bg-indigo-50/70 text-indigo-650 border border-indigo-100"
                  }`}
                  title={`Gap tecnológico en ${comName}: ${comInfo.obsolescenceRate}%`}
                >
                  {comInfo.level === "very_high" || comInfo.level === "high"
                    ? "🔥"
                    : "📈"}{" "}
                  {comName}
                </span>
              );
            }
            return null;
          })()}
        </div>
        <div className="flex items-center gap-2">
          <Phone className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-500 transition-colors shrink-0" />
          <span>{lead.phone}</span>
        </div>
      </div>

      {/* Modern Digital Gap indicator metric */}
      <div className="bg-slate-50/80 rounded-2xl p-3.5 mb-5 border border-slate-100/50">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Brecha Digital
          </span>
          <span
            className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${metrics.scoreColor}`}
          >
            {metrics.scoreLabel} ({metrics.score}%)
          </span>
        </div>
        <div className="w-full h-2 bg-slate-200/65 rounded-full overflow-hidden relative">
          <div
            className={`h-full ${metrics.barColor} transition-all duration-1000 ease-out`}
            style={{ width: `${metrics.score}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-slate-50 pt-4">
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all duration-300 ${
            lead.status === "no_website"
              ? "bg-rose-50 border border-rose-100 text-rose-600"
              : "bg-indigo-600 text-white shadow-lg shadow-indigo-100 border border-indigo-500/20"
          }`}
        >
          {lead.status === "no_website" ? (
            <>
              <Globe className="w-3 h-3" /> Web Requerida
            </>
          ) : (
            <>
              <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" /> IA
              Generativa
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <p className="text-[10px] uppercase font-black tracking-widest text-indigo-600/0 group-hover:text-indigo-600/100 translate-x-1 group-hover:translate-x-0 transition-all duration-300">
            Analizar
          </p>
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-500 ${
              isSelected
                ? "bg-indigo-600 text-white rotate-90 shadow-xl"
                : "bg-slate-50 text-slate-300 group-hover:bg-indigo-600 group-hover:text-white"
            }`}
          >
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function CRMStatusBadge({ status }: { status: Lead["crmStatus"] }) {
  const configs = {
    new: { color: "bg-blue-50 text-blue-600 border-blue-100", label: "Nuevo" },
    wait: {
      color: "bg-cyan-50 text-cyan-600 border-cyan-150",
      label: "Por Contactar (En Espera)",
    },
    contacted: {
      color: "bg-purple-50 text-purple-600 border-purple-100",
      label: "Contactado",
    },
    pitching: {
      color: "bg-amber-50 text-amber-600 border-amber-100",
      label: "Propuesta",
    },
    closed: {
      color: "bg-emerald-50 text-emerald-600 border-emerald-100",
      label: "Cerrado",
    },
    rejected: {
      color: "bg-rose-50 text-rose-600 border-rose-100",
      label: "Perdido",
    },
    modern: {
      color: "bg-slate-100 text-slate-500 border-slate-200",
      label: "Muy Moderno",
    },
  };

  if (!status) return null;
  const { color, label } = configs[status];

  return (
    <span
      className={`${color} border px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest leading-none`}
    >
      {label}
    </span>
  );
}

function StatusBadge({
  status,
  large = false,
}: {
  status: Lead["status"];
  large?: boolean;
}) {
  const configs = {
    no_website: {
      color: "bg-slate-100 text-slate-500 border-slate-200",
      label: "Sin Web",
      icon: Globe,
    },
    old_tech: {
      color:
        "bg-amber-50 text-amber-700 border-amber-250 ring-2 ring-amber-100/40",
      label: "Web Básica (Prioritario)",
      icon: Ghost,
    },
    optimized: {
      color: "bg-emerald-50 text-emerald-600 border-emerald-100",
      label: "Modernizado",
      icon: ShieldCheck,
    },
  };

  const { color, label, icon: Icon } = configs[status];

  return (
    <span
      className={`${color} border font-black uppercase tracking-widest leading-none flex items-center gap-2 ${large ? "px-6 py-3 text-xs rounded-2xl shadow-sm" : "px-2 py-1 text-[8px] rounded-lg"}`}
    >
      <Icon className={large ? "w-4 h-4" : "w-2.5 h-2.5"} /> {label}
    </span>
  );
}

function FilterBadge({
  label,
  active = false,
}: {
  label: string;
  active?: boolean;
}) {
  return (
    <button
      className={`px-5 py-2 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${active ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100" : "bg-white text-slate-400 hover:text-slate-600 border border-slate-100"}`}
    >
      {label}
    </button>
  );
}
