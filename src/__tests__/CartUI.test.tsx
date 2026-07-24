import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { CartPage } from '../pages/CartPage';
import { CartProvider } from '../lib/cartContext';

// Mock the cart context completely for UI tests
vi.mock('../lib/cartContext', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../lib/cartContext')>();
  return {
    ...mod,
    useCart: () => ({
      items: [
        {
          product: {
            id: 'p1',
            name: 'Test UI Product',
            price: 50,
            imageUrl: 'test.jpg'
          },
          quantity: 1
        }
      ],
      isLoading: false,
      getTotal: () => 50,
      getItemCount: () => 1,
      updateQuantity: vi.fn(),
      removeItem: vi.fn(),
      clearCart: vi.fn()
    })
  };
});

describe('CartPage UI', () => {
  it('renders cart items and total correctly', () => {
    render(
      <BrowserRouter>
        <CartPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Test UI Product')).toBeInTheDocument();
    expect(screen.getByText(/50,00/)).toBeInTheDocument();
    expect(screen.getByText('cart.proceedToCheckout')).toBeInTheDocument();
  });
});
