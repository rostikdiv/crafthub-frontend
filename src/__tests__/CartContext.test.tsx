import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CartProvider, useCart } from '../lib/cartContext';
import { AuthProvider } from '../lib/authContext';

// Mock auth context to bypass actual JWT decoding logic
vi.mock('../lib/authContext', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../lib/authContext')>();
  return {
    ...mod,
    useAuth: () => ({
      isAuthenticated: true,
      user: { id: 'mock-user' }
    })
  };
});

function TestComponent() {
  const { items, isLoading, getTotal, getItemCount } = useCart();
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div>
      <div data-testid="item-count">{getItemCount()}</div>
      <div data-testid="total">{getTotal()}</div>
      {items.map(item => (
        <div key={item.product.id} data-testid={`cart-item-${item.product.id}`}>
          {item.product.name} - Qty: {item.quantity}
        </div>
      ))}
    </div>
  );
}

describe('CartContext API Integration', () => {
  it('should fetch cart items from MSW API on mount', async () => {
    render(
      <AuthProvider>
        <CartProvider>
          <TestComponent />
        </CartProvider>
      </AuthProvider>
    );

    // Initial loading state
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Wait for API response and render
    await waitFor(() => {
      expect(screen.getByTestId('cart-item-mock-product-1')).toBeInTheDocument();
    });

    // Check quantity and total based on MSW mock
    expect(screen.getByTestId('cart-item-mock-product-1')).toHaveTextContent('Mock Product mock-product-1 - Qty: 2');
    expect(screen.getByTestId('item-count')).toHaveTextContent('2');
    expect(screen.getByTestId('total')).toHaveTextContent('200'); // 100 price * 2 qty
  });
});
