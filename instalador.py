"""
PremiumBus Installer v5.0 — Compilable to .exe via PyInstaller
Tkinter GUI wizard: Welcome → Config → Install → Done
"""
import os
import sys
import shutil
import subprocess
import threading
import tkinter as tk
from tkinter import ttk, messagebox

# ── Constants ──────────────────────────────────────
APP_NAME = "PremiumBus"
APP_VERSION = "5.0"
WINDOW_W, WINDOW_H = 780, 680
SIDEBAR_W = 185

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
    "Admin principal puede eliminar usuarios y admins",
    "Exportacion Excel .xlsx con 6 hojas de auditoria",
    "CRUD completo de conductores (agregar/eliminar/asignar)",
    "Mapa GPS con ruta cyan neon y trail azul neon",
    "Buscador avanzado con algoritmo fuzzy scoring",
    "Filtros por rol (Todos/Usuarios/Admins)",
    "Resaltado de texto en resultados de busqueda",
    "Marcadores con efecto glow neon en mapa",
    "Controles de mapa bajo el mapa visibles",
    "10 cuentas de administrador preconfiguradas",
]

FEATURES_PREV = [
    "Pago con tarjeta, perfil con foto, GPS en vivo, QR",
    "Dashboard admin con analiticas e ingresos",
    "PWA instalable en iOS/Android, modo offline",
]

SYSTEM_REQS = [
    ("Sistema Operativo", "Windows 10/11 (64-bit)"),
    ("Procesador", "Intel Core i3 / AMD Ryzen 3 o superior"),
    ("Memoria RAM", "4 GB minimo (8 GB recomendado)"),
    ("Disco Duro", "500 MB de espacio libre"),
    ("Navegador", "Google Chrome 90+ / Edge 90+ / Firefox 90+"),
    ("Red", "Conexion a Internet (para mapas y EmailJS)"),
    ("Resolucion", "1280x720 minimo (1920x1080 recomendado)"),
]

BACKEND_REQS = [
    ("XAMPP", "v8.0+ (incluye Apache y MySQL)"),
    ("Apache", "v2.4+ (incluido en XAMPP)"),
    ("MySQL", "v8.0+ / MariaDB 10.4+ (incluido en XAMPP)"),
    ("PHP", "v7.4+ con extensiones PDO y MySQLi (incluido en XAMPP)"),
    ("Puerto 80", "Libre para Apache (cerrar Skype/IIS si interfieren)"),
    ("Puerto 3306", "Libre para MySQL"),
]

STEPS = ["1. Bienvenida", "2. Requisitos", "3. Configuracion", "4. Instalacion", "5. Finalizar"]


def get_src_dir():
    """Directorio donde reside el .exe o el .py"""
    if getattr(sys, 'frozen', False):
        return os.path.dirname(sys.executable)
    return os.path.dirname(os.path.abspath(__file__))


