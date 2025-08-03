import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './store';
import { getCurrentUser } from './store/auth-slice';

// Components
import Layout from './components/common/Layout';
import ProtectedRoute from './components/common/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Groups from './pages/Groups';
import Roles from './pages/Roles';
import Modules from './pages/Modules';
import Permissions from './pages/Permissions';

function App() {
  // const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, token, user } = useSelector((state: RootState) => state.auth);

  // useEffect(() => {
  //   if (token && isAuthenticated && !user) {
  //     dispatch(getCurrentUser(user?.id));
  //   }
  // }, [dispatch, token, isAuthenticated, user]);

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route
            path="/login"
            element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />}
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="users" element={<Users />} />
            <Route path="groups" element={<Groups />} />
            <Route path="roles" element={<Roles />} />
            <Route path="modules" element={<Modules />} />
            <Route path="permissions" element={<Permissions />} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
