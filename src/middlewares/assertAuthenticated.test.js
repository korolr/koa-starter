/* @flow */
require('dotenv').config();

const mocks = require('../mocks');
const knex = require('../db/connection');
const assertAuthenticated = require('./assertAuthenticated');

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

test('throws 401 when not authenticated', async () => {
  const ctx = {
    state: {},
    throw: jest.fn(),
  };
  const next = jest.fn();
  await assertAuthenticated(ctx, next);
  expect(next).toHaveBeenCalledTimes(0);
  expect(ctx.throw).toHaveBeenCalledWith(401);
  expect(ctx.state).toEqual({});
});

test('calls next() when authenticated', async () => {
  const ctx = {
    headers: {},
    state: {
      currentUser: { id: mocks.user.id },
      currentSessionToken: mocks.session.token,
    },
    throw: jest.fn(),
  };
  const next = jest.fn();
  await assertAuthenticated(ctx, next);
  expect(next).toHaveBeenCalledTimes(1);
  expect(ctx.throw).toHaveBeenCalledTimes(0);
});