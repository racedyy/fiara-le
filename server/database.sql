CREATE DATABASE car_dashboard;

-- Suppression des tables si elles existent
DROP TABLE IF EXISTS driving_events;
DROP TABLE IF EXISTS cars;

-- Création de la table cars
CREATE TABLE cars (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    max_speed NUMERIC(10, 2) NOT NULL,
    acceleration_capacity NUMERIC(10, 2) NOT NULL,
    braking_capacity NUMERIC(10, 2) NOT NULL
);

-- Création de la table driving_events
CREATE TABLE driving_events (
    id SERIAL PRIMARY KEY,
    car_id INTEGER REFERENCES cars(id),
    event_type VARCHAR(20) NOT NULL,
    initial_speed NUMERIC(10, 2) NOT NULL,
    final_speed NUMERIC(10, 2) NOT NULL,
    acceleration_percentage INTEGER,
    duration_seconds NUMERIC(10, 2) NOT NULL,
    fuel_consumed NUMERIC(10, 2) NOT NULL,
    distance_traveled NUMERIC(10, 4) NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour améliorer les performances des requêtes
CREATE INDEX idx_driving_events_car_id ON driving_events(car_id);
CREATE INDEX idx_driving_events_event_type ON driving_events(event_type);
CREATE INDEX idx_driving_events_start_time ON driving_events(start_time);
CREATE INDEX idx_driving_events_end_time ON driving_events(end_time);

-- Données de test pour les voitures
INSERT INTO cars (name, model, max_speed, acceleration_capacity, braking_capacity) VALUES
('Ferrari', 'F40', 320, 30, 20),
('Porsche', '911', 300, 25, 18),
('Lamborghini', 'Aventador', 350, 35, 22);

-- Données de test pour les événements
INSERT INTO driving_events (
    car_id, 
    event_type, 
    initial_speed, 
    final_speed, 
    acceleration_percentage, 
    duration_seconds, 
    fuel_consumed, 
    distance_traveled, 
    start_time, 
    end_time
) VALUES
-- Ferrari F40 (id=1)
(1, 'acceleration', 0, 100, 80, 5.2, 0.8, 0.15, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '59 minutes'),
(1, 'braking', 100, 0, 90, 4.8, 0.2, 0.12, NOW() - INTERVAL '58 minutes', NOW() - INTERVAL '57 minutes'),
(1, 'acceleration', 50, 200, 100, 8.5, 1.5, 0.35, NOW() - INTERVAL '45 minutes', NOW() - INTERVAL '44 minutes'),

-- Porsche 911 (id=2)
(2, 'acceleration', 0, 80, 70, 4.8, 0.6, 0.11, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '119 minutes'),
(2, 'braking', 80, 20, 60, 3.5, 0.1, 0.08, NOW() - INTERVAL '118 minutes', NOW() - INTERVAL '117 minutes'),
(2, 'acceleration', 20, 150, 90, 7.2, 1.2, 0.28, NOW() - INTERVAL '90 minutes', NOW() - INTERVAL '89 minutes'),

-- Lamborghini Aventador (id=3)
(3, 'acceleration', 0, 120, 100, 4.2, 1.0, 0.14, NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '29 minutes'),
(3, 'braking', 120, 0, 100, 5.5, 0.3, 0.16, NOW() - INTERVAL '28 minutes', NOW() - INTERVAL '27 minutes'),
(3, 'acceleration', 0, 250, 100, 12.0, 2.5, 0.55, NOW() - INTERVAL '15 minutes', NOW() - INTERVAL '14 minutes');
