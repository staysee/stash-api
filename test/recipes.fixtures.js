function makeRecipesArray() {
    return [
        {
            id: 1,
            title: 'First Test Recipe',
            ingredients: 'Some test ingredients',
            instructions: 'Some test instructions',
            meal_type: 'Breakfast',
            image_url: 'https://via.placeholder.com/100',
            date_created: new Date('2029-01-22T16:28:32.615Z'),
            user_id: 1
        },
        {
            id: 2,
            title: 'Second Test Recipe',
            ingredients: 'Some test ingredients',
            instructions: 'Some test instructions',
            meal_type: 'Lunch',
            image_url: 'https://via.placeholder.com/100',
            date_created: new Date('2029-01-22T16:28:32.615Z'),
            user_id: 2
        },
        {
            id: 3,
            title: 'Third Test Recipe',
            ingredients: 'Some test ingredients',
            instructions: 'Some test instructions',
            meal_type: 'Dinner',
            image_url: 'https://via.placeholder.com/100',
            date_created: new Date('2029-01-22T16:28:32.615Z'),
            user_id: 1
        }
    ];
}

function makeMaliciousRecipe() {
    const maliciousRecipe = {
        id: 911,
        title: 'Bad title <script>alert("xss");</script>',
        ingredients: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
        instructions: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
        meal_type: 'Breakfast',
        image_url: 'https://url.to.file.which/does-not.exist',
        user_id: 2
    }

    const expectedRecipe = {
        ...maliciousRecipe,
        title: `Bad title &lt;script&gt;alert(\"xss\");&lt;/script&gt;`,
        ingredients: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`,
        instructions: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`,
        meal_type: `Breakfast`,
        image_url: `https://url.to.file.which/does-not.exist`,
        user_id: 2
    }

    return {
        maliciousRecipe,
        expectedRecipe
    }
}

module.exports = {
    makeRecipesArray,
    makeMaliciousRecipe
}