-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 12, 2026 at 01:24 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `brgy_system`
--

-- --------------------------------------------------------

--
-- Table structure for table `inventory`
--

CREATE TABLE `inventory` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `quantity` int(11) NOT NULL,
  `unit` varchar(50) NOT NULL,
  `category` varchar(100) DEFAULT NULL,
  `updatedBy` varchar(100) DEFAULT NULL,
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `inventory`
--

INSERT INTO `inventory` (`id`, `name`, `quantity`, `unit`, `category`, `updatedBy`, `updatedAt`) VALUES
(1, 'medal', 28, 'pcs', 'adas', 'alex', '2026-03-10 04:51:47'),
(2, 'baso', 90, 'pcs', 'asd', 'Admin User', '2026-02-27 06:25:23'),
(3, 'medals', 180, 'pcs', '', 'Admin User', '2026-02-27 06:57:02'),
(4, 'bola', 5, 'pcs', 'spalding', 'Admin User', '2026-03-10 05:53:57'),
(5, 'Chair', 155, 'pcs', '', 'Admin User', '2026-03-10 01:15:55'),
(7, 'Damit', 200, 'pcs', 'walang tatak', 'Admin User', '2026-03-10 05:36:53');

-- --------------------------------------------------------

--
-- Table structure for table `inventory_transactions`
--

