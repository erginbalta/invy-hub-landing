import React, { createContext, useContext, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  ChevronDown,
  Coffee,
  Database,
  Download,
  Eye,
  EyeOff,
  Languages,
  Lock,
  Mail,
  Menu,
  PackageCheck,
  Send,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { Toaster, toast } from "sonner";
import "./styles.css";

const API_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");
const ADMIN_TOKEN_KEY = "invy_admin_token";

const copy = {
  tr: {
    nav: ["Ekosistem", "Özellikler", "Vizyon", "İletişim"],
    getStarted: "İletişime geç",
    heroTitle: "Modern stok yönetimi için Invy ekosistemi",
    heroText:
      "Invy, küçük işletmelerden büyüyen operasyonlara kadar stok takibini sade, erişilebilir ve sürdürülebilir hale getirir.",
    explore: "Ekosistemi keşfet",
    contact: "İletişime geç",
    appsTitle: "Üç ürün, tek stok aklı",
    appsText:
      "Invy bugün kullanıma hazır. Invy ERP ve Invy Cafe, farklı işletme ritimlerine göre tasarlanıyor.",
    featuresTitle: "İşletmenin günlük akışına uyum sağlar",
    visionTitle: "Vizyon ve misyon",
    contactTitle: "ERP veya Cafe için haberleşelim",
    contactText:
      "Mesajını bırak; Invy ERP veya Invy Cafe hazır olduğunda sana dönüş yapalım.",
    adminTitle: "Invy Admin",
    download: "Invy indir",
    comingSoon: "Yapım aşamasında",
    active: "Aktif",
  },
  en: {
    nav: ["Ecosystem", "Features", "Vision", "Contact"],
    getStarted: "Get in touch",
    heroTitle: "The Invy ecosystem for modern stock work",
    heroText:
      "Invy makes inventory simpler, more accessible, and more sustainable for small teams and growing operations.",
    explore: "Explore ecosystem",
    contact: "Contact us",
    appsTitle: "Three products, one inventory brain",
    appsText:
      "Invy is available today. Invy ERP and Invy Cafe are being shaped for different operating rhythms.",
    featuresTitle: "Built for daily operating flow",
    visionTitle: "Vision and mission",
    contactTitle: "Tell us about ERP or Cafe",
    contactText:
      "Leave a note and we will reach out when Invy ERP or Invy Cafe is ready.",
    adminTitle: "Invy Admin",
    download: "Download Invy",
    comingSoon: "Coming soon",
    active: "Active",
  },
};

const LanguageContext = createContext(null);

function useLanguage() {
  return useContext(LanguageContext);
}

async function api(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || "Request failed");
  }
  return data;
}

function App() {
  const [lang, setLangState] = useState(() => {
    try {
      return localStorage.getItem("invy_lang") || "tr";
    } catch {
      return "tr";
    }
  });

  const setLang = (next) => {
    setLangState(next);
    try {
      localStorage.setItem("invy_lang", next);
    } catch {
      // localStorage may be unavailable in private contexts.
    }
  };

  const value = useMemo(() => ({ lang, setLang, t: copy[lang] }), [lang]);
  const isAdmin = window.location.pathname === "/urs-admin";

  return (
    <LanguageContext.Provider value={value}>
      <Toaster position="bottom-right" richColors />
      {isAdmin ? <AdminApp /> : <Landing />}
    </LanguageContext.Provider>
  );
}

function LanguageToggle() {
  const { lang, setLang } = useLanguage();
  return (
    <div className="language-toggle" data-testid="lang-toggle">
      <Languages size={16} />
      <button data-testid="lang-tr" className={lang === "tr" ? "active" : ""} onClick={() => setLang("tr")}>
        TR
      </button>
      <button data-testid="lang-en" className={lang === "en" ? "active" : ""} onClick={() => setLang("en")}>
        EN
      </button>
    </div>
  );
}

