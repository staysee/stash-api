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
  ('janedoe', 'Jane', 'Doe', 'password'),
  ('johnny', 'John', 'Doe', 'password'),
  ('bettyboop', 'Betty', 'Boop', 'password');

INSERT INTO meals
  (day, recipe_id, user_id)
VALUES
  ('Monday', 2, 1),
  ('Monday', 1, 1),
  ('Tuesday', 2, 1),
  ('Tuesday', 1, 1);

COMMIT;