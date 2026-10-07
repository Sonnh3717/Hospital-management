import { Link, Outlet } from "react-router-dom";

export default function MainLayout() {
  return (
    <>
      <header className="site-header">
        <Link to="/">SWD</Link>
      </header>
      <main className="page-container">
        <Outlet />
      </main>
    </>
  );
}
