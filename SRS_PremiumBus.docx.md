

**DOCUMENTO DE ESPECIFICACIÓN DE REQUERIMIENTOS**

**DE SOFTWARE**

(SRS \- Software Requirements Specification)

**SISTEMA: PremiumBus**

Aplicación Móvil para Gestión de Compra de Boletos de Transporte

Versión: 1.0

Fecha: Abril 2026

Estado: Documento de Análisis

# **Tabla de Contenidos**

1\. Introducción ..........................................................................................................3

2\. Descripción General del Sistema..........................................................................5

3\. Requerimientos Específicos .................................................................................7

4\. Interfaces del Sistema.........................................................................................11

5\. Modelo de Datos ................................................................................................12

6\. Casos de Uso ....................................................................................................13

7\. Restricciones Técnicas .......................................................................................15

8\. Criterios de Aceptación .....................................................................................16

9\. Glosario ..........................................................................................................17

# **1\. Introducción**

## **1.1 Propósito**

El presente documento tiene como propósito describir de manera detallada los requerimientos funcionales y no funcionales del sistema PremiumBus, el cual es una aplicación móvil diseñada para la gestión integral de compra de boletos de transporte.

Este documento servirá como base fundamental para:

* El desarrollo e implementación del sistema  
* La evaluación y validación del software  
* La gestión del proyecto  
* La verificación del cumplimiento de requerimientos

## **1.2 Alcance**

El sistema PremiumBus permitirá a los usuarios realizar las siguientes funcionalidades:

* Registrarse en la aplicación  
* Iniciar sesión  
* Consultar información de viajes mediante integración con Google Maps  
* Realizar la compra de boletos  
* Navegar entre distintas interfaces de la aplicación

Asimismo, el sistema contará con un acceso administrativo especial que permitirá la gestión y supervisión del sistema por parte de administradores autorizados.

## **1.3 Definiciones, Acrónimos y Abreviaturas**

| Término | Definición |
| :---- | :---- |
| SRS/ERS | Especificación de Requerimientos de Software |
| UI | Interfaz de Usuario |
| BD | Base de Datos |
| MySQL | Sistema Gestor de Base de Datos Relacional |
| API | Interfaz de Programación de Aplicaciones |

## **1.4 Referencias**

* Documentación oficial de MIT App Inventor  
* Documentación de MySQL 5.7+  
* Documentación de Google Maps API  
* Ingeniería de Software \- Ian Sommerville (10ª Edición)

# **2\. Descripción General del Sistema**

## **2.1 Perspectiva del Producto**

PremiumBus es una aplicación móvil desarrollada en MIT App Inventor que interactúa con una base de datos externa MySQL mediante servicios web (APIs REST). El sistema permite la gestión integral de usuarios y la compra de boletos de transporte, proporcionando una experiencia de usuario amigable e intuitiva.

## **2.2 Funciones Principales del Producto**

El sistema tendrá las siguientes funciones principales:

* Gestión de registro y autenticación de usuarios  
* Consulta de viajes disponibles  
* Visualización de rutas en Google Maps  
* Reserva y compra de boletos  
* Panel administrativo especial  
* Navegación fluida entre pantallas

## **2.3 Características de los Usuarios**

### **Usuario General**

* Puede registrarse con nombre, correo electrónico y contraseña  
* Puede iniciar sesión con sus credenciales  
* Puede consultar viajes disponibles  
* Puede visualizar rutas en el mapa  
* Puede comprar boletos

### **Administrador**

* Cuenta con acceso especial mediante credenciales administrativas  
* Puede gestionar usuarios del sistema  
* Puede supervisar las compras de boletos

## **2.4 Restricciones y Limitaciones**

* El sistema requiere conexión a internet para interactuar con MySQL  
* Se desarrolla exclusivamente en MIT App Inventor  
* Compatible únicamente con dispositivos Android  
* Las funcionalidades de mapas dependen de Google Maps API

## **2.5 Suposiciones y Dependencias**

* El usuario final posee un dispositivo móvil con Android 4.0 o superior  
* Existe un servidor con base de datos MySQL accesible desde internet  
* Se cuenta con conexión a internet estable  
* Google Maps API se encuentra disponible y configurado correctamente

# **3\. Requerimientos Específicos**

## **3.1 Requerimientos Funcionales**

### **RF1: Registro de Usuario**

El sistema debe permitir que usuarios no registrados creen una nueva cuenta proporcionando los siguientes datos:

* Nombre completo  
* Correo electrónico (único en el sistema)  
* Contraseña (con confirmación)

El sistema debe validar que el correo no esté registrado previamente y almacenar los datos de forma segura en la base de datos.

### **RF2: Inicio de Sesión**

