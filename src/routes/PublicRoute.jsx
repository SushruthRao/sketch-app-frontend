import { Navigate, Outlet } from "react-router-dom";
import { useContext } from "react";
import AuthContext from "../auth/AuthContext";
import SketchLoader from "../components/SketchLoader";

const PublicRoute = () => {
  const { isAuthenticated, loading } = useContext(AuthContext);

  if (loading) return <SketchLoader />;

  return isAuthenticated ? <Navigate to="/" replace /> : <Outlet />;
};

export default PublicRoute;
