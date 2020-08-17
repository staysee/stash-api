function makeRecipesArray() {
    return [
        {
            id: 1,
            title: 'First Test Recipe',
            ingredients: 'Some test ingredients',
            instructions: 'Some test instructions',
            meal_type: 'Breakfast',
            image_url: 'https://via.placeholder.com/100',
            date_created: '2029-01-22T16:28:32.615Z'
        },
        {
            id: 2,
            title: 'Second Test Recipe',
            ingredients: 'Some test ingredients',
            instructions: 'Some test instructions',
            meal_type: 'Lunch',
            image_url: 'https://via.placeholder.com/100',
            date_created: '2029-01-22T16:28:32.615Z'
        },
        {
            id: 3,
            title: 'Third Test Recipe',
            ingredients: 'Some test ingredients',
            instructions: 'Some test instructions',
            meal_type: 'Dinner',
            image_url: 'https://via.placeholder.com/100',
            date_created: '2029-01-22T16:28:32.615Z'
        }
    ];
}

module.exports = {
    makeRecipesArray
}