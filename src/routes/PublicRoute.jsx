import { Navigate, Outlet } from "react-router-dom";
import { useContext } from "react";
import AuthContext from "../auth/AuthContext";

const PublicRoute = () => {
  const { token } = useContext(AuthContext);
  return token ? <Navigate to="/" replace /> : <Outlet />;
};

export default PublicRoute;