CREATE TABLE `inventory_transactions` (
  `id` int(11) NOT NULL,
  `item_name` varchar(255) NOT NULL,
  `transaction_type` varchar(50) NOT NULL,
  `quantity_change` int(11) NOT NULL,
  `remarks` text DEFAULT NULL,
  `transacted_by` varchar(100) NOT NULL,
  `transaction_date` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `inventory_transactions`
--

INSERT INTO `inventory_transactions` (`id`, `item_name`, `transaction_type`, `quantity_change`, `remarks`, `transacted_by`, `transaction_date`) VALUES
(1, 'medal', 'OUT (Released)', 10, 'basketball', 'Admin User', '2026-02-27 06:22:00'),
(2, 'baso', 'IN (New Item)', 100, 'Initial stock added', 'Admin User', '2026-02-27 06:22:59'),
(3, 'medal', 'ADJUST (Edited)', 30, 'Admin adjusted item details or stock manually', 'Admin User', '2026-02-27 06:23:17'),
(4, 'baso', 'OUT (Released)', 10, 'asdddd', 'Admin User', '2026-02-27 06:25:23'),
(5, 'medals', 'IN (New Item)', 200, 'Initial stock added', 'Admin User', '2026-02-27 06:56:43'),
(6, 'medals', 'OUT (Released)', 20, 'solicit', 'Admin User', '2026-02-27 06:57:02'),
(7, 'bola', 'IN (New Item)', 10, 'Initial stock added', 'Admin User', '2026-03-02 01:04:54'),
(8, 'Chair', 'IN (New Item)', 250, 'Initial stock added', 'Bert', '2026-03-05 02:21:31'),
(9, 'Chair', 'OUT (Released)', 120, 'for fiesta', 'Bert', '2026-03-05 02:22:05'),
(10, 'Chair', 'IN (New Item)', 25, 'Initial stock added', 'Admin User', '2026-03-10 01:15:21'),
(11, 'Chair', 'ADJUST (Edited)', 155, 'Admin adjusted item details or stock manually', 'Admin User', '2026-03-10 01:15:55'),
(12, 'Chair', 'DELETE (Removed)', 0, 'Item was permanently deleted from system', 'Admin User', '2026-03-10 01:15:57'),
(13, 'medal', 'IN (Add Stock)', 50, 'Added stock to existing item', 'Admin User', '2026-03-10 01:26:16'),
(14, 'medal', 'OUT (Released)', 40, 'Liga Ni Jong bert', 'Admin User', '2026-03-10 01:27:01'),
(15, 'medal', 'OUT (Released)', 12, 'humingi ng medals 12 pcs', 'alex', '2026-03-10 04:51:47'),
(16, 'Damit', 'IN (New Item)', 400, 'Initial stock added', 'Admin User', '2026-03-10 05:35:33'),
(17, 'Damit', 'OUT (Released)', 200, 'solicitation for fiesta', 'Admin User', '2026-03-10 05:36:53'),
(18, 'bola', 'OUT (Released)', 5, 'liga sa bahay nila toto', 'Admin User', '2026-03-10 05:53:57');

-- --------------------------------------------------------

--
-- Table structure for table `item_releases`
--

CREATE TABLE `item_releases` (
  `id` int(11) NOT NULL,
  `inventory_id` int(11) NOT NULL,
  `item_name` varchar(255) NOT NULL,
  `quantity` int(11) NOT NULL,
  `basis` text NOT NULL,
  `released_by` varchar(100) NOT NULL,
  `release_date` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `medical_requests`
--

CREATE TABLE `medical_requests` (
  `id` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `patientName` varchar(255) NOT NULL,
  `medicalIssue` varchar(255) NOT NULL,
  `requestType` varchar(255) NOT NULL,
  `date` date NOT NULL,
  `contactNo` varchar(50) DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `note` text DEFAULT NULL,
  `status` varchar(50) DEFAULT 'pending',
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `medical_requests`
--

INSERT INTO `medical_requests` (`id`, `userId`, `patientName`, `medicalIssue`, `requestType`, `date`, `contactNo`, `remarks`, `note`, `status`, `createdAt`) VALUES
(2, 1, 'alex', 'anger ', 'checkup', '2026-02-12', '123123123', '', '', 'pending', '2026-03-10 04:46:57'),
(3, 2, 'gelmar', 'heart', 'medical', '2026-03-24', '0312312', '', '1000', 'approved', '2026-03-10 04:48:15'),
(4, 2147483647, 'bert', 'papatuli', 'Checkup ', '1999-04-22', '12312312', '', '', 'approved', '2026-03-10 04:54:38');

-- --------------------------------------------------------

--
-- Table structure for table `schedules`
--

CREATE TABLE `schedules` (
  `id` int(11) NOT NULL,
  `userId` varchar(255) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `eventType` varchar(50) DEFAULT 'other',
  `date` date NOT NULL,
  `startTime` varchar(50) NOT NULL,
  `endTime` varchar(50) NOT NULL,
  `location` varchar(255) NOT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'upcoming',
  `createdBy` varchar(100) NOT NULL,
  `createAt` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `schedules`
--

INSERT INTO `schedules` (`id`, `userId`, `title`, `eventType`, `date`, `startTime`, `endTime`, `location`, `status`, `createdBy`, `createAt`) VALUES
(1, NULL, 'Servisyo Caravan Libreng gupit', 'other', '2026-02-28', '10:00', '01:00', 'Santa rosa', 'archived', 'Admin User', '2026-02-27 01:20:37'),
(2, NULL, 'Caravan Fiesta', 'other', '2026-03-02', '01:00', '04:00', 'Kila Jong Bert', 'archived', 'Scheduler User', '2026-02-27 01:31:35'),
(3, NULL, 'Caravan ni Boss lim', 'other', '2026-03-12', '09:00', '03:00', 'Loma', 'upcoming', 'Admin User', '2026-02-27 04:29:42'),
(5, NULL, 'asdfas', 'other', '2026-03-11', '03:00', '22:00', 'sdf', 'upcoming', 'Admin User', '2026-02-27 04:31:23'),
(7, NULL, 'Caravan nang loma', 'other', '2026-03-31', '08:00', '12:00', 'loma', 'upcoming', 'Admin User', '2026-02-27 04:33:13'),
(9, NULL, 'qwad', 'other', '2026-02-27', '08:00', '12:00', 'weq', 'archived', 'Admin User', '2026-02-27 04:34:14'),
(10, NULL, 'Caravan', 'other', '2026-03-31', '08:00', '12:00', 'binan', 'upcoming', 'Admin User', '2026-02-27 04:54:54'),
(11, NULL, 'asd', 'other', '2026-03-25', '08:00', '12:00', 'asda', 'upcoming', 'Admin User', '2026-02-27 04:57:19'),
(12, NULL, 'asd', 'other', '2026-03-26', '08:00', '12:00', 'asd', 'upcoming', 'Admin User', '2026-02-27 04:57:32'),
(13, NULL, 'asd', 'other', '2026-03-19', '09:00', '12:00', 'asd', 'upcoming', 'Admin User', '2026-02-27 05:00:08'),
(14, NULL, 'ads', 'other', '2026-03-19', '08:00', '12:00', 'asd', 'upcoming', 'Admin User', '2026-02-27 05:00:36'),
(21, NULL, 'Caravan Event', 'other', '2026-03-03', '08:00', '12:00', 'Santa Rosa', 'archived', 'Admin User', '2026-03-02 03:25:31'),
(22, NULL, 'Caravan Fiesta', 'other', '2026-03-13', '07:00', '12:00', 'Brgy Loma', 'upcoming', 'Admin User', '2026-03-03 01:28:14'),
(23, NULL, 'birthday', 'other', '2026-04-29', '12:00', '03:00', 'canlalay', 'upcoming', 'Scheduler User', '2026-03-09 02:27:47'),
(24, NULL, 'Birthday ni Alex', 'other', '2026-04-29', '08:00', '10:00', 'Canlalay', 'upcoming', 'Admin User', '2026-03-09 03:26:06'),
(25, '1', 'Caravan ng Binan', 'other', '2026-04-04', '08:00', '12:00', 'covered court ng binan bayan, Biñan (Poblacion), Biñan', 'upcoming', 'Admin User', '2026-03-10 05:56:28'),
(26, '1', 'Caravan ng bay', 'other', '2026-04-06', '08:00', '12:00', 'covered court ng binan bayan, Poblacion, Bay', 'upcoming', 'Admin User', '2026-03-10 06:02:20'),
(27, '1', 'Meeting kila Jong Bert', 'other', '2026-03-25', '08:00', '12:00', '3rd Floor Cvsu, Cuebang Bato, Famy', 'upcoming', 'Admin User', '2026-03-10 06:35:02');

-- --------------------------------------------------------

--
-- Table structure for table `solicitations`
--

CREATE TABLE `solicitations` (
  `id` int(11) NOT NULL,
  `userId` varchar(255) NOT NULL,
  `event` varchar(255) NOT NULL,
  `date` date NOT NULL,
  `request` varchar(255) NOT NULL,
  `venue` varchar(255) NOT NULL,
  `note` text DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `filledOutBy` varchar(255) NOT NULL,
  `requisitorDistrict` varchar(255) NOT NULL,
  `requisitorBarangay` varchar(255) NOT NULL,
  `requisitorName` varchar(255) NOT NULL,
  `contactNo` varchar(50) NOT NULL,
  `status` enum('pending','approved','denied') DEFAULT 'pending',
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `solicitations`
--

INSERT INTO `solicitations` (`id`, `userId`, `event`, `date`, `request`, `venue`, `note`, `remarks`, `filledOutBy`, `requisitorDistrict`, `requisitorBarangay`, `requisitorName`, `contactNo`, `status`, `createdAt`) VALUES
(1, '1', 'Fiesta', '2026-02-23', 'chairs', 'binan', '', '', 'Den', 'Biñan', 'Bungahan', 'Leah', '1231112313', 'approved', '2026-03-09 07:25:45'),
(2, '2', 'Ad', '1320-11-23', '1023', 'aodk', 'okay\n', '', 'qwkej', 'Alaminos', 'Poblacion II', 'qwlekq1', 'qkwej', 'approved', '2026-03-09 07:29:58'),
(3, '1773023926797', 'Fiesta', '2026-03-22', 'chairs', 'purok 3', '', '', 'Gelmar', 'Biñan', 'Santo Tomas', 'Lean', '13114124123', 'approved', '2026-03-09 07:32:47'),
(6, '1773118183755', 'asd', '2131-12-31', 'qweqe', 'qeqw', '', '', '', '', '', 'qweq', '13133123', 'approved', '2026-03-10 05:33:38'),
(7, '1', 'Basketball league', '2026-03-10', 'shoes and trophy', 'Covered court ng purok 3', '', '', '', 'Biñan', 'Santo Tomas', 'Kyle', '09123455813', 'pending', '2026-03-10 05:42:09'),
(8, '1773114666522', 'Liga', '2026-03-10', 'for 5 basketball', 'purok 4 covered court', '5 spalding ball', '', '', 'Rizal', 'Entablado', 'Toto', '09123456789', 'approved', '2026-03-10 05:52:15'),
(9, '1', 'zumba', '2026-03-26', 'water', 'court', 'ok', 'okay', '', 'Calamba', 'Makiling', 'justine', '09646464444', 'approved', '2026-03-11 03:48:49');

-- --------------------------------------------------------

--
-- Table structure for table `tasks`
--

CREATE TABLE `tasks` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `completed` tinyint(1) DEFAULT 0,
  `assignedTo` varchar(255) NOT NULL,
  `createdBy` varchar(255) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tasks`
--

INSERT INTO `tasks` (`id`, `title`, `completed`, `assignedTo`, `createdBy`, `createdAt`) VALUES
(1, 'asd', 1, 'Boss Lim', 'Admin User', '2026-03-09 08:52:50'),
(2, 'Kumuha ng 20pcs na upuan at 30 pcs na medal', 1, 'Marius Dearoz', 'Gelmar', '2026-03-10 01:42:58'),
(3, 'mag inventory ', 0, 'Kagawad Johnbert', 'alex', '2026-03-10 04:50:38');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` varchar(50) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `inventory`
--
ALTER TABLE `inventory`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `inventory_transactions`
--
ALTER TABLE `inventory_transactions`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `item_releases`
--
ALTER TABLE `item_releases`
  ADD PRIMARY KEY (`id`),
  ADD KEY `inventory_id` (`inventory_id`);

--
-- Indexes for table `medical_requests`
--
ALTER TABLE `medical_requests`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `schedules`
--
ALTER TABLE `schedules`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `solicitations`
--
ALTER TABLE `solicitations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tasks`
--
ALTER TABLE `tasks`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `inventory`
--
ALTER TABLE `inventory`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `inventory_transactions`
--
ALTER TABLE `inventory_transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `item_releases`
--
ALTER TABLE `item_releases`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `medical_requests`
--
ALTER TABLE `medical_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `schedules`
--
ALTER TABLE `schedules`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

--
-- AUTO_INCREMENT for table `solicitations`
--
ALTER TABLE `solicitations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `tasks`
--
ALTER TABLE `tasks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `item_releases`
--
ALTER TABLE `item_releases`
  ADD CONSTRAINT `item_releases_ibfk_1` FOREIGN KEY (`inventory_id`) REFERENCES `inventory` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
