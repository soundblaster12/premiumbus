/**
 * generar_capacitacion.js — Genera el documento Word del Programa de Capacitación PremiumBus.
 * Ejecutar: npm install docx && node generar_capacitacion.js
 */
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, HeadingLevel, BorderStyle, ShadingType,
  PageBreak, TableLayoutType, VerticalAlign, convertInchesToTwip,
} = require('docx');
const fs = require('fs');
const path = require('path');

// ── Design Tokens ────────────────────────────────
const AZUL = '1A3A6B';
const AZUL2 = '2B5EA7';
const GRIS = '404040';
const BLANCO = 'FFFFFF';
const FONDO_HEADER = '1A3A6B';
const FONDO_ALT = 'F0F4F8';

const OUTPUT = path.join(__dirname, 'Programa_Capacitacion_PremiumBus.docx');

// ── Helpers ──────────────────────────────────────
function heading(text, level = HeadingLevel.HEADING_1) {
  return new Paragraph({ text, heading: level, spacing: { before: 280, after: 120 } });
}

function paragraph(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 100 },
    ...opts,
    children: [new TextRun({ text, size: 22, font: 'Calibri', color: GRIS, ...opts.run })],
  });
}

function bulletItem(text) {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 60 },
    children: [new TextRun({ text, size: 22, font: 'Calibri', color: GRIS })],
  });
}

function headerCell(text) {
  return new TableCell({
    shading: { type: ShadingType.CLEAR, fill: FONDO_HEADER },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text, bold: true, size: 20, font: 'Calibri', color: BLANCO })],
    })],
  });
}

function dataCell(text, opts = {}) {
  return new TableCell({
    shading: opts.shading ? { type: ShadingType.CLEAR, fill: FONDO_ALT } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      spacing: { before: 40, after: 40 },
      children: [new TextRun({
        text: String(text),
        size: 20,
        font: 'Calibri',
        color: GRIS,
        bold: opts.bold || false,
      })],
    })],
  });
}

function makeTable(headers, rows) {
  const borderStyle = { style: BorderStyle.SINGLE, size: 1, color: 'D0D5DD' };
  const borders = { top: borderStyle, bottom: borderStyle, left: borderStyle, right: borderStyle };

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.AUTOFIT,
    rows: [
      new TableRow({ children: headers.map(h => headerCell(h)), tableHeader: true }),
      ...rows.map((row, idx) =>
        new TableRow({
          children: row.map(cell => dataCell(cell, { shading: idx % 2 === 1 })),
        })
      ),
    ],
    borders,
  });
}

// ── Sections ─────────────────────────────────────

function portada() {
  return [
    ...Array(8).fill(null).map(() => new Paragraph({ text: '' })),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: '🚌 PREMIUMBUS', size: 72, bold: true, font: 'Calibri', color: AZUL })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200 },
      children: [new TextRun({ text: 'PROGRAMA DE CAPACITACIÓN A USUARIOS', size: 40, bold: true, font: 'Calibri', color: AZUL2 })],
    }),
    new Paragraph({ text: '' }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: '━'.repeat(40), size: 24, font: 'Calibri', color: AZUL2 })],
    }),
    new Paragraph({ text: '' }),
    ...['Sistema de Gestión de Compra de Boletos de Transporte',
      'San Luis Potosí, México', '',
      'Versión: 1.0', 'Fecha: Mayo 2026', 'Estado: Documento de Capacitación',
    ].map(t => new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: t, size: 24, font: 'Calibri', color: GRIS })],
    })),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

function seccionObjetivo() {
  return [
    heading('1. Objetivo del Programa'),
    paragraph('El presente programa tiene como objetivo capacitar a los usuarios finales del sistema PremiumBus para que puedan utilizar de manera autónoma, eficiente y segura todas las funcionalidades de la aplicación móvil de gestión de compra de boletos de transporte en San Luis Potosí.'),
    heading('1.1 Objetivos Específicos', HeadingLevel.HEADING_2),
    ...[
      'Familiarizar al usuario con la interfaz y navegación del sistema.',
      'Enseñar el proceso completo de registro, autenticación e inicio de sesión.',
      'Capacitar en la consulta de rutas, horarios y visualización de mapas.',
      'Instruir en el proceso de compra de boletos y generación de comprobantes QR.',
      'Formar al personal administrativo en el uso del panel de administración.',
      'Garantizar que los usuarios comprendan las medidas de seguridad del sistema.',
    ].map(bulletItem),
  ];
}

