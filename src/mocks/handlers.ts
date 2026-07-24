import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/v1/cart', () => {
    return HttpResponse.json({
      sections: [
        {
          items: [
            { productId: 'mock-product-1', quantity: 2 }
          ]
        }
      ]
    });
  }),
  
  http.post('/api/v1/products/batch', async ({ request }) => {
    const ids = await request.json() as string[];
    const products = ids.map(id => ({
      id,
      name: `Mock Product ${id}`,
      description: 'Mock description',
      price: 100,
      quantity: 10,
      sellerId: 'mock-seller-id',
      previewImageUrl: 'mock-image-url.jpg'
    }));
    return HttpResponse.json(products);
  }),

  http.post('/api/v1/cart/items', async ({ request }) => {
    const data = await request.json();
    return HttpResponse.json({ success: true, data });
  }),

  http.delete('/api/v1/cart/items/:productId', () => {
    return HttpResponse.json({ success: true });
  }),

  http.delete('/api/v1/cart', () => {
    return HttpResponse.json({ success: true });
  })
];
