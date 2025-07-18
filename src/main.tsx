import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// 로딩 스크린 제거
const removeLoadingScreen = () => {
  const loadingScreen = document.querySelector('.loading-screen') as HTMLElement;
  if (loadingScreen) {
    loadingScreen.style.opacity = '0';
    loadingScreen.style.transition = 'opacity 0.5s ease';
    setTimeout(() => {
      loadingScreen.remove();
    }, 500);
  }
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// 앱 로딩 완료 후 로딩 스크린 제거
setTimeout(removeLoadingScreen, 1000);
