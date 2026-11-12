-- ============================================================
--  Souk10 — Base de données (MySQL / MariaDB — XAMPP phpMyAdmin)
--  Import : http://localhost/phpmyadmin  →  Importer  →  ce fichier
-- ============================================================

CREATE DATABASE IF NOT EXISTS souk10 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE souk10;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS messages, conversations, favorites, sales, listings, categories, users;
SET FOREIGN_KEY_CHECKS = 1;

-- ---------- Utilisateurs ----------
CREATE TABLE users (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(150) NOT NULL,
  password   VARCHAR(255) NOT NULL,
  phone      VARCHAR(30)  NULL,
  city       VARCHAR(80)  NULL,
  is_admin   TINYINT(1)   NOT NULL DEFAULT 0,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- Catégories ----------
CREATE TABLE categories (
  id      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name_ar VARCHAR(80) NOT NULL,
  name_fr VARCHAR(80) NOT NULL,
  icon    VARCHAR(16) NOT NULL DEFAULT '📦'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- Annonces ----------
CREATE TABLE listings (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED  NOT NULL,
  category_id INT UNSIGNED  NULL,
  title       VARCHAR(150)  NOT NULL,
  description TEXT          NULL,
  price       DECIMAL(10,2) NOT NULL,
  city        VARCHAR(80)   NULL,
  image       VARCHAR(120)  NULL,
  status      ENUM('active','sold') NOT NULL DEFAULT 'active',
  created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_listing_user FOREIGN KEY (user_id)     REFERENCES users(id)      ON DELETE CASCADE,
  CONSTRAINT fk_listing_cat  FOREIGN KEY (category_id)  REFERENCES categories(id) ON DELETE SET NULL,
  INDEX idx_listing_status  (status),
  INDEX idx_listing_cat     (category_id),
  INDEX idx_listing_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- Conversations (1 par acheteur + annonce) ----------
CREATE TABLE conversations (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  listing_id INT UNSIGNED NOT NULL,
  buyer_id   INT UNSIGNED NOT NULL,
  seller_id  INT UNSIGNED NOT NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_conv (listing_id, buyer_id),
  CONSTRAINT fk_conv_listing FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
  CONSTRAINT fk_conv_buyer   FOREIGN KEY (buyer_id)   REFERENCES users(id)    ON DELETE CASCADE,
  CONSTRAINT fk_conv_seller  FOREIGN KEY (seller_id)  REFERENCES users(id)    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- Messages ----------
CREATE TABLE messages (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  conversation_id INT UNSIGNED NOT NULL,
  sender_id       INT UNSIGNED NULL,
  body            TEXT         NOT NULL,
  is_read         TINYINT(1)   NOT NULL DEFAULT 0,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_msg_conv   FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  CONSTRAINT fk_msg_sender FOREIGN KEY (sender_id)       REFERENCES users(id)         ON DELETE SET NULL,
  INDEX idx_msg_conv (conversation_id, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- Favoris ----------
CREATE TABLE favorites (
  user_id    INT UNSIGNED NOT NULL,
  listing_id INT UNSIGNED NOT NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, listing_id),
  CONSTRAINT fk_fav_user    FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  CONSTRAINT fk_fav_listing FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- Ventes + commission 10% de la plateforme ----------
CREATE TABLE sales (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  listing_id  INT UNSIGNED  NOT NULL,
  seller_id   INT UNSIGNED  NOT NULL,
  final_price DECIMAL(10,2) NOT NULL,
  commission  DECIMAL(10,2) NOT NULL,
  created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sale_listing FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
  CONSTRAINT fk_sale_seller  FOREIGN KEY (seller_id)  REFERENCES users(id)    ON DELETE CASCADE,
  INDEX idx_sales_date (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
--  Données initiales
-- ============================================================

-- Compte ADMIN  →  email : admin@souk10.ma   |   mot de passe : admin123
-- (pensez à changer le mot de passe !)
INSERT INTO users (name, email, password, phone, city, is_admin) VALUES
('Admin', 'admin@souk10.ma', '$2y$12$FbYnKd4Ij.9OFOebVT5KUe7giAoA0FVsOwuhyp4BXJY0n29YfIl/S', '0600000000', 'Casablanca', 1);

-- Compte démo vendeur → seller@souk10.ma | seller123
INSERT INTO users (name, email, password, phone, city, is_admin) VALUES
('Youssef Alami', 'seller@souk10.ma', '$2y$12$wVWba4eLzd1RYVrpQNz6we5wx0kMVNFYkEdneVV/vS1r1uSrxFQSC', '0611223344', 'Rabat', 0);

-- Catégories
INSERT INTO categories (name_ar, name_fr, icon) VALUES
('إلكترونيات',      'Électronique',    '📱'),
('سيارات و دراجات', 'Véhicules',       '🚗'),
('دار و أرض',       'Maison & Jardin', '🏠'),
('ملابس و زينة',    'Mode & Beauté',   '👕'),
('رياضة و هوايات',  'Sport & Loisirs', '⚽'),
('أخرى',            'Autre',           '📦');

-- Annonces de démonstration (vendeur démo)
INSERT INTO listings (user_id, category_id, title, description, price, city, image, status, created_at) VALUES
(2, 1, 'iPhone 13 — 128 Go, bleu', 'Telifon nqiya bhal jdid, m3a chargeur w coffret. Batterie 92%. Sabab dyal lbi3: chrit jdid.', 6800, 'Rabat', 'demo_iphone.jpg', 'active', NOW() - INTERVAL 1 HOUR),
(2, 2, 'VTT Btwin Rockrider 540', 'Vélo VTT taille L, freins à disque, très bien entretenu. Parfait pour les sorties weekend.', 2400, 'Casablanca', 'demo_vtt.jpg', 'active', NOW() - INTERVAL 5 HOUR),
(2, 3, 'Canapé d\'angle 3 places', 'Canapé moderne couleur gris, très confortable, à récupérer sur place à Salé.', 3500, 'Salé', 'demo_canape.jpg', 'active', NOW() - INTERVAL 1 DAY),
(2, 4, 'Caftan brodé main', 'Caftan jdid m3a taqa brodée manuellement. Taille M. marhba.', 900, 'Marrakech', NULL, 'active', NOW() - INTERVAL 2 DAY),
(2, 1, 'PS5 Slim + 2 manettes', 'PlayStation 5 Slim neuve sous blister, garantie 1 an, avec 2 manettes DualSense.', 5900, 'Tanger', NULL, 'active', NOW() - INTERVAL 3 DAY);
