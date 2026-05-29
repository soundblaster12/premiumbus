import os
from docx import Document
from docx.shared import Pt, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

def create_element(name):
    return OxmlElement(name)

def create_attribute(element, name, value):
    element.set(qn(name), value)

def add_page_number(run):
    fldChar1 = create_element('w:fldChar')
    create_attribute(fldChar1, 'w:fldCharType', 'begin')

    instrText = create_element('w:instrText')
    create_attribute(instrText, 'xml:space', 'preserve')
    instrText.text = "PAGE"

    fldChar2 = create_element('w:fldChar')
    create_attribute(fldChar2, 'w:fldCharType', 'separate')

    fldChar3 = create_element('w:fldChar')
    create_attribute(fldChar3, 'w:fldCharType', 'end')

    run._r.append(fldChar1)
    run._r.append(instrText)
    run._r.append(fldChar2)
    run._r.append(fldChar3)

def add_toc(document, title="Índice General"):
    document.add_heading(title, level=1)
    paragraph = document.add_paragraph()
    run = paragraph.add_run()
    fldChar = OxmlElement('w:fldChar')
    fldChar.set(qn('w:fldCharType'), 'begin')
    instrText = OxmlElement('w:instrText')
    instrText.set(qn('xml:space'), 'preserve')
    instrText.text = 'TOC \\o "1-3" \\h \\z \\u'
    fldChar2 = OxmlElement('w:fldChar')
    fldChar2.set(qn('w:fldCharType'), 'separate')
    fldChar3 = OxmlElement('w:fldChar')
    fldChar3.set(qn('w:fldCharType'), 'end')
    run._r.append(fldChar)
    run._r.append(instrText)
    run._r.append(fldChar2)
    run._r.append(fldChar3)
    document.add_page_break()

doc = Document()

# Configuración de márgenes
sections = doc.sections
for section in sections:
    section.top_margin = Cm(2.5)
    section.bottom_margin = Cm(2.5)
    section.left_margin = Cm(3.0)
    section.right_margin = Cm(2.5)
    # Paginación
    footer = section.footer
    footer_para = footer.paragraphs[0]
    footer_para.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    add_page_number(footer_para.add_run())

# Configuración del estilo Normal
style = doc.styles['Normal']
font = style.font
font.name = 'Arial'
font.size = Pt(12)
p_format = style.paragraph_format
p_format.line_spacing = 1.5
p_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
p_format.first_line_indent = Cm(1.25)

# Título Principal
title = doc.add_heading('Documentación del Sistema PremiumBus', 0)
title.alignment = WD_ALIGN_PARAGRAPH.CENTER

doc.add_paragraph('Elaborado por: Equipo de Desarrollo')
doc.add_paragraph('Fecha: Mayo 2026')
doc.add_page_break()

# Índices
add_toc(doc, "Índice General")
add_toc(doc, "Índice de Tablas")
add_toc(doc, "Índice de Figuras")

# Secciones iniciales
doc.add_heading('Planteamiento del Problema', level=1)
doc.add_paragraph('En la actualidad, la gestión de compra de boletos para el transporte de pasajeros presenta ineficiencias significativas cuando se realiza mediante métodos tradicionales. Las filas prolongadas, la falta de disponibilidad de información en tiempo real sobre rutas y la incapacidad de seleccionar asientos de manera remota generan insatisfacción entre los usuarios. Además, las empresas de transporte carecen de herramientas digitales que les permitan administrar eficientemente la demanda, supervisar las operaciones diarias y optimizar la venta de pasajes. PremiumBus surge como una respuesta directa a esta problemática, proponiendo una plataforma digitalizada y móvil que centraliza y automatiza estos procesos, mitigando errores humanos y mejorando la calidad del servicio ofrecido a los pasajeros.')

doc.add_heading('Justificación', level=1)
doc.add_paragraph('El desarrollo de PremiumBus se justifica por la imperante necesidad de modernización en el sector del transporte terrestre. La implementación de este sistema móvil basado en MIT App Inventor y soportado por una base de datos MySQL, facilita la interacción directa entre los usuarios y los servicios de la empresa. Al automatizar la reserva y compra de boletos, se reducen significativamente los tiempos de espera y se incrementa la transparencia operativa. Asimismo, el uso de tecnologías actuales, como las APIs de geolocalización, añade un valor diferencial al permitir visualizar las rutas en mapas interactivos, brindando mayor seguridad y confianza al cliente final durante su viaje.')

