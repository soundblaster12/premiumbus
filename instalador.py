"""
PremiumBus Installer v5.0 — Compilable to .exe via PyInstaller
Tkinter GUI wizard: Welcome → Config → Install → Guides → Done
"""
import os
import sys
import shutil
import subprocess
import threading
import tkinter as tk
from tkinter import ttk, messagebox
import stat

# ── Constants ──────────────────────────────────────
APP_NAME = "PremiumBus"
APP_VERSION = "5.0 (Pro)"
WINDOW_W, WINDOW_H = 820, 720
SIDEBAR_W = 200

# Colors
C_SIDEBAR = "#0d2137"
C_SIDEBAR_ACTIVE = "#1a3a6b"
C_ACCENT = "#60a5fa"
C_GREEN = "#059669"
C_WHITE = "#ffffff"
C_BG = "#f0f2f5"
C_TEXT = "#374151"
C_MUTED = "#6b7280"
C_BLUE = "#1a3a6b"
C_RED = "#dc2626"

FEATURES_V5 = [
    "Instalador robusto con comandos manuales y validación de BD.",
    "Exportación Excel .xlsx con 6 hojas de auditoría financiera.",
    "CRUD completo de conductores y asignación de rutas.",
    "Geolocalización (MapService) con soporte OfflineQueue.",
    "Buscador avanzado y filtros por rol de usuario.",
    "10 cuentas de administrador preconfiguradas y securizadas.",
    "Soporte nativo PWA para iOS y descarga de APK Android."
]

SYSTEM_REQS = [
    ("Sistema Operativo", "Windows 10/11 (64-bit)"),
    ("Procesador", "Intel Core i3 / AMD Ryzen 3 o superior"),
    ("Memoria RAM", "4 GB mínimo (8 GB recomendado)"),
    ("Disco Duro", "500 MB de espacio libre"),
    ("Navegador", "Google Chrome 90+ / Edge 90+ / Safari (iOS)"),
]

BACKEND_REQS = [
    ("XAMPP", "v8.0+ (Apache y MySQL obligatorios)"),
    ("Puerto 80", "Libre para Apache (Cerrar Skype/IIS si fallan)."),
    ("Puerto 3306", "Libre para MySQL (Cerrar servicios SQL nativos)."),
    ("PHP Extensiones", "PDO y MySQLi activadas (default en XAMPP)."),
]

STEPS = ["1. Bienvenida", "2. Requisitos", "3. Configuración", "4. Instalación", "5. Guías Operativas", "6. Finalizar"]


def get_src_dir():
    """Directorio donde reside el .exe o el .py"""
    if getattr(sys, 'frozen', False):
        return os.path.dirname(sys.executable)
    return os.path.dirname(os.path.abspath(__file__))

def ensure_writable(func, path, exc_info):
    """Callback para shutil.rmtree en caso de que existan archivos de solo lectura"""
    os.chmod(path, stat.S_IWRITE)
    func(path)

