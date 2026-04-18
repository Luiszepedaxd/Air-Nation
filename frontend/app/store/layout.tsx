import { CartProvider } from './CartContext'
import { CartDrawer } from './CartDrawer'

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      {children}
      <CartDrawer />
    </CartProvider>
  )
}
