BEGIN;

TRUNCATE
  recipes,
  meals,
  users
  RESTART IDENTITY CASCADE;

INSERT INTO recipes 
    (title, ingredients, instructions, meal_type, image_url)
VALUES
  ('Steak Salad', 'Steak, Salad Mix, Dressing', 'Toss ingredients together', 'Lunch', 'https://via.placeholder.com/100'),
  ('Bacon Egg Scramble', 'Eggs, Salt, Pepper, Bacon', 'Scramble everything together', 'Breakfast', 'https://via.placeholder.com/100');

INSERT INTO users
  (username, firstname, lastname, password)
VALUES
  ('janedoe', 'Jane', 'Doe', '$2a$12$q3DQscKiujn6z1os6r.mBO2Ijg2pTPMMR20VA6xyLM4mHrfxn591e'),
  ('johndoe', 'John', 'Doe', '$$2a$12$q3DQscKiujn6z1os6r.mBO2Ijg2pTPMMR20VA6xyLM4mHrfxn591e'),
  ('demouser', 'Demo', 'User', '$2a$12$q3DQscKiujn6z1os6r.mBO2Ijg2pTPMMR20VA6xyLM4mHrfxn591e');

INSERT INTO meals
  (day, recipe_id, user_id)
VALUES
  ('Monday', 2, 1),
  ('Monday', 1, 1),
  ('Tuesday', 2, 1),
  ('Tuesday', 1, 1);

COMMIT;