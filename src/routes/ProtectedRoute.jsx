import { Navigate, Outlet } from "react-router-dom";
import { useContext } from "react";
import AuthContext from "../auth/AuthContext";
import SketchLoader from "../components/SketchLoader";

const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useContext(AuthContext);

  if (loading) return <SketchLoader />;

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
