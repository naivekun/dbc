module.exports = {
    mysql: {
        host: '127.0.0.1',
        user: 'root',
        password: 'naivekun',
        database: 'dbc',
        port: 3306
    },
    queryAllQuestion: 'SELECT * FROM questions',
    insertUserBaseInfo: 'INSERT INTO results (name,stuNo)VALUES(?,?)',
    queryIfUserExist: 'SELECT * FROM results WHERE name = ? AND stuNo = ?',
    insertUserQuestionResult: 'UPDATE results SET ansJson = ? WHERE name = ? AND stuNo = ?'
}