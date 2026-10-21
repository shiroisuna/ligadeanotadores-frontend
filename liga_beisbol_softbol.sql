-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: localhost
-- Tiempo de generación: 15-10-2026 a las 18:23:00
-- Versión del servidor: 8.0.30
-- Versión de PHP: 8.1.10

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `liga_beisbol_softbol`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `arbitros`
--

CREATE TABLE `arbitros` (
  `id` int NOT NULL,
  `nombres` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `apellidos` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cedula` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telefono` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `bateo_juego`
--

CREATE TABLE `bateo_juego` (
  `id` int NOT NULL,
  `juego_id` int NOT NULL,
  `roster_id` int NOT NULL,
  `posicion` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vb` tinyint DEFAULT '0',
  `ca` tinyint DEFAULT '0',
  `hc` tinyint DEFAULT '0',
  `bb` tinyint DEFAULT '0',
  `sh` tinyint DEFAULT '0',
  `sf` tinyint DEFAULT '0',
  `gp` tinyint DEFAULT '0',
  `in_` tinyint DEFAULT '0',
  `al` tinyint DEFAULT '0',
  `h2` tinyint DEFAULT '0',
  `h3` tinyint DEFAULT '0',
  `hr` tinyint DEFAULT '0',
  `ba` tinyint DEFAULT '0',
  `ci` tinyint DEFAULT '0',
  `br` tinyint DEFAULT '0',
  `or_` tinyint DEFAULT '0',
  `so` tinyint DEFAULT '0',
  `ij` decimal(4,2) DEFAULT '0.00',
  `o` tinyint DEFAULT '0',
  `a` tinyint DEFAULT '0',
  `e` tinyint DEFAULT '0',
  `tl` tinyint DEFAULT '0',
  `dp` tinyint DEFAULT '0',
  `di` tinyint DEFAULT '0',
  `aprobado` tinyint NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `categorias`
--

CREATE TABLE `categorias` (
  `id` int NOT NULL,
  `disciplina_id` int NOT NULL,
  `nombre` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `lleva_pitcheo` tinyint(1) NOT NULL DEFAULT '1',
  `nivel_standings` enum('basico','avanzado') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'basico',
  `num_innings` tinyint NOT NULL DEFAULT '7',
  `orden_visual` int DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `categorias`
--

INSERT INTO `categorias` (`id`, `disciplina_id`, `nombre`, `lleva_pitcheo`, `nivel_standings`, `num_innings`, `orden_visual`) VALUES
(4, 5, 'Softbol Mejorado', 0, 'avanzado', 7, 0),
(5, 6, 'Categoria Infantil A  (Grupo  A)', 1, 'avanzado', 7, 0);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `contenido_sitio`
--

CREATE TABLE `contenido_sitio` (
  `id` int NOT NULL DEFAULT '1',
  `vision` text COLLATE utf8mb4_unicode_ci,
  `mision` text COLLATE utf8mb4_unicode_ci,
  `contacto_direccion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contacto_telefono` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contacto_email` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contacto_facebook` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contacto_instagram` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contacto_whatsapp` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `actualizado_en` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `pago_movil_banco` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pago_movil_cedula` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pago_movil_telefono` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mensualidad_monto` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `contenido_sitio`
--

INSERT INTO `contenido_sitio` (`id`, `vision`, `mision`, `contacto_direccion`, `contacto_telefono`, `contacto_email`, `contacto_facebook`, `contacto_instagram`, `contacto_whatsapp`, `actualizado_en`, `pago_movil_banco`, `pago_movil_cedula`, `pago_movil_telefono`, `mensualidad_monto`) VALUES
(1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-08-12 10:38:37', NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `control_lanzadores`
--

CREATE TABLE `control_lanzadores` (
  `id` int NOT NULL,
  `roster_id` int NOT NULL,
  `juego_id` int DEFAULT NULL,
  `fecha` date NOT NULL,
  `hora` time DEFAULT NULL,
  `envios` smallint NOT NULL DEFAULT '0',
  `innings_lanzados` decimal(4,1) DEFAULT '0.0',
  `condicion` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `creado_en` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `control_lanzadores`
--

INSERT INTO `control_lanzadores` (`id`, `roster_id`, `juego_id`, `fecha`, `hora`, `envios`, `innings_lanzados`, `condicion`, `creado_en`) VALUES
(2, 47, 23, '2026-09-13', '09:00:00', 60, 4.0, NULL, '2026-09-14 19:54:36');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `control_lanzadores_reglas`
--

CREATE TABLE `control_lanzadores_reglas` (
  `id` int NOT NULL,
  `categoria_id` int DEFAULT NULL,
  `envios_min` smallint NOT NULL,
  `envios_max` smallint NOT NULL,
  `dias_descanso` tinyint NOT NULL,
  `descripcion` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `control_lanzadores_reglas`
--

INSERT INTO `control_lanzadores_reglas` (`id`, `categoria_id`, `envios_min`, `envios_max`, `dias_descanso`, `descripcion`) VALUES
(1, NULL, 0, 20, 0, 'Puede lanzar al dia siguiente'),
(2, NULL, 21, 40, 1, '1 dia de descanso obligatorio'),
(3, NULL, 41, 60, 2, '2 dias de descanso obligatorio'),
(4, NULL, 61, 80, 3, '3 dias de descanso obligatorio'),
(5, NULL, 81, 999, 4, '4 dias de descanso obligatorio');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `disciplinas`
--

CREATE TABLE `disciplinas` (
  `id` int NOT NULL,
  `nombre` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `disciplinas`
--

INSERT INTO `disciplinas` (`id`, `nombre`) VALUES
(4, 'Béisbol Mayor'),
(3, 'Béisbol Menor'),
(6, 'Liga de beisbol Menor 2026-2027'),
(5, 'Softbol');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `entradas_juego`
--

CREATE TABLE `entradas_juego` (
  `id` int NOT NULL,
  `juego_id` int NOT NULL,
  `equipo_inscrito_id` int NOT NULL,
  `numero_entrada` tinyint NOT NULL,
  `carreras` smallint NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `equipos`
--

CREATE TABLE `equipos` (
  `id` int NOT NULL,
  `nombre` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `logo_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `equipos`
--

INSERT INTO `equipos` (`id`, `nombre`, `logo_url`) VALUES
(1, 'Tigres', NULL),
(2, 'Leones', NULL),
(3, 'Alacranes', NULL),
(4, 'Gigantes', NULL),
(5, 'Caribes', NULL),
(6, 'Navegantes', NULL),
(7, 'Cardenales', NULL),
(8, 'Bravos', NULL),
(9, 'Gigantes', NULL),
(10, 'Vikingos', NULL),
(11, 'Team Brothers', NULL),
(12, 'Dream Team', NULL),
(13, 'Tiburones', NULL),
(14, 'Mets', NULL),
(15, 'Piratas', NULL),
(16, 'Angeles  A', NULL),
(17, 'HALCOLEOBRA', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `equipos_inscritos`
--

CREATE TABLE `equipos_inscritos` (
  `id` int NOT NULL,
  `equipo_id` int NOT NULL,
  `temporada_categoria_id` int NOT NULL,
  `grupo` varchar(5) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `equipos_inscritos`
--

INSERT INTO `equipos_inscritos` (`id`, `equipo_id`, `temporada_categoria_id`, `grupo`) VALUES
(17, 12, 6, NULL),
(18, 4, 6, NULL),
(19, 15, 6, NULL),
(20, 11, 6, NULL),
(21, 13, 6, NULL),
(22, 10, 6, NULL),
(23, 16, 7, 'A'),
(24, 17, 7, 'A');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `estadios`
--

CREATE TABLE `estadios` (
  `id` int NOT NULL,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `direccion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `est_bateo`
--

CREATE TABLE `est_bateo` (
  `id` int NOT NULL,
  `juego_id` int NOT NULL,
  `roster_id` int NOT NULL,
  `aprobado` tinyint NOT NULL DEFAULT '0',
  `vb` smallint DEFAULT '0',
  `ca` smallint DEFAULT '0',
  `hc` smallint DEFAULT '0',
  `bb` smallint DEFAULT '0',
  `sh` smallint DEFAULT '0',
  `sf` smallint DEFAULT '0',
  `gp` smallint DEFAULT '0',
  `in_` smallint DEFAULT '0',
  `al` smallint DEFAULT '0',
  `h2` smallint DEFAULT '0',
  `h3` smallint DEFAULT '0',
  `hr` smallint DEFAULT '0',
  `ba` smallint DEFAULT '0',
  `ci` smallint DEFAULT '0',
  `br` smallint DEFAULT '0',
  `or_` smallint DEFAULT '0',
  `so` smallint DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `est_bateo`
--

INSERT INTO `est_bateo` (`id`, `juego_id`, `roster_id`, `aprobado`, `vb`, `ca`, `hc`, `bb`, `sh`, `sf`, `gp`, `in_`, `al`, `h2`, `h3`, `hr`, `ba`, `ci`, `br`, `or_`, `so`) VALUES
(11, 19, 41, 1, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
(12, 19, 38, 1, 3, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
(13, 19, 42, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
(14, 19, 45, 1, 2, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
(15, 19, 40, 1, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
(16, 19, 36, 1, 2, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
(17, 19, 37, 1, 2, 0, 2, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
(18, 19, 39, 1, 2, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
(19, 19, 44, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
(20, 19, 46, 1, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
(21, 19, 43, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
(33, 23, 47, 1, 3, 1, 2, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 2, 0, 0, 0),
(34, 23, 48, 1, 3, 2, 2, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0),
(35, 23, 49, 1, 3, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1),
(36, 23, 50, 1, 2, 1, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `est_fildeo`
--

CREATE TABLE `est_fildeo` (
  `id` int NOT NULL,
  `juego_id` int NOT NULL,
  `roster_id` int NOT NULL,
  `aprobado` tinyint NOT NULL DEFAULT '0',
  `posicion` enum('P','C','1B','2B','3B','SS','LF','CF','RF') COLLATE utf8mb4_unicode_ci NOT NULL,
  `ij` decimal(5,2) DEFAULT '0.00',
  `o` smallint DEFAULT '0',
  `a` smallint DEFAULT '0',
  `e` smallint DEFAULT '0',
  `tl` smallint DEFAULT '0',
  `dp` smallint DEFAULT '0',
  `di` smallint DEFAULT '0',
  `pb` smallint DEFAULT '0',
  `ir` smallint DEFAULT '0',
  `or_` smallint DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `est_fildeo`
--

INSERT INTO `est_fildeo` (`id`, `juego_id`, `roster_id`, `aprobado`, `posicion`, `ij`, `o`, `a`, `e`, `tl`, `dp`, `di`, `pb`, `ir`, `or_`) VALUES
(2, 19, 36, 1, 'P', 7.00, 2, 0, 1, 3, 0, 0, 0, 0, 0),
(5, 19, 36, 1, 'CF', 7.00, 2, 0, 1, 3, 0, 0, 0, 0, 0),
(8, 19, 37, 1, 'P', 7.00, 0, 3, 1, 4, 0, 0, 0, 0, 0),
(9, 19, 37, 1, 'SS', 7.00, 0, 3, 1, 4, 0, 0, 0, 0, 0);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `est_pitcheo`
--

CREATE TABLE `est_pitcheo` (
  `id` int NOT NULL,
  `juego_id` int NOT NULL,
  `roster_id` int NOT NULL,
  `aprobado` tinyint NOT NULL DEFAULT '0',
  `g` tinyint DEFAULT '0',
  `p` tinyint DEFAULT '0',
  `s` tinyint DEFAULT '0',
  `e` tinyint DEFAULT '0',
  `i` tinyint DEFAULT '0',
  `r` tinyint DEFAULT '0',
  `c` tinyint DEFAULT '0',
  `b` tinyint DEFAULT '0',
  `vb` smallint DEFAULT '0',
  `hp` smallint DEFAULT '0',
  `h2` smallint DEFAULT '0',
  `h3` smallint DEFAULT '0',
  `hr` smallint DEFAULT '0',
  `il` decimal(5,2) DEFAULT '0.00',
  `cp` smallint DEFAULT '0',
  `cl` smallint DEFAULT '0',
  `so` smallint DEFAULT '0',
  `bb` smallint DEFAULT '0',
  `bi` smallint DEFAULT '0',
  `sh` smallint DEFAULT '0',
  `sf` smallint DEFAULT '0',
  `gp` smallint DEFAULT '0',
  `wp` smallint DEFAULT '0',
  `bk` smallint DEFAULT '0',
  `li` smallint DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `est_pitcheo`
--

INSERT INTO `est_pitcheo` (`id`, `juego_id`, `roster_id`, `aprobado`, `g`, `p`, `s`, `e`, `i`, `r`, `c`, `b`, `vb`, `hp`, `h2`, `h3`, `hr`, `il`, `cp`, `cl`, `so`, `bb`, `bi`, `sh`, `sf`, `gp`, `wp`, `bk`, `li`) VALUES
(8, 19, 41, 1, 0, 0, 0, 0, 1, 0, 0, 0, 31, 10, 0, 1, 1, 7.00, 5, 4, 1, 0, 0, 0, 0, 0, 0, 0, 0),
(9, 19, 38, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.00, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
(10, 19, 42, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.00, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
(11, 19, 45, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.00, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
(12, 19, 40, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.00, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
(13, 19, 36, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.00, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
(14, 19, 37, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.00, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
(15, 19, 39, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.00, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
(16, 19, 44, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.00, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
(17, 19, 46, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.00, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
(18, 19, 43, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.00, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
(30, 23, 47, 1, 1, 0, 0, 0, 1, 0, 0, 0, 7, 1, 1, 0, 0, 2.50, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0),
(31, 23, 48, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.00, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
(32, 23, 49, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.00, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
(33, 23, 50, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.00, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `fotos`
--

CREATE TABLE `fotos` (
  `id` int NOT NULL,
  `url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `juego_id` int DEFAULT NULL,
  `orden` int DEFAULT '0',
  `creado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `fotos`
--

INSERT INTO `fotos` (`id`, `url`, `descripcion`, `juego_id`, `orden`, `creado_en`) VALUES
(3, 'http://localhost:4000/uploads/galeria/1788690611076-396566294.jpg', NULL, NULL, 0, '2026-09-06 06:30:12');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `incidencias`
--

CREATE TABLE `incidencias` (
  `id` int NOT NULL,
  `juego_id` int NOT NULL,
  `roster_id` int DEFAULT NULL,
  `tipo` enum('sancion','novedad','protesta','otro') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'novedad',
  `descripcion` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `creado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `incidencias`
--

INSERT INTO `incidencias` (`id`, `juego_id`, `roster_id`, `tipo`, `descripcion`, `creado_en`) VALUES
(1, 19, NULL, 'otro', 'prueba de incidencia', '2026-09-06 15:39:20'),
(2, 19, NULL, 'novedad', 'otra prueba, esta vez de una novedad', '2026-09-06 15:39:57'),
(3, 19, 36, 'sancion', 'Esta prueba es para probar una sancion a un jugador', '2026-09-06 15:40:24'),
(4, 19, NULL, 'protesta', 'Esta prueba es para probar una incidencia de tipo protesta', '2026-09-06 15:41:00');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `juegos`
--

CREATE TABLE `juegos` (
  `id` int NOT NULL,
  `temporada_categoria_id` int NOT NULL,
  `equipo_local_id` int NOT NULL,
  `equipo_visitante_id` int NOT NULL,
  `fecha` date NOT NULL,
  `hora` time DEFAULT NULL,
  `estadio_id` int DEFAULT NULL,
  `estado` enum('programado','jugado','suspendido','pospuesto','ganado_forfeit','ganado_mesa','ganado_retiro') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'programado',
  `equipo_ganador_id` int DEFAULT NULL,
  `carreras_local` smallint DEFAULT NULL,
  `carreras_visitante` smallint DEFAULT NULL,
  `hits_local` smallint DEFAULT NULL,
  `hits_visitante` smallint DEFAULT NULL,
  `errores_local` smallint DEFAULT NULL,
  `errores_visitante` smallint DEFAULT NULL,
  `arbitros` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `anotador_oficial` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mvp_roster_id` int DEFAULT NULL,
  `tiempo_juego` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `observacion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `anotador_id` int DEFAULT NULL,
  `resultado_aprobado` tinyint NOT NULL DEFAULT '0',
  `cargado_por_id` int DEFAULT NULL,
  `fecha_fin` date DEFAULT NULL,
  `ronda` enum('clasificatoria','eliminatoria') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `hora_inicio` time DEFAULT NULL,
  `hora_final` time DEFAULT NULL,
  `duracion_minutos` int DEFAULT NULL,
  `entidad_arbitros` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `entidad_anotador` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `juegos`
--

INSERT INTO `juegos` (`id`, `temporada_categoria_id`, `equipo_local_id`, `equipo_visitante_id`, `fecha`, `hora`, `estadio_id`, `estado`, `equipo_ganador_id`, `carreras_local`, `carreras_visitante`, `hits_local`, `hits_visitante`, `errores_local`, `errores_visitante`, `arbitros`, `anotador_oficial`, `mvp_roster_id`, `tiempo_juego`, `observacion`, `anotador_id`, `resultado_aprobado`, `cargado_por_id`, `fecha_fin`, `ronda`, `hora_inicio`, `hora_final`, `duracion_minutos`, `entidad_arbitros`, `entidad_anotador`) VALUES
(19, 6, 20, 17, '2026-09-08', '10:30:00', NULL, 'jugado', NULL, 12, 5, 16, 7, 1, 3, 'Quevedo / Martinez', 'email@gmail.com', NULL, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(20, 6, 18, 21, '2026-08-24', '14:20:00', NULL, 'jugado', NULL, 8, 4, 11, 5, 1, 3, 'Ponce / Lapietra', 'Jose Marin', NULL, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(21, 6, 21, 22, '2026-08-23', NULL, NULL, 'jugado', NULL, 12, 13, 18, 23, 3, 2, 'Correa / Leal', 'Jose Marin', NULL, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(22, 6, 18, 17, '2026-08-25', '10:00:00', NULL, 'jugado', NULL, 3, 11, 5, 16, 2, 0, 'Martinez / Quevedo', 'Jose Marin', NULL, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(23, 7, 23, 24, '2026-09-13', '09:00:00', NULL, 'jugado', NULL, 7, 5, 8, 3, 1, 3, 'JUAN DURAN / LUIS OLIVEROS', 'JOSE QUEVEDO', NULL, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `juego_arbitros`
--

CREATE TABLE `juego_arbitros` (
  `id` int NOT NULL,
  `juego_id` int NOT NULL,
  `arbitro_id` int NOT NULL,
  `rol` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `jugadores`
--

CREATE TABLE `jugadores` (
  `id` int NOT NULL,
  `nombres` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `apellidos` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_nacimiento` date DEFAULT NULL,
  `email` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telefono` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `foto_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lado` enum('derecho','zurdo','ambidiestro') COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `jugadores`
--

INSERT INTO `jugadores` (`id`, `nombres`, `apellidos`, `fecha_nacimiento`, `email`, `telefono`, `foto_url`, `lado`) VALUES
(1, 'Juan', 'Pérez', NULL, NULL, NULL, NULL, NULL),
(2, 'Pedro', 'Gómez', NULL, NULL, NULL, NULL, NULL),
(3, 'Roberto ', 'Sanchez', NULL, NULL, NULL, NULL, NULL),
(4, 'Luis', 'Martínez', '2005-03-14', NULL, NULL, NULL, NULL),
(5, 'Carlos', 'Rojas', '2004-07-22', NULL, NULL, NULL, NULL),
(6, 'Andrés', 'Silva', '2005-01-09', NULL, NULL, NULL, NULL),
(7, 'Miguel', 'Torres', '2004-11-30', NULL, NULL, NULL, NULL),
(8, 'Pedro', 'Gómez', '2004-05-18', NULL, NULL, NULL, NULL),
(9, 'José', 'Hernández', '2005-02-02', NULL, NULL, NULL, NULL),
(10, 'Ronald', 'Pérez', '2004-09-12', NULL, NULL, NULL, NULL),
(11, 'Daniel', 'Castro', '2005-06-25', NULL, NULL, NULL, NULL),
(12, 'Víctor', 'Ramírez', '2004-04-03', NULL, NULL, NULL, NULL),
(13, 'Fernando', 'Díaz', '2005-08-19', NULL, NULL, NULL, NULL),
(14, 'Eduardo', 'Flores', '2004-12-01', NULL, NULL, NULL, NULL),
(15, 'Ricardo', 'Morales', '2005-05-05', NULL, NULL, NULL, NULL),
(16, 'Gustavo', 'Vargas', '2004-10-10', NULL, NULL, NULL, NULL),
(17, 'p', 'p', '1991-06-03', NULL, NULL, 'http://localhost:4000/uploads/jugadores/1786474926723-772018783.png', NULL),
(18, 'JOSE', 'QUEVEDO', NULL, NULL, NULL, NULL, NULL),
(19, 'Reyden', 'Hidalgo', NULL, NULL, NULL, NULL, NULL),
(20, 'Axcel', 'Hidalgo', NULL, NULL, NULL, NULL, NULL),
(21, 'Wilton', 'Mendez', NULL, NULL, NULL, NULL, NULL),
(22, 'Reyden', 'Hidalgo', NULL, NULL, NULL, NULL, NULL),
(23, 'Acxel', 'Hidalgo', NULL, NULL, NULL, NULL, NULL),
(24, 'Wilton', 'Mendez', NULL, NULL, NULL, NULL, NULL),
(25, 'Carlos', 'Cardozo', NULL, NULL, NULL, NULL, NULL),
(26, 'Anibal', 'Carmona', NULL, NULL, NULL, NULL, NULL),
(27, 'Junior', 'Almao', NULL, NULL, NULL, NULL, 'derecho'),
(28, 'Alberto ', 'Garcia', NULL, NULL, NULL, NULL, 'derecho'),
(29, 'Manuel', 'Cabello', NULL, NULL, NULL, NULL, 'zurdo'),
(30, 'Juan ', 'Morales', NULL, NULL, NULL, NULL, NULL),
(31, 'Estewin', 'Delgado', NULL, NULL, NULL, NULL, 'derecho'),
(32, 'Carlos ', 'Morales', NULL, NULL, NULL, NULL, 'derecho'),
(33, 'Luis', 'Benavides', NULL, NULL, NULL, NULL, 'derecho'),
(34, 'Luis', 'Barrios', NULL, NULL, NULL, NULL, 'derecho'),
(35, 'Jhoan', 'Lopez', NULL, NULL, NULL, NULL, 'zurdo'),
(36, 'Julio', 'Garcia', NULL, NULL, NULL, NULL, 'derecho'),
(37, 'Ibrahan', 'Uzcategui', NULL, NULL, NULL, NULL, 'zurdo'),
(38, 'JOSE ', 'QUEVEDO', NULL, NULL, NULL, NULL, NULL),
(39, 'Jose Alberto', 'Marin Puertas', NULL, NULL, NULL, NULL, NULL),
(40, 'ACXEL', 'LEON', NULL, NULL, NULL, NULL, NULL),
(41, 'CARLOS', 'MARIN', NULL, NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pagos_mensualidad`
--

CREATE TABLE `pagos_mensualidad` (
  `id` int NOT NULL,
  `jugador_id` int NOT NULL,
  `periodo` char(7) COLLATE utf8mb4_unicode_ci NOT NULL,
  `referencia` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `telefono_origen` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_pago` date NOT NULL,
  `creado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pitcheo_juego`
--

CREATE TABLE `pitcheo_juego` (
  `id` int NOT NULL,
  `juego_id` int NOT NULL,
  `roster_id` int NOT NULL,
  `i` int NOT NULL DEFAULT '0',
  `r` int NOT NULL DEFAULT '0',
  `c` int NOT NULL DEFAULT '0',
  `g` tinyint DEFAULT '0',
  `p` tinyint DEFAULT '0',
  `s` tinyint DEFAULT '0',
  `e` tinyint DEFAULT '0',
  `vb_enfrentados` tinyint DEFAULT '0',
  `hp` tinyint DEFAULT '0',
  `h2` tinyint DEFAULT '0',
  `h3` tinyint DEFAULT '0',
  `hr` tinyint DEFAULT '0',
  `il` decimal(4,2) DEFAULT '0.00',
  `tl` smallint DEFAULT '0',
  `cp` tinyint DEFAULT '0',
  `cl` tinyint DEFAULT '0',
  `so` tinyint DEFAULT '0',
  `bb` tinyint DEFAULT '0',
  `bi` tinyint DEFAULT '0',
  `sf` tinyint DEFAULT '0',
  `gp` tinyint DEFAULT '0',
  `wp` tinyint DEFAULT '0',
  `bk` tinyint DEFAULT '0',
  `aprobado` tinyint NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `roster`
--

CREATE TABLE `roster` (
  `id` int NOT NULL,
  `jugador_id` int NOT NULL,
  `equipo_inscrito_id` int NOT NULL,
  `numero_camiseta` smallint DEFAULT NULL,
  `posicion_principal` varchar(3) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `roster`
--

INSERT INTO `roster` (`id`, `jugador_id`, `equipo_inscrito_id`, `numero_camiseta`, `posicion_principal`, `activo`) VALUES
(32, 20, 18, 23, NULL, 1),
(33, 24, 18, 2, NULL, 1),
(34, 22, 18, 54, NULL, 1),
(35, 8, 18, 21, NULL, 1),
(36, 27, 20, 17, NULL, 1),
(37, 28, 20, 21, NULL, 1),
(38, 29, 20, 3, NULL, 1),
(39, 30, 20, 24, NULL, 1),
(40, 31, 20, 14, NULL, 1),
(41, 32, 20, 1, NULL, 1),
(42, 33, 20, 6, NULL, 1),
(43, 34, 20, 65, NULL, 1),
(44, 35, 20, 30, NULL, 1),
(45, 36, 20, 11, NULL, 1),
(46, 37, 20, 33, NULL, 1),
(47, 38, 23, 9, NULL, 1),
(48, 39, 23, 13, NULL, 1),
(49, 40, 24, 5, NULL, 1),
(50, 41, 24, 12, NULL, 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `roster_posiciones`
--

CREATE TABLE `roster_posiciones` (
  `id` int NOT NULL,
  `roster_id` int NOT NULL,
  `posicion` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `orden` tinyint DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `temporadas`
--

CREATE TABLE `temporadas` (
  `id` int NOT NULL,
  `nombre` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_inicio` date DEFAULT NULL,
  `fecha_fin` date DEFAULT NULL,
  `activa` tinyint(1) NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `temporadas`
--

INSERT INTO `temporadas` (`id`, `nombre`, `fecha_inicio`, `fecha_fin`, `activa`) VALUES
(4, 'Torneo Intersectorial Dos Lagunas 2026', '2026-08-01', NULL, 1),
(5, 'Beisbol Menor 2026 -2027', '2026-09-14', NULL, 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `temporada_categoria`
--

CREATE TABLE `temporada_categoria` (
  `id` int NOT NULL,
  `temporada_id` int NOT NULL,
  `categoria_id` int NOT NULL,
  `copa_nombre` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `posiciones_al_fecha` date DEFAULT NULL,
  `recopilador` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `temporada_categoria`
--

INSERT INTO `temporada_categoria` (`id`, `temporada_id`, `categoria_id`, `copa_nombre`, `posiciones_al_fecha`, `recopilador`) VALUES
(6, 4, 4, 'Torneo Intersectorial', NULL, NULL),
(7, 5, 5, 'COPA: LUIS DIAZ', NULL, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `torneos`
--

CREATE TABLE `torneos` (
  `id` int NOT NULL,
  `temporada_categoria_id` int NOT NULL,
  `nombre` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `activo` tinyint DEFAULT '1',
  `creado_en` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `torneos`
--

INSERT INTO `torneos` (`id`, `temporada_categoria_id`, `nombre`, `descripcion`, `activo`, `creado_en`) VALUES
(3, 7, 'COPA LUIS DIAZ', NULL, 1, '2026-09-14 19:27:55');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `torneo_cruces`
--

CREATE TABLE `torneo_cruces` (
  `id` int NOT NULL,
  `fase_id` int NOT NULL,
  `equipo_local_id` int DEFAULT NULL,
  `equipo_visitante_id` int DEFAULT NULL,
  `juego_id` int DEFAULT NULL,
  `orden` tinyint DEFAULT '1',
  `equipo_ganador_id` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `torneo_cruces`
--

INSERT INTO `torneo_cruces` (`id`, `fase_id`, `equipo_local_id`, `equipo_visitante_id`, `juego_id`, `orden`, `equipo_ganador_id`) VALUES
(20, 7, 23, 24, 23, 1, 23);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `torneo_fases`
--

CREATE TABLE `torneo_fases` (
  `id` int NOT NULL,
  `torneo_id` int NOT NULL,
  `nombre` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `orden` tinyint NOT NULL,
  `num_equipos` tinyint NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `torneo_fases`
--

INSERT INTO `torneo_fases` (`id`, `torneo_id`, `nombre`, `orden`, `num_equipos`) VALUES
(7, 3, 'Cuartos de Final', 1, 8),
(8, 3, 'Semifinal', 2, 4),
(9, 3, 'Final', 3, 2);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int NOT NULL,
  `email` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rol` enum('administrador','anotador','jugador') COLLATE utf8mb4_unicode_ci NOT NULL,
  `jugador_id` int DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `creado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `equipo_inscrito_id` int DEFAULT NULL
) ;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id`, `email`, `password_hash`, `rol`, `jugador_id`, `activo`, `creado_en`, `equipo_inscrito_id`) VALUES
(1, 'tucorreo@ejemplo.com', '$2a$10$4usUfi26DRiyyaGd1LeIRuReT5bWq6NhJm88QIZnne5zxnUx40046', 'administrador', NULL, 1, '2026-08-11 09:27:13', NULL),
(2, 'anotador@liga.com', '$2a$10$t4BSLtIyrfL6sUSw2js0G.n8KT/CbUplyslA5raWTlhJpmJCbot7a', 'anotador', NULL, 1, '2026-08-19 08:49:14', NULL),
(3, 'email@gmail.com', '$2a$10$XxtbN0OpDzVetRtieEEEBuuHWwL28Epz693qb9ne3QLxWnwEA/IOe', 'anotador', NULL, 1, '2026-09-06 16:57:37', 20);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `vw_bateo_acumulado`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `vw_bateo_acumulado` (
`al` decimal(32,0)
,`alcanzó_error` decimal(27,0)
,`apellidos` varchar(80)
,`ba` decimal(30,0)
,`bases_alcanzadas_manual` decimal(27,0)
,`bases_por_bolas` decimal(27,0)
,`bases_robadas` decimal(27,0)
,`carreras_anotadas` decimal(27,0)
,`carreras_impulsadas` decimal(27,0)
,`dobles` decimal(27,0)
,`equipo` varchar(80)
,`equipo_inscrito_id` int
,`foto_url` varchar(500)
,`golpeado_pitcher` decimal(27,0)
,`hits` decimal(27,0)
,`interferencias` decimal(27,0)
,`jonrones` decimal(27,0)
,`juegos_jugados` bigint
,`lado` enum('derecho','zurdo','ambidiestro')
,`logo_url` varchar(255)
,`nombres` varchar(80)
,`numero_camiseta` smallint
,`outs_robando` decimal(27,0)
,`ponches` decimal(27,0)
,`posicion_principal` varchar(3)
,`promedio_bateo` decimal(32,0)
,`roster_id` int
,`sacrifice_fly` decimal(27,0)
,`sacrifice_hit` decimal(27,0)
,`slugging` decimal(35,0)
,`temporada_categoria_id` int
,`triples` decimal(27,0)
,`vb` decimal(27,0)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `vw_fildeo_acumulado`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `vw_fildeo_acumulado` (
`apellidos` varchar(80)
,`asistencias` decimal(27,0)
,`ave_fildeo` decimal(33,0)
,`dificultad` decimal(27,0)
,`doble_plays` decimal(27,0)
,`equipo` varchar(80)
,`equipo_inscrito_id` int
,`errores` decimal(27,0)
,`innings_jugados` decimal(27,2)
,`interferencias` decimal(27,0)
,`juegos_jugados` bigint
,`nombres` varchar(80)
,`outs` decimal(27,0)
,`outs_robando` decimal(27,0)
,`passed_balls` decimal(27,0)
,`posicion` enum('P','C','1B','2B','3B','SS','LF','CF','RF')
,`roster_id` int
,`temporada_categoria_id` int
,`total_lances` decimal(27,0)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `vw_pitcheo_acumulado`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `vw_pitcheo_acumulado` (
`apellidos` varchar(80)
,`carreras_limpias` decimal(27,0)
,`efectividad` decimal(34,3)
,`equipo` varchar(80)
,`equipo_inscrito_id` int
,`foto_url` varchar(500)
,`ganados` decimal(25,0)
,`innings_lanzados` decimal(27,2)
,`logo_url` varchar(255)
,`nombres` varchar(80)
,`numero_camiseta` smallint
,`perdidos` decimal(25,0)
,`ponches` decimal(27,0)
,`roster_id` int
,`salvados` decimal(25,0)
,`temporada_categoria_id` int
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `vw_tabla_posiciones`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `vw_tabla_posiciones` (
`ave` decimal(28,0)
,`bce` decimal(33,2)
,`carreras_anotadas` decimal(27,0)
,`carreras_permitidas` decimal(27,0)
,`dc` decimal(28,0)
,`equipo` varchar(80)
,`equipo_inscrito_id` int
,`grupo` varchar(5)
,`ijd` decimal(49,2)
,`ijo` decimal(49,2)
,`je` decimal(23,0)
,`jg` decimal(23,0)
,`jj` bigint
,`jp` decimal(23,0)
,`logo_url` varchar(255)
,`media1` decimal(32,2)
,`media2` decimal(32,2)
,`ptos` decimal(25,0)
,`rend` decimal(27,0)
,`temporada_categoria_id` int
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `vw_torneo_cruces`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `vw_torneo_cruces` (
`carreras_local` smallint
,`carreras_visitante` smallint
,`cruce_id` int
,`equipo_ganador` varchar(80)
,`equipo_ganador_id` int
,`equipo_local` varchar(80)
,`equipo_local_id` int
,`equipo_visitante` varchar(80)
,`equipo_visitante_id` int
,`fase_id` int
,`fase_nombre` varchar(80)
,`fase_orden` tinyint
,`juego_estado` enum('programado','jugado','suspendido','pospuesto','ganado_forfeit','ganado_mesa','ganado_retiro')
,`juego_fecha` date
,`juego_hora` time
,`juego_id` int
,`logo_local` varchar(255)
,`logo_visitante` varchar(255)
,`orden` tinyint
,`temporada_categoria_id` int
,`torneo_id` int
,`torneo_nombre` varchar(120)
);

-- --------------------------------------------------------

--
-- Estructura para la vista `vw_bateo_acumulado`
--
DROP TABLE IF EXISTS `vw_bateo_acumulado`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_bateo_acumulado`  AS SELECT `r`.`id` AS `roster_id`, `r`.`numero_camiseta` AS `numero_camiseta`, `jg`.`nombres` AS `nombres`, `jg`.`apellidos` AS `apellidos`, `jg`.`foto_url` AS `foto_url`, `jg`.`lado` AS `lado`, `ei`.`temporada_categoria_id` AS `temporada_categoria_id`, `ei`.`id` AS `equipo_inscrito_id`, `eq`.`nombre` AS `equipo`, `eq`.`logo_url` AS `logo_url`, `r`.`posicion_principal` AS `posicion_principal`, count(distinct `eb`.`juego_id`) AS `juegos_jugados`, sum(`eb`.`vb`) AS `vb`, sum(`eb`.`ca`) AS `carreras_anotadas`, sum(`eb`.`hc`) AS `hits`, sum(`eb`.`bb`) AS `bases_por_bolas`, sum(`eb`.`sh`) AS `sacrifice_hit`, sum(`eb`.`sf`) AS `sacrifice_fly`, sum(`eb`.`gp`) AS `golpeado_pitcher`, sum(`eb`.`in_`) AS `interferencias`, sum(`eb`.`al`) AS `alcanzó_error`, sum(`eb`.`h2`) AS `dobles`, sum(`eb`.`h3`) AS `triples`, sum(`eb`.`hr`) AS `jonrones`, sum(`eb`.`ba`) AS `bases_alcanzadas_manual`, sum(`eb`.`ci`) AS `carreras_impulsadas`, sum(`eb`.`br`) AS `bases_robadas`, sum(`eb`.`or_`) AS `outs_robando`, sum(`eb`.`so`) AS `ponches`, sum((((((`eb`.`vb` + `eb`.`bb`) + `eb`.`sh`) + `eb`.`sf`) + `eb`.`gp`) + `eb`.`in_`)) AS `al`, sum((((`eb`.`hc` + `eb`.`h2`) + `eb`.`h3`) + `eb`.`hr`)) AS `ba`, round(((sum(`eb`.`hc`) / nullif(sum(`eb`.`vb`),0)) * 1000),0) AS `promedio_bateo`, round((((((sum(`eb`.`hc`) + sum(`eb`.`h2`)) + (2 * sum(`eb`.`h3`))) + (3 * sum(`eb`.`hr`))) / nullif(sum(`eb`.`vb`),0)) * 1000),0) AS `slugging` FROM ((((`est_bateo` `eb` join `roster` `r` on((`r`.`id` = `eb`.`roster_id`))) join `jugadores` `jg` on((`jg`.`id` = `r`.`jugador_id`))) join `equipos_inscritos` `ei` on((`ei`.`id` = `r`.`equipo_inscrito_id`))) join `equipos` `eq` on((`eq`.`id` = `ei`.`equipo_id`))) WHERE (`eb`.`aprobado` = 1) GROUP BY `r`.`id`, `r`.`numero_camiseta`, `jg`.`nombres`, `jg`.`apellidos`, `jg`.`foto_url`, `jg`.`lado`, `ei`.`temporada_categoria_id`, `ei`.`id`, `eq`.`nombre`, `eq`.`logo_url`, `r`.`posicion_principal` ;

-- --------------------------------------------------------

--
-- Estructura para la vista `vw_fildeo_acumulado`
--
DROP TABLE IF EXISTS `vw_fildeo_acumulado`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_fildeo_acumulado`  AS SELECT `r`.`id` AS `roster_id`, `jg`.`nombres` AS `nombres`, `jg`.`apellidos` AS `apellidos`, `ei`.`temporada_categoria_id` AS `temporada_categoria_id`, `ei`.`id` AS `equipo_inscrito_id`, `eq`.`nombre` AS `equipo`, `ef`.`posicion` AS `posicion`, count(distinct `ef`.`juego_id`) AS `juegos_jugados`, sum(`ef`.`ij`) AS `innings_jugados`, sum(`ef`.`o`) AS `outs`, sum(`ef`.`a`) AS `asistencias`, sum(`ef`.`e`) AS `errores`, sum(`ef`.`tl`) AS `total_lances`, sum(`ef`.`dp`) AS `doble_plays`, sum(`ef`.`di`) AS `dificultad`, round((((sum(`ef`.`o`) + sum(`ef`.`a`)) / nullif(((sum(`ef`.`o`) + sum(`ef`.`a`)) + sum(`ef`.`e`)),0)) * 1000),0) AS `ave_fildeo`, sum(`ef`.`pb`) AS `passed_balls`, sum(`ef`.`ir`) AS `interferencias`, sum(`ef`.`or_`) AS `outs_robando` FROM ((((`est_fildeo` `ef` join `roster` `r` on((`r`.`id` = `ef`.`roster_id`))) join `jugadores` `jg` on((`jg`.`id` = `r`.`jugador_id`))) join `equipos_inscritos` `ei` on((`ei`.`id` = `r`.`equipo_inscrito_id`))) join `equipos` `eq` on((`eq`.`id` = `ei`.`equipo_id`))) WHERE (`ef`.`aprobado` = 1) GROUP BY `r`.`id`, `jg`.`nombres`, `jg`.`apellidos`, `ei`.`temporada_categoria_id`, `ei`.`id`, `eq`.`nombre`, `ef`.`posicion` ;

-- --------------------------------------------------------

--
-- Estructura para la vista `vw_pitcheo_acumulado`
--
DROP TABLE IF EXISTS `vw_pitcheo_acumulado`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_pitcheo_acumulado`  AS SELECT `r`.`id` AS `roster_id`, `r`.`numero_camiseta` AS `numero_camiseta`, `jg`.`nombres` AS `nombres`, `jg`.`apellidos` AS `apellidos`, `jg`.`foto_url` AS `foto_url`, `ei`.`temporada_categoria_id` AS `temporada_categoria_id`, `ei`.`id` AS `equipo_inscrito_id`, `eq`.`nombre` AS `equipo`, `eq`.`logo_url` AS `logo_url`, sum(`ep`.`g`) AS `ganados`, sum(`ep`.`p`) AS `perdidos`, sum(`ep`.`s`) AS `salvados`, sum(`ep`.`il`) AS `innings_lanzados`, sum(`ep`.`so`) AS `ponches`, sum(`ep`.`cl`) AS `carreras_limpias`, round(((sum(`ep`.`cl`) * 7) / nullif(sum(`ep`.`il`),0)),3) AS `efectividad` FROM ((((`est_pitcheo` `ep` join `roster` `r` on((`r`.`id` = `ep`.`roster_id`))) join `jugadores` `jg` on((`jg`.`id` = `r`.`jugador_id`))) join `equipos_inscritos` `ei` on((`ei`.`id` = `r`.`equipo_inscrito_id`))) join `equipos` `eq` on((`eq`.`id` = `ei`.`equipo_id`))) WHERE (`ep`.`aprobado` = 1) GROUP BY `r`.`id`, `r`.`numero_camiseta`, `jg`.`nombres`, `jg`.`apellidos`, `jg`.`foto_url`, `ei`.`temporada_categoria_id`, `ei`.`id`, `eq`.`nombre`, `eq`.`logo_url` ;

-- --------------------------------------------------------

--
-- Estructura para la vista `vw_tabla_posiciones`
--
DROP TABLE IF EXISTS `vw_tabla_posiciones`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_tabla_posiciones`  AS SELECT `base`.`equipo_inscrito_id` AS `equipo_inscrito_id`, `base`.`temporada_categoria_id` AS `temporada_categoria_id`, `base`.`grupo` AS `grupo`, `base`.`equipo` AS `equipo`, `base`.`logo_url` AS `logo_url`, `base`.`jj` AS `jj`, `base`.`jg` AS `jg`, `base`.`jp` AS `jp`, `base`.`je` AS `je`, round(((`base`.`jg` / nullif(`base`.`jj`,0)) * 1000),0) AS `ave`, ((`base`.`jg` * 3) + `base`.`je`) AS `ptos`, round(((`base`.`jg` / nullif(`base`.`jj`,0)) * 100),0) AS `rend`, `base`.`carreras_anotadas` AS `carreras_anotadas`, `innings`.`ijo` AS `ijo`, round((`base`.`carreras_anotadas` / nullif(`innings`.`ijo`,0)),2) AS `media1`, `base`.`carreras_permitidas` AS `carreras_permitidas`, `innings`.`ijd` AS `ijd`, round((`base`.`carreras_permitidas` / nullif(`innings`.`ijd`,0)),2) AS `media2`, round(((`base`.`carreras_anotadas` / nullif(`innings`.`ijo`,0)) - (`base`.`carreras_permitidas` / nullif(`innings`.`ijd`,0))),2) AS `bce`, (`base`.`carreras_anotadas` - `base`.`carreras_permitidas`) AS `dc` FROM ((select `ei`.`id` AS `equipo_inscrito_id`,`ei`.`temporada_categoria_id` AS `temporada_categoria_id`,`ei`.`grupo` AS `grupo`,`e`.`nombre` AS `equipo`,`e`.`logo_url` AS `logo_url`,count(`j`.`id`) AS `jj`,sum((case when (((`j`.`equipo_local_id` = `ei`.`id`) and (`j`.`estado` = 'jugado') and (`j`.`resultado_aprobado` = 1) and (`j`.`carreras_local` > `j`.`carreras_visitante`)) or ((`j`.`equipo_visitante_id` = `ei`.`id`) and (`j`.`estado` = 'jugado') and (`j`.`resultado_aprobado` = 1) and (`j`.`carreras_visitante` > `j`.`carreras_local`)) or ((`j`.`estado` in ('ganado_forfeit','ganado_mesa','ganado_retiro')) and (`j`.`resultado_aprobado` = 1) and (`j`.`equipo_ganador_id` = `ei`.`id`))) then 1 else 0 end)) AS `jg`,sum((case when (((`j`.`equipo_local_id` = `ei`.`id`) and (`j`.`estado` = 'jugado') and (`j`.`resultado_aprobado` = 1) and (`j`.`carreras_local` < `j`.`carreras_visitante`)) or ((`j`.`equipo_visitante_id` = `ei`.`id`) and (`j`.`estado` = 'jugado') and (`j`.`resultado_aprobado` = 1) and (`j`.`carreras_visitante` < `j`.`carreras_local`)) or ((`j`.`estado` in ('ganado_forfeit','ganado_mesa','ganado_retiro')) and (`j`.`resultado_aprobado` = 1) and (`j`.`equipo_ganador_id` <> `ei`.`id`))) then 1 else 0 end)) AS `jp`,sum((case when ((`j`.`estado` = 'jugado') and (`j`.`resultado_aprobado` = 1) and (`j`.`carreras_local` = `j`.`carreras_visitante`)) then 1 else 0 end)) AS `je`,sum((case when (`j`.`equipo_local_id` = `ei`.`id`) then coalesce(`j`.`carreras_local`,0) else coalesce(`j`.`carreras_visitante`,0) end)) AS `carreras_anotadas`,sum((case when (`j`.`equipo_local_id` = `ei`.`id`) then coalesce(`j`.`carreras_visitante`,0) else coalesce(`j`.`carreras_local`,0) end)) AS `carreras_permitidas` from ((`equipos_inscritos` `ei` join `equipos` `e` on((`e`.`id` = `ei`.`equipo_id`))) left join `juegos` `j` on((((`j`.`equipo_local_id` = `ei`.`id`) or (`j`.`equipo_visitante_id` = `ei`.`id`)) and (`j`.`estado` in ('jugado','ganado_forfeit','ganado_mesa','ganado_retiro')) and (`j`.`resultado_aprobado` = 1)))) group by `ei`.`id`,`ei`.`temporada_categoria_id`,`ei`.`grupo`,`e`.`nombre`,`e`.`logo_url`) `base` left join (select `ie`.`equipo_inscrito_id` AS `equipo_inscrito_id`,sum(coalesce(`propio`.`il_total`,0)) AS `ijd`,sum(coalesce(`rival`.`il_total`,0)) AS `ijo` from (((select `j`.`id` AS `juego_id`,`j`.`equipo_local_id` AS `equipo_inscrito_id` from `juegos` `j` where ((`j`.`estado` = 'jugado') and (`j`.`resultado_aprobado` = 1)) union all select `j`.`id` AS `juego_id`,`j`.`equipo_visitante_id` AS `equipo_inscrito_id` from `juegos` `j` where ((`j`.`estado` = 'jugado') and (`j`.`resultado_aprobado` = 1))) `ie` left join (select `ep`.`juego_id` AS `juego_id`,`r`.`equipo_inscrito_id` AS `equipo_inscrito_id`,sum(`ep`.`il`) AS `il_total` from (`est_pitcheo` `ep` join `roster` `r` on((`r`.`id` = `ep`.`roster_id`))) where (`ep`.`aprobado` = 1) group by `ep`.`juego_id`,`r`.`equipo_inscrito_id`) `propio` on(((`propio`.`juego_id` = `ie`.`juego_id`) and (`propio`.`equipo_inscrito_id` = `ie`.`equipo_inscrito_id`)))) left join (select `ep`.`juego_id` AS `juego_id`,`r`.`equipo_inscrito_id` AS `equipo_inscrito_id`,sum(`ep`.`il`) AS `il_total` from (`est_pitcheo` `ep` join `roster` `r` on((`r`.`id` = `ep`.`roster_id`))) where (`ep`.`aprobado` = 1) group by `ep`.`juego_id`,`r`.`equipo_inscrito_id`) `rival` on(((`rival`.`juego_id` = `ie`.`juego_id`) and (`rival`.`equipo_inscrito_id` <> `ie`.`equipo_inscrito_id`)))) group by `ie`.`equipo_inscrito_id`) `innings` on((`innings`.`equipo_inscrito_id` = `base`.`equipo_inscrito_id`))) ;

-- --------------------------------------------------------

--
-- Estructura para la vista `vw_torneo_cruces`
--
DROP TABLE IF EXISTS `vw_torneo_cruces`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_torneo_cruces`  AS SELECT `tc`.`id` AS `cruce_id`, `tc`.`fase_id` AS `fase_id`, `tc`.`orden` AS `orden`, `tf`.`nombre` AS `fase_nombre`, `tf`.`orden` AS `fase_orden`, `tf`.`torneo_id` AS `torneo_id`, `t`.`nombre` AS `torneo_nombre`, `t`.`temporada_categoria_id` AS `temporada_categoria_id`, `tc`.`equipo_local_id` AS `equipo_local_id`, `el`.`nombre` AS `equipo_local`, `elog`.`logo_url` AS `logo_local`, `tc`.`equipo_visitante_id` AS `equipo_visitante_id`, `ev`.`nombre` AS `equipo_visitante`, `evlog`.`logo_url` AS `logo_visitante`, `tc`.`juego_id` AS `juego_id`, `j`.`fecha` AS `juego_fecha`, `j`.`hora` AS `juego_hora`, `j`.`estado` AS `juego_estado`, `j`.`carreras_local` AS `carreras_local`, `j`.`carreras_visitante` AS `carreras_visitante`, `tc`.`equipo_ganador_id` AS `equipo_ganador_id`, `eg`.`nombre` AS `equipo_ganador` FROM (((((((((((`torneo_cruces` `tc` join `torneo_fases` `tf` on((`tf`.`id` = `tc`.`fase_id`))) join `torneos` `t` on((`t`.`id` = `tf`.`torneo_id`))) join `equipos_inscritos` `eil` on((`eil`.`id` = `tc`.`equipo_local_id`))) join `equipos` `el` on((`el`.`id` = `eil`.`equipo_id`))) join `equipos_inscritos` `eiv` on((`eiv`.`id` = `tc`.`equipo_visitante_id`))) join `equipos` `ev` on((`ev`.`id` = `eiv`.`equipo_id`))) left join `juegos` `j` on((`j`.`id` = `tc`.`juego_id`))) left join `equipos_inscritos` `egei` on((`egei`.`id` = `tc`.`equipo_ganador_id`))) left join `equipos` `eg` on((`eg`.`id` = `egei`.`equipo_id`))) left join `equipos` `elog` on((`elog`.`id` = `eil`.`equipo_id`))) left join `equipos` `evlog` on((`evlog`.`id` = `eiv`.`equipo_id`))) ORDER BY `tf`.`orden` ASC, `tc`.`orden` ASC ;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `arbitros`
--
ALTER TABLE `arbitros`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `bateo_juego`
--
ALTER TABLE `bateo_juego`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_bateo` (`juego_id`,`roster_id`),
  ADD KEY `idx_bateo_roster` (`roster_id`);

--
-- Indices de la tabla `categorias`
--
ALTER TABLE `categorias`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_categoria` (`disciplina_id`,`nombre`);

--
-- Indices de la tabla `contenido_sitio`
--
ALTER TABLE `contenido_sitio`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `control_lanzadores`
--
ALTER TABLE `control_lanzadores`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_control` (`roster_id`,`fecha`),
  ADD KEY `juego_id` (`juego_id`);

--
-- Indices de la tabla `control_lanzadores_reglas`
--
ALTER TABLE `control_lanzadores_reglas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `categoria_id` (`categoria_id`);

--
-- Indices de la tabla `disciplinas`
--
ALTER TABLE `disciplinas`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indices de la tabla `entradas_juego`
--
ALTER TABLE `entradas_juego`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_entrada` (`juego_id`,`equipo_inscrito_id`,`numero_entrada`),
  ADD KEY `fk_entradas_equipo_inscrito` (`equipo_inscrito_id`);

--
-- Indices de la tabla `equipos`
--
ALTER TABLE `equipos`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `equipos_inscritos`
--
ALTER TABLE `equipos_inscritos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_equipo_temp_cat` (`equipo_id`,`temporada_categoria_id`),
  ADD KEY `fk_ei_temporada_categoria` (`temporada_categoria_id`);

--
-- Indices de la tabla `estadios`
--
ALTER TABLE `estadios`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `est_bateo`
--
ALTER TABLE `est_bateo`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_est_bateo` (`juego_id`,`roster_id`),
  ADD KEY `roster_id` (`roster_id`);

--
-- Indices de la tabla `est_fildeo`
--
ALTER TABLE `est_fildeo`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_est_fildeo` (`juego_id`,`roster_id`,`posicion`),
  ADD KEY `roster_id` (`roster_id`);

--
-- Indices de la tabla `est_pitcheo`
--
ALTER TABLE `est_pitcheo`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_est_pitcheo` (`juego_id`,`roster_id`),
  ADD KEY `roster_id` (`roster_id`);

--
-- Indices de la tabla `fotos`
--
ALTER TABLE `fotos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `juego_id` (`juego_id`);

--
-- Indices de la tabla `incidencias`
--
ALTER TABLE `incidencias`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_incidencias_juego` (`juego_id`),
  ADD KEY `fk_incidencias_roster` (`roster_id`);

--
-- Indices de la tabla `juegos`
--
ALTER TABLE `juegos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `estadio_id` (`estadio_id`),
  ADD KEY `mvp_roster_id` (`mvp_roster_id`),
  ADD KEY `idx_juegos_temp_cat_fecha` (`temporada_categoria_id`,`fecha`),
  ADD KEY `fk_juegos_anotador` (`anotador_id`),
  ADD KEY `fk_juegos_cargado_por` (`cargado_por_id`),
  ADD KEY `fk_juegos_ganador2` (`equipo_ganador_id`),
  ADD KEY `fk_juegos_local` (`equipo_local_id`),
  ADD KEY `fk_juegos_visitante` (`equipo_visitante_id`);

--
-- Indices de la tabla `juego_arbitros`
--
ALTER TABLE `juego_arbitros`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_juego_arbitro` (`juego_id`,`arbitro_id`),
  ADD KEY `fk_juego_arbitros_arbitro` (`arbitro_id`);

--
-- Indices de la tabla `jugadores`
--
ALTER TABLE `jugadores`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `pagos_mensualidad`
--
ALTER TABLE `pagos_mensualidad`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_pago_jugador_periodo` (`jugador_id`,`periodo`);

--
-- Indices de la tabla `pitcheo_juego`
--
ALTER TABLE `pitcheo_juego`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_pitcheo` (`juego_id`,`roster_id`),
  ADD KEY `idx_pitcheo_roster` (`roster_id`);

--
-- Indices de la tabla `roster`
--
ALTER TABLE `roster`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_jugador_equipo_temp` (`jugador_id`,`equipo_inscrito_id`),
  ADD KEY `idx_roster_equipo` (`equipo_inscrito_id`);

--
-- Indices de la tabla `roster_posiciones`
--
ALTER TABLE `roster_posiciones`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_roster_pos` (`roster_id`,`posicion`);

--
-- Indices de la tabla `temporadas`
--
ALTER TABLE `temporadas`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `temporada_categoria`
--
ALTER TABLE `temporada_categoria`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_temp_categoria` (`temporada_id`,`categoria_id`),
  ADD KEY `categoria_id` (`categoria_id`);

--
-- Indices de la tabla `torneos`
--
ALTER TABLE `torneos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `temporada_categoria_id` (`temporada_categoria_id`);

--
-- Indices de la tabla `torneo_cruces`
--
ALTER TABLE `torneo_cruces`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fase_id` (`fase_id`),
  ADD KEY `juego_id` (`juego_id`),
  ADD KEY `fk_torneo_cruces_local` (`equipo_local_id`),
  ADD KEY `fk_torneo_cruces_visitante` (`equipo_visitante_id`),
  ADD KEY `fk_torneo_cruces_ganador` (`equipo_ganador_id`);

--
-- Indices de la tabla `torneo_fases`
--
ALTER TABLE `torneo_fases`
  ADD PRIMARY KEY (`id`),
  ADD KEY `torneo_id` (`torneo_id`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `jugador_id` (`jugador_id`),
  ADD KEY `fk_usuarios_equipo` (`equipo_inscrito_id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `arbitros`
--
ALTER TABLE `arbitros`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `bateo_juego`
--
ALTER TABLE `bateo_juego`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT de la tabla `categorias`
--
ALTER TABLE `categorias`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `control_lanzadores`
--
ALTER TABLE `control_lanzadores`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `control_lanzadores_reglas`
--
ALTER TABLE `control_lanzadores_reglas`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `disciplinas`
--
ALTER TABLE `disciplinas`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `entradas_juego`
--
ALTER TABLE `entradas_juego`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `equipos`
--
ALTER TABLE `equipos`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT de la tabla `equipos_inscritos`
--
ALTER TABLE `equipos_inscritos`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT de la tabla `estadios`
--
ALTER TABLE `estadios`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `est_bateo`
--
ALTER TABLE `est_bateo`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT de la tabla `est_fildeo`
--
ALTER TABLE `est_fildeo`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT de la tabla `est_pitcheo`
--
ALTER TABLE `est_pitcheo`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- AUTO_INCREMENT de la tabla `fotos`
--
ALTER TABLE `fotos`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `incidencias`
--
ALTER TABLE `incidencias`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `juegos`
--
ALTER TABLE `juegos`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT de la tabla `juego_arbitros`
--
ALTER TABLE `juego_arbitros`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `jugadores`
--
ALTER TABLE `jugadores`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=42;

--
-- AUTO_INCREMENT de la tabla `pagos_mensualidad`
--
ALTER TABLE `pagos_mensualidad`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `pitcheo_juego`
--
ALTER TABLE `pitcheo_juego`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `roster`
--
ALTER TABLE `roster`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=51;

--
-- AUTO_INCREMENT de la tabla `roster_posiciones`
--
ALTER TABLE `roster_posiciones`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `temporadas`
--
ALTER TABLE `temporadas`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `temporada_categoria`
--
ALTER TABLE `temporada_categoria`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de la tabla `torneos`
--
ALTER TABLE `torneos`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `torneo_cruces`
--
ALTER TABLE `torneo_cruces`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT de la tabla `torneo_fases`
--
ALTER TABLE `torneo_fases`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `bateo_juego`
--
ALTER TABLE `bateo_juego`
  ADD CONSTRAINT `bateo_juego_ibfk_1` FOREIGN KEY (`juego_id`) REFERENCES `juegos` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `bateo_juego_ibfk_2` FOREIGN KEY (`roster_id`) REFERENCES `roster` (`id`);

--
-- Filtros para la tabla `categorias`
--
ALTER TABLE `categorias`
  ADD CONSTRAINT `categorias_ibfk_1` FOREIGN KEY (`disciplina_id`) REFERENCES `disciplinas` (`id`);

--
-- Filtros para la tabla `control_lanzadores`
--
ALTER TABLE `control_lanzadores`
  ADD CONSTRAINT `control_lanzadores_ibfk_1` FOREIGN KEY (`roster_id`) REFERENCES `roster` (`id`),
  ADD CONSTRAINT `control_lanzadores_ibfk_2` FOREIGN KEY (`juego_id`) REFERENCES `juegos` (`id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `control_lanzadores_reglas`
--
ALTER TABLE `control_lanzadores_reglas`
  ADD CONSTRAINT `control_lanzadores_reglas_ibfk_1` FOREIGN KEY (`categoria_id`) REFERENCES `categorias` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `entradas_juego`
--
ALTER TABLE `entradas_juego`
  ADD CONSTRAINT `entradas_juego_ibfk_1` FOREIGN KEY (`juego_id`) REFERENCES `juegos` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_entradas_equipo_inscrito` FOREIGN KEY (`equipo_inscrito_id`) REFERENCES `equipos_inscritos` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `equipos_inscritos`
--
ALTER TABLE `equipos_inscritos`
  ADD CONSTRAINT `equipos_inscritos_ibfk_1` FOREIGN KEY (`equipo_id`) REFERENCES `equipos` (`id`),
  ADD CONSTRAINT `fk_ei_temporada_categoria` FOREIGN KEY (`temporada_categoria_id`) REFERENCES `temporada_categoria` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `est_bateo`
--
ALTER TABLE `est_bateo`
  ADD CONSTRAINT `est_bateo_ibfk_1` FOREIGN KEY (`juego_id`) REFERENCES `juegos` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `est_bateo_ibfk_2` FOREIGN KEY (`roster_id`) REFERENCES `roster` (`id`);

--
-- Filtros para la tabla `est_fildeo`
--
ALTER TABLE `est_fildeo`
  ADD CONSTRAINT `est_fildeo_ibfk_1` FOREIGN KEY (`juego_id`) REFERENCES `juegos` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `est_fildeo_ibfk_2` FOREIGN KEY (`roster_id`) REFERENCES `roster` (`id`);

--
-- Filtros para la tabla `est_pitcheo`
--
ALTER TABLE `est_pitcheo`
  ADD CONSTRAINT `est_pitcheo_ibfk_1` FOREIGN KEY (`juego_id`) REFERENCES `juegos` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `est_pitcheo_ibfk_2` FOREIGN KEY (`roster_id`) REFERENCES `roster` (`id`);

--
-- Filtros para la tabla `fotos`
--
ALTER TABLE `fotos`
  ADD CONSTRAINT `fotos_ibfk_1` FOREIGN KEY (`juego_id`) REFERENCES `juegos` (`id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `incidencias`
--
ALTER TABLE `incidencias`
  ADD CONSTRAINT `fk_incidencias_juego` FOREIGN KEY (`juego_id`) REFERENCES `juegos` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_incidencias_roster` FOREIGN KEY (`roster_id`) REFERENCES `roster` (`id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `juegos`
--
ALTER TABLE `juegos`
  ADD CONSTRAINT `fk_juegos_anotador` FOREIGN KEY (`anotador_id`) REFERENCES `usuarios` (`id`),
  ADD CONSTRAINT `fk_juegos_cargado_por` FOREIGN KEY (`cargado_por_id`) REFERENCES `usuarios` (`id`),
  ADD CONSTRAINT `fk_juegos_ganador2` FOREIGN KEY (`equipo_ganador_id`) REFERENCES `equipos_inscritos` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_juegos_local` FOREIGN KEY (`equipo_local_id`) REFERENCES `equipos_inscritos` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_juegos_visitante` FOREIGN KEY (`equipo_visitante_id`) REFERENCES `equipos_inscritos` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `juegos_ibfk_1` FOREIGN KEY (`temporada_categoria_id`) REFERENCES `temporada_categoria` (`id`),
  ADD CONSTRAINT `juegos_ibfk_4` FOREIGN KEY (`estadio_id`) REFERENCES `estadios` (`id`),
  ADD CONSTRAINT `juegos_ibfk_5` FOREIGN KEY (`mvp_roster_id`) REFERENCES `roster` (`id`);

--
-- Filtros para la tabla `juego_arbitros`
--
ALTER TABLE `juego_arbitros`
  ADD CONSTRAINT `fk_juego_arbitros_arbitro` FOREIGN KEY (`arbitro_id`) REFERENCES `arbitros` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_juego_arbitros_juego` FOREIGN KEY (`juego_id`) REFERENCES `juegos` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `pagos_mensualidad`
--
ALTER TABLE `pagos_mensualidad`
  ADD CONSTRAINT `pagos_mensualidad_ibfk_1` FOREIGN KEY (`jugador_id`) REFERENCES `jugadores` (`id`);

--
-- Filtros para la tabla `pitcheo_juego`
--
ALTER TABLE `pitcheo_juego`
  ADD CONSTRAINT `pitcheo_juego_ibfk_1` FOREIGN KEY (`juego_id`) REFERENCES `juegos` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `pitcheo_juego_ibfk_2` FOREIGN KEY (`roster_id`) REFERENCES `roster` (`id`);

--
-- Filtros para la tabla `roster`
--
ALTER TABLE `roster`
  ADD CONSTRAINT `fk_roster_equipo_inscrito` FOREIGN KEY (`equipo_inscrito_id`) REFERENCES `equipos_inscritos` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `roster_ibfk_1` FOREIGN KEY (`jugador_id`) REFERENCES `jugadores` (`id`);

--
-- Filtros para la tabla `roster_posiciones`
--
ALTER TABLE `roster_posiciones`
  ADD CONSTRAINT `roster_posiciones_ibfk_1` FOREIGN KEY (`roster_id`) REFERENCES `roster` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `temporada_categoria`
--
ALTER TABLE `temporada_categoria`
  ADD CONSTRAINT `fk_tc_temporada` FOREIGN KEY (`temporada_id`) REFERENCES `temporadas` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `temporada_categoria_ibfk_2` FOREIGN KEY (`categoria_id`) REFERENCES `categorias` (`id`);

--
-- Filtros para la tabla `torneos`
--
ALTER TABLE `torneos`
  ADD CONSTRAINT `torneos_ibfk_1` FOREIGN KEY (`temporada_categoria_id`) REFERENCES `temporada_categoria` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `torneo_cruces`
--
ALTER TABLE `torneo_cruces`
  ADD CONSTRAINT `fk_torneo_cruces_ganador` FOREIGN KEY (`equipo_ganador_id`) REFERENCES `equipos_inscritos` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_torneo_cruces_local` FOREIGN KEY (`equipo_local_id`) REFERENCES `equipos_inscritos` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_torneo_cruces_visitante` FOREIGN KEY (`equipo_visitante_id`) REFERENCES `equipos_inscritos` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `torneo_cruces_ibfk_1` FOREIGN KEY (`fase_id`) REFERENCES `torneo_fases` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `torneo_cruces_ibfk_5` FOREIGN KEY (`equipo_ganador_id`) REFERENCES `equipos_inscritos` (`id`);

--
-- Filtros para la tabla `torneo_fases`
--
ALTER TABLE `torneo_fases`
  ADD CONSTRAINT `torneo_fases_ibfk_1` FOREIGN KEY (`torneo_id`) REFERENCES `torneos` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD CONSTRAINT `fk_usuarios_equipo` FOREIGN KEY (`equipo_inscrito_id`) REFERENCES `equipos_inscritos` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `usuarios_ibfk_1` FOREIGN KEY (`jugador_id`) REFERENCES `jugadores` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