function seccionAlcance() {
  return [
    heading('2. Alcance'),
    paragraph('Este programa de capacitación está dirigido a dos perfiles de usuario:'),
    makeTable(['Perfil', 'Descripción', 'Módulos'], [
      ['Usuario General', 'Pasajeros que utilizarán la app para consultar y comprar boletos', 'Módulos 1-5'],
      ['Administrador', 'Personal encargado de gestionar el sistema', 'Módulos 1-6'],
    ]),
    new Paragraph({ text: '' }),
  ];
}

function seccionCronograma() {
  return [
    heading('3. Cronograma de Capacitación'),
    paragraph('La capacitación se divide en 3 días con sesiones teórico-prácticas:'),
    makeTable(['Día', 'Módulo', 'Tema', 'Duración', 'Modalidad'], [
      ['Día 1', 'Módulo 1', 'Introducción y Registro', '2 horas', 'Presencial'],
      ['Día 1', 'Módulo 2', 'Navegación e Interfaz', '1.5 horas', 'Presencial'],
      ['Día 2', 'Módulo 3', 'Consulta de Rutas y Mapas', '2 horas', 'Presencial'],
      ['Día 2', 'Módulo 4', 'Compra de Boletos', '2 horas', 'Presencial'],
      ['Día 3', 'Módulo 5', 'Perfil, Historial y QR', '1.5 horas', 'Presencial'],
      ['Día 3', 'Módulo 6', 'Panel de Administración', '2 horas', 'Presencial'],
      ['Día 3', '—', 'Evaluación Final', '1 hora', 'Presencial'],
    ]),
    new Paragraph({ text: '' }),
    new Paragraph({
      children: [new TextRun({ text: 'Duración total estimada: 12 horas (3 días)', bold: true, size: 22, font: 'Calibri', color: AZUL })],
    }),
  ];
}

function moduloPracticaGuiada(titulo, duracion, objetivo, contenidoTeorico, pasos) {
  return [
    heading(titulo, HeadingLevel.HEADING_2),
    new Paragraph({
      spacing: { after: 100 },
      children: [new TextRun({ text: `Duración estimada: ${duracion}`, bold: true, size: 22, font: 'Calibri', color: AZUL })],
    }),
    heading('Objetivo:', HeadingLevel.HEADING_3),
    paragraph(objetivo),
    heading('Contenido teórico:', HeadingLevel.HEADING_3),
    ...contenidoTeorico.map(bulletItem),
    heading('Práctica guiada:', HeadingLevel.HEADING_3),
    makeTable(['Paso', 'Acción', 'Resultado Esperado'], pasos),
    new Paragraph({ text: '' }),
  ];
}

