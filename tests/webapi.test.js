import request from 'supertest'
import startServer from '../src/api/server'

describe('GET /', () => {
  // token not being sent - should respond with a 401
  test('It should require authorization', async () => {
    const response = await request(startServer)
      .get('/Message');
    expect(response.statusCode).toBe(401);
  });
  test('It should require a valid, non-expired token', async () => {
    const response = await request(startServer)
      .get('/Message')
      .set('Authorization', `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFsYW5lK2xhcmdlcm9vbUB3aWNrci5jb20iLCJzZXNzaW9uIjoia0djNENuU2xBMDNWZVU2bFR6T28ybk03IiwiaG9zdCI6Imh0dHA6Ly9sb2NhbGhvc3QiLCJwb3J0IjoiNDU0NSIsImlhdCI6MTU5MjQ4ODA1MCwiZXhwIjoxNTkyNDg5ODUwfQ.by8McejEpjuDaGnSqBZ9G7ANDARn68qce05-P8Bx4MI`);
    expect(response.statusCode).toBe(401);
  });
  // send the token - should respond with a 200
  test('It responds with JSON', async () => {
    const response = await request(startServer)
      .get('/')
      .set('Authorization', `Bearer ${token}`);
    expect(response.statusCode).toBe(200);
    expect(response.type).toBe('application/json');
  });
});