import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Button, Card, Alert, Row, Col, InputGroup } from 'react-bootstrap';
import { FaArrowLeft, FaYoutube } from 'react-icons/fa';
import axios from 'axios';

const CreateProblem = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    tags: '',
    youtubeLink: '',
  });
  
  const [files, setFiles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [youtubePreview, setYoutubePreview] = useState(null);
  const [descriptionYoutubeLinks, setDescriptionYoutubeLinks] = useState([]);
  
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get('/api/problems/categories');
        setCategories(res.data);
      } catch (error) {
        console.error('Erro ao carregar categorias:', error);
      }
    };
    
    fetchCategories();
  }, []);
  
  // Efeito para extrair ID do vídeo do YouTube e gerar uma prévia
  useEffect(() => {
    if (formData.youtubeLink) {
      try {
        // Extrair ID do YouTube da URL
        const youtubeRegex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/;
        const match = formData.youtubeLink.match(youtubeRegex);
        
        if (match && match[1]) {
          setYoutubePreview(match[1]);
        } else {
          setYoutubePreview(null);
        }
      } catch (err) {
        setYoutubePreview(null);
      }
    } else {
      setYoutubePreview(null);
    }
  }, [formData.youtubeLink]);
  
  // Efeito para detectar links do YouTube na descrição
  useEffect(() => {
    if (formData.description) {
      try {
        // Extrair todos os IDs do YouTube do texto da descrição
        const youtubeRegex = /https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([^"&?/\s]{11})(?:[^\s]*)/g;
        
        const matches = [];
        let match;
        
        // Encontrar todas as ocorrências
        while ((match = youtubeRegex.exec(formData.description)) !== null) {
          if (match[1]) {
            matches.push(match[1]);
          }
        }
        
        setDescriptionYoutubeLinks(matches);
      } catch (err) {
        console.error('Erro ao processar links do YouTube na descrição:', err);
        setDescriptionYoutubeLinks([]);
      }
    } else {
      setDescriptionYoutubeLinks([]);
    }
  }, [formData.description]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'category') {
      if (value === 'Outra') {
        setIsNewCategory(true);
      } else {
        setIsNewCategory(false);
        setNewCategory('');
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleNewCategoryChange = (e) => {
    setNewCategory(e.target.value);
  };
  
  const handleFileChange = (e) => {
    setFiles([...e.target.files]);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const finalFormData = {...formData};
    
    // Se for nova categoria, usar o valor digitado
    if (isNewCategory && newCategory) {
      finalFormData.category = newCategory;
    }
    
    // Validar campos
    if (!finalFormData.title || !finalFormData.description || !finalFormData.category || !finalFormData.tags) {
      setError('Todos os campos são obrigatórios.');
      setLoading(false);
      return;
    }
    
    try {
      // Criar FormData para envio de arquivos
      const data = new FormData();
      data.append('title', finalFormData.title);
      data.append('description', finalFormData.description);
      data.append('category', finalFormData.category);
      data.append('tags', finalFormData.tags);
      data.append('youtubeLink', finalFormData.youtubeLink);
      
      // Adicionar arquivos
      for (let i = 0; i < files.length; i++) {
        data.append('files', files[i]);
      }
      
      // Enviar para a API
      await axios.post('/api/problems', data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Redirecionar imediatamente após o sucesso
      navigate('/');
      
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao criar problema. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <Button 
            variant="outline-secondary" 
            as={Link} 
            to="/"
            className="me-2"
          >
            <FaArrowLeft /> Voltar
          </Button>
          <h2 className="d-inline-block">Criar Novo Problema</h2>
        </div>
      </div>
      
      <Card className="form-container">
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">Problema criado com sucesso!</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="title">
              <Form.Label>Título</Form.Label>
              <Form.Control
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Digite o título do problema"
                required
              />
            </Form.Group>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="category">
                  <Form.Label>Categoria</Form.Label>
                  <Form.Select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Selecione uma categoria</option>
                    {categories.map((category, idx) => (
                      <option key={idx} value={category}>
                        {category}
                      </option>
                    ))}
                    <option value="Outra">Outra (Nova Categoria)</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                {isNewCategory && (
                  <Form.Group className="mb-3" controlId="newCategory">
                    <Form.Label>Nova Categoria</Form.Label>
                    <Form.Control
                      type="text"
                      value={newCategory}
                      onChange={handleNewCategoryChange}
                      placeholder="Digite o nome da nova categoria"
                      required
                    />
                  </Form.Group>
                )}
                
                <Form.Group className="mb-3" controlId="tags">
                  <Form.Label>Tags (separadas por vírgula)</Form.Label>
                  <Form.Control
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleChange}
                    placeholder="Ex: eletrônica, placa-mãe, fonte"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3" controlId="description">
              <Form.Label>Descrição (suporta Markdown)</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Descreva o problema detalhadamente. Você pode usar Markdown para formatação."
                required
              />
              <Form.Text className="text-muted">
                Você pode usar Markdown para formatação: **negrito**, *itálico*, listas com * ou -, # para títulos, [link](url), etc.
                <br />
                Para adicionar um vídeo do YouTube, insira o link completo na descrição. Exemplo: https://www.youtube.com/watch?v=XXXXXXXXXXX
              </Form.Text>
            </Form.Group>
            
            {/* Prévia para links do YouTube na descrição */}
            {descriptionYoutubeLinks.length > 0 && (
              <div className="mb-4">
                <Alert variant="info">
                  <FaYoutube className="text-danger me-2" /> 
                  {descriptionYoutubeLinks.length === 1 
                    ? 'Foi detectado 1 link do YouTube na descrição.' 
                    : `Foram detectados ${descriptionYoutubeLinks.length} links do YouTube na descrição.`
                  } 
                  Eles serão exibidos como vídeos incorporados quando o problema for visualizado.
                </Alert>
                
                {descriptionYoutubeLinks.map((videoId, idx) => (
                  <div key={idx} className="mb-3">
                    <h6>Prévia do vídeo {idx + 1}:</h6>
                    <div className="ratio ratio-16x9 mb-3" style={{ maxWidth: '400px' }}>
                      <iframe
                        src={`https://www.youtube.com/embed/${videoId}`}
                        title={`Vídeo do YouTube ${idx + 1}`}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* <Form.Group className="mb-4" controlId="youtubeLink">
              <Form.Label>Link do YouTube</Form.Label>
              <InputGroup>
                <InputGroup.Text>
                  <FaYoutube className="text-danger" />
                </InputGroup.Text>
                <Form.Control
                  type="url"
                  name="youtubeLink"
                  value={formData.youtubeLink}
                  onChange={handleChange}
                  placeholder="Ex: https://www.youtube.com/watch?v=XXXXXXXXXXX"
                />
              </InputGroup>
              <Form.Text className="text-muted">
                Cole um link de vídeo do YouTube relacionado ao problema (opcional).
              </Form.Text>
            </Form.Group> */}
            
            {youtubePreview && (
              <div className="mb-4">
                <h6>Prévia do Vídeo:</h6>
                <div className="ratio ratio-16x9 mb-3" style={{ maxWidth: '400px' }}>
                  <iframe
                    src={`https://www.youtube.com/embed/${youtubePreview}`}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
            )}
            
            <Form.Group className="mb-3" controlId="files">
              <Form.Label>Arquivos (imagens ou PDFs)</Form.Label>
              <Form.Control
                type="file"
                multiple
                onChange={handleFileChange}
                accept=".jpg,.jpeg,.png,.gif,.pdf"
              />
              <Form.Text className="text-muted">
                Você pode selecionar múltiplos arquivos. Tamanho máximo: 16MB.
              </Form.Text>
            </Form.Group>
            
            <div className="d-flex justify-content-end">
              <Button 
                variant="secondary" 
                as={Link} 
                to="/"
                className="me-2"
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Enviando...' : 'Criar Problema'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default CreateProblem; 