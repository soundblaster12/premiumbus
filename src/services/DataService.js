/**
 * DataService.js — Data Layer Wrapper
 * 
 * Estrategia dual:
 *   1. Si la API PHP/MySQL está disponible → consulta MySQL
 *   2. Si no → fallback a localStorage con datos seed (modo demo)
 * 
 * Para cambiar de backend, solo edita este archivo.
 */

import { isApiAvailable, apiGet, apiPost } from './ApiClient.js';

const STORAGE_KEYS = {
  TRIPS: 'premiumbus_trips',
  PURCHASES: 'premiumbus_purchases',
};

/**
 * Datos seed de rutas reales de San Luis Potosí.
 * Se usan como fallback cuando no hay MySQL disponible.
 */
const SEED_VERSION = 'v3_conductores_desc';

const SEED_TRIPS = [
  {
    id:1, nombreRuta:'Ruta 1 - Saucito', origen:'Col. Saucito', destino:'Centro Histórico',
    origenLat:22.173, origenLng:-100.948, destinoLat:22.1565, destinoLng:-100.9855,
    paradas:[{nombre:'Col. Saucito',lat:22.173,lng:-100.948,tipo:'origen'},{nombre:'Av. Industrias',lat:22.169,lng:-100.955,minutos:4},{nombre:'Glorieta Juárez',lat:22.1465,lng:-100.9812,minutos:10},{nombre:'Centro Histórico',lat:22.1565,lng:-100.9855,tipo:'destino'}],
    fechaSalida:'2026-04-19T06:00:00', precio:13.50, asientosTotales:40, asientosOcupados:[3,7,12], activo:true,
    conductor:'Miguel Ángel Hernández',
    descripcion:'Conecta la Col. Saucito con el Centro Histórico pasando por Av. Industrias y Glorieta Juárez. Una de las rutas más antiguas de la ciudad.',
    datosHistoricos:{ anioInicio:2005, kilometros:8.5, tiempoPromedioMin:25, pasajerosDiarios:320 }
  },
  {
    id:2, nombreRuta:'Ruta 2 - Circuito', origen:'Col. Morales', destino:'Hospital Central',
    origenLat:22.135, origenLng:-100.955, destinoLat:22.152, destinoLng:-100.978,
    paradas:[{nombre:'Col. Morales',lat:22.135,lng:-100.955,tipo:'origen'},{nombre:'Av. Salvador Nava',lat:22.14,lng:-100.965,minutos:5},{nombre:'CU UASLP',lat:22.1413,lng:-100.9756,minutos:8},{nombre:'Hospital Central',lat:22.152,lng:-100.978,tipo:'destino'}],
    fechaSalida:'2026-04-19T06:15:00', precio:13.50, asientosTotales:40, asientosOcupados:[1,5,9], activo:true,
    conductor:'José Luis Martínez',
    descripcion:'Ruta circular que conecta Col. Morales con el Hospital Central, pasando por la zona universitaria de la UASLP.',
    datosHistoricos:{ anioInicio:2008, kilometros:7.2, tiempoPromedioMin:20, pasajerosDiarios:280 }
  },
  {
    id:3, nombreRuta:'Ruta 3 - Soledad', origen:'Fracc. Puerta Real', destino:'Zona Universitaria',
    origenLat:22.185, origenLng:-100.928, destinoLat:22.1413, destinoLng:-100.9756,
    paradas:[{nombre:'Fracc. Puerta Real',lat:22.185,lng:-100.928,tipo:'origen'},{nombre:'Centro Soledad',lat:22.178,lng:-100.938,minutos:6},{nombre:'Av. Salvador Nava',lat:22.153,lng:-100.965,minutos:15},{nombre:'Zona Universitaria',lat:22.1413,lng:-100.9756,tipo:'destino'}],
    fechaSalida:'2026-04-19T06:30:00', precio:13.50, asientosTotales:40, asientosOcupados:[2,4,6], activo:true,
    conductor:'Roberto Carlos López',
    descripcion:'Une Soledad de Graciano Sánchez con la Zona Universitaria. Muy utilizada por estudiantes de la UASLP.',
    datosHistoricos:{ anioInicio:2010, kilometros:11.3, tiempoPromedioMin:35, pasajerosDiarios:410 }
  },
  {
    id:4, nombreRuta:'Ruta 4 - Satélite', origen:'Ciudad Satélite', destino:'Tercera Chica',
    origenLat:22.12, origenLng:-101.01, destinoLat:22.158, destinoLng:-100.983,
    paradas:[{nombre:'Ciudad Satélite',lat:22.12,lng:-101.01,tipo:'origen'},{nombre:'Av. Río Españita',lat:22.13,lng:-101.0,minutos:5},{nombre:'Tangamanga',lat:22.1378,lng:-101.0089,minutos:10},{nombre:'Centro',lat:22.1565,lng:-100.9855,minutos:18},{nombre:'Tercera Chica',lat:22.158,lng:-100.983,tipo:'destino'}],
    fechaSalida:'2026-04-19T06:00:00', precio:13.50, asientosTotales:40, asientosOcupados:[10,20], activo:true,
    conductor:'Francisco Javier García',
    descripcion:'Recorre desde Ciudad Satélite hasta Tercera Chica cruzando el Parque Tangamanga y el Centro Histórico.',
    datosHistoricos:{ anioInicio:2003, kilometros:12.8, tiempoPromedioMin:40, pasajerosDiarios:350 }
  },
  {
    id:5, nombreRuta:'Ruta 5 - Prados', origen:'Fracc. Los Prados', destino:'Centro Histórico',
    origenLat:22.128, origenLng:-100.998, destinoLat:22.1565, destinoLng:-100.9855,
    paradas:[{nombre:'Fracc. Los Prados',lat:22.128,lng:-100.998,tipo:'origen'},{nombre:'Blvd. Río Españita',lat:22.135,lng:-100.995,minutos:4},{nombre:'Av. Salvador Nava',lat:22.14,lng:-100.978,minutos:8},{nombre:'Centro Histórico',lat:22.1565,lng:-100.9855,tipo:'destino'}],
    fechaSalida:'2026-04-19T06:20:00', precio:13.50, asientosTotales:40, asientosOcupados:[15], activo:true,
    conductor:'Juan Manuel Rodríguez',
    descripcion:'Conecta Fracc. Los Prados con el Centro pasando por Blvd. Río Españita. Ruta corta y frecuente.',
    datosHistoricos:{ anioInicio:2012, kilometros:6.4, tiempoPromedioMin:18, pasajerosDiarios:250 }
  },
  {
    id:6, nombreRuta:'Ruta 7 - Tangamanga', origen:'Alameda Central', destino:'Plaza Tangamanga',
    origenLat:22.151, origenLng:-100.985, destinoLat:22.1378, destinoLng:-101.0089,
    paradas:[{nombre:'Alameda Central',lat:22.151,lng:-100.985,tipo:'origen'},{nombre:'Av. Carranza',lat:22.149,lng:-100.989,minutos:4},{nombre:'Col. Las Águilas',lat:22.1435,lng:-100.998,minutos:8},{nombre:'Plaza Tangamanga',lat:22.1378,lng:-101.0089,tipo:'destino'}],
    fechaSalida:'2026-04-19T07:00:00', precio:13.50, asientosTotales:40, asientosOcupados:[5,9,14], activo:true,
    conductor:'Pedro Ramírez Torres',
    descripcion:'Desde la Alameda Central hasta Plaza Tangamanga. Popular los fines de semana por el acceso al parque.',
    datosHistoricos:{ anioInicio:2007, kilometros:5.8, tiempoPromedioMin:16, pasajerosDiarios:290 }
  },
  {
    id:7, nombreRuta:'Ruta 8 - Industrial', origen:'Zona Industrial', destino:'Col. Lomas',
    origenLat:22.115, origenLng:-100.935, destinoLat:22.165, destinoLng:-100.99,
    paradas:[{nombre:'Zona Industrial',lat:22.115,lng:-100.935,tipo:'origen'},{nombre:'Av. Industrial',lat:22.125,lng:-100.945,minutos:5},{nombre:'Eje Vial',lat:22.14,lng:-100.96,minutos:12},{nombre:'Centro',lat:22.1565,lng:-100.9855,minutos:18},{nombre:'Col. Lomas',lat:22.165,lng:-100.99,tipo:'destino'}],
    fechaSalida:'2026-04-19T06:30:00', precio:13.50, asientosTotales:40, asientosOcupados:[8,16,24], activo:true,
    conductor:'Arturo Mendoza Salazar',
    descripcion:'Ruta industrial que transporta trabajadores desde la Zona Industrial hasta Col. Lomas atravesando el Centro.',
    datosHistoricos:{ anioInicio:2001, kilometros:10.5, tiempoPromedioMin:32, pasajerosDiarios:380 }
  },
  {
    id:8, nombreRuta:'Ruta 9 - La Pila', origen:'Mercado República', destino:'La Pila',
    origenLat:22.154, origenLng:-100.982, destinoLat:22.112, destinoLng:-100.915,
    paradas:[{nombre:'Mercado República',lat:22.154,lng:-100.982,tipo:'origen'},{nombre:'Av. 20 de Noviembre',lat:22.148,lng:-100.975,minutos:5},{nombre:'Col. Morales',lat:22.135,lng:-100.955,minutos:12},{nombre:'Ej. Plan de Ayala',lat:22.123,lng:-100.935,minutos:20},{nombre:'La Pila',lat:22.112,lng:-100.915,tipo:'destino'}],
    fechaSalida:'2026-04-19T07:00:00', precio:15.00, asientosTotales:40, asientosOcupados:[4,8,15,23,31], activo:true,
    conductor:'Raúl Vázquez Infante',
    descripcion:'Ruta suburbana que llega hasta La Pila. Precio especial por la distancia. Importante para comunidades rurales.',
    datosHistoricos:{ anioInicio:1998, kilometros:18.2, tiempoPromedioMin:50, pasajerosDiarios:200 }
  },
  {
    id:9, nombreRuta:'Ruta 10 - Z. Industrial', origen:'Ciudad Satélite', destino:'Zona Industrial',
    origenLat:22.12, origenLng:-101.01, destinoLat:22.115, destinoLng:-100.935,
    paradas:[{nombre:'Ciudad Satélite',lat:22.12,lng:-101.01,tipo:'origen'},{nombre:'Av. Real de Lomas',lat:22.118,lng:-100.995,minutos:6},{nombre:'Pedregal',lat:22.115,lng:-100.975,minutos:12},{nombre:'Zona Industrial',lat:22.115,lng:-100.935,tipo:'destino'}],
    fechaSalida:'2026-04-19T06:00:00', precio:14.00, asientosTotales:40, asientosOcupados:[7,14,21], activo:true,
    conductor:'Eduardo Castillo Nava',
    descripcion:'Conecta Satélite con la Zona Industrial cruzando por Pedregal. Horario concentrado en turnos laborales.',
    datosHistoricos:{ anioInicio:2006, kilometros:14.1, tiempoPromedioMin:38, pasajerosDiarios:310 }
  },
  {
    id:10, nombreRuta:'Ruta 12 - UASLP', origen:'Centro Histórico', destino:'UASLP Zona Universitaria',
    origenLat:22.1565, origenLng:-100.9855, destinoLat:22.1413, destinoLng:-100.9756,
    paradas:[{nombre:'Centro Histórico',lat:22.1565,lng:-100.9855,tipo:'origen'},{nombre:'Jardín de San Francisco',lat:22.1535,lng:-100.983,minutos:3},{nombre:'Av. Constitución',lat:22.1488,lng:-100.979,minutos:7},{nombre:'UASLP Zona Universitaria',lat:22.1413,lng:-100.9756,tipo:'destino'}],
    fechaSalida:'2026-04-19T06:45:00', precio:13.50, asientosTotales:40, asientosOcupados:[2,6,10,13,18], activo:true,
    conductor:'Sergio Alejandro Reyes',
    descripcion:'Ruta universitaria directa del Centro a la UASLP. Muy alta demanda en horario escolar.',
    datosHistoricos:{ anioInicio:2009, kilometros:3.8, tiempoPromedioMin:12, pasajerosDiarios:520 }
  },
  {
    id:11, nombreRuta:'Ruta 14 - Jacarandas', origen:'Fracc. Jacarandas', destino:'Centro Histórico',
    origenLat:22.168, origenLng:-101.005, destinoLat:22.1565, destinoLng:-100.9855,
    paradas:[{nombre:'Fracc. Jacarandas',lat:22.168,lng:-101.005,tipo:'origen'},{nombre:'Col. Del Valle',lat:22.163,lng:-101.0,minutos:4},{nombre:'Av. Muñoz',lat:22.16,lng:-100.995,minutos:8},{nombre:'Centro Histórico',lat:22.1565,lng:-100.9855,tipo:'destino'}],
    fechaSalida:'2026-04-19T06:30:00', precio:13.50, asientosTotales:40, asientosOcupados:[3,11,19], activo:true,
    conductor:'Gustavo Monreal Pérez',
    descripcion:'Desde Fracc. Jacarandas al Centro por Col. Del Valle. Zona residencial con alta demanda matutina.',
    datosHistoricos:{ anioInicio:2011, kilometros:5.9, tiempoPromedioMin:17, pasajerosDiarios:270 }
  },
  {
    id:12, nombreRuta:'Ruta 15 - Damián Carmona', origen:'Damián Carmona', destino:'Tierra Blanca',
    origenLat:22.17, origenLng:-100.97, destinoLat:22.135, destinoLng:-100.94,
    paradas:[{nombre:'Damián Carmona',lat:22.17,lng:-100.97,tipo:'origen'},{nombre:'Calzada de Guadalupe',lat:22.162,lng:-100.977,minutos:5},{nombre:'Centro',lat:22.1565,lng:-100.9855,minutos:10},{nombre:'Tierra Blanca',lat:22.135,lng:-100.94,tipo:'destino'}],
    fechaSalida:'2026-04-19T06:15:00', precio:13.50, asientosTotales:40, asientosOcupados:[5,17], activo:true,
    conductor:'Carlos Alberto Zapata',
    descripcion:'Une Damián Carmona con Tierra Blanca pasando por la Calzada de Guadalupe y el Centro Histórico.',
    datosHistoricos:{ anioInicio:2004, kilometros:9.1, tiempoPromedioMin:28, pasajerosDiarios:230 }
  },
  {
    id:13, nombreRuta:'Ruta 16 - Soledad', origen:'Terminal Terrestre', destino:'Soledad de G.S.',
    origenLat:22.149, origenLng:-100.973, destinoLat:22.183, destinoLng:-100.934,
    paradas:[{nombre:'Terminal Terrestre',lat:22.149,lng:-100.973,tipo:'origen'},{nombre:'Av. Salvador Nava',lat:22.153,lng:-100.965,minutos:5},{nombre:'Col. Industrial',lat:22.162,lng:-100.952,minutos:12},{nombre:'Centro Soledad',lat:22.178,lng:-100.938,minutos:18},{nombre:'Soledad de G.S.',lat:22.183,lng:-100.934,tipo:'destino'}],
    fechaSalida:'2026-04-19T06:00:00', precio:14.00, asientosTotales:40, asientosOcupados:[1,2,3,5,7], activo:true,
    conductor:'Armando de la Rosa',
    descripcion:'Ruta intermunicipal Terminal-Soledad. Enlaza la Terminal Terrestre con el municipio vecino.',
    datosHistoricos:{ anioInicio:2002, kilometros:12.0, tiempoPromedioMin:35, pasajerosDiarios:360 }
  },
  {
    id:14, nombreRuta:'Ruta 18 - Las Águilas', origen:'Col. Las Águilas', destino:'Zona Industrial',
    origenLat:22.1435, origenLng:-100.998, destinoLat:22.115, destinoLng:-100.935,
    paradas:[{nombre:'Col. Las Águilas',lat:22.1435,lng:-100.998,tipo:'origen'},{nombre:'Av. Salvador Nava',lat:22.14,lng:-100.978,minutos:6},{nombre:'Centro',lat:22.1565,lng:-100.9855,minutos:14},{nombre:'Zona Industrial',lat:22.115,lng:-100.935,tipo:'destino'}],
    fechaSalida:'2026-04-19T06:30:00', precio:14.00, asientosTotales:40, asientosOcupados:[12,24,36], activo:true,
    conductor:'Manuel Alejandro Soto',
    descripcion:'Ruta laboral que conecta Col. Las Águilas con la Zona Industrial pasando por el Centro.',
    datosHistoricos:{ anioInicio:2007, kilometros:13.4, tiempoPromedioMin:42, pasajerosDiarios:290 }
  },
  {
    id:15, nombreRuta:'Ruta 20 - Pedregal', origen:'Fracc. Pedregal', destino:'Centro Histórico',
    origenLat:22.11, origenLng:-100.97, destinoLat:22.1565, destinoLng:-100.9855,
    paradas:[{nombre:'Fracc. Pedregal',lat:22.11,lng:-100.97,tipo:'origen'},{nombre:'Blvd. A. Obregón',lat:22.12,lng:-100.975,minutos:5},{nombre:'Col. Moderna',lat:22.135,lng:-100.98,minutos:12},{nombre:'Centro Histórico',lat:22.1565,lng:-100.9855,tipo:'destino'}],
    fechaSalida:'2026-04-19T07:00:00', precio:13.50, asientosTotales:40, asientosOcupados:[8,16], activo:true,
    conductor:'Daniel Moreno Esquivel',
    descripcion:'Desde Pedregal al Centro por Blvd. Obregón. Zona de crecimiento urbano con demanda creciente.',
    datosHistoricos:{ anioInicio:2014, kilometros:8.0, tiempoPromedioMin:24, pasajerosDiarios:220 }
  },
  {
    id:16, nombreRuta:'Ruta 22 - Progreso', origen:'Col. Progreso', destino:'Centro Histórico',
    origenLat:22.175, origenLng:-100.975, destinoLat:22.1565, destinoLng:-100.9855,
    paradas:[{nombre:'Col. Progreso',lat:22.175,lng:-100.975,tipo:'origen'},{nombre:'Av. Himno Nacional 2',lat:22.168,lng:-100.978,minutos:4},{nombre:'Calzada Guadalupe',lat:22.162,lng:-100.977,minutos:8},{nombre:'Centro Histórico',lat:22.1565,lng:-100.9855,tipo:'destino'}],
    fechaSalida:'2026-04-19T06:00:00', precio:13.50, asientosTotales:40, asientosOcupados:[20,30], activo:true,
    conductor:'Óscar Iván Delgado',
    descripcion:'Ruta norte que conecta Col. Progreso con el Centro por la Calzada de Guadalupe.',
    datosHistoricos:{ anioInicio:2006, kilometros:5.2, tiempoPromedioMin:15, pasajerosDiarios:260 }
  },
  {
    id:17, nombreRuta:'Ruta 25 - Sendero', origen:'Av. Universidad', destino:'Plaza Sendero',
    origenLat:22.1413, origenLng:-100.9756, destinoLat:22.1633, destinoLng:-101.0215,
    paradas:[{nombre:'Av. Universidad',lat:22.1413,lng:-100.9756,tipo:'origen'},{nombre:'Glorieta Juárez',lat:22.1465,lng:-100.9812,minutos:3},{nombre:'Alameda Central',lat:22.151,lng:-100.985,minutos:6},{nombre:'Mercado Revolución',lat:22.1558,lng:-100.992,minutos:10},{nombre:'Plaza Sendero',lat:22.1633,lng:-101.0215,tipo:'destino'}],
    fechaSalida:'2026-04-19T07:30:00', precio:14.00, asientosTotales:40, asientosOcupados:[3,7,12,15,22,28,35], activo:true,
    conductor:'Ricardo Alonso Prieto',
    descripcion:'Ruta comercial hacia Plaza Sendero. Alta demanda los fines de semana y días festivos.',
    datosHistoricos:{ anioInicio:2015, kilometros:9.7, tiempoPromedioMin:28, pasajerosDiarios:450 }
  },
  {
    id:18, nombreRuta:'Ruta 26 - Tercera Grande', origen:'Tercera Grande', destino:'Centro',
    origenLat:22.17, origenLng:-100.995, destinoLat:22.1565, destinoLng:-100.9855,
    paradas:[{nombre:'Tercera Grande',lat:22.17,lng:-100.995,tipo:'origen'},{nombre:'Av. Muñoz',lat:22.165,lng:-100.99,minutos:5},{nombre:'Col. España',lat:22.16,lng:-100.988,minutos:8},{nombre:'Centro',lat:22.1565,lng:-100.9855,tipo:'destino'}],
    fechaSalida:'2026-04-19T06:00:00', precio:13.50, asientosTotales:40, asientosOcupados:[6,18], activo:true,
    conductor:'Luis Fernando Estrada',
    descripcion:'Ruta residencial desde Tercera Grande al Centro. Pasa por Col. España, zona tradicional de la ciudad.',
    datosHistoricos:{ anioInicio:2008, kilometros:4.9, tiempoPromedioMin:14, pasajerosDiarios:210 }
  },
  {
    id:19, nombreRuta:'Ruta 28 - Hda. Bravo', origen:'Hacienda de Bravo', destino:'Centro Soledad',
    origenLat:22.195, origenLng:-100.92, destinoLat:22.178, destinoLng:-100.938,
    paradas:[{nombre:'Hacienda de Bravo',lat:22.195,lng:-100.92,tipo:'origen'},{nombre:'Col. Rancho Pavón',lat:22.19,lng:-100.928,minutos:5},{nombre:'Av. del Sauce',lat:22.185,lng:-100.933,minutos:9},{nombre:'Centro Soledad',lat:22.178,lng:-100.938,tipo:'destino'}],
    fechaSalida:'2026-04-19T06:15:00', precio:13.50, asientosTotales:40, asientosOcupados:[4,8], activo:true,
    conductor:'Jorge Antonio Nava',
    descripcion:'Ruta corta dentro de Soledad de Graciano. Conecta la zona habitacional Hda. de Bravo con el Centro de Soledad.',
    datosHistoricos:{ anioInicio:2013, kilometros:4.2, tiempoPromedioMin:13, pasajerosDiarios:180 }
  },
  {
    id:20, nombreRuta:'Ruta 30 - Aviación', origen:'Calzada de Guadalupe', destino:'Industrial Aviación',
    origenLat:22.162, origenLng:-100.977, destinoLat:22.125, destinoLng:-100.953,
    paradas:[{nombre:'Calzada de Guadalupe',lat:22.162,lng:-100.977,tipo:'origen'},{nombre:'Av. Himno Nacional',lat:22.155,lng:-100.97,minutos:4},{nombre:'Plaza de Toros',lat:22.143,lng:-100.962,minutos:9},{nombre:'Industrial Aviación',lat:22.125,lng:-100.953,tipo:'destino'}],
    fechaSalida:'2026-04-19T06:45:00', precio:14.00, asientosTotales:40, asientosOcupados:[10,20,30], activo:true,
    conductor:'Héctor Hugo Balderas',
    descripcion:'Ruta hacia la Zona Industrial Aviación. Conecta la Calzada de Guadalupe con las fábricas del sur.',
    datosHistoricos:{ anioInicio:2004, kilometros:8.8, tiempoPromedioMin:22, pasajerosDiarios:300 }
  },
  {
    id:21, nombreRuta:'Ruta 33 - Santiago', origen:'Col. Santiago', destino:'Centro Histórico',
    origenLat:22.14, origenLng:-101.02, destinoLat:22.1565, destinoLng:-100.9855,
    paradas:[{nombre:'Col. Santiago',lat:22.14,lng:-101.02,tipo:'origen'},{nombre:'Av. Tangamanga',lat:22.14,lng:-101.01,minutos:4},{nombre:'Parque Tangamanga',lat:22.1378,lng:-101.0089,minutos:8},{nombre:'Centro Histórico',lat:22.1565,lng:-100.9855,tipo:'destino'}],
    fechaSalida:'2026-04-19T06:00:00', precio:13.50, asientosTotales:40, asientosOcupados:[11,22,33], activo:true,
    conductor:'Alejandro Coronado Ríos',
    descripcion:'Desde Col. Santiago al Centro pasando por el Parque Tangamanga. Ruta escénica de la ciudad.',
    datosHistoricos:{ anioInicio:2009, kilometros:7.6, tiempoPromedioMin:22, pasajerosDiarios:240 }
  },
  {
    id:22, nombreRuta:'Ruta 35 - Matehuala', origen:'Col. Matehuala', destino:'Centro',
    origenLat:22.18, origenLng:-100.96, destinoLat:22.1565, destinoLng:-100.9855,
    paradas:[{nombre:'Col. Matehuala',lat:22.18,lng:-100.96,tipo:'origen'},{nombre:'Av. Nereo Rdz.',lat:22.172,lng:-100.968,minutos:5},{nombre:'Mercado República',lat:22.154,lng:-100.982,minutos:14},{nombre:'Centro',lat:22.1565,lng:-100.9855,tipo:'destino'}],
    fechaSalida:'2026-04-19T06:30:00', precio:13.50, asientosTotales:40, asientosOcupados:[9,18,27], activo:true,
    conductor:'Fernando Javier Lara',
    descripcion:'Ruta norte desde Col. Matehuala al Centro pasando por Mercado República. Zona comercial popular.',
    datosHistoricos:{ anioInicio:2005, kilometros:6.7, tiempoPromedioMin:20, pasajerosDiarios:270 }
  },
  {
    id:23, nombreRuta:'Ruta 40 - Villa de Pozos', origen:'Villa de Pozos', destino:'Centro',
    origenLat:22.105, origenLng:-100.89, destinoLat:22.1565, destinoLng:-100.9855,
    paradas:[{nombre:'Villa de Pozos',lat:22.105,lng:-100.89,tipo:'origen'},{nombre:'Carr. a Rioverde',lat:22.12,lng:-100.92,minutos:8},{nombre:'Eje Vial',lat:22.14,lng:-100.96,minutos:18},{nombre:'Centro',lat:22.1565,lng:-100.9855,tipo:'destino'}],
    fechaSalida:'2026-04-19T06:00:00', precio:16.00, asientosTotales:40, asientosOcupados:[5,15,25,35], activo:true,
    conductor:'Martín Guadalupe Rosas',
    descripcion:'Ruta larga desde Villa de Pozos. Precio especial por distancia. Conecta esta delegación con la capital.',
    datosHistoricos:{ anioInicio:2000, kilometros:22.5, tiempoPromedioMin:55, pasajerosDiarios:180 }
  },
  {
    id:24, nombreRuta:'Ruta 42 - Bocas', origen:'Col. Bocas', destino:'Terminal Terrestre',
    origenLat:22.21, origenLng:-100.95, destinoLat:22.149, destinoLng:-100.973,
    paradas:[{nombre:'Col. Bocas',lat:22.21,lng:-100.95,tipo:'origen'},{nombre:'Carr. 57 Norte',lat:22.195,lng:-100.955,minutos:6},{nombre:'Soledad Centro',lat:22.178,lng:-100.938,minutos:14},{nombre:'Terminal Terrestre',lat:22.149,lng:-100.973,tipo:'destino'}],
    fechaSalida:'2026-04-19T06:00:00', precio:18.00, asientosTotales:40, asientosOcupados:[2,4,6], activo:true,
    conductor:'Rubén Darío Camargo',
    descripcion:'Ruta suburbana más larga. Conecta Bocas con la Terminal Terrestre. Tarifa especial por la distancia.',
    datosHistoricos:{ anioInicio:1996, kilometros:28.0, tiempoPromedioMin:65, pasajerosDiarios:150 }
  },
  {
    id:25, nombreRuta:'MetroRed L1', origen:'Estación Central', destino:'Terminal Norte',
    origenLat:22.15, origenLng:-100.98, destinoLat:22.185, destinoLng:-100.945,
    paradas:[{nombre:'Estación Central',lat:22.15,lng:-100.98,tipo:'origen'},{nombre:'Av. 5 de Mayo',lat:22.158,lng:-100.978,minutos:3},{nombre:'Glorieta Niños Héroes',lat:22.165,lng:-100.965,minutos:7},{nombre:'Soledad Centro',lat:22.178,lng:-100.938,minutos:13},{nombre:'Terminal Norte',lat:22.185,lng:-100.945,tipo:'destino'}],
    fechaSalida:'2026-04-19T05:30:00', precio:13.50, asientosTotales:40, asientosOcupados:[1,3,5,7,9,11,13], activo:true,
    conductor:'Víctor Manuel Luna',
    descripcion:'Línea 1 del sistema MetroRed. Eje norte-sur principal de transporte masivo en la zona metropolitana.',
    datosHistoricos:{ anioInicio:2018, kilometros:9.3, tiempoPromedioMin:22, pasajerosDiarios:680 }
  },
  {
    id:26, nombreRuta:'MetroRed L2', origen:'Estación Central', destino:'Terminal Sur',
    origenLat:22.15, origenLng:-100.98, destinoLat:22.11, destinoLng:-100.97,
    paradas:[{nombre:'Estación Central',lat:22.15,lng:-100.98,tipo:'origen'},{nombre:'Av. Universidad',lat:22.1413,lng:-100.9756,minutos:5},{nombre:'Col. Moderna',lat:22.13,lng:-100.975,minutos:10},{nombre:'Terminal Sur',lat:22.11,lng:-100.97,tipo:'destino'}],
    fechaSalida:'2026-04-19T05:30:00', precio:13.50, asientosTotales:40, asientosOcupados:[2,4,6,8,10], activo:true,
    conductor:'Enrique Solís Aguilar',
    descripcion:'Línea 2 del MetroRed. Conecta el Centro con la zona sur incluyendo la Zona Universitaria.',
    datosHistoricos:{ anioInicio:2019, kilometros:7.8, tiempoPromedioMin:18, pasajerosDiarios:550 }
  },
  {
    id:27, nombreRuta:'MetroRed L3', origen:'Estación Central', destino:'Zona Industrial',
    origenLat:22.15, origenLng:-100.98, destinoLat:22.115, destinoLng:-100.935,
    paradas:[{nombre:'Estación Central',lat:22.15,lng:-100.98,tipo:'origen'},{nombre:'Eje Vial',lat:22.14,lng:-100.96,minutos:6},{nombre:'Av. Industrial',lat:22.128,lng:-100.945,minutos:12},{nombre:'Zona Industrial',lat:22.115,lng:-100.935,tipo:'destino'}],
    fechaSalida:'2026-04-19T05:30:00', precio:13.50, asientosTotales:40, asientosOcupados:[12,24,36], activo:true,
    conductor:'Saúl Adrián Juárez',
    descripcion:'Línea 3 del MetroRed. Ruta directa a la Zona Industrial para horarios laborales.',
    datosHistoricos:{ anioInicio:2020, kilometros:8.5, tiempoPromedioMin:20, pasajerosDiarios:480 }
  },
  {
    id:28, nombreRuta:'Ruta 50 - Lomas del Sur', origen:'Lomas del Sur', destino:'Centro',
    origenLat:22.105, origenLng:-100.995, destinoLat:22.1565, destinoLng:-100.9855,
    paradas:[{nombre:'Lomas del Sur',lat:22.105,lng:-100.995,tipo:'origen'},{nombre:'Pedregal de Sn. Ángel',lat:22.115,lng:-100.99,minutos:5},{nombre:'Tangamanga',lat:22.1378,lng:-101.0089,minutos:14},{nombre:'Centro',lat:22.1565,lng:-100.9855,tipo:'destino'}],
    fechaSalida:'2026-04-19T06:30:00', precio:14.00, asientosTotales:40, asientosOcupados:[7,14], activo:true,
    conductor:'Adrián Coronel Medina',
    descripcion:'Ruta del sur poniente. Conecta las nuevas urbanizaciones de Lomas del Sur con el Centro por Tangamanga.',
    datosHistoricos:{ anioInicio:2016, kilometros:11.2, tiempoPromedioMin:34, pasajerosDiarios:260 }
  },
  {
    id:29, nombreRuta:'Ruta 55 - R. Pavón', origen:'Rancho Pavón', destino:'Centro',
    origenLat:22.19, origenLng:-100.93, destinoLat:22.1565, destinoLng:-100.9855,
    paradas:[{nombre:'Rancho Pavón',lat:22.19,lng:-100.93,tipo:'origen'},{nombre:'Soledad Centro',lat:22.178,lng:-100.938,minutos:6},{nombre:'Av. Salvador Nava',lat:22.153,lng:-100.965,minutos:16},{nombre:'Centro',lat:22.1565,lng:-100.9855,tipo:'destino'}],
    fechaSalida:'2026-04-19T06:15:00', precio:14.00, asientosTotales:40, asientosOcupados:[10,20], activo:true,
    conductor:'Iván de Jesús Torres',
    descripcion:'Ruta de Soledad a SLP. Conecta Rancho Pavón con el Centro pasando por Soledad Centro.',
    datosHistoricos:{ anioInicio:2010, kilometros:10.8, tiempoPromedioMin:30, pasajerosDiarios:230 }
  },
  {
    id:30, nombreRuta:'Ruta 60 - Ecosistema', origen:'Fracc. Ecosistema', destino:'Centro',
    origenLat:22.175, origenLng:-101.02, destinoLat:22.1565, destinoLng:-100.9855,
    paradas:[{nombre:'Fracc. Ecosistema',lat:22.175,lng:-101.02,tipo:'origen'},{nombre:'Plaza Sendero',lat:22.1633,lng:-101.0215,minutos:5},{nombre:'Mercado Revolución',lat:22.1558,lng:-100.992,minutos:12},{nombre:'Centro',lat:22.1565,lng:-100.9855,tipo:'destino'}],
    fechaSalida:'2026-04-19T06:45:00', precio:14.00, asientosTotales:40, asientosOcupados:[3,6], activo:true,
    conductor:'Marco Antonio Flores',
    descripcion:'Ruta poniente desde Fracc. Ecosistema. Pasa por Plaza Sendero, importante centro comercial.',
    datosHistoricos:{ anioInicio:2017, kilometros:8.4, tiempoPromedioMin:26, pasajerosDiarios:310 }
  },
];

