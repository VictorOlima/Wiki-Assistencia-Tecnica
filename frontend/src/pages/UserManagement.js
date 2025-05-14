import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Card, Alert, Badge } from 'react-bootstrap';
import { FaEdit, FaTrash, FaUserPlus } from 'react-icons/fa';
import axios from 'axios';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'user',
  });
  
  useEffect(() => {
    fetchUsers();
  }, []);
  
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      setError('Falha ao carregar lista de usuários.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const openCreateModal = () => {
    setFormData({
      username: '',
      password: '',
      role: 'user',
    });
    setShowCreateModal(true);
  };
  
  const openEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      password: '',
      role: user.role,
    });
    setShowEditModal(true);
  };
  
  const openDeleteModal = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };
  
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!formData.username || !formData.password) {
      setError('Usuário e senha são obrigatórios.');
      return;
    }
    
    try {
      await axios.post('/api/auth/register', formData);
      setSuccess('Usuário criado com sucesso!');
      setShowCreateModal(false);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao criar usuário.');
    }
  };
  
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!formData.username) {
      setError('Nome de usuário é obrigatório.');
      return;
    }
    
    const updateData = {
      username: formData.username,
      role: formData.role,
    };
    
    if (formData.password) {
      updateData.password = formData.password;
    }
    
    try {
      await axios.put(`/api/users/${selectedUser.id}`, updateData);
      setSuccess('Usuário atualizado com sucesso!');
      setShowEditModal(false);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao atualizar usuário.');
    }
  };
  
  const handleDeleteUser = async () => {
    setError('');
    setSuccess('');
    
    try {
      await axios.delete(`/api/users/${selectedUser.id}`);
      setSuccess('Usuário excluído com sucesso!');
      setShowDeleteModal(false);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao excluir usuário.');
    }
  };
  
  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return <Badge bg="danger">Administrador</Badge>;
      case 'tecnico':
        return <Badge bg="primary">Técnico</Badge>;
      default:
        return <Badge bg="secondary">Usuário</Badge>;
    }
  };
  
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Gerenciamento de Usuários</h2>
        <Button variant="success" onClick={openCreateModal}>
          <FaUserPlus /> Novo Usuário
        </Button>
      </div>
      
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}
      
      <Card>
        <Card.Body>
          {loading ? (
            <div className="text-center py-4">Carregando...</div>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Usuário</th>
                  <th>Perfil</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.username}</td>
                    <td>{getRoleBadge(user.role)}</td>
                    <td>
                      <Button 
                        variant="outline-primary" 
                        size="sm" 
                        className="me-2"
                        onClick={() => openEditModal(user)}
                      >
                        <FaEdit /> Editar
                      </Button>
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={() => openDeleteModal(user)}
                      >
                        <FaTrash /> Excluir
                      </Button>
                    </td>
                  </tr>
                ))}
                
                {users.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-center">
                      Nenhum usuário encontrado
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
      
      {/* Modal de criação de usuário */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Criar Novo Usuário</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateUser}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Nome de Usuário</Form.Label>
              <Form.Control
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Senha</Form.Label>
              <Form.Control
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Perfil</Form.Label>
              <Form.Select
                name="role"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="user">Usuário</option>
                <option value="tecnico">Técnico</option>
                <option value="admin">Administrador</option>
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit">
              Criar Usuário
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
      
      {/* Modal de edição de usuário */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Editar Usuário</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleUpdateUser}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Nome de Usuário</Form.Label>
              <Form.Control
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Nova Senha (deixe em branco para manter a atual)</Form.Label>
              <Form.Control
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Perfil</Form.Label>
              <Form.Select
                name="role"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="user">Usuário</option>
                <option value="tecnico">Técnico</option>
                <option value="admin">Administrador</option>
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit">
              Salvar Alterações
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
      
      {/* Modal de confirmação para exclusão */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirmar Exclusão</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Tem certeza que deseja excluir o usuário <strong>{selectedUser?.username}</strong>?
          Esta ação não pode ser desfeita.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleDeleteUser}>
            Excluir
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default UserManagement; 