import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  FileText, 
  LayoutDashboard, 
  PlusCircle, 
  ClipboardCheck, 
  Users, 
  LogOut,
  User,
  FolderOpen
} from 'lucide-react';
import './Layout.css';

const Layout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const handleLogout = () => {
    logout();
  };

  const navigationItems = [
    {
      path: '/dashboard',
      icon: LayoutDashboard,
      label: 'Dashboard',
      roles: ['operator', 'supervisor', 'admin']
    },
    {
      path: '/forms/new',
      icon: PlusCircle,
      label: 'New Form',
      roles: ['operator']
    },
    {
      path: '/forms/my',
      icon: FolderOpen,
      label: 'My Forms',
      roles: ['operator']
    },
    {
      path: '/forms/review',
      icon: ClipboardCheck,
      label: 'Review Forms',
      roles: ['supervisor', 'admin']
    },
    {
      path: '/users',
      icon: Users,
      label: 'User Management',
      roles: ['admin']
    }
  ];

  const visibleItems = navigationItems.filter(item => 
    item.roles.includes(user?.role)
  );

  return (
    <div className="layout-container">
      <nav className="sidebar">
        <div className="sidebar-header">
          <FileText className="sidebar-logo" size={32} />
          <h2>DocMS</h2>
        </div>

        <div className="sidebar-nav">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="sidebar-footer">
          <div className="user-info">
            <User size={16} />
            <div className="user-details">
              <div className="username">{user?.username}</div>
              <div className="user-role">{user?.role?.toUpperCase()}</div>
              {user?.department && (
                <div className="user-department">{user.department}</div>
              )}
            </div>
          </div>
          <button onClick={handleLogout} className="logout-button">
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </nav>

      <main className="main-content">
        <header className="main-header">
          <h1>Document Management System</h1>
          <div className="header-user">
            Welcome, {user?.username}
          </div>
        </header>
        
        <div className="content-area">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