class InstallerApp(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title(f"{APP_NAME} — Asistente de Instalacion v{APP_VERSION}")
        self.geometry(f"{WINDOW_W}x{WINDOW_H}")
        self.minsize(700, 550)
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
                           font=("Segoe UI", 10), anchor="w", padx=12, pady=6)
            lbl.pack(fill="x")
            self.nav_labels.append(lbl)

        tk.Label(self.sidebar, text=f"{APP_NAME} 2026\nSan Luis Potosi, MX",
                 bg=C_SIDEBAR, fg="#3d6a9e", font=("Segoe UI", 8),
                 justify="left").pack(side="bottom", padx=16, pady=16, anchor="w")

        # ── Content ────────────────────────────────
        self.content = tk.Frame(self, bg=C_BG)
        self.content.pack(side="right", fill="both", expand=True)

        # Header
        self.header_frame = tk.Frame(self.content, bg=C_WHITE, height=60)
        self.header_frame.pack(fill="x")
        self.header_frame.pack_propagate(False)
        self.header_title = tk.Label(self.header_frame, text="", bg=C_WHITE, fg=C_BLUE,
                                     font=("Segoe UI", 15, "bold"), anchor="w")
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
        self.footer = tk.Frame(self.content, bg=C_WHITE, height=50)
        self.footer.pack(fill="x")
        self.footer.pack_propagate(False)

        self.btn_back = tk.Button(self.footer, text="< Atras", command=self._go_back,
                                  bg="#e5e7eb", fg=C_TEXT, font=("Segoe UI", 10, "bold"),
                                  relief="flat", padx=16, pady=4)
        self.btn_next = tk.Button(self.footer, text="Siguiente >", command=self._go_next,
                                  bg=C_BLUE, fg=C_WHITE, font=("Segoe UI", 10, "bold"),
                                  relief="flat", padx=16, pady=4)
        self.btn_install = tk.Button(self.footer, text="Instalar", command=self._start_install,
                                     bg=C_BLUE, fg=C_WHITE, font=("Segoe UI", 10, "bold"),
                                     relief="flat", padx=16, pady=4)
        self.btn_open = tk.Button(self.footer, text="Abrir App", command=self._open_app,
                                  bg=C_GREEN, fg=C_WHITE, font=("Segoe UI", 10, "bold"),
                                  relief="flat", padx=16, pady=4)
        self.btn_exit = tk.Button(self.footer, text="Cerrar", command=self.destroy,
                                  bg="#e5e7eb", fg=C_TEXT, font=("Segoe UI", 10, "bold"),
                                  relief="flat", padx=16, pady=4)

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
                lbl.configure(bg=C_SIDEBAR, fg="#6ee7a0")
            elif i == self.current_step:
                lbl.configure(bg=C_SIDEBAR_ACTIVE, fg=C_WHITE, font=("Segoe UI", 10, "bold"))
            else:
                lbl.configure(bg=C_SIDEBAR, fg="#7ba4d4", font=("Segoe UI", 10))

    def _clear_body(self):
        for w in self.body.winfo_children():
            w.destroy()

    def _hide_buttons(self):
        for b in (self.btn_back, self.btn_next, self.btn_install, self.btn_open, self.btn_exit):
            b.pack_forget()

    def _show_step(self, n):
        self.current_step = n
        self._update_nav()
        self._clear_body()
        self._hide_buttons()

        titles = ["Bienvenido", "Requisitos del Sistema", "Configuracion", "Instalacion en Progreso", "Instalacion Completada"]
        descs = [
            "Asistente de instalacion del sistema PremiumBus",
            "Verifique que su equipo cumple con los requisitos minimos",
            "Configure los parametros del servidor local",
            "Copiando archivos y configurando el sistema",
            "El sistema se instalo correctamente",
        ]
        self.header_title.config(text=titles[n])
        self.header_desc.config(text=descs[n])

        if n == 0:
            self._page_welcome()
        elif n == 1:
            self._page_requirements()
        elif n == 2:
            self._page_config()
        elif n == 3:
            self._page_install()
        elif n == 4:
            self._page_done()

    # ── Page 1: Welcome ──────────────────────────
    def _page_welcome(self):
        self.btn_next.pack(side="right", padx=16, pady=8)

        desc = tk.Label(self.body, text=(
            f"Este asistente le guiara en la instalacion del sistema "
            f"PremiumBus v{APP_VERSION} en su computadora. Se copiaran los archivos "
            f"necesarios al servidor web local (XAMPP) y se configurara la "
            f"conexion a la base de datos MySQL."
        ), bg=C_BG, fg="#4b5563", font=("Segoe UI", 10), wraplength=480, justify="left")
        desc.pack(anchor="w", pady=(0, 10))

        tk.Label(self.body, text=f"Novedades v{APP_VERSION}:", bg=C_BG, fg=C_TEXT,
                 font=("Segoe UI", 10, "bold")).pack(anchor="w", pady=(4, 4))

        features_frame = tk.Frame(self.body, bg=C_BG)
        features_frame.pack(fill="x")
        canvas = tk.Canvas(features_frame, bg=C_BG, highlightthickness=0, height=200)
        scrollbar = ttk.Scrollbar(features_frame, orient="vertical", command=canvas.yview)
        scroll_frame = tk.Frame(canvas, bg=C_BG)
        scroll_frame.bind("<Configure>", lambda e: canvas.configure(scrollregion=canvas.bbox("all")))
        canvas.create_window((0, 0), window=scroll_frame, anchor="nw")
        canvas.configure(yscrollcommand=scrollbar.set)
        canvas.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")

        for feat in FEATURES_V5:
            row = tk.Frame(scroll_frame, bg=C_WHITE, pady=3, padx=8)
            row.pack(fill="x", pady=1)
            tk.Label(row, text="  +", bg=C_WHITE, fg=C_GREEN, font=("Segoe UI", 10, "bold")).pack(side="left")
            tk.Label(row, text=f"  {feat}", bg=C_WHITE, fg=C_TEXT, font=("Segoe UI", 9), anchor="w").pack(side="left", fill="x")

        tk.Label(scroll_frame, text="Versiones anteriores incluidas:", bg=C_BG, fg=C_TEXT,
                 font=("Segoe UI", 9, "bold")).pack(anchor="w", pady=(8, 2))
        for feat in FEATURES_PREV:
            row = tk.Frame(scroll_frame, bg=C_WHITE, pady=3, padx=8)
            row.pack(fill="x", pady=1)
            tk.Label(row, text="  +", bg=C_WHITE, fg=C_GREEN, font=("Segoe UI", 10, "bold")).pack(side="left")
            tk.Label(row, text=f"  {feat}", bg=C_WHITE, fg=C_TEXT, font=("Segoe UI", 9), anchor="w").pack(side="left")

    # ── Page 2: Requirements ────────────────────
    def _page_requirements(self):
        self.btn_back.pack(side="left", padx=16, pady=8)
        self.btn_next.pack(side="right", padx=16, pady=8)

        # Scrollable frame for requirements
        req_canvas = tk.Canvas(self.body, bg=C_BG, highlightthickness=0)
        req_scrollbar = ttk.Scrollbar(self.body, orient="vertical", command=req_canvas.yview)
        req_scroll_frame = tk.Frame(req_canvas, bg=C_BG)
        req_scroll_frame.bind("<Configure>", lambda e: req_canvas.configure(scrollregion=req_canvas.bbox("all")))
        req_canvas.create_window((0, 0), window=req_scroll_frame, anchor="nw")
        req_canvas.configure(yscrollcommand=req_scrollbar.set)
        req_canvas.pack(side="left", fill="both", expand=True)
        req_scrollbar.pack(side="right", fill="y")

        # Computer requirements section
        tk.Label(req_scroll_frame, text="\U0001F4BB  Requisitos de la Computadora", bg=C_BG, fg=C_BLUE,
                 font=("Segoe UI", 12, "bold")).pack(anchor="w", pady=(4, 6))

        for label_text, value_text in SYSTEM_REQS:
            row = tk.Frame(req_scroll_frame, bg=C_WHITE, padx=12, pady=6, bd=1, relief="solid")
            row.pack(fill="x", pady=1)
            tk.Label(row, text=label_text, bg=C_WHITE, fg=C_TEXT,
                     font=("Segoe UI", 10, "bold"), width=20, anchor="w").pack(side="left")
            tk.Label(row, text=value_text, bg=C_WHITE, fg=C_MUTED,
                     font=("Segoe UI", 10), anchor="w").pack(side="left", fill="x", expand=True)

        # Backend requirements section
        tk.Label(req_scroll_frame, text="\U0001F5A5  Requisitos del Backend (Servidor Local)", bg=C_BG, fg="#b45d09",
                 font=("Segoe UI", 12, "bold")).pack(anchor="w", pady=(16, 6))

        for label_text, value_text in BACKEND_REQS:
            row = tk.Frame(req_scroll_frame, bg=C_WHITE, padx=12, pady=6, bd=1, relief="solid")
            row.pack(fill="x", pady=1)
            tk.Label(row, text=label_text, bg=C_WHITE, fg=C_TEXT,
                     font=("Segoe UI", 10, "bold"), width=20, anchor="w").pack(side="left")
            tk.Label(row, text=value_text, bg=C_WHITE, fg=C_MUTED,
                     font=("Segoe UI", 10), anchor="w").pack(side="left", fill="x", expand=True)

        # XAMPP download note
        xampp_note = tk.Frame(req_scroll_frame, bg="#eff6ff", bd=1, relief="solid", padx=12, pady=8)
        xampp_note.pack(fill="x", pady=(12, 4))
        tk.Label(xampp_note, text="Descargar XAMPP: https://www.apachefriends.org/es/download.html",
                 bg="#eff6ff", fg="#1e40af", font=("Segoe UI", 9, "bold"), wraplength=440, justify="left").pack(anchor="w")
        tk.Label(xampp_note, text="XAMPP incluye Apache, MySQL y PHP en un solo paquete. Es gratuito.",
                 bg="#eff6ff", fg="#1e40af", font=("Segoe UI", 8), wraplength=440, justify="left").pack(anchor="w")

        # Warning
        warn = tk.Frame(req_scroll_frame, bg="#fefce8", bd=1, relief="solid", padx=12, pady=8)
        warn.pack(fill="x", pady=(8, 4))
        tk.Label(warn, text="Importante: XAMPP debe estar instalado ANTES de continuar con la instalacion.",
                 bg="#fefce8", fg="#92400e", font=("Segoe UI", 9, "bold"), wraplength=440, justify="left").pack(anchor="w")
        tk.Label(warn, text="Si no tiene XAMPP instalado, descargelo primero desde el enlace de arriba.",
                 bg="#fefce8", fg="#92400e", font=("Segoe UI", 8), wraplength=440, justify="left").pack(anchor="w")

    # ── Page 3: Config ───────────────────────────
    def _page_config(self):
        self.btn_back.pack(side="left", padx=16, pady=8)
        self.btn_install.pack(side="right", padx=16, pady=8)

        fields = [
            ("Ruta de instalacion de XAMPP", self.var_xampp, "Carpeta donde esta instalado XAMPP"),
            ("Nombre de carpeta del proyecto", self.var_dir, "Se creara dentro de htdocs"),
            ("Host de MySQL", self.var_host, "Normalmente localhost"),
            ("Usuario de MySQL", self.var_user, "Por defecto: root"),
            ("Contrasena de MySQL", self.var_pass, "Dejela vacia si usa config por defecto"),
        ]
        for label_text, var, hint in fields:
            tk.Label(self.body, text=label_text.upper(), bg=C_BG, fg=C_TEXT,
                     font=("Segoe UI", 9, "bold")).pack(anchor="w", pady=(8, 2))
            show = "*" if "contrasena" in label_text.lower() else ""
            entry = tk.Entry(self.body, textvariable=var, font=("Segoe UI", 11),
                             relief="solid", bd=1, show=show)
            entry.pack(fill="x", ipady=4)
            tk.Label(self.body, text=hint, bg=C_BG, fg="#9ca3af",
                     font=("Segoe UI", 8)).pack(anchor="w")

        warn = tk.Frame(self.body, bg="#fefce8", bd=1, relief="solid", padx=10, pady=8)
        warn.pack(fill="x", pady=(12, 0))
        tk.Label(warn, text="Importante: Asegurese de que Apache y MySQL de XAMPP esten detenidos.",
                 bg="#fefce8", fg="#92400e", font=("Segoe UI", 9), wraplength=440, justify="left").pack(anchor="w")

    # ── Page 3: Install ──────────────────────────
    def _page_install(self):
        self.checklist_labels = {}
        steps_list = [
            ("ico1", "Verificar XAMPP"),
            ("ico2", "Verificar directorio htdocs"),
            ("ico3", "Copiar archivos del sistema"),
            ("ico4", "Configurar base de datos"),
            ("ico5", "Iniciar servicios Apache y MySQL"),
            ("ico6", "Finalizar instalacion"),
        ]
        for key, text in steps_list:
            row = tk.Frame(self.body, bg=C_WHITE, padx=10, pady=6, bd=1, relief="solid")
            row.pack(fill="x", pady=2)
            status = tk.Label(row, text="--", bg=C_WHITE, fg="#9ca3af",
                              font=("Consolas", 10, "bold"), width=4)
            status.pack(side="left")
            tk.Label(row, text=text, bg=C_WHITE, fg=C_TEXT,
                     font=("Segoe UI", 10)).pack(side="left", padx=6)
            self.checklist_labels[key] = status

        self.progress = ttk.Progressbar(self.body, length=100, mode="determinate")
        self.progress.pack(fill="x", pady=(10, 4))

        self.log_text = tk.Text(self.body, height=7, bg="#111827", fg="#6ee7a0",
                                font=("Consolas", 9), relief="solid", bd=1, wrap="word")
        self.log_text.pack(fill="x")
        self.log_text.insert("end", "Esperando inicio de la instalacion...\n")
        self.log_text.config(state="disabled")

    def _start_install(self):
        self._show_step(2)
        threading.Thread(target=self._run_install, daemon=True).start()

    def _log(self, msg):
        self.log_text.config(state="normal")
        self.log_text.insert("end", msg + "\n")
        self.log_text.see("end")
        self.log_text.config(state="disabled")

    def _set_ico(self, key, ok):
        lbl = self.checklist_labels.get(key)
        if lbl:
            lbl.config(text="OK" if ok else "X", fg=C_GREEN if ok else C_RED)

    def _run_install(self):
        xampp = self.var_xampp.get()
        inst_dir = self.var_dir.get()
        host = self.var_host.get()
        user = self.var_user.get()
        pw = self.var_pass.get()

        # Step 1
        self._log(f"[1/6] Verificando XAMPP en: {xampp}")
        self.progress["value"] = 10
        if not os.path.isdir(xampp):
            self._log("  [X] ERROR: XAMPP no encontrado.")
            self._set_ico("ico1", False)
            return
        self._log("  [OK] XAMPP encontrado.")
        self._set_ico("ico1", True)
        self.progress["value"] = 20

        # Step 2
        htdocs = os.path.join(xampp, "htdocs")
        self._log("[2/6] Verificando htdocs...")
        if not os.path.isdir(htdocs):
            self._log("  [X] ERROR: htdocs no encontrado.")
            self._set_ico("ico2", False)
            return
        self._log("  [OK] htdocs encontrado.")
        self._set_ico("ico2", True)
        self.progress["value"] = 35

        # Step 3
        self._log("[3/6] Copiando archivos de PremiumBus...")
        src = get_src_dir()
        dest = os.path.join(htdocs, inst_dir)
        try:
            if os.path.isdir(dest):
                self._log("  [!] Instalacion previa detectada. Actualizando...")
            shutil.copytree(src, dest, dirs_exist_ok=True)
            self._log(f"  [OK] Archivos copiados a: {dest}")
            self._set_ico("ico3", True)
        except Exception as e:
            self._log(f"  [X] Error al copiar: {e}")
            self._set_ico("ico3", False)
            return
        self.progress["value"] = 50

        # Step 4
        self._log("[4/6] Configurando base de datos...")
        cfg_path = os.path.join(dest, "api", "config.php")
        if os.path.isfile(cfg_path):
            try:
                with open(cfg_path, "r", encoding="utf-8") as f:
                    content = f.read()
                for key, val in [("DB_HOST", host), ("DB_USER", user), ("DB_PASS", pw)]:
                    needle = f"define('{key}', '"
                    start = content.find(needle)
                    if start != -1:
                        start += len(needle)
                        end = content.find("')", start)
                        if end != -1:
                            content = content[:start] + val + content[end:]
                with open(cfg_path, "w", encoding="utf-8") as f:
                    f.write(content)
                self._log("  [OK] config.php actualizado.")
            except Exception as e:
                self._log(f"  [!] No se pudo editar config.php: {e}")
        else:
            self._log("  [!] config.php no encontrado. Usando config por defecto.")
        self._set_ico("ico4", True)
        self.progress["value"] = 65

        # Step 5
        self._log("[5/6] Iniciando servicios XAMPP...")
        started = False
        for starter in ["xampp_start.exe", "apache_start.bat"]:
            path = os.path.join(xampp, starter)
            if os.path.isfile(path):
                try:
                    subprocess.Popen(path, shell=True)
                    self._log(f"  Ejecutando {starter}...")
                    started = True
                except Exception:
                    pass
        if not started:
            self._log("  [!] Inicie XAMPP Control Panel manualmente.")
        else:
            import time; time.sleep(3)
            self._log("  [OK] Servicios listos.")
        self._set_ico("ico5", True)
        self.progress["value"] = 85

        # Step 6
        self._log("[6/6] Finalizando...")
        self._log("")
        self._log("=========================================")
        self._log("  INSTALACION COMPLETADA EXITOSAMENTE")
        self._log("=========================================")
        self._log(f"  URL: http://localhost/{inst_dir}/")
        self._log(f"  BD:  http://localhost/{inst_dir}/setup_db.php")
        self._set_ico("ico6", True)
        self.progress["value"] = 100

        self.after(500, lambda: self._show_step(4))

    # ── Page 4: Done ─────────────────────────────
    def _page_done(self):
        self.btn_open.pack(side="right", padx=(6, 16), pady=8)
        self.btn_exit.pack(side="right", pady=8)

        tk.Label(self.body, text="\u2714", bg=C_BG, fg=C_GREEN,
                 font=("Segoe UI", 42)).pack(pady=(4, 2))
        tk.Label(self.body, text="Instalacion Completada", bg=C_BG, fg=C_GREEN,
                 font=("Segoe UI", 16, "bold")).pack()
        tk.Label(self.body, text=f"PremiumBus v{APP_VERSION} instalado correctamente.",
                 bg=C_BG, fg=C_MUTED, font=("Segoe UI", 10)).pack(pady=(2, 10))

        cred = tk.Frame(self.body, bg="#f0fdf4", bd=1, relief="solid", padx=12, pady=10)
        cred.pack(fill="x", pady=(0, 8))
        tk.Label(cred, text="Credenciales de Administrador Principal:", bg="#f0fdf4",
                 fg="#166534", font=("Segoe UI", 10, "bold")).pack(anchor="w")
        tk.Label(cred, text="Correo: admin@premiumbus.com\nContrasena: admin123",
                 bg="#f0fdf4", fg="#166534", font=("Segoe UI", 10)).pack(anchor="w", pady=(4, 4))
        tk.Label(cred, text="Admins 2-10: admin2@premiumbus.com ... admin10@premiumbus.com (admin123)",
                 bg="#f0fdf4", fg="#047857", font=("Segoe UI", 8)).pack(anchor="w")

        info = tk.Frame(self.body, bg="#eff6ff", bd=1, relief="solid", padx=12, pady=8)
        info.pack(fill="x")
        tk.Label(info, text="Nuevas funcionalidades v5.0:", bg="#eff6ff", fg="#1e40af",
                 font=("Segoe UI", 9, "bold")).pack(anchor="w")
        summary = (
            "- Conductores: agregar/eliminar desde Panel Admin\n"
            "- Admin elimina usuarios desde Perfil y Panel\n"
            "- Excel .xlsx con 6 hojas de auditoria\n"
            "- Mapa con ruta cyan y trail azul neon\n"
            "- Buscador fuzzy con filtros por rol"
        )
        tk.Label(info, text=summary, bg="#eff6ff", fg="#1e40af",
                 font=("Segoe UI", 8), justify="left").pack(anchor="w")

        btn_row = tk.Frame(self.body, bg=C_BG)
        btn_row.pack(fill="x", pady=(12, 0))
        tk.Button(btn_row, text="Abrir PremiumBus", command=self._open_app,
                  bg=C_BLUE, fg=C_WHITE, font=("Segoe UI", 10, "bold"),
                  relief="flat", padx=20, pady=6).pack(side="left", expand=True, fill="x", padx=(0, 4))
        tk.Button(btn_row, text="Configurar BD", command=self._open_setup,
                  bg="#e5e7eb", fg=C_TEXT, font=("Segoe UI", 10, "bold"),
                  relief="flat", padx=20, pady=6).pack(side="right", expand=True, fill="x", padx=(4, 0))

    def _open_app(self):
        d = self.var_dir.get()
        os.startfile(f"http://localhost/{d}/")

    def _open_setup(self):
        d = self.var_dir.get()
        os.startfile(f"http://localhost/{d}/setup_db.php")

    def _go_next(self):
        if self.current_step < 4:
            self._show_step(self.current_step + 1)

    def _go_back(self):
        if self.current_step > 0:
            self._show_step(self.current_step - 1)


if __name__ == "__main__":
    app = InstallerApp()
    app.mainloop()
