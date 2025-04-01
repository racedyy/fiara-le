import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
`;

const Title = styled.h1`
  color: #333;
  margin-bottom: 20px;
`;

const FiltersContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
  padding: 15px;
  background: #f5f5f5;
  border-radius: 8px;
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  margin-bottom: 5px;
  color: #666;
`;

const Input = styled.input`
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
`;

const Select = styled.select`
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const Th = styled.th`
  padding: 12px;
  text-align: left;
  background: #f8f9fa;
  border-bottom: 2px solid #dee2e6;
`;

const Td = styled.td`
  padding: 12px;
  border-bottom: 1px solid #dee2e6;
`;

const Button = styled.button`
  padding: 8px 16px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  &:hover {
    background: #0056b3;
  }
  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

const SearchButton = styled(Button)`
  grid-column: 1 / -1;
  width: 200px;
  margin: 20px auto 0;
  background: #28a745;
  &:hover {
    background: #218838;
  }
`;

const FilterButton = styled(Button)`
  margin-top: 10px;
  width: 100%;
`;

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 20px;
`;

const History = () => {
  const [cars, setCars] = useState([]);
  const [events, setEvents] = useState([]);
  const [filters, setFilters] = useState({
    carId: '',
    eventType: '',
    startDate: '',
    endDate: '',
    minSpeed: '',
    maxSpeed: '',
    minFuel: '',
    maxFuel: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const eventsPerPage = 10;

  // Charger les événements avec filtres
  const fetchEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      const queryParams = new URLSearchParams({
        ...filters,
        page: currentPage,
        limit: eventsPerPage
      });

      const response = await fetch('http://localhost:5000/api/events/search?' + queryParams.toString());
      const data = await response.json();
      
      setEvents(data.events || []);
      setTotalPages(Math.ceil((data.total || 0) / eventsPerPage));
    } catch (error) {
      console.error('Erreur lors du chargement des événements:', error);
      setEvents([]);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  }, [filters, currentPage]);

  // Ne pas charger automatiquement les événements au montage
  useEffect(() => {
    const fetchCars = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/cars');
        const data = await response.json();
        setCars(data || []);
      } catch (error) {
        console.error('Erreur lors du chargement des voitures:', error);
        setCars([]);
      }
    };
    fetchCars();
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchEvents();
  };

  const handleReset = () => {
    setFilters({
      carId: '',
      eventType: '',
      startDate: '',
      endDate: '',
      minSpeed: '',
      maxSpeed: '',
      minFuel: '',
      maxFuel: ''
    });
    setCurrentPage(1);
    fetchEvents();
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch (error) {
      return 'Date invalide';
    }
  };

  const formatDuration = (seconds) => {
    try {
      return `${(seconds || 0).toFixed(2)}s`;
    } catch (error) {
      return '0.00s';
    }
  };

  return (
    <Container>
      <Title>Historique des Événements</Title>

      <FiltersContainer>
        <FilterGroup>
          <Label>Voiture</Label>
          <Select name="carId" value={filters.carId} onChange={handleFilterChange}>
            <option value="">Toutes les voitures</option>
            {(cars || []).map(car => (
              <option key={car.id} value={car.id}>
                {car.name} ({car.model})
              </option>
            ))}
          </Select>
        </FilterGroup>

        <FilterGroup>
          <Label>Type d'événement</Label>
          <Select name="eventType" value={filters.eventType} onChange={handleFilterChange}>
            <option value="">Tous les types</option>
            <option value="acceleration">Accélération</option>
            <option value="braking">Freinage</option>
          </Select>
        </FilterGroup>

        <FilterGroup>
          <Label>Date de début</Label>
          <Input
            type="datetime-local"
            name="startDate"
            value={filters.startDate}
            onChange={handleFilterChange}
          />
        </FilterGroup>

        <FilterGroup>
          <Label>Date de fin</Label>
          <Input
            type="datetime-local"
            name="endDate"
            value={filters.endDate}
            onChange={handleFilterChange}
          />
        </FilterGroup>

        <FilterGroup>
          <Label>Vitesse min (km/h)</Label>
          <Input
            type="number"
            name="minSpeed"
            value={filters.minSpeed}
            onChange={handleFilterChange}
            min="0"
          />
        </FilterGroup>

        <FilterGroup>
          <Label>Vitesse max (km/h)</Label>
          <Input
            type="number"
            name="maxSpeed"
            value={filters.maxSpeed}
            onChange={handleFilterChange}
            min="0"
          />
        </FilterGroup>

        <FilterGroup>
          <Label>Carburant min (L)</Label>
          <Input
            type="number"
            name="minFuel"
            value={filters.minFuel}
            onChange={handleFilterChange}
            min="0"
            step="0.1"
          />
        </FilterGroup>

        <FilterGroup>
          <Label>Carburant max (L)</Label>
          <Input
            type="number"
            name="maxFuel"
            value={filters.maxFuel}
            onChange={handleFilterChange}
            min="0"
            step="0.1"
          />
        </FilterGroup>

        <SearchButton onClick={handleSearch} disabled={isLoading}>
          {isLoading ? 'Recherche...' : 'Rechercher'}
        </SearchButton>

        <FilterButton onClick={handleReset} disabled={isLoading}>
          Réinitialiser les filtres
        </FilterButton>
      </FiltersContainer>

      <Table>
        <thead>
          <tr>
            <Th>Voiture</Th>
            <Th>Type</Th>
            <Th>Vitesse initiale</Th>
            <Th>Vitesse finale</Th>
            <Th>Pourcentage</Th>
            <Th>Durée</Th>
            <Th>Carburant</Th>
            <Th>Distance</Th>
            <Th>Date début</Th>
            <Th>Date fin</Th>
          </tr>
        </thead>
        <tbody>
          {events.length === 0 ? (
            <tr>
              <Td colSpan="10" style={{ textAlign: 'center' }}>
                {isLoading ? 'Chargement...' : 'Aucun événement trouvé'}
              </Td>
            </tr>
          ) : (
            events.map(event => (
              <tr key={event.id}>
                <Td>{(cars || []).find(c => c.id === event.car_id)?.name || 'Inconnue'}</Td>
                <Td>{event.event_type === 'acceleration' ? 'Accélération' : 'Freinage'}</Td>
                <Td>{(event.initial_speed || 0).toFixed(1)} km/h</Td>
                <Td>{(event.final_speed || 0).toFixed(1)} km/h</Td>
                <Td>{event.acceleration_percentage || 0}%</Td>
                <Td>{formatDuration(event.duration_seconds)}</Td>
                <Td>{(event.fuel_consumed || 0).toFixed(2)} L</Td>
                <Td>{(event.distance_traveled || 0).toFixed(4)} km</Td>
                <Td>{formatDate(event.start_time)}</Td>
                <Td>{formatDate(event.end_time)}</Td>
              </tr>
            ))
          )}
        </tbody>
      </Table>

      <Pagination>
        <Button
          onClick={() => {
            setCurrentPage(prev => Math.max(1, prev - 1));
            fetchEvents();
          }}
          disabled={currentPage === 1 || isLoading}
        >
          Précédent
        </Button>
        <span>Page {currentPage} sur {totalPages}</span>
        <Button
          onClick={() => {
            setCurrentPage(prev => Math.min(totalPages, prev + 1));
            fetchEvents();
          }}
          disabled={currentPage === totalPages || isLoading}
        >
          Suivant
        </Button>
      </Pagination>
    </Container>
  );
};

export default History;