function seccionModulos() {
  return [
    heading('4. Contenido de los Módulos (Etapas de Capacitación)'),
    paragraph('El programa está estructurado en etapas o módulos específicos para facilitar el aprendizaje progresivo. Al final de la capacitación se detallan las horas invertidas.'),

    // Módulo 1
    ...moduloPracticaGuiada(
      'Módulo 1: Introducción y Registro de Usuario',
      '2 horas',
      'El usuario aprenderá a instalar la aplicación y crear su cuenta.',
      [
        '¿Qué es PremiumBus? Presentación del sistema y sus beneficios.',
        'Requisitos del dispositivo: Android 4.0+ con conexión a internet.',
        'Instalación de la PWA desde el navegador (banner de instalación).',
        'Descripción de los datos requeridos: nombre, correo y contraseña.',
      ],
      [
        ['1', 'Abrir el navegador y acceder a la URL del sistema', 'Se muestra la pantalla de Login'],
        ['2', "Tocar 'Instalar' en el banner PWA", 'La app se instala en el dispositivo'],
        ['3', "Tocar '¿No tienes cuenta? Regístrate'", 'Se muestra el formulario de registro'],
        ['4', 'Llenar nombre, correo y contraseña', 'Los campos se validan en tiempo real'],
        ['5', "Tocar 'Crear Cuenta'", 'Se confirma el registro y redirige al inicio'],
      ]
    ),

    heading('Ejercicio individual:', HeadingLevel.HEADING_3),
    paragraph('Cada participante creará su propia cuenta y verificará que puede iniciar sesión exitosamente.'),

    // Módulo 2
    ...moduloPracticaGuiada(
      'Módulo 2: Navegación e Interfaz',
      '1.5 horas',
      'El usuario conocerá la estructura de navegación y las pantallas principales.',
      [
        'Estructura de la aplicación: barra de navegación inferior con iconos.',
        'Pantallas principales: Inicio, Viajes, Compra, Perfil.',
        'Iconografía y significado de cada sección.',
        'Funcionamiento offline: qué funciona sin internet y qué no.',
      ],
      [
        ['1', 'Identificar los iconos del menú inferior', 'El usuario reconoce cada sección'],
        ['2', "Navegar a 'Viajes'", 'Se muestra el listado de rutas'],
        ['3', "Navegar a 'Compra'", 'Se muestra el formulario de compra'],
        ['4', "Navegar a 'Perfil'", 'Se muestran los datos del usuario'],
        ['5', 'Volver a Inicio', 'Se muestra el dashboard principal'],
      ]
    ),

    heading('Pantallas del sistema:', HeadingLevel.HEADING_3),
    makeTable(['Pantalla', 'Icono', 'Función Principal'], [
      ['Inicio (Home)', '🏠', 'Dashboard con accesos rápidos y resumen de viajes'],
      ['Viajes', '🗺️', 'Consulta de rutas disponibles con mapa interactivo'],
      ['Compra', '🎫', 'Selección de viaje, asiento y proceso de compra'],
      ['Perfil', '👤', 'Datos del usuario, historial y boletos con QR'],
      ['Admin', '⚙️', 'Panel exclusivo para administradores'],
    ]),
    new Paragraph({ text: '' }),

    // Módulo 3
    ...moduloPracticaGuiada(
      'Módulo 3: Consulta de Rutas y Mapas',
      '2 horas',
      'El usuario aprenderá a buscar rutas, consultar horarios y visualizar el recorrido en el mapa.',
      [
        'Listado de rutas: nombre, origen, destino, hora de salida y precio.',
        'Filtrado de rutas por nombre o destino.',
        'Mapa interactivo: marcadores de origen, destino y paradas intermedias.',
        'Información de paradas: nombre y tiempo estimado de llegada.',
        '30 rutas de transporte urbano de San Luis Potosí disponibles.',
      ],
      [
        ['1', "Navegar a la sección 'Viajes'", 'Se muestra el listado de rutas'],
        ['2', "Buscar 'Tangamanga' en el filtro", 'Se filtran rutas que pasan por Tangamanga'],
        ['3', 'Tocar una ruta para ver detalles', 'Se muestra el mapa con el recorrido'],
        ['4', 'Interactuar con el mapa (zoom, paneo)', 'El mapa responde a gestos táctiles'],
        ['5', 'Revisar paradas intermedias', 'Se ven los marcadores y tiempos'],
      ]
    ),

    // Módulo 4
    ...moduloPracticaGuiada(
      'Módulo 4: Compra de Boletos',
      '2 horas',
      'El usuario aprenderá el proceso completo de compra de un boleto de transporte.',
      [
        'Selección de ruta y fecha de viaje.',
        'Mapa de asientos: asientos disponibles (azul) vs ocupados (gris).',
        'Confirmación de compra y generación de comprobante.',
        'Restricción: no se pueden comprar boletos si ya se tiene un viaje activo.',
        'Compra offline: el sistema guarda la compra y la sincroniza al reconectar.',
      ],
      [
        ['1', "Navegar a 'Compra' desde el menú", 'Se muestra el formulario de compra'],
        ['2', 'Seleccionar una ruta del listado', 'Se cargan los datos de la ruta'],
        ['3', 'Seleccionar un asiento disponible (azul)', 'El asiento se marca como seleccionado'],
        ['4', 'Revisar el resumen de compra', 'Se muestra ruta, asiento y precio'],
        ['5', 'Confirmar la compra', 'Se genera el boleto y aparece el comprobante'],
      ]
    ),

    // Módulo 5
    ...moduloPracticaGuiada(
      'Módulo 5: Perfil, Historial y Código QR',
      '1.5 horas',
      'El usuario aprenderá a gestionar su perfil, consultar el historial y usar sus boletos QR.',
      [
        'Edición del nombre de usuario desde el perfil.',
        "Sección 'Viaje Activo': visualización del boleto actual con seguimiento GPS.",
        "Sección 'Historial': archivo de viajes completados.",
        'Código QR del boleto: contiene datos del viaje para verificación.',
        "Función 'En Vivo': seguimiento GPS simulado del recorrido activo.",
      ],
      [
        ['1', "Navegar a 'Perfil'", 'Se muestra el perfil con datos del usuario'],
        ['2', 'Editar el nombre y guardar', 'El nombre se actualiza correctamente'],
        ['3', 'Verificar el viaje activo', 'Se muestra el boleto comprado con QR'],
        ['4', "Tocar 'Ver QR' en el boleto", 'Se despliega el código QR del viaje'],
        ['5', "Tocar 'En Vivo'", 'Se abre el mapa con seguimiento GPS simulado'],
      ]
    ),

    // Módulo 6
    ...moduloPracticaGuiada(
      'Módulo 6: Panel de Administración',
      '2 horas',
      'El administrador aprenderá a gestionar usuarios y supervisar las operaciones del sistema.',
      [
        'Acceso al panel mediante las cuentas exclusivas de administrador.',
        'Listado de usuarios registrados y sus roles.',
        'Supervisión de compras realizadas.',
        'Gestión de rutas y disponibilidad.',
      ],
      [
        ['1', "Iniciar sesión con cuenta admin", 'Se habilita la opción Admin en el menú'],
        ['2', "Acceder al panel de administración", 'Se muestra el dashboard administrativo'],
        ['3', 'Consultar listado de usuarios', 'Se ven usuarios con sus roles'],
        ['4', 'Revisar compras registradas', 'Se muestran las transacciones'],
      ]
    ),

    new Paragraph({ text: '' }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200 },
      children: [new TextRun({ text: 'TOTAL DE HORAS DE CAPACITACIÓN: 11 Horas (más 1 hora de evaluación, Total: 12 Horas)', bold: true, size: 24, font: 'Calibri', color: AZUL2 })],
    }),
  ];
}