class DataServiceWrapper {
  constructor() {
    this._initializeSeedData();
  }

  _initializeSeedData() {
    // Force re-seed when version changes (new routes added)
    const storedVersion = localStorage.getItem('premiumbus_seed_version');
    if (storedVersion !== SEED_VERSION) {
      localStorage.setItem(STORAGE_KEYS.TRIPS, JSON.stringify(SEED_TRIPS));
      localStorage.setItem('premiumbus_seed_version', SEED_VERSION);
    }
    if (!localStorage.getItem(STORAGE_KEYS.PURCHASES)) {
      localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify([]));
    }
  }

  _getStoredTrips() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.TRIPS) || '[]');
    } catch {
      return [];
    }
  }

  _getStoredPurchases() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.PURCHASES) || '[]');
    } catch {
      return [];
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PÚBLICO
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Obtiene todos los viajes activos.
   * @returns {Promise<Array>}
   */
  async getTrips() {
    const useApi = await isApiAvailable();

    if (useApi) {
      try {
        const data = await apiGet('trips');
        return data.trips || [];
      } catch {
        return this._getTripsLocal();
      }
    }

    return this._getTripsLocal();
  }

  /**
   * Obtiene un viaje por ID.
   * @param {number} tripId
   * @returns {Promise<Object|null>}
   */
  async getTripById(tripId) {
    const useApi = await isApiAvailable();

    if (useApi) {
      try {
        const data = await apiGet('trip', { id: tripId });
        return data.trip || null;
      } catch {
        return this._getTripByIdLocal(tripId);
      }
    }

    return this._getTripByIdLocal(tripId);
  }

  /**
   * Compra un boleto.
   * @param {number|string} userId
   * @param {number} tripId
   * @param {number} seatNumber
   * @returns {Promise<{success: boolean, error?: string, purchase?: Object}>}
   */
  async purchaseTicket(userId, tripId, seatNumber) {
    const useApi = await isApiAvailable();

    if (useApi) {
      return this._purchaseApi(userId, tripId, seatNumber);
    }

    return this._purchaseLocal(userId, tripId, seatNumber);
  }

  /**
   * Compras de un usuario.
   * @param {number|string} userId
   * @returns {Promise<Array>}
   */
  async getUserPurchases(userId) {
    const useApi = await isApiAvailable();

    if (useApi) {
      try {
        const data = await apiGet('user_purchases', { user_id: userId });
        return data.purchases || [];
      } catch {
        return this._getStoredPurchases().filter((p) => p.usuarioId == userId);
      }
    }

    await this._delay(300);
    return this._getStoredPurchases().filter((p) => p.usuarioId == userId);
  }

  /**
   * Obtiene el viaje activo del usuario (el más reciente con fecha futura).
   * @param {number|string} userId
   * @returns {Promise<Object|null>}
   */
  async getUserActiveTrip(userId) {
    const purchases = await this.getUserPurchases(userId);
    const now = new Date();

    // Buscar la compra más reciente cuyo viaje aún no ha pasado
    const activePurchase = purchases
      .filter((p) => new Date(p.fecha) >= now)
      .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))[0];

    if (!activePurchase) return null;

    const trip = await this.getTripById(activePurchase.viajeId);
    if (!trip) return null;

    return { ...trip, purchase: activePurchase };
  }

  /**
   * Todas las compras (admin).
   * @returns {Promise<Array>}
   */
  async getAllPurchases() {
    const useApi = await isApiAvailable();

    if (useApi) {
      try {
        const data = await apiGet('all_purchases');
        return data.purchases || [];
      } catch {
        return this._getStoredPurchases();
      }
    }

    await this._delay(300);
    return this._getStoredPurchases();
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PRIVADO — API MySQL
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  async _purchaseApi(userId, tripId, seatNumber) {
    try {
      const data = await apiPost('purchase', {
        usuario_id: userId,
        viaje_id: tripId,
        asiento: seatNumber,
      });
      return { success: true, purchase: data.purchase };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PRIVADO — localStorage Fallback
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  _getTripsLocal() {
    const trips = this._getStoredTrips();
    return trips
      .filter((trip) => trip.activo)
      .map((trip) => ({
        ...trip,
        asientosDisponibles: trip.asientosTotales - trip.asientosOcupados.length,
      }));
  }

  _getTripByIdLocal(tripId) {
    const trips = this._getStoredTrips();
    const trip = trips.find((t) => t.id === tripId);
    if (!trip) return null;
    return {
      ...trip,
      asientosDisponibles: trip.asientosTotales - trip.asientosOcupados.length,
    };
  }

  async _purchaseLocal(userId, tripId, seatNumber) {
    await this._delay(800);

    const trips = this._getStoredTrips();
    const tripIndex = trips.findIndex((t) => t.id === tripId);

    if (tripIndex === -1) {
      return { success: false, error: 'Viaje no encontrado.' };
    }

    const trip = trips[tripIndex];

    if (trip.asientosOcupados.includes(seatNumber)) {
      return { success: false, error: 'Este asiento ya está ocupado. Selecciona otro.' };
    }

    trip.asientosOcupados.push(seatNumber);
    trips[tripIndex] = trip;
    localStorage.setItem(STORAGE_KEYS.TRIPS, JSON.stringify(trips));

    const purchase = {
      id: Date.now(),
      usuarioId: userId,
      viajeId: tripId,
      nombreRuta: trip.nombreRuta,
      destino: trip.destino,
      origen: trip.origen,
      fecha: trip.fechaSalida,
      asiento: seatNumber,
      precio: trip.precio,
      fechaCompra: new Date().toISOString(),
    };

    const purchases = this._getStoredPurchases();
    purchases.push(purchase);
    localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(purchases));

    return { success: true, purchase };
  }

  _delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const DataService = new DataServiceWrapper();
