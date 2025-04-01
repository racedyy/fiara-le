const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();

app.use(cors());
app.use(express.json());

// Récupérer toutes les voitures
app.get('/api/cars', async (req, res) => {
    try {
        const allCars = await pool.query('SELECT * FROM cars');
        res.json(allCars.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server error" });
    }
});

// Recherche d'événements avec filtres
app.get('/api/events/search', async (req, res) => {
    try {
        console.log('Début de la recherche d\'événements');
        console.log('Query params:', req.query);

        // Construire la requête de base
        let query = 'SELECT * FROM driving_events WHERE 1=1';
        const params = [];
        let paramIndex = 1;

        // Filtrer par voiture
        if (req.query.carId && req.query.carId !== '') {
            query += ` AND car_id = $${paramIndex}`;
            params.push(parseInt(req.query.carId));
            paramIndex++;
        }

        // Filtrer par type d'événement
        if (req.query.eventType && req.query.eventType !== '') {
            query += ` AND event_type = $${paramIndex}`;
            params.push(req.query.eventType);
            paramIndex++;
        }

        // Filtrer par date de début
        if (req.query.startDate && req.query.startDate !== '') {
            query += ` AND start_time >= $${paramIndex}`;
            params.push(new Date(req.query.startDate).toISOString());
            paramIndex++;
        }

        // Filtrer par date de fin
        if (req.query.endDate && req.query.endDate !== '') {
            query += ` AND end_time <= $${paramIndex}`;
            params.push(new Date(req.query.endDate).toISOString());
            paramIndex++;
        }

        // Filtrer par vitesse minimale
        if (req.query.minSpeed && req.query.minSpeed !== '') {
            query += ` AND final_speed >= $${paramIndex}`;
            params.push(parseFloat(req.query.minSpeed));
            paramIndex++;
        }

        // Filtrer par vitesse maximale
        if (req.query.maxSpeed && req.query.maxSpeed !== '') {
            query += ` AND final_speed <= $${paramIndex}`;
            params.push(parseFloat(req.query.maxSpeed));
            paramIndex++;
        }

        // Filtrer par carburant minimal
        if (req.query.minFuel && req.query.minFuel !== '') {
            query += ` AND fuel_consumed >= $${paramIndex}`;
            params.push(parseFloat(req.query.minFuel));
            paramIndex++;
        }

        // Filtrer par carburant maximal
        if (req.query.maxFuel && req.query.maxFuel !== '') {
            query += ` AND fuel_consumed <= $${paramIndex}`;
            params.push(parseFloat(req.query.maxFuel));
            paramIndex++;
        }

        // Compter le total des résultats
        const countQuery = query.replace('SELECT *', 'SELECT COUNT(*)');
        const countResult = await pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].count);

        // Ajouter la pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        query += ` ORDER BY start_time DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);

        console.log('Requête finale:', query);
        console.log('Paramètres:', params);

        // Exécuter la requête principale
        const result = await pool.query(query, params);
        console.log('Nombre de résultats:', result.rows.length);

        // Convertir les valeurs numériques
        const events = result.rows.map(event => ({
            ...event,
            initial_speed: parseFloat(event.initial_speed) || 0,
            final_speed: parseFloat(event.final_speed) || 0,
            acceleration_percentage: parseInt(event.acceleration_percentage) || 0,
            duration_seconds: parseFloat(event.duration_seconds) || 0,
            fuel_consumed: parseFloat(event.fuel_consumed) || 0,
            distance_traveled: parseFloat(event.distance_traveled) || 0
        }));

        res.json({
            events,
            total,
            page,
            pages: Math.ceil(total / limit)
        });

    } catch (err) {
        console.error('Erreur détaillée:', err);
        console.error('Stack:', err.stack);
        res.status(500).json({
            error: err.message,
            events: [],
            total: 0,
            page: 1,
            pages: 1
        });
    }
});

// Récupérer les événements pour une voiture
app.get('/api/events/:carId', async (req, res) => {
    try {
        const { carId } = req.params;
        console.log('GET /api/events/:carId - Récupération des événements pour la voiture:', carId);

        const query = `
            SELECT * FROM driving_events 
            WHERE car_id = $1 
            ORDER BY start_time ASC`;
        
        const result = await pool.query(query, [carId]);
        console.log('Événements trouvés:', result.rows);
        
        // Convertir les valeurs en nombres
        const events = result.rows.map(event => ({
            ...event,
            initial_speed: parseFloat(event.initial_speed),
            final_speed: parseFloat(event.final_speed),
            acceleration_percentage: parseInt(event.acceleration_percentage),
            duration_seconds: parseFloat(event.duration_seconds),
            fuel_consumed: parseFloat(event.fuel_consumed),
            distance_traveled: parseFloat(event.distance_traveled)
        }));

        res.json(events);
    } catch (err) {
        console.error('Erreur lors de la récupération des événements:', err);
        res.status(500).json({ error: err.message });
    }
});

// Enregistrer un événement de conduite
app.post('/api/events', async (req, res) => {
    console.log('POST /api/events - Corps de la requête:', req.body);
    try {
        const {
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
        } = req.body;

        // Validation des données
        if (!car_id || !event_type || initial_speed === undefined || final_speed === undefined || 
            !duration_seconds || fuel_consumed === undefined || !start_time || !end_time || distance_traveled === undefined) {
            console.error('Données manquantes:', {
                car_id,
                event_type,
                initial_speed,
                final_speed,
                duration_seconds,
                fuel_consumed,
                start_time,
                end_time,
                distance_traveled
            });
            return res.status(400).json({ error: "Missing required fields" });
        }

        // S'assurer que les valeurs numériques sont des nombres
        const params = [
            parseInt(car_id),
            event_type,
            parseFloat(initial_speed),
            parseFloat(final_speed),
            parseFloat(acceleration_percentage || 0),
            parseFloat(duration_seconds),
            parseFloat(fuel_consumed),
            parseFloat(distance_traveled),
            new Date(start_time),
            new Date(end_time)
        ];

        console.log('Paramètres de la requête SQL:', params);

        const query = `
            INSERT INTO driving_events 
            (car_id, event_type, initial_speed, final_speed, acceleration_percentage, 
             duration_seconds, fuel_consumed, distance_traveled, start_time, end_time) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
            RETURNING *`;

        console.log('Exécution de la requête SQL:', query);

        const result = await pool.query(query, params);
        const newEvent = result.rows[0];
        
        // Convertir les valeurs en nombres
        newEvent.initial_speed = parseFloat(newEvent.initial_speed);
        newEvent.final_speed = parseFloat(newEvent.final_speed);
        newEvent.acceleration_percentage = parseInt(newEvent.acceleration_percentage);
        newEvent.duration_seconds = parseFloat(newEvent.duration_seconds);
        newEvent.fuel_consumed = parseFloat(newEvent.fuel_consumed);
        newEvent.distance_traveled = parseFloat(newEvent.distance_traveled);
        
        console.log('Événement enregistré avec succès:', newEvent);
        res.json(newEvent);
    } catch (err) {
        console.error('Erreur détaillée lors de l\'enregistrement de l\'événement:', err);
        console.error('Stack trace:', err.stack);
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
