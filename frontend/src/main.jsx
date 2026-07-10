import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Boxes,
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
    common: {
      brand: "Invy",
      adminLink: "Admin",
      productNames: { invy: "Invy", erp: "Invy ERP", cafe: "Invy Cafe" },
      errors: {
        default: "İstek tamamlanamadı.",
        invalid_contact_payload: "Form bilgilerini kontrol edip tekrar deneyin.",
        incorrect_email_or_password: "E-posta veya şifre hatalı.",
        not_authenticated: "Oturum açmanız gerekiyor.",
        invalid_token: "Oturum süresi dolmuş olabilir. Lütfen tekrar giriş yapın.",
        admin_not_found: "Admin kullanıcısı bulunamadı.",
        message_not_found: "Mesaj bulunamadı.",
        method_not_allowed: "Bu işlem desteklenmiyor.",
      },
    },
    landing: {
      nav: ["Ekosistem", "Özellikler", "Vizyon", "İletişim"],
      getStarted: "İletişime geç",
      heroEyebrow: "Offline-first stok operasyonları",
      heroTitle: "Modern stok yönetimi için Invy ekosistemi",
      heroText:
        "Invy, küçük işletmelerden büyüyen operasyonlara kadar stok takibini sade, erişilebilir ve sürdürülebilir hale getirir.",
      explore: "Ekosistemi keşfet",
      contact: "İletişime geç",
      ecosystemEyebrow: "Ekosistem",
      appsTitle: "Üç ürün, tek stok aklı",
      appsText:
        "Invy bugün kullanıma hazır. Invy ERP ve Invy Cafe, farklı işletme ritimlerine göre tasarlanıyor.",
      featuresEyebrow: "Yetenekler",
      featuresTitle: "İşletmenin günlük akışına uyum sağlar",
      consoleTitle: "Invy Stok",
      chipSku: "1.284 SKU",
      chipCafe: "Cafe beta",
    },
    products: {
      active: "Aktif",
      comingSoon: "Yapım aşamasında",
      download: "Invy indir",
      invy:
        "Offline-first stok sayımı, barkod okutma ve lokal veri yaklaşımıyla küçük işletmeler için hazır.",
      erp:
        "Büyüyen işletmeler için stok görünürlüğü, ekip koordinasyonu ve sade operasyon yönetimi.",
      cafe:
        "Butik kafeler için menü yönetimi, atık takibi ve SKT duyarlılığı ile daha doğru planlama.",
    },
    features: [
      {
        title: "Lokalde güvenli veri",
        text: "Invy’nin offline-first yaklaşımı bağlantı kesildiğinde bile sayım akışını korur.",
      },
      {
        title: "Basit ekip akışı",
        text: "Ürünler, sayımlar ve mesajlar fazla eğitim gerektirmeyen yüzeylerle yönetilir.",
      },
      {
        title: "Sürdürülebilir stok",
        text: "Cafe tarafındaki atık ve SKT odağı daha iyi tahminleme için hazırlanır.",
      },
    ],
    vision: {
      eyebrow: "Invy",
      title: "Vizyon ve misyon",
      visionText: "Vizyonumuz stok yönetimini herkes için ulaşılabilir, sade ve güvenilir kılmak.",
      missionText:
        "Misyonumuz işletmelerin günlük kararlarını daha az karmaşa ve daha az israfla almasını sağlamak.",
    },
    contact: {
      eyebrow: "İletişim",
      title: "ERP veya Cafe için haberleşelim",
      text: "Mesajını bırak; Invy ERP veya Invy Cafe hazır olduğunda sana dönüş yapalım.",
      name: "Ad soyad",
      email: "E-posta",
      company: "Şirket (opsiyonel)",
      message: "Nasıl yardımcı olabiliriz?",
      submit: "Gönder",
      submitting: "Gönderiliyor...",
      success: "Mesaj alındı.",
    },
    download: {
      title: "Invy Android test akışı",
      text: "Önce test grubuna katıl, ardından Play Store indirme bağlantısını aç.",
      join: "Test grubuna katıl",
      playStore: "Play Store'u aç",
      ios: "iOS sürümü yakında.",
    },
    admin: {
      title: "Invy Admin",
      logout: "Çıkış",
      loginTitle: "Admin giriş",
      email: "E-posta",
      password: "Şifre",
      login: "Giriş yap",
      loggingIn: "Giriş yapılıyor...",
      loading: "Yükleniyor...",
      empty: "Henüz mesaj yok.",
      readToggle: "Okundu durumunu değiştir",
      delete: "Sil",
      statLabels: {
        total: "Toplam",
        unread: "Okunmamış",
        read: "Okundu",
        erp: "ERP",
        cafe: "Cafe",
      },
    },
  },
  en: {
    common: {
      brand: "Invy",
      adminLink: "Admin",
      productNames: { invy: "Invy", erp: "Invy ERP", cafe: "Invy Cafe" },
      errors: {
        default: "The request could not be completed.",
        invalid_contact_payload: "Please check the form details and try again.",
        incorrect_email_or_password: "Incorrect email or password.",
        not_authenticated: "You need to sign in.",
        invalid_token: "Your session may have expired. Please sign in again.",
        admin_not_found: "Admin user was not found.",
        message_not_found: "Message was not found.",
        method_not_allowed: "This action is not supported.",
      },
    },
    landing: {
      nav: ["Ecosystem", "Features", "Vision", "Contact"],
      getStarted: "Get in touch",
      heroEyebrow: "Offline-first stock operations",
      heroTitle: "The Invy ecosystem for modern stock work",
      heroText:
        "Invy makes inventory simpler, more accessible, and more sustainable for small teams and growing operations.",
      explore: "Explore ecosystem",
      contact: "Contact us",
      ecosystemEyebrow: "Ecosystem",
      appsTitle: "Three products, one inventory brain",
      appsText:
        "Invy is available today. Invy ERP and Invy Cafe are being shaped for different operating rhythms.",
      featuresEyebrow: "Capabilities",
      featuresTitle: "Built for daily operating flow",
      consoleTitle: "Invy Stock",
      chipSku: "1,284 SKU",
      chipCafe: "Cafe beta",
    },
    products: {
      active: "Active",
      comingSoon: "Coming soon",
      download: "Download Invy",
      invy:
        "Ready for small businesses with offline-first counts, barcode scanning, and local-first data.",
      erp:
        "Clear stock visibility, team coordination, and simple operations for growing businesses.",
      cafe:
        "Menu management, waste tracking, and expiry awareness for boutique cafes and better planning.",
    },
    features: [
      {
        title: "Safe local data",
        text: "Invy’s offline-first approach keeps counting work moving even when the connection drops.",
      },
      {
        title: "Simple team flow",
        text: "Products, counts, and messages are managed through surfaces that need little training.",
      },
      {
        title: "Sustainable inventory",
        text: "The cafe product is being prepared around waste, expiry dates, and better forecasting.",
      },
    ],
    vision: {
      eyebrow: "Invy",
      title: "Vision and mission",
      visionText: "Our vision is to make inventory management accessible, simple, and reliable for everyone.",
      missionText:
        "Our mission is to help businesses make daily decisions with less friction and less waste.",
    },
    contact: {
      eyebrow: "Contact",
      title: "Tell us about ERP or Cafe",
      text: "Leave a note and we will reach out when Invy ERP or Invy Cafe is ready.",
      name: "Full name",
      email: "Email",
      company: "Company (optional)",
      message: "How can we help?",
      submit: "Send",
      submitting: "Sending...",
      success: "Message received.",
    },
    download: {
      title: "Invy Android test flow",
      text: "Join the test group first, then open the Play Store download link.",
      join: "Join test group",
      playStore: "Open Play Store",
      ios: "iOS version coming soon.",
    },
    admin: {
      title: "Invy Admin",
      logout: "Log out",
      loginTitle: "Admin sign in",
      email: "Email",
      password: "Password",
      login: "Sign in",
      loggingIn: "Signing in...",
      loading: "Loading...",
      empty: "No messages yet.",
      readToggle: "Toggle read status",
      delete: "Delete",
      statLabels: {
        total: "Total",
        unread: "Unread",
        read: "Read",
        erp: "ERP",
        cafe: "Cafe",
      },
    },
  },
};

