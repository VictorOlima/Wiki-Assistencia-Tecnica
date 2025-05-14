import React, { useState, useEffect } from 'react';
import { Card, Badge, Row, Col, Form, InputGroup, Button, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaSearch, FaTags, FaArrowLeft } from 'react-icons/fa';
import axios from 'axios';

const TagList = () => {
  const [tags, setTags] = useState([]);
  const [problems, setProblems] = useState([]);
  const [filteredTags, setFilteredTags] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTag, setSelectedTag] = useState(null);
  const [filteredProblems, setFilteredProblems] = useState([]);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [tagsRes, problemsRes] = await Promise.all([
          axios.get('/api/problems/tags'),
          axios.get('/api/problems')
        ]);
        
        setTags(tagsRes.data);
        setFilteredTags(tagsRes.data);
        setProblems(problemsRes.data);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        setError('Falha ao carregar tags e problemas.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Filtrar tags com base no termo de pesquisa
  useEffect(() => {
    if (!searchTerm) {
      setFilteredTags(tags);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredTags(tags.filter(tag => tag.toLowerCase().includes(term)));
    }
  }, [searchTerm, tags]);
  
  // Filtrar problemas quando uma tag é selecionada
  useEffect(() => {
    if (selectedTag) {
      setFilteredProblems(problems.filter(problem => problem.tags.includes(selectedTag)));
    } else {
      setFilteredProblems([]);
    }
  }, [selectedTag, problems]);
  
  // Contar problemas por tag
  const countProblemsByTag = (tag) => {
    return problems.filter(problem => problem.tags.includes(tag)).length;
  };
  
  if (loading) {
    return <div>Carregando...</div>;
  }
  
  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }
  
  const handleTagClick = (tag) => {
    setSelectedTag(tag);
    // Limpar a busca quando uma tag é selecionada
    setSearchTerm('');
  };
  
  const clearSelectedTag = () => {
    setSelectedTag(null);
  };
  
  // Renderização condicional baseada em se uma tag está selecionada ou não
  if (selectedTag) {
    return (
      <div>
        <div className="d-flex align-items-center mb-4">
          <Button variant="outline-secondary" onClick={clearSelectedTag} className="me-2">
            <FaArrowLeft /> Voltar para Tags
          </Button>
          <h2 className="mb-0">Problemas com a tag: <Badge bg="primary">{selectedTag}</Badge></h2>
        </div>
        
        {filteredProblems.length === 0 ? (
          <Alert variant="info">
            Nenhum problema encontrado com a tag "{selectedTag}".
          </Alert>
        ) : (
          <Row>
            {filteredProblems.map(problem => (
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
                        <Badge 
                          key={idx} 
                          bg={tag === selectedTag ? "primary" : "secondary"}
                          className="me-1 mb-1"
                        >
                          {tag}
                        </Badge>
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
      <h2 className="mb-4">Listar por Tags</h2>
      
      <Card className="mb-4">
        <Card.Body>
          <Form>
            <InputGroup className="mb-3">
              <InputGroup.Text id="search-tags">
                <FaSearch />
              </InputGroup.Text>
              <Form.Control
                placeholder="Pesquisar por tags"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-describedby="search-tags"
              />
              {searchTerm && (
                <Button 
                  variant="outline-secondary" 
                  onClick={() => setSearchTerm('')}
                >
                  Limpar
                </Button>
              )}
            </InputGroup>
          </Form>
          
          <div className="d-flex align-items-center mb-3">
            <FaTags className="me-2 text-primary" />
            <h5 className="mb-0">Tags Disponíveis</h5>
          </div>
          
          {filteredTags.length === 0 ? (
            <div className="text-center py-3">
              <p className="text-muted">Nenhuma tag encontrada</p>
            </div>
          ) : (
            <div>
              {filteredTags.map((tag, idx) => (
                <Badge 
                  key={idx} 
                  bg="primary"
                  className="me-2 mb-2 p-2 tag-badge"
                  onClick={() => handleTagClick(tag)}
                >
                  {tag} <span className="ms-1 badge bg-light text-dark">{countProblemsByTag(tag)}</span>
                </Badge>
              ))}
            </div>
          )}
        </Card.Body>
      </Card>
      
      <h3 className="mb-3">Tags Populares</h3>
      
      <Row>
        {filteredTags
          .sort((a, b) => countProblemsByTag(b) - countProblemsByTag(a))
          .slice(0, 6)
          .map((tag, idx) => {
            const tagProblems = problems.filter(problem => problem.tags.includes(tag));
            
            return (
              <Col key={idx} md={6} lg={4} className="mb-4">
                <Card className="h-100">
                  <Card.Header className="bg-light">
                    <div className="d-flex align-items-center justify-content-between">
                      <h5 className="mb-0">
                        <Badge 
                          bg="primary" 
                          className="me-2 tag-badge"
                          onClick={() => handleTagClick(tag)}
                          style={{ cursor: 'pointer' }}
                        >
                          {tag}
                        </Badge>
                      </h5>
                      <span className="text-muted">{tagProblems.length} problema(s)</span>
                    </div>
                  </Card.Header>
                  <Card.Body>
                    <ul className="list-unstyled">
                      {tagProblems.slice(0, 3).map(problem => (
                        <li key={problem.id} className="mb-2">
                          <Link 
                            to={`/problem/${problem.id}`}
                            className="text-decoration-none"
                          >
                            {problem.title}
                          </Link>
                        </li>
                      ))}
                      
                      {tagProblems.length > 3 && (
                        <li className="text-center">
                          <em>E mais {tagProblems.length - 3} problema(s)...</em>
                        </li>
                      )}
                      
                      {tagProblems.length === 0 && (
                        <li className="text-muted text-center">
                          Nenhum problema com esta tag
                        </li>
                      )}
                    </ul>
                  </Card.Body>
                  <Card.Footer className="bg-white border-top-0">
                    <Button 
                      variant="outline-primary"
                      size="sm"
                      className="w-100"
                      onClick={() => handleTagClick(tag)}
                    >
                      Ver Todos
                    </Button>
                  </Card.Footer>
                </Card>
              </Col>
            );
          })}
      </Row>
    </div>
  );
};

export default TagList; 