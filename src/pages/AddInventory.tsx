import { Navigate, useLocation } from 'react-router-dom'

export default function AddInventory() {
  const location = useLocation()
  return <Navigate to={{ pathname: '/inventory', search: location.search }} replace />
}
