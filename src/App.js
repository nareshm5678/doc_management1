import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Auth/Login';
import Dashboard from './components/Dashboard/Dashboard';
import FormBuilder from './components/Forms/FormBuilder';
import OperatorForm from './components/Forms/OperatorForm';
import FormReview from './components/Forms/FormReview';
import MyForms from './components/Forms/MyForms';
import FormEdit from './components/Forms/FormEdit';
import FormView from './components/Forms/FormView';
import UserManagement from './components/Admin/UserManagement';
import Layout from './components/Layout/Layout';
import './App.css';

function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route 
                path="forms/new" 
                element={
                  <ProtectedRoute allowedRoles={['operator']}>
                    <FormBuilder />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="forms/operator-log" 
                element={
                  <ProtectedRoute allowedRoles={['operator']}>
                    <OperatorForm />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="forms/my" 
                element={
                  <ProtectedRoute allowedRoles={['operator']}>
                    <MyForms />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="forms/edit/:id" 
                element={
                  <ProtectedRoute allowedRoles={['operator']}>
                    <FormEdit />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="forms/view/:id" 
                element={
                  <ProtectedRoute>
                    <FormView />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="forms/review" 
                element={
                  <ProtectedRoute allowedRoles={['supervisor', 'admin']}>
                    <FormReview />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="users" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <UserManagement />
                  </ProtectedRoute>
                } 
              />
            </Route>
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
