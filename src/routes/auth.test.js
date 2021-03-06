require('dotenv').config();
const request = require('supertest');
const app = require('../app');
const mocks = require('../db/seeds');
const knex = require('../db/connection');
const mandrillService = require('../services/mandrill');
jest.mock('../services/mandrill.js');

beforeEach(async () => {
  await knex.migrate.rollback();
  await knex.migrate.latest();
  await knex.seed.run();
  jest.clearAllMocks();
});

afterEach(async () => {
  await knex.migrate.rollback();
});

afterAll(async () => {
  await knex.destroy();
});

// ==========================================
//   POST /auth/signup
// ==========================================
test('POST /auth/signup, throws 422 when email is invalid', async () => {
  await request(app.listen())
    .post('/auth/signup')
    .send({ email: 'michaeltest.com', password: 'herman123' })
    .expect(422);
});

test('POST /auth/signup, throws 422 when password is invalid', async () => {
  await request(app.listen())
    .post('/auth/signup')
    .send({ email: 'michael@test.com', password: 'herman' })
    .expect(422);
});

test('POST /auth/signup, throws 409 when email is already in use', async () => {
  await request(app.listen())
    .post('/auth/signup')
    .send({ email: mocks.user.email, password: 'herman123' })
    .expect(409);
});

test('POST /auth/signup, should register a new user', async () => {
  const res = await request(app.listen())
    .post('/auth/signup')
    .send({ email: 'michael@test.com', password: 'herman123' })
    .expect(200);
  expect(res.body.data).toEqual({});
  expect(mandrillService.sendVerifyAccountEmail).toHaveBeenCalledTimes(1);
});

// ==========================================
//   POST /auth/login
// ==========================================
test('POST /auth/login, throws 422 when email is empty', async () => {
  await request(app.listen()).post('/auth/login').send({ password: 'herman123' }).expect(422);
});

test('POST /auth/login, throws 422 when password is empty', async () => {
  await request(app.listen()).post('/auth/login').send({ email: mocks.user.email }).expect(422);
});

test('POST /auth/login, throws 401 when credentials are invalid', async () => {
  await request(app.listen())
    .post('/auth/login')
    .send({ email: mocks.user.email, password: 'asdfasdf' })
    .expect(401);
});

test('POST /auth/login, logins an existing user', async () => {
  const res = await request(app.listen())
    .post('/auth/login')
    .send({ email: mocks.user.email, password: mocks.userPlainTextPassword })
    .expect(200);
  expect(res.body.data.user.id).toBeTruthy();
  expect(res.body.data.user.email).toBe(mocks.user.email);
  expect(res.body.data.sessionToken).toBeTruthy();
});

// ==========================================
//   POST /auth/logout
// ==========================================
test("POST /auth/logout, doesn't logout an unauthenticated user", async () => {
  await request(app.listen())
    .post('/auth/logout')
    .set({ 'X-App-Session-Token': '123e4567-e89b-12d3-a456-426655442200' })
    .expect(401);
});

test('POST /auth/logout, logout a logged in user', async () => {
  const res = await request(app.listen())
    .post('/auth/logout')
    .set({ 'X-App-Session-Token': mocks.session.token })
    .expect(200);
  expect(res.body.data).toEqual({});
});

// ==========================================
//   GET /auth/verify
// ==========================================
test('GET /auth/verify, throws 422 when querystring is invalid', async () => {
  await request(app.listen()).get('/auth/verify?token=test').expect(422);
});

test('GET /auth/verify, throws 422 when the user is not found', async () => {
  await request(app.listen())
    .get(`/auth/verify?token=${mocks.user.verifyEmailToken}&email=fake@fake.com`)
    .expect(422);
});

test('GET /auth/verify, succeeds with valid input', async () => {
  await request(app.listen())
    .get(`/auth/verify?token=${mocks.user.verifyEmailToken}&email=${mocks.user.email}`)
    .expect('Content-Type', /html/)
    .expect(200);
});

// ==========================================
//   POST /auth/forgot
// ==========================================
test('POST /auth/forgot, throws 422 when email is invalid', async () => {
  await request(app.listen()).post('/auth/forgot').send({ email: 'michaeltest.com' }).expect(422);
});

test('POST /auth/forgot, throws 404 when user is not found', async () => {
  await request(app.listen()).post('/auth/forgot').send({ email: 'michael@test.com' }).expect(404);
});

test('POST /auth/forgot, sends a mail when succeeds', async () => {
  const res = await request(app.listen())
    .post('/auth/forgot')
    .send({ email: mocks.user.email })
    .expect(200);
  expect(res.body.data).toEqual({});
  expect(mandrillService.sendPasswordResetEmail).toHaveBeenCalledTimes(1);
});

// ==========================================
//   GET /auth/reset
// ==========================================
test('GET /auth/reset, throws 422 when querystring is invalid', async () => {
  await request(app.listen()).get('/auth/reset?token=test').expect(422);
});

test('GET /auth/reset, succeeds with valid input', async () => {
  await request(app.listen())
    .get(`/auth/reset?token=${mocks.user.resetPasswordToken}&email=${mocks.user.email}`)
    .expect('Content-Type', /html/)
    .expect(200);
});

// ==========================================
//   POST /auth/reset
// ==========================================
test('POST /auth/reset, throws 422 when input is invalid', async () => {
  await request(app.listen()).post('/auth/reset').send({ token: 'a' }).expect(422);
});

test('POST /auth/reset, redirects to 302 when password is not provided', async () => {
  await request(app.listen())
    .post('/auth/reset')
    .send({ token: 'test', email: 'michael@test.com' })
    .expect('location', /error=Required field: password/)
    .expect(302);
});

test('POST /auth/reset, redirects to 302 when user is not found', async () => {
  await request(app.listen())
    .post('/auth/reset')
    .send({ token: 'test', email: 'michael@test.com', password: '123456789' })
    .expect('location', /error=Password reset token is invalid or has expired/)
    .expect(302);
});

test('POST /auth/reset, succeeds with valid input', async () => {
  await request(app.listen())
    .post('/auth/reset')
    .send({
      token: mocks.user.resetPasswordToken,
      email: mocks.user.email,
      password: '123456789',
    })
    .expect('Content-Type', /html/)
    .expect(200);
});