doc.add_heading('Objetivo General', level=1)
doc.add_paragraph('Desarrollar e implementar un sistema de gestión y venta de boletos de transporte mediante una aplicación móvil, denominada PremiumBus, que integre servicios web, bases de datos relacionales y herramientas de geolocalización para optimizar la experiencia del usuario y la administración operativa.')

doc.add_heading('Objetivos Específicos', level=2)
doc.add_paragraph('1. Definir los requerimientos de software necesarios para la aplicación y la infraestructura del servidor.')
doc.add_paragraph('2. Diseñar la arquitectura del sistema, incluyendo la estructura de datos, las interfaces de usuario y los diagramas de procesos.')
doc.add_paragraph('3. Construir la aplicación empleando herramientas de desarrollo visual y lenguajes de programación adecuados.')
doc.add_paragraph('4. Ejecutar un plan de pruebas exhaustivo para asegurar el rendimiento, la seguridad y la correcta funcionalidad de todos los módulos.')
doc.add_paragraph('5. Desplegar el sistema en un entorno de producción, capacitando a los usuarios finales y administradores.')

# Unidad 1: Análisis
doc.add_heading('1. ANÁLISIS', level=1)

doc.add_heading('1.1 Definición de Equipos de Trabajo y Proyecto', level=2)
doc.add_paragraph('Para el desarrollo de PremiumBus, se estableció un equipo multidisciplinario compuesto por analistas de sistemas, desarrolladores frontend, especialistas en bases de datos y personal encargado del aseguramiento de la calidad. El proyecto fue concebido bajo metodologías ágiles, permitiendo entregas incrementales. Se definieron los roles específicos, asegurando que cada integrante tuviera responsabilidades claras y métricas de desempeño asociadas a los objetivos del negocio.')

doc.add_heading('1.2 Definiciones de Ingeniería de Software', level=2)
doc.add_paragraph('El marco metodológico adoptado se rige por las mejores prácticas de la ingeniería de software, contemplando el ciclo de vida completo del desarrollo. Esto implica la aplicación de estándares rigurosos para la captura de requerimientos, diseño arquitectónico, codificación y pruebas, garantizando un producto final robusto, escalable y mantenible.')

doc.add_heading('1.3 Entrevistas y Recolección de Datos', level=2)
doc.add_paragraph('Se llevaron a cabo diversas sesiones de entrevistas con stakeholders clave, incluyendo administradores de terminales y usuarios frecuentes de autobuses. Estas interacciones proporcionaron información valiosa respecto a los puntos de dolor actuales en la compra de boletos, lo cual permitió refinar los requisitos funcionales y establecer prioridades en el backlog del proyecto.')

doc.add_heading('1.4 Factibilidad del Sistema', level=2)
doc.add_paragraph('El estudio de factibilidad concluyó que PremiumBus es técnica, operativa y económicamente viable. Técnicamente, las herramientas seleccionadas (MySQL, MIT App Inventor, APIs REST) son suficientes para cumplir los objetivos. Operativamente, el sistema se alinea con los procesos de negocio de las empresas de transporte. Desde la perspectiva económica, los costos de desarrollo e infraestructura son superados por el retorno de inversión proyectado derivado del incremento en las ventas en línea.')

doc.add_heading('1.5 Presentación de Requisitos y Carta Compromiso', level=2)
doc.add_paragraph('Todos los hallazgos se documentaron en el SRS (Software Requirements Specification), el cual fue presentado formalmente a la dirección. Posteriormente, se redactó y firmó una carta compromiso que establece el alcance del proyecto, los tiempos de entrega y los criterios de aceptación acordados entre el equipo de desarrollo y los clientes.')

doc.add_heading('1.6 Herramientas de Ingeniería de Requerimientos', level=2)
doc.add_paragraph('Se utilizaron plataformas colaborativas para la gestión de requerimientos y el trazado de historias de usuario. Estas herramientas facilitaron la priorización de características y garantizaron que cualquier cambio en las especificaciones fuera comunicado y aprobado por las partes involucradas.')

doc.add_heading('1.7 Contrato y Firma', level=2)
doc.add_paragraph('El proceso de análisis concluyó con la redacción del contrato definitivo de desarrollo de software, especificando licencias, propiedad intelectual, soporte técnico posterior a la implementación y políticas de confidencialidad. Este documento fue revisado y firmado por ambas partes, dando luz verde oficial al inicio del diseño.')


# Unidad 2: Diseño
doc.add_heading('2. DISEÑO', level=1)