function seccionInstalacion() {
  return [
    new Paragraph({ children: [new PageBreak()] }),
    heading('5. Instalacion del Sistema, Base de Datos y Dispositivos'),
    paragraph('Esta seccion describe el proceso completo de instalacion del sistema PremiumBus en el entorno del cliente, abarcando desde la configuración del servidor, la base de datos y la instalacion en cada tipo de dispositivo (Android, iOS y PC).'),

    heading('5.1 Requisitos Previos del Servidor', HeadingLevel.HEADING_2),
    ...[
      'XAMPP instalado en el equipo servidor (incluye Apache y MySQL).',
      'Sistema operativo Windows 7, 8, 10 u 11.',
      '50 MB de espacio libre en disco.',
      'Permisos de administrador en el equipo.',
      'Conexion a la red local (para acceso desde dispositivos moviles).',
    ].map(bulletItem),

    heading('5.2 Contenido de la Memoria USB', HeadingLevel.HEADING_2),
    paragraph('La memoria USB entregada al cliente contiene los siguientes archivos:'),
    makeTable(['Archivo', 'Descripcion'], [
      ['Instalador_PremiumBus.hta', 'Asistente de instalacion ejecutable (doble clic para abrir)'],
      ['Programa_Capacitacion_PremiumBus.docx', 'Este documento de capacitacion'],
      ['src/', 'Codigo fuente de la aplicacion web (frontend)'],
      ['api/', 'Codigo del servidor API (backend PHP)'],
      ['setup_db.php', 'Script de configuracion automatica de la base de datos'],
      ['index.html', 'Punto de entrada de la aplicacion'],
    ]),
    new Paragraph({ text: '' }),

    heading('5.3 Proceso de Instalacion con el Asistente', HeadingLevel.HEADING_2),
    paragraph('El instalador (Instalador_PremiumBus.hta) es una aplicacion Windows que guia al usuario por 4 pasos (Bienvenida, Configuración, Instalación, y Finalización). Este asistente copiará los archivos a XAMPP y preparará todo automáticamente.'),

    heading('5.4 Funcionamiento y Configuración de la Base de Datos', HeadingLevel.HEADING_2),
    paragraph('El sistema PremiumBus utiliza una base de datos relacional MySQL alojada en el servidor local (XAMPP). Esta base de datos es el núcleo del sistema, encargada de almacenar de forma persistente y segura las rutas, usuarios, boletos adquiridos y las transacciones.'),
    paragraph('Despues de la instalacion con el asistente, es necesario ejecutar la configuracion inicial de la base de datos:'),
    makeTable(['Paso', 'Accion', 'Resultado'], [
      ['1', 'Abrir http://localhost/PremiumBus/setup_db.php', 'Se muestra el formulario de configuracion de BD'],
      ['2', 'Ingresar credenciales de MySQL', 'Host, usuario y contrasena'],
      ['3', 'Clic en "Configurar Base de Datos"', 'Se crean las tablas y se insertan los datos iniciales'],
      ['4', 'Verificar mensaje de exito', 'Se generan las rutas y se crean las 10 cuentas de administrador'],
    ]),
    new Paragraph({ text: '' }),

    heading('5.5 Respaldo y Restauración de la Base de Datos (Backup)', HeadingLevel.HEADING_2),
    paragraph('Para prevenir la pérdida de datos y evitar que el cliente tenga que volver a capturar la información si comete un error grave, se recomienda realizar respaldos periódicos mediante phpMyAdmin.'),
    heading('Pasos para realizar un respaldo (Exportar):', HeadingLevel.HEADING_3),
    ...[
      '1. Abrir el navegador e ingresar a http://localhost/phpmyadmin',
      '2. Seleccionar la base de datos "premiumbus" en el panel izquierdo.',
      '3. Hacer clic en la pestaña superior "Exportar".',
      '4. Elegir el método "Rápido" y formato "SQL". Hacer clic en "Exportar" y guardar el archivo .sql en un lugar seguro.',
    ].map(bulletItem),
    heading('Pasos para restaurar la base de datos (Importar):', HeadingLevel.HEADING_3),
    ...[
      '1. Abrir phpMyAdmin y seleccionar la base de datos "premiumbus".',
      '2. (Opcional) Eliminar las tablas actuales si se desea una restauración limpia.',
      '3. Hacer clic en la pestaña "Importar".',
      '4. Seleccionar el archivo de respaldo (.sql) guardado previamente.',
      '5. Hacer clic en "Importar" al final de la página. El sistema recuperará su estado anterior.',
    ].map(bulletItem),

    heading('5.6 Instalacion de la Aplicación en Dispositivos (Android, iOS y PC)', HeadingLevel.HEADING_2),
    paragraph('La plataforma funciona como una Aplicación Web Progresiva (PWA), lo que permite su instalación en diversos dispositivos sin depender de las tiendas de aplicaciones.'),
    
    heading('A) Instalación en Android', HeadingLevel.HEADING_3),
    ...[
      '1. Conectarse a la red WiFi local del servidor.',
      '2. Abrir el navegador Google Chrome.',
      '3. Ingresar la dirección IP del servidor (ej: http://192.168.1.100/PremiumBus/).',
      '4. Tocar "Instalar" en el banner inferior que aparece, o ir al menú de Chrome (tres puntos) y seleccionar "Añadir a la pantalla de inicio".',
    ].map(bulletItem),

    heading('B) Instalación en iOS (iPhone/iPad)', HeadingLevel.HEADING_3),
    ...[
      '1. Conectarse a la red WiFi local del servidor.',
      '2. Abrir el navegador Safari.',
      '3. Ingresar la dirección IP del servidor.',
      '4. Tocar el icono de "Compartir" (el cuadro con una flecha hacia arriba) en la barra inferior.',
      '5. Seleccionar la opción "Agregar a inicio" (Add to Home Screen) y confirmar.',
    ].map(bulletItem),

    heading('C) Instalación en PC (Windows/Mac)', HeadingLevel.HEADING_3),
    ...[
      '1. Abrir Google Chrome o Microsoft Edge en cualquier computadora de la red.',
      '2. Ingresar la dirección IP del servidor o "localhost" si es la misma máquina.',
      '3. Hacer clic en el icono de instalación (una pantalla con una flecha) que aparece a la derecha de la barra de direcciones.',
      '4. Confirmar la instalación. La aplicación se abrirá en su propia ventana y creará un acceso directo.',
    ].map(bulletItem),

    heading('5.7 Cuentas de Administrador Exclusivas', HeadingLevel.HEADING_2),
    paragraph('El sistema genera automáticamente 10 cuentas exclusivas para uso administrativo, permitiendo que múltiples gestores administren PremiumBus. Todas las contraseñas iniciales son "admin123" y deben ser cambiadas en el primer inicio de sesión:'),
    makeTable(['Cuenta #', 'Correo de Administrador', 'Rol'], [
      ['Admin 1', 'admin1@premiumbus.com', 'Administrador Global'],
      ['Admin 2', 'admin2@premiumbus.com', 'Administrador Global'],
      ['Admin 3', 'admin3@premiumbus.com', 'Administrador Global'],
      ['Admin 4', 'admin4@premiumbus.com', 'Administrador Global'],
      ['Admin 5', 'admin5@premiumbus.com', 'Administrador Global'],
      ['Admin 6', 'admin6@premiumbus.com', 'Administrador Global'],
      ['Admin 7', 'admin7@premiumbus.com', 'Administrador Global'],
      ['Admin 8', 'admin8@premiumbus.com', 'Administrador Global'],
      ['Admin 9', 'admin9@premiumbus.com', 'Administrador Global'],
      ['Admin 10', 'admin10@premiumbus.com', 'Administrador Global'],
    ]),
    new Paragraph({ text: '' }),
    new Paragraph({
      children: [new TextRun({ text: '⚠️ IMPORTANTE: Cambiar las contraseñas de las cuentas de administrador después de la primera sesión para asegurar el sistema.', bold: true, size: 22, font: 'Calibri', color: 'EF4444' })],
    }),
  ];
}