function Landing() {
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);

  const openContact = (product = "Invy ERP") => {
    window.dispatchEvent(new CustomEvent("invy:contact", { detail: { product } }));
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main>
      <header className="nav">
        <a className="brand" href="#" data-testid="brand-link">
          <img className="brand-logo" src="/invy-logo.png" alt="Invy" />
        </a>
        <nav className="desktop-nav">
          <a href="#ecosystem">{t.nav[0]}</a>
          <a href="#features">{t.nav[1]}</a>
          <a href="#vision">{t.nav[2]}</a>
          <a href="#contact">{t.nav[3]}</a>
        </nav>
        <div className="nav-actions">
          <LanguageToggle />
          <button className="button primary" data-testid="nav-get-started" onClick={() => openContact()}>
            {t.getStarted}
          </button>
          <button className="icon-button mobile-only" data-testid="mobile-menu-toggle" onClick={() => setMenuOpen(true)}>
            <Menu size={20} />
          </button>
        </div>
      </header>

      {menuOpen && (
        <div className="mobile-menu" data-testid="mobile-menu">
          <button className="icon-button close" onClick={() => setMenuOpen(false)}><X size={20} /></button>
          {t.nav.map((item, index) => (
            <a key={item} href={["#ecosystem", "#features", "#vision", "#contact"][index]} onClick={() => setMenuOpen(false)}>
              {item}
            </a>
          ))}
          <LanguageToggle />
          <button className="button primary" onClick={() => openContact()}>{t.getStarted}</button>
        </div>
      )}

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Offline-first stock operations</p>
          <h1>{t.heroTitle}</h1>
          <p>{t.heroText}</p>
          <div className="hero-actions">
            <button className="button primary" data-testid="hero-explore" onClick={() => document.getElementById("ecosystem")?.scrollIntoView({ behavior: "smooth" })}>
              {t.explore}<ArrowRight size={18} />
            </button>
            <button className="button secondary" data-testid="hero-contact" onClick={() => openContact()}>
              {t.contact}
            </button>
          </div>
        </div>
        <FloatingConsole />
      </section>

      <section id="ecosystem" className="section">
        <div className="section-heading">
          <p className="eyebrow">Ecosystem</p>
          <h2>{t.appsTitle}</h2>
          <p>{t.appsText}</p>
        </div>
        <div className="app-grid">
          <ProductCard
            icon={<PackageCheck />}
            title="Invy"
            status={t.active}
            text="Offline-first stok sayımı, barkod okutma ve lokal veri yaklaşımıyla küçük işletmeler için hazır."
            action={t.download}
            onClick={() => setDownloadOpen(true)}
            testId="app-invy"
          />
          <ProductCard
            icon={<BarChart3 />}
            title="Invy ERP"
            status={t.comingSoon}
            text="Büyüyen işletmeler için stok görünürlüğü, ekip koordinasyonu ve sade operasyon yönetimi."
            action={t.contact}
            onClick={() => openContact("Invy ERP")}
            testId="app-invy-erp"
          />
          <ProductCard
            icon={<Coffee />}
            title="Invy Cafe"
            status={t.comingSoon}
            text="Butik kafeler için menü yönetimi, atık takibi ve SKT duyarlılığı ile daha doğru planlama."
            action={t.contact}
            onClick={() => openContact("Invy Cafe")}
            testId="app-invy-cafe"
          />
        </div>
      </section>

      <section id="features" className="section feature-band">
        <div className="section-heading">
          <p className="eyebrow">Capabilities</p>
          <h2>{t.featuresTitle}</h2>
        </div>
        <div className="feature-grid">
          {[
            ["Lokalde güvenli veri", "Invy’nin offline-first yaklaşımı bağlantı kesildiğinde bile sayım akışını korur.", <Database />],
            ["Basit ekip akışı", "Ürünler, sayımlar ve mesajlar fazla eğitim gerektirmeyen yüzeylerle yönetilir.", <Boxes />],
            ["Sürdürülebilir stok", "Cafe tarafındaki atık ve SKT odağı daha iyi tahminleme için hazırlanır.", <ShieldCheck />],
          ].map(([title, text, icon]) => (
            <motion.article className="feature-card" key={title} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              {icon}
              <h3>{title}</h3>
              <p>{text}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <section id="vision" className="section vision">
        <div>
          <p className="eyebrow">Invy</p>
          <h2>{t.visionTitle}</h2>
        </div>
        <div className="vision-copy">
          <p>Vizyonumuz stok yönetimini herkes için ulaşılabilir, sade ve güvenilir kılmak.</p>
          <p>Misyonumuz işletmelerin günlük kararlarını daha az karmaşa ve daha az israfla almasını sağlamak.</p>
        </div>
      </section>

      <ContactSection />
      <Footer />
      {downloadOpen && <DownloadDialog onClose={() => setDownloadOpen(false)} />}
    </main>
  );
}

function FloatingConsole() {
  return (
    <div className="hero-visual" aria-hidden="true">
      <motion.div className="console-card main-console" animate={{ y: [0, -12, 0], rotateX: [0, 3, 0] }} transition={{ duration: 5, repeat: Infinity }}>
        <div className="console-top"><span /><span /><span /></div>
        <div className="metric-row"><PackageCheck /> <strong>Invy Stock</strong><span>98%</span></div>
        <div className="bars"><i /><i /><i /></div>
      </motion.div>
      <motion.div className="floating-chip chip-one" animate={{ y: [0, 18, 0], rotate: [0, -4, 0] }} transition={{ duration: 6, repeat: Infinity }}>
        <Boxes /> 1,284 SKU
      </motion.div>
      <motion.div className="floating-chip chip-two" animate={{ y: [0, -16, 0], rotate: [0, 5, 0] }} transition={{ duration: 5.4, repeat: Infinity }}>
        <Coffee /> Cafe beta
      </motion.div>
    </div>
  );
}

function ProductCard({ icon, title, status, text, action, onClick, testId }) {
  return (
    <motion.article className="product-card" data-testid={testId} whileHover={{ y: -6, rotateX: 2, rotateY: -2 }}>
      <div className="product-icon">{icon}</div>
      <div className="status">{status}</div>
      <h3>{title}</h3>
      <p>{text}</p>
      <button className="button secondary" data-testid={`${testId}-action`} onClick={onClick}>
        {action}<ArrowRight size={17} />
      </button>
    </motion.article>
  );
}

function ContactSection() {
  const { t } = useLanguage();
  const [form, setForm] = useState({ name: "", email: "", company: "", product: "Invy ERP", message: "" });
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    const handler = (event) => {
      setForm((current) => ({ ...current, product: event.detail?.product || "Invy ERP" }));
    };
    window.addEventListener("invy:contact", handler);
    return () => window.removeEventListener("invy:contact", handler);
  }, []);

  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });
  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await api("/contact", { method: "POST", body: JSON.stringify(form) });
      toast.success("Mesaj alındı");
      setForm({ name: "", email: "", company: "", product: "Invy ERP", message: "" });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" className="section contact-section">
      <div className="contact-copy">
        <p className="eyebrow">Contact</p>
        <h2>{t.contactTitle}</h2>
        <p>{t.contactText}</p>
      </div>
      <form className="contact-form" onSubmit={submit} data-testid="contact-form">
        <input required name="name" placeholder="Ad soyad" value={form.name} onChange={update} />
        <input required name="email" type="email" placeholder="E-posta" value={form.email} onChange={update} />
        <input name="company" placeholder="Şirket (opsiyonel)" value={form.company} onChange={update} />
        <select name="product" value={form.product} onChange={update} data-testid="contact-product">
          <option>Invy ERP</option>
          <option>Invy Cafe</option>
        </select>
        <textarea required name="message" rows="5" placeholder="Nasıl yardımcı olabiliriz?" value={form.message} onChange={update} />
        <button className="button primary" disabled={loading} data-testid="contact-submit">
          <Send size={17} />{loading ? "Gönderiliyor..." : "Gönder"}
        </button>
      </form>
    </section>
  );
}

