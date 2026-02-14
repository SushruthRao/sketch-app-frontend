import { StrictMode } from "react";
import "@fontsource/gloria-hallelujah";
import "./index.css";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Router, Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { AuthProvider } from "./auth/AuthProvider";
import Room from "./pages/Room";
import { Test } from "./pages/Test";
import HomeRefactored from "./pages/Home";
import { ToastContainer } from "react-toastify";
import PageNotFound from "./pages/PageNotFound";
import PublicRoute from "./routes/PublicRoute";
import ProtectedRoute from "./routes/ProtectedRoute";
import Penciltool from "./components/PencilTool";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AuthProvider>
      <Routes>
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />


        <Route element={<ProtectedRoute />}>
          <Route path="/room/:roomCode" element={<Room />} />
        </Route>


        <Route path="/test" element={<Test />} />
        <Route path="/pencil-test" element={<Penciltool />} />
        <Route path="/404" element={<PageNotFound />} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
      <ToastContainer
        style={{ zIndex: 99999 }}
        limit={3}
        closeOnClick={true}
        newestOnTop={true}
        closeButton={false}
      />
    </AuthProvider>
  </BrowserRouter>,
);
