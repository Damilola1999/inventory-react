import { useState } from 'react';
import type { Product } from '../productService';
import ProductList from './productList';
import ProductDetail from './ProductDetails';
import './Product.css';

interface Props {
  onAddToCart?: (product: Product, quantity: number) => void;
}

export default function ProductsPage({ onAddToCart }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <main className="shop">
      {selectedId ? (
        <ProductDetail
          id={selectedId}
          onBack={() => setSelectedId(null)}
          onAddToCart={onAddToCart}
        />
      ) : (
        <ProductList onSelect={setSelectedId} />
      )}
    </main>
  );
}