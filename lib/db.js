module.exports = {
    mysql: {
        host: '127.0.0.1',
        user: 'root',
        password: 'naivekun',
        database: 'expressdb',
        port: 3306
    },
    insertUser: 'INSERT INTO users (username,password,lastip,stuId)VALUES(?,?,?,?)',
    queryUserWithPassword: 'SELECT * FROM users WHERE username = ? AND password = ?',
    queryUsername: 'SELECT * FROM users WHERE username = ?',
    queryFlag: 'SELECT * FROM challenges WHERE flag = ?',
    queryAllChallenge: 'SELECT * FROM challenges',
    queryIdByUser: 'SELECT id FROM users WHERE username = ?',
    queryOKFlagSubmitHistory: 'SELECT id FROM flag_ok_submitter WHERE username = ? AND challengeid = ?',
    insertFlagSubmitHistory: 'INSERT INTO flag_submit_history (username,flagValue,isTrue,date)VALUES(?,?,?,?)',
    insertOKFlagSubmitHistory: 'INSERT INTO flag_ok_submitter (username,challengeid,date)VALUES(?,?,?)',
    addScore: 'UPDATE users SET score = score + ? WHERE username = ?',
    getRank: 'SELECT username,score FROM users ORDER BY score DESC',
    updatePassword: 'UPDATE users SET password = ? WHERE username = ?'
}