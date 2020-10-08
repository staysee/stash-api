function makeUsersArray() {
    return [
        {
            id: 1,
            username: 'janedoe@test.com',
            firstname: 'Jane',
            lastname: 'Doe',
            password: 'password',
            date_created: new Date('2029-01-22T16:28:32.615Z')
        },
        {
            id: 2,
            username: 'johndoe@test.com',
            firstname: 'John',
            lastname: 'Doe',
            password: 'password',
            date_created: new Date('2100-05-22T16:28:32.615Z')

        }
    ]
}

module.exports = {
    makeUsersArray
}