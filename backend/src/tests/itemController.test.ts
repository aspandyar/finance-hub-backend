import { jest } from '@jest/globals';
import { ItemModel } from '../models/itemProxy.js';
import request from 'supertest';
import app from '../app.js';

describe('Item Controller', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('GET /items should return a list of items', async () => {
    const mockItems = [{ id: 1, name: 'Item 1' }];

    jest.spyOn(ItemModel, 'getAllItems').mockResolvedValue(mockItems);

    const response = await request(app).get('/api/items');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockItems);
  });
});
