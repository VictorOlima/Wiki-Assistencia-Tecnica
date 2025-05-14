import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Form, Button, Card, Alert, Row, Col, InputGroup } from 'react-bootstrap';
import { FaArrowLeft, FaFilePdf, FaFile, FaTrash, FaYoutube } from 'react-icons/fa';
import axios from 'axios';

const EditProblem = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    tags: '',
    youtubeLink: '',
  });
  
  const [files, setFiles] = useState([]);
  const [existingFiles, setExistingFiles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [youtubePreview, setYoutubePreview] = useState(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [problemRes, categoriesRes] = await Promise.all([
          axios.get(`/api/problems/${id}`),
          axios.get('/api/problems/categories')
        ]);
        
        const problem = problemRes.data;
        
        setFormData({
          title: problem.title,
          description: problem.description,
          category: problem.category,
          tags: problem.tags.join(','),
          youtubeLink: problem.youtubeLink || '',
        });
        
        setExistingFiles(problem.files || []);
        setCategories(categoriesRes.data);
      } catch (error) {
        console.error('Erro ao carregar problema:', error);
        setError('Erro ao carregar dados do problema.');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id, navigate]);
  
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
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleFileChange = (e) => {
    setFiles([...e.target.files]);
  };
  
  const removeExistingFile = (index) => {
    setExistingFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    
    // Validar campos
    if (!formData.title || !formData.description || !formData.category || !formData.tags) {
      setError('Todos os campos são obrigatórios.');
      setSubmitting(false);
      return;
    }
    
    try {
      // Criar FormData para envio de arquivos
      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('category', formData.category);
      data.append('tags', formData.tags);
      data.append('youtubeLink', formData.youtubeLink);
      
      // Adicionar novos arquivos
      for (let i = 0; i < files.length; i++) {
        data.append('files', files[i]);
      }
      
      // Enviar arquivos existentes que não foram removidos
      data.append('existing_files', JSON.stringify(existingFiles));
      
      // Enviar para a API
      await axios.put(`/api/problems/${id}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Redirecionar imediatamente após o sucesso
      navigate(`/problem/${id}`);
      
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao atualizar problema. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };
  
  const getFileType = (filePath) => {
    const extension = filePath.split('.').pop().toLowerCase();
    const imageExts = ['jpg', 'jpeg', 'png', 'gif'];
    const pdfExts = ['pdf'];
    
    if (imageExts.includes(extension)) return 'image';
    if (pdfExts.includes(extension)) return 'pdf';
    return 'other';
  };
  
  const getFileViewUrl = (filePath) => {
    // Usar o protocolo e domínio atual para construir a URL completa
    const serverUrl = window.location.origin;
    return `${serverUrl}/api/problems/files/${filePath}`;
  };
  
  const getFileName = (filePath) => {
    // Extrair o nome do arquivo original (após o UUID)
    const fileName = filePath.split('/').pop();
    const parts = fileName.split('_');
    if (parts.length > 1) {
      // Remover o UUID do início do nome
      return parts.slice(1).join('_');
    }
    return fileName;
  };
  
  if (loading) {
    return <div>Carregando...</div>;
  }
  
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <Button 
            variant="outline-secondary" 
            as={Link} 
            to={`/problem/${id}`}
            className="me-2"
          >
            <FaArrowLeft /> Voltar
          </Button>
          <h2 className="d-inline-block">Editar Problema</h2>
        </div>
      </div>
      
      <Card className="form-container">
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">Problema atualizado com sucesso!</Alert>}
          
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
                {formData.category === 'Outra' && (
                  <Form.Group className="mb-3" controlId="newCategory">
                    <Form.Label>Nova Categoria</Form.Label>
                    <Form.Control
                      type="text"
                      name="category"
                      onChange={handleChange}
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
            
            <Form.Group className="mb-4" controlId="youtubeLink">
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
            </Form.Group>
            
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
            
            {existingFiles.length > 0 && (
              <Form.Group className="mb-3">
                <Form.Label>Arquivos Existentes</Form.Label>
                <Row>
                  {existingFiles.map((file, idx) => {
                    const fileType = getFileType(file);
                    const fileUrl = getFileViewUrl(file);
                    const fileName = getFileName(file);
                    
                    return (
                      <Col key={idx} xs={12} md={6} lg={3} className="mb-3">
                        <Card className="file-preview h-100">
                          <Card.Header className="text-truncate small text-center">
                            {fileName}
                          </Card.Header>
                          <Card.Body className="d-flex flex-column align-items-center justify-content-center">
                            {fileType === 'image' ? (
                              <div className="text-center">
                                <img 
                                  src={fileUrl} 
                                  alt={`Arquivo ${idx + 1}`}
                                  className="img-fluid mb-2"
                                  style={{ maxHeight: '120px', objectFit: 'contain' }}
                                />
                                <div className="d-flex mt-2">
                                  <Button 
                                    variant="outline-danger" 
                                    size="sm"
                                    className="w-100"
                                    onClick={() => removeExistingFile(idx)}
                                  >
                                    <FaTrash /> Remover
                                  </Button>
                                </div>
                              </div>
                            ) : fileType === 'pdf' ? (
                              <div className="text-center">
                                <FaFilePdf className="display-4 text-danger mb-2" />
                                <p className="mb-1 small">{fileName}</p>
                                <Button 
                                  variant="outline-danger" 
                                  size="sm"
                                  className="w-100"
                                  onClick={() => removeExistingFile(idx)}
                                >
                                  <FaTrash /> Remover
                                </Button>
                              </div>
                            ) : (
                              <div className="text-center">
                                <FaFile className="display-4 text-primary mb-2" />
                                <p className="mb-1 small">{fileName}</p>
                                <Button 
                                  variant="outline-danger" 
                                  size="sm"
                                  className="w-100"
                                  onClick={() => removeExistingFile(idx)}
                                >
                                  <FaTrash /> Remover
                                </Button>
                              </div>
                            )}
                          </Card.Body>
                        </Card>
                      </Col>
                    );
                  })}
                </Row>
              </Form.Group>
            )}
            
            <Form.Group className="mb-4" controlId="files">
              <Form.Label>Adicionar Novos Arquivos</Form.Label>
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
                to={`/problem/${id}`}
                className="me-2"
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={submitting}
              >
                {submitting ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default EditProblem; 