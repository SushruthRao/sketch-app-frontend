import { lazy, Suspense } from "react";
import "@fontsource/gloria-hallelujah";
import "./index.css";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import { ToastContainer } from "react-toastify";
import PublicRoute from "./routes/PublicRoute";
import ProtectedRoute from "./routes/ProtectedRoute";
import SketchLoader from "./components/SketchLoader";

const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Room = lazy(() => import("./pages/Room"));
const PageNotFound = lazy(() => import("./pages/PageNotFound"));
const Test = lazy(() => import("./pages/Test"));
const Penciltool = lazy(() => import("./components/PencilTool"));

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AuthProvider>
      <Suspense fallback={<SketchLoader />}>
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
      </Suspense>
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
