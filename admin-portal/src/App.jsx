import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login.jsx";
import AdminHome from "./pages/AdminHome.jsx";
import AdminRoute from "./routes/AdminRoute.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminHome />
          </AdminRoute>
        }
      />
    </Routes>
  );
}