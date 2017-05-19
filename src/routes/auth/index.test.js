/* @flow */
require('dotenv').config();

const app = require('../../app');
const mocks = require('../../mocks');
const request = require('supertest');
const knex = require('../../db/connection');

beforeEach(async () => {
  await knex.migrate.rollback();
  await knex.migrate.latest();
  await knex.seed.run();
});

afterEach(async () => {
  await knex.migrate.rollback();
});

afterAll(async () => {
  await knex.destroy();
});

// ========================
//   AUTH/SIGNUP
// ========================
test('POST /auth/signup, throws 400 when email is invalid', async () => {
  const res = await request(app.listen())
    .post('/auth/signup')
    .send({ email: 'michaeltest.com', password: 'herman123' })
    .expect(400);
  expect(res.body).toEqual({});
});

test('POST /auth/signup, throws 400 when password is invalid', async () => {
  const res = await request(app.listen())
    .post('/auth/signup')
    .send({ email: 'michael@test.com', password: 'herman' })
    .expect(400);
  expect(res.body).toEqual({});
});

test('POST /auth/signup, throws 409 when email is already in use', async () => {
  const res = await request(app.listen())
    .post('/auth/signup')
    .send({ email: mocks.user.email, password: 'herman123' })
    .expect(409);
  expect(res.body).toEqual({});
});

test('POST /auth/signup, should register a new user', async () => {
  const res = await request(app.listen())
    .post('/auth/signup')
    .send({ email: 'michael@test.com', password: 'herman123' })
    .expect(200);
  expect(res.body.id).toBeTruthy();
  expect(res.body.email).toBe('michael@test.com');
  expect(res.body.createdAt).toBeTruthy();
  expect(res.body.sessionToken).toBeTruthy();
});

// ========================
//   AUTH/LOGIN
// ========================

test('POST /auth/login, throws 400 when email is empty', async () => {
  const res = await request(app.listen())
    .post('/auth/login')
    .send({ password: 'herman123' })
    .expect(400);
  expect(res.body).toEqual({});
});

test('POST /auth/login, throws 400 when password is empty', async () => {
  const res = await request(app.listen())
    .post('/auth/login')
    .send({ email: mocks.user.email })
    .expect(400);
  expect(res.body).toEqual({});
});

test('POST /auth/login, throws 401 when credentials are invalid', async () => {
  const res = await request(app.listen())
    .post('/auth/login')
    .send({ email: mocks.user.email, password: 'asdfasdf' })
    .expect(401);
  expect(res.body).toEqual({});
});

test('POST /auth/login, logins an existing user', async () => {
  const res = await request(app.listen())
    .post('/auth/login')
    .send({ email: mocks.user.email, password: mocks.userPlainTextPassword })
    .expect(200);
  expect(res.body.id).toBeTruthy();
  expect(res.body.email).toBe(mocks.user.email);
  expect(res.body.createdAt).toBeTruthy();
  expect(res.body.sessionToken).toBeTruthy();
});

// ========================
//   AUTH/LOGOUT
// ========================
test('POST /auth/logout, logout a logged in user', async () => {
  const res = await request(app.listen())
    .post('/auth/logout')
    .set({ 'X-APP-SESSION-TOKEN': mocks.session.token })
    .expect(200);
  expect(res.body.success).toBe(true);
});

test("POST /auth/logout, doesn't logout an unauthenticated user", async () => {
  const res = await request(app.listen())
    .post('/auth/logout')
    .set({ 'X-APP-SESSION-TOKEN': '123e4567-e89b-12d3-a456-426655440000' })
    .expect(401);
});
