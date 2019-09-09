module.exports = {
    mysql: {
        host: '127.0.0.1',
        user: 'root',
        password: 'naivekun',
        database: 'dbc',
        port: 3306
    },
    queryAllQuestion: 'SELECT * FROM questions',
    insertUserBaseInfo: 'INSERT INTO results (name,stuNo,ansJson)VALUES(?,?,`{}`)',
    queryIfUserExist: 'SELECT * FROM results WHERE name = ? AND stuNo = ? AND ansJson = NULL',
    insertUserQuestionResult: 'UPDATE results SET ansJson = ? WHERE name = ? AND stuNo = ?',
    queryAllResult: 'SELECT id,name,stuNo FROM results',
    queryUserResultById: 'SELECT ansJson FROM results WHERE id = ?'
}