doc.add_heading('2.1 Diseño de Procesos Propuestos y Herramientas CASE', level=2)
doc.add_paragraph('Durante esta etapa, se modelaron los flujos de trabajo del sistema PremiumBus utilizando herramientas CASE de vanguardia. Se estructuraron los procesos lógicos que determinan cómo los usuarios interactúan con la plataforma, desde el inicio de sesión hasta la confirmación de la reserva. Esto aseguró que el comportamiento del software fuera predecible y optimizado para minimizar los clics y el tiempo de respuesta.')

doc.add_heading('2.2 Diseño Arquitectónico', level=2)
doc.add_paragraph('La arquitectura del sistema se basó en un modelo cliente-servidor, separando claramente la capa de presentación (aplicación móvil) de la capa lógica y de persistencia de datos (API REST y base de datos MySQL). Esta arquitectura modularizada permite una mayor escalabilidad, garantizando que el incremento de usuarios concurrentes no afecte el rendimiento de la aplicación central.')

doc.add_heading('2.3 Modelo de Datos', level=2)
doc.add_paragraph('El diseño de datos implicó la creación de un modelo entidad-relación altamente normalizado. Se estructuraron tablas esenciales como "usuarios", para gestionar la autenticación; "viajes", para controlar rutas y horarios; y "compras", para registrar las transacciones. Las relaciones entre estas tablas se diseñaron para mantener la integridad referencial y evitar la redundancia de información.')

doc.add_heading('2.4 Diagramas de Secuencia y Actividades', level=2)
doc.add_paragraph('Se elaboraron diagramas de secuencia para ilustrar la comunicación en tiempo real entre la aplicación móvil, la API y la base de datos durante procesos críticos como la validación de credenciales y el procesamiento de pagos. Adicionalmente, los diagramas de actividades ayudaron a visualizar los caminos alternativos y las excepciones, tales como el intento de compra de un asiento previamente reservado.')

doc.add_heading('2.5 Diseño de Interfaz de Usuario (UI)', level=2)
doc.add_paragraph('La interfaz de usuario fue diseñada siguiendo los principios de atomicidad y resiliencia visual. Se definieron esquemas de colores corporativos, tipografías legibles y componentes reutilizables como botones y tarjetas de información. Se prestó especial atención a la experiencia del usuario (UX), asegurando que la navegación fuera intuitiva en dispositivos móviles de diferentes tamaños y resoluciones.')

# Unidad 3: Desarrollo
doc.add_heading('3. DESARROLLO', level=1)

doc.add_heading('3.1 Lenguajes y Selección de Herramientas', level=2)
doc.add_paragraph('La construcción del sistema PremiumBus requirió la selección minuciosa de tecnologías. Para el frontend móvil se utilizó un entorno de desarrollo visual apoyado en componentes programables, mientras que para el backend se implementaron scripts dinámicos encargados de procesar las peticiones HTTP. Esta combinación permitió una rápida iteración de prototipos y un despliegue ágil de nuevas características.')

doc.add_heading('3.2 Manejadores de Bases de Datos', level=2)
doc.add_paragraph('MySQL fue elegido como el sistema gestor de bases de datos debido a su fiabilidad, alto rendimiento en lectura de registros y excelente soporte para transacciones. Se configuraron parámetros de seguridad avanzados, como la restricción de accesos por dirección IP y el uso de usuarios con privilegios mínimos, asegurando que la capa de persistencia estuviera protegida frente a vulnerabilidades comunes.')

doc.add_heading('3.3 Configuración de Entorno y Arquitectura', level=2)
doc.add_paragraph('Se definieron entornos separados para desarrollo, pruebas y producción. Esta segmentación evitó que errores introducidos durante la codificación afectaran a los usuarios finales. Además, se documentaron minuciosamente los requisitos de hardware y software del servidor, estipulando la necesidad de procesadores multinúcleo y suficiente memoria RAM para manejar picos de concurrencia.')

doc.add_heading('3.4 APIs, Comentarios de Código y Algoritmos', level=2)
doc.add_paragraph('Las interfaces de programación de aplicaciones (APIs) se construyeron bajo el estándar RESTful, devolviendo respuestas en formato JSON. Se integró la API de Google Maps para proporcionar servicios de ubicación precisos. En cuanto al código fuente, se exigió una estricta política de documentación interna; los algoritmos de asignación de asientos y cálculo de tarifas fueron comentados exhaustivamente, explicando la lógica matemática y los casos límite contemplados en su diseño.')

