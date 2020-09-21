const recipes = [
    {
        "id": 1,
        "title": "Egg Scramble",
        "ingredients": "Eggs, salt, pepper",
        "instructions": "Blah Blah blah Blah",
        "meal_type": "Breakfast",
        "image_url": "https://picsum.photos/100",
        "user_id": 1
    },
    {
        "id": 2,
        "title": "Salad",
        "ingredients": "Eggs, lettuce, tomatoes, dressing",
        "instructions": "Blah Blah blah Blah",
        "meal_type": "Lunch",
        "image_url": "https://picsum.photos/100",
        "user_id": 1
    },
    {
        "id": 3,
        "title": "Steak",
        "ingredients": "Steak, salt, pepper, garlic, butter",
        "instructions": "Blah Blah blah Blah",
        "meal_type": "Dinner",
        "image_url": "https://picsum.photos/100",
        "user_id": 1
    },
    {
        "id": 4,
        "title": "Ice Cream",
        "ingredients": "milk, ice, salt, cream",
        "instructions": "Blah Blah blah Blah",
        "meal_type": "Dinner",
        "image_url": "https://picsum.photos/100",
        "user_id": 1
    },
]

const meals = [
    {
        "id": 1,
        "day": "Monday",
        "recipe_id": 2,
        "user_id": 1
    },
    {
        "id": 2,
        "day": "Monday",
        "recipe_id": 1,
        "user_id": 1
    },
    {
        "id": 3,
        "day": "Monday",
        "recipe_id": 3,
        "user_id": 1
    },
    {
        "id": 4,
        "day": "Tuesday",
        "recipe_id": 4,
        "user_id": 1
    },
],

module.exports = { recipes, meals }