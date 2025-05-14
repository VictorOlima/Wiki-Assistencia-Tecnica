import React, { useState, useEffect } from 'react';
import { Card, Button, Row, Col, Form, Badge, InputGroup } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaSearch, FaTags } from 'react-icons/fa';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

const Home = () => {
  const [problems, setProblems] = useState([]);
  const [filteredProblems, setFilteredProblems] = useState([]);
  const [tags, setTags] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [problemsRes, tagsRes, categoriesRes] = await Promise.all([
          axios.get('/api/problems'),
          axios.get('/api/problems/tags'),
          axios.get('/api/problems/categories')
        ]);
        
        setProblems(problemsRes.data);
        setFilteredProblems(problemsRes.data);
        setTags(tagsRes.data);
        setCategories(categoriesRes.data);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    // Filtrar problemas com base nos critérios selecionados
    let filtered = [...problems];
    
    if (selectedCategory) {
      filtered = filtered.filter(problem => problem.category === selectedCategory);
    }
    
    if (selectedTags.length > 0) {
      filtered = filtered.filter(problem => 
        selectedTags.every(tag => problem.tags.includes(tag))
      );
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(problem => 
        problem.title.toLowerCase().includes(term) || 
        problem.description.toLowerCase().includes(term)
      );
    }
    
    setFilteredProblems(filtered);
  }, [selectedCategory, selectedTags, searchTerm, problems]);

  const handleTagClick = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    );
  };

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
  };

  const clearFilters = () => {
    setSelectedTags([]);
    setSelectedCategory('');
    setSearchTerm('');
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div>
      <h2 className="mb-4">Wiki de Problemas Técnicos</h2>
      
      <Card className="mb-4">
        <Card.Body>
          <h5>Filtros</h5>
          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Categoria</Form.Label>
                <Form.Select 
                  value={selectedCategory} 
                  onChange={handleCategoryChange}
                >
                  <option value="">Todas as categorias</option>
                  {categories.map((category, idx) => (
                    <option key={idx} value={category}>
                      {category}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            
            <Col md={8}>
              <Form.Group className="mb-3">
                <Form.Label>Pesquisar</Form.Label>
                <InputGroup>
                  <Form.Control
                    placeholder="Pesquisar por título ou descrição"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Button variant="outline-secondary">
                    <FaSearch />
                  </Button>
                </InputGroup>
              </Form.Group>
            </Col>
          </Row>
          
          <div className="mb-3">
            <Form.Label className="d-flex align-items-center">
              <FaTags className="me-1" /> Tags
            </Form.Label>
            <div>
              {tags.map((tag, idx) => (
                <Badge 
                  key={idx}
                  bg={selectedTags.includes(tag) ? "primary" : "secondary"}
                  className="tag-badge"
                  onClick={() => handleTagClick(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
          
          <div className="text-end">
            <Button variant="outline-secondary" size="sm" onClick={clearFilters}>
              Limpar Filtros
            </Button>
          </div>
        </Card.Body>
      </Card>
      
      <Row>
        {filteredProblems.length === 0 ? (
          <Col>
            <div className="text-center p-5">
              <h4>Nenhum problema encontrado</h4>
              <p>Tente ajustar os filtros ou criar um novo problema.</p>
            </div>
          </Col>
        ) : (
          filteredProblems.map(problem => (
            <Col md={6} lg={4} key={problem.id} className="mb-4">
              <Card className="problem-card h-100">
                <Card.Body>
                  <Card.Title>{problem.title}</Card.Title>
                  <Card.Subtitle className="mb-2 text-muted">
                    Categoria: {problem.category}
                  </Card.Subtitle>
                  
                  <div className="mb-3">
                    {problem.tags.map((tag, idx) => (
                      <Badge key={idx} bg="info" className="me-1">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="card-text-container mb-3">
                    {problem.description.length > 100 ? (
                      <ReactMarkdown 
                        rehypePlugins={[rehypeRaw]}
                        components={{
                          p: ({children}) => <div className="mb-2">{children}</div>,
                          a: ({node, ...props}) => (
                            <a target="_blank" rel="noopener noreferrer" {...props} />
                          )
                        }}
                      >
                        {`${problem.description.substring(0, 100)}...`}
                      </ReactMarkdown>
                    ) : (
                      <ReactMarkdown 
                        rehypePlugins={[rehypeRaw]}
                        components={{
                          p: ({children}) => <div className="mb-2">{children}</div>,
                          a: ({node, ...props}) => (
                            <a target="_blank" rel="noopener noreferrer" {...props} />
                          )
                        }}
                      >
                        {problem.description}
                      </ReactMarkdown>
                    )}
                  </div>
                </Card.Body>
                <Card.Footer className="d-flex justify-content-between align-items-center">
                  <small className="text-muted">
                    Por: {problem.author}
                  </small>
                  <Link to={`/problem/${problem.id}`}>
                    <Button variant="primary" size="sm">Ver Detalhes</Button>
                  </Link>
                </Card.Footer>
              </Card>
            </Col>
          ))
        )}
      </Row>
    </div>
  );
};

export default Home; 