function seccionEvaluacion() {
  return [
    heading('6. Evaluacion de la Capacitacion'),
    paragraph('Al finalizar el programa, se aplicará una evaluación práctica para verificar que los usuarios dominan las funcionalidades del sistema.'),
    heading('6.1 Evaluacion Practica', HeadingLevel.HEADING_2),
    paragraph('Cada participante deberá completar las siguientes tareas sin asistencia:'),
    makeTable(['#', 'Tarea', 'Criterio de Éxito', 'Puntos'], [
      ['1', 'Registrarse en el sistema', 'Cuenta creada exitosamente', '15'],
      ['2', 'Iniciar sesión con sus credenciales', 'Acceso concedido al Home', '10'],
      ['3', 'Buscar una ruta específica', 'La ruta se muestra en el listado', '15'],
      ['4', 'Visualizar el recorrido en el mapa', 'Mapa con marcadores visible', '10'],
      ['5', 'Comprar un boleto seleccionando asiento', 'Comprobante generado', '20'],
      ['6', 'Consultar el boleto QR en su perfil', 'QR visible y legible', '15'],
      ['7', 'Navegar entre todas las secciones', 'Todas las pantallas accesibles', '15'],
    ]),
    new Paragraph({ text: '' }),
    heading('6.2 Escala de Evaluacion', HeadingLevel.HEADING_2),
    makeTable(['Rango', 'Calificación', 'Resultado'], [
      ['90-100', 'Excelente', 'Aprobado — Usuario autónomo'],
      ['70-89', 'Bueno', 'Aprobado — Requiere práctica adicional'],
      ['50-69', 'Regular', 'Requiere refuerzo en módulos específicos'],
      ['0-49', 'Insuficiente', 'Requiere repetir la capacitación'],
    ]),
    new Paragraph({ text: '' }),
  ];
}

