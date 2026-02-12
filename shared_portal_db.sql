-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: shared_portal_db
-- ------------------------------------------------------
-- Server version	5.5.5-10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `activity_logs`
--

DROP TABLE IF EXISTS `activity_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activity_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `admin_id` int(11) DEFAULT NULL,
  `action` varchar(255) NOT NULL,
  `entity_type` varchar(50) DEFAULT NULL,
  `entity_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_logs_admin` (`admin_id`),
  CONSTRAINT `fk_logs_admin` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activity_logs`
--

LOCK TABLES `activity_logs` WRITE;
/*!40000 ALTER TABLE `activity_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `activity_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admin`
--

DROP TABLE IF EXISTS `admin`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin` (
  `id` tinyint(4) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin`
--

LOCK TABLES `admin` WRITE;
/*!40000 ALTER TABLE `admin` DISABLE KEYS */;
INSERT INTO `admin` VALUES (1,'GIS Admin','$2b$10$vxGpaA4zLw2hLQqHk6Ip6.6jKqKqn4AfaQ3tYUgmtADaLJ5DCr13y','2026-02-05 12:39:18');
/*!40000 ALTER TABLE `admin` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admins`
--

DROP TABLE IF EXISTS `admins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admins` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `full_name` varchar(120) NOT NULL,
  `email` varchar(120) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('admin','super_admin') NOT NULL DEFAULT 'admin',
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admins`
--

LOCK TABLES `admins` WRITE;
/*!40000 ALTER TABLE `admins` DISABLE KEYS */;
INSERT INTO `admins` VALUES (1,'Vince Admin','vince@admin.com','TEMP_HASH','super_admin','active','2026-02-05 08:41:11','2026-02-05 08:41:11');
/*!40000 ALTER TABLE `admins` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `requests`
--

DROP TABLE IF EXISTS `requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `requests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `requester_type` enum('student','faculty','outsider') NOT NULL,
  `full_name` varchar(150) DEFAULT NULL,
  `department` varchar(100) DEFAULT NULL,
  `requester_code` varchar(50) DEFAULT NULL,
  `tracking_code` varchar(20) DEFAULT NULL,
  `needed_date` date DEFAULT NULL,
  `email` varchar(120) DEFAULT NULL,
  `contact_number` varchar(30) DEFAULT NULL,
  `request_type` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `handled_by_admin_id` int(11) DEFAULT NULL,
  `handled_at` datetime DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `submitted_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_requests_tracking_code` (`tracking_code`),
  KEY `fk_requests_admin` (`handled_by_admin_id`),
  KEY `idx_requests_status_type` (`status`,`request_type`),
  KEY `idx_requests_submitted_at` (`submitted_at`),
  CONSTRAINT `fk_requests_admin` FOREIGN KEY (`handled_by_admin_id`) REFERENCES `admins` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `requests`
--

LOCK TABLES `requests` WRITE;
/*!40000 ALTER TABLE `requests` DISABLE KEYS */;
INSERT INTO `requests` VALUES (1,'student','test','test','2222',NULL,'2026-02-20','test@test.com','0927992','Consultation','test','approved',1,'2026-02-11 15:18:01',NULL,'2026-02-11 06:39:39'),(2,'student','test','Test','2222',NULL,'2026-02-14','multi@test.com','099322','Test','test','approved',1,'2026-02-11 15:18:04',NULL,'2026-02-11 06:40:01'),(3,'faculty','Juan Dela Cruz','IT DEPARTMENT',NULL,'3H2AZYPSW4','2026-02-21','juan@test.com','09234552','Consultation','test','pending',NULL,NULL,NULL,'2026-02-12 00:10:18'),(4,'student','Multiple Test','Department','22-05265',NULL,'2026-02-19','multi@test.com','09778655','Consultation','Multiple Test','pending',NULL,NULL,NULL,'2026-02-12 00:11:25');
/*!40000 ALTER TABLE `requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `resource_deliveries`
--

DROP TABLE IF EXISTS `resource_deliveries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `resource_deliveries` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `request_id` int(11) NOT NULL,
  `delivery_type` enum('FILE','LINK','NOTE') NOT NULL,
  `file_path` varchar(255) DEFAULT NULL,
  `file_url` varchar(500) DEFAULT NULL,
  `file_name` varchar(150) DEFAULT NULL,
  `original_name` varchar(255) DEFAULT NULL,
  `mime_type` varchar(120) DEFAULT NULL,
  `external_url` varchar(500) DEFAULT NULL,
  `message` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_request_id` (`request_id`),
  CONSTRAINT `fk_resource_deliveries_request` FOREIGN KEY (`request_id`) REFERENCES `resource_requests` (`id`) ON DELETE CASCADE,
  CONSTRAINT `resource_deliveries_ibfk_1` FOREIGN KEY (`request_id`) REFERENCES `resource_requests` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `resource_deliveries`
--

LOCK TABLES `resource_deliveries` WRITE;
/*!40000 ALTER TABLE `resource_deliveries` DISABLE KEYS */;
INSERT INTO `resource_deliveries` VALUES (1,4,'FILE','/uploads/resource-deliveries/1770793169375_1770768452717_admin_boundary-20260203T020953Z-3-001.zip',NULL,'1770768452717_admin_boundary-20260203T020953Z-3-001.zip',NULL,NULL,NULL,NULL,'2026-02-11 06:59:29');
/*!40000 ALTER TABLE `resource_deliveries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `resource_requests`
--

DROP TABLE IF EXISTS `resource_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `resource_requests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tracking_code` varchar(30) NOT NULL,
  `sr_code` varchar(50) DEFAULT NULL,
  `requester_type` enum('STUDENT','EXTERNAL') NOT NULL DEFAULT 'STUDENT',
  `requester_name` varchar(150) NOT NULL,
  `email` varchar(150) DEFAULT NULL,
  `department` varchar(150) DEFAULT NULL,
  `needed_date` date DEFAULT NULL,
  `request_type` enum('SOFTWARE','DATASET','FILE','OTHER') NOT NULL,
  `requested_items` text NOT NULL,
  `purpose` text NOT NULL,
  `notes` text DEFAULT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `remarks` text DEFAULT NULL,
  `submitted_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `handled_at` timestamp NULL DEFAULT NULL,
  `handled_by_admin_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_resource_requests_tracking_code` (`tracking_code`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `resource_requests`
--

LOCK TABLES `resource_requests` WRITE;
/*!40000 ALTER TABLE `resource_requests` DISABLE KEYS */;
INSERT INTO `resource_requests` VALUES (1,'REQ-2222-RBO5V8','2222','STUDENT','Juan Dela Cruz','test@test.com','CICS','2026-02-20','SOFTWARE','test','test',NULL,'pending',NULL,'2026-02-11 06:46:53',NULL,NULL),(2,'REQ-2222-A1H6GQ','2222','STUDENT','test','test@test.com','test','2026-02-12','SOFTWARE','test','test',NULL,'pending',NULL,'2026-02-11 06:54:43',NULL,NULL),(3,'REQ-2222-VL7B2M','2222','STUDENT','test','tes@test.com','test','2026-03-13','SOFTWARE','test','test',NULL,'pending',NULL,'2026-02-11 06:55:18',NULL,NULL),(4,'REQ-222-MSAN95','222','STUDENT','test','test@TEST.COM','test',NULL,'DATASET','test','test',NULL,'approved','TY','2026-02-11 06:57:05','2026-02-11 06:59:29',1);
/*!40000 ALTER TABLE `resource_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `training_registrations`
--

DROP TABLE IF EXISTS `training_registrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `training_registrations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `training_id` int(11) NOT NULL,
  `registrant_name` varchar(150) NOT NULL,
  `registered_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_training_reg` (`training_id`),
  CONSTRAINT `fk_training_reg` FOREIGN KEY (`training_id`) REFERENCES `trainings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `training_registrations`
--

LOCK TABLES `training_registrations` WRITE;
/*!40000 ALTER TABLE `training_registrations` DISABLE KEYS */;
INSERT INTO `training_registrations` VALUES (1,1,'test','2026-02-11 07:14:14');
/*!40000 ALTER TABLE `training_registrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `trainings`
--

DROP TABLE IF EXISTS `trainings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trainings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(150) NOT NULL,
  `objectives` text NOT NULL,
  `training_date` date NOT NULL,
  `training_datetime` datetime NOT NULL,
  `location` varchar(255) NOT NULL,
  `capacity` int(11) NOT NULL DEFAULT 0,
  `attendees_count` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `trainings`
--

LOCK TABLES `trainings` WRITE;
/*!40000 ALTER TABLE `trainings` DISABLE KEYS */;
INSERT INTO `trainings` VALUES (1,'TEST','test','2026-02-26','2026-02-26 15:14:00','test',5,1,'2026-02-11 07:14:05');
/*!40000 ALTER TABLE `trainings` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-02-12  8:53:32
