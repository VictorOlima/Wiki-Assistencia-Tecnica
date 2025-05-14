import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, Button, Badge, Row, Col, Modal } from 'react-bootstrap';
import { FaFilePdf, FaEdit, FaTrash, FaArrowLeft, FaFileImage, FaFile, FaDownload, FaYoutube } from 'react-icons/fa';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

const ProblemDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [problem, setProblem] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [youtubeVideoId, setYoutubeVideoId] = useState(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [problemRes, userRes] = await Promise.all([
          axios.get(`/api/problems/${id}`),
          axios.get('/api/auth/me')
        ]);
        
        setProblem(problemRes.data);
        setUser(userRes.data);
        
        // Extrair ID do YouTube se houver um link
        if (problemRes.data.youtubeLink) {
          extractYoutubeId(problemRes.data.youtubeLink);
        }
      } catch (error) {
        console.error('Erro ao carregar problema:', error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);
  
  // Função para extrair ID do vídeo do YouTube
  const extractYoutubeId = (url) => {
    if (!url) return;
    
    try {
      const youtubeRegex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/;
      const match = url.match(youtubeRegex);
      
      if (match && match[1]) {
        setYoutubeVideoId(match[1]);
      }
    } catch (err) {
      console.error('Erro ao extrair ID do YouTube:', err);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`/api/problems/${id}`);
      navigate('/');
    } catch (error) {
      console.error('Erro ao excluir problema:', error);
    }
  };

  const isAuthor = user?.id === problem?.author_id;
  const isAdmin = user?.role === 'admin';
  const canEdit = isAdmin || isAuthor;
  const canDelete = isAdmin;

  const openImageModal = (imagePath) => {
    setSelectedImage(imagePath);
    setShowImageModal(true);
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
  
  const getFileDownloadUrl = (filePath) => {
    // Usar o protocolo e domínio atual para construir a URL completa
    const serverUrl = window.location.origin;
    return `${serverUrl}/api/problems/files/${filePath}?download=true`;
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
  
  // Função para lidar com o download de arquivos
  const handleDownload = async (fileUrl, fileName) => {
    try {
      // Usar axios para fazer uma solicitação direta ao backend
      const response = await axios.get(fileUrl, {
        responseType: 'blob', // Importante para receber o arquivo como blob
      });
      
      // Criar um URL de objeto para o blob
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      
      // Criar um link temporário para download
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName || 'arquivo';
      document.body.appendChild(link);
      link.click();
      
      // Limpar
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(link);
    } catch (error) {
      console.error('Erro ao baixar arquivo:', error);
      alert('Não foi possível baixar o arquivo. Por favor, tente novamente.');
    }
  };
  
  // Função para abrir arquivos PDF em nova aba
  const handleViewPdf = async (fileUrl) => {
    try {
      // Usar axios para obter o PDF
      const response = await axios.get(fileUrl, {
        responseType: 'blob',
      });
      
      // Criar URL do objeto para abrir em nova aba
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      window.open(blobUrl, '_blank');
      
      // Não revogamos o URL imediatamente para permitir a visualização
      // O navegador irá limpar automaticamente após fechar a aba
    } catch (error) {
      console.error('Erro ao abrir PDF:', error);
      alert('Não foi possível abrir o arquivo PDF. Por favor, tente novamente.');
    }
  };

  // Função para extrair ID do vídeo do YouTube de URLs no conteúdo
  const transformYoutubeLinks = (text) => {
    if (!text) return text;
    
    // Padrão para encontrar links do YouTube no texto
    const youtubeRegex = /https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([^"&?/\s]{11})(?:[^\s]*)/g;
    
    // Substituir links do YouTube por embeddings (sem manter o link original)
    return text.replace(youtubeRegex, (match, videoId) => {
      return `\n\n<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>\n\n`;
    });
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!problem) {
    return <div>Problema não encontrado</div>;
  }

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
        </div>
        
        <div>
          {canEdit && (
            <Button 
              variant="primary" 
              as={Link} 
              to={`/edit-problem/${id}`}
              className="me-2"
            >
              <FaEdit /> Editar
            </Button>
          )}
          
          {canDelete && (
            <Button 
              variant="danger" 
              onClick={() => setShowDeleteModal(true)}
            >
              <FaTrash /> Excluir
            </Button>
          )}
        </div>
      </div>
      
      <Card className="mb-4">
        <Card.Body>
          <h2>{problem.title}</h2>
          <div className="mb-3">
            <Badge bg="secondary" className="me-2">
              Categoria: {problem.category}
            </Badge>
            <span className="text-muted">
              Criado por {problem.author} em {new Date(problem.created_at).toLocaleDateString()}
            </span>
          </div>
          
          <div className="mb-3">
            {problem.tags.map((tag, idx) => (
              <Badge key={idx} bg="info" className="me-1">
                {tag}
              </Badge>
            ))}
          </div>
          
          <div className="mb-4">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={{
                // Permitir que iframes sejam renderizados (para YouTube)
                iframe: ({node, ...props}) => (
                  <div className="ratio ratio-16x9 my-3" style={{maxWidth: '560px'}}>
                    <iframe {...props} />
                  </div>
                ),
                // Evitar aninhamento de parágrafos
                p: ({children}) => <div className="markdown-paragraph mb-2">{children}</div>,
                // Abrir links em nova aba
                a: ({node, ...props}) => (
                  <a target="_blank" rel="noopener noreferrer" {...props} />
                )
              }}
            >
              {transformYoutubeLinks(problem.description)}
            </ReactMarkdown>
          </div>
          
          {youtubeVideoId && (
            <div className="mb-4">
              <h5 className="mb-3">
                <FaYoutube className="text-danger me-2" /> Vídeo Relacionado
              </h5>
              <div className="ratio ratio-16x9" style={{ maxWidth: '700px' }}>
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeVideoId}`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          )}
          
          {problem.files.length > 0 && (
            <div>
              <h5 className="mb-3">Arquivos</h5>
              <Row>
                {problem.files.map((file, idx) => {
                  const fileType = getFileType(file);
                  const fileViewUrl = getFileViewUrl(file);
                  const fileDownloadUrl = getFileDownloadUrl(file);
                  const fileName = getFileName(file);
                  
                  return (
                    <Col key={idx} xs={12} sm={6} md={4} lg={3} className="mb-3">
                      <Card className="file-preview h-100">
                        <Card.Header className="text-truncate small text-center">
                          {fileName}
                        </Card.Header>
                        <Card.Body className="d-flex flex-column align-items-center justify-content-center">
                          {fileType === 'image' ? (
                            <div className="text-center mb-2">
                              <img 
                                src={fileViewUrl} 
                                alt={`Anexo ${idx + 1}`} 
                                className="img-fluid mb-2"
                                style={{ maxHeight: '150px', cursor: 'pointer' }}
                                onClick={() => openImageModal(fileViewUrl)}
                              />
                              <div>
                                <Button 
                                  variant="primary" 
                                  size="sm"
                                  onClick={() => openImageModal(fileViewUrl)}
                                  className="me-2"
                                >
                                  <FaFileImage /> Ver
                                </Button>
                                <Button 
                                  variant="secondary" 
                                  size="sm" 
                                  onClick={() => handleDownload(fileDownloadUrl, fileName)}
                                >
                                  <FaDownload /> Baixar
                                </Button>
                              </div>
                            </div>
                          ) : fileType === 'pdf' ? (
                            <div className="text-center">
                              <FaFilePdf className="pdf-icon display-4 text-danger mb-2" />
                              <div>
                                <Button 
                                  variant="danger" 
                                  size="sm"
                                  onClick={() => handleViewPdf(fileViewUrl)}
                                  className="me-2"
                                >
                                  <FaFilePdf /> Ver PDF
                                </Button>
                                <Button 
                                  variant="secondary" 
                                  size="sm" 
                                  onClick={() => handleDownload(fileDownloadUrl, fileName)}
                                >
                                  <FaDownload /> Baixar
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center">
                              <FaFile className="file-icon display-4 text-primary mb-2" />
                              <div>
                                <Button 
                                  variant="primary" 
                                  size="sm"
                                  onClick={() => handleDownload(fileDownloadUrl, fileName)}
                                >
                                  <FaDownload /> Baixar
                                </Button>
                              </div>
                            </div>
                          )}
                        </Card.Body>
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            </div>
          )}
        </Card.Body>
      </Card>
      
      {/* Modal de confirmação para exclusão */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirmar Exclusão</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Tem certeza que deseja excluir este problema? Esta ação não pode ser desfeita.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Excluir
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Modal para visualização de imagem */}
      <Modal 
        show={showImageModal} 
        onHide={() => setShowImageModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton />
        <Modal.Body className="text-center">
          {selectedImage && (
            <img 
              src={selectedImage} 
              alt="Imagem em tamanho real" 
              style={{ maxWidth: '100%', maxHeight: '80vh' }}
            />
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default ProblemDetail; 