El sistema debe permitir que usuarios registrados inicien sesión utilizando:

* Correo electrónico registrado  
* Contraseña correcta

Upon successful authentication, the user should be granted access to the main application features and be redirected to the home screen.

### **RF3: Validación y Autenticación**

El sistema debe verificar todos los datos ingresados contra la base de datos MySQL, incluyendo:

* Validación de formato de correo electrónico  
* Validación de fortaleza de contraseña  
* Verificación de unicidad de correo en registro  
* Confirmación de credenciales en login

### **RF4: Consulta de Viajes**

El sistema debe permitir a usuarios registrados consultar información de viajes disponibles, mostrando:

* Destino del viaje  
* Fecha y hora de salida  
* Precio del boleto  
* Disponibilidad de asientos  
* Ruta integrada en Google Maps

### **RF5: Compra de Boletos**

El sistema debe permitir a usuarios comprar boletos seleccionando:

* Destino  
* Fecha de viaje  
* Número de asiento

La compra debe registrarse en la base de datos y generar un comprobante.

### **RF6: Navegación entre Pantallas**

El sistema debe permitir navegación fluida entre las siguientes pantallas:

* Pantalla de Login  
* Pantalla de Registro  
* Pantalla de Inicio (Home)  
* Pantalla de Consulta de Viajes  
* Pantalla de Compra de Boletos  
* Panel de Administrador

### **RF7: Acceso Administrativo**

El sistema debe permitir acceso exclusivo al panel administrativo mediante:

* Verificación de credenciales administrativas especiales  
* Acceso limitado solo a usuarios con rol de administrador

## **3.2 Requerimientos No Funcionales**

### **RNF1: Usabilidad**

El sistema debe presentar interfaces intuitivas y amigables que permitan a usuarios sin experiencia técnica utilizar todas las funcionalidades sin dificultad.

### **RNF2: Rendimiento**

El sistema debe responder a todas las acciones del usuario en menos de 3 segundos, incluyendo consultas a la base de datos.

### **RNF3: Seguridad**

Los datos del usuario, especialmente contraseñas, deben almacenarse de forma segura mediante:

* Encriptación de contraseñas (hash criptográfico)  
* Comunicación segura entre aplicación y servidor (HTTPS)  
* Validación de entrada para prevenir inyección SQL

### **RNF4: Disponibilidad**

El sistema debe estar disponible mientras haya conexión a internet activa. El servidor MySQL debe tener disponibilidad 24/7.

### **RNF5: Compatibilidad**

El sistema debe funcionar en dispositivos Android 4.0 o superior, cubriendo la mayoría de dispositivos móviles Android actuales.

### **RNF6: Mantenibilidad**

El código debe ser documentado y estructurado de forma que permita mantenimiento y actualizaciones futuras por parte del equipo de desarrollo.

## **3.3 Requerimientos de Dominio**

* El sistema debe manejar correctamente datos de transporte y viajes  
* Debe permitir la gestión integral de compra de boletos  
* Debe almacenar información segura de usuarios

# **4\. Interfaces del Sistema**

## **4.1 Interfaz de Usuario (UI)**

El sistema cuenta con las siguientes interfaces principales:

| Pantalla | Descripción |
| :---- | :---- |
| Login | Pantalla de autenticación donde usuarios ingresan credenciales |
| Registro | Formulario para crear nueva cuenta de usuario |
| Inicio (Home) | Menú principal con opciones de navegación |
| Viajes | Listado de viajes disponibles con detalles y mapa |
| Compra | Formulario para seleccionar y comprar boletos |
| Admin | Panel exclusivo para administradores del sistema |

## **4.2 Interfaz de Base de Datos**

El sistema se conecta a MySQL mediante servicios web (APIs REST) para realizar operaciones CRUD (Crear, Leer, Actualizar, Eliminar) sobre los siguientes datos:

* Información de usuarios registrados  
* Detalles de compras realizadas  
* Información de viajes y horarios  
* Disponibilidad de asientos

# **5\. Modelo de Datos**

## **5.1 Estructura de la Base de Datos**

### **Tabla: usuarios**

Almacena información de usuarios registrados:

| Campo | Tipo | Restricción | Descripción |
| :---- | :---- | :---- | :---- |
| id | INT | PK, Auto | Identificador único |
| nombre | VARCHAR(100) | NOT NULL | Nombre completo del usuario |
| correo | VARCHAR(150) | UNIQUE | Correo electrónico único |
| password | VARCHAR(255) | NOT NULL | Contraseña encriptada |
| rol | VARCHAR(50) | DEFAULT: user | Rol: user o admin |

### **Tabla: compras**

Almacena información de boletos comprados:

