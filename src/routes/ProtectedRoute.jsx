import { Navigate, Outlet } from "react-router-dom";
import { useContext } from "react";
import AuthContext from "../auth/AuthContext";

const ProtectedRoute = () => {
  const { token } = useContext(AuthContext); 
  return token ? <Outlet /> : <Navigate to="/404" replace />;
};

export default ProtectedRoute;
