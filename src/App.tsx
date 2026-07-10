import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Training } from './pages/Training';
import { Games } from './pages/Games';
import { Study } from './pages/Study';
import { Data } from './pages/Data';
import { coachService } from './services/coachService';
import { deleteDataPacksFromFile } from './data/dataPackService';

const LOCAL_USER = { uid: 'local-user', displayName: 'Jugador Local', email: 'local@localhost' };

function initLocalUser() {
  const saved = localStorage.getItem('pokercoach_local_user');
  if (!saved) {
    localStorage.setItem('pokercoach_local_user', JSON.stringify(LOCAL_USER));
  }
  const cleanupKey = 'pokercoach_cleanup_01_txt_datapack';
  if (!localStorage.getItem(cleanupKey)) {
    deleteDataPacksFromFile('01.txt');
    localStorage.setItem(cleanupKey, 'done');
  }
  // Inicializar coaches por defecto
  coachService.getAll();
}

initLocalUser();

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="training" element={<Training />} />
          <Route path="games" element={<Games />} />
          <Route path="study" element={<Study />} />
          <Route path="data" element={<Data />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
