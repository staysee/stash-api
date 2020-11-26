const knex = require('knex');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const helpers = require('./test-helpers');
const authRouter = require('../src/auth/auth-router');

describe('Auth Endpoints', () => {
  let db;

  const {
    testUsers,
    testRecipes,
    testMeals,
  } = helpers.makeRecipesFixtures();

  const testUser = testUsers[0];

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DATABASE_URL,
    });
    app.set('db', db);
  });

  after('disconnect from db', () => db.destroy());

  before('clean the table', () => db.raw('TRUNCATE recipes, users, meals RESTART IDENTITY CASCADE'));

  afterEach('cleanup', () => db.raw('TRUNCATE recipes, users, meals RESTART IDENTITY CASCADE'));

  describe('POST /api/auth/login', () => {
    beforeEach('insert users', () => db
      .into('users')
      .insert(testUsers));

    const requiredFields = ['username', 'password'];

    requiredFields.forEach((field) => {
      const loginAttemptBody = {
        username: testUser.username,
        password: testUser.password,
      };

      it(`responds with 400 required error when '${field}' is missing`, () => {
        delete loginAttemptBody[field];

        return supertest(app)
          .post('/api/auth/login')
          .send(loginAttemptBody)
          .expect(400, {
            error: `Missing '${field}' in request body`,
          });
      });

      it('responds 401 \'invalid username or password\' when bad username', () => {
        const userInvalidUser = { username: 'user-not', password: 'existy' };
        return supertest(app)
          .post('/api/auth/login')
          .send(userInvalidUser)
          .expect(401, {
            error: 'Incorrect username or password',
          });
      });

      it('responds 401 \'invalid username or password\' when bad password', () => {
        const userInvalidPass = { username: testUser.username, password: 'incorrect' };
        return supertest(app)
          .post('/api/auth/login')
          .send(userInvalidPass)
          .expect(401, { error: 'Incorrect username or password' });
      });

      it('responds 200 and JWT auth token using secret when valid credentials', () => {
        const userValidCreds = {
          username: testUser.username,
          password: 'password1',
        };
        const expectedToken = jwt.sign(
          { user_id: testUser.id }, // payload
          process.env.JWT_SECRET,
          {
            subject: testUser.username,
            algorithm: 'HS256',
          },
        );

        return supertest(app)
          .post('/api/auth/login')
          .send(userValidCreds)
          .expect(200)
          .then((res) => {
            expect(res.body.authToken).to.not.eql(null);
          });
      });
    });
  });
});