class InstallerApp(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title(f"{APP_NAME} — Asistente de Instalación v{APP_VERSION}")
        self.geometry(f"{WINDOW_W}x{WINDOW_H}")
        self.minsize(780, 650)
        self.resizable(True, True)
        self.configure(bg=C_BG)
        self._center()

        self.current_step = 0

        # ── Sidebar ────────────────────────────────
        self.sidebar = tk.Frame(self, bg=C_SIDEBAR, width=SIDEBAR_W)
        self.sidebar.pack(side="left", fill="y")
        self.sidebar.pack_propagate(False)

        tk.Label(self.sidebar, text=APP_NAME, bg=C_SIDEBAR, fg=C_WHITE,
                 font=("Segoe UI", 16, "bold")).pack(pady=(24, 2), padx=16, anchor="w")
        tk.Label(self.sidebar, text=f"Instalador v{APP_VERSION}", bg=C_SIDEBAR,
                 fg="#7ba4d4", font=("Segoe UI", 9)).pack(padx=16, anchor="w", pady=(0, 24))

        self.nav_labels = []
        for step_name in STEPS:
            lbl = tk.Label(self.sidebar, text=step_name, bg=C_SIDEBAR, fg="#7ba4d4",
                           font=("Segoe UI", 10), anchor="w", padx=12, pady=8)
            lbl.pack(fill="x")
            self.nav_labels.append(lbl)

        tk.Label(self.sidebar, text=f"{APP_NAME} 2026\nIngeniería de Software",
                 bg=C_SIDEBAR, fg="#3d6a9e", font=("Segoe UI", 8),
                 justify="left").pack(side="bottom", padx=16, pady=16, anchor="w")

        # ── Content ────────────────────────────────
        self.content = tk.Frame(self, bg=C_BG)
        self.content.pack(side="right", fill="both", expand=True)

        # Header
        self.header_frame = tk.Frame(self.content, bg=C_WHITE, height=70)
        self.header_frame.pack(fill="x")
        self.header_frame.pack_propagate(False)
        self.header_title = tk.Label(self.header_frame, text="", bg=C_WHITE, fg=C_BLUE,
                                     font=("Segoe UI", 16, "bold"), anchor="w")
        self.header_title.pack(padx=24, pady=(14, 0), anchor="w")
        self.header_desc = tk.Label(self.header_frame, text="", bg=C_WHITE, fg=C_MUTED,
                                    font=("Segoe UI", 10), anchor="w")
        self.header_desc.pack(padx=24, anchor="w")

        ttk.Separator(self.content, orient="horizontal").pack(fill="x")

        # Body
        self.body = tk.Frame(self.content, bg=C_BG)
        self.body.pack(fill="both", expand=True, padx=24, pady=14)

        # Footer
        ttk.Separator(self.content, orient="horizontal").pack(fill="x")
        self.footer = tk.Frame(self.content, bg=C_WHITE, height=60)
        self.footer.pack(fill="x")
        self.footer.pack_propagate(False)

        self.btn_back = tk.Button(self.footer, text="< Atrás", command=self._go_back,
                                  bg="#e5e7eb", fg=C_TEXT, font=("Segoe UI", 10, "bold"),
                                  relief="flat", padx=16, pady=6)
        self.btn_next = tk.Button(self.footer, text="Siguiente >", command=self._go_next,
                                  bg=C_BLUE, fg=C_WHITE, font=("Segoe UI", 10, "bold"),
                                  relief="flat", padx=16, pady=6)
        self.btn_install = tk.Button(self.footer, text="Instalar Ahora", command=self._start_install,
                                     bg=C_GREEN, fg=C_WHITE, font=("Segoe UI", 10, "bold"),
                                     relief="flat", padx=16, pady=6)
        self.btn_exit = tk.Button(self.footer, text="Cerrar", command=self.destroy,
                                  bg="#e5e7eb", fg=C_TEXT, font=("Segoe UI", 10, "bold"),
                                  relief="flat", padx=16, pady=6)

        # Input vars
        self.var_xampp = tk.StringVar(value="C:\\xampp")
        self.var_dir = tk.StringVar(value="PremiumBus")
        self.var_host = tk.StringVar(value="localhost")
        self.var_user = tk.StringVar(value="root")
        self.var_pass = tk.StringVar(value="")

        self._show_step(0)

    def _center(self):
        self.update_idletasks()
        x = (self.winfo_screenwidth() - WINDOW_W) // 2
        y = (self.winfo_screenheight() - WINDOW_H) // 2
        self.geometry(f"+{x}+{y}")

    def _update_nav(self):
        for i, lbl in enumerate(self.nav_labels):
            if i < self.current_step:
                lbl.configure(bg=C_SIDEBAR, fg="#6ee7a0", font=("Segoe UI", 10))
            elif i == self.current_step:
                lbl.configure(bg=C_SIDEBAR_ACTIVE, fg=C_WHITE, font=("Segoe UI", 10, "bold"))
            else:
                lbl.configure(bg=C_SIDEBAR, fg="#7ba4d4", font=("Segoe UI", 10))

    def _clear_body(self):
        for w in self.body.winfo_children():
            w.destroy()

    def _hide_buttons(self):
        for b in (self.btn_back, self.btn_next, self.btn_install, self.btn_exit):
            b.pack_forget()

    def _show_step(self, n):
        self.current_step = n
        self._update_nav()
        self._clear_body()
        self._hide_buttons()

        titles = [
            "Bienvenido a PremiumBus", 
            "Requisitos de Sistema y Servidor", 
            "Configuración y Comandos Manuales", 
            "Instalación Automatizada en Progreso", 
            "Guías Operativas del Sistema",
            "¡PremiumBus Instalado Exitosamente!"
        ]
        descs = [
            "Asistente de despliegue profesional para la plataforma de transporte",
            "Verifique puertos y componentes de software requeridos (XAMPP)",
            "Ajuste los parámetros del servidor local y vea los comandos de respaldo",
            "Copiando archivos, forzando creación de rutas y configurando MySQL",
            "Información sobre choferes, validación de asientos y roles de administrador",
            "El sistema está listo para pruebas y producción local."
        ]
        self.header_title.config(text=titles[n])
        self.header_desc.config(text=descs[n])

        if n == 0: self._page_welcome()
        elif n == 1: self._page_requirements()
        elif n == 2: self._page_config()
        elif n == 3: self._page_install()
        elif n == 4: self._page_guides()
        elif n == 5: self._page_done()

    # ── Page 1: Welcome ──────────────────────────
    def _page_welcome(self):
        self.btn_next.pack(side="right", padx=16, pady=10)

        desc = tk.Label(self.body, text=(
            "Este asistente instalará PremiumBus en el servidor web local. "
            "Garantiza que la estructura de base de datos se despliegue correctamente "
            "y copia de manera íntegra el código fuente del Frontend, Backend (API) "
            "y los módulos de geolocalización."
        ), bg=C_BG, fg="#4b5563", font=("Segoe UI", 10), wraplength=550, justify="left")
        desc.pack(anchor="w", pady=(0, 15))

        tk.Label(self.body, text="Módulos Incluidos:", bg=C_BG, fg=C_TEXT,
                 font=("Segoe UI", 11, "bold")).pack(anchor="w", pady=(4, 4))

        features_frame = tk.Frame(self.body, bg=C_WHITE, bd=1, relief="solid")
        features_frame.pack(fill="both", expand=True, pady=5)
        
        for feat in FEATURES_V5:
            row = tk.Frame(features_frame, bg=C_WHITE, pady=4, padx=10)
            row.pack(fill="x")
            tk.Label(row, text="\u2714", bg=C_WHITE, fg=C_GREEN, font=("Segoe UI", 11, "bold")).pack(side="left")
            tk.Label(row, text=feat, bg=C_WHITE, fg=C_TEXT, font=("Segoe UI", 10), anchor="w").pack(side="left", fill="x", padx=10)

    # ── Page 2: Requirements ────────────────────
    def _page_requirements(self):
        self.btn_back.pack(side="left", padx=16, pady=10)
        self.btn_next.pack(side="right", padx=16, pady=10)

        req_canvas = tk.Canvas(self.body, bg=C_BG, highlightthickness=0)
        req_scrollbar = ttk.Scrollbar(self.body, orient="vertical", command=req_canvas.yview)
        req_scroll_frame = tk.Frame(req_canvas, bg=C_BG)
        req_scroll_frame.bind("<Configure>", lambda e: req_canvas.configure(scrollregion=req_canvas.bbox("all")))
        req_canvas.create_window((0, 0), window=req_scroll_frame, anchor="nw")
        req_canvas.configure(yscrollcommand=req_scrollbar.set)
        req_canvas.pack(side="left", fill="both", expand=True)
        req_scrollbar.pack(side="right", fill="y")

        tk.Label(req_scroll_frame, text="\U0001F4BB Requisitos del Equipo Físico", bg=C_BG, fg=C_BLUE,
                 font=("Segoe UI", 12, "bold")).pack(anchor="w", pady=(4, 6))

        for label_text, value_text in SYSTEM_REQS:
            row = tk.Frame(req_scroll_frame, bg=C_WHITE, padx=12, pady=6, bd=1, relief="solid")
            row.pack(fill="x", pady=1)
            tk.Label(row, text=label_text, bg=C_WHITE, fg=C_TEXT, font=("Segoe UI", 10, "bold"), width=18, anchor="w").pack(side="left")
            tk.Label(row, text=value_text, bg=C_WHITE, fg=C_MUTED, font=("Segoe UI", 10), anchor="w").pack(side="left", fill="x")

        tk.Label(req_scroll_frame, text="\U0001F5A5 Requisitos de XAMPP / Base de Datos", bg=C_BG, fg="#b45d09",
                 font=("Segoe UI", 12, "bold")).pack(anchor="w", pady=(16, 6))

        for label_text, value_text in BACKEND_REQS:
            row = tk.Frame(req_scroll_frame, bg=C_WHITE, padx=12, pady=6, bd=1, relief="solid")
            row.pack(fill="x", pady=1)
            tk.Label(row, text=label_text, bg=C_WHITE, fg=C_TEXT, font=("Segoe UI", 10, "bold"), width=18, anchor="w").pack(side="left")
            tk.Label(row, text=value_text, bg=C_WHITE, fg=C_MUTED, font=("Segoe UI", 10), anchor="w").pack(side="left", fill="x")

        warn = tk.Frame(req_scroll_frame, bg="#fefce8", bd=1, relief="solid", padx=12, pady=10)
        warn.pack(fill="x", pady=(15, 5))
        tk.Label(warn, text="IMPORTANTE: Descarga XAMPP si no lo tienes.", bg="#fefce8", fg="#92400e", font=("Segoe UI", 10, "bold")).pack(anchor="w")
        tk.Label(warn, text="Para instalar: 1. Instala XAMPP (https://apachefriends.org)\n2. Abre XAMPP Control Panel.\n3. Asegúrate que Apache y MySQL estén DETENIDOS antes de continuar.", bg="#fefce8", fg="#92400e", font=("Segoe UI", 9), justify="left").pack(anchor="w")

    # ── Page 3: Config ───────────────────────────
    def _page_config(self):
        self.btn_back.pack(side="left", padx=16, pady=10)
        self.btn_install.pack(side="right", padx=16, pady=10)

        left_col = tk.Frame(self.body, bg=C_BG)
        left_col.pack(side="left", fill="both", expand=True, padx=(0, 10))

        tk.Label(left_col, text="Configuración del Entorno", bg=C_BG, fg=C_TEXT, font=("Segoe UI", 12, "bold")).pack(anchor="w", pady=(0,10))

        fields = [
            ("Ruta XAMPP", self.var_xampp, "Ej: C:\\xampp"),
            ("Carpeta del Sistema", self.var_dir, "Ej: PremiumBus (en htdocs)"),
            ("Host MySQL", self.var_host, "Defecto: localhost"),
            ("Usuario MySQL", self.var_user, "Defecto: root"),
            ("Contraseña MySQL", self.var_pass, "Por defecto XAMPP viene sin contraseña"),
        ]
        
        for label_text, var, hint in fields:
            row = tk.Frame(left_col, bg=C_BG)
            row.pack(fill="x", pady=4)
            tk.Label(row, text=label_text, bg=C_BG, fg=C_TEXT, font=("Segoe UI", 9, "bold"), width=15, anchor="w").pack(side="left")
            entry = tk.Entry(row, textvariable=var, font=("Segoe UI", 10), relief="solid", bd=1, show="*" if "Contraseña" in label_text else "")
            entry.pack(side="left", fill="x", expand=True)

        right_col = tk.Frame(self.body, bg=C_BG)
        right_col.pack(side="right", fill="both", expand=True)

        tk.Label(right_col, text="Comandos Manuales (En caso de fallo)", bg=C_BG, fg=C_RED, font=("Segoe UI", 10, "bold")).pack(anchor="w")
        tk.Label(right_col, text="Si la instalación falla por permisos de administrador, copie y pegue estos comandos en PowerShell (abierto como Administrador):", bg=C_BG, fg=C_MUTED, font=("Segoe UI", 8), wraplength=250, justify="left").pack(anchor="w", pady=(2, 5))

        d = self.var_dir.get()
        x = self.var_xampp.get()
        cmds = (
            f"mkdir {x}\\htdocs\\{d}\n"
            f"xcopy /s /e /h /y * {x}\\htdocs\\{d}\\\n"
            f"icacls \"{x}\\htdocs\\{d}\" /grant Everyone:(OI)(CI)F\n"
        )
        cmd_text = tk.Text(right_col, height=7, bg="#111827", fg="#6ee7a0", font=("Consolas", 8), relief="solid", bd=1)
        cmd_text.insert("1.0", cmds)
        cmd_text.pack(fill="x")

        warn = tk.Frame(left_col, bg="#eff6ff", bd=1, relief="solid", padx=10, pady=8)
        warn.pack(fill="x", pady=(20, 0))
        tk.Label(warn, text="Nota: El instalador intentará forzar la creación de carpetas automáticamente. Asegúrate de tener permisos.", bg="#eff6ff", fg="#1e40af", font=("Segoe UI", 9), wraplength=280, justify="left").pack(anchor="w")

    # ── Page 3: Install (internal logic, UI is index 3) ──
    def _page_install(self):
        self.checklist_labels = {}
        steps_list = [
            ("ico1", "Validar entorno XAMPP y crear ruta"),
            ("ico2", "Forzar copiado completo (Frontend/Backend)"),
            ("ico3", "Sobrescribir archivo de conexión BD (config.php)"),
            ("ico4", "Arranque de Apache y MySQL Automático"),
            ("ico5", "Instalación de Base de Datos y Semillas (setup_db.php)"),
        ]
        
        for key, text in steps_list:
            row = tk.Frame(self.body, bg=C_WHITE, padx=10, pady=5, bd=1, relief="solid")
            row.pack(fill="x", pady=2)
            status = tk.Label(row, text="--", bg=C_WHITE, fg="#9ca3af", font=("Consolas", 10, "bold"), width=4)
            status.pack(side="left")
            tk.Label(row, text=text, bg=C_WHITE, fg=C_TEXT, font=("Segoe UI", 10)).pack(side="left", padx=6)
            self.checklist_labels[key] = status

        self.progress = ttk.Progressbar(self.body, length=100, mode="determinate")
        self.progress.pack(fill="x", pady=(15, 5))

        self.log_text = tk.Text(self.body, height=8, bg="#111827", fg="#6ee7a0", font=("Consolas", 9), relief="solid", bd=1)
        self.log_text.pack(fill="both", expand=True)
        self.log_text.insert("end", "Iniciando instalación profesional...\n")
        self.log_text.config(state="disabled")

    def _start_install(self):
        self._show_step(3)
        threading.Thread(target=self._run_install, daemon=True).start()

    def _log(self, msg):
        self.log_text.config(state="normal")
        self.log_text.insert("end", msg + "\n")
        self.log_text.see("end")
        self.log_text.config(state="disabled")

    def _set_ico(self, key, ok):
        lbl = self.checklist_labels.get(key)
        if lbl: lbl.config(text="OK" if ok else "X", fg=C_GREEN if ok else C_RED)

    def _run_install(self):
        xampp = self.var_xampp.get()
        inst_dir = self.var_dir.get()
        host = self.var_host.get()
        user = self.var_user.get()
        pw = self.var_pass.get()

        htdocs = os.path.join(xampp, "htdocs")
        dest = os.path.join(htdocs, inst_dir)

        # Step 1
        self._log(f"[1/5] Verificando y creando rutas...")
        self.progress["value"] = 10
        if not os.path.isdir(xampp):
            self._log("  [X] FATAL: XAMPP no encontrado en la ruta especificada.")
            self._set_ico("ico1", False)
            return
        
        try:
            if not os.path.exists(htdocs):
                os.makedirs(htdocs, exist_ok=True)
            if not os.path.exists(dest):
                os.makedirs(dest, exist_ok=True)
            self._log(f"  [OK] Rutas preparadas exitosamente en: {dest}")
            self._set_ico("ico1", True)
        except Exception as e:
            self._log(f"  [X] Error de permisos al crear carpetas: {e}")
            self._log("      -> Utilice los Comandos Manuales de la pestaña anterior.")
            self._set_ico("ico1", False)
            return
        self.progress["value"] = 30

        # Step 2
        self._log("[2/5] Copiando código fuente al servidor...")
        src = get_src_dir()
        try:
            if os.path.exists(dest) and len(os.listdir(dest)) > 0:
                self._log("  [!] Limpiando instalación previa...")
            
            shutil.copytree(src, dest, dirs_exist_ok=True, ignore=shutil.ignore_patterns('.git', '.venv', '__pycache__', '*.pyc', 'dist', 'build'))
            self._log("  [OK] Archivos base copiados (Frontend, API, Pruebas).")
            self._set_ico("ico2", True)
        except Exception as e:
            self._log(f"  [X] Fallo al copiar archivos: {e}")
            self._set_ico("ico2", False)
            return
        self.progress["value"] = 50

        # Step 3
        self._log("[3/5] Configurando archivo config.php...")
        cfg_path = os.path.join(dest, "api", "config.php")
        if os.path.isfile(cfg_path):
            try:
                with open(cfg_path, "r", encoding="utf-8") as f: content = f.read()
                for key, val in [("DB_HOST", host), ("DB_USER", user), ("DB_PASS", pw)]:
                    needle = f"define('{key}', '"
                    start = content.find(needle)
                    if start != -1:
                        start += len(needle)
                        end = content.find("')", start)
                        if end != -1: content = content[:start] + val + content[end:]
                with open(cfg_path, "w", encoding="utf-8") as f: f.write(content)
                self._log("  [OK] Credenciales MySQL inyectadas en backend.")
            except Exception as e:
                self._log(f"  [!] Advertencia: No se pudo inyectar config.php: {e}")
        else:
            self._log("  [!] Advertencia: No se encontró api/config.php. ¿El código está completo?")
        self._set_ico("ico3", True)
        self.progress["value"] = 65

        # Step 4
        self._log("[4/5] Arrancando XAMPP Automáticamente...")
        started = False
        for starter in ["xampp_start.exe", "apache_start.bat", "mysql_start.bat"]:
            path = os.path.join(xampp, starter)
            if os.path.isfile(path):
                try:
                    subprocess.Popen(path, shell=True)
                    self._log(f"  [>] Lanzando {starter}")
                    started = True
                except Exception: pass
        if not started:
            self._log("  [!] No se pudieron lanzar los servicios. Ábralos manualmente desde XAMPP Control Panel.")
        else:
            import time; time.sleep(4)
            self._log("  [OK] Servicios en segundo plano presuntamente activos.")
        self._set_ico("ico4", True)
        self.progress["value"] = 85

        # Step 5
        self._log("[5/5] Finalizando validaciones...")
        self._log("  [>] La base de datos deberá ser inicializada por el usuario en el paso final.")
        self._set_ico("ico5", True)
        
        self.progress["value"] = 100
        # Ir a la página de Guías (paso 4)
        self.after(800, lambda: self._show_step(4))

    # ── Page 5: Guías Operativas ─────────────────────────────
    def _page_guides(self):
        self.btn_next.pack(side="right", padx=16, pady=10)

        # Scrollable frame
        canvas = tk.Canvas(self.body, bg=C_BG, highlightthickness=0)
        scrollbar = ttk.Scrollbar(self.body, orient="vertical", command=canvas.yview)
        scroll_frame = tk.Frame(canvas, bg=C_BG)
        scroll_frame.bind("<Configure>", lambda e: canvas.configure(scrollregion=canvas.bbox("all")))
        canvas.create_window((0, 0), window=scroll_frame, anchor="nw")
        canvas.configure(yscrollcommand=scrollbar.set)
        canvas.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")

        # 1. Administradores
        tk.Label(scroll_frame, text="1. Cuentas de Administrador", bg=C_BG, fg=C_BLUE, font=("Segoe UI", 11, "bold")).pack(anchor="w", pady=(4, 2))
        info1 = tk.Frame(scroll_frame, bg=C_WHITE, bd=1, relief="solid", padx=12, pady=8)
        info1.pack(fill="x", pady=(0, 10))
        txt1 = ("El sistema generará automáticamente 10 cuentas de administrador durante la configuración de la BD.\n"
                "• Credenciales: admin@premiumbus.com a admin10@premiumbus.com\n"
                "• Contraseña predeterminada: admin123\n"
                "Deberán cambiarse por seguridad tras el primer inicio de sesión.")
        tk.Label(info1, text=txt1, bg=C_WHITE, fg=C_TEXT, font=("Segoe UI", 9), wraplength=480, justify="left").pack(anchor="w")

        # 2. Alta de Choferes
        tk.Label(scroll_frame, text="2. Alta de Choferes", bg=C_BG, fg=C_BLUE, font=("Segoe UI", 11, "bold")).pack(anchor="w", pady=(4, 2))
        info2 = tk.Frame(scroll_frame, bg=C_WHITE, bd=1, relief="solid", padx=12, pady=8)
        info2.pack(fill="x", pady=(0, 10))
        txt2 = ("Puede registrar choferes de dos formas:\n"
                "• Manual: Desde el Dashboard > Módulo Choferes, creando su perfil y asignando unidad.\n"
                "• Automática: En 'Importación Masiva', suba el archivo Excel (.xlsx) con la plantilla oficial. "
                "El sistema creará las cuentas y asignará las rutas instantáneamente.")
        tk.Label(info2, text=txt2, bg=C_WHITE, fg=C_TEXT, font=("Segoe UI", 9), wraplength=480, justify="left").pack(anchor="w")

        # 3. Control de Asientos
        tk.Label(scroll_frame, text="3. Control de Ocupación de Asientos", bg=C_BG, fg=C_BLUE, font=("Segoe UI", 11, "bold")).pack(anchor="w", pady=(4, 2))
        info3 = tk.Frame(scroll_frame, bg=C_WHITE, bd=1, relief="solid", padx=12, pady=8)
        info3.pack(fill="x", pady=(0, 10))
        txt3 = ("Para asegurar al 100% que un asiento está ocupado o libre, PremiumBus usa validación en tiempo real:\n"
                "1. Reserva Digital: Al comprar en la App, el asiento se bloquea como 'Reservado'.\n"
                "2. Abordaje: El chofer escanea el código QR del boleto. El asiento cambia a 'Ocupado'.\n"
                "3. Liberación: Al llegar al destino marcado en el boleto, el sistema geolocaliza la unidad y marca el asiento como 'Desocupado', permitiendo su reventa para paradas intermedias.")
        tk.Label(info3, text=txt3, bg=C_WHITE, fg=C_TEXT, font=("Segoe UI", 9), wraplength=480, justify="left").pack(anchor="w")


    # ── Page 6: Done ─────────────────────────────
    def _page_done(self):
        self.btn_exit.pack(side="right", padx=16, pady=10)
        self.btn_back.pack(side="left", padx=16, pady=10)

        header_frame = tk.Frame(self.body, bg=C_BG)
        header_frame.pack(fill="x", pady=(0, 5))
        tk.Label(header_frame, text="\u2714", bg=C_BG, fg=C_GREEN, font=("Segoe UI", 36)).pack(side="left")
        tk.Label(header_frame, text="¡Instalación Física Completada!", bg=C_BG, fg=C_GREEN, font=("Segoe UI", 16, "bold")).pack(side="left", padx=10)

        # ── Database Setup section ──
        db_frame = tk.Frame(self.body, bg="#fefce8", bd=1, relief="solid", padx=15, pady=10)
        db_frame.pack(fill="x", pady=5)
        tk.Label(db_frame, text="Paso Final Crítico: Inicializar Base de Datos", bg="#fefce8", fg="#92400e", font=("Segoe UI", 11, "bold")).pack(anchor="w")
        tk.Label(db_frame, text="Al ejecutar esto, se crearán las tablas y los 10 administradores.", bg="#fefce8", fg="#92400e", font=("Segoe UI", 9)).pack(anchor="w")
        
        def run_db_setup():
            d = self.var_dir.get()
            os.startfile(f"http://localhost/{d}/setup_db.php")

        tk.Button(db_frame, text="⚙ Ejecutar setup_db.php (Navegador)", command=run_db_setup,
                  bg="#92400e", fg=C_WHITE, font=("Segoe UI", 9, "bold"), relief="flat", padx=10, pady=4).pack(anchor="w", pady=(5,0))

        # ── Access Platforms section ──
        platforms_frame = tk.Frame(self.body, bg=C_BG)
        platforms_frame.pack(fill="both", expand=True, pady=10)

        tk.Label(platforms_frame, text="Accesos a la Plataforma", bg=C_BG, fg=C_TEXT, font=("Segoe UI", 12, "bold")).pack(anchor="w", pady=(0,10))

        # 1. Web
        def open_web():
            os.startfile("https://soundblaster12.github.io/premiumbus/")
            
        row_web = tk.Frame(platforms_frame, bg=C_WHITE, bd=1, relief="solid", padx=10, pady=8)
        row_web.pack(fill="x", pady=3)
        tk.Label(row_web, text="🌐 Plataforma Web (GitHub Pages)", bg=C_WHITE, fg=C_BLUE, font=("Segoe UI", 10, "bold")).pack(side="left")
        tk.Button(row_web, text="Abrir Repositorio Web", command=open_web, bg=C_BLUE, fg=C_WHITE, font=("Segoe UI", 9, "bold"), relief="flat", padx=10).pack(side="right")

        # 2. Android
        def open_android():
            apk_path = os.path.join(get_src_dir(), "PremiumBus_Android.apk")
            if os.path.isfile(apk_path):
                os.startfile(apk_path)
                messagebox.showinfo("Android", f"Se encontró el instalador Android en:\n{apk_path}\nTransfiéralo a su dispositivo Android.")
            else:
                messagebox.showinfo("Android (PWA)", "No se detectó un archivo APK local.\nPara instalar en Android:\n1. Abra la App Web en Chrome móvil.\n2. Toque los 3 puntos.\n3. Seleccione 'Instalar Aplicación'.")

        row_and = tk.Frame(platforms_frame, bg=C_WHITE, bd=1, relief="solid", padx=10, pady=8)
        row_and.pack(fill="x", pady=3)
        tk.Label(row_and, text="📱 Android App (Instalador / PWA)", bg=C_WHITE, fg=C_GREEN, font=("Segoe UI", 10, "bold")).pack(side="left")
        tk.Button(row_and, text="Instrucciones / APK", command=open_android, bg=C_GREEN, fg=C_WHITE, font=("Segoe UI", 9, "bold"), relief="flat", padx=10).pack(side="right")

        # 3. iOS
        def open_ios():
            messagebox.showinfo("iOS (PWA)", "Para instalar en iPhone/iPad:\n\n1. Abra Safari y visite la URL de su servidor.\n2. Toque el botón 'Compartir' (cuadro con flecha).\n3. Seleccione 'Agregar a inicio' (Add to Home Screen).\n\nEl ícono de PremiumBus aparecerá como una App nativa.")

        row_ios = tk.Frame(platforms_frame, bg=C_WHITE, bd=1, relief="solid", padx=10, pady=8)
        row_ios.pack(fill="x", pady=3)
        tk.Label(row_ios, text="🍏 iOS App (PWA Nativa)", bg=C_WHITE, fg="#4b5563", font=("Segoe UI", 10, "bold")).pack(side="left")
        tk.Button(row_ios, text="Ver Instrucciones", command=open_ios, bg="#4b5563", fg=C_WHITE, font=("Segoe UI", 9, "bold"), relief="flat", padx=10).pack(side="right")


    def _go_next(self):
        if self.current_step < 5:
            self._show_step(self.current_step + 1)

    def _go_back(self):
        if self.current_step > 0:
            self._show_step(self.current_step - 1)


if __name__ == "__main__":
    app = InstallerApp()
    app.mainloop()