# Unidad 4: Pruebas e Implementación
doc.add_heading('4. PRUEBAS E IMPLEMENTACIÓN', level=1)

doc.add_heading('4.1 Diseño y Aplicación de Pruebas', level=2)
doc.add_paragraph('La fase de calidad se dividió en pruebas unitarias, de integración y de sistema. Se diseñaron casos de prueba que cubrieron tanto el flujo normal como los caminos de error. Las pruebas de componentes verificaron la correctitud de funciones aisladas, mientras que las pruebas de sistema simularon el comportamiento de múltiples usuarios concurrentes intentando reservar el mismo boleto, validando el correcto funcionamiento de los bloqueos de base de datos.')

doc.add_heading('4.2 Documentación de Resultados', level=2)
doc.add_paragraph('Todos los hallazgos de la fase de pruebas fueron registrados meticulosamente. Los errores detectados se clasificaron según su severidad y se asignaron al equipo de desarrollo para su pronta corrección. Este seguimiento garantizó que ningún defecto crítico llegara al entorno de producción y proporcionó una métrica objetiva sobre la madurez del software.')

doc.add_heading('4.3 Entrega del Sistema y Capacitación a Usuarios', level=2)
doc.add_paragraph('Una vez estabilizado el sistema, se procedió al despliegue oficial. Simultáneamente, se ejecutó un programa de capacitación dirigido tanto a los administradores del sistema como a operadores de atención al cliente. Se elaboraron materiales de soporte didáctico y se realizaron sesiones prácticas, asegurando que el personal estuviera plenamente capacitado para utilizar la plataforma y brindar asistencia a los pasajeros.')

doc.add_heading('4.4 Instalación y Mantenimiento del Sistema', level=2)
doc.add_paragraph('La guía de implementación proporcionada detalla paso a paso el proceso de despliegue, desde la configuración inicial del servidor hasta la instalación de las dependencias requeridas. Asimismo, se establecieron protocolos de mantenimiento preventivo, que incluyen la actualización periódica de librerías de terceros y la monitorización constante del rendimiento del servidor.')

doc.add_heading('4.5 Recuperación ante Desastres y Copias de Seguridad', level=2)
doc.add_paragraph('Se diseñó un esquema robusto de recuperación ante desastres. Se programaron copias de seguridad incrementales automáticas de la base de datos de forma diaria, y respaldos completos de manera semanal. Estos respaldos se almacenan en servidores geográficamente distribuidos para asegurar que, en caso de fallo catastrófico, el servicio pueda ser restaurado con una pérdida de datos mínima y en un tiempo aceptable.')

doc.add_heading('4.6 Notas de la Versión (Changelog)', level=2)
doc.add_paragraph('Con la liberación de la versión 1.0 de PremiumBus, se generó un documento de registro de cambios (Changelog). Este documento enumera todas las funcionalidades introducidas, los parches de seguridad aplicados y las mejoras de rendimiento realizadas respecto a versiones candidatas anteriores, sirviendo como historial histórico para futuras auditorías.')


# Referencias Bibliográficas
doc.add_heading('19. REFERENCIAS BIBLIOGRÁFICAS', level=1)
doc.add_paragraph('Sommerville, I. (2011). Ingeniería de software (9a. ed.). Pearson Educación.')
doc.add_paragraph('Pressman, R. S. (2010). Ingeniería del software: un enfoque práctico (7a. ed.). McGraw-Hill Interamericana.')
doc.add_paragraph('https://www.mysql.com')
doc.add_paragraph('https://www.python.org')
doc.add_paragraph('https://appinventor.mit.edu/')


# Anexos
doc.add_heading('ANEXOS', level=1)

doc.add_heading('Anexo A. Manual de Usuario', level=2)
doc.add_paragraph('El presente anexo contiene las instrucciones detalladas para el uso de la aplicación móvil PremiumBus. Incluye guías paso a paso para el registro de nuevos usuarios, la recuperación de contraseñas, la exploración de rutas disponibles mediante el mapa interactivo y el proceso completo de adquisición de boletos de transporte electrónico.')

doc.add_heading('Anexo B. Capturas del Sistema', level=2)
doc.add_paragraph('Este apartado expone una galería de imágenes representativas de la interfaz de usuario de PremiumBus. Se incluyen capturas de la pantalla de inicio de sesión, el menú principal de navegación, la vista de selección de asientos y el comprobante digital de compra final.')


doc.save('C:/Users/david/OneDrive/Documentos/PremiumBus/Documentacion_Final_Sistema.docx')
print("Documento generado exitosamente.")
