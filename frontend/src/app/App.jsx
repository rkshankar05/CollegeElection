import Navbar from "../components/layout/Navbar";
import AppRoutes from "./routes";

export default function App() {
  return (
    <>
      <Navbar />

      <main className="container">
        <AppRoutes />
      </main>
    </>
  );
}
