import React from 'react';
import { NavLink } from 'react-router-dom';
import { Col } from 'react-bootstrap';
import { 
  FaHome, 
  FaPlus, 
  FaList, 
  FaTags, 
  FaUsers, 
  FaSignOutAlt,
  FaBars,
  FaUser
} from 'react-icons/fa';

const Sidebar = ({ collapsed, toggleSidebar, user, onLogout }) => {
  const isAdmin = user?.role === 'admin';
  const isTechnician = user?.role === 'tecnico';
  const canCreateProblem = isAdmin || isTechnician;
  
  return (
    <Col 
      xs={collapsed ? 1 : 5} 
      md={collapsed ? 1 : 3}
      lg={collapsed ? 1 : 2} 
      className={`sidebar ${collapsed ? 'collapsed' : ''} p-0 d-flex flex-column`}
    >
      <div className="sidebar-header d-flex align-items-center justify-content-between">
        {!collapsed && <h5 className="text-white mb-0 d-none d-md-block">Wiki Técnica</h5>}
        {!collapsed && <span className="text-white mb-0 d-block d-md-none">Wiki</span>}
        <button className="toggle-sidebar-btn" onClick={toggleSidebar}>
          <FaBars />
        </button>
      </div>
      
      <div className="sidebar-menu flex-grow-1">
        <NavLink to="/" className="sidebar-link">
          <FaHome className="sidebar-icon" />
          {!collapsed && <span className="sidebar-text">Início</span>}
        </NavLink>
        
        {canCreateProblem && (
          <NavLink to="/create-problem" className="sidebar-link">
            <FaPlus className="sidebar-icon" />
            {!collapsed && <span className="sidebar-text">Criar Problema</span>}
          </NavLink>
        )}
        
        <NavLink to="/categories" className="sidebar-link">
          <FaList className="sidebar-icon" />
          {!collapsed && <span className="sidebar-text">Listar por Categoria</span>}
        </NavLink>
        
        <NavLink to="/tags" className="sidebar-link">
          <FaTags className="sidebar-icon" />
          {!collapsed && <span className="sidebar-text">Listar por Tag</span>}
        </NavLink>
        
        {isAdmin && (
          <NavLink to="/users" className="sidebar-link">
            <FaUsers className="sidebar-icon" />
            {!collapsed && <span className="sidebar-text">Gerenciar Usuários</span>}
          </NavLink>
        )}
      </div>
      
      {/* Área de usuário e logout */}
      <div className="mt-auto sidebar-footer">
        {!collapsed ? (
          <div className="p-3 text-white small border-top">
            <div className="mb-2">
              <FaUser className="me-2" />
              <span>Logado como: {user?.username}</span>
            </div>
            <div className="mb-2">
              <span>Perfil: {user?.role === 'admin' ? 'Administrador' : user?.role === 'tecnico' ? 'Técnico' : 'Usuário'}</span>
            </div>
            <div 
              className="d-flex align-items-center sidebar-logout mt-2" 
              onClick={onLogout} 
              style={{ cursor: 'pointer' }}
            >
              <FaSignOutAlt className="me-2" />
              <span>Logout</span>
            </div>
          </div>
        ) : (
          <div 
            className="sidebar-link mt-auto text-center border-top py-3" 
            onClick={onLogout} 
            style={{ cursor: 'pointer' }}
          >
            <FaSignOutAlt className="sidebar-icon" />
          </div>
        )}
      </div>
    </Col>
  );
};

export default Sidebar; 