import React, { useState, useEffect, useCallback, useRef } from 'react';
import styled from 'styled-components';

const DashboardContainer = styled.div`
  background-color: #1a1a1a;
  border-radius: 20px;
  padding: 20px;
  width: 800px;
  height: 400px;
  margin: 50px auto;
  display: flex;
  flex-direction: column;
  position: relative;
`;

const FuelGauge = styled.div`
  width: 150px;
  height: 150px;
  border-radius: 50%;
  background: #2a2a2a;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 20px;
  
  &::before {
    content: '';
    position: absolute;
    width: 130px;
    height: 130px;
    background: #1a1a1a;
    border-radius: 50%;
  }
`;

const FuelLevel = styled.div`
  position: absolute;
  bottom: 0;
  width: 100%;
  height: ${props => props.$level}%;
  background: #f0a500;
  border-radius: 0 0 75px 75px;
  transition: height 0.3s ease;
`;

const CarSelector = styled.select`
  padding: 8px;
  margin: 10px;
  background: #2a2a2a;
  color: white;
  border: 1px solid #444;
  border-radius: 4px;
`;

const AccelerationBar = styled.div`
  width: 200px;
  height: 20px;
  background: #2a2a2a;
  margin: 10px auto;
  border-radius: 10px;
  overflow: hidden;
`;

const AccelerationLevel = styled.div`
  height: 100%;
  width: ${props => props.$level}%;
  background: #4CAF50;
  transition: width 0.3s ease;
`;

const ReplayControls = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  gap: 10px;
`;

const StyledButton = styled.button`
  padding: 8px 16px;
  background: ${props => props.$isPlaying ? '#f44336' : '#4CAF50'};
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  opacity: ${props => props.$disabled ? 0.5 : 1};
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
`;

const StatsContainer = styled.div`
  display: flex;
  justify-content: space-around;
  margin-top: 20px;
  padding: 10px;
  background: #2a2a2a;
  border-radius: 10px;
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  color: white;
`;

const Value = styled.span`
  font-size: 1.2em;
  font-weight: bold;
  color: #4CAF50;
`;

const Label = styled.label`
  color: white;
`;

const InfoPanel = styled.div`
  background: #2a2a2a;
  padding: 15px;
  border-radius: 10px;
  margin-top: 20px;
  color: white;
`;

const CommandList = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-top: 10px;
`;

const Command = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 5px;
  border-bottom: 1px solid #444;
`;

const StatusIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
  color: white;
`;

const StatusDot = styled.div`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: ${props => props.$active ? '#4CAF50' : '#666'};
`;