function seccionRequisitos() {
  return [
    heading('7. Requisitos Tecnicos'),
    heading('7.1 Para los Participantes', HeadingLevel.HEADING_2),
    ...[
      'Dispositivo móvil con Android 4.0 o superior.',
      'Conexión a internet WiFi (se proporcionará durante la capacitación).',
      'Navegador web actualizado (Chrome recomendado).',
    ].map(bulletItem),
    heading('7.2 Para el Instructor', HeadingLevel.HEADING_2),
    ...[
      'Computadora con proyector para demostración.',
      'Servidor con XAMPP/WAMP configurado y base de datos cargada.',
      'Acceso a la red local donde está desplegado el sistema.',
      'Copias impresas de la guía rápida de referencia.',
    ].map(bulletItem),
  ];
}

function seccionSoporte() {
  return [
    heading('8. Soporte Post-Capacitacion'),
    paragraph('Después de la capacitación, los usuarios contarán con los siguientes recursos de apoyo:'),
    makeTable(['Recurso', 'Descripción', 'Disponibilidad'], [
      ['Guía Rápida', 'Documento PDF con pasos resumidos', 'USB entregado'],
      ['Soporte Técnico', 'Contacto con el equipo de desarrollo', 'Lunes a Viernes 9-18h'],
      ['FAQ', 'Preguntas frecuentes integradas en la app', '24/7 dentro de la app'],
      ['Reinstalación', 'Ejecutable en USB para reinstalar el sistema', 'USB entregado'],
    ]),
    new Paragraph({ text: '' }),
  ];
}

