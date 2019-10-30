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

/**
 * 分页列表接口
 * @param ctx
 * @param next
 * @returns {Promise<void>}
 */
async function findPage(ctx, next) {
    let pageNo = Number(ctx.query.pageNo)
    let pageSize = Number(ctx.query.pageSize)

    // 分页查询记录列表
    let gameListPage = await gameDao.findPage(pageNo, pageSize, {link: {$ne: ""}}, {status: 1});
    console.log("分页列表接口, ", gameListPage);

    ctx.response.body = {
        "code": 1,
        "data": gameListPage,
    };
}

export {findGameList, findPage};