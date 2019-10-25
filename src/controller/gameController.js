const GameDao = require("../dao/gameDao");
const gameDao = new GameDao();

/**
 * 游戏列表接口
 * @param ctx
 * @param next
 * @returns {Promise<void>}
 */
async function findGameList(ctx, next) {
    // 查询所有记录列表
    let gameList = await gameDao.findAll();
    console.log("查询所有记录完成, ", gameList);

    ctx.response.body = {
        "code": 1,
        "data": gameList,
    };
}

export {findGameList};