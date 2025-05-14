import React, { useState, useEffect } from 'react';
import { Form, Button, Alert, Container, Card } from 'react-bootstrap';
import axios from 'axios';

// Configura o Axios para incluir credenciais em todas as requisições
axios.defaults.withCredentials = true;

const Login = ({ setUser }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [setupMessage, setSetupMessage] = useState('');
  const [systemChecked, setSystemChecked] = useState(false);

  // Verificar se o sistema precisa de configuração inicial
  useEffect(() => {
    const checkSetup = async () => {
      try {
        // Verificar se o backend está rodando
        await axios.get('/api/health');
        
        // Verificar se já existem usuários no sistema
        try {
          const usersResponse = await axios.get('/api/users/');
          // Se a requisição for bem-sucedida e retornar pelo menos um usuário,
          // significa que já existe um administrador configurado
          if (usersResponse.data && usersResponse.data.length > 0) {
            setNeedsSetup(false);
          } else {
            // Se não houver usuários, precisa de configuração
            setNeedsSetup(true);
          }
        } catch (userError) {
          // Verificar se o erro é de autorização (precisa de login)
          if (userError.response && userError.response.status === 401) {
            // Se recebeu 401, significa que a API está protegida,
            // o que indica que já existe uma configuração inicial
            setNeedsSetup(false);
          } else {
            // Outros erros podem indicar que a aplicação está em estado inicial
            setNeedsSetup(true);
          }
        }
      } catch (error) {
        // Backend não está respondendo, pode indicar um problema
        console.error("Erro ao verificar o estado do sistema:", error);
        setError('Erro ao conectar com o servidor. Verifique se o backend está rodando.');
        setNeedsSetup(true);
      } finally {
        setSystemChecked(true);
      }
    };

    checkSetup();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Verificar se o backend está rodando
      try {
        await axios.get('/api/health');
      } catch (healthError) {
        setError('Erro ao conectar com o servidor. Certifique-se de que o backend está rodando na porta 5000.');
        setLoading(false);
        return;
      }

      if (isSettingUp) {
        // Configurar o admin inicial
        await axios.post('/api/setup', { username, password });
        setSetupMessage('Administrador configurado com sucesso! Agora você pode fazer login.');
        setIsSettingUp(false);
        setNeedsSetup(false); // Após configurar, não precisa mais de setup
      } else {
        // Login normal
        const response = await axios.post('/api/auth/login', { username, password }, {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          }
        });
        console.log("Login bem-sucedido:", response.data);
        setUser(response.data);
      }
    } catch (err) {
      console.error("Erro:", err);
      if (err.response) {
        // O servidor respondeu com um status de erro
        setError(err.response.data?.error || 'Operação falhou. Tente novamente.');
      } else if (err.request) {
        // A requisição foi feita mas não houve resposta
        setError('Servidor não respondeu. Verifique sua conexão.');
      } else {
        // Algo aconteceu na configuração da requisição
        setError('Erro ao processar requisição. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleSetup = () => {
    setIsSettingUp(!isSettingUp);
    setError('');
    setSetupMessage('');
  };

  return (
    <Container>
      <Card className="login-form">
        <Card.Body>
          <Card.Title className="text-center mb-4">
            <h2>Wiki de Problemas Técnicos</h2>
            <p className="text-muted">Assistência Eletrônica</p>
          </Card.Title>
          
          {error && <Alert variant="danger">{error}</Alert>}
          {setupMessage && <Alert variant="success">{setupMessage}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="username">
              <Form.Label>{isSettingUp ? 'Nome do Administrador' : 'Nome de Usuário'}</Form.Label>
              <Form.Control
                type="text"
                placeholder={isSettingUp ? "Digite o nome do administrador" : "Digite seu nome de usuário"}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="password">
              <Form.Label>Senha</Form.Label>
              <Form.Control
                type="password"
                placeholder={isSettingUp ? "Digite a senha do administrador" : "Digite sua senha"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Form.Group>

            <div className="d-grid">
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? 'Carregando...' : (isSettingUp ? 'Configurar Sistema' : 'Entrar')}
              </Button>
            </div>
          </Form>
          
          {/* Mostrar o botão de configuração apenas se realmente precisar de setup e após a verificação do sistema */}
          {needsSetup && systemChecked && (
            <div className="mt-3 text-center">
              <Button 
                variant="link" 
                onClick={toggleSetup}
              >
                {isSettingUp ? 'Voltar para o Login' : 'Configurar Administrador Inicial'}
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Login; 