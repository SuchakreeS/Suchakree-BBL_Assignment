import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import './index.css'
import App from './App.tsx'
import { AppAuthProvider } from './auth/AppAuthProvider'

const theme = createTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppAuthProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ThemeProvider>
    </AppAuthProvider>
  </StrictMode>,
)