const LanguageContext = createContext(null);

function useLanguage() {
  return useContext(LanguageContext);
}

function errorMessage(detail, t) {
  return t.common.errors[detail] || t.common.errors.default;
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
    throw new Error(data.detail || "default");
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

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t: copy[lang] }), [lang]);
  const isAdmin = window.location.pathname.startsWith("/urs-admin");

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
  const navTargets = ["#ecosystem", "#features", "#vision", "#contact"];

  const openContact = (product = t.common.productNames.erp) => {
    window.dispatchEvent(new CustomEvent("invy:contact", { detail: { product } }));
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main>
      <header className="nav">
        <a className="brand" href="#" data-testid="brand-link">
          <img className="brand-logo" src="/invy-logo.png" alt={t.common.brand} />
        </a>
        <nav className="desktop-nav">
          {t.landing.nav.map((item, index) => (
            <a key={item} href={navTargets[index]}>
              {item}
            </a>
          ))}
        </nav>
        <div className="nav-actions">
          <LanguageToggle />
          <button className="button primary" data-testid="nav-get-started" onClick={() => openContact()}>
            {t.landing.getStarted}
          </button>
          <button className="icon-button mobile-only" data-testid="mobile-menu-toggle" onClick={() => setMenuOpen(true)}>
            <Menu size={20} />
          </button>
        </div>
      </header>

      {menuOpen && (
        <div className="mobile-menu" data-testid="mobile-menu">
          <button className="icon-button close" onClick={() => setMenuOpen(false)}>
            <X size={20} />
          </button>
          {t.landing.nav.map((item, index) => (
            <a key={item} href={navTargets[index]} onClick={() => setMenuOpen(false)}>
              {item}
            </a>
          ))}
          <LanguageToggle />
          <button className="button primary" onClick={() => openContact()}>
            {t.landing.getStarted}
          </button>
        </div>
      )}

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">{t.landing.heroEyebrow}</p>
          <h1>{t.landing.heroTitle}</h1>
          <p>{t.landing.heroText}</p>
          <div className="hero-actions">
            <button
              className="button primary"
              data-testid="hero-explore"
              onClick={() => document.getElementById("ecosystem")?.scrollIntoView({ behavior: "smooth" })}
            >
              {t.landing.explore}
              <ArrowRight size={18} />
            </button>
            <button className="button secondary" data-testid="hero-contact" onClick={() => openContact()}>
              {t.landing.contact}
            </button>
          </div>
        </div>
        <FloatingConsole />
      </section>

      <section id="ecosystem" className="section">
        <div className="section-heading">
          <p className="eyebrow">{t.landing.ecosystemEyebrow}</p>
          <h2>{t.landing.appsTitle}</h2>
          <p>{t.landing.appsText}</p>
        </div>
        <div className="app-grid">
          <ProductCard
            icon={<PackageCheck />}
            title={t.common.productNames.invy}
            status={t.products.active}
            text={t.products.invy}
            action={t.products.download}
            onClick={() => setDownloadOpen(true)}
            testId="app-invy"
          />
          <ProductCard
            icon={<BarChart3 />}
            title={t.common.productNames.erp}
            status={t.products.comingSoon}
            text={t.products.erp}
            action={t.landing.contact}
            onClick={() => openContact(t.common.productNames.erp)}
            testId="app-invy-erp"
          />
          <ProductCard
            icon={<Coffee />}
            title={t.common.productNames.cafe}
            status={t.products.comingSoon}
            text={t.products.cafe}
            action={t.landing.contact}
            onClick={() => openContact(t.common.productNames.cafe)}
            testId="app-invy-cafe"
          />
        </div>
      </section>

      <section id="features" className="section feature-band">
        <div className="section-heading">
          <p className="eyebrow">{t.landing.featuresEyebrow}</p>
          <h2>{t.landing.featuresTitle}</h2>
        </div>
        <div className="feature-grid">
          {t.features.map((feature, index) => (
            <motion.article
              className="feature-card"
              key={feature.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              {[<Database key="database" />, <Boxes key="boxes" />, <ShieldCheck key="shield" />][index]}
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <section id="vision" className="section vision">
        <div>
          <p className="eyebrow">{t.vision.eyebrow}</p>
          <h2>{t.vision.title}</h2>
        </div>
        <div className="vision-copy">
          <p>{t.vision.visionText}</p>
          <p>{t.vision.missionText}</p>
        </div>
      </section>

      <ContactSection />
      <Footer />
      {downloadOpen && <DownloadDialog onClose={() => setDownloadOpen(false)} />}
    </main>
  );
}

function FloatingConsole() {
  const { t } = useLanguage();
  return (
    <div className="hero-visual" aria-hidden="true">
      <motion.div
        className="console-card main-console"
        animate={{ y: [0, -12, 0], rotateX: [0, 3, 0] }}
        transition={{ duration: 5, repeat: Infinity }}
      >
        <div className="console-top">
          <span />
          <span />
          <span />
        </div>
        <div className="metric-row">
          <PackageCheck /> <strong>{t.landing.consoleTitle}</strong>
          <span>98%</span>
        </div>
        <div className="bars">
          <i />
          <i />
          <i />
        </div>
      </motion.div>
      <motion.div className="floating-chip chip-one" animate={{ y: [0, 18, 0], rotate: [0, -4, 0] }} transition={{ duration: 6, repeat: Infinity }}>
        <Boxes /> {t.landing.chipSku}
      </motion.div>
      <motion.div className="floating-chip chip-two" animate={{ y: [0, -16, 0], rotate: [0, 5, 0] }} transition={{ duration: 5.4, repeat: Infinity }}>
        <Coffee /> {t.landing.chipCafe}
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
        {action}
        <ArrowRight size={17} />
      </button>
    </motion.article>
  );
}

function ContactSection() {
  const { t } = useLanguage();
  const [form, setForm] = useState({ name: "", email: "", company: "", product: "Invy ERP", message: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
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
      toast.success(t.contact.success);
      setForm({ name: "", email: "", company: "", product: "Invy ERP", message: "" });
    } catch (error) {
      toast.error(errorMessage(error.message, t));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" className="section contact-section">
      <div className="contact-copy">
        <p className="eyebrow">{t.contact.eyebrow}</p>
        <h2>{t.contact.title}</h2>
        <p>{t.contact.text}</p>
      </div>
      <form className="contact-form" onSubmit={submit} data-testid="contact-form">
        <input required name="name" placeholder={t.contact.name} value={form.name} onChange={update} />
        <input required name="email" type="email" placeholder={t.contact.email} value={form.email} onChange={update} />
        <input name="company" placeholder={t.contact.company} value={form.company} onChange={update} />
        <select name="product" value={form.product} onChange={update} data-testid="contact-product">
          <option>Invy ERP</option>
          <option>Invy Cafe</option>
        </select>
        <textarea required name="message" rows="5" placeholder={t.contact.message} value={form.message} onChange={update} />
        <button className="button primary" disabled={loading} data-testid="contact-submit">
          <Send size={17} />
          {loading ? t.contact.submitting : t.contact.submit}
        </button>
      </form>
    </section>
  );
}

function DownloadDialog({ onClose }) {
  const { t } = useLanguage();
  const [joined, setJoined] = useState(false);
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <button className="icon-button close" onClick={onClose}>
          <X size={20} />
        </button>
        <Download size={28} />
        <h2>{t.download.title}</h2>
        <p>{t.download.text}</p>
        <a className="button secondary" href="https://groups.google.com/g/invy-app" target="_blank" rel="noreferrer" onClick={() => setJoined(true)}>
          {t.download.join}
        </a>
        <a className={`button primary ${joined ? "" : "disabled"}`} href={joined ? "https://play.google.com/store/apps/details?id=com.invy.app" : undefined} target="_blank" rel="noreferrer">
          {t.download.playStore}
        </a>
        <p className="small">{t.download.ios}</p>
      </div>
    </div>
  );
}

function Footer() {
  const { t } = useLanguage();
  return (
    <footer>
      <div className="brand">
        <img className="brand-logo" src="/invy-logo.png" alt={t.common.brand} />
      </div>
      <a href="/urs-admin">{t.common.adminLink}</a>
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
          <img className="brand-logo" src="/invy-logo.png" alt={t.common.brand} />
          <span>{t.admin.title}</span>
        </a>
        <div className="admin-actions">
          <LanguageToggle />
          {token && (
            <button className="button secondary" onClick={logout}>
              {t.admin.logout}
            </button>
          )}
        </div>
      </header>
      {token ? <AdminDashboard token={token} /> : <AdminLogin onLogin={setToken} />}
    </main>
  );
}

function AdminLogin({ onLogin }) {
  const { t } = useLanguage();
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
      toast.error(errorMessage(error.message, t));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="login-panel" onSubmit={submit} data-testid="admin-login-form">
      <Lock size={28} />
      <h1>{t.admin.loginTitle}</h1>
      <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder={t.admin.email} />
      <input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder={t.admin.password} />
      <button className="button primary" disabled={loading}>
        {loading ? t.admin.loggingIn : t.admin.login}
      </button>
    </form>
  );
}

function AdminDashboard({ token }) {
  const { t } = useLanguage();
  const [messages, setMessages] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const statKeys = ["total", "unread", "read", "erp", "cafe"];

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
      toast.error(errorMessage(error.message, t));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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
        {statKeys.map((key) => (
          <div className="stat-card" key={key}>
            <span>{t.admin.statLabels[key]}</span>
            <strong>{stats?.[key] ?? 0}</strong>
          </div>
        ))}
      </div>
      <div className="message-list" data-testid="admin-message-list">
        {loading && <p>{t.admin.loading}</p>}
        {!loading && messages.length === 0 && <p>{t.admin.empty}</p>}
        {messages.map((message) => (
          <article className={`message-card ${message.read ? "read" : ""}`} key={message.id}>
            <div>
              <span className="status">{message.product}</span>
              <h3>{message.name}</h3>
              <a href={`mailto:${message.email}`}>
                <Mail size={15} />
                {message.email}
              </a>
              {message.company && <p className="small">{message.company}</p>}
            </div>
            <p>{message.message}</p>
            <div className="message-actions">
              <button className="icon-button" onClick={() => toggleRead(message.id)} title={t.admin.readToggle}>
                {message.read ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              <button className="icon-button danger" onClick={() => deleteMessage(message.id)} title={t.admin.delete}>
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