function DownloadDialog({ onClose }) {
  const [joined, setJoined] = useState(false);
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <button className="icon-button close" onClick={onClose}><X size={20} /></button>
        <Download size={28} />
        <h2>Invy Android test akışı</h2>
        <p>Önce test grubuna katıl, ardından Play Store indirme bağlantısını aç.</p>
        <a className="button secondary" href="https://groups.google.com/g/invy-app" target="_blank" rel="noreferrer" onClick={() => setJoined(true)}>
          Test grubuna katıl
        </a>
        <a className={`button primary ${joined ? "" : "disabled"}`} href={joined ? "https://play.google.com/store/apps/details?id=com.invy.app" : undefined} target="_blank" rel="noreferrer">
          Play Store'u aç
        </a>
        <p className="small">iOS sürümü yakında.</p>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer>
      <div className="brand"><img className="brand-logo" src="/invy-logo.png" alt="Invy" /></div>
      <a href="/urs-admin">Admin</a>
    </footer>
  );
}

function AdminApp() {
  const { t } = useLanguage();
  const [token, setToken] = useState(() => localStorage.getItem(ADMIN_TOKEN_KEY) || "");

  const logout = () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    setToken("");
  };

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <a className="brand admin-brand" href="/">
          <img className="brand-logo" src="/invy-logo.png" alt="Invy" />
          <span>{t.adminTitle}</span>
        </a>
        <div className="admin-actions"><LanguageToggle />{token && <button className="button secondary" onClick={logout}>Çıkış</button>}</div>
      </header>
      {token ? <AdminDashboard token={token} /> : <AdminLogin onLogin={setToken} />}
    </main>
  );
}

