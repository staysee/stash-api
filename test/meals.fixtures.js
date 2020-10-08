function makeMealsArray() {
    return [
        {
            id: 1,
            day: 'Monday',
            recipe_id: 1,
            user_id: 1
        },
        {
            id: 2,
            day: 'Tuesday',
            recipe_id: 2,
            user_id: 1
        },
        {
            id: 3,
            day: 'Tuesday',
            recipe_id: 3,
            user_id: 1
        },
        {
            id: 4,
            day: 'Wednesday',
            recipe_id: 1,
            user_id: 1
        }
    ];
}

function makeMealsObject() {
    return { 
            Monday: [ 
                { id: 1, day: 'Monday', recipe_id: 1, user_id: 1 }
            ],
            Tuesday: [
                { id: 2, day: 'Tuesday', recipe_id: 2, user_id: 1 },
                { id: 3, day: 'Tuesday', recipe_id: 3, user_id: 1 } ],
            Wednesday: [ 
                { id: 4, day: 'Wednesday', recipe_id: 1, user_id: 1 } 
            ] 
        }
}

module.exports = {
    makeMealsArray,
    makeMealsObject
}