const Dashboard = () => {
  const [cars, setCars] = useState([]);
  const [selectedCar, setSelectedCar] = useState(null);
  const [fuelLevel, setFuelLevel] = useState(100);
  const [speed, setSpeed] = useState(0);
  const [accelerationPercentage, setAccelerationPercentage] = useState(0);
  const [isAccelerating, setIsAccelerating] = useState(false);
  const [isBraking, setIsBraking] = useState(false);
  const [eventStartTime, setEventStartTime] = useState(null);
  const [isReplaying, setIsReplaying] = useState(false);
  const [initialFuelLevel, setInitialFuelLevel] = useState(100);
  const [accelerationDuration] = useState(1);
  const [brakingDuration] = useState(1);
  const [accelerationComplete, setAccelerationComplete] = useState(false);
  const [brakingComplete, setBrakingComplete] = useState(false);
  const [totalDistance, setTotalDistance] = useState(0);
  const [fuelUsed, setFuelUsed] = useState(0);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [isStarted, setIsStarted] = useState(false);
  const replayTimeoutRef = useRef(null);
  const accelerationTimeoutRef = useRef(null);
  const brakingTimeoutRef = useRef(null);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState(0);

  // Fonctions utilitaires
  const calculateFinalSpeed = useCallback((accelerationPercentage) => {
    if (!selectedCar) {
      console.log('Pas de voiture sélectionnée');
      return currentSpeed;
    }
    
    // Conversion explicite en nombres
    const maxSpeed = parseFloat(selectedCar.max_speed);
    const accelerationCapacity = parseFloat(selectedCar.acceleration_capacity);
    const percentage = parseFloat(accelerationPercentage);
    const duration = parseFloat(accelerationDuration);
    
    console.log('Calcul de la vitesse:', {
      selectedCar,
      maxSpeed,
      accelerationCapacity,
      percentage,
      duration,
      currentSpeed
    });

    // Calcul de l'augmentation de vitesse
    const speedIncrease = (accelerationCapacity * percentage * duration) / 100;
    const newSpeed = Math.min(maxSpeed, currentSpeed + speedIncrease);

    console.log('Résultat du calcul de vitesse:', {
      speedIncrease,
      currentSpeed,
      newSpeed,
      formula: `min(${maxSpeed}, ${currentSpeed} + (${accelerationCapacity} * ${percentage} * ${duration}) / 100)`
    });

    return newSpeed;
  }, [selectedCar, accelerationDuration, currentSpeed]);

  const calculateFuelConsumption = useCallback((duration, accelPercentage) => {
    if (!selectedCar) {
      console.log('Impossible de calculer la consommation: pas de voiture sélectionnée');
      return 0;
    }
    
    // Conversion explicite en nombres
    const baseRate = parseFloat(selectedCar.fuel_consumption_rate);
    const percentage = parseFloat(accelPercentage);
    const time = parseFloat(duration);
    
    console.log('Calcul de la consommation:', {
      selectedCar,
      baseRate,
      percentage,
      time
    });

    const consumptionRate = (baseRate * percentage) / 100;
    const consumption = consumptionRate * time;

    console.log('Résultat du calcul de consommation:', {
      consumptionRate,
      consumption,
      formula: `((${baseRate} * ${percentage}) / 100) * ${time}`
    });

    return consumption;
  }, [selectedCar]);

  const calculateBrakingSpeed = useCallback((brakingPower) => {
    if (!selectedCar || currentSpeed === 0) {
      console.log('Pas de voiture sélectionnée ou vitesse nulle');
      return currentSpeed;
    }
    
    // Conversion explicite en nombres
    const brakingCapacity = parseFloat(selectedCar.braking_capacity || 10); // Valeur par défaut si non définie
    const percentage = parseFloat(brakingPower);
    const duration = parseFloat(brakingDuration);
    const speed = parseFloat(currentSpeed);
    
    console.log('Calcul du freinage:', {
      selectedCar,
      brakingCapacity,
      percentage,
      duration,
      speed
    });

    // Calcul de la réduction de vitesse
    const speedReduction = (brakingCapacity * percentage * duration) / 100;
    const newSpeed = Math.max(0, speed - speedReduction);

    console.log('Résultat du calcul de freinage:', {
      speedReduction,
      speed,
      newSpeed,
      formula: `max(0, ${speed} - (${brakingCapacity} * ${percentage} * ${duration}) / 100)`
    });

    return parseFloat(newSpeed.toFixed(2)); // Arrondir à 2 décimales
  }, [selectedCar, brakingDuration, currentSpeed]);

  // Fonction d'enregistrement d'événement
  const recordEvent = useCallback(async (eventType, percentage, startTimeParam, finalSpeedParam) => {
    if (!selectedCar) {
      console.error('Impossible d\'enregistrer l\'événement : pas de voiture sélectionnée');
      return;
    }

    const endTime = new Date();
    const eventStart = startTimeParam || eventStartTime;
    
    if (!eventStart) {
      console.error('Impossible d\'enregistrer l\'événement : pas de temps de début');
      return;
    }

    // S'assurer que toutes les valeurs sont des nombres valides
    const duration = parseFloat((endTime - eventStart) / 1000);
    const initialSpeed = parseFloat(currentSpeed.toFixed(2));
    const finalSpeed = parseFloat((finalSpeedParam || 0).toFixed(2));
    const fuelConsumed = eventType === 'acceleration' 
      ? parseFloat(calculateFuelConsumption(duration, percentage).toFixed(2))
      : 0;
    
    // Calcul de la distance en utilisant la vitesse moyenne
    const avgSpeed = (initialSpeed + finalSpeed) / 2;
    const distanceTraveled = parseFloat(((avgSpeed * duration) / 3600).toFixed(4)); // km/h * s -> km

    console.log('Calcul des valeurs pour l\'événement:', {
      eventType,
      initialSpeed,
      finalSpeed,
      duration,
      fuelConsumed,
      avgSpeed,
      distanceTraveled
    });

    const event = {
      car_id: parseInt(selectedCar.id),
      event_type: eventType,
      initial_speed: initialSpeed,
      final_speed: finalSpeed,
      acceleration_percentage: parseInt(percentage) || 0,
      duration_seconds: duration,
      fuel_consumed: fuelConsumed,
      distance_traveled: distanceTraveled,
      start_time: eventStart.toISOString(),
      end_time: endTime.toISOString()
    };

    console.log('Tentative d\'enregistrement de l\'événement:', event);

    try {
      console.log('Envoi de la requête au serveur...');
      const response = await fetch('http://localhost:5000/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event)
      });

      const responseText = await response.text();
      console.log('Réponse brute du serveur:', responseText);
      console.log('Status de la réponse:', response.status);

      if (response.ok) {
        try {
          const savedEvent = JSON.parse(responseText);
          console.log('Événement sauvegardé avec succès:', savedEvent);
          setTotalDistance(prev => prev + distanceTraveled);
          setFuelUsed(prev => prev + fuelConsumed);
          // Mise à jour de la vitesse actuelle
          setCurrentSpeed(finalSpeed);
          return savedEvent;
        } catch (e) {
          console.error('Erreur lors du parsing de la réponse:', e);
          console.error('Texte de la réponse:', responseText);
        }
      } else {
        console.error('Erreur lors de la sauvegarde:', responseText);
        console.error('Status:', response.status);
        console.error('Headers:', Object.fromEntries(response.headers.entries()));
      }
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error);
      console.error('Stack:', error.stack);
    }
  }, [selectedCar, currentSpeed, eventStartTime, calculateFuelConsumption]);

  const stopAccelerating = useCallback(async (finalSpeed) => {
    console.log('stopAccelerating appelé', {
      finalSpeed,
      currentEvent,
      accelerationPercentage,
      eventStartTime,
      selectedCar: selectedCar?.id,
      isAccelerating
    });

    if (accelerationTimeoutRef.current) {
      clearTimeout(accelerationTimeoutRef.current);
      if (currentEvent === 'acceleration') {
        console.log('Enregistrement de l\'événement d\'accélération...');
        const result = await recordEvent('acceleration', accelerationPercentage, eventStartTime, finalSpeed);
        console.log('Résultat de l\'enregistrement:', result);
      }
      setCurrentEvent(null);
      setIsAccelerating(false);
      setAccelerationComplete(true);
    }
  }, [accelerationPercentage, currentEvent, recordEvent, selectedCar]);

  const startAccelerating = useCallback(() => {
    console.log('startAccelerating appelé', {
      isAccelerating,
      selectedCar,
      fuelLevel,
      isReplaying,
      isStarted,
      accelerationPercentage,
      accelerationDuration
    });

    if (!isAccelerating && selectedCar && fuelLevel > 0 && !isReplaying && isStarted) {
      console.log('Démarrage de l\'accélération');
      const startTime = new Date();
      console.log('Définition du temps de début:', startTime);
      
      setIsAccelerating(true);
      setAccelerationComplete(false);
      setEventStartTime(startTime);
      setCurrentEvent('acceleration');
      setInitialFuelLevel(fuelLevel);
      
      console.log('Pourcentage d\'accélération:', accelerationPercentage);
      const finalSpeed = calculateFinalSpeed(accelerationPercentage);
      console.log('Vitesse finale calculée:', finalSpeed);
      setSpeed(finalSpeed);

      const fuelConsumption = calculateFuelConsumption(accelerationDuration, accelerationPercentage);
      console.log('Consommation de carburant calculée:', fuelConsumption);
      setFuelLevel(prev => Math.max(0, prev - fuelConsumption));

      accelerationTimeoutRef.current = setTimeout(async () => {
        console.log('Fin de l\'accélération, appel de stopAccelerating avec les paramètres:', {
          finalSpeed,
          accelerationPercentage,
          currentEvent: 'acceleration',
          eventStartTime: startTime
        });
        await stopAccelerating(finalSpeed);
      }, accelerationDuration * 1000);
    } else {
      console.log('Accélération impossible:', {
        isAccelerating,
        hasSelectedCar: !!selectedCar,
        selectedCarDetails: selectedCar,
        fuelLevel,
        isReplaying,
        isStarted,
        accelerationPercentage
      });
    }
  }, [
    isAccelerating,
    selectedCar,
    fuelLevel,
    isReplaying,
    isStarted,
    calculateFinalSpeed,
    accelerationPercentage,
    accelerationDuration,
    calculateFuelConsumption,
    stopAccelerating
  ]);

  const startBraking = useCallback((brakingPower) => {
    console.log('startBraking appelé', {
      brakingPower,
      currentSpeed,
      selectedCar,
      isBraking,
      isReplaying,
      isStarted
    });

    if (!isBraking && selectedCar && currentSpeed > 0 && !isReplaying && isStarted) {
      console.log('Démarrage du freinage avec vitesse initiale:', currentSpeed);
      const startTime = new Date();
      const initialSpeed = currentSpeed; // Capture de la vitesse initiale
      console.log('Définition du temps de début:', startTime);
      
      setIsBraking(true);
      setBrakingComplete(false);
      setEventStartTime(startTime);
      setCurrentEvent('braking');
      
      console.log('Pourcentage de freinage:', brakingPower);
      const finalSpeed = calculateBrakingSpeed(brakingPower);
      console.log('Vitesse finale calculée:', finalSpeed);
      setSpeed(finalSpeed);

      brakingTimeoutRef.current = setTimeout(async () => {
        console.log('Fin du freinage, enregistrement de l\'événement:', {
          initialSpeed,
          finalSpeed,
          brakingPower,
          currentEvent: 'braking',
          startTime
        });

        if (brakingTimeoutRef.current) {
          clearTimeout(brakingTimeoutRef.current);
          console.log('Enregistrement de l\'événement de freinage...');
          // S'assurer que finalSpeed est un nombre valide
          const speedToRecord = isNaN(finalSpeed) ? 0 : finalSpeed;
          const result = await recordEvent('braking', brakingPower, startTime, speedToRecord);
          console.log('Résultat de l\'enregistrement:', result);
          setCurrentEvent(null);
          setIsBraking(false);
          setBrakingComplete(true);
          // Mise à jour de la vitesse actuelle
          setCurrentSpeed(speedToRecord);
        }
      }, brakingDuration * 1000);
    } else {
      console.log('Freinage impossible:', {
        isBraking,
        hasSelectedCar: !!selectedCar,
        selectedCarDetails: selectedCar,
        currentSpeed,
        isReplaying,
        isStarted,
        brakingPower
      });
    }
  }, [
    selectedCar,
    isBraking,
    isReplaying,
    isStarted,
    currentSpeed,
    calculateBrakingSpeed,
    brakingDuration,
    recordEvent
  ]);

  // Fonctions de replay
  const startReplay = useCallback(async () => {
    if (isReplaying) {
      console.log('Déjà en cours de replay');
      return;
    }

    try {
      setIsReplaying(true);
      console.log('Chargement des événements pour la voiture:', selectedCar.id);
      
      const response = await fetch(`http://localhost:5000/api/events/${selectedCar.id}`);
      const events = await response.json();
      
      if (!events || events.length === 0) {
        console.log('Aucun événement à rejouer');
        setIsReplaying(false);
        return;
      }

      console.log('Événements chargés:', events);
      
      // Réinitialiser l'état
      setSpeed(0);
      setCurrentSpeed(0);
      setFuelLevel(100);
      setTotalDistance(0);
      setFuelUsed(0);
      
      let currentIndex = 0;
      
      const playNextEvent = async () => {
        if (currentIndex >= events.length) {
          console.log('Replay terminé');
          setIsReplaying(false);
          return;
        }

        const event = events[currentIndex];
        console.log('Lecture de l\'événement:', event);

        // Mettre à jour l'état initial
        setCurrentSpeed(event.initial_speed);
        setSpeed(event.initial_speed);
        
        if (event.event_type === 'acceleration') {
          setIsAccelerating(true);
          setIsBraking(false);
          setAccelerationPercentage(event.acceleration_percentage);
        } else if (event.event_type === 'braking') {
          setIsAccelerating(false);
          setIsBraking(true);
        }

        // Calculer la durée réelle de l'événement
        const duration = event.duration_seconds * 1000; // Convertir en millisecondes

        replayTimeoutRef.current = setTimeout(async () => {
          // Mettre à jour l'état final
          setSpeed(event.final_speed);
          setCurrentSpeed(event.final_speed);
          setIsAccelerating(false);
          setIsBraking(false);
          
          // Mettre à jour les statistiques
          setTotalDistance(prev => prev + event.distance_traveled);
          setFuelUsed(prev => prev + event.fuel_consumed);
          setFuelLevel(prev => Math.max(0, prev - event.fuel_consumed));
          
          currentIndex++;
          await playNextEvent();
        }, duration);
      };

      await playNextEvent();
    } catch (error) {
      console.error('Erreur lors du replay:', error);
      setIsReplaying(false);
    }
  }, [selectedCar, isReplaying]);

  const stopReplay = useCallback(() => {
    if (replayTimeoutRef.current) {
      clearTimeout(replayTimeoutRef.current);
      replayTimeoutRef.current = null;
    }
    setIsReplaying(false);
    setIsAccelerating(false);
    setIsBraking(false);
  }, []);

  // Gestion du démarrage/arrêt
  const handleStart = useCallback(() => {
    if (!selectedCar) {
      console.log('Pas de voiture sélectionnée');
      return;
    }

    if (isReplaying) {
      stopReplay();
    }

    setIsStarted(true);
    setSpeed(0);
    setCurrentSpeed(0);
    setFuelLevel(100);
    setTotalDistance(0);
    setFuelUsed(0);
    console.log('Véhicule démarré, commandes activées');
  }, [selectedCar, isReplaying, stopReplay]);

  const handleStop = useCallback(() => {
    if (isReplaying) {
      stopReplay();
    }
    setIsStarted(false);
    setSpeed(0);
    setCurrentSpeed(0);
    setIsAccelerating(false);
    setIsBraking(false);
    console.log('Véhicule arrêté');
  }, [isReplaying, stopReplay]);

  const handleReplay = useCallback(() => {
    if (isStarted) {
      handleStop();
    }
    startReplay();
  }, [isStarted, handleStop, startReplay]);

  // Gestion des touches
  const handleKeyDown = useCallback((event) => {
    console.log('Key pressed:', event.code, event.key, event);
    
    if (!isStarted || !selectedCar) return;

    if (event.code === 'Space' && !isSpacePressed && !isCtrlPressed) {
      setIsSpacePressed(true);
      console.log('Space pressed, waiting for next key...');
    } else if (isSpacePressed && !isCtrlPressed && /^Numpad[0-9]$/.test(event.code)) {
      console.log('Second key pressed:', event.code, event.key);
      const percentage = event.key === '0' ? 100 : parseInt(event.key) * 10;
      console.log('Setting acceleration to:', percentage);
      
      // Logique d'accélération intégrée ici
      if (!isAccelerating && selectedCar && fuelLevel > 0 && !isReplaying && isStarted) {
        console.log('Démarrage de l\'accélération avec vitesse initiale:', currentSpeed);
        const startTime = new Date();
        console.log('Définition du temps de début:', startTime);
        
        // Important: Définir tous les états AVANT les calculs
        setIsAccelerating(true);
        setAccelerationComplete(false);
        setEventStartTime(startTime);
        setCurrentEvent('acceleration');
        setInitialFuelLevel(fuelLevel);
        setAccelerationPercentage(percentage);
        
        console.log('Pourcentage d\'accélération:', percentage);
        const finalSpeed = calculateFinalSpeed(percentage);
        console.log('Vitesse finale calculée:', finalSpeed);
        setSpeed(finalSpeed);

        const fuelConsumption = calculateFuelConsumption(accelerationDuration, percentage);
        console.log('Consommation de carburant calculée:', fuelConsumption);
        setFuelLevel(prev => Math.max(0, prev - fuelConsumption));

        accelerationTimeoutRef.current = setTimeout(async () => {
          console.log('Fin de l\'accélération, appel de stopAccelerating avec les paramètres:', {
            finalSpeed,
            percentage,
            currentEvent: 'acceleration',
            eventStartTime: startTime
          });

          if (accelerationTimeoutRef.current) {
            clearTimeout(accelerationTimeoutRef.current);
            console.log('Enregistrement de l\'événement d\'accélération...');
            const result = await recordEvent('acceleration', percentage, startTime, finalSpeed);
            console.log('Résultat de l\'enregistrement:', result);
            setCurrentEvent(null);
            setIsAccelerating(false);
            setAccelerationComplete(true);
          }
        }, accelerationDuration * 1000);
      } else {
        console.log('Accélération impossible:', {
          isAccelerating,
          hasSelectedCar: !!selectedCar,
          selectedCarDetails: selectedCar,
          fuelLevel,
          isReplaying,
          isStarted,
          percentage,
          currentSpeed
        });
      }

      setIsSpacePressed(false);
    } else if (event.code === 'ControlLeft') {
      setIsCtrlPressed(true);
    } else if (isCtrlPressed && /^Numpad[0-9]$/.test(event.code)) {
      const brakingPower = event.key === '0' ? 100 : parseInt(event.key) * 10;
      console.log('Braking with power:', brakingPower);
      startBraking(brakingPower);
    }
  }, [
    isStarted,
    selectedCar,
    isSpacePressed,
    isCtrlPressed,
    isAccelerating,
    fuelLevel,
    isReplaying,
    calculateFinalSpeed,
    accelerationDuration,
    calculateFuelConsumption,
    recordEvent,
    startBraking,
    currentSpeed
  ]);

  const handleKeyUp = useCallback((event) => {
    if (event.code === 'ControlLeft') {
      setIsCtrlPressed(false);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  // Effets
  useEffect(() => {
    console.log('Chargement des voitures...');
    fetch('http://localhost:5000/api/cars')
      .then(response => response.json())
      .then(data => {
        console.log('Voitures chargées:', data);
        setCars(data);
        if (data.length > 0) {
          console.log('Sélection de la première voiture:', data[0]);
          setSelectedCar(data[0]);
        }
      })
      .catch(error => console.error('Error fetching cars:', error));
  }, []);

  return (
    <DashboardContainer>
      <div style={{ marginBottom: '20px', textAlign: 'center', color: 'white' }}>
        <h2>Tableau de Bord</h2>
      </div>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        <div style={{ flex: 1 }}>
          <CarSelector
            value={selectedCar?.id || ''}
            onChange={(e) => {
              const car = cars.find(c => c.id === parseInt(e.target.value));
              setSelectedCar(car);
              handleStop();
            }}
            disabled={isStarted}
          >
            <option value="">Sélectionnez une voiture</option>
            {cars.map(car => (
              <option key={car.id} value={car.id}>{car.name}</option>
            ))}
          </CarSelector>

          {selectedCar && (
            <InfoPanel>
              <h3>Caractéristiques du véhicule</h3>
              <p>Vitesse maximale: {selectedCar.max_speed} km/h</p>
              <p>Capacité d'accélération: {selectedCar.acceleration_capacity} km/h/s</p>
              <p>Consommation: {selectedCar.fuel_consumption_rate}%/s à pleine accélération</p>
              <p>Capacité de freinage: {selectedCar.braking_capacity} km/h/s</p>
            </InfoPanel>
          )}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: '10px' }}>
            <FuelGauge>
              <FuelLevel $level={fuelLevel} />
              <span style={{ position: 'relative', zIndex: 1, color: 'white' }}>
                {Math.round(fuelLevel)}%
              </span>
            </FuelGauge>
          </div>

          <div style={{ textAlign: 'center' }}>
            <AccelerationBar>
              <AccelerationLevel $level={accelerationPercentage} />
            </AccelerationBar>
            <div style={{ color: 'white', marginTop: '10px', fontSize: '24px' }}>
              {Math.round(speed)} km/h
            </div>
          </div>
        </div>
      </div>

      <StatusIndicator>
        <StatusDot $active={isStarted} />
        <span>État: {isStarted ? 'En marche' : 'Arrêté'}</span>
        {isStarted && (
          <>
            <StatusDot $active={isAccelerating} />
            <span>Accélération: {isAccelerating ? 'Active' : 'Inactive'}</span>
            <StatusDot $active={isBraking} />
            <span>Freinage: {isBraking ? 'Actif' : 'Inactif'}</span>
          </>
        )}
      </StatusIndicator>

      <StatsContainer>
        <StatItem>
          <Label>Distance Totale:</Label>
          <Value>{totalDistance.toFixed(2)} km</Value>
        </StatItem>
        <StatItem>
          <Label>Carburant Utilisé:</Label>
          <Value>{fuelUsed.toFixed(2)} L</Value>
        </StatItem>
        <StatItem>
          <Label>Accélération:</Label>
          <Value>{accelerationPercentage}%</Value>
        </StatItem>
      </StatsContainer>

      <InfoPanel>
        <h3>État du véhicule</h3>
        <p>Vitesse actuelle: {Math.round(currentSpeed * 100) / 100} km/h</p>
        <p>Niveau de carburant: {Math.round(fuelLevel * 100) / 100}%</p>
        <p>Distance totale: {Math.round(totalDistance * 1000) / 1000} km</p>
        <p>Carburant utilisé: {Math.round(fuelUsed * 100) / 100} L</p>
        <p>État: {
          isAccelerating ? 'Accélération' :
          isBraking ? 'Freinage' :
          accelerationComplete ? 'Accélération terminée' :
          brakingComplete ? 'Freinage terminé' :
          isStarted ? 'En attente' : 'Arrêté'
        }</p>
      </InfoPanel>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', gap: '10px' }}>
        <StyledButton
          onClick={handleStart}
          disabled={!selectedCar || isStarted}
          style={{ background: !isStarted ? '#4CAF50' : '#666' }}
        >
          Démarrer
        </StyledButton>
        <StyledButton
          onClick={handleStop}
          disabled={!isStarted}
          style={{ background: '#f44336' }}
        >
          Arrêter
        </StyledButton>
        <StyledButton
          onClick={handleReplay}
          disabled={!selectedCar || isStarted}
        >
          Replay
        </StyledButton>
      </div>

      <InfoPanel>
        <h3>Commandes</h3>
        <CommandList>
          <Command>
            <span>Espace + 1-9:</span>
            <span>Accélération 10-90%</span>
          </Command>
          <Command>
            <span>Espace + 0:</span>
            <span>Accélération 100%</span>
          </Command>
          <Command>
            <span>CTRL + 1-9:</span>
            <span>Freinage 10-90%</span>
          </Command>
          <Command>
            <span>CTRL + 0:</span>
            <span>Freinage 100%</span>
          </Command>
        </CommandList>
      </InfoPanel>

      {selectedCar && (
        <ReplayControls>
          <StyledButton
            onClick={isReplaying ? stopReplay : startReplay}
            $isPlaying={isReplaying}
            disabled={!selectedCar || isStarted}
          >
            {isReplaying ? 'Arrêter Replay' : 'Démarrer Replay'}
          </StyledButton>
        </ReplayControls>
      )}
    </DashboardContainer>
  );
};

export default Dashboard;