function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState("admin@invy.app");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const data = await api("/admin/login", { method: "POST", body: JSON.stringify({ email, password }) });
      localStorage.setItem(ADMIN_TOKEN_KEY, data.access_token);
      onLogin(data.access_token);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="login-panel" onSubmit={submit} data-testid="admin-login-form">
      <Lock size={28} />
      <h1>Admin giriş</h1>
      <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="E-posta" />
      <input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Şifre" />
      <button className="button primary" disabled={loading}>{loading ? "Giriş yapılıyor..." : "Giriş yap"}</button>
    </form>
  );
}

function AdminDashboard({ token }) {
  const [messages, setMessages] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [messageData, statData] = await Promise.all([
        api("/admin/messages", { token }),
        api("/admin/stats", { token }),
      ]);
      setMessages(messageData);
      setStats(statData);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    load();
  }, [token]);

  const toggleRead = async (id) => {
    await api(`/admin/messages/${id}/read`, { method: "PATCH", token });
    await load();
  };

  const deleteMessage = async (id) => {
    await api(`/admin/messages/${id}`, { method: "DELETE", token });
    await load();
  };

  return (
    <section className="admin-dashboard">
      <div className="stats-grid">
        {["total", "unread", "read", "erp", "cafe"].map((key) => (
          <div className="stat-card" key={key}>
            <span>{key}</span>
            <strong>{stats?.[key] ?? 0}</strong>
          </div>
        ))}
      </div>
      <div className="message-list" data-testid="admin-message-list">
        {loading && <p>Yükleniyor...</p>}
        {!loading && messages.length === 0 && <p>Henüz mesaj yok.</p>}
        {messages.map((message) => (
          <article className={`message-card ${message.read ? "read" : ""}`} key={message.id}>
            <div>
              <span className="status">{message.product}</span>
              <h3>{message.name}</h3>
              <a href={`mailto:${message.email}`}><Mail size={15} />{message.email}</a>
              {message.company && <p className="small">{message.company}</p>}
            </div>
            <p>{message.message}</p>
            <div className="message-actions">
              <button className="icon-button" onClick={() => toggleRead(message.id)} title="Okundu değiştir">
                {message.read ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              <button className="icon-button danger" onClick={() => deleteMessage(message.id)} title="Sil">
                <Trash2 size={18} />
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

createRoot(document.getElementById("root")).render(<App />);