| Campo | Tipo | Restricción | Descripción |
| :---- | :---- | :---- | :---- |
| id | INT | PK, Auto | Identificador único |
| usuario\_id | INT | FK | Referencia al usuario |
| destino | VARCHAR(100) | NOT NULL | Destino del viaje |
| fecha | DATE | NOT NULL | Fecha del viaje |
| asiento | INT | NOT NULL | Número de asiento |
| precio | DECIMAL | NOT NULL | Precio del boleto |
| fecha\_compra | TIMESTAMP | AUTO | Fecha y hora de compra |

# **6\. Casos de Uso**

## **6.1 Caso de Uso: Registrarse**

| Atributo | Valor |
| :---- | :---- |
| ID | CU1 |
| Nombre | Registrarse en el Sistema |
| Actor | Usuario no registrado |
| Descripción | Permite a nuevos usuarios crear una cuenta en el sistema proporcionando datos personales |
| Precondición | Usuario no posee cuenta en el sistema |
| Flujo Normal | Usuario selecciona opción Registrarse Sistema muestra formulario de registro Usuario ingresa nombre, correo y contraseña Sistema valida datos y los almacena en BD Sistema confirma registro exitoso |
| Postcondición | Usuario está registrado y puede iniciar sesión |

## **6.2 Caso de Uso: Iniciar Sesión**

| Atributo | Valor |
| :---- | :---- |
| ID | CU2 |
| Nombre | Iniciar Sesión |
| Actor | Usuario registrado |
| Descripción | Permite a usuarios autenticarse en el sistema con sus credenciales |
| Flujo Normal | Usuario ingresa correo y contraseña Sistema valida credenciales contra BD Si son correctas, se concede acceso Usuario es redirigido a pantalla de inicio |

## **6.3 Caso de Uso: Comprar Boleto**

| Atributo | Valor |
| :---- | :---- |
| ID | CU3 |
| Nombre | Comprar Boleto |
| Actor | Usuario autenticado |
| Descripción | Permite a usuarios comprar boletos de transporte |
| Precondición | Usuario ha iniciado sesión |
| Flujo Normal | Usuario accede a pantalla de compra Usuario selecciona destino, fecha y asiento Sistema valida disponibilidad Usuario confirma compra Sistema registra compra en BD Sistema genera comprobante |
| Postcondición | Boleto ha sido comprado y asiento no está disponible |

# **7\. Restricciones Técnicas**

## **7.1 Plataforma y Herramientas**

* Desarrollo: MIT App Inventor  
* Plataforma: Android  
* Base de Datos: MySQL 5.7 o superior  
* Versión de Android: 4.0 o superior

## **7.2 Infraestructura y Comunicación**

* Comunicación: API REST sobre HTTP/HTTPS  
* Servidor: Accesible desde internet  
* Integración con Google Maps API  
* Requiere conexión a internet activa

## **7.3 Estándares y Protocolos**

* Formato de datos: JSON  
* Encriptación de contraseñas: Hashing criptográfico (BCrypt o SHA-256)  
* Validación de entrada para prevenir inyección SQL

# **8\. Criterios de Aceptación**

El sistema será aceptado cuando satisfaga los siguientes criterios:

## **8.1 Funcionalidad**

* Permite registrar usuarios con validación de datos  
* Permite iniciar sesión correctamente  
* Permite consultar viajes disponibles  
* Integra Google Maps correctamente  
* Permite comprar boletos exitosamente  
* Navega correctamente entre todas las interfaces

## **8.2 Rendimiento**

* Todas las operaciones responden en menos de 3 segundos  
* La aplicación no se congela durante consultas a BD

## **8.3 Seguridad**

* Las contraseñas se almacenan de forma encriptada  
* Los datos sensibles no se exponen en tránsito

## **8.4 Usabilidad**

* La interfaz es clara e intuitiva  
* Los mensajes de error son comprensibles  
* La navegación es consistente

# **9\. Glosario**

| Término | Definición |
| :---- | :---- |
| Aplicación Móvil | Software diseñado para ejecutarse en dispositivos móviles como smartphones |
| API REST | Interfaz de programación que permite comunicación entre aplicaciones usando el protocolo HTTP |
| Autenticación | Proceso de verificar la identidad de un usuario mediante credenciales |
| Encriptación | Proceso de convertir datos en un formato ilegible para proteger su confidencialidad |
| Servidor | Computadora que almacena datos y proporciona servicios a clientes |
| Boleto | Documento que comprueba la compra de un viaje en transporte |
| Asiento | Lugar específico reservado para un pasajero en un vehículo de transporte |
| Validación | Proceso de verificar que los datos cumplen con reglas establecidas |

FIN DEL DOCUMENTO