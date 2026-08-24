import { Outlet } from 'react-router-dom';
import { Header } from './Header';

export function PublicoLayout() {
  return (
    <>
      <Header />
      <Outlet />
    </>
  );
}
