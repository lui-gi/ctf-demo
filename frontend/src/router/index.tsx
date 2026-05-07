import { createBrowserRouter } from 'react-router-dom'
import RequireAuth from './RequireAuth'
import RedirectIfAuth from './RedirectIfAuth'
import RootLayout from '../components/layout/RootLayout'
import AuthLayout from '../components/layout/AuthLayout'
import LandingPage from '../pages/LandingPage'
import LoginPage from '../pages/LoginPage'
import RegisterPage from '../pages/RegisterPage'
import DashboardPage from '../pages/DashboardPage'
import ChallengesPage from '../pages/ChallengesPage'
import CategoryPage from '../pages/CategoryPage'
import ChallengePage from '../pages/ChallengePage'
import BountiesPage from '../pages/BountiesPage'
import CrewPage from '../pages/CrewPage'
import ProfilePage from '../pages/ProfilePage'
import NotFoundPage from '../pages/NotFoundPage'

export const router = createBrowserRouter([
  {
    element: <RedirectIfAuth />,
    children: [
      { path: '/', element: <LandingPage /> },
      {
        element: <AuthLayout />,
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/register', element: <RegisterPage /> },
        ],
      },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <RootLayout />,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/challenges', element: <ChallengesPage /> },
          { path: '/challenges/:category', element: <CategoryPage /> },
          { path: '/challenges/:category/:slug', element: <ChallengePage /> },
          { path: '/bounties', element: <BountiesPage /> },
          { path: '/crew', element: <CrewPage /> },
          { path: '/profile', element: <ProfilePage /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