function seccionGuiaRapida() {
  const guia = [
    ['Registro', "Abrir app → Tocar 'Regístrate' → Llenar datos → 'Crear Cuenta'"],
    ['Iniciar Sesión', "Abrir app → Ingresar correo y contraseña → 'Iniciar Sesión'"],
    ['Consultar Rutas', "Menú inferior → 'Viajes' → Buscar/seleccionar ruta → Ver mapa"],
    ['Comprar Boleto', "Menú inferior → 'Compra' → Seleccionar ruta → Elegir asiento → Confirmar"],
    ['Ver Boleto QR', "Menú inferior → 'Perfil' → Viaje Activo → 'Ver QR'"],
    ['Seguimiento En Vivo', "Perfil → Viaje Activo → 'En Vivo' → Ver mapa GPS"],
  ];
  return [
    heading('9. Guia Rapida de Referencia'),
    paragraph('Resumen de las acciones más frecuentes para consulta rápida:'),
    ...guia.flatMap(([titulo, desc]) => [
      heading(titulo + ':', HeadingLevel.HEADING_3),
      paragraph(desc),
    ]),
  ];
}

function seccionFirmas() {
  return [
    new Paragraph({ children: [new PageBreak()] }),
    heading('10. Firmas de Conformidad'),
    paragraph('Con la firma de este documento, los abajo firmantes confirman haber recibido la capacitación completa del sistema PremiumBus.'),
    new Paragraph({ text: '' }),
    makeTable(['Nombre del Participante', 'Firma', 'Fecha'], [
      ['', '', ''],
      ['', '', ''],
      ['', '', ''],
      ['', '', ''],
      ['', '', ''],
    ]),
    new Paragraph({ text: '' }),
    new Paragraph({ text: '' }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: '_'.repeat(40), size: 22, font: 'Calibri' })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'Nombre y Firma del Instructor', bold: true, size: 22, font: 'Calibri', color: AZUL })],
    }),
    new Paragraph({ text: '' }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: '_'.repeat(40), size: 22, font: 'Calibri' })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'Fecha de Capacitación', bold: true, size: 22, font: 'Calibri', color: AZUL })],
    }),
  ];
}

// ── Main ─────────────────────────────────────────
async function main() {
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: 'Calibri', size: 22, color: GRIS },
        },
        heading1: {
          run: { font: 'Calibri', size: 36, bold: true, color: AZUL },
          paragraph: { spacing: { before: 280, after: 120 } },
        },
        heading2: {
          run: { font: 'Calibri', size: 28, bold: true, color: AZUL2 },
          paragraph: { spacing: { before: 200, after: 100 } },
        },
        heading3: {
          run: { font: 'Calibri', size: 24, bold: true, color: GRIS },
          paragraph: { spacing: { before: 160, after: 80 } },
        },
      },
    },
    sections: [{
      properties: {
        page: {
          margin: {
            top: convertInchesToTwip(1),
            bottom: convertInchesToTwip(1),
            left: convertInchesToTwip(1),
            right: convertInchesToTwip(1),
          },
        },
      },
      children: [
        ...portada(),
        ...seccionObjetivo(),
        ...seccionAlcance(),
        ...seccionCronograma(),
        ...seccionModulos(),
        ...seccionInstalacion(),
        ...seccionEvaluacion(),
        ...seccionRequisitos(),
        ...seccionSoporte(),
        ...seccionGuiaRapida(),
        ...seccionFirmas(),
      ],
    }],
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(OUTPUT, buffer);
  console.log('✅ Documento generado: ' + OUTPUT);
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
