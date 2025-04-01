const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config();

async function initializeDatabase() {
  // Connexion à PostgreSQL sans spécifier de base de données
  const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
  });

  try {
    await client.connect();
    
    // Vérifier si la base de données existe
    const dbExists = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [process.env.DB_DATABASE]
    );

    // Si la base de données existe, la supprimer
    if (dbExists.rows.length > 0) {
      // Fermer toutes les connexions à la base de données
      await client.query(`
        SELECT pg_terminate_backend(pg_stat_activity.pid)
        FROM pg_stat_activity
        WHERE pg_stat_activity.datname = '${process.env.DB_DATABASE}'
        AND pid <> pg_backend_pid();
      `);
      
      await client.query(`DROP DATABASE ${process.env.DB_DATABASE};`);
    }

    // Créer la nouvelle base de données
    await client.query(`CREATE DATABASE ${process.env.DB_DATABASE};`);
    console.log('Base de données créée avec succès');

    // Fermer la connexion initiale
    await client.end();

    // Se connecter à la nouvelle base de données
    const dbClient = new Client({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_DATABASE,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
    });

    await dbClient.connect();

    // Lire et exécuter le fichier SQL
    const sqlFile = path.join(__dirname, 'database.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8')
      .replace('CREATE DATABASE car_dashboard;', ''); // Supprimer la commande CREATE DATABASE

    await dbClient.query(sql);
    console.log('Tables et données initiales créées avec succès');

    await dbClient.end();
    process.exit(0);
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de la base de données:', error);
    if (client) {
      await client.end();
    }
    process.exit(1);
  }
}

initializeDatabase();
