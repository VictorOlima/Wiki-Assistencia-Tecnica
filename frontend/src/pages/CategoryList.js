import React, { useState, useEffect } from 'react';
import { Card, ListGroup, Row, Col, Button, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaFolder, FaArrowLeft } from 'react-icons/fa';
import axios from 'axios';

const CategoryList = () => {
  const [categories, setCategories] = useState([]);
  const [problemsByCategory, setProblemsByCategory] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [categoriesRes, problemsRes] = await Promise.all([
          axios.get('/api/problems/categories'),
          axios.get('/api/problems')
        ]);
        
        const cats = categoriesRes.data;
        const probs = problemsRes.data;
        
        // Agrupar problemas por categoria
        const grouped = {};
        cats.forEach(category => {
          grouped[category] = probs.filter(problem => problem.category === category);
        });
        
        setCategories(cats);
        setProblemsByCategory(grouped);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        setError('Falha ao carregar categorias e problemas.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  if (loading) {
    return <div>Carregando...</div>;
  }
  
  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }
  
  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
  };
  
  const clearSelectedCategory = () => {
    setSelectedCategory(null);
  };
  
  // Renderização condicional baseada em se uma categoria está selecionada ou não
  if (selectedCategory) {
    const categoryProblems = problemsByCategory[selectedCategory] || [];
    
    return (
      <div>
        <div className="d-flex align-items-center mb-4">
          <Button variant="outline-secondary" onClick={clearSelectedCategory} className="me-2">
            <FaArrowLeft /> Voltar para Categorias
          </Button>
          <h2 className="mb-0">
            Problemas na categoria: <span className="text-primary">{selectedCategory}</span>
          </h2>
        </div>
        
        {categoryProblems.length === 0 ? (
          <Alert variant="info">
            Nenhum problema encontrado na categoria "{selectedCategory}".
          </Alert>
        ) : (
          <Row>
            {categoryProblems.map(problem => (
              <Col key={problem.id} xs={12} md={6} lg={4} className="mb-3">
                <Card className="h-100 problem-card">
                  <Card.Body>
                    <Card.Title>{problem.title}</Card.Title>
                    <Card.Text className="text-muted">
                      {problem.description.length > 150 
                        ? problem.description.substring(0, 150) + '...' 
                        : problem.description}
                    </Card.Text>
                    <div className="mt-auto">
                      {problem.tags.map((tag, idx) => (
                        <span 
                          key={idx} 
                          className="badge bg-secondary me-1 mb-1"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </Card.Body>
                  <Card.Footer className="bg-white border-top-0">
                    <Button 
                      as={Link}
                      to={`/problem/${problem.id}`}
                      variant="outline-primary"
                      size="sm"
                      className="w-100"
                    >
                      Ver Detalhes
                    </Button>
                  </Card.Footer>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </div>
    );
  }
  
  return (
    <div>
      <h2 className="mb-4">Problemas por Categoria</h2>
      
      {categories.length === 0 ? (
        <div className="text-center py-5">
          <h4>Nenhuma categoria encontrada</h4>
          <p>Comece criando seu primeiro problema técnico.</p>
        </div>
      ) : (
        <Row>
          {categories.map((category, idx) => (
            <Col key={idx} md={6} lg={4} className="mb-4">
              <Card className="h-100">
                <Card.Header className="bg-light" 
                  style={{ cursor: 'pointer' }} 
                  onClick={() => handleCategorySelect(category)}
                >
                  <div className="d-flex align-items-center">
                    <FaFolder className="me-2 text-primary" />
                    <h5 className="mb-0">{category}</h5>
                  </div>
                </Card.Header>
                <Card.Body>
                  <Card.Text>
                    {problemsByCategory[category]?.length || 0} problema(s) nesta categoria
                  </Card.Text>
                  
                  <ListGroup variant="flush">
                    {(problemsByCategory[category] || []).slice(0, 5).map(problem => (
                      <ListGroup.Item key={problem.id} className="border-0 px-0">
                        <Link 
                          to={`/problem/${problem.id}`}
                          className="text-decoration-none"
                        >
                          {problem.title}
                        </Link>
                      </ListGroup.Item>
                    ))}
                    
                    {(problemsByCategory[category] || []).length > 5 && (
                      <ListGroup.Item className="border-0 px-0 text-center">
                        <em>E mais {problemsByCategory[category].length - 5} problema(s)...</em>
                      </ListGroup.Item>
                    )}
                    
                    {(problemsByCategory[category] || []).length === 0 && (
                      <ListGroup.Item className="border-0 px-0 text-center text-muted">
                        Nenhum problema nesta categoria
                      </ListGroup.Item>
                    )}
                  </ListGroup>
                </Card.Body>
                <Card.Footer className="bg-white border-top-0">
                  <Button 
                    variant="outline-primary"
                    size="sm"
                    className="w-100"
                    onClick={() => handleCategorySelect(category)}
                  >
                    Ver Todos
                  </Button>
                </Card.Footer>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default CategoryList; 